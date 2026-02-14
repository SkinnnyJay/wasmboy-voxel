import assert from 'node:assert/strict';

/**
 * @param {{
 *   test: (name: string, fn: () => void) => void;
 *   invoke: (value: unknown) => void;
 *   cases: Array<{ name: string; value: unknown; expected: RegExp }>;
 * }} options
 */
export function registerThrowingCaseSchema(options) {
  const { test, invoke, cases } = options;

  for (const testCase of cases) {
    test(testCase.name, () => {
      assert.throws(() => invoke(testCase.value), testCase.expected);
    });
  }
}
