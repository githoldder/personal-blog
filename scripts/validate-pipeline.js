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

export function validateDeckManifest(manifest, root = ROOT) {
  assert(manifest && typeof manifest === 'object', 'Deck manifest must be an object');
  assert(manifest.schema_version === 1, 'Deck manifest schema_version must be 1');
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
  assert(Array.isArray(graph.nodes), 'Semantic graph nodes must be an array');
  assert(Array.isArray(graph.edges), 'Semantic graph edges must be an array');
  assert(graph.metadata, 'Semantic graph metadata is required');
  assert(graph.metadata.total_nodes === graph.nodes.length, 'Semantic graph total_nodes mismatch');
  assert(graph.metadata.total_edges === graph.edges.length, 'Semantic graph total_edges mismatch');

  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  assert(nodeIds.size === graph.nodes.length, 'Semantic graph contains duplicate node ids');
  for (const edge of graph.edges) {
    assert(nodeIds.has(edge.source), `Semantic graph edge source missing: ${edge.source}`);
    assert(nodeIds.has(edge.target), `Semantic graph edge target missing: ${edge.target}`);
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
