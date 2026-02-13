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

function runStatusScript(customPath, extraEnv = {}) {
  return spawnSync('node', [statusScriptPath], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: customPath,
      ...extraEnv,
    },
  });
}

function runStatusScriptWithArgs(customPath, args, extraEnv = {}) {
  return spawnSync('node', [statusScriptPath, ...args], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: customPath,
      ...extraEnv,
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

test('changeset-status-ci sorts suppressed warnings and preserves non-workspace warnings', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'changeset-status-ci-sort-'));
  const cliWarning = 'Package "@wasmboy/cli" must depend on the current version of "@wasmboy/api": "1.2.3" vs "file:../api"';
  const debuggerWarning =
    'Package "@wasmboy/debugger-app" must depend on the current version of "@wasmboy/api": "1.2.3" vs "file:../../packages/api"';
  const nonWorkspaceWarning = 'Package "@external/consumer" must depend on the current version of "@wasmboy/api": "1.2.3" vs "file:../api"';
  const fakeBinDirectory = writeFakeChangeset(
    tempDirectory,
    `#!/usr/bin/env bash
echo '${cliWarning}'
echo '${nonWorkspaceWarning}'
echo '${debuggerWarning}'
exit 0
`,
  );

  const result = runStatusScript(`${fakeBinDirectory}:${process.env.PATH ?? ''}`);
  const cliWarningIndex = result.stdout.indexOf(`- ${cliWarning}`);
  const debuggerWarningIndex = result.stdout.indexOf(`- ${debuggerWarning}`);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Suppressed 2 expected workspace file-dependency notices/u);
  assert.ok(cliWarningIndex >= 0 && debuggerWarningIndex >= 0, 'suppressed warning lines should be printed');
  assert.ok(cliWarningIndex < debuggerWarningIndex, 'suppressed warning lines should be printed in lexicographic order');
  assert.match(result.stdout, new RegExp(nonWorkspaceWarning.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
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

test('changeset-status-ci prints usage with --help', () => {
  const result = runStatusScriptWithArgs(createNodeOnlyPath(), ['--help']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/u);
  assert.match(result.stdout, /changeset status/u);
});

test('changeset-status-ci prints usage with -h alias', () => {
  const result = runStatusScriptWithArgs(createNodeOnlyPath(), ['-h']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Options:/u);
  assert.match(result.stdout, /-h, --help/u);
});

test('changeset-status-ci rejects unknown arguments', () => {
  const result = runStatusScriptWithArgs(createNodeOnlyPath(), ['--unknown']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown argument: --unknown/u);
  assert.match(result.stderr, /Usage:/u);
});

test('changeset-status-ci fails fast for invalid timeout configuration', () => {
  const result = runStatusScript(createNodeOnlyPath(), {
    CHANGESET_STATUS_CI_TIMEOUT_MS: 'invalid-timeout',
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Invalid CHANGESET_STATUS_CI_TIMEOUT_MS value/u);
});

test('changeset-status-ci reports timeout errors with configured value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'changeset-status-ci-timeout-'));
  const fakeBinDirectory = writeFakeChangeset(
    tempDirectory,
    `#!/usr/bin/env bash
sleep 1
echo '🦋  info delayed status'
exit 0
`,
  );
  const result = runStatusScript(`${fakeBinDirectory}:${process.env.PATH ?? ''}`, {
    CHANGESET_STATUS_CI_TIMEOUT_MS: '50',
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /timed out after 50ms/u);
});
