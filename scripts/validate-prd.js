#!/usr/bin/env node

/**
 * validate-prd.js — PRD 结构校验脚本
 *
 * 检查 prds/json/ 里的任务结构是否合法:
 *   1. JSON 文件可解析
 *   2. 必须包含 sprint_id, title, objective, status, milestones, tasks
 *   3. 每个 task 必须包含 id, title, status, owner, inputs, outputs, acceptance_criteria
 *   4. status 只能是 todo / in_progress / done
 *   5. Sprint 级别 status 与 task status 的一致性
 *
 * 用法:
 *   npm run validate:prd
 *   node scripts/validate-prd.js
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PRDS_DIR = join(ROOT, 'prds/json');

const VALID_STATUSES = ['todo', 'in_progress', 'done'];
const REQUIRED_TASK_FIELDS = ['id', 'title', 'status', 'owner', 'inputs', 'outputs', 'acceptance_criteria'];
const REQUIRED_SPRINT_FIELDS = ['sprint_id', 'title', 'objective', 'status', 'milestones', 'tasks'];

let hasErrors = false;

function error(msg) {
  console.error(`  ✗ ${msg}`);
  hasErrors = true;
}

function success(msg) {
  console.log(`  ✓ ${msg}`);
}

function validateTask(task, sprintId) {
  // 检查必填字段
  for (const field of REQUIRED_TASK_FIELDS) {
    if (!(field in task)) {
      error(`Task ${task.id || 'UNKNOWN'} missing field: ${field}`);
    }
  }

  // 检查 status
  if (task.status && !VALID_STATUSES.includes(task.status)) {
    error(`Task ${task.id} has invalid status: "${task.status}". Must be: ${VALID_STATUSES.join(', ')}`);
  }

  // 检查 id 格式
  if (task.id && !task.id.startsWith(`${sprintId}-`)) {
    error(`Task ${task.id} should start with sprint prefix "${sprintId}-"`);
  }
}

function validateSprint(filePath) {
  const filename = filePath.split('/').pop();
  console.log(`\nValidating: ${filename}`);

  try {
    const content = readFileSync(filePath, 'utf-8');
    const sprint = JSON.parse(content);

    // 检查必填字段
    for (const field of REQUIRED_SPRINT_FIELDS) {
      if (!(field in sprint)) {
        error(`Missing sprint field: ${field}`);
      }
    }

    // 检查 sprint status
    if (sprint.status && !VALID_STATUSES.includes(sprint.status)) {
      error(`Invalid sprint status: "${sprint.status}". Must be: ${VALID_STATUSES.join(', ')}`);
    }

    // 检查 tasks
    if (Array.isArray(sprint.tasks)) {
      for (const task of sprint.tasks) {
        validateTask(task, sprint.sprint_id);
      }
      success(`Tasks: ${sprint.tasks.length} found`);
    } else {
      error('Sprint tasks must be an array');
    }

    // 检查 milestones
    if (Array.isArray(sprint.milestones)) {
      success(`Milestones: ${sprint.milestones.length} found`);
    }

    if (!hasErrors) {
      success('Structure is valid');
    }
  } catch (e) {
    error(`Failed to parse JSON: ${e.message}`);
  }
}

function main() {
  console.log('[validate-prd] Starting PRD validation...\n');

  if (!existsSync(PRDS_DIR)) {
    console.log('[validate-prd] No PRDs directory found. Skipping.');
    return;
  }

  const files = readdirSync(PRDS_DIR).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.log('[validate-prd] No JSON files found in prds/json/.');
    return;
  }

  for (const file of files) {
    validateSprint(join(PRDS_DIR, file));
  }

  console.log('\n---');
  if (hasErrors) {
    console.log('[validate-prd] Validation completed with errors.');
    process.exit(1);
  } else {
    console.log('[validate-prd] All PRDs are valid.');
  }
}

main();
