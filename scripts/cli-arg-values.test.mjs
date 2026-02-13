import assert from 'node:assert/strict';
import test from 'node:test';
import { readRequiredArgumentValue, validateRequiredArgumentValue } from './cli-arg-values.mjs';

const KNOWN_ARGS = new Set(['--help', '-h', '--output', '--pattern', '--timeout-ms']);
const HELP_ARGS = new Set(['--help', '-h']);
const UNPRINTABLE_VALUE = {
  toString() {
    throw new Error('cannot stringify');
  },
};

test('validateRequiredArgumentValue accepts ordinary values', () => {
  assert.doesNotThrow(() => {
    validateRequiredArgumentValue('50', {
      flagName: '--timeout-ms',
      knownArgs: KNOWN_ARGS,
      allowDoubleDashValue: false,
      allowWhitespaceOnly: true,
    });
  });
});

test('validateRequiredArgumentValue rejects missing values', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue(undefined, {
        flagName: '--output',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      }),
    /Missing value for --output argument\./u,
  );
});

test('validateRequiredArgumentValue rejects non-string values', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue(42, {
        flagName: '--output',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      }),
    /Invalid value type for --output argument: 42/u,
  );
});

test('validateRequiredArgumentValue rejects symbol values', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue(Symbol('message'), {
        flagName: '--output',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      }),
    /Invalid value type for --output argument: Symbol\(message\)/u,
  );
});

test('validateRequiredArgumentValue safely formats unprintable values', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue(UNPRINTABLE_VALUE, {
        flagName: '--output',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      }),
    /Invalid value type for --output argument: \[unprintable\]/u,
  );
});

test('validateRequiredArgumentValue rejects missing options objects', () => {
  assert.throws(() => validateRequiredArgumentValue('value', undefined), /Invalid required argument options\./u);
});

test('validateRequiredArgumentValue rejects non-object options', () => {
  assert.throws(() => validateRequiredArgumentValue('value', 42), /Invalid required argument options\./u);
});

test('validateRequiredArgumentValue rejects array options', () => {
  assert.throws(() => validateRequiredArgumentValue('value', []), /Invalid required argument options\./u);
});

test('validateRequiredArgumentValue rejects symbol flag names', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: Symbol('timeout-flag'),
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      }),
    /Invalid flag name: Symbol\(timeout-flag\)/u,
  );
});

test('validateRequiredArgumentValue safely formats unprintable flag names', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: UNPRINTABLE_VALUE,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      }),
    /Invalid flag name: \[unprintable\]/u,
  );
});

test('validateRequiredArgumentValue rejects empty flag names', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: ' ',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      }),
    /Invalid flag name:\s+/u,
  );
});

test('validateRequiredArgumentValue rejects invalid known-args options', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: '--output',
        knownArgs: /** @type {unknown as Set<string>} */ (['--help']),
        allowDoubleDashValue: false,
      }),
    /Invalid known-args set for --output/u,
  );
});

test('validateRequiredArgumentValue rejects non-string known-args entries', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: '--output',
        knownArgs: new Set([42]),
        allowDoubleDashValue: false,
      }),
    /Invalid known-args entries for --output/u,
  );
});

test('validateRequiredArgumentValue rejects empty known-args entries', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: '--output',
        knownArgs: new Set(['']),
        allowDoubleDashValue: false,
      }),
    /Invalid known-args entries for --output/u,
  );
});

test('validateRequiredArgumentValue rejects non-boolean allowDoubleDashValue options', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: '--output',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: /** @type {unknown as boolean} */ ('yes'),
      }),
    /Invalid allowDoubleDashValue option for --output/u,
  );
});

test('validateRequiredArgumentValue rejects invalid allowedKnownValues options', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('--help', {
        flagName: '--message',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
        allowedKnownValues: /** @type {unknown as Set<string>} */ (['--help']),
      }),
    /Invalid allowedKnownValues set for --message/u,
  );
});

test('validateRequiredArgumentValue rejects non-string allowedKnownValues entries', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('--help', {
        flagName: '--message',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
        allowedKnownValues: new Set([42]),
      }),
    /Invalid allowedKnownValues entries for --message/u,
  );
});

test('validateRequiredArgumentValue rejects whitespace-only allowedKnownValues entries', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('--help', {
        flagName: '--message',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
        allowedKnownValues: new Set(['  ']),
      }),
    /Invalid allowedKnownValues entries for --message/u,
  );
});

