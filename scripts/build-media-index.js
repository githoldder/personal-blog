#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SOURCE_DIR = join(ROOT, 'content/media');
const PUBLIC_DIR = join(ROOT, 'public/assets/media');
const MANIFEST_PATH = join(PUBLIC_DIR, 'manifest.json');

const TYPE_BY_EXT = new Map([
  ['.jpg', 'image'],
  ['.jpeg', 'image'],
  ['.png', 'image'],
  ['.webp', 'image'],
  ['.gif', 'image'],
  ['.svg', 'image'],
  ['.mp3', 'audio'],
  ['.wav', 'audio'],
  ['.m4a', 'audio'],
  ['.ogg', 'audio'],
  ['.mp4', 'video'],
  ['.webm', 'video'],
  ['.mov', 'video']
]);

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const name of readdirSync(current)) {
      if (name.startsWith('.')) continue;
      const path = join(current, name);
      const stat = statSync(path);
      if (stat.isDirectory()) stack.push(path);
      else out.push(path);
    }
  }
  return out.sort((a, b) => a.localeCompare(b));
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function mediaTypeFor(path) {
  return TYPE_BY_EXT.get(extname(path).toLowerCase()) || 'file';
}

export function buildMediaIndex() {
  mkdirSync(SOURCE_DIR, { recursive: true });
  mkdirSync(PUBLIC_DIR, { recursive: true });

  const assets = [];
  for (const sourcePath of walk(SOURCE_DIR)) {
    const rel = relative(SOURCE_DIR, sourcePath);
    const ext = extname(sourcePath).toLowerCase();
    const type = mediaTypeFor(sourcePath);
    if (type === 'file') continue;

    const publicPath = join(PUBLIC_DIR, rel);
    mkdirSync(dirname(publicPath), { recursive: true });
    copyFileSync(sourcePath, publicPath);

    const stat = statSync(sourcePath);
    const hash = sha256(sourcePath);
    const id = `${type}:${hash.slice(0, 12)}`;
    const title = basename(sourcePath, ext).replace(/[-_]+/g, ' ').trim();

    assets.push({
      id,
      title,
      type,
      extension: ext.slice(1),
      sourcePath: relative(ROOT, sourcePath),
      source_path: relative(ROOT, sourcePath),
      publicPath: relative(ROOT, publicPath),
      public_path: relative(ROOT, publicPath),
      url: `/assets/media/${rel.split(/[\\/]/).map(encodeURIComponent).join('/')}`,
      size: stat.size,
      content_hash: `sha256:${hash}`,
      updated_at: stat.mtime.toISOString(),
      tags: []
    });
  }

  const manifest = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    source_root: 'content/media',
    public_root: 'public/assets/media',
    count: assets.length,
    assets
  };

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`[build-media-index] Wrote ${relative(ROOT, MANIFEST_PATH)} with ${assets.length} assets.`);
  return manifest;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildMediaIndex();
}
