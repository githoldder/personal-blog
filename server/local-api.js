#!/usr/bin/env node

import { createServer } from 'node:http';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const HOST = process.env.PKOS_API_HOST || '127.0.0.1';
const PORT = Number(process.env.PKOS_API_PORT || 8787);

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

function sendJson(res, status, payload) {
  res.writeHead(status, jsonHeaders);
  res.end(JSON.stringify(payload, null, 2));
}

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function safePublicPath(sourcePath) {
  const resolved = join(ROOT, sourcePath);
  const rel = relative(ROOT, resolved);
  if (rel.startsWith('..')) {
    throw new Error('Path escapes project root');
  }
  return resolved;
}

function sourceTree() {
  const roots = ['content/notes', 'content/projects', 'content/decks', 'content/resume'];
  const files = [];
  for (const root of roots) {
    const dir = join(ROOT, root);
    if (!existsSync(dir)) continue;
    const stack = [dir];
    while (stack.length) {
      const current = stack.pop();
      for (const name of readdirSync(current)) {
        const path = join(current, name);
        const stat = statSync(path);
        if (stat.isDirectory()) {
          stack.push(path);
        } else {
          files.push({
            path: relative(ROOT, path),
            size: stat.size,
            updated_at: stat.mtime.toISOString()
          });
        }
      }
    }
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export function route(method, url) {
  const parsed = new URL(url, 'http://127.0.0.1');

  if (method !== 'GET') {
    return { status: 405, body: { error: 'Local API is read-only by default.' } };
  }

  if (parsed.pathname === '/health') {
    return { status: 200, body: { ok: true, mode: 'local-only', host: HOST } };
  }

  if (parsed.pathname === '/source/tree') {
    return { status: 200, body: { files: sourceTree() } };
  }

  if (parsed.pathname === '/publish-manifest') {
    return {
      status: 200,
      body: readJson(join(ROOT, 'content/publish-manifest.json'), { records: [] })
    };
  }

  if (parsed.pathname === '/resume/evidence') {
    return {
      status: 200,
      body: readJson(join(ROOT, 'content/resume/evidence-manifest.json'), { records: [] })
    };
  }

  if (parsed.pathname === '/source/file') {
    const sourcePath = parsed.searchParams.get('path');
    if (!sourcePath) {
      return { status: 400, body: { error: 'Missing path query parameter.' } };
    }
    const fullPath = safePublicPath(sourcePath);
    if (!existsSync(fullPath)) {
      return { status: 404, body: { error: 'File not found.' } };
    }
    return {
      status: 200,
      body: {
        path: sourcePath,
        text: readFileSync(fullPath, 'utf-8')
      }
    };
  }

  return { status: 404, body: { error: 'Unknown local API route.' } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createServer((req, res) => {
    try {
      const result = route(req.method, req.url);
      sendJson(res, result.status, result.body);
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
  }).listen(PORT, HOST, () => {
    console.log(`[local-api] listening on http://${HOST}:${PORT}`);
  });
}
