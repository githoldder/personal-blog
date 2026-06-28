#!/usr/bin/env node

/**
 * build-assets.js — 统一资产构建入口
 *
 * 按顺序调用所有构建脚本:
 *   1. build-resume.js — 简历 PDF
 *   2. build-decks.js — 演示文稿 HTML + PDF
 *   3. build-semantic-graph.js — 语义图谱 JSON
 *
 * 用法:
 *   npm run build:assets
 *   node scripts/build-assets.js
 *
 * 状态: 占位脚本
 */

import { execSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const scripts = [
  { name: 'build-resume.js', label: 'Resume' },
  { name: 'build-decks.js', label: 'Decks' },
  { name: 'build-semantic-graph.js', label: 'Semantic Graph' },
];

function main() {
  console.log('[build-assets] Starting unified asset build...\n');

  for (const script of scripts) {
    console.log(`[build-assets] Running ${script.label}...`);
    try {
      execSync(`node ${__dirname}/${script.name}`, { stdio: 'inherit' });
      console.log(`[build-assets] ${script.label} completed.\n`);
    } catch (error) {
      console.error(`[build-assets] ${script.label} failed:`, error.message);
      // 继续执行其他脚本，不中断
    }
  }

  console.log('[build-assets] Unified asset build completed.');
}

main();
