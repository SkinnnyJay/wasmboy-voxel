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

function writeDelayedFakeTar(tempDirectory, delaySeconds = '0.2') {
  const fakeBinDirectory = path.join(tempDirectory, 'fake-bin');
  fs.mkdirSync(fakeBinDirectory, { recursive: true });
  const fakeTarPath = path.join(fakeBinDirectory, 'tar');
  fs.writeFileSync(
    fakeTarPath,
    `#!/usr/bin/env bash
sleep ${delaySeconds}
exit 0
`,
    'utf8',
  );
  fs.chmodSync(fakeTarPath, 0o755);
  return fakeBinDirectory;
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

test('bundle-diagnostics preserves whitespace-only custom placeholder message', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-empty-message-whitespace-'));
  const whitespaceMessage = '   ';

  runBundlerCommand(tempDirectory, [
    '--output',
    'artifacts/custom-whitespace-empty.tar.gz',
    '--pattern',
    'missing/*.log',
    '--message',
    whitespaceMessage,
  ]);

  const archiveContents = listArchiveContents(tempDirectory, 'artifacts/custom-whitespace-empty.tar.gz');
  const placeholderEntry = archiveContents.find(entry => entry.endsWith('artifacts/custom-whitespace-empty.txt'));
  assert.ok(placeholderEntry, 'archive should include placeholder entry');

  const placeholderText = readArchiveEntry(tempDirectory, 'artifacts/custom-whitespace-empty.tar.gz', placeholderEntry);
  assert.equal(placeholderText, `${whitespaceMessage}\n`, 'placeholder file should preserve whitespace-only message content');
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

test('bundle-diagnostics accepts custom messages equal to --help', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-empty-message-help-token-'));
  const customMessage = '--help';

  runBundlerCommand(tempDirectory, [
    '--output',
    'artifacts/custom-help-token.tar.gz',
    '--pattern',
    'missing/*.log',
    '--message',
    customMessage,
  ]);

  const archiveContents = listArchiveContents(tempDirectory, 'artifacts/custom-help-token.tar.gz');
  const placeholderEntry = archiveContents.find(entry => entry.endsWith('artifacts/custom-help-token.txt'));
  assert.ok(placeholderEntry, 'archive should include placeholder entry');

  const placeholderText = readArchiveEntry(tempDirectory, 'artifacts/custom-help-token.tar.gz', placeholderEntry).trim();
  assert.equal(placeholderText, customMessage, 'placeholder file should preserve help-token message text');
});

test('bundle-diagnostics accepts custom messages equal to -h', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-empty-message-short-help-token-'));
  const customMessage = '-h';

  runBundlerCommand(tempDirectory, [
    '--output',
    'artifacts/custom-short-help-token.tar.gz',
    '--pattern',
    'missing/*.log',
    '--message',
    customMessage,
  ]);

  const archiveContents = listArchiveContents(tempDirectory, 'artifacts/custom-short-help-token.tar.gz');
  const placeholderEntry = archiveContents.find(entry => entry.endsWith('artifacts/custom-short-help-token.txt'));
  assert.ok(placeholderEntry, 'archive should include placeholder entry');

  const placeholderText = readArchiveEntry(tempDirectory, 'artifacts/custom-short-help-token.tar.gz', placeholderEntry).trim();
  assert.equal(placeholderText, customMessage, 'placeholder file should preserve short-help token message text');
});

test('bundle-diagnostics accepts custom message literal --help with timeout override', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-help-token-message-timeout-'));
  const customMessage = '--help';

  runBundlerCommand(tempDirectory, [
    '--output',
    'artifacts/custom-help-token-timeout.tar.gz',
    '--pattern',
    'missing/*.log',
    '--message',
    customMessage,
    '--tar-timeout-ms',
    '120000',
  ]);

  const archiveContents = listArchiveContents(tempDirectory, 'artifacts/custom-help-token-timeout.tar.gz');
  const placeholderEntry = archiveContents.find(entry => entry.endsWith('artifacts/custom-help-token-timeout.txt'));
  assert.ok(placeholderEntry, 'archive should include placeholder entry for help-token message with timeout override');

  const placeholderText = readArchiveEntry(tempDirectory, 'artifacts/custom-help-token-timeout.tar.gz', placeholderEntry).trim();
  assert.equal(placeholderText, customMessage, 'placeholder file should preserve help-token message with timeout override');
});

