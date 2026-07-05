#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const INPUT_YAML = join(ROOT, 'content/resume/resume.yaml');
const INPUT_TYP = join(ROOT, 'content/resume/template.typ');
const OUTPUT_DIR = join(ROOT, 'public/assets');
const OUTPUT_PDF = join(OUTPUT_DIR, 'resume.pdf');
const OUTPUT_JSON = join(OUTPUT_DIR, 'resume.json');

function validateResume(data) {
  // basics validation
  const basics = data.basics;
  if (!basics) throw new Error('Missing "basics" section');
  for (const field of ['name', 'label', 'email', 'phone']) {
    if (!basics[field]) throw new Error(`Missing field "basics.${field}"`);
  }

  // education validation
  const education = data.education;
  if (!education || !Array.isArray(education)) throw new Error('"education" must be an array');
  education.forEach((edu, idx) => {
    for (const field of ['institution', 'area', 'studyType', 'startDate', 'endDate']) {
      if (!edu[field]) throw new Error(`Missing field "education[${idx}].${field}"`);
    }
  });

  // experience validation
  const experience = data.experience;
  if (!experience || !Array.isArray(experience)) throw new Error('"experience" must be an array');
  experience.forEach((exp, idx) => {
    for (const field of ['company', 'position', 'startDate', 'endDate', 'summary', 'highlights']) {
      if (!exp[field]) throw new Error(`Missing field "experience[${idx}].${field}"`);
    }
    if (!Array.isArray(exp.highlights)) throw new Error(`"experience[${idx}].highlights" must be an array`);
  });

  // projects validation
  const projects = data.projects;
  if (!projects || !Array.isArray(projects)) throw new Error('"projects" must be an array');
  projects.forEach((proj, idx) => {
    for (const field of ['name', 'description', 'highlights', 'keywords', 'startDate', 'endDate', 'type']) {
      if (!proj[field]) throw new Error(`Missing field "projects[${idx}].${field}"`);
    }
    if (!Array.isArray(proj.highlights)) throw new Error(`"projects[${idx}].highlights" must be an array`);
    if (!Array.isArray(proj.keywords)) throw new Error(`"projects[${idx}].keywords" must be an array`);
  });

  // skills validation
  const skills = data.skills;
  if (!skills || !Array.isArray(skills)) throw new Error('"skills" must be an array');
  skills.forEach((skill, idx) => {
    for (const field of ['name', 'level', 'keywords']) {
      if (!skill[field]) throw new Error(`Missing field "skills[${idx}].${field}"`);
    }
    if (!Array.isArray(skill.keywords)) throw new Error(`"skills[${idx}].keywords" must be an array`);
  });
}

function main() {
  console.log('[build-resume] Starting validation...');

  if (!existsSync(INPUT_YAML)) {
    console.error(`[build-resume] Error: Input YAML file not found at ${INPUT_YAML}`);
    process.exit(1);
  }

  const yamlRaw = readFileSync(INPUT_YAML, 'utf-8');
  let resumeData;
  try {
    resumeData = YAML.parse(yamlRaw);
  } catch (e) {
    console.error('[build-resume] Error: YAML parse failed:', e.message);
    process.exit(1);
  }

  try {
    validateResume(resumeData);
    console.log('[build-resume] YAML validation passed.');
  } catch (e) {
    console.error('[build-resume] Validation Failed:', e.message);
    process.exit(1);
  }

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Output structured resume.json
  try {
    writeFileSync(OUTPUT_JSON, JSON.stringify(resumeData, null, 2), 'utf-8');
    console.log(`[build-resume] Structured JSON exported to ${OUTPUT_JSON}`);
  } catch (e) {
    console.error('[build-resume] Error: Failed to write JSON output:', e.message);
    process.exit(1);
  }

  // Compile PDF via Typst
  console.log('[build-resume] Compiling PDF via Typst...');
  let typstAvailable = false;
  try {
    execSync('typst --version', { stdio: 'ignore' });
    typstAvailable = true;
  } catch (e) {
    // typst CLI is not installed locally
  }

  if (typstAvailable) {
    try {
      execSync(`typst compile "${INPUT_TYP}" "${OUTPUT_PDF}"`, { cwd: dirname(INPUT_TYP), stdio: 'inherit' });
      console.log(`[build-resume] PDF resume successfully compiled to ${OUTPUT_PDF}`);
    } catch (e) {
      console.error('[build-resume] Error: Typst compilation failed:', e.message);
      process.exit(1);
    }
  } else {
    console.warn('[build-resume] WARNING: "typst" CLI is not available in this environment.');
    console.warn('[build-resume] Path to install: https://github.com/typst/typst');
    console.warn('[build-resume] PDF compilation was skipped, but validation was successful.');
  }

  // PPTX 自动化转 PDF (仅在 macOS 环境下使用 Keynote 导出)
  const PPTX_PATH = join(ROOT, 'content/resume/23030301-23软一-曹磊.pptx');
  const PPTX_OUT_PDF = join(OUTPUT_DIR, 'resume-presentation.pdf');

  if (process.platform === 'darwin' && existsSync(PPTX_PATH)) {
    console.log('[build-resume] macOS environment detected. Compiling PPTX resume presentation to PDF via Keynote AppleScript...');
    try {
      const appleScript = `
        tell application "Keynote"
          set theFile to POSIX file "${PPTX_PATH}"
          set theDoc to open theFile
          set thePDF to POSIX file "${PPTX_OUT_PDF}"
          export theDoc to thePDF as PDF
          close theDoc saving no
        end tell
      `.trim();
      execSync(`osascript -e '${appleScript}'`, { stdio: 'inherit' });
      console.log(`[build-resume] PPTX presentation successfully compiled to ${PPTX_OUT_PDF}`);
    } catch (e) {
      console.error('[build-resume] Warning: Keynote PPTX conversion failed. Ensure Keynote is installed and has GUI Scripting permissions.', e.message);
    }
  } else {
    console.log('[build-resume] Skip PPTX-to-PDF compile (non-macOS or PPTX file missing).');
  }

  console.log('[build-resume] Done.');
}

main();
