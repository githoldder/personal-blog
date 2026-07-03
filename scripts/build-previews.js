#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import LZString from 'lz-string';

const OBSIDIAN_ROOT = process.env.OBSIDIAN_ROOT || '';
const OUTPUT_CANVAS = './public/assets/canvas_previews.json';
const OUTPUT_EXCALIDRAW = './public/assets/excalidraw_previews.json';

function ensureDirExists(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function writeFallback(errorMsg) {
  ensureDirExists(OUTPUT_CANVAS);
  ensureDirExists(OUTPUT_EXCALIDRAW);
  writeFileSync(OUTPUT_CANVAS, JSON.stringify({ files: [], error: errorMsg }, null, 2) + '\n');
  writeFileSync(OUTPUT_EXCALIDRAW, JSON.stringify({ files: [], error: errorMsg }, null, 2) + '\n');
}

function main() {
  console.log('[build-previews] Starting Canvas & Excalidraw preview database generation...');

  if (!OBSIDIAN_ROOT) {
    console.warn('[build-previews] WARNING: OBSIDIAN_ROOT env var is not defined. Skipping vault parsing.');
    writeFallback('OBSIDIAN_ROOT environment variable is not defined.');
    return;
  }

  if (!existsSync(OBSIDIAN_ROOT)) {
    console.warn(`[build-previews] WARNING: OBSIDIAN_ROOT path does not exist: ${OBSIDIAN_ROOT}. Skipping.`);
    writeFallback(`OBSIDIAN_ROOT path does not exist: ${OBSIDIAN_ROOT}`);
    return;
  }

  // 1. 解析 .canvas 文件
  const canvasDir = join(OBSIDIAN_ROOT, '00-Projects/000_个人看板');
  const canvasFilesData = [];

  if (existsSync(canvasDir)) {
    try {
      const files = readdirSync(canvasDir).filter(f => f.endsWith('.canvas'));
      for (const file of files) {
        const filePath = join(canvasDir, file);
        try {
          const raw = readFileSync(filePath, 'utf-8');
          const parsed = JSON.parse(raw);
          canvasFilesData.push({
            name: file,
            nodes: parsed.nodes || [],
            edges: parsed.edges || []
          });
        } catch (e) {
          canvasFilesData.push({
            name: file,
            error: `Failed to parse canvas JSON: ${e.message}`,
            nodes: [],
            edges: []
          });
        }
      }
    } catch (e) {
      console.warn(`[build-previews] Failed to read canvas directory: ${e.message}`);
    }
  } else {
    console.warn(`[build-previews] Canvas folder not found at: ${canvasDir}`);
  }

  ensureDirExists(OUTPUT_CANVAS);
  writeFileSync(OUTPUT_CANVAS, JSON.stringify({ files: canvasFilesData }, null, 2) + '\n');
  console.log(`[build-previews] Canvas database written to ${OUTPUT_CANVAS}. Items: ${canvasFilesData.length}`);

  // 2. 解析 .excalidraw.md 文件
  const excalidrawDir = join(OBSIDIAN_ROOT, '02-Resources/Excalidraw');
  const excalidrawFilesData = [];

  if (existsSync(excalidrawDir)) {
    try {
      const files = readdirSync(excalidrawDir).filter(f => f.endsWith('.excalidraw.md'));
      for (const file of files) {
        const filePath = join(excalidrawDir, file);
        const name = file.replace('.excalidraw.md', '');
        
        try {
          const raw = readFileSync(filePath, 'utf-8');
          
          // 查找是否含有 compressed-json 块
          const compressedMatch = raw.match(/```compressed-json\n([\s\S]*?)\n```/);
          // 查找是否含有普通 json 块 (有些已解压文件)
          const jsonMatch = raw.match(/```json\n([\s\S]*?)\n```/);

          let elements = [];
          
          if (compressedMatch) {
            const base64 = compressedMatch[1].replace(/\s+/g, '');
            const decompressed = LZString.decompressFromBase64(base64);
            if (!decompressed) {
              throw new Error('lz-string decompress returned null');
            }
            const data = JSON.parse(decompressed);
            elements = data.elements || [];
          } else if (jsonMatch) {
            const data = JSON.parse(jsonMatch[1].trim());
            elements = data.elements || [];
          } else {
            throw new Error('No compressed-json or json blocks found in Excalidraw markdown');
          }

          // 只保留前端渲染所必须的属性，压缩 JSON 大小
          const cleanElements = elements.map(el => ({
            type: el.type,
            id: el.id,
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
            strokeColor: el.strokeColor || '#000000',
            backgroundColor: el.backgroundColor || 'transparent',
            strokeWidth: el.strokeWidth || 1,
            text: el.text || '',
            fontSize: el.fontSize || 16,
            points: el.points || []
          }));

          excalidrawFilesData.push({
            name,
            file,
            elements: cleanElements
          });
        } catch (e) {
          excalidrawFilesData.push({
            name,
            file,
            error: `Failed to decompress Excalidraw: ${e.message}`,
            elements: []
          });
        }
      }
    } catch (e) {
      console.warn(`[build-previews] Failed to read Excalidraw directory: ${e.message}`);
    }
  } else {
    console.warn(`[build-previews] Excalidraw folder not found at: ${excalidrawDir}`);
  }

  ensureDirExists(OUTPUT_EXCALIDRAW);
  writeFileSync(OUTPUT_EXCALIDRAW, JSON.stringify({ files: excalidrawFilesData }, null, 2) + '\n');
  console.log(`[build-previews] Excalidraw database written to ${OUTPUT_EXCALIDRAW}. Items: ${excalidrawFilesData.length}`);
}

main();