test('bundle-diagnostics supports equals-form arguments for output pattern and message', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-equals-form-'));
  const customMessage = 'equals syntax placeholder message';

  runBundlerCommand(tempDirectory, ['--output=artifacts/equals.tar.gz', '--pattern=missing/*.log', `--message=${customMessage}`]);

  const archiveContents = listArchiveContents(tempDirectory, 'artifacts/equals.tar.gz');
  const placeholderEntry = archiveContents.find(entry => entry.endsWith('artifacts/equals.txt'));
  assert.ok(placeholderEntry, 'archive should include placeholder entry for equals-form invocation');

  const placeholderText = readArchiveEntry(tempDirectory, 'artifacts/equals.tar.gz', placeholderEntry).trim();
  assert.equal(placeholderText, customMessage, 'placeholder file should contain equals-form message text');
});

test('bundle-diagnostics preserves whitespace-only equals-form message values', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-equals-form-whitespace-message-'));
  const whitespaceMessage = '   ';

  runBundlerCommand(tempDirectory, [
    '--output=artifacts/equals-whitespace.tar.gz',
    '--pattern=missing/*.log',
    `--message=${whitespaceMessage}`,
  ]);

  const archiveContents = listArchiveContents(tempDirectory, 'artifacts/equals-whitespace.tar.gz');
  const placeholderEntry = archiveContents.find(entry => entry.endsWith('artifacts/equals-whitespace.txt'));
  assert.ok(placeholderEntry, 'archive should include placeholder entry for equals-form whitespace invocation');

  const placeholderText = readArchiveEntry(tempDirectory, 'artifacts/equals-whitespace.tar.gz', placeholderEntry);
  assert.equal(placeholderText, `${whitespaceMessage}\n`, 'placeholder file should preserve equals-form whitespace-only message content');
});

test('bundle-diagnostics accepts equals-form custom messages equal to -h', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-equals-form-short-help-token-message-'));
  const customMessage = '-h';

  runBundlerCommand(tempDirectory, [
    '--output=artifacts/equals-short-help-token.tar.gz',
    '--pattern=missing/*.log',
    `--message=${customMessage}`,
  ]);

  const archiveContents = listArchiveContents(tempDirectory, 'artifacts/equals-short-help-token.tar.gz');
  const placeholderEntry = archiveContents.find(entry => entry.endsWith('artifacts/equals-short-help-token.txt'));
  assert.ok(placeholderEntry, 'archive should include placeholder entry for equals-form short-help message');

  const placeholderText = readArchiveEntry(tempDirectory, 'artifacts/equals-short-help-token.tar.gz', placeholderEntry).trim();
  assert.equal(placeholderText, customMessage, 'placeholder file should preserve equals-form short-help token message text');
});

test('bundle-diagnostics accepts equals-form custom messages equal to --help', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-equals-form-help-token-message-'));
  const customMessage = '--help';

  runBundlerCommand(tempDirectory, [
    '--output=artifacts/equals-help-token.tar.gz',
    '--pattern=missing/*.log',
    `--message=${customMessage}`,
  ]);

  const archiveContents = listArchiveContents(tempDirectory, 'artifacts/equals-help-token.tar.gz');
  const placeholderEntry = archiveContents.find(entry => entry.endsWith('artifacts/equals-help-token.txt'));
  assert.ok(placeholderEntry, 'archive should include placeholder entry for equals-form help-token message');

  const placeholderText = readArchiveEntry(tempDirectory, 'artifacts/equals-help-token.tar.gz', placeholderEntry).trim();
  assert.equal(placeholderText, customMessage, 'placeholder file should preserve equals-form help-token message text');
});

test('bundle-diagnostics accepts equals-form custom message literal -h with inline timeout override', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-equals-form-short-help-timeout-message-'));
  const customMessage = '-h';

  runBundlerCommand(tempDirectory, [
    '--output=artifacts/equals-short-help-timeout.tar.gz',
    '--pattern=missing/*.log',
    `--message=${customMessage}`,
    '--tar-timeout-ms=120000',
  ]);

  const archiveContents = listArchiveContents(tempDirectory, 'artifacts/equals-short-help-timeout.tar.gz');
  const placeholderEntry = archiveContents.find(entry => entry.endsWith('artifacts/equals-short-help-timeout.txt'));
  assert.ok(placeholderEntry, 'archive should include placeholder entry for equals-form short-help message with inline timeout');

  const placeholderText = readArchiveEntry(tempDirectory, 'artifacts/equals-short-help-timeout.tar.gz', placeholderEntry).trim();
  assert.equal(placeholderText, customMessage, 'placeholder file should preserve equals-form short-help message with inline timeout');
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
  assert.match(result.stdout, /--tar-timeout-ms/u);
  assert.match(result.stdout, /BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS/u);
});

