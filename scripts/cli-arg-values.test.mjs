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

test('validateRequiredArgumentValue rejects bigint values', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue(42n, {
        flagName: '--output',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      }),
    /Invalid value type for --output argument: 42/u,
  );
});

test('validateRequiredArgumentValue rejects null values', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue(null, {
        flagName: '--output',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      }),
    /Invalid value type for --output argument: null/u,
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

test('validateRequiredArgumentValue rejects symbol options', () => {
  assert.throws(() => validateRequiredArgumentValue('value', Symbol('required-arg-options')), /Invalid required argument options\./u);
});

test('validateRequiredArgumentValue rejects bigint options', () => {
  assert.throws(() => validateRequiredArgumentValue('value', 42n), /Invalid required argument options\./u);
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

test('validateRequiredArgumentValue rejects whitespace-padded flag names', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: ' --output ',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      }),
    /Invalid flag name:\s+--output\s+/u,
  );
});

test('validateRequiredArgumentValue rejects null flag names', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: null,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      }),
    /Invalid flag name: null/u,
  );
});

test('validateRequiredArgumentValue rejects undefined flag names', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('50', {
        flagName: undefined,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      }),
    /Invalid flag name: undefined/u,
  );
});

test('validateRequiredArgumentValue rejects bigint flag names', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: 42n,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      }),
    /Invalid flag name: 42/u,
  );
});

test('validateRequiredArgumentValue rejects numeric flag names', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: 1234,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      }),
    /Invalid flag name: 1234/u,
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

test('validateRequiredArgumentValue rejects missing known-args options', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: '--output',
        allowDoubleDashValue: false,
      }),
    /Invalid known-args set for --output/u,
  );
});

test('validateRequiredArgumentValue rejects null known-args options', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: '--output',
        knownArgs: null,
        allowDoubleDashValue: false,
      }),
    /Invalid known-args set for --output/u,
  );
});

test('validateRequiredArgumentValue rejects symbol known-args options', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: '--output',
        knownArgs: Symbol('known-args'),
        allowDoubleDashValue: false,
      }),
    /Invalid known-args set for --output/u,
  );
});

test('validateRequiredArgumentValue rejects bigint known-args options', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: '--output',
        knownArgs: 42n,
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

test('validateRequiredArgumentValue rejects bigint known-args entries', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: '--output',
        knownArgs: new Set([42n]),
        allowDoubleDashValue: false,
      }),
    /Invalid known-args entries for --output/u,
  );
});

test('validateRequiredArgumentValue rejects symbol known-args entries', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: '--output',
        knownArgs: new Set([Symbol('known-arg')]),
        allowDoubleDashValue: false,
      }),
    /Invalid known-args entries for --output/u,
  );
});

test('validateRequiredArgumentValue rejects unprintable known-args entries', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: '--output',
        knownArgs: new Set([UNPRINTABLE_VALUE]),
        allowDoubleDashValue: false,
      }),
    /Invalid known-args entries for --output/u,
  );
});

test('validateRequiredArgumentValue rejects null known-args entries', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: '--output',
        knownArgs: new Set([null]),
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

test('validateRequiredArgumentValue rejects missing allowDoubleDashValue options', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: '--output',
        knownArgs: KNOWN_ARGS,
      }),
    /Invalid allowDoubleDashValue option for --output/u,
  );
});

test('validateRequiredArgumentValue rejects null allowDoubleDashValue options', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: '--output',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: null,
      }),
    /Invalid allowDoubleDashValue option for --output/u,
  );
});

test('validateRequiredArgumentValue rejects symbol allowDoubleDashValue options', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: '--output',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: Symbol('allow-double-dash'),
      }),
    /Invalid allowDoubleDashValue option for --output/u,
  );
});

test('validateRequiredArgumentValue rejects bigint allowDoubleDashValue options', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: '--output',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: 1n,
      }),
    /Invalid allowDoubleDashValue option for --output/u,
  );
});

test('validateRequiredArgumentValue rejects unprintable allowDoubleDashValue options', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: '--output',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: UNPRINTABLE_VALUE,
      }),
    /Invalid allowDoubleDashValue option for --output/u,
  );
});

test('validateRequiredArgumentValue rejects non-boolean allowWhitespaceOnly options', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: '--output',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: /** @type {unknown as boolean} */ ('yes'),
      }),
    /Invalid allowWhitespaceOnly option for --output/u,
  );
});

test('validateRequiredArgumentValue rejects null allowWhitespaceOnly options', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: '--output',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: null,
      }),
    /Invalid allowWhitespaceOnly option for --output/u,
  );
});

test('validateRequiredArgumentValue rejects symbol allowWhitespaceOnly options', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: '--output',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: Symbol('allow-whitespace-only'),
      }),
    /Invalid allowWhitespaceOnly option for --output/u,
  );
});

