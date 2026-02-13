import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveStrictPositiveIntegerEnv, resolveTimeoutFromCliAndEnv } from './cli-timeout.mjs';

const UNPRINTABLE_VALUE = {
  toString() {
    throw new Error('cannot stringify');
  },
};

test('resolveStrictPositiveIntegerEnv returns default for undefined values', () => {
  const timeout = resolveStrictPositiveIntegerEnv({
    name: 'TEST_TIMEOUT',
    rawValue: undefined,
    defaultValue: 120000,
  });

  assert.equal(timeout, 120000);
});

test('resolveStrictPositiveIntegerEnv rejects missing options objects', () => {
  assert.throws(() => resolveStrictPositiveIntegerEnv(undefined), /Invalid timeout env resolution options\./u);
});

test('resolveStrictPositiveIntegerEnv rejects null options objects', () => {
  assert.throws(() => resolveStrictPositiveIntegerEnv(null), /Invalid timeout env resolution options\./u);
});

test('resolveStrictPositiveIntegerEnv rejects array options objects', () => {
  assert.throws(() => resolveStrictPositiveIntegerEnv([]), /Invalid timeout env resolution options\./u);
});

test('resolveStrictPositiveIntegerEnv rejects non-object options objects', () => {
  assert.throws(() => resolveStrictPositiveIntegerEnv(42), /Invalid timeout env resolution options\./u);
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

test('resolveStrictPositiveIntegerEnv rejects null option names', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: null,
        rawValue: undefined,
        defaultValue: 120000,
      }),
    /Invalid timeout option name: null/u,
  );
});

test('resolveStrictPositiveIntegerEnv rejects undefined option names', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: undefined,
        rawValue: undefined,
        defaultValue: 120000,
      }),
    /Invalid timeout option name: undefined/u,
  );
});

test('resolveStrictPositiveIntegerEnv rejects symbol option names', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: Symbol('timeout'),
        rawValue: undefined,
        defaultValue: 120000,
      }),
    /Invalid timeout option name: Symbol\(timeout\)/u,
  );
});

test('resolveStrictPositiveIntegerEnv safely formats unprintable option names', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: UNPRINTABLE_VALUE,
        rawValue: undefined,
        defaultValue: 120000,
      }),
    /Invalid timeout option name: \[unprintable\]/u,
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

test('resolveStrictPositiveIntegerEnv rejects non-numeric default value types', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 'TEST_TIMEOUT',
        rawValue: undefined,
        defaultValue: '120000',
      }),
    /Invalid default value for TEST_TIMEOUT: 120000/u,
  );
});

test('resolveStrictPositiveIntegerEnv rejects null default value types', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 'TEST_TIMEOUT',
        rawValue: undefined,
        defaultValue: null,
      }),
    /Invalid default value for TEST_TIMEOUT: null/u,
  );
});

test('resolveStrictPositiveIntegerEnv rejects undefined default value types', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 'TEST_TIMEOUT',
        rawValue: undefined,
        defaultValue: undefined,
      }),
    /Invalid default value for TEST_TIMEOUT: undefined/u,
  );
});

test('resolveStrictPositiveIntegerEnv rejects symbol default value types', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 'TEST_TIMEOUT',
        rawValue: undefined,
        defaultValue: Symbol('timeout-default'),
      }),
    /Invalid default value for TEST_TIMEOUT: Symbol\(timeout-default\)/u,
  );
});

test('resolveStrictPositiveIntegerEnv safely formats unprintable default values', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 'TEST_TIMEOUT',
        rawValue: undefined,
        defaultValue: UNPRINTABLE_VALUE,
      }),
    /Invalid default value for TEST_TIMEOUT: \[unprintable\]/u,
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

test('resolveStrictPositiveIntegerEnv rejects negative infinite default values', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 'TEST_TIMEOUT',
        rawValue: undefined,
        defaultValue: Number.NEGATIVE_INFINITY,
      }),
    /Invalid default value for TEST_TIMEOUT: -Infinity/u,
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

