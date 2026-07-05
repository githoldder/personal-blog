#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, unlinkSync } from 'node:fs';
import { join, basename, dirname, relative } from 'node:path';
import LZString from 'lz-string';

const OBSIDIAN_ROOT = process.env.OBSIDIAN_ROOT || '/Users/caolei/Desktop/Obsidian_root';
const OUTPUT_CANVAS = './public/assets/canvas_previews.json';
const OUTPUT_EXCALIDRAW = './public/assets/excalidraw_previews.json';
const NOTES_CONTENT_DIR = './content/notes';

function ensureDirExists(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

// 递归深度扫描工具函数
function scanDir(dir, extensions, fileList = []) {
  if (!existsSync(dir)) return fileList;
  let files = [];
  try {
    files = readdirSync(dir);
  } catch (e) {
    return fileList;
  }
  
  for (const file of files) {
    if (file.startsWith('.')) continue; // 排除隐藏文件/配置文件夹
    const path = join(dir, file);
    let stat;
    try {
      stat = statSync(path);
    } catch (e) {
      continue;
    }
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        scanDir(path, extensions, fileList);
      }
    } else {
      if (extensions.some(ext => file.endsWith(ext))) {
        fileList.push(path);
      }
    }
  }
  return fileList;
}

function cleanShadowFiles() {
  if (!existsSync(NOTES_CONTENT_DIR)) return;
  const files = readdirSync(NOTES_CONTENT_DIR);
  for (const file of files) {
    if (file.startsWith('excalidraw-') || file.startsWith('canvas-')) {
      try {
        unlinkSync(join(NOTES_CONTENT_DIR, file));
      } catch (e) {
        // ignore
      }
    }
  }
}

