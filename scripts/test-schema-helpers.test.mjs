import assert from 'node:assert/strict';
import test from 'node:test';
import { registerThrowingCaseSchema } from './test-schema-helpers.mjs';

test('registerThrowingCaseSchema registers each throw expectation with test runner', () => {
  const names = [];

  registerThrowingCaseSchema({
    test(name, callback) {
      names.push(name);
      callback();
    },
    invoke(value) {
      if (typeof value === 'string') {
        throw new Error(value);
      }
    },
    cases: [
      { name: 'rejects alpha', value: 'alpha', expected: /alpha/u },
      { name: 'rejects beta', value: 'beta', expected: /beta/u },
    ],
  });

  assert.deepEqual(names, ['rejects alpha', 'rejects beta']);
});