test('bundle-diagnostics prints usage with -h alias', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-help-short-'));
  const result = runBundlerCommandRaw(tempDirectory, ['-h']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Options:/u);
  assert.match(result.stdout, /-h, --help/u);
});

test('bundle-diagnostics rejects duplicate help flags', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-duplicate-help-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--help', '-h']);
  assert.match(output, /Duplicate help flag provided/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects duplicate help flags in short-first order', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-duplicate-help-short-first-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['-h', '--help']);
  assert.match(output, /Duplicate help flag provided/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects duplicate long help flags', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-duplicate-help-long-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--help', '--help']);
  assert.match(output, /Duplicate help flag provided/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects duplicate short help flags', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-duplicate-help-short-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['-h', '-h']);
  assert.match(output, /Duplicate help flag provided/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects duplicate timeout flags', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-duplicate-timeout-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms',
    '100',
    '--tar-timeout-ms=200',
  ]);
  assert.match(output, /Duplicate --tar-timeout-ms argument provided/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects duplicate timeout flags in inline-first order', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-duplicate-timeout-inline-first-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms=200',
    '--tar-timeout-ms',
    '100',
  ]);
  assert.match(output, /Duplicate --tar-timeout-ms argument provided/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects duplicate timeout flags in split-only order', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-duplicate-timeout-split-only-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms',
    '200',
    '--tar-timeout-ms',
    '100',
  ]);
  assert.match(output, /Duplicate --tar-timeout-ms argument provided/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects duplicate timeout flags in inline-only order', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-duplicate-timeout-inline-only-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms=200',
    '--tar-timeout-ms=100',
  ]);
  assert.match(output, /Duplicate --tar-timeout-ms argument provided/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects missing timeout values', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-missing-timeout-value-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms',
  ]);
  assert.match(output, /Missing value for --tar-timeout-ms argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects empty inline timeout values', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-missing-timeout-inline-value-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms=',
  ]);
  assert.match(output, /Missing value for --tar-timeout-ms argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects help long-flag token as inline timeout value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-timeout-inline-help-long-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms=--help',
  ]);
  assert.match(output, /Missing value for --tar-timeout-ms argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects help short-flag token as inline timeout value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-timeout-inline-help-short-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms=-h',
  ]);
  assert.match(output, /Missing value for --tar-timeout-ms argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects self timeout-flag token as inline timeout value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-timeout-inline-self-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms=--tar-timeout-ms',
  ]);
  assert.match(output, /Missing value for --tar-timeout-ms argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects unknown long-flag token as timeout value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-timeout-long-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms',
    '--unexpected',
  ]);
  assert.match(output, /Missing value for --tar-timeout-ms argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects short-flag token as timeout value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-timeout-short-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms',
    '-x',
  ]);
  assert.match(output, /Missing value for --tar-timeout-ms argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects help long-flag token as timeout value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-timeout-help-long-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms',
    '--help',
  ]);
  assert.match(output, /Missing value for --tar-timeout-ms argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects help short-flag token as timeout value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-timeout-help-short-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms',
    '-h',
  ]);
  assert.match(output, /Missing value for --tar-timeout-ms argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects self timeout-flag token as timeout value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-timeout-self-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms',
    '--tar-timeout-ms',
  ]);
  assert.match(output, /Missing value for --tar-timeout-ms argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects output-flag token as timeout value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-timeout-output-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms',
    '--output',
  ]);
  assert.match(output, /Missing value for --tar-timeout-ms argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects pattern-flag token as timeout value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-timeout-pattern-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms',
    '--pattern',
  ]);
  assert.match(output, /Missing value for --tar-timeout-ms argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects message-flag token as timeout value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-timeout-message-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms',
    '--message',
  ]);
  assert.match(output, /Missing value for --tar-timeout-ms argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects unknown long-flag token as inline timeout value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-timeout-inline-long-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms=--unexpected',
  ]);
  assert.match(output, /Missing value for --tar-timeout-ms argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects short-flag token as inline timeout value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-timeout-inline-short-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms=-x',
  ]);
  assert.match(output, /Missing value for --tar-timeout-ms argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects output-flag token as inline timeout value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-timeout-inline-output-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms=--output',
  ]);
  assert.match(output, /Missing value for --tar-timeout-ms argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects pattern-flag token as inline timeout value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-timeout-inline-pattern-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms=--pattern',
  ]);
  assert.match(output, /Missing value for --tar-timeout-ms argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects message-flag token as inline timeout value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-timeout-inline-message-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms=--message',
  ]);
  assert.match(output, /Missing value for --tar-timeout-ms argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects unknown args even when help is present', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-help-unknown-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--help', '--unknown']);
  assert.match(output, /Unknown argument: --unknown/u);
});

