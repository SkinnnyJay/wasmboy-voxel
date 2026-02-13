import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);
const bundlerScriptPath = path.join(currentDirectory, 'bundle-diagnostics.mjs');

function runBundlerCommand(cwd, args) {
  const result = spawnSync('node', [bundlerScriptPath, ...args], {
    cwd,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(`bundle-diagnostics command failed: ${result.stderr || result.stdout || 'unknown error'}`);
  }
}

function runBundlerCommandExpectFailure(cwd, args) {
  const result = spawnSync('node', [bundlerScriptPath, ...args], {
    cwd,
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0, 'bundle-diagnostics command should fail');
  return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

function listArchiveContents(cwd, archivePath) {
  const result = spawnSync('tar', ['-tzf', archivePath], {
    cwd,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(`Failed to list archive contents: ${result.stderr || 'unknown error'}`);
  }

  return result.stdout
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

test('bundle-diagnostics archives matched files', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-match-'));
  const logsDirectory = path.join(tempDirectory, 'logs');
  fs.mkdirSync(logsDirectory, { recursive: true });
  fs.writeFileSync(path.join(logsDirectory, 'example.log'), 'diagnostic line\n', 'utf8');

  runBundlerCommand(tempDirectory, ['--output', 'artifacts/matched.tar.gz', '--pattern', 'logs/*.log']);

  const archiveContents = listArchiveContents(tempDirectory, 'artifacts/matched.tar.gz');
  assert.ok(
    archiveContents.some(entry => entry.endsWith('logs/example.log')),
    'archive should include matched diagnostic log file',
  );
});

test('bundle-diagnostics emits placeholder when no files match', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-empty-'));
  runBundlerCommand(tempDirectory, ['--output', 'artifacts/empty.tar.gz', '--pattern', 'missing/*.log']);

  const archiveContents = listArchiveContents(tempDirectory, 'artifacts/empty.tar.gz');
  assert.ok(
    archiveContents.some(entry => entry.endsWith('artifacts/empty.txt')),
    'archive should include placeholder file when no diagnostics are present',
  );
});

test('bundle-diagnostics writes custom placeholder message when provided', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-empty-message-'));
  const customMessage = 'custom placeholder message';

  runBundlerCommand(tempDirectory, ['--output', 'artifacts/custom-empty.tar.gz', '--pattern', 'missing/*.log', '--message', customMessage]);

  const placeholderPath = path.join(tempDirectory, 'artifacts/custom-empty.txt');
  const placeholderText = fs.readFileSync(placeholderPath, 'utf8').trim();
  assert.equal(placeholderText, customMessage, 'placeholder file should contain the custom message text');
});

test('bundle-diagnostics de-duplicates files matched by repeated patterns', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-dedupe-'));
  const logsDirectory = path.join(tempDirectory, 'logs');
  fs.mkdirSync(logsDirectory, { recursive: true });
  fs.writeFileSync(path.join(logsDirectory, 'duplicate.log'), 'duplicate entry\n', 'utf8');

  runBundlerCommand(tempDirectory, ['--output', 'artifacts/dedupe.tar.gz', '--pattern', 'logs/*.log', '--pattern', 'logs/duplicate.log']);

  const duplicateEntries = listArchiveContents(tempDirectory, 'artifacts/dedupe.tar.gz').filter(entry =>
    entry.endsWith('logs/duplicate.log'),
  );
  assert.equal(duplicateEntries.length, 1, 'archive should only include duplicate log once');
});

test('bundle-diagnostics archives matched files in deterministic sorted order', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-order-'));
  const logsDirectory = path.join(tempDirectory, 'logs');
  fs.mkdirSync(logsDirectory, { recursive: true });
  fs.writeFileSync(path.join(logsDirectory, 'b.log'), 'b entry\n', 'utf8');
  fs.writeFileSync(path.join(logsDirectory, 'a.log'), 'a entry\n', 'utf8');

  runBundlerCommand(tempDirectory, ['--output', 'artifacts/order.tar.gz', '--pattern', 'logs/b.log', '--pattern', 'logs/a.log']);

  const archiveContents = listArchiveContents(tempDirectory, 'artifacts/order.tar.gz');
  const aIndex = archiveContents.findIndex(entry => entry.endsWith('logs/a.log'));
  const bIndex = archiveContents.findIndex(entry => entry.endsWith('logs/b.log'));
  assert.ok(aIndex >= 0 && bIndex >= 0, 'archive should include both matched log files');
  assert.ok(aIndex < bIndex, 'archive entries should be stable and sorted lexicographically');
});

test('bundle-diagnostics requires output argument', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-output-required-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--pattern', 'logs/*.log']);
  assert.match(output, /Missing required --output argument/u);
});

test('bundle-diagnostics requires at least one pattern argument', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-pattern-required-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz']);
  assert.match(output, /Provide at least one --pattern argument/u);
});

test('bundle-diagnostics fails for unknown arguments', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-unknown-arg-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz', '--unknown', 'value']);
  assert.match(output, /Unknown argument: --unknown/u);
});

test('bundle-diagnostics requires values for known flags', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-missing-flag-value-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz', '--pattern', '--message']);
  assert.match(output, /Missing value for --pattern argument/u);
});
