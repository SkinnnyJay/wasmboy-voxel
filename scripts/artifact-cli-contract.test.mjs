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
    env: {
      ...process.env,
      ...options.env,
    },
  });
}

function writeFileEnsuringParent(filePath, contents = 'fixture') {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, 'utf8');
}

function assertSummaryMetadata(summaryPayload, expectedTool) {
  assert.equal(summaryPayload.tool, expectedTool);
  assert.equal(summaryPayload.schemaVersion, 1);
  assert.equal(typeof summaryPayload.timestampMs, 'number');
  assert.equal(Number.isInteger(summaryPayload.timestampMs), true);
  assert.equal(summaryPayload.timestampMs > 0, true);
}

function assertSummaryCountConsistency(summaryPayload, countFieldName, listFieldName) {
  assert.equal(typeof summaryPayload[countFieldName], 'number');
  assert.equal(Number.isInteger(summaryPayload[countFieldName]), true);
  assert.equal(summaryPayload[countFieldName], summaryPayload[listFieldName].length);
}

function runGit(args, cwd) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: process.env,
  });

  if (result.status !== 0) {
    const stderr = result.stderr?.trim() ?? '';
    throw new Error(`git ${args.join(' ')} failed: ${stderr}`);
  }
}

function createTempGitRepoWithStagedGeneratedArtifact(prefix) {
  return createTempGitRepoWithStagedPaths(prefix, ['dist/generated.js']);
}

function createTempGitRepoWithStagedPaths(prefix, stagedRelativePaths) {
  const tempRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  runGit(['init', '--quiet'], tempRepoRoot);
  stagedRelativePaths.forEach(relativePath => {
    writeFileEnsuringParent(path.join(tempRepoRoot, relativePath), 'console.log("generated");');
    runGit(['add', relativePath], tempRepoRoot);
  });
  return { tempRepoRoot, stagedRelativePaths };
}

test('clean artifact script prints usage for --help', () => {
  const result = runScript(cleanArtifactsScriptPath, ['--help']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: node scripts\/clean-accidental-build-artifacts\.mjs \[--dry-run\] \[--json\]/u);
});

test('clean artifact script prioritizes help over other flags', () => {
  const result = runScript(cleanArtifactsScriptPath, ['--help', '--unknown', '--json']);

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.match(result.stdout, /Usage: node scripts\/clean-accidental-build-artifacts\.mjs \[--dry-run\] \[--json\]/u);
});

test('clean artifact script rejects unknown flags', () => {
  const result = runScript(cleanArtifactsScriptPath, ['--unknown']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /\[clean:artifacts\] Unknown argument "--unknown"\. Supported flags: --dry-run, --json, --help\./u);
});

test('clean artifact script rejects duplicate flags', () => {
  const result = runScript(cleanArtifactsScriptPath, ['--json', '--json']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /\[clean:artifacts\] Duplicate --json flag received\./u);
});

test('generated artifact guard script prints usage for --help', () => {
  const result = runScript(guardArtifactsScriptPath, ['--help']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: node scripts\/guard-generated-artifacts-precommit\.mjs \[--json\] \[--help\]/u);
});

test('generated artifact guard script prioritizes help over other flags', () => {
  const result = runScript(guardArtifactsScriptPath, ['-h', '--dry-run', '--json']);

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.match(result.stdout, /Usage: node scripts\/guard-generated-artifacts-precommit\.mjs \[--json\] \[--help\]/u);
});

test('generated artifact guard script rejects unknown flags', () => {
  const result = runScript(guardArtifactsScriptPath, ['--dry-run']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /\[guard:generated-artifacts\] Unknown argument "--dry-run"\. Supported flags: --json, --help\./u);
});

