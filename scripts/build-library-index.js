#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, copyFileSync, statSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import YAML from 'yaml';

const OBSIDIAN_ROOT = process.env.OBSIDIAN_ROOT || '';
const PROJECT_NOTES_DIR = './content/notes';
const OUTPUT_JSON = './public/assets/library.json';

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  let frontmatter = {};
  let body = raw;

  if (match) {
    try {
      frontmatter = YAML.parse(match[1]) || {};
      body = raw.slice(match[0].length);
    } catch (e) {
      // ignore fallback parsing errors
    }
  }

  return { frontmatter, body };
}

function summarizeBody(body) {
  return body
    .replace(/<[^>]+>/g, '')
    .replace(/[\#\>\-\*`\[\]\(\)]/g, '')
    .trim()
    .slice(0, 150)
    .replace(/\s+/g, ' ') + '...';
}

function readExistingBookCatalog() {
  if (!existsSync(PROJECT_NOTES_DIR)) return [];

  return readdirSync(PROJECT_NOTES_DIR)
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const raw = readFileSync(join(PROJECT_NOTES_DIR, file), 'utf-8');
      const { frontmatter, body } = parseFrontmatter(raw);
      const tags = frontmatter.tags || [];
      if (!Array.isArray(tags) || !tags.includes('book')) return null;

      return {
        slug: frontmatter.slug || basename(file, '.md'),
        title: frontmatter.title || basename(file, '.md'),
        author: frontmatter.author || '未知作者',
        date: frontmatter.date || '',
        summary: frontmatter.summary || summarizeBody(body),
        tags,
        annotationCount: frontmatter.annotationCount || 0,
        pdfAsset: frontmatter.pdfAsset || ''
      };
    })
    .filter(Boolean);
}

function writeFallbackLibrary(reason) {
  const existingBooks = readExistingBookCatalog();
  if (existingBooks.length > 0) {
    console.warn(`[build-library-index] ${reason}. Reusing ${existingBooks.length} existing book note(s) from content/notes/.`);
    writeFileSync(OUTPUT_JSON, JSON.stringify({ books: existingBooks, warning: reason }, null, 2) + '\n');
    return;
  }

  console.warn(`[build-library-index] ${reason}. No existing book notes found; writing an empty catalog.`);
  writeFileSync(OUTPUT_JSON, JSON.stringify({ books: [], error: reason }, null, 2) + '\n');
}

