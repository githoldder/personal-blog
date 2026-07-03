#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public/assets');
const ZIP_PATH = join(OUT_DIR, 'resume-package.zip');
const MANIFEST_PATH = join(OUT_DIR, 'resume-package-manifest.json');

const files = [
  'content/resume/resume.yaml',
  'content/resume/template.typ',
  'content/resume/evidence-manifest.json',
  'public/assets/resume.json',
  'public/assets/resume.pdf'
];

function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const manifest = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    privacy: 'Evidence source files are excluded; this package contains only resume data, template, manifest and generated public outputs.',
    files: files.filter(file => existsSync(join(ROOT, file)))
  };
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');

  try {
    execFileSync('zip', ['-q', '-j', ZIP_PATH, MANIFEST_PATH, ...manifest.files.map(file => join(ROOT, file))], {
      cwd: ROOT,
      stdio: 'inherit'
    });
    console.log(`[build-resume-package] Wrote ${ZIP_PATH}`);
  } catch (error) {
    rmSync(ZIP_PATH, { force: true });
    console.warn('[build-resume-package] zip CLI unavailable or failed; manifest was still generated.');
    console.warn(`[build-resume-package] ${error.message}`);
  }
}

main();
