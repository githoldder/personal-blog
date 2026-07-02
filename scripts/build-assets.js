#!/usr/bin/env node

/**
 * build-assets.js — 统一资产构建入口
 *
 * 按顺序调用所有构建脚本:
 *   1. build-resume.js — 简历 PDF 与 JSON 数据
 *   2. build-decks.js — 演示文稿 HTML 与 PDF 导出
 *   3. build-semantic-graph.js — 语义图谱 JSON
 */

import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const scripts = [
  { name: 'build-notes-index.js', label: 'Notes Index' },
  { name: 'build-resume.js', label: 'Resume' },
  { name: 'build-decks.js', label: 'Decks' },
  { name: 'build-semantic-graph.js', label: 'Semantic Graph' },
  { name: 'build-search-index.js', label: 'Search Index' },
  { name: 'build-feeds.js', label: 'RSS & Atom Feeds' },
  { name: 'build-seo-assets.js', label: 'SEO Assets' },
];

function main() {
  console.log('[build-assets] Starting unified asset build...\n');
  const summary = [];

  for (const script of scripts) {
    console.log(`[build-assets] Running ${script.label} builder...`);
    try {
      execSync(`node "${join(__dirname, script.name)}"`, { stdio: 'inherit' });
      console.log(`[build-assets] ${script.label} completed successfully.\n`);
      summary.push({ label: script.label, status: 'Success' });
    } catch (error) {
      console.error(`\n[build-assets] FATAL ERROR: ${script.label} builder failed.`);
      console.error(`[build-assets] Message: ${error.message}`);
      process.exit(1); // 遇致命错误立刻终止进程，中断流水线
    }
  }

  console.log('=== BUILD SUMMARY ===');
  summary.forEach(item => {
    console.log(`  ✓  ${item.label}: ${item.status}`);
  });
  console.log('=====================\n');
  console.log('[build-assets] Unified asset build completed.');
}

main();