// 行状态机解析器 (Line state-machine)
function parseAnnotatorFile(rawBody) {
  const lines = rawBody.split(/\r?\n/);
  const annotations = [];
  const cleanBodyLines = [];

  let state = 'NORMAL'; // 'NORMAL', 'IN_JSON', 'IN_COMMENT_LOOKUP', 'IN_COMMENT'
  let currentJsonLines = [];
  let currentCommentLines = [];
  let currentQuote = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (state === 'NORMAL') {
      if (trimmed.startsWith('>```annotation-json') || trimmed.startsWith('```annotation-json')) {
        state = 'IN_JSON';
        currentJsonLines = [];
      } else if (trimmed.startsWith('>%%') || trimmed.startsWith('%%')) {
        // 忽略 %% 块分割线
      } else if (trimmed.startsWith('>%%LINK%%') || trimmed.startsWith('>%%TAGS%%')) {
        // 忽略链接与标签行
      } else if (trimmed.startsWith('^') && /^\^[a-zA-Z0-9]+$/.test(trimmed)) {
        // 忽略 Obsidian block IDs
      } else {
        cleanBodyLines.push(line);
      }
    } else if (state === 'IN_JSON') {
      if (trimmed.startsWith('>```') || trimmed.startsWith('```')) {
        state = 'IN_COMMENT_LOOKUP';
        try {
          const jsonStr = currentJsonLines.join('\n').replace(/^>/gm, '').trim();
          const data = JSON.parse(jsonStr);
          const selector = data.target?.[0]?.selector || [];
          const quoteSel = selector.find(s => s.type === 'TextQuoteSelector');
          currentQuote = quoteSel ? quoteSel.exact : (data.text || '');
        } catch (e) {
          currentQuote = '';
        }
      } else {
        currentJsonLines.push(line);
      }
    } else if (state === 'IN_COMMENT_LOOKUP') {
      if (trimmed.startsWith('>%%COMMENT%%') || trimmed.startsWith('%%COMMENT%%')) {
        state = 'IN_COMMENT';
        currentCommentLines = [];
      } else if (trimmed.startsWith('>```annotation-json') || trimmed.startsWith('```annotation-json')) {
        // 连续遇到 JSON，结束上一个
        if (currentQuote) {
          annotations.push({ quote: currentQuote, comment: '' });
        }
        state = 'IN_JSON';
        currentJsonLines = [];
        currentQuote = '';
      } else if (trimmed.startsWith('>%%') || trimmed.startsWith('%%') || trimmed === '') {
        // 忽略间隔空行
      }
    } else if (state === 'IN_COMMENT') {
      if (trimmed.startsWith('>%%TAGS%%') || trimmed.startsWith('%%TAGS%%') || trimmed.startsWith('>%%') || trimmed.startsWith('%%')) {
        state = 'NORMAL';
        const comment = currentCommentLines.join('\n').replace(/^>/gm, '').trim();
        if (currentQuote || comment) {
          annotations.push({ quote: currentQuote, comment });
        }
        currentQuote = '';
      } else {
        currentCommentLines.push(line);
      }
    }
  }

  // 兜底遗漏
  if (state === 'IN_COMMENT' && (currentQuote || currentCommentLines.length > 0)) {
    const comment = currentCommentLines.join('\n').replace(/^>/gm, '').trim();
    annotations.push({ quote: currentQuote, comment });
  } else if (state === 'IN_COMMENT_LOOKUP' && currentQuote) {
    annotations.push({ quote: currentQuote, comment: '' });
  }

  return {
    cleanBody: cleanBodyLines.join('\n').trim(),
    annotations
  };
}