test('validateRequiredArgumentValue rejects bigint allowWhitespaceOnly options', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: '--output',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: 1n,
      }),
    /Invalid allowWhitespaceOnly option for --output/u,
  );
});

test('validateRequiredArgumentValue rejects unprintable allowWhitespaceOnly options', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('value', {
        flagName: '--output',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: UNPRINTABLE_VALUE,
      }),
    /Invalid allowWhitespaceOnly option for --output/u,
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

test('validateRequiredArgumentValue rejects symbol allowedKnownValues options', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('--help', {
        flagName: '--message',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
        allowedKnownValues: Symbol('allowed-known-values'),
      }),
    /Invalid allowedKnownValues set for --message/u,
  );
});

test('validateRequiredArgumentValue rejects bigint allowedKnownValues options', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('--help', {
        flagName: '--message',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
        allowedKnownValues: 42n,
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

test('validateRequiredArgumentValue rejects bigint allowedKnownValues entries', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('--help', {
        flagName: '--message',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
        allowedKnownValues: new Set([42n]),
      }),
    /Invalid allowedKnownValues entries for --message/u,
  );
});

test('validateRequiredArgumentValue rejects symbol allowedKnownValues entries', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('--help', {
        flagName: '--message',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
        allowedKnownValues: new Set([Symbol('allowed-known-value')]),
      }),
    /Invalid allowedKnownValues entries for --message/u,
  );
});

test('validateRequiredArgumentValue rejects unprintable allowedKnownValues entries', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('--help', {
        flagName: '--message',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
        allowedKnownValues: new Set([UNPRINTABLE_VALUE]),
      }),
    /Invalid allowedKnownValues entries for --message/u,
  );
});

test('validateRequiredArgumentValue rejects null allowedKnownValues entries', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('--help', {
        flagName: '--message',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
        allowedKnownValues: new Set([null]),
      }),
    /Invalid allowedKnownValues entries for --message/u,
  );
});

test('validateRequiredArgumentValue rejects allowedKnownValues entries absent from knownArgs', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue('--help', {
        flagName: '--message',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
        allowedKnownValues: new Set(['--not-known']),
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

test('readRequiredArgumentValue rejects bigint argv inputs', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(42n, 0, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Invalid argv array for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects undefined argv inputs', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(undefined, 0, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Invalid argv array for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects null argv inputs', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(null, 0, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Invalid argv array for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects symbol argv inputs', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(Symbol('argv'), 0, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Invalid argv array for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects unprintable argv inputs', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(UNPRINTABLE_VALUE, 0, {
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

test('readRequiredArgumentValue rejects bigint following argument values', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', 42n], 0, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Invalid value type for --timeout-ms argument: 42/u,
  );
});

test('readRequiredArgumentValue rejects null following argument values', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', null], 0, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Invalid value type for --timeout-ms argument: null/u,
  );
});

test('readRequiredArgumentValue rejects symbol following argument values', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', Symbol('timeout-value')], 0, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Invalid value type for --timeout-ms argument: Symbol\(timeout-value\)/u,
  );
});

test('readRequiredArgumentValue safely formats unprintable following argument values', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', UNPRINTABLE_VALUE], 0, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Invalid value type for --timeout-ms argument: \[unprintable\]/u,
  );
});

test('readRequiredArgumentValue rejects empty-string following argument values for required flags', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', ''], 0, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      }),
    /Missing value for --timeout-ms argument\./u,
  );
});

test('readRequiredArgumentValue remains inline-equals parser compatible for extracted values', () => {
  const flagName = '--timeout-ms';
  const inlineToken = '--timeout-ms=00050';
  const inlineExtractedValue = inlineToken.slice('--timeout-ms='.length);
  const options = {
    flagName,
    knownArgs: KNOWN_ARGS,
    allowDoubleDashValue: false,
    allowWhitespaceOnly: true,
  };
  assert.doesNotThrow(() => validateRequiredArgumentValue(inlineExtractedValue, options));
  const readSplitValue = readRequiredArgumentValue(['--timeout-ms', '00050'], 0, options);
  assert.equal(readSplitValue, inlineExtractedValue);
});

test('readRequiredArgumentValue rejects missing options objects', () => {
  assert.throws(() => readRequiredArgumentValue(['--timeout-ms', '50'], 0, undefined), /Invalid required argument options\./u);
});

test('readRequiredArgumentValue rejects null options objects', () => {
  assert.throws(() => readRequiredArgumentValue(['--timeout-ms', '50'], 0, null), /Invalid required argument options\./u);
});

test('readRequiredArgumentValue rejects array options', () => {
  assert.throws(() => readRequiredArgumentValue(['--timeout-ms', '50'], 0, []), /Invalid required argument options\./u);
});