test('bundle-diagnostics rejects unknown short args even when help is present', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-help-unknown-short-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--help', '-x']);
  assert.match(output, /Unknown argument: -x/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects unknown args even when short-help is present', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-short-help-unknown-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['-h', '--unknown']);
  assert.match(output, /Unknown argument: --unknown/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects unknown short args even when short-help is present', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-short-help-unknown-short-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['-h', '-x']);
  assert.match(output, /Unknown argument: -x/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects help flag mixed with operational args', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-help-mixed-args-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--help', '--output', 'artifacts/out.tar.gz']);
  assert.match(output, /Help flag cannot be combined with other arguments/u);
});

test('bundle-diagnostics rejects help flag mixed with timeout args', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-help-mixed-timeout-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--help', '--tar-timeout-ms', '100']);
  assert.match(output, /Help flag cannot be combined with other arguments/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects help flag mixed with inline timeout args', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-help-mixed-timeout-inline-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--help', '--tar-timeout-ms=100']);
  assert.match(output, /Help flag cannot be combined with other arguments/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects short-help mixed with timeout args', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-short-help-mixed-timeout-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['-h', '--tar-timeout-ms', '100']);
  assert.match(output, /Help flag cannot be combined with other arguments/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects short-help mixed with inline timeout args', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-short-help-mixed-timeout-inline-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['-h', '--tar-timeout-ms=100']);
  assert.match(output, /Help flag cannot be combined with other arguments/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects explicit help flag after message literal --help value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-message-help-literal-then-help-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--message',
    '--help',
    '--help',
  ]);
  assert.match(output, /Help flag cannot be combined with other arguments/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects explicit short-help flag after message literal -h value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-message-short-help-literal-then-short-help-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--message',
    '-h',
    '-h',
  ]);
  assert.match(output, /Help flag cannot be combined with other arguments/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects explicit help flag after equals-form message literal --help value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-message-inline-help-literal-then-help-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output=artifacts/out.tar.gz',
    '--pattern=missing/*.log',
    '--message=--help',
    '--help',
  ]);
  assert.match(output, /Help flag cannot be combined with other arguments/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects explicit short-help flag after equals-form message literal -h value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-message-inline-short-help-literal-then-short-help-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output=artifacts/out.tar.gz',
    '--pattern=missing/*.log',
    '--message=-h',
    '-h',
  ]);
  assert.match(output, /Help flag cannot be combined with other arguments/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects timeout args followed by trailing help flag', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-timeout-trailing-help-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms',
    '100',
    '--help',
  ]);
  assert.match(output, /Help flag cannot be combined with other arguments/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects inline-timeout args followed by trailing help flag', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-timeout-inline-trailing-help-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms=100',
    '--help',
  ]);
  assert.match(output, /Help flag cannot be combined with other arguments/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects timeout args followed by trailing short-help flag', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-timeout-trailing-short-help-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms',
    '100',
    '-h',
  ]);
  assert.match(output, /Help flag cannot be combined with other arguments/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects inline-timeout args followed by trailing short-help flag', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-timeout-inline-trailing-short-help-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms=100',
    '-h',
  ]);
  assert.match(output, /Help flag cannot be combined with other arguments/u);
  assert.match(output, /Usage:/u);
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

