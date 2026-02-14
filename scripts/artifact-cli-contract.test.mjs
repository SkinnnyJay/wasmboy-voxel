import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const cleanArtifactsScriptPath = path.join(scriptsDirectory, 'clean-accidental-build-artifacts.mjs');
const guardArtifactsScriptPath = path.join(scriptsDirectory, 'guard-generated-artifacts-precommit.mjs');

function runScript(scriptPath, args, options = {}) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: options.cwd ?? process.cwd(),
    encoding: 'utf8',
    env: process.env,
  });
}

function writeFileEnsuringParent(filePath, contents = 'fixture') {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, 'utf8');
}

test('clean artifact script prints usage for --help', () => {
  const result = runScript(cleanArtifactsScriptPath, ['--help']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: node scripts\/clean-accidental-build-artifacts\.mjs \[--dry-run\]/u);
});

test('clean artifact script rejects unknown flags', () => {
  const result = runScript(cleanArtifactsScriptPath, ['--unknown']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /\[clean:artifacts\] Unknown argument "--unknown"\. Supported flags: --dry-run, --help\./u);
});

test('generated artifact guard script prints usage for --help', () => {
  const result = runScript(guardArtifactsScriptPath, ['--help']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: node scripts\/guard-generated-artifacts-precommit\.mjs \[--help\]/u);
});

test('generated artifact guard script rejects unknown flags', () => {
  const result = runScript(guardArtifactsScriptPath, ['--dry-run']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /\[guard:generated-artifacts\] Unknown argument "--dry-run"\. Supported flags: --help\./u);
});

test('clean artifact script dry-run reports candidates without deleting files', () => {
  const tempRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'artifact-cli-dry-run-'));
  const generatedOutputPath = path.join(tempRepoRoot, 'test', 'integration', 'headless.output');
  const buildFilePath = path.join(tempRepoRoot, 'build', 'index.html');
  writeFileEnsuringParent(generatedOutputPath);
  writeFileEnsuringParent(buildFilePath);

  const result = runScript(cleanArtifactsScriptPath, ['--dry-run'], { cwd: tempRepoRoot });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /\[clean:artifacts\] would remove 2 accidental build artifact target\(s\)\./u);
  assert.equal(fs.existsSync(generatedOutputPath), true);
  assert.equal(fs.existsSync(buildFilePath), true);
});

test('clean artifact script removes reported candidates without dry-run mode', () => {
  const tempRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'artifact-cli-remove-'));
  const generatedOutputPath = path.join(tempRepoRoot, 'test', 'integration', 'headless.output');
  const buildDirectoryPath = path.join(tempRepoRoot, 'build');
  writeFileEnsuringParent(generatedOutputPath);
  writeFileEnsuringParent(path.join(buildDirectoryPath, 'index.html'));

  const result = runScript(cleanArtifactsScriptPath, [], { cwd: tempRepoRoot });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /\[clean:artifacts\] removed 2 accidental build artifact target\(s\)\./u);
  assert.equal(fs.existsSync(generatedOutputPath), false);
  assert.equal(fs.existsSync(buildDirectoryPath), false);
});
