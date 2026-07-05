#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRS = ['public', 'dist'];
const TEXT_EXTENSIONS = new Set([
  '.html',
  '.xml',
  '.json',
  '.txt',
  '.js',
  '.css',
  '.svg',
  '.md',
  '.map'
]);

const replacements = [
  [/曹磊/g, 'caolei']
];

function shouldProcess(filePath) {
  return TEXT_EXTENSIONS.has(extname(filePath).toLowerCase());
}

function sanitizeFile(filePath) {
  if (!shouldProcess(filePath)) return 0;

  const original = readFileSync(filePath, 'utf-8');
  let next = original;
  for (const [pattern, replacement] of replacements) {
    next = next.replace(pattern, replacement);
  }

  if (next !== original) {
    writeFileSync(filePath, next, 'utf-8');
    return 1;
  }
  return 0;
}

function walk(dir) {
  let changed = 0;
  if (!existsSync(dir)) return changed;

  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      changed += walk(path);
    } else if (stat.isFile()) {
      changed += sanitizeFile(path);
    }
  }
  return changed;
}

let changed = 0;
for (const dir of TARGET_DIRS) {
  changed += walk(join(ROOT, dir));
}

console.log(`[sanitize-public-output] Sanitized ${changed} public text artifact(s).`);
