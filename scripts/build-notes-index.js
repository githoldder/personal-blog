#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import YAML from 'yaml';

const OBSIDIAN_ROOT = process.env.OBSIDIAN_ROOT || '';
const OUTPUT_DIR = './content/notes';

// 排除黑名单文件夹，保证数据隐私和规范性 (Denylist)
const DENYLIST_FOLDERS = [
  'templates',
  '00_templates',
  'diary',
  'daily',
  'weekly',
  'attachments/media',
  'excalidraw',
  '论文文献',
  '.obsidian',
  '.git'
];

function isPathDenied(relativePath) {
  const normalized = relativePath.toLowerCase().replace(/\\/g, '/');
  return DENYLIST_FOLDERS.some(denied => {
    const parts = normalized.split('/');
    return parts.some(part => part === denied || part.includes(denied));
  });
}

// MD5 辅助函数，确保文件名安全且唯一
function getMd5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

// 格式化日期格式
function formatDate(date) {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

// 清除之前自动生成的索引
function cleanPreviousIndices() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    return;
  }
  const files = fs.readdirSync(OUTPUT_DIR);
  for (const file of files) {
    if (file.startsWith('obsidian-') && file.endsWith('.md')) {
      fs.unlinkSync(path.join(OUTPUT_DIR, file));
    }
  }
}

// 获取 Markdown 标题
function extractTitle(filePath, fallbackName) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const firstLine = content.split('\n')[0].trim();
    if (firstLine.startsWith('# ')) {
      return firstLine.substring(2).trim().replace(/\\/g, '').replace(/"/g, '\\"');
    }
  } catch (e) {
    // ignore
  }
  return fallbackName.replace(/\\/g, '').replace(/"/g, '\\"');
}

// 递归文件查找 (用于查找 Wiki 附件图片)
function findFileRecursive(baseDir, filename) {
  if (!fs.existsSync(baseDir)) return null;
  try {
    const items = fs.readdirSync(baseDir);
    for (const item of items) {
      const fullPath = path.join(baseDir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const found = findFileRecursive(fullPath, filename);
        if (found) return found;
      } else if (item === filename) {
        return fullPath;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

// 同步 Wiki-link 中的附件文件到项目中
function syncWikiAttachment(obsidianRoot, attachmentName) {
  if (!obsidianRoot || !attachmentName) return null;

  const searchDirs = [
    path.join(obsidianRoot, 'Attachments'),
    path.join(obsidianRoot, 'Attachments/media'),
    obsidianRoot
  ];

  for (const dir of searchDirs) {
    const foundPath = findFileRecursive(dir, attachmentName);
    if (foundPath) {
      const destDir = './public/assets/attachments';
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      const destPath = path.join(destDir, attachmentName);
      try {
        fs.copyFileSync(foundPath, destPath);
        return `/assets/attachments/${attachmentName}`;
      } catch (e) {
        console.warn(`[build-notes-index] Failed to sync attachment [${attachmentName}]: ${e.message}`);
      }
    }
  }
  return null;
}

// 递归遍历文件
function traverseDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (file.startsWith('.') || file === 'node_modules' || file === 'media-lib') {
        continue;
      }
      
      const relative = path.relative(OBSIDIAN_ROOT, fullPath);
      if (isPathDenied(relative)) {
        continue;
      }

      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        traverseDir(fullPath, fileList);
      } else if (stat.isFile() && file.endsWith('.md')) {
        if (file.toLowerCase() === 'readme.md' || file.toLowerCase() === 'readme.en.md') {
          continue;
        }
        fileList.push({
          fullPath,
          relative,
          name: file.slice(0, -3),
          stat
        });
      }
    }
  } catch (e) {
    console.warn(`[build-notes-index] Error traversing directory ${dir}: ${e.message}`);
  }
  return fileList;
}

