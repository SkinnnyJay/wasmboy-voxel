import assert from 'node:assert/strict';
import test from 'node:test';
import { readRequiredArgumentValue, validateRequiredArgumentValue } from './cli-arg-values.mjs';

const KNOWN_ARGS = new Set(['--help', '-h', '--output', '--pattern', '--timeout-ms']);
const HELP_ARGS = new Set(['--help', '-h']);

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