test('validateRequiredArgumentValue rejects known argument tokens by default', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('--help', {
        flagName: '--pattern',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
      }),
    /Missing value for --pattern argument\./u,
  );
});

test('validateRequiredArgumentValue allows configured known tokens', () => {
  assert.doesNotThrow(() => {
    validateRequiredArgumentValue('--help', {
      flagName: '--message',
      knownArgs: KNOWN_ARGS,
      allowDoubleDashValue: true,
      allowWhitespaceOnly: true,
      allowedKnownValues: HELP_ARGS,
    });
  });
});

test('validateRequiredArgumentValue rejects whitespace-only values when disallowed', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('   ', {
        flagName: '--output',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      }),
    /Missing value for --output argument\./u,
  );
});

test('validateRequiredArgumentValue rejects flag-like tokens when double-dash values are disallowed', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('-h', {
        flagName: '--pattern',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Missing value for --pattern argument\./u,
  );
});

test('validateRequiredArgumentValue rejects unknown long-flag-like tokens when double-dash values are disallowed', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('--unknown-timeout', {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Missing value for --timeout-ms argument\./u,
  );
});

test('validateRequiredArgumentValue accepts whitespace-only values when explicitly allowed', () => {
  assert.doesNotThrow(() => {
    validateRequiredArgumentValue('   ', {
      flagName: '--timeout-ms',
      knownArgs: KNOWN_ARGS,
      allowDoubleDashValue: false,
      allowWhitespaceOnly: true,
    });
  });
});

test('readRequiredArgumentValue returns and validates following token', () => {
  const args = ['--timeout-ms', '00050'];
  const value = readRequiredArgumentValue(args, 0, {
    flagName: '--timeout-ms',
    knownArgs: KNOWN_ARGS,
    allowDoubleDashValue: false,
    allowWhitespaceOnly: true,
  });

  assert.equal(value, '00050');
});

test('readRequiredArgumentValue rejects non-array argv inputs', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue('not-an-array', 0, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Invalid argv array for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects non-string following argument values', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', 42], 0, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Invalid value type for --timeout-ms argument: 42/u,
  );
});

test('readRequiredArgumentValue rejects missing options objects', () => {
  assert.throws(() => readRequiredArgumentValue(['--timeout-ms', '50'], 0, undefined), /Invalid required argument options\./u);
});

test('readRequiredArgumentValue rejects array options', () => {
  assert.throws(() => readRequiredArgumentValue(['--timeout-ms', '50'], 0, []), /Invalid required argument options\./u);
});

test('readRequiredArgumentValue rejects invalid argument indexes', () => {
  const args = ['--timeout-ms', '00050'];
  assert.throws(
    () =>
      readRequiredArgumentValue(args, -1, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Invalid argument index for --timeout-ms: -1/u,
  );
});

test('readRequiredArgumentValue rejects non-integer argument indexes', () => {
  const args = ['--timeout-ms', '00050'];
  assert.throws(
    () =>
      readRequiredArgumentValue(args, 0.5, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Invalid argument index for --timeout-ms: 0\.5/u,
  );
});

test('readRequiredArgumentValue rejects symbol argument indexes', () => {
  const args = ['--timeout-ms', '00050'];
  assert.throws(
    () =>
      readRequiredArgumentValue(args, Symbol('index'), {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Invalid argument index for --timeout-ms: Symbol\(index\)/u,
  );
});

test('readRequiredArgumentValue safely formats unprintable argument indexes', () => {
  const args = ['--timeout-ms', '00050'];
  assert.throws(
    () =>
      readRequiredArgumentValue(args, UNPRINTABLE_VALUE, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Invalid argument index for --timeout-ms: \[unprintable\]/u,
  );
});

test('readRequiredArgumentValue allows configured known value tokens', () => {
  const args = ['--message', '--help'];
  const value = readRequiredArgumentValue(args, 0, {
    flagName: '--message',
    knownArgs: KNOWN_ARGS,
    allowDoubleDashValue: true,
    allowWhitespaceOnly: true,
    allowedKnownValues: HELP_ARGS,
  });

  assert.equal(value, '--help');
});

test('readRequiredArgumentValue rejects missing following tokens', () => {
  const args = ['--timeout-ms'];
  assert.throws(
    () =>
      readRequiredArgumentValue(args, 0, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Missing value for --timeout-ms argument\./u,
  );
});
