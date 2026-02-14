import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { writeFakeExecutable } from './test-fixtures.mjs';
import { installTempDirectoryCleanup } from './temp-directory-cleanup.mjs';
import { parseReleaseChecklistArgs, resolveReleaseChecklistTimeoutFromEnv } from './release-checklist-dry-run.mjs';

const RELEASE_CHECKLIST_SCRIPT_PATH = path.resolve('scripts/release-checklist-dry-run.mjs');
installTempDirectoryCleanup(fs);

function createTempWorkspace() {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'release-checklist-dry-run-'));
  fs.mkdirSync(path.join(tempDirectory, 'packages', 'api'), { recursive: true });
  fs.mkdirSync(path.join(tempDirectory, 'packages', 'cli'), { recursive: true });
  return fs.realpathSync(tempDirectory);
}

test('parseReleaseChecklistArgs supports timeout and help flags', () => {
  assert.deepEqual(parseReleaseChecklistArgs([]), { showHelp: false, timeoutMsOverride: '' });
  assert.deepEqual(parseReleaseChecklistArgs(['--timeout-ms', '5000']), { showHelp: false, timeoutMsOverride: '5000' });
  assert.deepEqual(parseReleaseChecklistArgs(['--timeout-ms=7000']), { showHelp: false, timeoutMsOverride: '7000' });
  assert.deepEqual(parseReleaseChecklistArgs(['--help']), { showHelp: true, timeoutMsOverride: '' });
  assert.deepEqual(parseReleaseChecklistArgs(['--timeout-ms', '5000', '--help']), { showHelp: true, timeoutMsOverride: '' });
});

test('parseReleaseChecklistArgs rejects malformed and duplicate arguments', () => {
  assert.throws(() => parseReleaseChecklistArgs('--help'), /Expected argv to be an array\./u);
  assert.throws(() => parseReleaseChecklistArgs(['--help', 3]), /Expected argv\[1\] to be a string\./u);
  assert.throws(() => parseReleaseChecklistArgs(['--unknown']), /Unknown argument: --unknown/u);
  assert.throws(() => parseReleaseChecklistArgs(['--timeout-ms', '5000', '--timeout-ms=6000']), /Duplicate --timeout-ms flag received\./u);
  assert.throws(() => parseReleaseChecklistArgs(['--timeout-ms']), /Missing value for --timeout-ms argument\./u);
  assert.throws(() => parseReleaseChecklistArgs(['--timeout-ms=']), /Missing value for --timeout-ms argument\./u);
  assert.throws(() => parseReleaseChecklistArgs(['--timeout-ms==5000']), /Malformed inline value for --timeout-ms argument\./u);
});

