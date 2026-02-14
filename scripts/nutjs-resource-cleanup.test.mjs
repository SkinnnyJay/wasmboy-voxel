import assert from 'node:assert/strict';
import test from 'node:test';
import { runNutjsWithResourceCleanup } from './nutjs-resource-cleanup.mjs';

test('runNutjsWithResourceCleanup disposes session after successful action', async () => {
  let disposed = false;
  const result = await runNutjsWithResourceCleanup({
    createSession: async () => ({
      dispose: async () => {
        disposed = true;
      },
    }),
    action: async () => ({ ok: true }),
    timeoutMs: 1000,
  });

  assert.equal(disposed, true);
  assert.deepEqual(result.actionResult, { ok: true });
  assert.equal(result.timeoutMs, 1000);
});

test('runNutjsWithResourceCleanup disposes session when action throws', async () => {
  let disposed = false;
  await assert.rejects(
    () =>
      runNutjsWithResourceCleanup({
        createSession: async () => ({
          dispose: async () => {
            disposed = true;
          },
        }),
        action: async () => {
          throw new Error('boom');
        },
        timeoutMs: 1000,
      }),
    /boom/u,
  );

  assert.equal(disposed, true);
});

test('runNutjsWithResourceCleanup times out long actions and still disposes session', async () => {
  let disposed = false;
  await assert.rejects(
    () =>
      runNutjsWithResourceCleanup({
        createSession: async () => ({
          dispose: async () => {
            disposed = true;
          },
        }),
        action: async () => {
          await new Promise(resolve => setTimeout(resolve, 30));
          return 'slow';
        },
        timeoutMs: 10,
      }),
    /\[nutjs:resource-cleanup\] action timed out after 10ms\./u,
  );

  assert.equal(disposed, true);
});

test('runNutjsWithResourceCleanup validates option contracts', async () => {
  await assert.rejects(() => runNutjsWithResourceCleanup(null), /\[nutjs:resource-cleanup\] Expected options to be an object\./u);
  await assert.rejects(
    () => runNutjsWithResourceCleanup({ action: 'nope' }),
    /\[nutjs:resource-cleanup\] Expected options\.action to be a function\./u,
  );
  await assert.rejects(
    () => runNutjsWithResourceCleanup({ action: async () => {}, createSession: 'nope' }),
    /\[nutjs:resource-cleanup\] Expected options\.createSession to be a function when provided\./u,
  );
  await assert.rejects(
    () => runNutjsWithResourceCleanup({ action: async () => {}, timeoutMs: 0 }),
    /\[nutjs:resource-cleanup\] Expected timeoutMs to be a positive integer when provided\./u,
  );
});
