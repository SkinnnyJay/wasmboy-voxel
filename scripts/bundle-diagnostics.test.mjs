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

function runBundlerCommand(cwd, args, env = {}) {
  const result = runBundlerCommandRaw(cwd, args, env);

  if (result.status !== 0) {
    throw new Error(`bundle-diagnostics command failed: ${result.stderr || result.stdout || 'unknown error'}`);
  }
}

function runBundlerCommandRaw(cwd, args, env = {}) {
  return spawnSync('node', [bundlerScriptPath, ...args], {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...env,
    },
  });
}

function runBundlerCommandExpectFailure(cwd, args, env = {}) {
  const result = runBundlerCommandRaw(cwd, args, env);

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

function readArchiveEntry(cwd, archivePath, entryPath) {
  const result = spawnSync('tar', ['-xOf', archivePath, entryPath], {
    cwd,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(`Failed to read archive entry: ${result.stderr || 'unknown error'}`);
  }

  return result.stdout;
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

  assert.equal(
    fs.existsSync(path.join(tempDirectory, 'artifacts/empty.txt')),
    false,
    'temporary placeholder file should be removed after archive creation',
  );
});

test('bundle-diagnostics writes custom placeholder message when provided', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-empty-message-'));
  const customMessage = 'custom placeholder message';

  runBundlerCommand(tempDirectory, ['--output', 'artifacts/custom-empty.tar.gz', '--pattern', 'missing/*.log', '--message', customMessage]);

  const archiveContents = listArchiveContents(tempDirectory, 'artifacts/custom-empty.tar.gz');
  const placeholderEntry = archiveContents.find(entry => entry.endsWith('artifacts/custom-empty.txt'));
  assert.ok(placeholderEntry, 'archive should include placeholder entry');

  const placeholderText = readArchiveEntry(tempDirectory, 'artifacts/custom-empty.tar.gz', placeholderEntry).trim();
  assert.equal(placeholderText, customMessage, 'placeholder file should contain the custom message text');
});

test('bundle-diagnostics accepts custom messages that begin with double dashes', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-empty-message-dash-prefix-'));
  const customMessage = '--custom placeholder message';

  runBundlerCommand(tempDirectory, [
    '--output',
    'artifacts/custom-dash-empty.tar.gz',
    '--pattern',
    'missing/*.log',
    '--message',
    customMessage,
  ]);

  const archiveContents = listArchiveContents(tempDirectory, 'artifacts/custom-dash-empty.tar.gz');
  const placeholderEntry = archiveContents.find(entry => entry.endsWith('artifacts/custom-dash-empty.txt'));
  assert.ok(placeholderEntry, 'archive should include placeholder entry');

  const placeholderText = readArchiveEntry(tempDirectory, 'artifacts/custom-dash-empty.tar.gz', placeholderEntry).trim();
  assert.equal(placeholderText, customMessage, 'placeholder file should preserve dash-prefixed message text');
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

test('bundle-diagnostics de-duplicates equivalent relative and absolute matches', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-canonical-dedupe-'));
  const logsDirectory = path.join(tempDirectory, 'logs');
  const duplicatePath = path.join(logsDirectory, 'duplicate.log');
  fs.mkdirSync(logsDirectory, { recursive: true });
  fs.writeFileSync(duplicatePath, 'duplicate entry\n', 'utf8');

  runBundlerCommand(tempDirectory, [
    '--output',
    'artifacts/canonical-dedupe.tar.gz',
    '--pattern',
    'logs/*.log',
    '--pattern',
    duplicatePath,
  ]);

  const duplicateEntries = listArchiveContents(tempDirectory, 'artifacts/canonical-dedupe.tar.gz').filter(entry =>
    entry.endsWith('logs/duplicate.log'),
  );
  assert.equal(duplicateEntries.length, 1, 'archive should only include canonical duplicate path once');
  assert.equal(
    duplicateEntries.some(entry => entry.includes(tempDirectory)),
    false,
    'canonical duplicate entry should avoid absolute temp-directory archive paths',
  );
});

