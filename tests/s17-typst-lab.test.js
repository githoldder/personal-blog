import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf-8');
}

test('Typst lab page exposes the local workbench contract', () => {
  const source = read('src/pages/lab/typst.astro');

  assert.match(source, /data-typst-lab/);
  assert.match(source, /Files/);
  assert.match(source, /Editor/);
  assert.match(source, /Preview/);
  assert.match(source, /Build Log/);
  assert.match(source, /Help/);

  assert.match(source, /content\/resume\/resume\.yaml/);
  assert.match(source, /content\/resume\/template\.typ/);
  assert.match(source, /\/assets\/resume\.pdf/);

  assert.match(source, /fetch\('\/source\/tree'\)/);
  assert.match(source, /fetch\(`\/source\/file\?path=\$\{encodeURIComponent\(path\)\}`\)/);
  assert.match(source, /fetch\('\/source\/save'/);

  assert.match(source, /https:\/\/typst\.app\/docs\/reference\/syntax\//);
  assert.match(source, /https:\/\/typst\.app\/docs\/reference\//);
  assert.match(source, /https:\/\/typst\.app\/docs\/reference\/layout\//);
  assert.match(source, /https:\/\/typst\.app\/docs\/reference\/text\//);

  assert.match(source, /caolei/);
  assert.match(source, /githoldder/);
  assert.doesNotMatch(source, /曹磊/);
});
