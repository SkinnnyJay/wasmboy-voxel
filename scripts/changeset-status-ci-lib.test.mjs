import assert from 'node:assert/strict';
import test from 'node:test';
import { filterChangesetStatusOutput } from './changeset-status-ci-lib.mjs';
import { UNPRINTABLE_VALUE } from './test-helpers.mjs';

test('filterChangesetStatusOutput suppresses expected workspace file warnings', () => {
  const input = [
    'Package "@wasmboy/debugger-app" must depend on the current version of "@wasmboy/api": "0.7.1" vs "file:../../packages/api"',
    'Package "@wasmboy/cli" must depend on the current version of "@wasmboy/api": "1.0.0-beta.1" vs "file:../api"',
    '🦋  info Packages to be bumped at minor:',
    '🦋  info - @wasmboy/api',
  ].join('\n');

  const result = filterChangesetStatusOutput(input);

  assert.equal(result.suppressedWarnings.length, 2);
  assert.equal(result.passthroughOutput, ['🦋  info Packages to be bumped at minor:', '🦋  info - @wasmboy/api'].join('\n'));
});

test('filterChangesetStatusOutput de-duplicates repeated warning lines', () => {
  const repeatedWarning = 'Package "@wasmboy/cli" must depend on the current version of "@wasmboy/api": "0.0.0" vs "file:../api"';
  const input = [repeatedWarning, repeatedWarning, '🦋  info NO packages to be bumped at patch'].join('\n');

  const result = filterChangesetStatusOutput(input);

  assert.deepEqual(result.suppressedWarnings, [repeatedWarning]);
  assert.equal(result.passthroughOutput, '🦋  info NO packages to be bumped at patch');
});

test('filterChangesetStatusOutput keeps non-file dependency warnings', () => {
  const npmVersionWarning = 'Package "@wasmboy/cli" must depend on the current version of "@wasmboy/api": "0.7.1" vs "^0.7.1"';
  const input = [npmVersionWarning, '🦋  info NO packages to be bumped at patch'].join('\n');

  const result = filterChangesetStatusOutput(input);

  assert.deepEqual(result.suppressedWarnings, []);
  assert.equal(result.passthroughOutput, input);
});

test('filterChangesetStatusOutput keeps non-wasmboy file dependency warnings', () => {
  const nonWorkspaceWarning = 'Package "@external/consumer" must depend on the current version of "@wasmboy/api": "0.7.1" vs "file:../api"';
  const input = [nonWorkspaceWarning, '🦋  info NO packages to be bumped at patch'].join('\n');

  const result = filterChangesetStatusOutput(input);

  assert.deepEqual(result.suppressedWarnings, []);
  assert.equal(result.passthroughOutput, input);
});

test('filterChangesetStatusOutput keeps malformed workspace warnings with missing file quote terminators', () => {
  const malformedWorkspaceWarning = 'Package "@wasmboy/cli" must depend on the current version of "@wasmboy/api": "0.7.1" vs "file:../api';
  const input = [malformedWorkspaceWarning, '🦋  info NO packages to be bumped at patch'].join('\n');

  const result = filterChangesetStatusOutput(input);

  assert.deepEqual(result.suppressedWarnings, []);
  assert.equal(result.passthroughOutput, input);
});

test('filterChangesetStatusOutput keeps workspace warnings with unexpected trailing tokens', () => {
  const malformedWorkspaceWarning =
    'Package "@wasmboy/cli" must depend on the current version of "@wasmboy/api": "0.7.1" vs "file:../api" (unexpected trailing tokens)';
  const input = [malformedWorkspaceWarning, '🦋  info NO packages to be bumped at patch'].join('\n');

  const result = filterChangesetStatusOutput(input);

  assert.deepEqual(result.suppressedWarnings, []);
  assert.equal(result.passthroughOutput, input);
});

test('filterChangesetStatusOutput returns suppressed warnings in deterministic order', () => {
  const cliWarning = 'Package "@wasmboy/cli" must depend on the current version of "@wasmboy/api": "0.7.1" vs "file:../api"';
  const debuggerWarning =
    'Package "@wasmboy/debugger-app" must depend on the current version of "@wasmboy/api": "0.7.1" vs "file:../../packages/api"';
  const input = [cliWarning, debuggerWarning].join('\n');

  const result = filterChangesetStatusOutput(input);

  assert.deepEqual(
    result.suppressedWarnings,
    [cliWarning, debuggerWarning].sort((left, right) => left.localeCompare(right)),
  );
});

test('filterChangesetStatusOutput sorts suppressed warnings by deterministic code-point order', () => {
  const zWarning = 'Package "@wasmboy/z-module" must depend on the current version of "@wasmboy/api": "0.7.1" vs "file:../api"';
  const umlautWarning = 'Package "@wasmboy/ä-module" must depend on the current version of "@wasmboy/api": "0.7.1" vs "file:../api"';
  const input = [umlautWarning, zWarning].join('\n');

  const result = filterChangesetStatusOutput(input);

  assert.deepEqual(result.suppressedWarnings, [zWarning, umlautWarning]);
});

test('filterChangesetStatusOutput handles CRLF output safely', () => {
  const workspaceWarning = 'Package "@wasmboy/cli" must depend on the current version of "@wasmboy/api": "0.7.1" vs "file:../api"';
  const input = `${workspaceWarning}\r\n🦋  info NO packages to be bumped at patch\r\n`;

  const result = filterChangesetStatusOutput(input);

  assert.deepEqual(result.suppressedWarnings, [workspaceWarning]);
  assert.equal(result.passthroughOutput, '🦋  info NO packages to be bumped at patch');
});

