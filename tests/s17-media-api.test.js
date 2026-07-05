import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

import { route } from '../server/local-api.js';

const ROOT = new URL('..', import.meta.url).pathname;

test('source endpoints reject traversal outside approved roots', async () => {
  await assert.rejects(
    () => route('GET', '/source/file?path=../package.json', {}),
    /escapes project root|Invalid source path/
  );

  await assert.rejects(
    () => route('POST', '/source/save', {
      path: 'package.json',
      text: '{}'
    }),
    /outside approved source roots/
  );
});

test('media upload writes approved source asset and refreshes manifest', async () => {
  const data = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>').toString('base64');
  const result = await route('POST', '/media/upload', {
    filename: 's17-test-logo.svg',
    mimeType: 'image/svg+xml',
    data,
    tags: ['test', 's17']
  });

  assert.equal(result.status, 201);
  assert.equal(result.body.success, true);
  assert.equal(result.body.asset.type, 'image');
  assert.match(result.body.asset.sourcePath, /^content\/media\/image\/s17-test-logo-/);

  const manifestPath = join(ROOT, 'public/assets/media/manifest.json');
  assert.equal(existsSync(manifestPath), true);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  assert.ok(manifest.assets.some(asset => asset.sourcePath === result.body.asset.sourcePath));

  const sourceFile = join(ROOT, result.body.asset.sourcePath);
  const publicFile = join(ROOT, result.body.asset.url.replace(/^\//, 'public/'));
  if (existsSync(sourceFile)) unlinkSync(sourceFile);
  if (existsSync(publicFile)) unlinkSync(publicFile);
  await import('../scripts/build-media-index.js').then(module => module.buildMediaIndex());
});

test('media upload rejects unsupported MIME types', async () => {
  const result = await route('POST', '/media/upload', {
    filename: 'bad.exe',
    mimeType: 'application/x-msdownload',
    data: Buffer.from('bad').toString('base64')
  });

  assert.equal(result.status, 415);
});