test('readRequiredArgumentValue rejects symbol options', () => {
  assert.throws(
    () => readRequiredArgumentValue(['--timeout-ms', '50'], 0, Symbol('required-arg-options')),
    /Invalid required argument options\./u,
  );
});

test('readRequiredArgumentValue rejects bigint options', () => {
  assert.throws(() => readRequiredArgumentValue(['--timeout-ms', '50'], 0, 42n), /Invalid required argument options\./u);
});

test('readRequiredArgumentValue rejects non-object options', () => {
  assert.throws(() => readRequiredArgumentValue(['--timeout-ms', '50'], 0, 42), /Invalid required argument options\./u);
});

test('readRequiredArgumentValue rejects bigint flag names', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: 42n,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      }),
    /Invalid flag name: 42/u,
  );
});

test('readRequiredArgumentValue rejects numeric flag names', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: 1234,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      }),
    /Invalid flag name: 1234/u,
  );
});

test('readRequiredArgumentValue rejects whitespace-padded flag names', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: ' --timeout-ms ',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      }),
    /Invalid flag name:\s+--timeout-ms\s+/u,
  );
});

test('readRequiredArgumentValue safely formats unprintable flag names', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: UNPRINTABLE_VALUE,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      }),
    /Invalid flag name: \[unprintable\]/u,
  );
});

test('readRequiredArgumentValue rejects missing known-args options', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: '--timeout-ms',
        allowDoubleDashValue: false,
      }),
    /Invalid known-args set for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects null known-args options', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: '--timeout-ms',
        knownArgs: null,
        allowDoubleDashValue: false,
      }),
    /Invalid known-args set for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects symbol known-args options', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: '--timeout-ms',
        knownArgs: Symbol('known-args'),
        allowDoubleDashValue: false,
      }),
    /Invalid known-args set for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects bigint known-args options', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: '--timeout-ms',
        knownArgs: 42n,
        allowDoubleDashValue: false,
      }),
    /Invalid known-args set for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects non-string known-args entries', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: '--timeout-ms',
        knownArgs: new Set([42]),
        allowDoubleDashValue: false,
      }),
    /Invalid known-args entries for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects bigint known-args entries', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: '--timeout-ms',
        knownArgs: new Set([42n]),
        allowDoubleDashValue: false,
      }),
    /Invalid known-args entries for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects symbol known-args entries', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: '--timeout-ms',
        knownArgs: new Set([Symbol('known-arg')]),
        allowDoubleDashValue: false,
      }),
    /Invalid known-args entries for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects unprintable known-args entries', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: '--timeout-ms',
        knownArgs: new Set([UNPRINTABLE_VALUE]),
        allowDoubleDashValue: false,
      }),
    /Invalid known-args entries for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects whitespace-only known-args entries', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: '--timeout-ms',
        knownArgs: new Set(['  ']),
        allowDoubleDashValue: false,
      }),
    /Invalid known-args entries for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects missing allowDoubleDashValue options', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
      }),
    /Invalid allowDoubleDashValue option for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects null allowDoubleDashValue options', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: null,
      }),
    /Invalid allowDoubleDashValue option for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects symbol allowDoubleDashValue options', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: Symbol('allow-double-dash'),
      }),
    /Invalid allowDoubleDashValue option for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects bigint allowDoubleDashValue options', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: 1n,
      }),
    /Invalid allowDoubleDashValue option for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects unprintable allowDoubleDashValue options', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: UNPRINTABLE_VALUE,
      }),
    /Invalid allowDoubleDashValue option for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects non-boolean allowWhitespaceOnly options', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: /** @type {unknown as boolean} */ ('yes'),
      }),
    /Invalid allowWhitespaceOnly option for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects null allowWhitespaceOnly options', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: null,
      }),
    /Invalid allowWhitespaceOnly option for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects symbol allowWhitespaceOnly options', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: Symbol('allow-whitespace-only'),
      }),
    /Invalid allowWhitespaceOnly option for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects bigint allowWhitespaceOnly options', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: 1n,
      }),
    /Invalid allowWhitespaceOnly option for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects unprintable allowWhitespaceOnly options', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: UNPRINTABLE_VALUE,
      }),
    /Invalid allowWhitespaceOnly option for --timeout-ms/u,
  );
});

test('readRequiredArgumentValue rejects invalid allowedKnownValues options', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--message', '--help'], 0, {
        flagName: '--message',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
        allowedKnownValues: /** @type {unknown as Set<string>} */ (['--help']),
      }),
    /Invalid allowedKnownValues set for --message/u,
  );
});

test('readRequiredArgumentValue rejects symbol allowedKnownValues options', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--message', '--help'], 0, {
        flagName: '--message',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
        allowedKnownValues: Symbol('allowed-known-values'),
      }),
    /Invalid allowedKnownValues set for --message/u,
  );
});

