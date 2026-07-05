import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { normalizeDeck } from '../scripts/build-decks.js';

const NODE = process.execPath;

function runScript(script, args = [], options = {}) {
  return spawnSync(NODE, [script, ...args], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf-8',
    env: {
      ...process.env,
      ...options.env
    }
  });
}

test('Cloudflare publish dry-run lists candidates without publishing', () => {
  const result = runScript('scripts/publish-cloudflare.js', ['--dry-run']);

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.action, 'dry-run');
  assert.equal(payload.remote_publish, false);
  assert.ok(payload.candidates.some((candidate) => candidate.dir === 'public/assets/decks'));
});

test('Cloudflare approve refuses missing explicit gates', () => {
  const result = runScript('scripts/publish-cloudflare.js', ['--approve'], {
    env: {
      CLOUDFLARE_ACCOUNT_ID: '',
      CLOUDFLARE_API_TOKEN: '',
      CLOUDFLARE_PROJECT_NAME: '',
      S17_PUBLISH_APPROVED: '',
      S17_CLEAN_BUILD: ''
    }
  });

  assert.notEqual(result.status, 0);
  const payload = JSON.parse(result.stderr);
  assert.equal(payload.status, 'refused');
  assert.equal(payload.remote_publish, false);
  assert.ok(payload.missing_env.includes('CLOUDFLARE_API_TOKEN'));
});

test('Keynote check reports environment status without crashing', () => {
  const result = runScript('scripts/keynote-adapter.js', ['--check']);

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.tool, 'keynote-adapter');
  assert.equal(payload.action, 'check');
  assert.equal(typeof payload.ok, 'boolean');
  assert.equal(typeof payload.checks.osascript, 'boolean');
});

test('deck manifest entries expose safe export, keynote and publish statuses', () => {
  const fixtureDir = mkdtempSync(join(tmpdir(), 's17-deck-'));
  const fixturePath = join(fixtureDir, 'safe-deck.md');
  writeFileSync(fixturePath, [
    '---',
    'title: Safe Deck',
    'date: 2026-07-05',
    'slug: safe-deck',
    '---',
    '',
    '# Safe Deck'
  ].join('\n'), 'utf-8');

  const deck = normalizeDeck(fixturePath);

  assert.equal(deck.export.status, 'not_requested');
  assert.equal(deck.keynote.status, 'not_checked');
  assert.equal(deck.publish.status, 'not_requested');
  assert.equal(deck.publish.remote_publish, false);
});
