#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const VALID_MODES = new Set(['pptx-to-pdf', 'export-pptx']);

function parseArgs(argv) {
  const args = {
    check: false,
    dryRun: false,
    input: '',
    output: '',
    mode: 'pptx-to-pdf'
  };

  for (const arg of argv) {
    if (arg === '--check') args.check = true;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg.startsWith('--input=')) args.input = arg.slice('--input='.length);
    else if (arg.startsWith('--output=')) args.output = arg.slice('--output='.length);
    else if (arg.startsWith('--mode=')) args.mode = arg.slice('--mode='.length);
    else if (arg === '--help' || arg === '-h') args.help = true;
    else args.unknown = [...(args.unknown || []), arg];
  }

  return args;
}

export function checkEnvironment(env = process.env, platform = process.platform) {
  const isMacOS = platform === 'darwin';
  const keynotePath = '/Applications/Keynote.app';
  const hasKeynote = isMacOS && existsSync(keynotePath);
  const osascript = spawnSync('osascript', ['-e', 'return "ok"'], {
    encoding: 'utf-8'
  });
  const hasOsascript = osascript.status === 0;
  const hasGuiSession = Boolean(env.DISPLAY || env.__CF_USER_TEXT_ENCODING || env.TERM_PROGRAM);

  return {
    ok: isMacOS && hasKeynote && hasOsascript && hasGuiSession,
    checks: {
      macos: isMacOS,
      keynote: hasKeynote,
      keynote_path: hasKeynote ? keynotePath : null,
      osascript: hasOsascript,
      gui_session_hint: hasGuiSession
    },
    notes: [
      isMacOS ? 'macOS detected.' : 'Keynote automation requires macOS.',
      hasKeynote ? 'Keynote.app found.' : 'Keynote.app was not found in /Applications.',
      hasOsascript ? 'osascript is available.' : 'osascript is unavailable or refused execution.',
      hasGuiSession
        ? 'A GUI session hint is present; Automation permission may still need manual approval.'
        : 'No GUI session hint detected; Keynote export needs an interactive desktop session.',
      'This adapter is a safety skeleton: it does not drive the Keynote GUI.'
    ]
  };
}

function printHelp() {
  console.log([
    'Usage: node scripts/keynote-adapter.js [--check] [--dry-run] [--input=deck.pptx] [--output=deck.pdf] [--mode=pptx-to-pdf|export-pptx]',
    '',
    'This is a safe Keynote adapter skeleton. It performs environment checks and dry-run validation only.'
  ].join('\n'));
}

function validateExportArgs(args) {
  const errors = [];

  if (!VALID_MODES.has(args.mode)) {
    errors.push(`Unsupported mode "${args.mode}". Expected one of: ${[...VALID_MODES].join(', ')}`);
  }
  if (!args.input) errors.push('Missing --input.');
  if (!args.output) errors.push('Missing --output.');
  if (args.input && !existsSync(resolve(args.input))) errors.push(`Input file does not exist: ${args.input}`);
  if (args.mode === 'pptx-to-pdf' && args.output && extname(args.output).toLowerCase() !== '.pdf') {
    errors.push('pptx-to-pdf mode requires a .pdf output path.');
  }
  if (args.mode === 'export-pptx' && args.output && extname(args.output).toLowerCase() !== '.pptx') {
    errors.push('export-pptx mode requires a .pptx output path.');
  }

  return errors;
}

export function run(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);

  if (args.help) {
    printHelp();
    return 0;
  }

  if (args.unknown?.length) {
    console.error(`[keynote-adapter] Unknown argument(s): ${args.unknown.join(', ')}`);
    printHelp();
    return 2;
  }

  const environment = checkEnvironment();

  if (args.check || (!args.input && !args.output)) {
    console.log(JSON.stringify({
      tool: 'keynote-adapter',
      action: 'check',
      ...environment
    }, null, 2));
    return 0;
  }

  const validationErrors = validateExportArgs(args);
  if (validationErrors.length) {
    console.error(`[keynote-adapter] Refusing export:\n- ${validationErrors.join('\n- ')}`);
    return 2;
  }

  const summary = {
    tool: 'keynote-adapter',
    action: args.dryRun ? 'dry-run' : 'refused',
    mode: args.mode,
    input: resolve(args.input),
    output: resolve(args.output),
    environment
  };

  if (args.dryRun) {
    console.log(JSON.stringify({
      ...summary,
      would_run: 'Keynote GUI export would be requested after explicit human approval in a future implementation.'
    }, null, 2));
    return 0;
  }

  console.error(JSON.stringify({
    ...summary,
    reason: 'Real Keynote GUI automation is intentionally disabled in this safety skeleton. Re-run with --dry-run to validate inputs.'
  }, null, 2));
  return 1;
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  process.exit(run());
}