test('resolveStrictPositiveIntegerEnv rejects non-string raw values', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 'TEST_TIMEOUT',
        rawValue: 5000,
        defaultValue: 120000,
      }),
    /Invalid TEST_TIMEOUT value: 5000/u,
  );
});

test('resolveStrictPositiveIntegerEnv rejects null raw values', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 'TEST_TIMEOUT',
        rawValue: null,
        defaultValue: 120000,
      }),
    /Invalid TEST_TIMEOUT value: null/u,
  );
});

test('resolveStrictPositiveIntegerEnv rejects symbol raw values', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 'TEST_TIMEOUT',
        rawValue: Symbol('timeout-raw'),
        defaultValue: 120000,
      }),
    /Invalid TEST_TIMEOUT value: Symbol\(timeout-raw\)/u,
  );
});

test('resolveStrictPositiveIntegerEnv safely formats unprintable raw values', () => {
  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 'TEST_TIMEOUT',
        rawValue: UNPRINTABLE_VALUE,
        defaultValue: 120000,
      }),
    /Invalid TEST_TIMEOUT value: \[unprintable\]/u,
  );
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

test('resolveTimeoutFromCliAndEnv rejects missing top-level options', () => {
  assert.throws(() => resolveTimeoutFromCliAndEnv(undefined), /Invalid timeout resolution options\./u);
});

test('resolveTimeoutFromCliAndEnv rejects null top-level options', () => {
  assert.throws(() => resolveTimeoutFromCliAndEnv(null), /Invalid timeout resolution options\./u);
});

test('resolveTimeoutFromCliAndEnv rejects array top-level options', () => {
  assert.throws(() => resolveTimeoutFromCliAndEnv([]), /Invalid timeout resolution options\./u);
});

test('resolveTimeoutFromCliAndEnv rejects non-object top-level options', () => {
  assert.throws(() => resolveTimeoutFromCliAndEnv(42), /Invalid timeout resolution options\./u);
});

test('resolveTimeoutFromCliAndEnv rejects missing env option objects', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: undefined,
        cli: { name: '--test-timeout', rawValue: undefined },
      }),
    /Invalid timeout env options\./u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects non-object env option values', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: 42,
        cli: { name: '--test-timeout', rawValue: undefined },
      }),
    /Invalid timeout env options\./u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects null env option values', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: null,
        cli: { name: '--test-timeout', rawValue: undefined },
      }),
    /Invalid timeout env options\./u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects array env option values', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: [],
        cli: { name: '--test-timeout', rawValue: undefined },
      }),
    /Invalid timeout env options\./u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects missing cli option objects', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: undefined },
        cli: undefined,
      }),
    /Invalid timeout cli options\./u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects non-object cli option values', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: undefined },
        cli: 42,
      }),
    /Invalid timeout cli options\./u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects null cli option values', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: undefined },
        cli: null,
      }),
    /Invalid timeout cli options\./u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects array cli option values', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: undefined },
        cli: [],
      }),
    /Invalid timeout cli options\./u,
  );
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

test('resolveTimeoutFromCliAndEnv rejects non-numeric default timeout value types', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: '120000',
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: undefined },
        cli: { name: '--test-timeout', rawValue: undefined },
      }),
    /Invalid default value for TEST_TIMEOUT_ENV: 120000/u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects null default timeout value types', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: null,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: undefined },
        cli: { name: '--test-timeout', rawValue: undefined },
      }),
    /Invalid default value for TEST_TIMEOUT_ENV: null/u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects symbol default timeout value types', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: Symbol('timeout-default'),
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: undefined },
        cli: { name: '--test-timeout', rawValue: undefined },
      }),
    /Invalid default value for TEST_TIMEOUT_ENV: Symbol\(timeout-default\)/u,
  );
});

