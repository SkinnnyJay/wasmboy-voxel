import assert from 'node:assert/strict';
import test from 'node:test';
import { runNutjsActionPlan } from './nutjs-action-dsl.mjs';

test('runNutjsActionPlan executes action steps and records timeline', async () => {
  const executionOrder = [];
  const result = await runNutjsActionPlan({
    actionSteps: [{ name: 'first' }, { name: 'second' }],
    handlers: {
      async first() {
        executionOrder.push('first');
        return { value: 1 };
      },
      async second() {
        executionOrder.push('second');
        return { value: 2 };
      },
    },
  });

  assert.deepEqual(executionOrder, ['first', 'second']);
  assert.deepEqual(result.results, {
    first: { value: 1 },
    second: { value: 2 },
  });
  assert.deepEqual(result.timeline, [
    { name: 'first', attempt: 1, status: 'passed' },
    { name: 'second', attempt: 1, status: 'passed' },
  ]);
});

test('runNutjsActionPlan retries failed steps before succeeding', async () => {
  let attempts = 0;
  const result = await runNutjsActionPlan({
    actionSteps: [{ name: 'flaky-step', retries: 2 }],
    handlers: {
      async 'flaky-step'() {
        attempts += 1;
        if (attempts < 3) {
          throw new Error(`failed-attempt-${String(attempts)}`);
        }
        return 'stable';
      },
    },
  });

  assert.equal(attempts, 3);
  assert.deepEqual(result.results, {
    'flaky-step': 'stable',
  });
  assert.deepEqual(result.timeline, [
    { name: 'flaky-step', attempt: 1, status: 'failed', error: 'failed-attempt-1' },
    { name: 'flaky-step', attempt: 2, status: 'failed', error: 'failed-attempt-2' },
    { name: 'flaky-step', attempt: 3, status: 'passed' },
  ]);
});

test('runNutjsActionPlan fails after retry budget is exhausted', async () => {
  await assert.rejects(
    () =>
      runNutjsActionPlan({
        actionSteps: [{ name: 'always-fail', retries: 1 }],
        handlers: {
          async 'always-fail'() {
            throw new Error('still-failing');
          },
        },
      }),
    /\[nutjs:action-dsl\] Action step "always-fail" failed after 2 attempt\(s\): still-failing/u,
  );
});

test('runNutjsActionPlan validates option and action-step contracts', async () => {
  await assert.rejects(() => runNutjsActionPlan(null), /\[nutjs:action-dsl\] Expected options to be an object\./u);
  await assert.rejects(
    () => runNutjsActionPlan({ actionSteps: 'bad', handlers: {} }),
    /\[nutjs:action-dsl\] Expected options\.actionSteps to be an array\./u,
  );
  await assert.rejects(
    () => runNutjsActionPlan({ actionSteps: [{ name: '' }], handlers: {} }),
    /\[nutjs:action-dsl\] Expected actionSteps\[0\]\.name to be a non-empty string\./u,
  );
  await assert.rejects(
    () => runNutjsActionPlan({ actionSteps: [{ name: 'missing' }], handlers: {} }),
    /\[nutjs:action-dsl\] Missing handler for action step "missing"\./u,
  );
});
