import { spawnSync } from 'node:child_process';

const statusResult = spawnSync('changeset', ['status'], {
  encoding: 'utf8',
});

if (statusResult.error) {
  console.error('[changeset:status:ci] Failed to execute changeset status.');
  console.error(statusResult.error);
  process.exit(1);
}

const combinedOutput = `${statusResult.stdout ?? ''}${statusResult.stderr ?? ''}`;
const outputLines = combinedOutput.split(/\r?\n/);
const expectedWorkspaceWarning = /^Package "(@wasmboy\/debugger-app|@wasmboy\/cli)" must depend on the current version of "@wasmboy\/api": "0\.0\.0" vs "file:/;

const suppressedWarnings = new Set();
const passthroughLines = [];

for (const line of outputLines) {
  const trimmedLine = line.trim();
  if (expectedWorkspaceWarning.test(trimmedLine)) {
    suppressedWarnings.add(trimmedLine);
    continue;
  }

  passthroughLines.push(line);
}

if (suppressedWarnings.size > 0) {
  console.log(`[changeset:status:ci] Suppressed ${suppressedWarnings.size} expected workspace file-dependency notices:`);
  for (const warningLine of suppressedWarnings) {
    console.log(`- ${warningLine}`);
  }
}

const passthroughOutput = passthroughLines.join('\n').trimEnd();
if (passthroughOutput.length > 0) {
  process.stdout.write(`${passthroughOutput}\n`);
}

process.exit(statusResult.status ?? 1);
