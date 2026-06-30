#!/usr/bin/env node

/**
 * build-search-index.js
 * 从内容真源（笔记、项目、简历及演示文稿）提取并构建静态检索索引 search-index.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'content');
const PUBLIC_DIR = join(ROOT, 'public');
const OUTPUT_PATH = join(PUBLIC_DIR, 'assets/search-index.json');

function cleanMarkdownText(body) {
  return body
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1') // 还原 wiki-link
    .replace(/[#*`_~\[\]()\-]/g, ' ') // 移去格式符
    .replace(/\s+/g, ' ') // 压缩多余空白
    .slice(0, 300) // 截取前 300 个字符
    .trim();
}

function main() {
  console.log('[build-search-index] Starting static search index computation...');

  const notes = [];
  const projects = [];
  const decks = [];
  const resume = [];

  // 1. 索引 Notes
  const notesDir = join(CONTENT_DIR, 'notes');
  if (existsSync(notesDir)) {
    const files = readdirSync(notesDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const filePath = join(notesDir, file);
      const raw = readFileSync(filePath, 'utf-8');
      const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
      let frontmatter = {};
      let body = raw;

      if (match) {
        try {
          frontmatter = YAML.parse(match[1]) || {};
          body = raw.slice(match[0].length);
        } catch (e) {
          console.warn(`[build-search-index] Failed to parse frontmatter for note ${file}`);
        }
      }

      const slug = frontmatter.slug || basename(file, '.md');
      notes.push({
        id: `note:${slug}`,
        type: 'note',
        title: frontmatter.title || slug,
        summary: frontmatter.summary || (body.slice(0, 120).trim() + '...'),
        url: `/notes#${slug}`,
        tags: frontmatter.tags || [],
        sourcePath: `content/notes/${file}`,
        text: cleanMarkdownText(body)
      });
    }
  }

  // 2. 索引 Projects
  const projectsDir = join(CONTENT_DIR, 'projects');
  if (existsSync(projectsDir)) {
    const files = readdirSync(projectsDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const filePath = join(projectsDir, file);
      const raw = readFileSync(filePath, 'utf-8');
      const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
      let frontmatter = {};
      let body = raw;

      if (match) {
        try {
          frontmatter = YAML.parse(match[1]) || {};
          body = raw.slice(match[0].length);
        } catch (e) {
          console.warn(`[build-search-index] Failed to parse frontmatter for project ${file}`);
        }
      }

      const slug = frontmatter.slug || basename(file, '.md');
      projects.push({
        id: `project:${slug}`,
        type: 'project',
        title: frontmatter.title || slug,
        summary: frontmatter.description || (body.slice(0, 120).trim() + '...'),
        url: `/projects#${slug}`,
        tags: frontmatter.tech || [],
        sourcePath: `content/projects/${file}`,
        text: cleanMarkdownText(body)
      });
    }
  }

  // 3. 索引 Decks (读取 decks manifest)
  const decksManifestPath = join(PUBLIC_DIR, 'assets/decks/manifest.json');
  if (existsSync(decksManifestPath)) {
    try {
      const raw = readFileSync(decksManifestPath, 'utf-8');
      const manifest = JSON.parse(raw);
      const list = manifest.decks || [];
      for (const deck of list) {
        decks.push({
          id: `deck:${deck.slug}`,
          type: 'deck',
          title: deck.title,
          summary: deck.description || 'Slidev 风格演示文稿',
          url: `/slides/${deck.slug}/`,
          tags: [],
          sourcePath: `content/decks/${deck.slug}.md`,
          text: `${deck.title} ${deck.description || ''}`
        });
      }
    } catch (e) {
      console.warn(`[build-search-index] Failed to parse decks manifest: ${e.message}`);
    }
  }

  // 4. 索引 Resume (读取 resume.json)
  const resumeJsonPath = join(PUBLIC_DIR, 'assets/resume.json');
  if (existsSync(resumeJsonPath)) {
    try {
      const raw = readFileSync(resumeJsonPath, 'utf-8');
      const resumeData = JSON.parse(raw);
      if (resumeData && resumeData.basics) {
        const summaryText = resumeData.basics.summary || '';
        const skillsText = (resumeData.skills || []).map(s => `${s.name} ${s.keywords.join(' ')}`).join(' ');
        const expText = (resumeData.experience || []).map(e => `${e.company} ${e.position} ${e.summary} ${e.highlights.join(' ')}`).join(' ');
        const projText = (resumeData.projects || []).map(p => `${p.name} ${p.description} ${p.highlights.join(' ')}`).join(' ');

        const fullText = `${resumeData.basics.name} ${resumeData.basics.label} ${summaryText} ${skillsText} ${expText} ${projText}`;

        resume.push({
          id: 'resume:basics',
          type: 'resume',
          title: `${resumeData.basics.name}的简历`,
          summary: resumeData.basics.label || '个人结构化简历',
          url: '/resume',
          tags: (resumeData.skills || []).map(s => s.name),
          sourcePath: 'content/resume/resume.yaml',
          text: fullText.replace(/\s+/g, ' ').trim()
        });
      }
    } catch (e) {
      console.warn(`[build-search-index] Failed to parse resume.json: ${e.message}`);
    }
  }

  // 合并并写入文件
  const allIndex = [...notes, ...projects, ...decks, ...resume];

  const outDir = dirname(OUTPUT_PATH);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(allIndex, null, 2), 'utf-8');
  console.log(`[build-search-index] Done. Output written to public/assets/search-index.json. Items: ${allIndex.length}`);
}

main();