test('bundle-diagnostics fails for unknown short arguments', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-unknown-short-arg-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz', '-x']);
  assert.match(output, /\[bundle-diagnostics\]/u);
  assert.match(output, /Unknown argument: -x/u);
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

test('bundle-diagnostics rejects whitespace-only output flag value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-whitespace-output-value-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', '   ', '--pattern', 'logs/*.log']);
  assert.match(output, /Missing value for --output argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics requires a value for equals-form output flag', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-missing-output-inline-value-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output=', '--pattern=logs/*.log']);
  assert.match(output, /Missing value for --output argument/u);
});

test('bundle-diagnostics rejects whitespace-only equals-form output flag value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-whitespace-output-inline-value-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output=   ', '--pattern=logs/*.log']);
  assert.match(output, /Missing value for --output argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects unknown long-flag token as output value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-output-value-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', '--unexpected', '--pattern', 'logs/*.log']);
  assert.match(output, /Missing value for --output argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects help long-flag token as output value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-output-help-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', '--help', '--pattern', 'logs/*.log']);
  assert.match(output, /Missing value for --output argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects help short-flag token as output value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-output-help-short-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', '-h', '--pattern', 'logs/*.log']);
  assert.match(output, /Missing value for --output argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects help long-flag token as equals-form output value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-output-inline-help-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output=--help', '--pattern=logs/*.log']);
  assert.match(output, /Missing value for --output argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects help short-flag token as equals-form output value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-output-inline-help-short-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output=-h', '--pattern=logs/*.log']);
  assert.match(output, /Missing value for --output argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects timeout-flag token as output value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-output-timeout-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', '--tar-timeout-ms', '--pattern', 'logs/*.log']);
  assert.match(output, /Missing value for --output argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects timeout-flag token as equals-form output value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-output-inline-timeout-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output=--tar-timeout-ms', '--pattern=logs/*.log']);
  assert.match(output, /Missing value for --output argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects short-flag token as output value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-output-short-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', '-x', '--pattern', 'logs/*.log']);
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

test('bundle-diagnostics requires a value for equals-form message flag', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-missing-message-inline-value-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output=artifacts/out.tar.gz', '--pattern=missing/*.log', '--message=']);
  assert.match(output, /Missing value for --message argument/u);
});

test('bundle-diagnostics rejects timeout-flag token as message value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-message-timeout-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--message',
    '--tar-timeout-ms',
  ]);
  assert.match(output, /Missing value for --message argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects timeout-flag token as equals-form message value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-message-inline-timeout-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output=artifacts/out.tar.gz',
    '--pattern=missing/*.log',
    '--message=--tar-timeout-ms',
  ]);
  assert.match(output, /Missing value for --message argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects output-flag token as message value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-message-output-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--message',
    '--output',
  ]);
  assert.match(output, /Missing value for --message argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects pattern-flag token as message value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-message-pattern-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--message',
    '--pattern',
  ]);
  assert.match(output, /Missing value for --message argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects output-flag token as equals-form message value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-message-inline-output-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output=artifacts/out.tar.gz',
    '--pattern=missing/*.log',
    '--message=--output',
  ]);
  assert.match(output, /Missing value for --message argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects pattern-flag token as equals-form message value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-message-inline-pattern-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output=artifacts/out.tar.gz',
    '--pattern=missing/*.log',
    '--message=--pattern',
  ]);
  assert.match(output, /Missing value for --message argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects unknown long-flag token as pattern value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-pattern-value-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz', '--pattern', '--unexpected']);
  assert.match(output, /Missing value for --pattern argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects help long-flag token as pattern value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-pattern-help-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz', '--pattern', '--help']);
  assert.match(output, /Missing value for --pattern argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects help short-flag token as pattern value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-pattern-help-short-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz', '--pattern', '-h']);
  assert.match(output, /Missing value for --pattern argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects timeout-flag token as pattern value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-pattern-timeout-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz', '--pattern', '--tar-timeout-ms']);
  assert.match(output, /Missing value for --pattern argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics requires a value for equals-form pattern flag', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-missing-pattern-inline-value-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output=artifacts/out.tar.gz', '--pattern=']);
  assert.match(output, /Missing value for --pattern argument/u);
});

test('bundle-diagnostics rejects help long-flag token as equals-form pattern value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-pattern-inline-help-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output=artifacts/out.tar.gz', '--pattern=--help']);
  assert.match(output, /Missing value for --pattern argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects help short-flag token as equals-form pattern value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-pattern-inline-help-short-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output=artifacts/out.tar.gz', '--pattern=-h']);
  assert.match(output, /Missing value for --pattern argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects timeout-flag token as equals-form pattern value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-pattern-inline-timeout-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output=artifacts/out.tar.gz', '--pattern=--tar-timeout-ms']);
  assert.match(output, /Missing value for --pattern argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects whitespace-only pattern flag value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-whitespace-pattern-value-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz', '--pattern', '   ']);
  assert.match(output, /Missing value for --pattern argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects whitespace-only equals-form pattern flag value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-whitespace-pattern-inline-value-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output=artifacts/out.tar.gz', '--pattern=   ']);
  assert.match(output, /Missing value for --pattern argument/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects short-flag token as pattern value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-pattern-short-token-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz', '--pattern', '-x']);
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

test('bundle-diagnostics rejects duplicate output across split and equals forms', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-duplicate-output-mixed-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output=artifacts/one.tar.gz',
    '--output',
    'artifacts/two.tar.gz',
    '--pattern',
    'missing/*.log',
  ]);
  assert.match(output, /Duplicate --output argument provided/u);
});

test('bundle-diagnostics rejects duplicate output flags in equals-only order', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-duplicate-output-inline-only-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output=artifacts/one.tar.gz',
    '--output=artifacts/two.tar.gz',
    '--pattern=missing/*.log',
  ]);
  assert.match(output, /Duplicate --output argument provided/u);
  assert.match(output, /Usage:/u);
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

test('bundle-diagnostics rejects duplicate message across split and equals forms', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-duplicate-message-mixed-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--message=first',
    '--message',
    'second',
  ]);
  assert.match(output, /Duplicate --message argument provided/u);
});

test('bundle-diagnostics rejects duplicate message flags in equals-only order', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-duplicate-message-inline-only-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output=artifacts/out.tar.gz',
    '--pattern=missing/*.log',
    '--message=first',
    '--message=second',
  ]);
  assert.match(output, /Duplicate --message argument provided/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects invalid tar timeout configuration', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-timeout-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz', '--pattern', 'missing/*.log'], {
    BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS: 'invalid',
  });
  assert.match(output, /Invalid BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS value/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects zero tar timeout environment values', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-timeout-zero-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz', '--pattern', 'missing/*.log'], {
    BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS: '0',
  });
  assert.match(output, /Invalid BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS value/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects plus-prefixed tar timeout environment values', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-timeout-plus-prefix-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz', '--pattern', 'missing/*.log'], {
    BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS: '+5000',
  });
  assert.match(output, /Invalid BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS value/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects negative tar timeout environment values', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-timeout-negative-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz', '--pattern', 'missing/*.log'], {
    BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS: '-5',
  });
  assert.match(output, /Invalid BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS value/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects invalid CLI timeout configuration', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-cli-timeout-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms',
    'invalid',
  ]);
  assert.match(output, /Invalid --tar-timeout-ms value/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects whitespace-only CLI timeout override', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-cli-timeout-whitespace-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms',
    '   ',
  ]);
  assert.match(output, /Invalid --tar-timeout-ms value/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects whitespace-only inline CLI timeout override', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-cli-timeout-inline-whitespace-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms=   ',
  ]);
  assert.match(output, /Invalid --tar-timeout-ms value/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects plus-prefixed CLI timeout override', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-cli-timeout-plus-prefix-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms',
    '+5000',
  ]);
  assert.match(output, /Invalid --tar-timeout-ms value/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects plus-prefixed inline CLI timeout override', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-cli-timeout-inline-plus-prefix-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms=+5000',
  ]);
  assert.match(output, /Invalid --tar-timeout-ms value/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects negative CLI timeout override', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-cli-timeout-negative-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms',
    '-5',
  ]);
  assert.match(output, /Invalid --tar-timeout-ms value/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects negative inline CLI timeout override', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-cli-timeout-inline-negative-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms=-5',
  ]);
  assert.match(output, /Invalid --tar-timeout-ms value/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects zero CLI timeout override', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-cli-timeout-zero-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms',
    '0',
  ]);
  assert.match(output, /Invalid --tar-timeout-ms value/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects zero inline CLI timeout override', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-cli-timeout-inline-zero-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms=0',
  ]);
  assert.match(output, /Invalid --tar-timeout-ms value/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects CLI timeout overrides with non-numeric suffixes', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-cli-timeout-suffix-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms',
    '50ms',
  ]);
  assert.match(output, /Invalid --tar-timeout-ms value/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects inline CLI timeout overrides with non-numeric suffixes', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-cli-timeout-inline-suffix-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms=50ms',
  ]);
  assert.match(output, /Invalid --tar-timeout-ms value/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects CLI timeout overrides above supported ceiling', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-cli-timeout-ceiling-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms',
    '2147483648',
  ]);
  assert.match(output, /Invalid --tar-timeout-ms value/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects inline CLI timeout overrides above supported ceiling', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-cli-timeout-inline-ceiling-'));
  const output = runBundlerCommandExpectFailure(tempDirectory, [
    '--output',
    'artifacts/out.tar.gz',
    '--pattern',
    'missing/*.log',
    '--tar-timeout-ms=2147483648',
  ]);
  assert.match(output, /Invalid --tar-timeout-ms value/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects invalid split CLI timeout override even with valid env timeout', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-cli-timeout-with-valid-env-'));
  const output = runBundlerCommandExpectFailure(
    tempDirectory,
    ['--output', 'artifacts/out.tar.gz', '--pattern', 'missing/*.log', '--tar-timeout-ms', '0'],
    {
      BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS: '5000',
    },
  );
  assert.match(output, /Invalid --tar-timeout-ms value/u);
  assert.match(output, /Usage:/u);
});

test('bundle-diagnostics rejects invalid inline CLI timeout override even with valid env timeout', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-invalid-cli-timeout-inline-with-valid-env-'));
  const output = runBundlerCommandExpectFailure(
    tempDirectory,
    ['--output', 'artifacts/out.tar.gz', '--pattern', 'missing/*.log', '--tar-timeout-ms=50ms'],
    {
      BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS: '5000',
    },
  );
  assert.match(output, /Invalid --tar-timeout-ms value/u);
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

test('bundle-diagnostics accepts max tar timeout environment value', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-max-timeout-env-'));
  runBundlerCommand(tempDirectory, ['--output', 'artifacts/max-timeout-env.tar.gz', '--pattern', 'missing/*.log'], {
    BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS: '2147483647',
  });

  const archiveContents = listArchiveContents(tempDirectory, 'artifacts/max-timeout-env.tar.gz');
  assert.ok(
    archiveContents.some(entry => entry.endsWith('artifacts/max-timeout-env.txt')),
    'archive should be created when timeout env is set to max supported value',
  );
});

test('bundle-diagnostics treats empty timeout env value as default', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-empty-timeout-env-'));
  runBundlerCommand(tempDirectory, ['--output', 'artifacts/empty-timeout.tar.gz', '--pattern', 'missing/*.log'], {
    BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS: '',
  });

  const archiveContents = listArchiveContents(tempDirectory, 'artifacts/empty-timeout.tar.gz');
  assert.ok(
    archiveContents.some(entry => entry.endsWith('artifacts/empty-timeout.txt')),
    'archive should still be created when timeout env is set to an empty string',
  );
});

test('bundle-diagnostics reports tar timeout failures', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-tar-timeout-'));
  const fakeBinDirectory = writeDelayedFakeTar(tempDirectory);

  const output = runBundlerCommandExpectFailure(tempDirectory, ['--output', 'artifacts/out.tar.gz', '--pattern', 'missing/*.log'], {
    PATH: `${fakeBinDirectory}:${process.env.PATH ?? ''}`,
    BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS: '50',
  });
  assert.match(output, /tar timed out after 50ms/u);
});

test('bundle-diagnostics timeout CLI override takes precedence over timeout env', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-tar-timeout-cli-override-'));
  const fakeBinDirectory = writeDelayedFakeTar(tempDirectory);

  const output = runBundlerCommandExpectFailure(
    tempDirectory,
    ['--output', 'artifacts/out.tar.gz', '--pattern', 'missing/*.log', '--tar-timeout-ms', '50'],
    {
      PATH: `${fakeBinDirectory}:${process.env.PATH ?? ''}`,
      BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS: '5000',
    },
  );
  assert.match(output, /tar timed out after 50ms/u);
});

test('bundle-diagnostics inline timeout CLI override takes precedence over timeout env', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-tar-timeout-cli-inline-override-'));
  const fakeBinDirectory = writeDelayedFakeTar(tempDirectory);

  const output = runBundlerCommandExpectFailure(
    tempDirectory,
    ['--output', 'artifacts/out.tar.gz', '--pattern', 'missing/*.log', '--tar-timeout-ms=50'],
    {
      PATH: `${fakeBinDirectory}:${process.env.PATH ?? ''}`,
      BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS: '5000',
    },
  );
  assert.match(output, /tar timed out after 50ms/u);
});

test('bundle-diagnostics accepts leading-zero split CLI timeout override', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-tar-timeout-leading-zero-split-'));
  const fakeBinDirectory = writeDelayedFakeTar(tempDirectory);

  const output = runBundlerCommandExpectFailure(
    tempDirectory,
    ['--output', 'artifacts/out.tar.gz', '--pattern', 'missing/*.log', '--tar-timeout-ms', '00050'],
    {
      PATH: `${fakeBinDirectory}:${process.env.PATH ?? ''}`,
      BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS: '5000',
    },
  );
  assert.match(output, /tar timed out after 50ms/u);
});

test('bundle-diagnostics accepts leading-zero inline CLI timeout override', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-tar-timeout-leading-zero-inline-'));
  const fakeBinDirectory = writeDelayedFakeTar(tempDirectory);

  const output = runBundlerCommandExpectFailure(
    tempDirectory,
    ['--output', 'artifacts/out.tar.gz', '--pattern', 'missing/*.log', '--tar-timeout-ms=00050'],
    {
      PATH: `${fakeBinDirectory}:${process.env.PATH ?? ''}`,
      BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS: '5000',
    },
  );
  assert.match(output, /tar timed out after 50ms/u);
});

test('bundle-diagnostics timeout CLI override still applies when timeout env is empty', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-tar-timeout-cli-override-empty-env-'));
  const fakeBinDirectory = writeDelayedFakeTar(tempDirectory);

  const output = runBundlerCommandExpectFailure(
    tempDirectory,
    ['--output', 'artifacts/out.tar.gz', '--pattern', 'missing/*.log', '--tar-timeout-ms', '50'],
    {
      PATH: `${fakeBinDirectory}:${process.env.PATH ?? ''}`,
      BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS: '',
    },
  );
  assert.match(output, /tar timed out after 50ms/u);
});

test('bundle-diagnostics inline timeout CLI override still applies when timeout env is empty', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-tar-timeout-cli-inline-override-empty-env-'));
  const fakeBinDirectory = writeDelayedFakeTar(tempDirectory);

  const output = runBundlerCommandExpectFailure(
    tempDirectory,
    ['--output', 'artifacts/out.tar.gz', '--pattern', 'missing/*.log', '--tar-timeout-ms=50'],
    {
      PATH: `${fakeBinDirectory}:${process.env.PATH ?? ''}`,
      BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS: '',
    },
  );
  assert.match(output, /tar timed out after 50ms/u);
});

test('bundle-diagnostics accepts max split CLI timeout override', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-tar-timeout-max-split-'));
  const fakeBinDirectory = writeDelayedFakeTar(tempDirectory);

  const result = runBundlerCommandRaw(
    tempDirectory,
    ['--output', 'artifacts/out.tar.gz', '--pattern', 'missing/*.log', '--tar-timeout-ms', '2147483647'],
    {
      PATH: `${fakeBinDirectory}:${process.env.PATH ?? ''}`,
      BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS: '50',
    },
  );

  assert.equal(result.status, 0);
});

test('bundle-diagnostics accepts max inline CLI timeout override', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-diagnostics-tar-timeout-max-inline-'));
  const fakeBinDirectory = writeDelayedFakeTar(tempDirectory);

  const result = runBundlerCommandRaw(
    tempDirectory,
    ['--output', 'artifacts/out.tar.gz', '--pattern', 'missing/*.log', '--tar-timeout-ms=2147483647'],
    {
      PATH: `${fakeBinDirectory}:${process.env.PATH ?? ''}`,
      BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS: '50',
    },
  );

  assert.equal(result.status, 0);
});
