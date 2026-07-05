#!/usr/bin/env node

import { readFileSync, existsSync, mkdirSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname, basename, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const INPUT_DIR = join(ROOT, 'content/decks');
const OUTPUT_SLIDES = join(ROOT, 'public/slides');
const OUTPUT_ASSETS = join(ROOT, 'public/assets');
const OUTPUT_DECK_ASSETS = join(OUTPUT_ASSETS, 'decks');
const OUTPUT_MANIFEST = join(OUTPUT_DECK_ASSETS, 'manifest.json');
const PUBLIC_HANDLE = 'githoldder';

function publicAlias(value) {
  return String(value || '').replace(/曹磊/g, PUBLIC_HANDLE);
}

export function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseDeckFrontmatter(filePath) {
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

export function contentHashFor(raw) {
  return `sha256:${createHash('sha256').update(raw).digest('hex')}`;
}

export function formatsForDeck(slug) {
  return {
    html: {
      path: `public/slides/${slug}/`,
      url: `/slides/${slug}/`
    },
    pdf: {
      path: `public/assets/${slug}.pdf`,
      url: `/assets/${slug}.pdf`
    },
    pptx: {
      path: `public/assets/${slug}.pptx`,
      url: `/assets/${slug}.pptx`
    }
  };
}

export function normalizeDeck(file) {
  const filePath = isAbsolute(file) ? file : join(INPUT_DIR, file);
  const raw = readFileSync(filePath, 'utf-8');
  const metadata = parseDeckFrontmatter(filePath);
  const fallbackSlug = slugify(basename(file, '.md'));
  const slug = metadata.slug ? slugify(String(metadata.slug)) : fallbackSlug;
  const title = metadata.title ? publicAlias(metadata.title).trim() : '';
  const date = metadata.date ? String(metadata.date).trim() : '';
  const formats = formatsForDeck(slug);
  const buildLog = `public/assets/decks/${slug}.build.log`;

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
    content_hash: contentHashFor(raw),
    updated_at: statSync(filePath).mtime.toISOString(),
    formats,
    build_log: buildLog,
    outputs: {
      html: formats.html.path,
      pdf: formats.pdf.path
    },
    build: {
      status: 'pending',
      engine: 'slidev',
      log: buildLog,
      requires: '@slidev/cli',
      notes: 'S03-T03 only defines the deterministic manifest; Slidev HTML/PDF export is handled by a later build step.'
    },
    export: {
      status: 'not_requested',
      adapter: 'scripts/keynote-adapter.js',
      modes: ['pptx-to-pdf', 'export-pptx']
    },
    keynote: {
      status: 'not_checked',
      safe_adapter: 'scripts/keynote-adapter.js'
    },
    publish: {
      status: 'not_requested',
      adapter: 'scripts/publish-cloudflare.js',
      remote_publish: false
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

  // 检测全局 slidev 可用性
  let slidevAvailable = false;
  try {
    const stdout = execSync('slidev --version', { encoding: 'utf-8' });
    console.log(`[build-decks] Found global Slidev CLI version: ${stdout.trim()}`);
    slidevAvailable = true;
  } catch (e) {
    console.warn('[build-decks] WARNING: global "slidev" CLI is not available. Slidev compile will be skipped.');
  }

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

    // 针对不同类型的 Deck 执行具体的物理静态生成
    if (deck.slug === 'resume-presentation') {
      console.log(`[build-decks] Processing PPTX resume presentation: ${deck.slug}`);
      const slideDir = join(ROOT, 'public/slides', deck.slug);
      if (!existsSync(slideDir)) {
        mkdirSync(slideDir, { recursive: true });
      }
      
      // 生成优雅的 PDF 全屏预览 iframe HTML 页面
      const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${PUBLIC_HANDLE} - 个人简历演示文稿</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .header {
      height: 48px;
      background-color: #1e293b;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      font-size: 14px;
    }
    .header a {
      color: #38bdf8;
      text-decoration: none;
      font-weight: bold;
      border: 1px solid #38bdf8;
      padding: 4px 12px;
      border-radius: 4px;
      transition: all 0.2s;
    }
    .header a:hover {
      background-color: #38bdf8;
      color: #1e293b;
    }
    iframe {
      width: 100%;
      height: calc(100% - 48px);
      border: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <span>🎴 ${PUBLIC_HANDLE} — 个人求职简历 PPTX 展示</span>
    <a href="/assets/resume-presentation.pdf" download>下载 PDF 💾</a>
  </div>
  <iframe src="/assets/resume-presentation.pdf"></iframe>
</body>
</html>
      `.trim();
      
      writeFileSync(join(slideDir, 'index.html'), htmlContent, 'utf-8');
      deck.build.status = 'success';
      deck.build.notes = 'PPTX presentation mapped to PDF with custom iframe viewer.';
    } else if (slidevAvailable) {
      console.log(`[build-decks] Compiling Slidev deck: ${deck.slug} via global Slidev CLI...`);
      try {
        const slideDir = join(ROOT, 'public/slides', deck.slug);
        const sourceFile = join(ROOT, deck.sourcePath);
        
        // 执行 slidev build 编译
        execSync(`slidev build "${sourceFile}" --out "${slideDir}" --base "/slides/${deck.slug}/"`, { stdio: 'inherit' });
        console.log(`[build-decks] Slidev compilation succeeded for ${deck.slug}`);
        
        deck.build.status = 'success';
        deck.build.notes = 'Successfully compiled via Slidev CLI.';
      } catch (err) {
        console.error(`[build-decks] Slidev compilation failed for ${deck.slug}:`, err.message);
        deck.build.status = 'failed';
        deck.build.notes = `Compilation failed: ${err.message}`;
      }
    } else {
      console.log(`[build-decks] Slidev CLI missing. Skipped compile for: ${deck.slug}`);
    }

    writeFileSync(join(ROOT, deck.build_log), [
      `deck=${deck.slug}`,
      `status=${deck.build.status}`,
      `engine=${deck.build.engine}`,
      `notes=${deck.build.notes}`
    ].join('\n') + '\n', 'utf-8');

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

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
