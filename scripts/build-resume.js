#!/usr/bin/env node

/**
 * build-resume.js — 简历构建脚本
 *
 * 输入:
 *   - content/resume/resume.yaml (结构化简历数据)
 *   - content/resume/template.typ (Typst 模板)
 *
 * 输出:
 *   - public/assets/resume.pdf
 *
 * 依赖:
 *   - typst CLI (需单独安装)
 *
 * 状态: 占位脚本 — 第一阶段不实现真正编译
 * TODO:
 *   1. 读取 resume.yaml
 *   2. 注入数据到 template.typ
 *   3. 调用 typst compile 生成 PDF
 *   4. 输出到 public/assets/resume.pdf
 */

import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const INPUT_YAML = join(ROOT, 'content/resume/resume.yaml');
const INPUT_TYP = join(ROOT, 'content/resume/template.typ');
const OUTPUT_DIR = join(ROOT, 'public/assets');
const OUTPUT_PDF = join(OUTPUT_DIR, 'resume.pdf');

function main() {
  console.log('[build-resume] Starting...');

  // 检查输入文件
  if (!existsSync(INPUT_YAML)) {
    console.error(`[build-resume] Error: ${INPUT_YAML} not found`);
    process.exit(1);
  }

  if (!existsSync(INPUT_TYP)) {
    console.error(`[build-resume] Error: ${INPUT_TYP} not found`);
    process.exit(1);
  }

  // 确保输出目录存在
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // TODO: 实现真正的构建逻辑
  // 1. 读取 YAML 数据
  // const yamlContent = readFileSync(INPUT_YAML, 'utf-8');
  // 2. 解析并注入到 Typst 模板
  // 3. 调用 typst compile
  // 4. 输出 PDF

  console.log('[build-resume] Input YAML:', INPUT_YAML);
  console.log('[build-resume] Input Template:', INPUT_TYP);
  console.log('[build-resume] Output:', OUTPUT_PDF);
  console.log('[build-resume] TODO: Implement Typst compilation');
  console.log('[build-resume] Done (placeholder).');
}

main();
