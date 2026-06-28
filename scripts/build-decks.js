#!/usr/bin/env node

import { readFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const INPUT_DIR = join(ROOT, 'content/decks');
const OUTPUT_SLIDES = join(ROOT, 'public/slides');
const OUTPUT_ASSETS = join(ROOT, 'public/assets');
const OUTPUT_DECK_ASSETS = join(OUTPUT_ASSETS, 'decks');
const OUTPUT_MANIFEST = join(OUTPUT_DECK_ASSETS, 'manifest.json');

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseDeckFrontmatter(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);

  if (!match) {
    throw new Error('Missing YAML frontmatter block');
  }

  const metadata = {};
  for (const line of match[1].split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf(':');
    if (separatorIndex === -1) {
      throw new Error(`Invalid frontmatter line "${trimmed}"`);
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, '');

    metadata[key] = value;
  }

  return metadata;
}

function normalizeDeck(file) {
  const filePath = join(INPUT_DIR, file);
  const metadata = parseDeckFrontmatter(filePath);
  const fallbackSlug = slugify(basename(file, '.md'));
  const slug = metadata.slug ? slugify(String(metadata.slug)) : fallbackSlug;
  const title = metadata.title ? String(metadata.title).trim() : '';
  const date = metadata.date ? String(metadata.date).trim() : '';

  if (!slug) {
    throw new Error(`${file}: slug could not be derived`);
  }
  if (!title) {
    throw new Error(`${file}: missing required frontmatter field "title"`);
  }
  if (!date) {
    throw new Error(`${file}: missing required frontmatter field "date"`);
  }

  return {
    slug,
    title,
    date,
    sourcePath: relative(ROOT, filePath),
    outputs: {
      html: `public/slides/${slug}/`,
      pdf: `public/assets/${slug}.pdf`
    },
    build: {
      status: 'pending',
      requires: '@slidev/cli',
      notes: 'S03-T03 only defines the deterministic manifest; Slidev HTML/PDF export is handled by a later build step.'
    }
  };
}

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
  if (!existsSync(OUTPUT_DECK_ASSETS)) {
    mkdirSync(OUTPUT_DECK_ASSETS, { recursive: true });
  }

  // 扫描 Markdown 文件
  const files = readdirSync(INPUT_DIR).filter(f => f.endsWith('.md'));

  if (files.length === 0) {
    console.log('[build-decks] No deck files found.');
    return;
  }

  console.log(`[build-decks] Found ${files.length} deck(s).`);

  const decks = [];
  const seenSlugs = new Set();

  for (const file of files.sort()) {
    let deck;
    try {
      deck = normalizeDeck(file);
    } catch (error) {
      console.error(`[build-decks] Error: ${error.message}`);
      process.exit(1);
    }

    if (seenSlugs.has(deck.slug)) {
      console.error(`[build-decks] Error: duplicate deck slug "${deck.slug}"`);
      process.exit(1);
    }
    seenSlugs.add(deck.slug);
    decks.push(deck);
    console.log(`[build-decks]   - ${deck.slug}: ${deck.title}`);
  }

  const manifest = {
    schema_version: 1,
    generated_by: 'scripts/build-decks.js',
    source_dir: relative(ROOT, INPUT_DIR),
    output_dir: relative(ROOT, OUTPUT_DECK_ASSETS),
    count: decks.length,
    decks
  };

  writeFileSync(OUTPUT_MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
  console.log(`[build-decks] Manifest written to ${relative(ROOT, OUTPUT_MANIFEST)}`);
  console.log('[build-decks] Done.');
}

main();
