import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveStrictPositiveIntegerEnv, resolveTimeoutFromCliAndEnv } from './cli-timeout.mjs';

test('resolveStrictPositiveIntegerEnv returns default for undefined values', () => {
  const timeout = resolveStrictPositiveIntegerEnv({
    name: 'TEST_TIMEOUT',
    rawValue: undefined,
    defaultValue: 120000,
  });

  assert.equal(timeout, 120000);
});

test('resolveStrictPositiveIntegerEnv rejects empty option names', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: '   ',
        rawValue: undefined,
        defaultValue: 120000,
      }),
    /Invalid timeout option name:\s+/u,
  );
});

test('resolveStrictPositiveIntegerEnv rejects non-string option names', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 42,
        rawValue: undefined,
        defaultValue: 120000,
      }),
    /Invalid timeout option name: 42/u,
  );
});

test('resolveStrictPositiveIntegerEnv rejects non-positive default values', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 'TEST_TIMEOUT',
        rawValue: undefined,
        defaultValue: 0,
      }),
    /Invalid default value for TEST_TIMEOUT: 0/u,
  );
});

test('resolveStrictPositiveIntegerEnv rejects non-integer default values', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 'TEST_TIMEOUT',
        rawValue: undefined,
        defaultValue: 12.5,
      }),
    /Invalid default value for TEST_TIMEOUT: 12\.5/u,
  );
});

test('resolveStrictPositiveIntegerEnv rejects non-finite default values', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 'TEST_TIMEOUT',
        rawValue: undefined,
        defaultValue: Number.NaN,
      }),
    /Invalid default value for TEST_TIMEOUT: NaN/u,
  );
});

test('resolveStrictPositiveIntegerEnv rejects infinite default values', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 'TEST_TIMEOUT',
        rawValue: undefined,
        defaultValue: Number.POSITIVE_INFINITY,
      }),
    /Invalid default value for TEST_TIMEOUT: Infinity/u,
  );
});

test('resolveStrictPositiveIntegerEnv rejects above-ceiling default values', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 'TEST_TIMEOUT',
        rawValue: undefined,
        defaultValue: 2_147_483_648,
      }),
    /Invalid default value for TEST_TIMEOUT: 2147483648/u,
  );
});

test('resolveStrictPositiveIntegerEnv returns default for empty-string values', () => {
  const timeout = resolveStrictPositiveIntegerEnv({
    name: 'TEST_TIMEOUT',
    rawValue: '',
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

test('resolveStrictPositiveIntegerEnv rejects plus-prefixed values', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 'TEST_TIMEOUT',
        rawValue: '+5000',
        defaultValue: 120000,
      }),
    /Invalid TEST_TIMEOUT value: \+5000/u,
  );
});

test('resolveStrictPositiveIntegerEnv rejects whitespace-only values', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 'TEST_TIMEOUT',
        rawValue: '   ',
        defaultValue: 120000,
      }),
    /Invalid TEST_TIMEOUT value:\s+/u,
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

test('resolveStrictPositiveIntegerEnv rejects negative values', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 'TEST_TIMEOUT',
        rawValue: '-5',
        defaultValue: 120000,
      }),
    /Invalid TEST_TIMEOUT value: -5/u,
  );
});

test('resolveStrictPositiveIntegerEnv rejects values above supported timeout ceiling', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 'TEST_TIMEOUT',
        rawValue: '2147483648',
        defaultValue: 120000,
      }),
    /Invalid TEST_TIMEOUT value: 2147483648/u,
  );
});

test('resolveStrictPositiveIntegerEnv accepts max supported timeout value', () => {
  const timeout = resolveStrictPositiveIntegerEnv({
    name: 'TEST_TIMEOUT',
    rawValue: ' 2147483647 ',
    defaultValue: 120000,
  });

  assert.equal(timeout, 2_147_483_647);
});

test('resolveStrictPositiveIntegerEnv accepts leading-zero values', () => {
  const timeout = resolveStrictPositiveIntegerEnv({
    name: 'TEST_TIMEOUT',
    rawValue: '00050',
    defaultValue: 120000,
  });

  assert.equal(timeout, 50);
});

test('resolveTimeoutFromCliAndEnv returns default when cli/env are unset', () => {
  const timeout = resolveTimeoutFromCliAndEnv({
    defaultValue: 120000,
    env: { name: 'TEST_TIMEOUT_ENV', rawValue: undefined },
    cli: { name: '--test-timeout', rawValue: undefined },
  });

  assert.equal(timeout, 120000);
});

test('resolveTimeoutFromCliAndEnv uses env timeout when cli override is unset', () => {
  const timeout = resolveTimeoutFromCliAndEnv({
    defaultValue: 120000,
    env: { name: 'TEST_TIMEOUT_ENV', rawValue: '5000' },
    cli: { name: '--test-timeout', rawValue: undefined },
  });

  assert.equal(timeout, 5000);
});

test('resolveTimeoutFromCliAndEnv lets cli timeout override env timeout', () => {
  const timeout = resolveTimeoutFromCliAndEnv({
    defaultValue: 120000,
    env: { name: 'TEST_TIMEOUT_ENV', rawValue: '5000' },
    cli: { name: '--test-timeout', rawValue: '50' },
  });

  assert.equal(timeout, 50);
});

test('resolveTimeoutFromCliAndEnv fails for invalid env timeout even when cli timeout is valid', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: 'invalid-timeout' },
        cli: { name: '--test-timeout', rawValue: '50' },
      }),
    /Invalid TEST_TIMEOUT_ENV value: invalid-timeout/u,
  );
});

test('resolveTimeoutFromCliAndEnv fails for invalid cli timeout even when env timeout is valid', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: '5000' },
        cli: { name: '--test-timeout', rawValue: 'invalid-timeout' },
      }),
    /Invalid --test-timeout value: invalid-timeout/u,
  );
});

test('resolveTimeoutFromCliAndEnv applies cli timeout when env timeout is empty', () => {
  const timeout = resolveTimeoutFromCliAndEnv({
    defaultValue: 120000,
    env: { name: 'TEST_TIMEOUT_ENV', rawValue: '' },
    cli: { name: '--test-timeout', rawValue: '50' },
  });

  assert.equal(timeout, 50);
});

test('resolveTimeoutFromCliAndEnv accepts whitespace-padded max timeout cli override', () => {
  const timeout = resolveTimeoutFromCliAndEnv({
    defaultValue: 120000,
    env: { name: 'TEST_TIMEOUT_ENV', rawValue: '50' },
    cli: { name: '--test-timeout', rawValue: ' 2147483647 ' },
  });

  assert.equal(timeout, 2_147_483_647);
});

test('resolveTimeoutFromCliAndEnv rejects whitespace-only cli timeout even with valid env timeout', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: '5000' },
        cli: { name: '--test-timeout', rawValue: '   ' },
      }),
    /Invalid --test-timeout value:\s+/u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects invalid default timeout values', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 0,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: undefined },
        cli: { name: '--test-timeout', rawValue: undefined },
      }),
    /Invalid default value for TEST_TIMEOUT_ENV: 0/u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects non-finite default timeout values', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: Number.POSITIVE_INFINITY,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: undefined },
        cli: { name: '--test-timeout', rawValue: undefined },
      }),
    /Invalid default value for TEST_TIMEOUT_ENV: Infinity/u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects invalid environment option names', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: ' ', rawValue: undefined },
        cli: { name: '--test-timeout', rawValue: undefined },
      }),
    /Invalid timeout option name:\s+/u,
  );
});
