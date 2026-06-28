#!/usr/bin/env node

/**
 * build-decks.js — 演示文稿构建脚本
 *
 * 输入:
 *   - content/decks/*.md (Slidev 风格 Markdown)
 *
 * 输出:
 *   - public/slides/<slug>/ (HTML 演示文稿)
 *   - public/assets/<slug>.pdf (PDF 导出)
 *
 * 依赖:
 *   - @slidev/cli (需单独安装)
 *
 * 状态: 占位脚本 — 第一阶段不实现真正编译
 * TODO:
 *   1. 扫描 content/decks/*.md
 *   2. 对每个 .md 文件:
 *      a. 解析 frontmatter 获取 slug
 *      b. 调用 slidev build 生成 HTML
 *      c. 调用 slidev export 生成 PDF
 *   3. 输出到 public/slides/<slug>/ 和 public/assets/<slug>.pdf
 */

import { readFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const INPUT_DIR = join(ROOT, 'content/decks');
const OUTPUT_SLIDES = join(ROOT, 'public/slides');
const OUTPUT_ASSETS = join(ROOT, 'public/assets');

function main() {
  console.log('[build-decks] Starting...');

  // 检查输入目录
  if (!existsSync(INPUT_DIR)) {
    console.error(`[build-decks] Error: ${INPUT_DIR} not found`);
    process.exit(1);
  }

  // 确保输出目录存在
  if (!existsSync(OUTPUT_SLIDES)) {
    mkdirSync(OUTPUT_SLIDES, { recursive: true });
  }
  if (!existsSync(OUTPUT_ASSETS)) {
    mkdirSync(OUTPUT_ASSETS, { recursive: true });
  }

  // 扫描 Markdown 文件
  const files = readdirSync(INPUT_DIR).filter(f => f.endsWith('.md'));

  if (files.length === 0) {
    console.log('[build-decks] No deck files found.');
    return;
  }

  console.log(`[build-decks] Found ${files.length} deck(s):`);

  for (const file of files) {
    const slug = basename(file, '.md');
    console.log(`[build-decks]   - ${slug}`);

    // TODO: 实现真正的构建逻辑
    // 1. 读取 frontmatter 获取 title
    // 2. 调用 slidev build
    // 3. 调用 slidev export
    console.log(`[build-decks]   TODO: Build ${slug} → public/slides/${slug}/`);
    console.log(`[build-decks]   TODO: Export ${slug} → public/assets/${slug}.pdf`);
  }

  console.log('[build-decks] Done (placeholder).');
}

main();
