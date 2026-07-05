#!/usr/bin/env node

import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CANDIDATE_DIRS = [
  'dist',
  'public',
  'public/assets',
  'public/assets/decks',
  'public/assets/media',
  'public/decks',
  'public/slides'
];
const REQUIRED_APPROVE_ENV = [
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_PROJECT_NAME',
  'S17_PUBLISH_APPROVED',
  'S17_CLEAN_BUILD'
];

function parseArgs(argv) {
  const args = { dryRun: false, approve: false };
  for (const arg of argv) {
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--approve') args.approve = true;
    else if (arg === '--help' || arg === '-h') args.help = true;
    else args.unknown = [...(args.unknown || []), arg];
  }
  return args;
}

function walkFiles(dir, limit, root, out = []) {
  if (out.length >= limit || !existsSync(dir)) return out;

  for (const entry of readdirSync(dir).sort()) {
    if (out.length >= limit) break;
    if (entry.startsWith('.')) continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walkFiles(fullPath, limit, root, out);
    } else {
      out.push({
        path: relative(root, fullPath),
        bytes: stat.size
      });
    }
  }

  return out;
}

export function collectPublishCandidates(root = ROOT, limitPerDir = 24) {
  return CANDIDATE_DIRS.map((dir) => {
    const absolute = join(root, dir);
    const exists = existsSync(absolute);
    return {
      dir,
      exists,
      files: exists ? walkFiles(absolute, limitPerDir, root) : []
    };
  });
}

export function approvalGate(env = process.env) {
  const missing = REQUIRED_APPROVE_ENV.filter((name) => !env[name]);
  const invalid = [];

  if (env.S17_PUBLISH_APPROVED && env.S17_PUBLISH_APPROVED !== 'true') {
    invalid.push('S17_PUBLISH_APPROVED must be exactly "true".');
  }
  if (env.S17_CLEAN_BUILD && env.S17_CLEAN_BUILD !== 'true') {
    invalid.push('S17_CLEAN_BUILD must be exactly "true".');
  }

  return {
    ok: missing.length === 0 && invalid.length === 0,
    missing,
    invalid
  };
}

function printHelp() {
  console.log([
    'Usage: node scripts/publish-cloudflare.js --dry-run|--approve',
    '',
    '--dry-run lists publish candidates under dist/public/assets/decks/media paths.',
    '--approve validates explicit Cloudflare and clean-build gates, but this skeleton does not publish.'
  ].join('\n'));
}

export function run(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);

  if (args.help) {
    printHelp();
    return 0;
  }
  if (args.unknown?.length) {
    console.error(`[publish-cloudflare] Unknown argument(s): ${args.unknown.join(', ')}`);
    printHelp();
    return 2;
  }
  if (args.dryRun === args.approve) {
    console.error('[publish-cloudflare] Choose exactly one of --dry-run or --approve.');
    return 2;
  }

  const candidates = collectPublishCandidates();

  if (args.dryRun) {
    console.log(JSON.stringify({
      tool: 'publish-cloudflare',
      action: 'dry-run',
      remote_publish: false,
      candidates
    }, null, 2));
    return 0;
  }

  const gate = approvalGate();
  if (!gate.ok) {
    console.error(JSON.stringify({
      tool: 'publish-cloudflare',
      action: 'approve',
      remote_publish: false,
      status: 'refused',
      reason: 'Explicit publish environment and clean-build gates are incomplete.',
      required_env: REQUIRED_APPROVE_ENV,
      missing_env: gate.missing,
      invalid_env: gate.invalid
    }, null, 2));
    return 1;
  }

  console.log(JSON.stringify({
    tool: 'publish-cloudflare',
    action: 'approve',
    remote_publish: false,
    status: 'ready-but-not-published',
    reason: 'Safety skeleton validated approval gates but intentionally does not call wrangler or Cloudflare APIs.',
    candidates
  }, null, 2));
  return 0;
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  process.exit(run());
}
