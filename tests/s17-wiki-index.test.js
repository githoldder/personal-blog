import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { buildWikiIndex } from '../scripts/build-wiki-index.js';

function writeNote(dir, file, content) {
  writeFileSync(join(dir, file), content.trimStart(), 'utf-8');
}

test('builds wiki backlinks, tag co-occurrence, hotlinks, and fuzzy search fields', () => {
  const root = mkdtempSync(join(tmpdir(), 's17-wiki-index-'));
  const notesDir = join(root, 'content', 'notes');
  const outputDir = join(root, 'public', 'assets', 'wiki');
  mkdirSync(notesDir, { recursive: true });

  writeNote(
    notesDir,
    'alpha.md',
    `---
title: Alpha Note
date: 2026-07-01
tags: [Knowledge, Graph]
aliases: [Alpha Alias]
status: published
slug: alpha
---

# Alpha Heading

Alpha links to [[Beta Note|Beta]] and [Gamma](gamma.md).
`
  );

  writeNote(
    notesDir,
    'beta.md',
    `---
title: Beta Note
date: 2026-07-02
tags: [Knowledge, Search]
status: published
slug: beta
---

# Shared Topic

Beta mentions [[Alpha Alias]].
`
  );

  writeNote(
    notesDir,
    'gamma.md',
    `---
title: Gamma Note
date: 2026-07-03
tags: [Graph, Search]
status: published
slug: gamma
---

# Shared Topic

Gamma is reached through a Markdown link.
`
  );

  writeNote(
    notesDir,
    'draft.md',
    `---
title: Draft Note
date: 2026-07-04
tags: [Private]
status: draft
slug: draft
---

This should not be indexed.
`
  );

  const { graph, search } = buildWikiIndex({
    contentDir: notesDir,
    outputDir,
    now: '2026-07-05T00:00:00.000Z'
  });

  assert.equal(graph.stats.noteCount, 3);
  assert.equal(search.count, 3);
  assert.ok(readFileSync(join(outputDir, 'graph.json'), 'utf-8').includes('"slug": "alpha"'));
  assert.ok(readFileSync(join(outputDir, 'search.json'), 'utf-8').includes('"tokens"'));

  const alpha = graph.nodes.find(node => node.slug === 'alpha');
  const beta = graph.nodes.find(node => node.slug === 'beta');
  const gamma = graph.nodes.find(node => node.slug === 'gamma');

  assert.deepEqual(
    alpha.outgoing.map(link => `${link.type}:${link.targetSlug}`).sort(),
    ['markdown:gamma', 'wikilink:beta']
  );
  assert.deepEqual(
    beta.backlinks.map(link => link.sourceSlug),
    ['alpha']
  );
  assert.deepEqual(
    alpha.backlinks.map(link => link.sourceSlug),
    ['beta']
  );
  assert.ok(alpha.hotlinks.some(link => link.slug === 'beta'));
  assert.ok(gamma.related.some(link => link.slug === 'alpha'));
  assert.ok(graph.tagCooccurrence.some(pair => pair.source === 'Graph' && pair.target === 'Knowledge' && pair.count === 1));

  const alphaDoc = search.documents.find(document => document.slug === 'alpha');
  assert.ok(alphaDoc.tokens.includes('alpha'));
  assert.ok(alphaDoc.tokens.includes('knowledge'));
  assert.ok(alphaDoc.ngrams.includes('alp'));
  assert.ok(alphaDoc.foldedText.includes('alpha alias'));
  assert.deepEqual(alphaDoc.outgoingSlugs.sort(), ['beta', 'gamma']);
  assert.deepEqual(alphaDoc.backlinkSlugs, ['beta']);
  assert.equal(search.documents.some(document => document.slug === 'draft'), false);
});