test('generated artifact guard script rejects duplicate flags', () => {
  const result = runScript(guardArtifactsScriptPath, ['--json', '--json']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /\[guard:generated-artifacts\] Duplicate --json flag received\./u);
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

test('clean artifact script emits JSON summary when --json is set', () => {
  const tempRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'artifact-cli-json-'));
  const generatedOutputPath = path.join(tempRepoRoot, 'test', 'integration', 'headless.output');
  writeFileEnsuringParent(generatedOutputPath);

  const result = runScript(cleanArtifactsScriptPath, ['--dry-run', '--json'], { cwd: tempRepoRoot });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  const parsedOutput = JSON.parse(result.stdout.trim());
  assertSummaryMetadata(parsedOutput, 'clean:artifacts');
  assert.equal(parsedOutput.mode, 'dry-run');
  assert.equal(parsedOutput.removedCount, 1);
  assert.equal(parsedOutput.deletedDirectoryCount, 0);
  assert.equal(parsedOutput.deletedFileCount, 1);
  assertSummaryCountConsistency(parsedOutput, 'deletedDirectoryCount', 'deletedDirectories');
  assertSummaryCountConsistency(parsedOutput, 'deletedFileCount', 'deletedFiles');
  assert.deepEqual(parsedOutput.deletedDirectories, []);
  assert.deepEqual(parsedOutput.deletedFiles, ['test/integration/headless.output']);
  assert.equal(fs.existsSync(generatedOutputPath), true);
});

test('clean artifact script honors summary timestamp override environment variable', () => {
  const result = runScript(cleanArtifactsScriptPath, ['--json'], {
    env: { WASMBOY_ARTIFACT_SUMMARY_TIMESTAMP_MS: '789' },
  });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  const parsedOutput = JSON.parse(result.stdout.trim());
  assert.equal(parsedOutput.timestampMs, 789);
});

test('clean artifact script emits apply-mode JSON summary and removes files', () => {
  const tempRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'artifact-cli-json-apply-'));
  const generatedOutputPath = path.join(tempRepoRoot, 'test', 'integration', 'headless.output');
  writeFileEnsuringParent(generatedOutputPath);

  const result = runScript(cleanArtifactsScriptPath, ['--json'], { cwd: tempRepoRoot });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  const parsedOutput = JSON.parse(result.stdout.trim());
  assertSummaryMetadata(parsedOutput, 'clean:artifacts');
  assert.equal(parsedOutput.mode, 'apply');
  assert.equal(parsedOutput.removedCount, 1);
  assert.equal(parsedOutput.deletedDirectoryCount, 0);
  assert.equal(parsedOutput.deletedFileCount, 1);
  assertSummaryCountConsistency(parsedOutput, 'deletedDirectoryCount', 'deletedDirectories');
  assertSummaryCountConsistency(parsedOutput, 'deletedFileCount', 'deletedFiles');
  assert.deepEqual(parsedOutput.deletedDirectories, []);
  assert.deepEqual(parsedOutput.deletedFiles, ['test/integration/headless.output']);
  assert.equal(fs.existsSync(generatedOutputPath), false);
});

test('clean artifact script emits zero-count JSON summary when nothing matches', () => {
  const tempRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'artifact-cli-json-empty-'));
  writeFileEnsuringParent(path.join(tempRepoRoot, 'README.md'), '# fixture');

  const result = runScript(cleanArtifactsScriptPath, ['--json'], { cwd: tempRepoRoot });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  const parsedOutput = JSON.parse(result.stdout.trim());
  assertSummaryMetadata(parsedOutput, 'clean:artifacts');
  assert.equal(parsedOutput.mode, 'apply');
  assert.equal(parsedOutput.removedCount, 0);
  assert.equal(parsedOutput.deletedDirectoryCount, 0);
  assert.equal(parsedOutput.deletedFileCount, 0);
  assertSummaryCountConsistency(parsedOutput, 'deletedDirectoryCount', 'deletedDirectories');
  assertSummaryCountConsistency(parsedOutput, 'deletedFileCount', 'deletedFiles');
  assert.deepEqual(parsedOutput.deletedDirectories, []);
  assert.deepEqual(parsedOutput.deletedFiles, []);
});

test('generated artifact guard script emits JSON summary when --json is set', () => {
  const result = runScript(guardArtifactsScriptPath, ['--json']);

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  const parsedOutput = JSON.parse(result.stdout.trim());
  assertSummaryMetadata(parsedOutput, 'guard:generated-artifacts');
  assert.equal(typeof parsedOutput.allowGeneratedEdits, 'boolean');
  assert.equal(parsedOutput.isValid, true);
  assert.equal(parsedOutput.stagedPathCount, 0);
  assert.equal(parsedOutput.blockedPathCount, 0);
  assertSummaryCountConsistency(parsedOutput, 'blockedPathCount', 'blockedPaths');
  assert.deepEqual(parsedOutput.blockedPaths, []);
});