// 递归搜寻特定文件名
function findFileRecursive(baseDir, filename) {
  if (!existsSync(baseDir)) return null;
  try {
    const items = readdirSync(baseDir);
    for (const item of items) {
      const fullPath = join(baseDir, item);
      const stat = statSync(fullPath);
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

// 同步物理 PDF 文件
function syncPDFFile(obsidianRoot, pdfRawTarget, slug) {
  if (!obsidianRoot || !pdfRawTarget) return null;
  
  const cleanTarget = pdfRawTarget.replace(/^annotation-target：:\s*/, '').replace(/^annotation-target:\s*/, '');
  const match = cleanTarget.match(/!\[\[(.*?)\]\]/);
  if (!match) return null;
  
  const pdfName = match[1];
  if (!pdfName.endsWith('.pdf')) return null;

  const searchDirs = [
    join(obsidianRoot, '02-Resources/004_阅读/阅读书籍（电子书）'),
    join(obsidianRoot, '02-Resources/004_阅读/书籍标注'),
    obsidianRoot
  ];

  for (const dir of searchDirs) {
    const foundPath = findFileRecursive(dir, pdfName);
    if (foundPath) {
      const destDir = './public/assets/pdfs';
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }
      const destFilename = `book-${slug}.pdf`;
      const destPath = join(destDir, destFilename);
      try {
        copyFileSync(foundPath, destPath);
        console.log(`[build-library-index] Synced PDF: ${pdfName} -> ${destPath}`);
        return `/assets/pdfs/${destFilename}`;
      } catch (e) {
        console.warn(`[build-library-index] Failed to copy PDF [${pdfName}]: ${e.message}`);
      }
    }
  }
  
  console.warn(`[build-library-index] PDF file not found recursively in vault: ${pdfName}`);
  return null;
}

function main() {
  console.log('[build-library-index] Starting Obsidian library sync...');

  if (!OBSIDIAN_ROOT) {
    writeFallbackLibrary('OBSIDIAN_ROOT is not mounted');
    return;
  }

  const readingDir = join(OBSIDIAN_ROOT, '02-Resources/004_阅读/书籍标注');
  if (!existsSync(readingDir)) {
    writeFallbackLibrary(`Path does not exist: ${readingDir}`);
    return;
  }

  if (!existsSync(PROJECT_NOTES_DIR)) {
    mkdirSync(PROJECT_NOTES_DIR, { recursive: true });
  }

  const bookFiles = readdirSync(readingDir).filter(f => f.endsWith('.md'));
  console.log(`[build-library-index] Found ${bookFiles.length} book notes in Obsidian resources.`);

  const libraryCatalog = [];

  for (const file of bookFiles) {
    const srcPath = join(readingDir, file);
    const raw = readFileSync(srcPath, 'utf-8');

    const { frontmatter, body } = parseFrontmatter(raw);

    const title = frontmatter.title || basename(file, '.md');
    const slug = `book-${slugify(basename(file, '.md'))}`;
    const author = frontmatter.author || '未知作者';
    const date = frontmatter.date || new Date().toISOString().slice(0, 10);
    const tags = Array.from(new Set([...(frontmatter.tags || []), 'book', 'reading']));
    const status = 'published';

    // 1. 使用状态机清洗 JSON 代码，并提取标注
    const { cleanBody, annotations } = parseAnnotatorFile(body);

    // 2. 检查并同步物理 PDF 文件
    const rawTarget = frontmatter['annotation-target'] || frontmatter['annotation-target：'] || '';
    const pdfAssetPath = syncPDFFile(OBSIDIAN_ROOT, rawTarget, slug);

    // 3. 将标注重新格式化为优美的 Maggie Style 引用卡，追加到正文底部
    let finalBody = cleanBody;
    if (annotations.length > 0) {
      const cardsMarkdown = annotations.map((ann, index) => {
        const commentPart = ann.comment 
          ? `\n\n✍️ **批注**：${ann.comment}`
          : '';
        const base64Quote = Buffer.from(ann.quote, 'utf-8').toString('base64');
        return `<div class="annotation-card border-l-4 border-rose-400 pl-4 py-3 my-5 bg-stone-50/50 rounded font-serif shadow-sm cursor-pointer hover:bg-rose-50/30 transition-all duration-205" data-quote-base64="${base64Quote}">
  <p class="text-slate-800 italic leading-relaxed">“ ${ann.quote} ”</p>${commentPart}
</div>`;
      }).join('\n\n');
      
      finalBody += `\n\n### 📌 读书摘录与批注\n\n${cardsMarkdown}`;
    }

    // 4. 提取清洗后首段前 150 字作为 summary (避免 JSON 字符串外泄)
    const summary = summarizeBody(cleanBody);

    // 5. 组合新 Frontmatter，支持 schema
    const fmStrings = [
      `title: "${title.replace(/"/g, '\\"')}"`,
      `slug: "${slug}"`,
      `date: "${date}"`,
      `tags: [${tags.map(t => `"${t}"`).join(', ')}]`,
      `status: "${status}"`,
      `author: "${author.replace(/"/g, '\\"')}"`
    ];

    if (rawTarget) {
      fmStrings.push(`annotationTarget: "${rawTarget.replace(/"/g, '\\"')}"`);
    }
    if (pdfAssetPath) {
      fmStrings.push(`pdfAsset: "${pdfAssetPath}"`);
    }
    fmStrings.push(`annotationCount: ${annotations.length}`);

    // 同步写入新 md
    const noteContent = `---\n${fmStrings.join('\n')}\n---\n${finalBody}`;
    const destPath = join(PROJECT_NOTES_DIR, `${slug}.md`);
    writeFileSync(destPath, noteContent, 'utf-8');

    // 记录到 JSON catalog
    libraryCatalog.push({
      slug,
      title,
      author,
      date,
      summary,
      tags,
      annotationCount: annotations.length,
      pdfAsset: pdfAssetPath || ''
    });
  }

  writeFileSync(OUTPUT_JSON, JSON.stringify({ books: libraryCatalog }, null, 2) + '\n');
  console.log(`[build-library-index] Successfully synced ${libraryCatalog.length} book notes to content/notes/ and registered catalog.`);
}

main();
