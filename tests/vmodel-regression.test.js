import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), 'utf-8');
}

test('V-model test hierarchy and case design are present', () => {
  const required = [
    'tests/v-model/00-test-strategy.md',
    'tests/v-model/01-requirements/test-cases.md',
    'tests/v-model/02-system/test-cases.md',
    'tests/v-model/03-integration/test-cases.md',
    'tests/v-model/04-component/test-cases.md',
    'tests/v-model/05-unit/test-cases.md'
  ];

  for (const file of required) {
    assert.equal(existsSync(join(root, file)), true, `${file} should exist`);
  }
});

test('local API contract and implementation preserve read-only local boundary', async () => {
  const { route } = await import('../server/local-api.js');

  assert.match(read('docs/api-contract.md'), /127\.0\.0\.1/);
  assert.match(read('docs/api-security-policy.md'), /L4/);

  const post = await route('POST', '/publish-manifest', {});
  assert.notEqual(post.status, 200);

  const saveWithoutBody = await route('POST', '/source/save', {});
  assert.equal(saveWithoutBody.status, 400);

  const sourceFile = await route('GET', '/source/file?path=content/resume/resume.yaml');
  assert.equal(sourceFile.status, 200);
  assert.equal(sourceFile.body.path, 'content/resume/resume.yaml');

  const health = await route('GET', '/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.mode, 'local-only');
});

test('resume upgrade binds modern projects to local evidence manifest', () => {
  const yaml = read('content/resume/resume.yaml');
  const manifest = JSON.parse(read('content/resume/evidence-manifest.json'));

  assert.match(yaml, /Personal Knowledge Asset OS/);
  assert.match(yaml, /LingoBridge 中文学习直播课堂 MVP/);
  assert.match(yaml, /文件处理全能助手/);
  assert.match(yaml, /D3-force/);
  assert.ok(manifest.records.some(record => record.bound_to.some(target => target.startsWith('projects'))));
  assert.equal(manifest.privacy.default_publication, 'private');
});

test('publish manifest whitelists public projection explicitly', () => {
  const manifest = JSON.parse(read('content/publish-manifest.json'));
  assert.equal(manifest.schema_version, 1);
  assert.ok(manifest.records.length >= 1);
  assert.ok(manifest.records.every(record => ['publishable', 'review', 'draft', 'private'].includes(record.status)));
});
