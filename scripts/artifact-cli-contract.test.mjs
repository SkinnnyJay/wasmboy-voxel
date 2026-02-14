import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const cleanArtifactsScriptPath = path.join(scriptsDirectory, 'clean-accidental-build-artifacts.mjs');
const guardArtifactsScriptPath = path.join(scriptsDirectory, 'guard-generated-artifacts-precommit.mjs');

function runScript(scriptPath, args) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
  });
}

test('clean artifact script prints usage for --help', () => {
  const result = runScript(cleanArtifactsScriptPath, ['--help']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: node scripts\/clean-accidental-build-artifacts\.mjs \[--dry-run\]/u);
});

test('clean artifact script rejects unknown flags', () => {
  const result = runScript(cleanArtifactsScriptPath, ['--unknown']);

  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /\[clean:artifacts\] \[clean:artifacts\] Unknown argument "--unknown"\. Supported flags: --dry-run, --help\./u,
  );
});

test('generated artifact guard script prints usage for --help', () => {
  const result = runScript(guardArtifactsScriptPath, ['--help']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: node scripts\/guard-generated-artifacts-precommit\.mjs \[--help\]/u);
});

test('generated artifact guard script rejects unknown flags', () => {
  const result = runScript(guardArtifactsScriptPath, ['--dry-run']);

  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /\[guard:generated-artifacts\] \[guard:generated-artifacts\] Unknown argument "--dry-run"\. Supported flags: --help\./u,
  );
});
