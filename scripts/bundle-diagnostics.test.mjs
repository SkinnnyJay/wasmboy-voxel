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
