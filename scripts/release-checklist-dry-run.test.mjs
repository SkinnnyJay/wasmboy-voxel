import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { writeFakeExecutable } from './test-fixtures.mjs';

const RELEASE_CHECKLIST_SCRIPT_PATH = path.resolve('scripts/release-checklist-dry-run.mjs');

function createTempWorkspace() {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'release-checklist-dry-run-'));
  fs.mkdirSync(path.join(tempDirectory, 'packages', 'api'), { recursive: true });
  fs.mkdirSync(path.join(tempDirectory, 'packages', 'cli'), { recursive: true });
  return tempDirectory;
}

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
  assert.equal(commandLogLines[0], `${path.join(tempDirectory, 'packages', 'api')}|publish --dry-run --access public`);
  assert.equal(commandLogLines[1], `${path.join(tempDirectory, 'packages', 'cli')}|publish --dry-run --access public`);
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
  assert.equal(commandLogLines[0], `${path.join(tempDirectory, 'packages', 'api')}|publish --dry-run --access public`);
});
