import assert from 'node:assert/strict';
import test from 'node:test';
import { readRequiredArgumentValue, validateRequiredArgumentValue } from './cli-arg-values.mjs';
import { resolveStrictPositiveIntegerEnv, resolveTimeoutFromCliAndEnv } from './cli-timeout.mjs';

const PARSER_ITERATIONS = 20000;
const PARSER_LATENCY_BUDGET_MS = 2000;

const REQUIRED_VALUE_OPTIONS = {
  flagName: '--timeout-ms',
  knownArgs: new Set(['--help', '-h', '--timeout-ms']),
  allowDoubleDashValue: false,
  allowWhitespaceOnly: true,
};

test('cli argument value parsing stays within smoke latency budget', () => {
  const startTime = process.hrtime.bigint();

  for (let index = 0; index < PARSER_ITERATIONS; index += 1) {
    validateRequiredArgumentValue('50', REQUIRED_VALUE_OPTIONS);
    readRequiredArgumentValue(['--timeout-ms', '50'], 0, REQUIRED_VALUE_OPTIONS);
  }

  const elapsedMilliseconds = Number(process.hrtime.bigint() - startTime) / 1_000_000;
  assert.ok(
    elapsedMilliseconds < PARSER_LATENCY_BUDGET_MS,
    `cli argument parser smoke budget exceeded: ${elapsedMilliseconds.toFixed(2)}ms >= ${PARSER_LATENCY_BUDGET_MS}ms`,
  );
});

test('timeout resolution parsing stays within smoke latency budget', () => {
  const startTime = process.hrtime.bigint();

  for (let index = 0; index < PARSER_ITERATIONS; index += 1) {
    resolveStrictPositiveIntegerEnv({
      name: 'TEST_TIMEOUT',
      rawValue: '5000',
      defaultValue: 120000,
    });
    resolveTimeoutFromCliAndEnv({
      defaultValue: 120000,
      env: { name: 'TEST_TIMEOUT_ENV', rawValue: '5000' },
      cli: { name: '--test-timeout', rawValue: '50' },
    });
  }

  const elapsedMilliseconds = Number(process.hrtime.bigint() - startTime) / 1_000_000;
  assert.ok(
    elapsedMilliseconds < PARSER_LATENCY_BUDGET_MS,
    `timeout parser smoke budget exceeded: ${elapsedMilliseconds.toFixed(2)}ms >= ${PARSER_LATENCY_BUDGET_MS}ms`,
  );
});
