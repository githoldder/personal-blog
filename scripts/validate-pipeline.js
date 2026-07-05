#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function readJson(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }

  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (error) {
    throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
  }
}

export function parseFrontmatter(raw, source = 'inline markdown') {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    throw new Error(`${source}: missing frontmatter block`);
  }

  const data = {};
  for (const line of match[1].split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf(':');
    if (separatorIndex === -1) {
      throw new Error(`${source}: invalid frontmatter line "${trimmed}"`);
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    data[key] = value.replace(/^["']|["']$/g, '');
  }

  return data;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateDeckManifest(manifest, root = ROOT, options = {}) {
  assert(manifest && typeof manifest === 'object', 'Deck manifest must be an object');
  assert([1, 2].includes(manifest.schema_version), 'Deck manifest schema_version must be 1 or 2');
  assert(Array.isArray(manifest.decks), 'Deck manifest decks must be an array');
  assert(manifest.count === manifest.decks.length, 'Deck manifest count must match decks length');

  const seen = new Set();
  for (const deck of manifest.decks) {
    assert(deck.slug, 'Deck entry missing slug');
    assert(deck.title, `Deck ${deck.slug || '<unknown>'} missing title`);
    assert(deck.date, `Deck ${deck.slug || '<unknown>'} missing date`);
    assert(deck.sourcePath, `Deck ${deck.slug || '<unknown>'} missing sourcePath`);
    assert(!seen.has(deck.slug), `Duplicate deck slug: ${deck.slug}`);
    seen.add(deck.slug);
    assert(existsSync(join(root, deck.sourcePath)), `Deck sourcePath does not exist: ${deck.sourcePath}`);
    assert(deck.outputs?.html, `Deck ${deck.slug} missing outputs.html`);
    assert(deck.outputs?.pdf, `Deck ${deck.slug} missing outputs.pdf`);
    if (options.requireS16DeckFields) {
      assert(deck.formats?.html?.path, `Deck ${deck.slug} missing formats.html.path`);
      assert(deck.formats?.html?.url, `Deck ${deck.slug} missing formats.html.url`);
      assert(deck.formats?.pdf?.path, `Deck ${deck.slug} missing formats.pdf.path`);
      assert(deck.formats?.pdf?.url, `Deck ${deck.slug} missing formats.pdf.url`);
      assert(deck.formats?.pptx?.path, `Deck ${deck.slug} missing formats.pptx.path`);
      assert(deck.formats?.pptx?.url, `Deck ${deck.slug} missing formats.pptx.url`);
      assert(/^sha256:[a-f0-9]{64}$/.test(deck.content_hash || ''), `Deck ${deck.slug} missing valid content_hash`);
      assert(typeof deck.updated_at === 'string' && !Number.isNaN(Date.parse(deck.updated_at)), `Deck ${deck.slug} missing valid updated_at`);
      assert(deck.build_log, `Deck ${deck.slug} missing build_log`);
      assert(deck.build?.log === deck.build_log, `Deck ${deck.slug} build.log must match build_log`);
    }
  }
}

export function validateResumeAsset(resume) {
  for (const field of ['basics', 'education', 'experience', 'projects', 'skills']) {
    assert(resume[field], `Resume asset missing ${field}`);
  }
  assert(resume.basics.name, 'Resume basics missing name');
  assert(resume.basics.email, 'Resume basics missing email');
  for (const field of ['education', 'experience', 'projects', 'skills']) {
    assert(Array.isArray(resume[field]), `Resume ${field} must be an array`);
  }
}

export function validateSemanticGraph(graph) {
  const allowedNodeTypes = new Set(['note', 'project', 'deck', 'resume']);
  const allowedEdgeTypes = new Set(['link', 'owner', 'tag_overlap']);

  assert(graph && typeof graph === 'object', 'Semantic graph must be an object');
  assert(Array.isArray(graph.nodes), 'Semantic graph nodes must be an array');
  assert(Array.isArray(graph.edges), 'Semantic graph edges must be an array');
  assert(graph.metadata, 'Semantic graph metadata is required');
  assert(typeof graph.metadata.generated_at === 'string', 'Semantic graph metadata missing generated_at');
  assert(!Number.isNaN(Date.parse(graph.metadata.generated_at)), 'Semantic graph generated_at must be an ISO timestamp');
  assert(graph.metadata.total_nodes === graph.nodes.length, 'Semantic graph total_nodes mismatch');
  assert(graph.metadata.total_edges === graph.edges.length, 'Semantic graph total_edges mismatch');
  assert(graph.metadata.source_summary && typeof graph.metadata.source_summary === 'object', 'Semantic graph metadata missing source_summary');

  const nodeIds = new Set();
  const nodeTypeCounts = {};
  for (const node of graph.nodes) {
    assert(node && typeof node === 'object', 'Semantic graph node must be an object');
    assert(typeof node.id === 'string' && node.id.trim(), 'Semantic graph node missing id');
    assert(!nodeIds.has(node.id), `Semantic graph contains duplicate node id: ${node.id}`);
    nodeIds.add(node.id);
    assert(typeof node.label === 'string' && node.label.trim(), `Semantic graph node ${node.id} missing label`);
    assert(allowedNodeTypes.has(node.type), `Semantic graph node ${node.id} has invalid type: ${node.type}`);
    assert(node.metadata && typeof node.metadata === 'object' && !Array.isArray(node.metadata), `Semantic graph node ${node.id} metadata must be an object`);
    nodeTypeCounts[node.type] = (nodeTypeCounts[node.type] || 0) + 1;
  }

  const edgeTypeCounts = {};
  for (const edge of graph.edges) {
    assert(edge && typeof edge === 'object', 'Semantic graph edge must be an object');
    assert(nodeIds.has(edge.source), `Semantic graph edge source missing: ${edge.source}`);
    assert(nodeIds.has(edge.target), `Semantic graph edge target missing: ${edge.target}`);
    assert(edge.source !== edge.target, `Semantic graph edge cannot point to itself: ${edge.source}`);
    assert(typeof edge.weight === 'number' && edge.weight >= 0 && edge.weight <= 1, `Semantic graph edge weight out of range: ${edge.source} -> ${edge.target}`);
    assert(allowedEdgeTypes.has(edge.type), `Semantic graph edge has invalid type: ${edge.type}`);
    edgeTypeCounts[edge.type] = (edgeTypeCounts[edge.type] || 0) + 1;
  }

  const sourceSummary = graph.metadata.source_summary;
  assert(sourceSummary.node_types && typeof sourceSummary.node_types === 'object', 'Semantic graph source_summary missing node_types');
  assert(sourceSummary.edge_types && typeof sourceSummary.edge_types === 'object', 'Semantic graph source_summary missing edge_types');
  for (const type of allowedNodeTypes) {
    assert((sourceSummary.node_types[type] || 0) === (nodeTypeCounts[type] || 0), `Semantic graph source_summary node_types mismatch for ${type}`);
  }
  for (const type of allowedEdgeTypes) {
    assert((sourceSummary.edge_types[type] || 0) === (edgeTypeCounts[type] || 0), `Semantic graph source_summary edge_types mismatch for ${type}`);
  }
}

export function validateContentFrontmatter(raw, type, source = 'inline markdown') {
  const data = parseFrontmatter(raw, source);
  const required = type === 'note'
    ? ['title', 'date', 'tags', 'status']
    : ['title', 'description', 'status', 'date', 'tech'];

  for (const field of required) {
    assert(data[field], `${source}: missing required field "${field}"`);
  }
}

function validateContentDirectory(relativeDir, type) {
  const dir = join(ROOT, relativeDir);
  if (!existsSync(dir)) return;

  for (const file of readdirSync(dir).filter((name) => name.endsWith('.md')).sort()) {
    const filePath = join(dir, file);
    validateContentFrontmatter(readFileSync(filePath, 'utf-8'), type, `${relativeDir}/${file}`);
  }
}

export function validateWorkspacePipeline() {
  validateResumeAsset(readJson(join(ROOT, 'public/assets/resume.json')));
  validateDeckManifest(readJson(join(ROOT, 'public/assets/decks/manifest.json')), ROOT);
  validateSemanticGraph(readJson(join(ROOT, 'public/assets/semantic_graph.json')));
  validateContentDirectory('content/notes', 'note');
  validateContentDirectory('content/projects', 'project');
}

function main() {
  try {
    validateWorkspacePipeline();
    console.log('[validate-pipeline] Pipeline assets and content contracts are valid.');
  } catch (error) {
    console.error(`[validate-pipeline] ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
