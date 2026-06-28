#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const CONTENT_DIR = join(ROOT, 'content');
const OUTPUT = join(ROOT, 'public/assets/semantic_graph.json');

// 正则匹配 wiki link: [[some-slug]] 或 [[some-slug|label]]
const WIKI_LINK_REG = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseMarkdownFile(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  let frontmatter = {};
  let body = raw;

  if (match) {
    try {
      frontmatter = YAML.parse(match[1]) || {};
      body = raw.slice(match[0].length);
    } catch (e) {
      console.warn(`[build-semantic-graph] Warning: failed to parse YAML frontmatter for ${filePath}`);
    }
  }

  // 提取 wiki links
  const wikiLinks = [];
  let m;
  WIKI_LINK_REG.lastIndex = 0;
  while ((m = WIKI_LINK_REG.exec(body)) !== null) {
    wikiLinks.push(slugify(m[1]));
  }

  return { frontmatter, wikiLinks };
}

function main() {
  console.log('[build-semantic-graph] Starting semantic graph computation...');

  // Ensure output directory exists
  const outputDir = dirname(OUTPUT);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const nodes = [];
  const edges = [];
  const slugToId = new Map(); // 用于 wiki links 匹配

  // 1. 扫描 Resume
  const resumePath = join(CONTENT_DIR, 'resume/resume.yaml');
  let resumeKeywords = [];
  let resumeProjects = [];
  if (existsSync(resumePath)) {
    try {
      const raw = readFileSync(resumePath, 'utf-8');
      const resumeData = YAML.parse(raw);
      if (resumeData && resumeData.basics) {
        const id = 'resume:basics';
        nodes.push({
          id,
          label: `${resumeData.basics.name}的简历`,
          type: 'resume',
          metadata: { summary: resumeData.basics.summary },
          tags: []
        });

        // 收集技能词和简历项目词用于标签碰撞
        const skillsKeywords = (resumeData.skills || []).flatMap(s => s.keywords || []);
        resumeProjects = (resumeData.projects || []).map(p => p.name);
        resumeKeywords = Array.from(new Set([...skillsKeywords]));
        nodes[nodes.length - 1].tags = resumeKeywords;
      }
    } catch (e) {
      console.error('[build-semantic-graph] Error: failed to parse resume.yaml:', e.message);
      process.exit(1);
    }
  }

  // 2. 扫描 Notes
  const notesDir = join(CONTENT_DIR, 'notes');
  const noteLinks = []; // 暂存出度
  if (existsSync(notesDir)) {
    const noteFiles = readdirSync(notesDir).filter(f => f.endsWith('.md'));
    for (const file of noteFiles) {
      const filePath = join(notesDir, file);
      const slug = slugify(basename(file, '.md'));
      const { frontmatter, wikiLinks } = parseMarkdownFile(filePath);

      const id = `note:${slug}`;
      slugToId.set(slug, id);
      slugToId.set(file, id); // 兼容原名匹配

      const tags = frontmatter.tags || [];
      nodes.push({
        id,
        label: frontmatter.title || slug,
        type: 'note',
        metadata: { file: `content/notes/${file}` },
        tags
      });

      if (wikiLinks.length > 0) {
        noteLinks.push({ source: id, targets: wikiLinks });
      }
    }
  }

  // 3. 扫描 Projects
  const projectsDir = join(CONTENT_DIR, 'projects');
  const projectLinks = [];
  if (existsSync(projectsDir)) {
    const projectFiles = readdirSync(projectsDir).filter(f => f.endsWith('.md'));
    for (const file of projectFiles) {
      const filePath = join(projectsDir, file);
      const slug = slugify(basename(file, '.md'));
      const { frontmatter, wikiLinks } = parseMarkdownFile(filePath);

      const id = `project:${slug}`;
      slugToId.set(slug, id);
      slugToId.set(file, id);

      const tags = frontmatter.tags || frontmatter.keywords || [];
      nodes.push({
        id,
        label: frontmatter.title || slug,
        type: 'project',
        metadata: { file: `content/projects/${file}` },
        tags
      });

      if (wikiLinks.length > 0) {
        projectLinks.push({ source: id, targets: wikiLinks });
      }
    }
  }

  // 4. 扫描 Decks
  const decksDir = join(CONTENT_DIR, 'decks');
  const deckLinks = [];
  if (existsSync(decksDir)) {
    const deckFiles = readdirSync(decksDir).filter(f => f.endsWith('.md'));
    for (const file of deckFiles) {
      const filePath = join(decksDir, file);
      const slug = slugify(basename(file, '.md'));
      const { frontmatter, wikiLinks } = parseMarkdownFile(filePath);

      const id = `deck:${slug}`;
      slugToId.set(slug, id);
      slugToId.set(file, id);

      const tags = frontmatter.tags || [];
      nodes.push({
        id,
        label: frontmatter.title || slug,
        type: 'deck',
        metadata: { file: `content/decks/${file}` },
        tags
      });

      if (wikiLinks.length > 0) {
        deckLinks.push({ source: id, targets: wikiLinks });
      }
    }
  }

  // 5. 生成 Edges

  // Heuristic 1: Wiki-Links
  const allWikiLinks = [...noteLinks, ...projectLinks, ...deckLinks];
  for (const item of allWikiLinks) {
    for (const targetSlug of item.targets) {
      const targetId = slugToId.get(targetSlug);
      if (targetId && targetId !== item.source) {
        edges.push({
          source: item.source,
          target: targetId,
          weight: 1.0,
          type: 'link'
        });
      }
    }
  }

  // Heuristic 2: Resume Project Ownership
  const hasResume = nodes.some(n => n.id === 'resume:basics');
  if (hasResume) {
    nodes.forEach(node => {
      if (node.type === 'project') {
        const isOwned = resumeProjects.some(pName => 
          pName.toLowerCase().includes(node.label.toLowerCase()) || 
          node.label.toLowerCase().includes(pName.toLowerCase()) ||
          pName.toLowerCase().includes(node.id.replace('project:', ''))
        );
        if (isOwned) {
          edges.push({
            source: 'resume:basics',
            target: node.id,
            weight: 1.0,
            type: 'owner'
          });
        }
      }
    });
  }

  // Heuristic 3: Tag / Keyword Overlap
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i];
      const nodeB = nodes[j];

      // 如果已经有 link 边或者 owner 边，则跳过
      const alreadyLinked = edges.some(e => 
        (e.source === nodeA.id && e.target === nodeB.id) ||
        (e.source === nodeB.id && e.target === nodeA.id)
      );
      if (alreadyLinked) continue;

      const tagsA = nodeA.tags || [];
      const tagsB = nodeB.tags || [];

      if (tagsA.length > 0 && tagsB.length > 0) {
        const shared = tagsA.filter(t => tagsB.includes(t));
        if (shared.length > 0) {
          edges.push({
            source: nodeA.id,
            target: nodeB.id,
            weight: Math.min(1.0, shared.length * 0.25),
            type: 'tag_overlap',
            metadata: { shared_tags: shared }
          });
        }
      }
    }
  }

  // 整理输出结构，清理 nodes 的临时 tags 属性（保持 semantic_graph.json 的纯净）
  const cleanNodes = nodes.map(({ id, label, type, metadata }) => ({
    id,
    label,
    type,
    metadata
  }));

  const graph = {
    nodes: cleanNodes,
    edges,
    metadata: {
      generated_at: new Date().toISOString(),
      version: '0.1.0',
      total_nodes: cleanNodes.length,
      total_edges: edges.length
    }
  };

  writeFileSync(OUTPUT, JSON.stringify(graph, null, 2) + '\n');

  console.log(`[build-semantic-graph] Output successfully written to ${OUTPUT}`);
  console.log(`[build-semantic-graph] Nodes computed: ${cleanNodes.length}`);
  console.log(`[build-semantic-graph] Edges computed: ${edges.length}`);
  console.log('[build-semantic-graph] Done.');
}

main();
