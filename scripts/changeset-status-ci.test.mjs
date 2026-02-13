import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);
const statusScriptPath = path.join(currentDirectory, 'changeset-status-ci.mjs');

function runStatusScript(customPath) {
  return spawnSync('node', [statusScriptPath], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: customPath,
    },
  });
}

function createNodeOnlyPath() {
  return path.dirname(process.execPath);
}

function writeFakeChangeset(tempDirectory, body) {
  const fakeBinDirectory = path.join(tempDirectory, 'fake-bin');
  fs.mkdirSync(fakeBinDirectory, { recursive: true });
  const executablePath = path.join(fakeBinDirectory, 'changeset');
  fs.writeFileSync(executablePath, body, { encoding: 'utf8' });
  fs.chmodSync(executablePath, 0o755);
  return fakeBinDirectory;
}

test('changeset-status-ci forwards filtered output and exit status', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'changeset-status-ci-pass-'));
  const fakeBinDirectory = writeFakeChangeset(
    tempDirectory,
    `#!/usr/bin/env bash
echo 'Package "@wasmboy/cli" must depend on the current version of "@wasmboy/api": "1.2.3" vs "file:../api"'
echo '🦋  info NO packages to be bumped at patch'
exit 0
`,
  );

  const result = runStatusScript(`${fakeBinDirectory}:${process.env.PATH ?? ''}`);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Suppressed 1 expected workspace file-dependency notices/u);
  assert.match(result.stdout, /🦋  info NO packages to be bumped at patch/u);
});

test('changeset-status-ci preserves non-zero changeset exit code', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'changeset-status-ci-fail-'));
  const fakeBinDirectory = writeFakeChangeset(
    tempDirectory,
    `#!/usr/bin/env bash
echo '🦋  error status failure'
exit 3
`,
  );

  const result = runStatusScript(`${fakeBinDirectory}:${process.env.PATH ?? ''}`);

  assert.equal(result.status, 3);
  assert.match(result.stdout, /🦋  error status failure/u);
});

test('changeset-status-ci reports command execution failure', () => {
  const result = runStatusScript(createNodeOnlyPath());

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Failed to execute changeset status/u);
});