test('bundle-diagnostics ignores directories matched by patterns', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-dir-match-'));
  const logsDirectory = path.join(tempDirectory, 'logs');
  const nestedDirectory = path.join(logsDirectory, 'nested');
  fs.mkdirSync(nestedDirectory, { recursive: true });
  fs.writeFileSync(path.join(logsDirectory, 'root.log'), 'root log entry\n', 'utf8');
  fs.writeFileSync(path.join(nestedDirectory, 'nested.log'), 'nested log entry\n', 'utf8');

  runBundlerCommand(tempDirectory, ['--output', 'artifacts/dirs.tar.gz', '--pattern', 'logs/*']);

  const archiveContents = listArchiveContents(tempDirectory, 'artifacts/dirs.tar.gz');
  assert.ok(
    archiveContents.some(entry => entry.endsWith('logs/root.log')),
    'archive should include root file matches',
  );
  assert.equal(
    archiveContents.some(entry => entry.endsWith('logs/nested') || entry.endsWith('logs/nested/')),
    false,
    'archive should not include directory-only matches',
  );
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

test('bundle-diagnostics archives files whose names start with a dash', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-dash-file-'));
  const dashFilePath = path.join(tempDirectory, '-special.log');
  fs.writeFileSync(dashFilePath, 'dash-prefixed file\n', 'utf8');

  runBundlerCommand(tempDirectory, ['--output', 'artifacts/dash-file.tar.gz', '--pattern', '-*.log']);

  const archiveContents = listArchiveContents(tempDirectory, 'artifacts/dash-file.tar.gz');
  assert.ok(
    archiveContents.some(entry => entry.endsWith('-special.log')),
    'archive should include files whose names begin with a dash',
  );
});

test('bundle-diagnostics excludes output archive path from matched inputs', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-output-match-'));
  const logsDirectory = path.join(tempDirectory, 'logs');
  const artifactsDirectory = path.join(tempDirectory, 'artifacts');
  fs.mkdirSync(logsDirectory, { recursive: true });
  fs.mkdirSync(artifactsDirectory, { recursive: true });
  fs.writeFileSync(path.join(logsDirectory, 'example.log'), 'diagnostic line\n', 'utf8');
  fs.writeFileSync(path.join(artifactsDirectory, 'self.tar.gz'), 'preexisting archive placeholder\n', 'utf8');

  runBundlerCommand(tempDirectory, ['--output', 'artifacts/self.tar.gz', '--pattern', 'logs/*.log', '--pattern', 'artifacts/self.tar.gz']);

  const archiveContents = listArchiveContents(tempDirectory, 'artifacts/self.tar.gz');
  assert.ok(
    archiveContents.some(entry => entry.endsWith('logs/example.log')),
    'archive should still include other matched diagnostic files',
  );
  assert.equal(
    archiveContents.some(entry => entry.endsWith('artifacts/self.tar.gz')),
    false,
    'archive should not include itself even when matched by an input pattern',
  );
});

test('bundle-diagnostics normalizes absolute file matches to relative archive paths', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-absolute-path-normalize-'));
  const logsDirectory = path.join(tempDirectory, 'logs');
  const absoluteLogPath = path.join(logsDirectory, 'absolute.log');
  fs.mkdirSync(logsDirectory, { recursive: true });
  fs.writeFileSync(absoluteLogPath, 'absolute path log\n', 'utf8');

  runBundlerCommand(tempDirectory, ['--output', 'artifacts/absolute.tar.gz', '--pattern', absoluteLogPath]);

  const archiveContents = listArchiveContents(tempDirectory, 'artifacts/absolute.tar.gz');
  assert.ok(
    archiveContents.some(entry => entry.endsWith('logs/absolute.log')),
    'archive should include the matched absolute-path file',
  );
  assert.equal(
    archiveContents.some(entry => entry.includes(tempDirectory)),
    false,
    'archive should avoid absolute temp-directory archive paths',
  );
});

