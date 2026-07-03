#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSET_DIR = join(ROOT, 'public/assets');
const SEARCH_INDEX = join(ASSET_DIR, 'search-index.json');
const CHUNKS = join(ASSET_DIR, 'semantic_chunks.json');
const VECTOR_INDEX = join(ASSET_DIR, 'vector_index.json');
const CLUSTERS = join(ASSET_DIR, 'semantic_clusters.json');

function hashVector(text, dims = 12) {
  const vector = Array.from({ length: dims }, () => 0);
  for (let i = 0; i < text.length; i += 1) {
    vector[i % dims] += (text.charCodeAt(i) % 97) / 97;
  }
  const norm = Math.sqrt(vector.reduce((sum, n) => sum + n * n, 0)) || 1;
  return vector.map(n => Number((n / norm).toFixed(6)));
}

function cosine(a, b) {
  return Number(a.reduce((sum, value, index) => sum + value * b[index], 0).toFixed(6));
}

function normalizeSearchIndex(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.items)) return raw.items;
  if (Array.isArray(raw.records)) return raw.records;
  return [];
}

function main() {
  if (!existsSync(ASSET_DIR)) mkdirSync(ASSET_DIR, { recursive: true });
  const raw = existsSync(SEARCH_INDEX) ? JSON.parse(readFileSync(SEARCH_INDEX, 'utf-8')) : [];
  const records = normalizeSearchIndex(raw).slice(0, 120);

  const chunks = records.map((record, index) => {
    const title = record.title || record.label || `Untitled ${index + 1}`;
    const text = [title, record.description, record.summary, record.excerpt, record.content]
      .filter(Boolean)
      .join('\n')
      .slice(0, 1200);
    return {
      id: `chunk:${record.slug || record.id || index}`,
      source_id: record.slug || record.id || `record-${index}`,
      title,
      type: record.type || 'content',
      public: record.status !== 'private',
      text
    };
  }).filter(chunk => chunk.public && chunk.text.trim().length > 0);

  const vectors = chunks.map(chunk => ({
    id: chunk.id,
    source_id: chunk.source_id,
    model: 'deterministic-hash-v1',
    dimensions: 12,
    vector: hashVector(chunk.text)
  }));

  const neighbors = vectors.map(vector => ({
    id: vector.id,
    nearest: vectors
      .filter(other => other.id !== vector.id)
      .map(other => ({ id: other.id, score: cosine(vector.vector, other.vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }));

  const groups = new Map();
  for (const chunk of chunks) {
    const key = chunk.type || 'content';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(chunk.id);
  }

  const clusters = Array.from(groups.entries()).map(([label, ids], index) => ({
    id: `cluster:${label}`,
    label,
    color_index: index,
    strategy: 'deterministic-type-taxonomy',
    chunk_ids: ids
  }));

  writeFileSync(CHUNKS, JSON.stringify({ schema_version: 1, generated_at: new Date().toISOString(), chunks }, null, 2), 'utf-8');
  writeFileSync(VECTOR_INDEX, JSON.stringify({ schema_version: 1, generated_at: new Date().toISOString(), model: 'deterministic-hash-v1', vectors, neighbors }, null, 2), 'utf-8');
  writeFileSync(CLUSTERS, JSON.stringify({ schema_version: 1, generated_at: new Date().toISOString(), clusters }, null, 2), 'utf-8');
  console.log(`[build-semantic-intelligence] chunks=${chunks.length} vectors=${vectors.length} clusters=${clusters.length}`);
}

main();
