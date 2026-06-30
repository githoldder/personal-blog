import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseLocalDate,
  toRFC822,
  toISO8601,
  escapeCdata
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