test('release checklist dry-run prints usage for --help', () => {
  const result = spawnSync(process.execPath, [RELEASE_CHECKLIST_SCRIPT_PATH, '--help'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/u);
  assert.equal(result.stderr, '');
});

test('release checklist dry-run executes npm publish dry-run for api and cli', () => {
  const tempDirectory = createTempWorkspace();
  const executionLogPath = path.join(tempDirectory, 'dry-run.log');
  const fakeBinDirectory = writeFakeExecutable(
    tempDirectory,
    'npm',
    `#!/usr/bin/env bash
echo "$PWD|$*" >> "$RELEASE_DRY_RUN_LOG"
exit 0
`,
  );

  const result = spawnSync(process.execPath, [RELEASE_CHECKLIST_SCRIPT_PATH], {
    cwd: tempDirectory,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fakeBinDirectory}:${process.env.PATH ?? ''}`,
      RELEASE_DRY_RUN_LOG: executionLogPath,
    },
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /@wasmboy\/api/u);
  assert.match(result.stdout, /@wasmboy\/cli/u);

  const commandLogLines = fs
    .readFileSync(executionLogPath, 'utf8')
    .trim()
    .split('\n');
  assert.equal(commandLogLines.length, 2);
  const expectedApiCwd = path.join(tempDirectory, 'packages', 'api');
  const expectedCliCwd = path.join(tempDirectory, 'packages', 'cli');
  assert.equal(commandLogLines[0], `${expectedApiCwd}|publish --dry-run --access public`);
  assert.equal(commandLogLines[1], `${expectedCliCwd}|publish --dry-run --access public`);
});

test('release checklist dry-run reports npm publish failures with package context', () => {
  const tempDirectory = createTempWorkspace();
  const executionLogPath = path.join(tempDirectory, 'dry-run.log');
  const fakeBinDirectory = writeFakeExecutable(
    tempDirectory,
    'npm',
    `#!/usr/bin/env bash
if [[ "$PWD" == *"/packages/cli" ]]; then
  echo "simulated publish dry-run failure" >&2
  exit 2
fi
echo "$PWD|$*" >> "$RELEASE_DRY_RUN_LOG"
exit 0
`,
  );

  const result = spawnSync(process.execPath, [RELEASE_CHECKLIST_SCRIPT_PATH], {
    cwd: tempDirectory,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fakeBinDirectory}:${process.env.PATH ?? ''}`,
      RELEASE_DRY_RUN_LOG: executionLogPath,
    },
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /@wasmboy\/cli/u);
  assert.match(result.stderr, /npm publish --dry-run --access public/u);
  assert.match(result.stderr, /simulated publish dry-run failure/u);

  const commandLogLines = fs
    .readFileSync(executionLogPath, 'utf8')
    .trim()
    .split('\n');
  assert.equal(commandLogLines.length, 1);
  const expectedApiCwd = path.join(tempDirectory, 'packages', 'api');
  assert.equal(commandLogLines[0], `${expectedApiCwd}|publish --dry-run --access public`);
});

test('release checklist dry-run reports timeout failures with package context', () => {
  const tempDirectory = createTempWorkspace();
  const fakeBinDirectory = writeFakeExecutable(
    tempDirectory,
    'npm',
    `#!/usr/bin/env bash
sleep 0.2
exit 0
`,
  );

  const result = spawnSync(process.execPath, [RELEASE_CHECKLIST_SCRIPT_PATH], {
    cwd: tempDirectory,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fakeBinDirectory}:${process.env.PATH ?? ''}`,
      RELEASE_CHECKLIST_NPM_TIMEOUT_MS: '50',
    },
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /npm publish --dry-run --access public/u);
  assert.match(result.stderr, /timed out/u);
  assert.match(result.stderr, /@wasmboy\/api/u);
});

test('resolveReleaseChecklistTimeoutFromEnv parses and validates environment overrides', () => {
  assert.equal(resolveReleaseChecklistTimeoutFromEnv({}), 120000);
  assert.equal(resolveReleaseChecklistTimeoutFromEnv({ RELEASE_CHECKLIST_NPM_TIMEOUT_MS: ' 8000 ' }), 8000);
  assert.equal(resolveReleaseChecklistTimeoutFromEnv({}, '7000'), 7000);
  assert.equal(resolveReleaseChecklistTimeoutFromEnv({ RELEASE_CHECKLIST_NPM_TIMEOUT_MS: '8000' }, '7000'), 7000);
  assert.throws(
    () => resolveReleaseChecklistTimeoutFromEnv({ RELEASE_CHECKLIST_NPM_TIMEOUT_MS: '0' }),
    /Invalid RELEASE_CHECKLIST_NPM_TIMEOUT_MS value: 0/u,
  );
  assert.throws(() => resolveReleaseChecklistTimeoutFromEnv({}, '0'), /Invalid --timeout-ms value: 0/u);
  assert.throws(
    () => resolveReleaseChecklistTimeoutFromEnv({ RELEASE_CHECKLIST_NPM_TIMEOUT_MS: 'NaN' }),
    /Invalid RELEASE_CHECKLIST_NPM_TIMEOUT_MS value: NaN/u,
  );
});