test('generated artifact guard script honors summary timestamp override environment variable', () => {
  const result = runScript(guardArtifactsScriptPath, ['--json'], {
    env: { WASMBOY_ARTIFACT_SUMMARY_TIMESTAMP_MS: '789' },
  });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  const parsedOutput = JSON.parse(result.stdout.trim());
  assert.equal(parsedOutput.timestampMs, 789);
});

test('generated artifact guard JSON summary reflects override in no-op runs', () => {
  const result = runScript(guardArtifactsScriptPath, ['--json'], {
    env: { WASMBOY_ALLOW_GENERATED_EDITS: '1' },
  });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  const parsedOutput = JSON.parse(result.stdout.trim());
  assertSummaryMetadata(parsedOutput, 'guard:generated-artifacts');
  assert.equal(parsedOutput.allowGeneratedEdits, true);
  assert.equal(parsedOutput.isValid, true);
  assert.equal(parsedOutput.stagedPathCount, 0);
  assert.equal(parsedOutput.blockedPathCount, 0);
  assertSummaryCountConsistency(parsedOutput, 'blockedPathCount', 'blockedPaths');
  assert.deepEqual(parsedOutput.blockedPaths, []);
});

test('generated artifact guard JSON output reports blocked staged artifacts', () => {
  const tempRepo = createTempGitRepoWithStagedGeneratedArtifact('artifact-guard-json-');

  const result = runScript(guardArtifactsScriptPath, ['--json'], { cwd: tempRepo.tempRepoRoot });

  assert.equal(result.status, 1);
  assert.equal(result.stderr, '');
  const parsedOutput = JSON.parse(result.stdout.trim());
  assertSummaryMetadata(parsedOutput, 'guard:generated-artifacts');
  assert.equal(parsedOutput.allowGeneratedEdits, false);
  assert.equal(parsedOutput.isValid, false);
  assert.deepEqual(parsedOutput.blockedPaths, [tempRepo.stagedRelativePaths[0]]);
  assert.equal(parsedOutput.blockedPathCount, 1);
  assertSummaryCountConsistency(parsedOutput, 'blockedPathCount', 'blockedPaths');
  assert.equal(parsedOutput.stagedPathCount, 1);
});

test('generated artifact guard JSON output honors generated-edit override', () => {
  const tempRepo = createTempGitRepoWithStagedGeneratedArtifact('artifact-guard-json-override-');

  const result = runScript(guardArtifactsScriptPath, ['--json'], {
    cwd: tempRepo.tempRepoRoot,
    env: { WASMBOY_ALLOW_GENERATED_EDITS: '1' },
  });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  const parsedOutput = JSON.parse(result.stdout.trim());
  assertSummaryMetadata(parsedOutput, 'guard:generated-artifacts');
  assert.equal(parsedOutput.allowGeneratedEdits, true);
  assert.equal(parsedOutput.isValid, true);
  assert.deepEqual(parsedOutput.blockedPaths, []);
  assert.equal(parsedOutput.blockedPathCount, 0);
  assertSummaryCountConsistency(parsedOutput, 'blockedPathCount', 'blockedPaths');
  assert.equal(parsedOutput.stagedPathCount, 1);
});

test('generated artifact guard JSON output sorts blocked paths deterministically', () => {
  const tempRepo = createTempGitRepoWithStagedPaths('artifact-guard-json-order-', ['dist/z-generated.js', 'build/a-generated.js']);

  const result = runScript(guardArtifactsScriptPath, ['--json'], { cwd: tempRepo.tempRepoRoot });

  assert.equal(result.status, 1);
  assert.equal(result.stderr, '');
  const parsedOutput = JSON.parse(result.stdout.trim());
  assertSummaryMetadata(parsedOutput, 'guard:generated-artifacts');
  assert.equal(parsedOutput.allowGeneratedEdits, false);
  assert.equal(parsedOutput.isValid, false);
  assert.deepEqual(parsedOutput.blockedPaths, ['build/a-generated.js', 'dist/z-generated.js']);
  assert.equal(parsedOutput.blockedPathCount, 2);
  assertSummaryCountConsistency(parsedOutput, 'blockedPathCount', 'blockedPaths');
  assert.equal(parsedOutput.stagedPathCount, 2);
});
