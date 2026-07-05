#!/usr/bin/env node

import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const HOST = process.env.PKOS_API_HOST || '127.0.0.1';
const PORT = Number(process.env.PKOS_API_PORT || 8787);
const SOURCE_ROOTS = ['content/notes', 'content/projects', 'content/decks', 'content/resume', 'content/media'];
const TEXT_EXTENSIONS = new Set(['.md', '.mdx', '.txt', '.yaml', '.yml', '.json', '.typ']);
const MEDIA_TYPES = new Map([
  ['image/jpeg', { type: 'image', ext: '.jpg' }],
  ['image/png', { type: 'image', ext: '.png' }],
  ['image/webp', { type: 'image', ext: '.webp' }],
  ['image/gif', { type: 'image', ext: '.gif' }],
  ['image/svg+xml', { type: 'image', ext: '.svg' }],
  ['audio/mpeg', { type: 'audio', ext: '.mp3' }],
  ['audio/wav', { type: 'audio', ext: '.wav' }],
  ['audio/x-wav', { type: 'audio', ext: '.wav' }],
  ['audio/mp4', { type: 'audio', ext: '.m4a' }],
  ['audio/ogg', { type: 'audio', ext: '.ogg' }],
  ['video/mp4', { type: 'video', ext: '.mp4' }],
  ['video/webm', { type: 'video', ext: '.webm' }],
  ['video/quicktime', { type: 'video', ext: '.mov' }]
]);
const MAX_MEDIA_BYTES = Number(process.env.PKOS_MAX_MEDIA_BYTES || 25 * 1024 * 1024);

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

function isInside(root, candidate) {
  const rel = relative(root, candidate);
  return rel === '' || (!rel.startsWith('..') && !rel.startsWith('/'));
}

function safeSourcePath(sourcePath, { textOnly = false } = {}) {
  if (!sourcePath || sourcePath.includes('\0') || sourcePath.startsWith('/')) {
    throw new Error('Invalid source path');
  }

  const resolved = join(ROOT, sourcePath);
  const rel = relative(ROOT, resolved);
  if (rel.startsWith('..') || rel.startsWith('/') || rel.split(/[\\/]/).some(part => part.startsWith('.'))) {
    throw new Error('Path escapes project root');
  }

  const approved = SOURCE_ROOTS.some(root => isInside(join(ROOT, root), resolved));
  if (!approved) {
    throw new Error('Path is outside approved source roots');
  }

  if (textOnly && !TEXT_EXTENSIONS.has(extname(resolved).toLowerCase())) {
    throw new Error('Source endpoint only supports text files');
  }

  return resolved;
}

function sourceTree() {
  const files = [];
  for (const root of SOURCE_ROOTS) {
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
        } else if (TEXT_EXTENSIONS.has(extname(path).toLowerCase()) || root === 'content/media') {
          files.push({
            path: relative(ROOT, path),
            root,
            size: stat.size,
            updated_at: stat.mtime.toISOString()
          });
        }
      }
    }
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

function sanitizeStem(name) {
  const stem = basename(String(name || 'upload'), extname(String(name || '')));
  return stem
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'upload';
}

function decodeUploadData(data) {
  const raw = String(data || '');
  const payload = raw.includes(',') ? raw.slice(raw.indexOf(',') + 1) : raw;
  return Buffer.from(payload, 'base64');
}

function rebuildMediaManifest() {
  execSync('node scripts/build-media-index.js', { stdio: 'inherit' });
}

// 异步读取 POST Body 辅助函数
function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', err => reject(err));
  });
}

// 异步核心路由处理器
export async function route(method, url, body) {
  const parsed = new URL(url, 'http://127.0.0.1');

  if (method === 'GET') {
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
      const fullPath = safeSourcePath(sourcePath, { textOnly: true });
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
  }

  // 增加 POST 支持：在线编辑与保存触发编译发布
  if (method === 'POST') {
    if (parsed.pathname === '/source/save') {
      const { path: sourcePath, text } = body;
      if (!sourcePath || text === undefined) {
        return { status: 400, body: { error: 'Missing required parameters "path" or "text".' } };
      }

      const fullPath = safeSourcePath(sourcePath, { textOnly: true });
      
      // 写入保存文件内容
      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, text, 'utf-8');
      console.log(`[local-api] Source file saved successfully: ${sourcePath}`);

      // 根据更改类型执行智能增量编译
      let compileLog = 'Saved successfully.';
      try {
        if (sourcePath.startsWith('content/decks/')) {
          console.log('[local-api] Triggering Decks increment build...');
          execSync('node scripts/build-decks.js', { stdio: 'inherit' });
          compileLog = 'File saved and decks successfully compiled.';
        } else if (sourcePath.startsWith('content/resume/')) {
          console.log('[local-api] Triggering Resume build...');
          execSync('node scripts/build-resume.js', { stdio: 'inherit' });
          compileLog = 'File saved and resume successfully compiled.';
        }
        
        // 增量重新索引搜索词条
        execSync('node scripts/build-search-index.js', { stdio: 'inherit' });
      } catch (err) {
        console.error('[local-api] Incremental compile failed:', err.message);
        compileLog = `File saved, but compilation failed: ${err.message}`;
      }

      return {
        status: 200,
        body: {
          success: true,
          message: compileLog,
          path: sourcePath
        }
      };
    }

    if (parsed.pathname === '/media/upload') {
      const { filename, mimeType, data, tags = [] } = body;
      if (!filename || !mimeType || !data) {
        return { status: 400, body: { error: 'Missing required parameters "filename", "mimeType", or "data".' } };
      }

      const spec = MEDIA_TYPES.get(String(mimeType).toLowerCase());
      if (!spec) {
        return { status: 415, body: { error: `Unsupported media type: ${mimeType}` } };
      }

      const buffer = decodeUploadData(data);
      if (!buffer.length) {
        return { status: 400, body: { error: 'Upload data is empty.' } };
      }
      if (buffer.length > MAX_MEDIA_BYTES) {
        return { status: 413, body: { error: `Upload exceeds ${MAX_MEDIA_BYTES} bytes.` } };
      }

      const hash = createHash('sha256').update(buffer).digest('hex');
      const stem = sanitizeStem(filename);
      const safeName = `${stem}-${hash.slice(0, 10)}${spec.ext}`;
      const sourceDir = join(ROOT, 'content/media', spec.type);
      mkdirSync(sourceDir, { recursive: true });
      const sourcePath = join(sourceDir, safeName);
      writeFileSync(sourcePath, buffer);
      rebuildMediaManifest();

      return {
        status: 201,
        body: {
          success: true,
          asset: {
            id: `${spec.type}:${hash.slice(0, 12)}`,
            title: stem,
            type: spec.type,
            mimeType,
            tags: Array.isArray(tags) ? tags.map(String).slice(0, 12) : [],
            sourcePath: relative(ROOT, sourcePath),
            url: `/assets/media/${spec.type}/${encodeURIComponent(safeName)}`,
            size: buffer.length,
            content_hash: `sha256:${hash}`
          }
        }
      };
    }
  }

  return { status: 404, body: { error: 'Unknown local API route or unsupported method.' } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createServer(async (req, res) => {
    try {
      let body = {};
      if (req.method === 'POST') {
        body = await getBody(req);
      }
      const result = await route(req.method, req.url, body);
      sendJson(res, result.status, result.body);
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
  }).listen(PORT, HOST, () => {
    console.log(`[local-api] listening on http://${HOST}:${PORT}`);
  });
}