test('bundle-diagnostics requires output argument', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-output-required-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--pattern', 'logs/*.log']);
  assert.match(output, /\[bundle-diagnostics\]/u);
  assert.match(output, /Missing required --output argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics prints usage with --help', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-help-'));
  const result = runBundlerCommandRaw(tempDirectory, ['--help']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/u);
  assert.match(result.stdout, /--output/u);
  assert.match(result.stdout, /--pattern/u);
  assert.match(result.stdout, /BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS/u);
});

test('bundle-diagnostics prints usage with -h alias', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-help-short-'));
  const result = runBundlerCommandRaw(tempDirectory, ['-h']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Options:/u);
  assert.match(result.stdout, /-h, --help/u);
});

test('bundle-diagnostics rejects unknown args even when help is present', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-help-unknown-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--help', '--unknown']);
  assert.match(output, /Unknown argument: --unknown/u);
});

test('bundle-diagnostics rejects help flag mixed with operational args', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-help-mixed-args-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--help', '--output', 'artifacts/out.tar.gz']);
  assert.match(output, /Help flag cannot be combined with other arguments/u);
});

test('bundle-diagnostics requires at least one pattern argument', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-pattern-required-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz']);
  assert.match(output, /Provide at least one --pattern argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics fails for unknown arguments', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-unknown-arg-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz', '--unknown', 'value']);
  assert.match(output, /\[bundle-diagnostics\]/u);
  assert.match(output, /Unknown argument: --unknown/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics requires values for known flags', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-missing-flag-value-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz', '--pattern', '--message']);
  assert.match(output, /Missing value for --pattern argument/u);
});

test('bundle-diagnostics requires a value for output flag', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-missing-output-value-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output']);
  assert.match(output, /Missing value for --output argument/u);
});

test('bundle-diagnostics rejects unknown long-flag token as output value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-output-value-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', '--unexpected', '--pattern', 'logs/*.log']);
  assert.match(output, /Missing value for --output argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics requires a value for message flag', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-missing-message-value-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--message',
  ]);
  assert.match(output, /Missing value for --message argument/u);
});

test('bundle-diagnostics rejects unknown long-flag token as pattern value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-pattern-value-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz', '--pattern', '--unexpected']);
  assert.match(output, /Missing value for --pattern argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects duplicate output flags', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-duplicate-output-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/one.tar.gz',
    '--output',
    'artifacts/two.tar.gz',
    '--pattern',
    'missing/*.log',
  ]);
  assert.match(output, /Duplicate --output argument provided/u);
});

test('bundle-diagnostics rejects duplicate message flags', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-duplicate-message-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--message',
    'first',
    '--message',
    'second',
  ]);
  assert.match(output, /Duplicate --message argument provided/u);
});

test('bundle-diagnostics rejects invalid tar timeout configuration', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-timeout-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz', '--pattern', 'missing/*.log'], {
    BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS: 'invalid',
  });
  assert.match(output, /Invalid BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS value/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects non-numeric tar timeout suffixes', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-timeout-suffix-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz', '--pattern', 'missing/*.log'], {
    BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS: '50ms',
  });
  assert.match(output, /Invalid BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS value/u);
});

test('bundle-diagnostics rejects tar timeout values above supported ceiling', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-timeout-ceiling-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz', '--pattern', 'missing/*.log'], {
    BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS: '2147483648',
  });
  assert.match(output, /Invalid BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS value/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics reports tar timeout failures', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-tar-timeout-'));
  const fakeBinDirectory = path.join(tempDirectory, 'fake-bin');
  fs.mkdirSync(fakeBinDirectory, { recursive: true });
  const fakeTarPath = path.join(fakeBinDirectory, 'tar');
  fs.writeFileSync(
    fakeTarPath,
    `#!/usr/bin/env bash
sleep 0.2
exit 0
`,
    'utf8',
  );
  fs.chmodSync(fakeTarPath, 0o755);

  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz', '--pattern', 'missing/*.log'], {
    PATH: `${fakeBinDirectory}:${process.env.PATH ?? ''}`,
    BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS: '50',
  });
  assert.match(output, /tar timed out after 50ms/u);
});