function main() {
  console.log(`[build-previews] Starting Canvas & Excalidraw high-fidelity parser. Obsidian Vault Root: ${OBSIDIAN_ROOT}`);

  if (!existsSync(OBSIDIAN_ROOT)) {
    console.error(`[build-previews] ERROR: Obsidian Root folder not found at: ${OBSIDIAN_ROOT}`);
    ensureDirExists(OUTPUT_CANVAS);
    writeFileSync(OUTPUT_CANVAS, JSON.stringify({ files: [], error: 'Obsidian Root folder not found' }, null, 2) + '\n');
    writeFileSync(OUTPUT_EXCALIDRAW, JSON.stringify({ files: [], error: 'Obsidian Root folder not found' }, null, 2) + '\n');
    return;
  }

  // 0. 清理旧的同步影子文件
  cleanShadowFiles();
  mkdirSync(NOTES_CONTENT_DIR, { recursive: true });

  // 1. 全库递归扫描所有 .canvas 看板
  const allCanvasPaths = scanDir(OBSIDIAN_ROOT, ['.canvas']);
  console.log(`[build-previews] Found ${allCanvasPaths.length} canvas files recursively.`);
  const canvasFilesData = [];

  for (const filePath of allCanvasPaths) {
    const fileName = basename(filePath);
    const relativePath = relative(OBSIDIAN_ROOT, filePath);
    const cleanName = fileName.replace('.canvas', '').replace(/[\/\\&?:*]/g, '_');
    
    const fileStat = statSync(filePath);
    const fallbackDate = fileStat.mtime.toISOString().slice(0, 10);

    try {
      const raw = readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      canvasFilesData.push({
        name: cleanName,
        file: fileName,
        path: relativePath,
        nodes: parsed.nodes || [],
        edges: parsed.edges || []
      });

      // 生成影子 Markdown 文件以注册 Astro 静态路由
      const shadowPath = join(NOTES_CONTENT_DIR, `canvas-${cleanName}.md`);
      const shadowContent = `---
title: "${cleanName}"
date: ${fallbackDate}
tags: ["canvas", "个人看板"]
status: "published"
author: "githoldder"
---

（该页面由个人知识脑图系统自动映射。请在上方高保真画布中进行交互探索。）
`;
      writeFileSync(shadowPath, shadowContent, 'utf-8');

    } catch (e) {
      console.warn(`[build-previews] Failed to parse canvas: ${relativePath}. Error: ${e.message}`);
      canvasFilesData.push({
        name: cleanName,
        file: fileName,
        path: relativePath,
        error: e.message,
        nodes: [],
        edges: []
      });
    }
  }

  ensureDirExists(OUTPUT_CANVAS);
  writeFileSync(OUTPUT_CANVAS, JSON.stringify({ files: canvasFilesData }, null, 2) + '\n');
  console.log(`[build-previews] High-fidelity Canvas cache written to ${OUTPUT_CANVAS}. Total: ${canvasFilesData.length}`);

  // 2. 全库递归扫描所有 .excalidraw.md 手绘草图
  const allExcalidrawPaths = scanDir(OBSIDIAN_ROOT, ['.excalidraw.md']);
  console.log(`[build-previews] Found ${allExcalidrawPaths.length} excalidraw files recursively.`);
  const excalidrawFilesData = [];

  for (const filePath of allExcalidrawPaths) {
    const fileName = basename(filePath);
    const relativePath = relative(OBSIDIAN_ROOT, filePath);
    const cleanName = fileName.replace('.excalidraw.md', '').replace(/[\/\\&?:*]/g, '_');
    
    const fileStat = statSync(filePath);
    const fallbackDate = fileStat.mtime.toISOString().slice(0, 10);

    try {
      const raw = readFileSync(filePath, 'utf-8');
      
      const compressedMatch = raw.match(/```compressed-json\n([\s\S]*?)\n```/);
      const jsonMatch = raw.match(/```json\n([\s\S]*?)\n```/);

      let elements = [];
      let appState = {};

      if (compressedMatch) {
        const base64 = compressedMatch[1].replace(/\s+/g, '');
        const decompressed = LZString.decompressFromBase64(base64);
        if (!decompressed) {
          throw new Error('lz-string decompress returned null');
        }
        const data = JSON.parse(decompressed);
        elements = data.elements || [];
        appState = data.appState || {};
      } else if (jsonMatch) {
        const data = JSON.parse(jsonMatch[1].trim());
        elements = data.elements || [];
        appState = data.appState || {};
      } else {
        throw new Error('No compressed-json or json block found');
      }

      // 保留完整的 elements 属性和 appState (手绘感、rough风格、连接、线宽、层次等全量保真)
      excalidrawFilesData.push({
        name: cleanName,
        file: fileName,
        path: relativePath,
        elements: elements,
        appState: appState
      });

      // 为 Excalidraw 生成影子并处理 yaml 头部 (防御性高保真拼装)
      const shadowPath = join(NOTES_CONTENT_DIR, `excalidraw-${cleanName}.md`);
      
      let title = cleanName;
      let date = fallbackDate;
      let tags = ["excalidraw"];
      let originalBody = raw;

      const yamlMatch = raw.match(/^---([\s\S]*?)---/);
      if (yamlMatch) {
        originalBody = raw.substring(yamlMatch[0].length);
        const yamlContent = yamlMatch[1];

        // 提取原 title
        const titleM = yamlContent.match(/title:\s*["']?(.*?)["']?\s*$/m);
        if (titleM) title = titleM[1];

        // 提取并校验原 date
        const dateM = yamlContent.match(/date:\s*["']?(.*?)["']?\s*$/m);
        if (dateM) {
          const parsedDate = dateM[1].trim();
          if (!isNaN(Date.parse(parsedDate))) {
            date = parsedDate;
          }
        }

        // 提取原 tags
        const tagsM = yamlContent.match(/tags:\s*\[(.*?)\]/);
        if (tagsM) {
          const list = tagsM[1].split(',').map(t => t.trim().replace(/['"]/g, '')).filter(Boolean);
          tags = [...new Set([...list, "excalidraw"])];
        } else {
          const multiLineTags = [];
          const tagsLines = yamlContent.split('\n');
          let inTags = false;
          for (const line of tagsLines) {
            if (line.trim().startsWith('tags:')) {
              inTags = true;
              continue;
            }
            if (inTags) {
              if (line.trim() && !line.startsWith(' ') && !line.startsWith('-')) {
                inTags = false;
                continue;
              }
              const tagMatch = line.match(/^\s*-\s*["']?(.*?)["']?\s*$/);
              if (tagMatch) {
                multiLineTags.push(tagMatch[1]);
              }
            }
          }
          if (multiLineTags.length > 0) {
            tags = [...new Set([...multiLineTags, "excalidraw"])];
          }
        }
      }

      // 组装格式严密规范的 Markdown 头部
      const processedRaw = [
        '---',
        `title: ${JSON.stringify(title)}`,
        `date: ${date}`,
        `tags: ${JSON.stringify(tags)}`,
        `status: "published"`,
        `author: "githoldder"`,
        '---',
        originalBody.trim()
      ].join('\n') + '\n';

      writeFileSync(shadowPath, processedRaw, 'utf-8');

    } catch (e) {
      console.warn(`[build-previews] Failed to decompress excalidraw: ${relativePath}. Error: ${e.message}`);
      excalidrawFilesData.push({
        name: cleanName,
        file: fileName,
        path: relativePath,
        error: e.message,
        elements: [],
        appState: {}
      });
    }
  }

  ensureDirExists(OUTPUT_EXCALIDRAW);
  writeFileSync(OUTPUT_EXCALIDRAW, JSON.stringify({ files: excalidrawFilesData }, null, 2) + '\n');
  console.log(`[build-previews] High-fidelity Excalidraw cache written to ${OUTPUT_EXCALIDRAW}. Total: ${excalidrawFilesData.length}`);
}

main();
