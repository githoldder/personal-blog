import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const OBSIDIAN_ROOT = '/Users/caolei/Desktop/Obsidian_root';
const OUTPUT_DIR = path.join(import.meta.dirname, '../content/notes');

// Helper to calculate MD5 for unique safe filename
function getMd5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

// Format Date helper
function formatDate(date) {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

// Clean previous auto-generated obsidian indices
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

// Read Markdown file title: extract first '# Title' or fallback to filename
function extractTitle(filePath, fallbackName) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const firstLine = content.split('\n')[0].trim();
    if (firstLine.startsWith('# ')) {
      return firstLine.substring(2).trim().replace(/\\/g, '').replace(/"/g, '\\"');
    }
  } catch (e) {
    // Ignore
  }
  return fallbackName.replace(/\\/g, '').replace(/"/g, '\\"');
}

// Recursively traverse folder
function traverseDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    // Exclude hidden folders, node_modules, media-lib and system files
    if (file.startsWith('.') || file === 'node_modules' || file === 'media-lib') {
      continue;
    }
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      traverseDir(fullPath, fileList);
    } else if (stat.isFile() && file.endsWith('.md')) {
      // Exclude root READMEs
      const relative = path.relative(OBSIDIAN_ROOT, fullPath);
      if (relative === 'README.md' || relative === 'README.en.md') {
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
  return fileList;
}

function main() {
  console.log('[build-notes-index] Scanning Obsidian folder...');
  if (!fs.existsSync(OBSIDIAN_ROOT)) {
    console.log(`[build-notes-index] Warning: Obsidian root not found at ${OBSIDIAN_ROOT}. Skipping index build.`);
    return;
  }

  cleanPreviousIndices();

  const allNotes = traverseDir(OBSIDIAN_ROOT);
  console.log(`[build-notes-index] Found ${allNotes.length} markdown notes.`);

  let indexedCount = 0;
  for (const note of allNotes) {
    const fileId = getMd5(note.relative);
    const title = extractTitle(note.fullPath, note.name);
    const dateStr = formatDate(note.stat.mtime);
    
    // Extract first tier folder as tag (e.g. 00-Projects -> Projects)
    const parts = note.relative.split(path.sep);
    let topFolder = parts[0];
    if (topFolder.match(/^\d+-(.+)$/)) {
      topFolder = topFolder.match(/^\d+-(.+)$/)[1];
    }
    const tags = JSON.stringify(['Obsidian', topFolder]);
    const encodedRelative = encodeURIComponent(note.relative);

    const indexContent = `---
title: "${title}"
date: ${dateStr}
tags: ${tags}
status: "published"
slug: "obsidian-${fileId}"
---

# ${title}

> [!NOTE]
> 本文档是本地 Obsidian 知识库的软索引。

- **源文件路径**：\`${note.relative}\`
- **修改时间**：${dateStr}

<div class="obsidian-trigger" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-neutral-light);">
  <p style="margin-top: 0;">您可以直接在本地 Obsidian 中打开本篇笔记：</p>
  <a href="obsidian://open?vault=Obsidian_root&file=${encodedRelative}" 
     style="display: inline-block; padding: 0.6rem 1.2rem; background: #4f46e5; color: white; border-radius: 6px; text-decoration: none; font-weight: 500; transition: background 0.2s;">
    在 Obsidian 中打开 ↗
  </a>
</div>
`;

    const outPath = path.join(OUTPUT_DIR, `obsidian-${fileId}.md`);
    fs.writeFileSync(outPath, indexContent, 'utf-8');
    indexedCount++;
  }

  console.log(`[build-notes-index] Successfully indexed ${indexedCount} notes to content/notes/.`);
}

main();
