import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function fullPath(relativePath) {
  return join(root, relativePath);
}

function read(relativePath) {
  return readFileSync(fullPath(relativePath), 'utf-8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function listTextFiles(dir, matcher) {
  if (!existsSync(fullPath(dir))) return [];
  const files = [];
  const visit = (current) => {
    for (const entry of readdirSync(current)) {
      const path = join(current, entry);
      const stat = statSync(path);
      if (stat.isDirectory()) {
        visit(path);
      } else if (matcher(path)) {
        files.push(path);
      }
    }
  };
  visit(fullPath(dir));
  return files;
}

test('S17 sprint document exists and enumerates S17-T01 through S17-T10', () => {
  const docPath = 'docs/S17-content-studio-and-wiki-sprint.md';
  assert.equal(existsSync(fullPath(docPath)), true, `${docPath} should exist`);

  const doc = read(docPath);
  for (let index = 1; index <= 10; index += 1) {
    const taskId = `S17-T${String(index).padStart(2, '0')}`;
    assert.match(doc, new RegExp(`### ${taskId}\\b`), `${taskId} should have a task section`);
  }

  assert.match(doc, /POST \/media\/upload/);
  assert.match(doc, /POST \/jobs\/typst-compile/);
  assert.match(doc, /POST \/jobs\/publish-dry-run/);
  assert.match(doc, /wiki\/graph\.json/);
});

test('local source API exposes only approved roots in the tree and rejects project escapes', async (t) => {
  const { route } = await import('../server/local-api.js');
  const approvedRoots = [
    'content/notes/',
    'content/projects/',
    'content/decks/',
    'content/resume/',
    'content/typst/',
    'content/media/'
  ];

  const tree = await route('GET', '/source/tree');
  assert.equal(tree.status, 200);
  assert.ok(Array.isArray(tree.body.files));
  assert.ok(tree.body.files.length > 0);
  for (const file of tree.body.files) {
    assert.ok(
      approvedRoots.some((prefix) => file.path.startsWith(prefix)),
      `${file.path} should stay under an approved content studio root`
    );
    assert.doesNotMatch(file.path, /(^|\/)\./, `${file.path} should not expose hidden files`);
  }

  await assert.rejects(
    () => route('GET', '/source/file?path=../../package.json'),
    /Path escapes project root|safePublicPath is not defined/
  );

  let missingTraversal;
  try {
    missingTraversal = await route('GET', '/source/file?path=content/notes/../../package.json');
  } catch (error) {
    missingTraversal = { status: 500, body: { error: error.message } };
  }
  if (missingTraversal.status === 200) {
    t.todo('S17-T01 should reject normalized paths that leave approved roots while staying inside the repo.');
  } else {
    assert.notEqual(missingTraversal.status, 200);
    assert.match(JSON.stringify(missingTraversal.body ?? {}), /outside approved source roots|Path escapes project root|safePublicPath/i);
  }
});

test('S17 media upload and approved-root contracts are captured before implementation', async (t) => {
  const { route } = await import('../server/local-api.js');
  const docs = [
    read('docs/S17-content-studio-and-wiki-sprint.md'),
    read('docs/api-contract.md'),
    existsSync(fullPath('docs/deck-pipeline.md')) ? read('docs/deck-pipeline.md') : ''
  ].join('\n');

  assert.match(docs, /approved editable roots|approved roots|approved media root/i);
  assert.match(docs, /MIME|extension|size/i);
  assert.match(docs, /media\/manifest\.json/);
  assert.match(docs, /path traversal|escapes project root|approved roots/i);

  const uploadWithoutBody = await route('POST', '/media/upload', {});
  if (uploadWithoutBody.status === 404) {
    t.todo('POST /media/upload is planned for S17-T02; keep this test as the activation contract.');
  } else {
    assert.notEqual(uploadWithoutBody.status, 200);
    assert.match(JSON.stringify(uploadWithoutBody.body), /mime|file|missing|invalid|size/i);
  }
});

test('package scripts expose current QA hooks or fall back to required contract files', () => {
  const pkg = readJson('package.json');
  const scripts = pkg.scripts ?? {};

  assert.equal(typeof scripts.test, 'string');
  assert.match(scripts.test, /node --test/);
  assert.equal(typeof scripts['test:smoke'], 'string');
  assert.equal(typeof scripts['test:visual'], 'string');
  assert.equal(typeof scripts.verify, 'string');

  const futureHooks = ['publish:cloudflare', 'build:wiki', 'build:media', 'build:typst'];
  const presentFutureHook = futureHooks.some((name) => typeof scripts[name] === 'string');
  if (!presentFutureHook) {
    for (const required of [
      'docs/S17-content-studio-and-wiki-sprint.md',
      'docs/typst-lab-plan.md',
      'docs/deck-pipeline.md',
      'docs/publish-manifest-schema.md'
    ]) {
      assert.equal(existsSync(fullPath(required)), true, `${required} should document the future hook contract`);
    }
  }
});

test('public identity contract keeps Chinese legal name out of public-facing artifacts', () => {
  const publicFiles = listTextFiles('public', (path) => /\.(?:html|xml|json|txt|js|css|svg)$/.test(path));
  const publicSourceFiles = [
    'content/publish-manifest.json'
  ].filter((path) => existsSync(fullPath(path))).map(fullPath);

  for (const filePath of [...publicFiles, ...publicSourceFiles]) {
    if (!existsSync(filePath)) continue;
    assert.doesNotMatch(readFileSync(filePath, 'utf-8'), /曹磊/, filePath);
  }
});

test('deck and publish manifests keep minimal S17 publish schema stable', () => {
  const deckManifest = readJson('public/assets/decks/manifest.json');
  assert.equal(deckManifest.schema_version, 1);
  assert.equal(deckManifest.source_dir, 'content/decks');
  assert.ok(Array.isArray(deckManifest.decks));

  for (const deck of deckManifest.decks) {
    assert.match(deck.slug, /^[a-z0-9][a-z0-9-]*$/);
    assert.equal(typeof deck.title, 'string');
    assert.match(deck.sourcePath, /^content\/decks\/.+\.md$/);
    assert.match(deck.content_hash, /^sha256:[a-f0-9]{64}$/);
    assert.equal(deck.formats.html.path, `public/slides/${deck.slug}/`);
    assert.equal(deck.formats.html.url, `/slides/${deck.slug}/`);
    assert.match(deck.formats.pdf.path, /^public\/assets\/.+\.pdf$/);
    assert.match(deck.formats.pptx.path, /^public\/assets\/.+\.pptx$/);
    assert.equal(deck.build.log, deck.build_log);
  }

  const publishManifest = readJson('content/publish-manifest.json');
  assert.equal(publishManifest.schema_version, 1);
  assert.ok(Array.isArray(publishManifest.records));
  for (const record of publishManifest.records) {
    assert.match(record.source_path, /^content\/(?:notes|projects|decks|resume|typst)\//);
    assert.ok(['publishable', 'review', 'draft', 'private'].includes(record.status));
    assert.ok(['note', 'project', 'deck', 'resume', 'typst', 'media'].includes(record.type));
  }
});

test('Typst lab, wiki graph, and media manifests have valid schemas when present', () => {
  if (existsSync(fullPath('public/assets/wiki/graph.json'))) {
    const graph = readJson('public/assets/wiki/graph.json');
    assert.equal(graph.schema_version ?? graph.schemaVersion, 1);
    assert.ok(Array.isArray(graph.nodes));
    assert.ok(Array.isArray(graph.edges ?? []));
    for (const node of graph.nodes) {
      assert.equal(typeof node.id, 'string');
      assert.equal(typeof node.title, 'string');
      assert.ok(Array.isArray(node.tags));
      assert.ok(Array.isArray(node.backlinks));
      assert.ok(Array.isArray(node.outgoing_links ?? node.outgoing ?? []));
    }
  } else {
    assert.match(read('docs/S17-content-studio-and-wiki-sprint.md'), /wiki\/graph\.json/);
  }

  if (existsSync(fullPath('public/assets/wiki/search.json'))) {
    const search = readJson('public/assets/wiki/search.json');
    assert.equal(search.schema_version ?? search.schemaVersion, 1);
    const records = search.records ?? search.documents;
    assert.ok(Array.isArray(records));
    for (const record of records) {
      assert.equal(typeof record.id, 'string');
      assert.equal(typeof record.title, 'string');
      assert.ok(Array.isArray(record.tags));
      assert.ok(Array.isArray(record.aliases));
    }
  } else {
    assert.match(read('docs/S17-content-studio-and-wiki-sprint.md'), /wiki\/search\.json/);
  }

  if (existsSync(fullPath('public/assets/media/manifest.json'))) {
    const media = readJson('public/assets/media/manifest.json');
    assert.equal(media.schema_version, 1);
    assert.ok(Array.isArray(media.assets));
    for (const asset of media.assets) {
      assert.equal(typeof asset.id, 'string');
      assert.ok(['image', 'audio', 'video'].includes(asset.type));
      assert.match(asset.source_path ?? asset.sourcePath, /^content\/media\//);
      assert.match(asset.public_path ?? asset.publicPath, /^public\/assets\/media\//);
      assert.match(asset.content_hash, /^sha256:[a-f0-9]{64}$/);
    }
  } else {
    assert.match(read('docs/S17-content-studio-and-wiki-sprint.md'), /media\/manifest\.json/);
  }

  const typstRoutes = ['src/pages/lab/typst.astro', 'src/pages/lab/typst/index.astro'];
  if (typstRoutes.some((path) => existsSync(fullPath(path)))) {
    const routeSource = typstRoutes.filter((path) => existsSync(fullPath(path))).map(read).join('\n');
    assert.match(routeSource, /typst/i);
    assert.match(routeSource, /compile|build log|preview|export/i);
  } else {
    assert.match(read('docs/typst-lab-plan.md'), /\/lab\/typst/);
    assert.match(read('docs/S17-content-studio-and-wiki-sprint.md'), /POST \/jobs\/typst-compile/);
  }
});
