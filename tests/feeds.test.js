import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

import {
  parseLocalDate,
  toRFC822,
  toISO8601,
  escapeCdata,
  isPublishableStatus
} from '../scripts/build-feeds.js';

test('parseLocalDate parses YYYY-MM-DD to UTC midnight (GMT+8 08:00)', () => {
  const date = parseLocalDate('2026-06-30');
  
  assert.equal(date.getUTCFullYear(), 2026);
  assert.equal(date.getUTCMonth(), 5); // 0-indexed, so June is 5
  assert.equal(date.getUTCDate(), 30);
  assert.equal(date.getUTCHours(), 0);
  assert.equal(date.getUTCMinutes(), 0);
});

test('toRFC822 formats date consistently as Asia/Shanghai (+0800)', () => {
  // 建立一个明确的时间 Date (UTC 2026-06-30 00:00:00)
  const date = new Date(Date.UTC(2026, 5, 30, 0, 0, 0));
  const rfc = toRFC822(date);
  
  // 期待格式化为北京时间 2026-06-30 08:00:00
  assert.match(rfc, /Tue, 30 Jun 2026 08:00:00 \+0800/);
});

test('toISO8601 formats date consistently as Asia/Shanghai (+08:00)', () => {
  const date = new Date(Date.UTC(2026, 5, 30, 0, 0, 0));
  const iso = toISO8601(date);
  
  // 期待格式化为北京时间
  assert.equal(iso, '2026-06-30T08:00:00+08:00');
});

test('escapeCdata escapes CDATA end tag boundary', () => {
  const unsafe = 'This contains ]]> end tag';
  const safe = escapeCdata(unsafe);
  
  assert.equal(safe, 'This contains ]]]]><![CDATA[> end tag');
});

test('isPublishableStatus only allows explicit public feed statuses', () => {
  assert.equal(isPublishableStatus(undefined), false);
  assert.equal(isPublishableStatus(''), false);
  assert.equal(isPublishableStatus('published'), true);
  assert.equal(isPublishableStatus('done'), true);
  assert.equal(isPublishableStatus(' DONE '), true);

  assert.equal(isPublishableStatus('active'), false);
  assert.equal(isPublishableStatus('draft'), false);
  assert.equal(isPublishableStatus('todo'), false);
  assert.equal(isPublishableStatus('in_progress'), false);
});

test('generated feeds include public project and exclude draft note', () => {
  execFileSync('node', ['scripts/build-feeds.js'], { encoding: 'utf-8' });

  const rss = readFileSync('public/rss.xml', 'utf-8');
  const atom = readFileSync('public/atom.xml', 'utf-8');

  assert.match(rss, /<item>/);
  assert.match(atom, /<entry>/);

  assert.match(rss, /https:\/\/[^/]+\/projects\/personal-knowledge-asset-os\//);
  assert.match(atom, /https:\/\/[^/]+\/projects\/personal-knowledge-asset-os\//);
 
  assert.doesNotMatch(rss, /https:\/\/[^/]+\/notes\/2026-06-26-personal-knowledge-asset-os\//);
  assert.doesNotMatch(atom, /https:\/\/[^/]+\/notes\/2026-06-26-personal-knowledge-asset-os\//);
});

test('generated search index excludes draft note and includes done project', () => {
  execFileSync('node', ['scripts/build-search-index.js'], { encoding: 'utf-8' });
  const index = JSON.parse(readFileSync('public/assets/search-index.json', 'utf-8'));
  
  const hasDraftNote = index.some(item => item.id === 'note:2026-06-26-personal-knowledge-asset-os');
  const hasDoneProject = index.some(item => item.id === 'project:personal-knowledge-asset-os');
  
  assert.equal(hasDraftNote, false);
  assert.equal(hasDoneProject, true);
});
