#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const CONTENT_DIR = join(ROOT, 'content');
const OUTPUT = join(ROOT, 'public/assets/semantic_graph.json');
const PUBLIC_HANDLE = 'githoldder';

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

  // 提取 wiki links 和转换后的标准 markdown 绝对路径热链
  const wikiLinks = [];
  let m;
  WIKI_LINK_REG.lastIndex = 0;
  while ((m = WIKI_LINK_REG.exec(body)) !== null) {
    wikiLinks.push(slugify(m[1]));
  }

  const MD_LINK_REG = /\[.*?\]\(\/notes\/(obsidian-[a-f0-9]{32})\/?.*?\)/g;
  let m2;
  while ((m2 = MD_LINK_REG.exec(body)) !== null) {
    wikiLinks.push(`note:${m2[1]}`); // 拼接 note: 前缀以和全量 ID 一致
  }

  const MD_PROJ_REG = /\[.*?\]\(\/projects\/(.*?)\/?\)/g;
  let m3;
  while ((m3 = MD_PROJ_REG.exec(body)) !== null) {
    wikiLinks.push(`project:${m3[1]}`); // 匹配到的目标项目 ID
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
          label: `${PUBLIC_HANDLE} 的简历`,
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
      
      let stage = 'seedling';
      if (tags.includes('evergreen') || tags.includes('常青') || slug.length < 32) {
        stage = 'evergreen';
      } else if (tags.includes('budding') || tags.includes('萌芽') || (frontmatter.title && frontmatter.title.length > 8)) {
        stage = 'budding';
      }

      const noteDate = frontmatter.date ? (frontmatter.date instanceof Date ? frontmatter.date.toISOString().slice(0, 10) : String(frontmatter.date)) : '2026-06-26';

      nodes.push({
        id,
        label: frontmatter.title || slug,
        type: 'note',
        metadata: { 
          file: `content/notes/${file}`,
          stage,
          date: noteDate
        },
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
      const projectDate = frontmatter.date ? (frontmatter.date instanceof Date ? frontmatter.date.toISOString().slice(0, 10) : String(frontmatter.date)) : '2026-06-26';

      nodes.push({
        id,
        label: frontmatter.title || slug,
        type: 'project',
        metadata: { 
          file: `content/projects/${file}`,
          date: projectDate
        },
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
      let targetId = null;
      if (targetSlug.startsWith('note:') || targetSlug.startsWith('project:') || targetSlug.startsWith('deck:')) {
        targetId = targetSlug;
      } else {
        targetId = slugToId.get(targetSlug);
      }
      
      if (targetId && targetId !== item.source) {
        const exists = nodes.some(n => n.id === targetId);
        if (exists) {
          edges.push({
            source: item.source,
            target: targetId,
            weight: 1.0,
            type: 'link'
          });
        }
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

  // 计算度数 (Degree)
  const degrees = new Map();
  edges.forEach(e => {
    degrees.set(e.source, (degrees.get(e.source) || 0) + 1);
    degrees.set(e.target, (degrees.get(e.target) || 0) + 1);
  });

  // 整理输出结构，清理 nodes 的临时 tags 属性（保持 semantic_graph.json 的纯净）
  const cleanNodes = nodes.map(({ id, label, type, metadata, tags }) => ({
    id,
    label,
    type,
    metadata: {
      ...metadata,
      degree: degrees.get(id) || 0,
      tags
    }
  }));
  cleanNodes.forEach((node) => {
    sourceSummary.node_types[node.type] = (sourceSummary.node_types[node.type] || 0) + 1;
  });
  edges.forEach((edge) => {
    sourceSummary.edge_types[edge.type] = (sourceSummary.edge_types[edge.type] || 0) + 1;
  });

  // 1. 计算每个 node 的 scope 并注入 metadata
  cleanNodes.forEach(node => {
    let scope = 'Archives';
    if (node.type === 'project') {
      scope = 'Projects';
    } else if (node.type === 'deck') {
      scope = 'Decks';
    } else if (node.type === 'resume') {
      scope = 'Resume';
    } else if (node.type === 'note') {
      const tags = node.metadata?.tags || [];
      if (tags.includes('book')) {
        scope = 'Resources-Books';
      } else if (node.metadata?.stage === 'evergreen') {
        scope = 'Areas';
      } else {
        scope = 'Resources-Notes';
      }
    }
    node.metadata = {
      ...node.metadata,
      scope
    };
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

  // 2. 导出 scoped JSON 和 manifest.json 
  const graphsDir = join(ROOT, 'public/assets/graphs');
  if (!existsSync(graphsDir)) {
    mkdirSync(graphsDir, { recursive: true });
  }

  const scopes = ['Projects', 'Areas', 'Resources-Books', 'Resources-Notes', 'Archives', 'Decks', 'Resume'];
  const manifest = {
    generated_at: new Date().toISOString(),
    scopes: {}
  };

  scopes.forEach(scopeName => {
    const rawScopeNodes = cleanNodes.filter(n => n.metadata.scope === scopeName);
    const rawScopeNodeIds = new Set(rawScopeNodes.map(n => n.id));
    let scopeEdges = edges.filter(e => rawScopeNodeIds.has(e.source) && rawScopeNodeIds.has(e.target));
    
    // 计算局部子图的度数
    const scopeDegrees = new Map();
    scopeEdges.forEach(e => {
      scopeDegrees.set(e.source, (scopeDegrees.get(e.source) || 0) + 1);
      scopeDegrees.set(e.target, (scopeDegrees.get(e.target) || 0) + 1);
    });

    // 仅针对资源类型笔记进行局部 degree 裁剪，保留有链接联系的核心网
    let scopeNodes = rawScopeNodes;
    if (scopeName === 'Resources-Notes' || scopeName === 'Resources-Books') {
      scopeNodes = rawScopeNodes.filter(n => (scopeDegrees.get(n.id) || 0) > 0);
      const activeNodeIds = new Set(scopeNodes.map(n => n.id));
      scopeEdges = scopeEdges.filter(e => activeNodeIds.has(e.source) && activeNodeIds.has(e.target));
    }

    const scopeGraph = {
      nodes: scopeNodes,
      edges: scopeEdges,
      metadata: {
        scope: scopeName,
        total_nodes: scopeNodes.length,
        total_edges: scopeEdges.length
      }
    };
    
    const scopeFile = join(graphsDir, `${scopeName.toLowerCase()}.json`);
    writeFileSync(scopeFile, JSON.stringify(scopeGraph, null, 2) + '\n');
    
    manifest.scopes[scopeName] = {
      file: `public/assets/graphs/${scopeName.toLowerCase()}.json`,
      total_nodes: scopeNodes.length,
      total_edges: scopeEdges.length
    };
  });

  writeFileSync(join(graphsDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log('[build-semantic-graph] Scoped graphs and manifest.json generated successfully.');

  // 3. 导出 cross_scope_index.json (邻接索引)
  const nodeToNeighbors = {};
  const nodeToScope = {};

  cleanNodes.forEach(n => {
    nodeToNeighbors[n.id] = [];
    nodeToScope[n.id] = n.metadata.scope;
  });

  edges.forEach(e => {
    if (nodeToNeighbors[e.source] && !nodeToNeighbors[e.source].includes(e.target)) {
      nodeToNeighbors[e.source].push(e.target);
    }
    if (nodeToNeighbors[e.target] && !nodeToNeighbors[e.target].includes(e.source)) {
      nodeToNeighbors[e.target].push(e.source);
    }
  });

  const crossScopeIndex = {
    node_to_scope: nodeToScope,
    node_to_neighbors: nodeToNeighbors
  };

  writeFileSync(join(graphsDir, 'cross_scope_index.json'), JSON.stringify(crossScopeIndex, null, 2) + '\n');
  console.log(`[build-semantic-graph] Cross-scope neighbor index written to ${join(graphsDir, 'cross_scope_index.json')}`);

  // 4. 导出 PARA 折叠主题图谱 (para.json)
  console.log('[build-semantic-graph] Compiling folded PARA topic graph...');
  const paraNodes = [];
  const paraEdges = [];
  console.log('[build-semantic-graph] Total cleanNodes:', cleanNodes.length, 'Total edges:', edges.length);
  
  // 文件夹 Label 清洗函数：去掉开头的数字序号
  function cleanFolderLabel(folderName) {
    return folderName.replace(/^\d+[-_]/, '').replace(/^\d+/, '');
  }

  // 收集非 note 的节点
  const folderSet = new Set();
  nodes.forEach(node => {
    if (node.type === 'project' || node.type === 'deck' || node.type === 'resume') {
      paraNodes.push({
        id: node.id,
        label: node.label,
        type: node.type,
        metadata: { ...node.metadata }
      });
    } else if (node.type === 'note') {
      const tags = node.tags || [];
      if (tags.includes('book')) {
        // 书籍作为高质量独立节点保留
        paraNodes.push({
          id: node.id,
          label: node.label,
          type: 'book',
          metadata: { ...node.metadata }
        });
      } else {
        // 普通笔记映射为文件夹
        // tags 结构：['Obsidian', '010_时间管理', ...]
        const folderTag = tags.find(t => t !== 'Obsidian' && (t.startsWith('00') || t.includes('_') || t.match(/^\d+/)));
        const folderName = folderTag || 'Inbox';
        folderSet.add(folderName);
      }
    }
  });

  console.log('[build-semantic-graph] FolderSet collected:', Array.from(folderSet));

  // 将收集到的 folders 映射为主题节点
  folderSet.forEach(folder => {
    const slug = slugify(folder);
    paraNodes.push({
      id: `folder:${slug}`,
      label: cleanFolderLabel(folder),
      type: 'folder',
      metadata: { scope: folder.includes('Projects') || folder.includes('看板') ? 'Projects' : 'Areas', originalName: folder }
    });
  });

  // 映射函数：传入全量 node ID，返回其在 PARA 图谱中的合并 ID
  function getParaTargetId(nodeId) {
    const originalNode = nodes.find(n => n.id === nodeId);
    if (!originalNode) return nodeId;
    if (originalNode.type === 'project' || originalNode.type === 'deck' || originalNode.type === 'resume') {
      return nodeId;
    }
    if (originalNode.type === 'note') {
      const tags = originalNode.tags || [];
      if (tags.includes('book')) {
        return nodeId;
      }
      const folderTag = tags.find(t => t !== 'Obsidian' && (t.startsWith('00') || t.includes('_') || t.match(/^\d+/)));
      const folderName = folderTag || 'Inbox';
      return `folder:${slugify(folderName)}`;
    }
    return nodeId;
  }

  // 折叠所有的边
  const edgeSet = new Set();
  edges.forEach(e => {
    const fromParaId = getParaTargetId(e.source);
    const toParaId = getParaTargetId(e.target);
    
    if (fromParaId !== toParaId) {
      const edgeKey = `${fromParaId}->${toParaId}`;
      const revKey = `${toParaId}->${fromParaId}`;
      if (!edgeSet.has(edgeKey) && !edgeSet.has(revKey)) {
        edgeSet.add(edgeKey);
        paraEdges.push({
          id: `para-edge:${fromParaId}-${toParaId}`,
          source: fromParaId,
          target: toParaId,
          type: 'para_link'
        });
      }
    }
  });

  const paraGraph = {
    nodes: paraNodes,
    edges: paraEdges,
    metadata: {
      generated_at: new Date().toISOString(),
      total_nodes: paraNodes.length,
      total_edges: paraEdges.length
    }
  };

  const paraFile = join(graphsDir, 'para.json');
  writeFileSync(paraFile, JSON.stringify(paraGraph, null, 2) + '\n');
  console.log(`[build-semantic-graph] Folded PARA graph written to ${paraFile}. Nodes: ${paraNodes.length}, Edges: ${paraEdges.length}`);
  console.log(`[build-semantic-graph] Nodes computed: ${cleanNodes.length}`);
  console.log(`[build-semantic-graph] Edges computed: ${edges.length}`);
  console.log('[build-semantic-graph] Done.');
}

main();
