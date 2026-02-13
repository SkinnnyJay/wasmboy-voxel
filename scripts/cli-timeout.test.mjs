import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveStrictPositiveIntegerEnv } from './cli-timeout.mjs';

test('resolveStrictPositiveIntegerEnv returns default for undefined values', () => {
  const timeout = resolveStrictPositiveIntegerEnv({
    name: 'TEST_TIMEOUT',
    rawValue: undefined,
    defaultValue: 120000,
  });

  assert.equal(timeout, 120000);
});

test('resolveStrictPositiveIntegerEnv parses numeric string values', () => {
  const timeout = resolveStrictPositiveIntegerEnv({
    name: 'TEST_TIMEOUT',
    rawValue: '  5000  ',
    defaultValue: 120000,
  });

  assert.equal(timeout, 5000);
});

test('resolveStrictPositiveIntegerEnv rejects non-numeric suffix values', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 'TEST_TIMEOUT',
        rawValue: '5000ms',
        defaultValue: 120000,
      }),
    /Invalid TEST_TIMEOUT value: 5000ms/u,
  );
});

test('resolveStrictPositiveIntegerEnv rejects zero values', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 'TEST_TIMEOUT',
        rawValue: '0',
        defaultValue: 120000,
      }),
    /Invalid TEST_TIMEOUT value: 0/u,
  );
});
