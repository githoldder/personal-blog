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
  const sourceSummary = {
    content_sources: {
      resume: 0,
      notes: 0,
      projects: 0,
      decks: 0
    },
    node_types: {
      resume: 0,
      note: 0,
      project: 0,
      deck: 0
    },
    edge_types: {
      link: 0,
      owner: 0,
      tag_overlap: 0
    }
  };

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
        sourceSummary.content_sources.resume = 1;

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
    sourceSummary.content_sources.notes = noteFiles.length;
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
    sourceSummary.content_sources.projects = projectFiles.length;
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
    sourceSummary.content_sources.decks = deckFiles.length;
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

  // Heuristic 3: Tag / Keyword Overlap (Optimized with Inverted Index & Set)
  const linkedSet = new Set();
  edges.forEach(e => {
    const key = e.source < e.target ? `${e.source}&&${e.target}` : `${e.target}&&${e.source}`;
    linkedSet.add(key);
  });

  const tagToNodes = new Map();
  for (const node of nodes) {
    // 过滤掉 'Obsidian' 全局共有标签，避免生成无意义的全连接边
    const tags = (node.tags || []).filter(t => t !== 'Obsidian');
    for (const tag of tags) {
      if (!tagToNodes.has(tag)) {
        tagToNodes.set(tag, []);
      }
      tagToNodes.get(tag).push(node);
    }
  }

  const overlapCandidates = new Map();
  for (const [tag, nodeList] of tagToNodes.entries()) {
    // 如果某个标签被超过 50 个节点共有，忽略其连边以防止图谱边数爆炸和卡死
    if (nodeList.length > 50) {
      console.log(`[build-semantic-graph] Skipping overlap connections for broad tag "${tag}" (${nodeList.length} nodes)`);
      continue;
    }

    for (let i = 0; i < nodeList.length; i++) {
      for (let j = i + 1; j < nodeList.length; j++) {
        const nodeA = nodeList[i];
        const nodeB = nodeList[j];
        const key = nodeA.id < nodeB.id ? `${nodeA.id}&&${nodeB.id}` : `${nodeB.id}&&${nodeA.id}`;
        
        if (linkedSet.has(key)) continue;

        if (!overlapCandidates.has(key)) {
          overlapCandidates.set(key, {
            source: nodeA.id,
            target: nodeB.id,
            sharedTags: []
          });
        }
        overlapCandidates.get(key).sharedTags.push(tag);
      }
    }
  }

  for (const candidate of overlapCandidates.values()) {
    edges.push({
      source: candidate.source,
      target: candidate.target,
      weight: Math.min(1.0, candidate.sharedTags.length * 0.25),
      type: 'tag_overlap',
      metadata: { shared_tags: candidate.sharedTags }
    });
  }

  // 整理输出结构，清理 nodes 的临时 tags 属性（保持 semantic_graph.json 的纯净）
  const cleanNodes = nodes.map(({ id, label, type, metadata }) => ({
    id,
    label,
    type,
    metadata
  }));
  cleanNodes.forEach((node) => {
    sourceSummary.node_types[node.type] = (sourceSummary.node_types[node.type] || 0) + 1;
  });
  edges.forEach((edge) => {
    sourceSummary.edge_types[edge.type] = (sourceSummary.edge_types[edge.type] || 0) + 1;
  });

  const graph = {
    nodes: cleanNodes,
    edges,
    metadata: {
      generated_at: new Date().toISOString(),
      version: '0.1.0',
      total_nodes: cleanNodes.length,
      total_edges: edges.length,
      source_summary: sourceSummary
    }
  };

  writeFileSync(OUTPUT, JSON.stringify(graph, null, 2) + '\n');

  console.log(`[build-semantic-graph] Output successfully written to ${OUTPUT}`);
  console.log(`[build-semantic-graph] Nodes computed: ${cleanNodes.length}`);
  console.log(`[build-semantic-graph] Edges computed: ${edges.length}`);
  console.log('[build-semantic-graph] Done.');
}

main();
