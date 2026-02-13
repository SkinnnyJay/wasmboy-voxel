import assert from 'node:assert/strict';
import test from 'node:test';
import { filterChangesetStatusOutput } from './changeset-status-ci-lib.mjs';

test('filterChangesetStatusOutput suppresses expected workspace file warnings', () => {
  const input = [
    'Package "@wasmboy/debugger-app" must depend on the current version of "@wasmboy/api": "0.0.0" vs "file:../../packages/api"',
    'Package "@wasmboy/cli" must depend on the current version of "@wasmboy/api": "0.0.0" vs "file:../api"',
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