test('filterChangesetStatusOutput handles mixed CRLF and LF output safely', () => {
  const workspaceWarning = 'Package "@wasmboy/cli" must depend on the current version of "@wasmboy/api": "0.7.1" vs "file:../api"';
  const input = `${workspaceWarning}\r\n🦋  info section header\n🦋  info NO packages to be bumped at patch\r\n`;

  const result = filterChangesetStatusOutput(input);

  assert.deepEqual(result.suppressedWarnings, [workspaceWarning]);
  assert.equal(result.passthroughOutput, ['🦋  info section header', '🦋  info NO packages to be bumped at patch'].join('\n'));
});

test('filterChangesetStatusOutput handles large mixed-output payloads without dropping passthrough lines', () => {
  const cliWarning = 'Package "@wasmboy/cli" must depend on the current version of "@wasmboy/api": "0.7.1" vs "file:../api"';
  const debuggerWarning =
    'Package "@wasmboy/debugger-app" must depend on the current version of "@wasmboy/api": "0.7.1" vs "file:../../packages/api"';
  const passthroughLines = Array.from({ length: 4000 }, (_, index) => `🦋  info line ${index}`);
  const outputLines = [];

  for (const line of passthroughLines) {
    outputLines.push(cliWarning, line, debuggerWarning);
  }

  const result = filterChangesetStatusOutput(outputLines.join('\n'));
  const passthroughOutputLines = result.passthroughOutput.split('\n');

  assert.deepEqual(result.suppressedWarnings, [cliWarning, debuggerWarning]);
  assert.equal(passthroughOutputLines.length, passthroughLines.length);
  assert.equal(passthroughOutputLines[0], '🦋  info line 0');
  assert.equal(passthroughOutputLines[passthroughOutputLines.length - 1], '🦋  info line 3999');
});

test('filterChangesetStatusOutput suppresses warnings with surrounding whitespace', () => {
  const workspaceWarning = 'Package "@wasmboy/cli" must depend on the current version of "@wasmboy/api": "0.7.1" vs "file:../api"';
  const input = `  ${workspaceWarning}  \n🦋  info NO packages to be bumped at patch`;

  const result = filterChangesetStatusOutput(input);

  assert.deepEqual(result.suppressedWarnings, [workspaceWarning]);
  assert.equal(result.passthroughOutput, '🦋  info NO packages to be bumped at patch');
});

test('filterChangesetStatusOutput preserves internal blank lines in passthrough output', () => {
  const workspaceWarning = 'Package "@wasmboy/cli" must depend on the current version of "@wasmboy/api": "0.7.1" vs "file:../api"';
  const input = [workspaceWarning, '🦋  info header', '', '🦋  info footer', '', ''].join('\n');

  const result = filterChangesetStatusOutput(input);

  assert.deepEqual(result.suppressedWarnings, [workspaceWarning]);
  assert.equal(result.passthroughOutput, ['🦋  info header', '', '🦋  info footer'].join('\n'));
});

test('filterChangesetStatusOutput de-duplicates warnings across whitespace variants', () => {
  const workspaceWarning = 'Package "@wasmboy/cli" must depend on the current version of "@wasmboy/api": "0.7.1" vs "file:../api"';
  const input = [` ${workspaceWarning}`, workspaceWarning, `${workspaceWarning}   `, '🦋  info NO packages to be bumped at patch'].join(
    '\n',
  );

  const result = filterChangesetStatusOutput(input);

  assert.deepEqual(result.suppressedWarnings, [workspaceWarning]);
  assert.equal(result.passthroughOutput, '🦋  info NO packages to be bumped at patch');
});

test('filterChangesetStatusOutput handles empty output', () => {
  const result = filterChangesetStatusOutput('');

  assert.deepEqual(result.suppressedWarnings, []);
  assert.equal(result.passthroughOutput, '');
});

test('filterChangesetStatusOutput rejects non-string output values', () => {
  assert.throws(() => filterChangesetStatusOutput(42), /Invalid changeset status output: 42/u);
});

test('filterChangesetStatusOutput rejects bigint output values', () => {
  assert.throws(() => filterChangesetStatusOutput(42n), /Invalid changeset status output: 42/u);
});

test('filterChangesetStatusOutput rejects undefined output values', () => {
  assert.throws(() => filterChangesetStatusOutput(undefined), /Invalid changeset status output: undefined/u);
});

test('filterChangesetStatusOutput rejects null output values', () => {
  assert.throws(() => filterChangesetStatusOutput(null), /Invalid changeset status output: null/u);
});

test('filterChangesetStatusOutput rejects symbol output values', () => {
  assert.throws(
    () => filterChangesetStatusOutput(Symbol('changeset-output')),
    /Invalid changeset status output: Symbol\(changeset-output\)/u,
  );
});

test('filterChangesetStatusOutput safely formats unprintable output values', () => {
  assert.throws(() => filterChangesetStatusOutput(UNPRINTABLE_VALUE), /Invalid changeset status output: \[unprintable\]/u);
});

test('filterChangesetStatusOutput returns empty passthrough when only warnings are present', () => {
  const warningOne = 'Package "@wasmboy/cli" must depend on the current version of "@wasmboy/api": "0.7.1" vs "file:../api"';
  const warningTwo =
    'Package "@wasmboy/debugger-app" must depend on the current version of "@wasmboy/api": "0.7.1" vs "file:../../packages/api"';
  const input = [warningOne, warningTwo].join('\n');

  const result = filterChangesetStatusOutput(input);

  assert.deepEqual(
    result.suppressedWarnings,
    [warningOne, warningTwo].sort((left, right) => left.localeCompare(right)),
  );
  assert.equal(result.passthroughOutput, '');
});