test('readRequiredArgumentValue rejects bigint allowedKnownValues options', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--message', '--help'], 0, {
        flagName: '--message',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
        allowedKnownValues: 42n,
      }),
    /Invalid allowedKnownValues set for --message/u,
  );
});

test('readRequiredArgumentValue rejects allowedKnownValues entries absent from knownArgs', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--message', '--help'], 0, {
        flagName: '--message',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
        allowedKnownValues: new Set(['--not-known']),
      }),
    /Invalid allowedKnownValues entries for --message/u,
  );
});

test('readRequiredArgumentValue rejects null allowedKnownValues entries', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--message', '--help'], 0, {
        flagName: '--message',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
        allowedKnownValues: new Set([null]),
      }),
    /Invalid allowedKnownValues entries for --message/u,
  );
});

test('readRequiredArgumentValue rejects non-string allowedKnownValues entries', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--message', '--help'], 0, {
        flagName: '--message',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
        allowedKnownValues: new Set([42]),
      }),
    /Invalid allowedKnownValues entries for --message/u,
  );
});

test('readRequiredArgumentValue rejects bigint allowedKnownValues entries', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--message', '--help'], 0, {
        flagName: '--message',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
        allowedKnownValues: new Set([42n]),
      }),
    /Invalid allowedKnownValues entries for --message/u,
  );
});

test('readRequiredArgumentValue rejects symbol allowedKnownValues entries', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--message', '--help'], 0, {
        flagName: '--message',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
        allowedKnownValues: new Set([Symbol('allowed-known-value')]),
      }),
    /Invalid allowedKnownValues entries for --message/u,
  );
});

test('readRequiredArgumentValue rejects unprintable allowedKnownValues entries', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--message', '--help'], 0, {
        flagName: '--message',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
        allowedKnownValues: new Set([UNPRINTABLE_VALUE]),
      }),
    /Invalid allowedKnownValues entries for --message/u,
  );
});

test('readRequiredArgumentValue rejects whitespace-only allowedKnownValues entries', () => {
  assert.throws(
    () =>
      readRequiredArgumentValue(['--message', '--help'], 0, {
        flagName: '--message',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
        allowedKnownValues: new Set(['  ']),
      }),
    /Invalid allowedKnownValues entries for --message/u,
  );
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

test('readRequiredArgumentValue rejects null argument indexes', () => {
  const args = ['--timeout-ms', '00050'];
  assert.throws(
    () =>
      readRequiredArgumentValue(args, null, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Invalid argument index for --timeout-ms: null/u,
  );
});

test('readRequiredArgumentValue rejects undefined argument indexes', () => {
  const args = ['--timeout-ms', '00050'];
  assert.throws(
    () =>
      readRequiredArgumentValue(args, undefined, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Invalid argument index for --timeout-ms: undefined/u,
  );
});

test('readRequiredArgumentValue rejects bigint argument indexes', () => {
  const args = ['--timeout-ms', '00050'];
  assert.throws(
    () =>
      readRequiredArgumentValue(args, 1n, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Invalid argument index for --timeout-ms: 1/u,
  );
});

test('readRequiredArgumentValue rejects out-of-range argument indexes', () => {
  const args = ['--timeout-ms', '00050'];
  assert.throws(
    () =>
      readRequiredArgumentValue(args, 2, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Invalid argument index for --timeout-ms: 2/u,
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

test('readRequiredArgumentValue rejects NaN argument indexes', () => {
  const args = ['--timeout-ms', '00050'];
  assert.throws(
    () =>
      readRequiredArgumentValue(args, Number.NaN, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Invalid argument index for --timeout-ms: NaN/u,
  );
});

test('readRequiredArgumentValue rejects infinite argument indexes', () => {
  const args = ['--timeout-ms', '00050'];
  assert.throws(
    () =>
      readRequiredArgumentValue(args, Number.POSITIVE_INFINITY, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Invalid argument index for --timeout-ms: Infinity/u,
  );
});

test('readRequiredArgumentValue rejects negative infinite argument indexes', () => {
  const args = ['--timeout-ms', '00050'];
  assert.throws(
    () =>
      readRequiredArgumentValue(args, Number.NEGATIVE_INFINITY, {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Invalid argument index for --timeout-ms: -Infinity/u,
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

test('readRequiredArgumentValue rejects symbol argument indexes at upper-bound cursor positions', () => {
  const args = ['--timeout-ms'];
  assert.throws(
    () =>
      readRequiredArgumentValue(args, Symbol('upper-bound-index'), {
        flagName: '--timeout-ms',
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      }),
    /Invalid argument index for --timeout-ms: Symbol\(upper-bound-index\)/u,
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
