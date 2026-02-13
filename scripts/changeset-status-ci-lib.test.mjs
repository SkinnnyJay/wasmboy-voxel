import assert from 'node:assert/strict';
import test from 'node:test';
import { filterChangesetStatusOutput } from './changeset-status-ci-lib.mjs';

const UNPRINTABLE_VALUE = {
  toString() {
    throw new Error('cannot stringify');
  },
};

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

test('filterChangesetStatusOutput handles CRLF output safely', () => {
  const workspaceWarning = 'Package "@wasmboy/cli" must depend on the current version of "@wasmboy/api": "0.7.1" vs "file:../api"';
  const input = `${workspaceWarning}\r\n🦋  info NO packages to be bumped at patch\r\n`;

  const result = filterChangesetStatusOutput(input);

  assert.deepEqual(result.suppressedWarnings, [workspaceWarning]);
  assert.equal(result.passthroughOutput, '🦋  info NO packages to be bumped at patch');
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