test('resolveTimeoutFromCliAndEnv safely formats unprintable default timeout values', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: UNPRINTABLE_VALUE,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: undefined },
        cli: { name: '--test-timeout', rawValue: undefined },
      }),
    /Invalid default value for TEST_TIMEOUT_ENV: \[unprintable\]/u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects undefined default timeout value types', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: undefined,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: undefined },
        cli: { name: '--test-timeout', rawValue: undefined },
      }),
    /Invalid default value for TEST_TIMEOUT_ENV: undefined/u,
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

test('resolveTimeoutFromCliAndEnv rejects negative infinite default timeout values', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: Number.NEGATIVE_INFINITY,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: undefined },
        cli: { name: '--test-timeout', rawValue: undefined },
      }),
    /Invalid default value for TEST_TIMEOUT_ENV: -Infinity/u,
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

test('resolveTimeoutFromCliAndEnv rejects null environment option names', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: null, rawValue: undefined },
        cli: { name: '--test-timeout', rawValue: undefined },
      }),
    /Invalid timeout option name: null/u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects undefined environment option names', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: undefined, rawValue: undefined },
        cli: { name: '--test-timeout', rawValue: undefined },
      }),
    /Invalid timeout option name: undefined/u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects symbol environment option names', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: Symbol('env-timeout'), rawValue: undefined },
        cli: { name: '--test-timeout', rawValue: undefined },
      }),
    /Invalid timeout option name: Symbol\(env-timeout\)/u,
  );
});

test('resolveTimeoutFromCliAndEnv safely formats unprintable environment option names', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: UNPRINTABLE_VALUE, rawValue: undefined },
        cli: { name: '--test-timeout', rawValue: undefined },
      }),
    /Invalid timeout option name: \[unprintable\]/u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects non-string env timeout values', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: 5000 },
        cli: { name: '--test-timeout', rawValue: undefined },
      }),
    /Invalid TEST_TIMEOUT_ENV value: 5000/u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects null env timeout values', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: null },
        cli: { name: '--test-timeout', rawValue: undefined },
      }),
    /Invalid TEST_TIMEOUT_ENV value: null/u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects symbol env timeout values', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: Symbol('env-timeout-raw') },
        cli: { name: '--test-timeout', rawValue: undefined },
      }),
    /Invalid TEST_TIMEOUT_ENV value: Symbol\(env-timeout-raw\)/u,
  );
});

test('resolveTimeoutFromCliAndEnv safely formats unprintable env timeout values', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: UNPRINTABLE_VALUE },
        cli: { name: '--test-timeout', rawValue: undefined },
      }),
    /Invalid TEST_TIMEOUT_ENV value: \[unprintable\]/u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects null cli timeout values', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: '5000' },
        cli: { name: '--test-timeout', rawValue: null },
      }),
    /Invalid --test-timeout value: null/u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects symbol cli timeout values', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: undefined },
        cli: { name: '--test-timeout', rawValue: Symbol('cli-timeout-raw') },
      }),
    /Invalid --test-timeout value: Symbol\(cli-timeout-raw\)/u,
  );
});

test('resolveTimeoutFromCliAndEnv safely formats unprintable cli timeout values', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: undefined },
        cli: { name: '--test-timeout', rawValue: UNPRINTABLE_VALUE },
      }),
    /Invalid --test-timeout value: \[unprintable\]/u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects null cli option names', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: '5000' },
        cli: { name: null, rawValue: undefined },
      }),
    /Invalid timeout option name: null/u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects undefined cli option names', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: '5000' },
        cli: { name: undefined, rawValue: undefined },
      }),
    /Invalid timeout option name: undefined/u,
  );
});

test('resolveTimeoutFromCliAndEnv rejects symbol cli option names', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: undefined },
        cli: { name: Symbol('cli-timeout'), rawValue: undefined },
      }),
    /Invalid timeout option name: Symbol\(cli-timeout\)/u,
  );
});

test('resolveTimeoutFromCliAndEnv safely formats unprintable cli option names', () => {
  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: 120000,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: undefined },
        cli: { name: UNPRINTABLE_VALUE, rawValue: undefined },
      }),
    /Invalid timeout option name: \[unprintable\]/u,
  );
});