// 辅助清洗 Heading 为 Astro 锚点格式
function slugifyHeading(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function main() {
  console.log('[build-notes-index] Scanning Obsidian folder...');
  if (!OBSIDIAN_ROOT) {
    console.warn('[build-notes-index] OBSIDIAN_ROOT env var is not defined. Skipping notes index synchronization.');
    return;
  }

  if (!fs.existsSync(OBSIDIAN_ROOT)) {
    console.warn(`[build-notes-index] WARNING: Obsidian root not found at ${OBSIDIAN_ROOT}. Skipping.`);
    return;
  }

  cleanPreviousIndices();

  const allNotes = traverseDir(OBSIDIAN_ROOT);
  console.log(`[build-notes-index] Found ${allNotes.length} markdown notes (after denylist filter).`);

  // 1. 预先构建 Multi-Key Slug 映射词典，用于双链打通
  const wikiResolverMap = new Map();
  const duplicateKeys = new Set();
  
  for (const note of allNotes) {
    const slug = `obsidian-${getMd5(note.relative)}`;
    const title = extractTitle(note.fullPath, note.name);
    
    const keysToRegister = [
      note.name, // 物理名
      title, // MD 首行 # 标题
      note.relative.slice(0, -3), // 相对路径 (无后缀)
      note.relative // 相对路径 (带后缀)
    ];

    for (const key of keysToRegister) {
      if (!key) continue;
      const normalizedKey = key.trim().toLowerCase();
      if (wikiResolverMap.has(normalizedKey) && wikiResolverMap.get(normalizedKey) !== slug) {
        duplicateKeys.add(normalizedKey);
      } else {
        wikiResolverMap.set(normalizedKey, slug);
      }
    }
  }

  if (duplicateKeys.size > 0) {
    console.warn(`[build-notes-index] Detected duplicate wiki keys (resolving via path-priority):`, Array.from(duplicateKeys).slice(0, 10), '...');
  }

  // Wiki 链接解析器，支持别名、Heading 章节锚点与 Block 块 ID
  function resolveWikiLink(rawLink) {
    const parts = rawLink.split('|');
    const linkPart = parts[0].trim();
    const alias = parts[1] ? parts[1].trim() : linkPart;

    let mainLink = linkPart;
    let hashPart = '';
    
    if (linkPart.includes('#')) {
      const hashIdx = linkPart.indexOf('#');
      mainLink = linkPart.slice(0, hashIdx).trim();
      hashPart = '#' + slugifyHeading(linkPart.slice(hashIdx + 1));
    } else if (linkPart.includes('^')) {
      const blockIdx = linkPart.indexOf('^');
      mainLink = linkPart.slice(0, blockIdx).trim();
      hashPart = '#' + linkPart.slice(blockIdx + 1).trim();
    }

    const normalizedMain = mainLink.toLowerCase();
    if (wikiResolverMap.has(normalizedMain)) {
      const targetSlug = wikiResolverMap.get(normalizedMain);
      return `[${alias}](/notes/${targetSlug}/${hashPart})`;
    }

    // 无法匹配时优雅降级为文字
    return alias;
  }

  let indexedCount = 0;
  for (const note of allNotes) {
    const fileId = getMd5(note.relative);
    const title = extractTitle(note.fullPath, note.name);
    const dateStr = formatDate(note.stat.mtime);
    
    let originalContent = '';
    try {
      originalContent = fs.readFileSync(note.fullPath, 'utf-8');
    } catch (e) {
      continue;
    }

    // 剥离 Frontmatter 避免冲突
    const fmMatch = originalContent.match(/^---\n([\s\S]*?)\n---\n?/);
    let originalFrontmatter = {};
    let cleanOriginalBody = originalContent;
    
    if (fmMatch) {
      try {
        originalFrontmatter = YAML.parse(fmMatch[1]) || {};
        cleanOriginalBody = originalContent.slice(fmMatch[0].length);
      } catch (e) {
        // ignore
      }
    }

    if (originalFrontmatter.status === 'draft' || originalFrontmatter.private === true) {
      continue;
    }

    // 2.1 双向 Wiki-link 图片附件同步与重写
    const wikiImageRegex = /!\[\[([^\]]+?\.(?:png|jpg|jpeg|gif|webp|svg))\]\]/g;
    cleanOriginalBody = cleanOriginalBody.replace(wikiImageRegex, (match, attachmentName) => {
      const cleanName = attachmentName.split('|')[0].trim();
      const assetPath = syncWikiAttachment(OBSIDIAN_ROOT, cleanName);
      if (assetPath) {
        return `![${cleanName}](${assetPath})`;
      }
      return `*[[图片丢失: ${cleanName}]]*`;
    });

    // 2.2 常规 Markdown 相对图片同步与绝对路径化重写 (防止 Astro Vite 打包相对路径找不到图片而报错)
    const mdImageRegex = /!\[(.*?)\]\((.*?\.(?:png|jpg|jpeg|gif|webp|svg))\)/g;
    cleanOriginalBody = cleanOriginalBody.replace(mdImageRegex, (match, alt, imgPath) => {
      if (imgPath.startsWith('http') || imgPath.startsWith('/') || imgPath.startsWith('data:')) {
        return match;
      }
      const attachmentName = path.basename(imgPath);
      const assetPath = syncWikiAttachment(OBSIDIAN_ROOT, attachmentName);
      if (assetPath) {
        return `![${alt || attachmentName}](${assetPath})`;
      }
      return `*[[图片丢失: ${attachmentName}]]*`;
    });

    // 2.3 双向 Wiki-link 笔记热链打通
    const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
    cleanOriginalBody = cleanOriginalBody.replace(wikiLinkRegex, (match, rawLink) => {
      return resolveWikiLink(rawLink);
    });

    // 3. 整理并融合 tags (提取物理二级目录作为 folderTag)
    const parts = note.relative.split(path.sep);
    let folderTag = 'Inbox';
    if (parts.length > 1) {
      folderTag = parts[1];
    } else {
      folderTag = parts[0].replace(/^\d+[-_]/, '');
    }
    
    const originalTags = Array.isArray(originalFrontmatter.tags) 
      ? originalFrontmatter.tags 
      : (typeof originalFrontmatter.tags === 'string' ? [originalFrontmatter.tags] : []);
      
    const mergedTags = Array.from(new Set([
      'Obsidian', 
      folderTag, 
      ...originalTags
    ]));

    // 4. 组合全新的 Frontmatter 保证单行无格式冲突
    const fmStrings = [
      `title: "${title}"`,
      `date: ${dateStr}`,
      `tags: [${mergedTags.map(t => `"${t}"`).join(', ')}]`,
      `status: "published"`,
      `slug: "obsidian-${fileId}"`
    ];

    if (originalFrontmatter.author) {
      fmStrings.push(`author: "${originalFrontmatter.author.replace(/"/g, '\\"')}"`);
    }

    // 5. 组装新内容
const indexContent = `---
${fmStrings.join('\n')}
---

${cleanOriginalBody}
`;

    const outPath = path.join(OUTPUT_DIR, `obsidian-${fileId}.md`);
    fs.writeFileSync(outPath, indexContent, 'utf-8');
    indexedCount++;
  }

  console.log(`[build-notes-index] Successfully synchronized ${indexedCount} notes with full Wiki-link resolving.`);
}

main();
