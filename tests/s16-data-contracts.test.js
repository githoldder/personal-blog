import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { buildBookActions, parseAnnotatorFile } from '../scripts/build-library-index.js';
import { contentHashFor, normalizeDeck } from '../scripts/build-decks.js';
import { validateDeckManifest } from '../scripts/validate-pipeline.js';
import { styleVarsForTheme, themeFromTags } from '../src/lib/themeTaxonomy.ts';

const root = process.cwd();

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf-8');
}

test('theme taxonomy maps known tags and falls back to the default field', () => {
  assert.equal(themeFromTags(['GTD', '010_时间管理']), 'planning');
  assert.equal(themeFromTags(['Obsidian', 'canvas']), 'systems');
  assert.equal(themeFromTags(['React', '软件工程']), 'engineering');
  assert.equal(themeFromTags(['日语', '语法']), 'language');
  assert.equal(themeFromTags(['unexpected-private-tag']), 'default');

  assert.match(styleVarsForTheme('default'), /--theme-a:/);
  assert.match(styleVarsForTheme('default'), /--theme-b:/);
  assert.match(styleVarsForTheme('not-a-theme'), /--theme-grid:/);
});

test('Canvas viewer contract does not render synthetic TEXT FILE LINK labels', () => {
  const viewerSource = read('public/viewers/canvas.html');

  assert.doesNotMatch(viewerSource, /canvas-node-type/);
  assert.doesNotMatch(viewerSource, /node\.type\.toUpperCase/);
  assert.doesNotMatch(viewerSource, /React\.createElement\([^)]*['"`](?:TEXT|FILE|LINK)['"`]/);

  assert.match(viewerSource, /edge\.label/);
  assert.match(viewerSource, /markerEnd/);
  assert.match(viewerSource, /node\.type === 'group'/);
  assert.match(viewerSource, /borderColor/);
});

test('library book actions always expose source and annotator targets with fallbacks', () => {
  const openLibraryBook = {
    slug: 'book-博弈论',
    openLibraryUrl: 'https://openlibrary.org/works/OL123W',
    pdfAsset: '/assets/pdfs/book-book-博弈论.pdf'
  };
  assert.deepEqual(buildBookActions(openLibraryBook), {
    source: {
      label: '看原书/书目来源',
      href: 'https://openlibrary.org/works/OL123W',
      kind: 'open-library'
    },
    annotator: {
      label: '看我的 annotator 笔记',
      href: '/notes/book-博弈论/',
      kind: 'annotator'
    }
  });

  const coverlessLocalBook = {
    slug: 'book-coverless',
    openLibraryUrl: '',
    pdfAsset: '/assets/pdfs/book-coverless.pdf'
  };
  assert.equal(buildBookActions(coverlessLocalBook).source.href, '/assets/pdfs/book-coverless.pdf');
  assert.equal(buildBookActions(coverlessLocalBook).source.kind, 'pdf');

  const annotatorOnlyBook = { slug: 'book-note-only' };
  assert.equal(buildBookActions(annotatorOnlyBook).source.href, '/notes/book-note-only/');
  assert.equal(buildBookActions(annotatorOnlyBook).source.kind, 'annotator-fallback');
});

test('annotator extraction preserves quote, page and text position selectors', () => {
  const raw = [
    '>```annotation-json',
    '>{"target":{"source":"book.pdf#page=12","selector":[{"type":"TextQuoteSelector","exact":"核心摘录","prefix":"前文","suffix":"后文"},{"type":"TextPositionSelector","start":42,"end":56}]}}',
    '>```',
    '>%%COMMENT%%',
    '>这条批注应该成为 annotator note 动作的目标内容。',
    '>%%TAGS%%'
  ].join('\n');

  const parsed = parseAnnotatorFile(raw);
  assert.equal(parsed.annotations.length, 1);
  assert.equal(parsed.annotations[0].quote, '核心摘录');
  assert.equal(parsed.annotations[0].page, 12);
  assert.equal(parsed.annotations[0].positionStart, 42);
  assert.equal(parsed.annotations[0].positionEnd, 56);
  assert.match(parsed.annotations[0].comment, /annotator note/);
});

test('deck manifest entries expose formats, content_hash and build_log contract', () => {
  const deck = normalizeDeck('pk-asset-os-roadmap.md');
  const raw = read(deck.sourcePath);

  assert.equal(deck.content_hash, contentHashFor(raw));
  assert.match(deck.content_hash, /^sha256:[a-f0-9]{64}$/);
  assert.equal(Number.isNaN(Date.parse(deck.updated_at)), false);
  assert.equal(deck.formats.html.path, `public/slides/${deck.slug}/`);
  assert.equal(deck.formats.html.url, `/slides/${deck.slug}/`);
  assert.equal(deck.formats.pdf.path, `public/assets/${deck.slug}.pdf`);
  assert.equal(deck.formats.pptx.path, `public/assets/${deck.slug}.pptx`);
  assert.equal(deck.build.log, deck.build_log);

  assert.doesNotThrow(() => validateDeckManifest({
    schema_version: 1,
    count: 1,
    decks: [deck]
  }, root, { requireS16DeckFields: true }));
});

test('public identity artifacts do not use the Chinese real name as site brand', () => {
  const resume = JSON.parse(read('public/assets/resume.json'));
  assert.notEqual(resume.basics.name, '曹磊');
  assert.match(resume.basics.name, /^(caolei|githoldder)$/);

  const publicTextFiles = [];
  const visit = (dir) => {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        visit(fullPath);
      } else if (/\.(?:html|xml|json|txt|js|css|svg)$/.test(entry)) {
        publicTextFiles.push(fullPath);
      }
    }
  };

  if (existsSync(join(root, 'public'))) {
    visit(join(root, 'public'));
  }

  for (const filePath of publicTextFiles) {
    assert.doesNotMatch(readFileSync(filePath, 'utf-8'), /曹磊/, filePath);
  }
});
