import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateContentFrontmatter,
  validateDeckManifest,
  validateResumeAsset,
  validateSemanticGraph
} from '../scripts/validate-pipeline.js';

test('rejects malformed note frontmatter fixtures', () => {
  const malformed = `---
title: "Missing date"
tags: ["知识管理"]
status: "draft"
---

# Missing Date
`;

  assert.throws(
    () => validateContentFrontmatter(malformed, 'note', 'bad-note.md'),
    /missing required field "date"/
  );
});

test('rejects deck manifests with duplicate slugs', () => {
  const manifest = {
    schema_version: 1,
    count: 2,
    decks: [
      {
        slug: 'same',
        title: 'Deck A',
        date: '2026-06-28',
        sourcePath: 'content/decks/pk-asset-os-roadmap.md',
        outputs: { html: 'public/slides/same/', pdf: 'public/assets/same.pdf' }
      },
      {
        slug: 'same',
        title: 'Deck B',
        date: '2026-06-28',
        sourcePath: 'content/decks/pk-asset-os-roadmap.md',
        outputs: { html: 'public/slides/same/', pdf: 'public/assets/same.pdf' }
      }
    ]
  };

  assert.throws(() => validateDeckManifest(manifest), /Duplicate deck slug/);
});

test('rejects semantic graph edges that point to missing nodes', () => {
  const graph = {
    nodes: [{ id: 'note:a', label: 'A', type: 'note', metadata: {} }],
    edges: [{ source: 'note:a', target: 'project:missing', weight: 1, type: 'related' }],
    metadata: { total_nodes: 1, total_edges: 1 }
  };

  assert.throws(() => validateSemanticGraph(graph), /edge target missing/);
});

test('accepts minimal valid resume asset contract', () => {
  const resume = {
    basics: { name: 'Example', email: 'example@example.com' },
    education: [],
    experience: [],
    projects: [],
    skills: []
  };

  assert.doesNotThrow(() => validateResumeAsset(resume));
});
