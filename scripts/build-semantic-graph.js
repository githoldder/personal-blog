#!/usr/bin/env node

/**
 * build-semantic-graph.js — 语义图谱构建脚本
 *
 * 输入:
 *   - content/notes/*.md
 *   - content/projects/*.md
 *   - content/resume/resume.yaml
 *
 * 输出:
 *   - public/assets/semantic_graph.json
 *
 * 状态: 占位脚本 — 第一阶段不实现真正 embedding
 * TODO:
 *   1. 读取所有内容文件
 *   2. 提取文本和元数据
 *   3. [Phase 3] 计算 embedding
 *   4. [Phase 3] 构建图谱边
 *   5. 生成占位 JSON
 *
 * 语义图谱 JSON 结构约定:
 * {
 *   "nodes": [
 *     { "id": "string", "label": "string", "type": "note|project|resume", "metadata": {} }
 *   ],
 *   "edges": [
 *     { "source": "string", "target": "string", "weight": number, "type": "string" }
 *   ],
 *   "metadata": {
 *     "generated_at": "ISO date",
 *     "version": "0.1.0",
 *     "total_nodes": number,
 *     "total_edges": number
 *   }
 * }
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const CONTENT_DIR = join(ROOT, 'content');
const OUTPUT = join(ROOT, 'public/assets/semantic_graph.json');

function main() {
  console.log('[build-semantic-graph] Starting...');

  // 确保输出目录存在
  const outputDir = dirname(OUTPUT);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // 收集节点
  const nodes = [];
  const edges = [];

  // 扫描笔记
  const notesDir = join(CONTENT_DIR, 'notes');
  if (existsSync(notesDir)) {
    const noteFiles = readdirSync(notesDir).filter(f => f.endsWith('.md'));
    for (const file of noteFiles) {
      const slug = basename(file, '.md');
      nodes.push({
        id: `note:${slug}`,
        label: slug,
        type: 'note',
        metadata: { file: `content/notes/${file}` },
      });
    }
  }

  // 扫描项目
  const projectsDir = join(CONTENT_DIR, 'projects');
  if (existsSync(projectsDir)) {
    const projectFiles = readdirSync(projectsDir).filter(f => f.endsWith('.md'));
    for (const file of projectFiles) {
      const slug = basename(file, '.md');
      nodes.push({
        id: `project:${slug}`,
        label: slug,
        type: 'project',
        metadata: { file: `content/projects/${file}` },
      });
    }
  }

  // TODO: Phase 3 — 计算 embedding 并构建边
  // 目前只生成占位节点，无边

  const graph = {
    nodes,
    edges,
    metadata: {
      generated_at: new Date().toISOString(),
      version: '0.1.0',
      total_nodes: nodes.length,
      total_edges: edges.length,
      note: 'Phase 1 placeholder — no embedding computed yet',
    },
  };

  // 写入 JSON
  writeFileSync(OUTPUT, JSON.stringify(graph, null, 2));

  console.log(`[build-semantic-graph] Output: ${OUTPUT}`);
  console.log(`[build-semantic-graph] Nodes: ${nodes.length}, Edges: ${edges.length}`);
  console.log('[build-semantic-graph] Done (placeholder).');
}

main();
