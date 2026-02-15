import assert from 'node:assert/strict';
import test from 'node:test';
import { runSubprocess } from './subprocess-test-harness.mjs';

test('runSubprocess returns completed subprocess results', () => {
  const result = runSubprocess(process.execPath, ['-e', 'process.stdout.write("ok");'], {
    description: 'node echo',
  });

  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'ok');
});

test('runSubprocess throws deterministic timeout errors for hung commands', () => {
  assert.throws(
    () =>
      runSubprocess(process.execPath, ['-e', 'setTimeout(() => {}, 1000);'], {
        timeoutMs: 10,
        description: 'node timeout fixture',
      }),
    /node timeout fixture timed out after 10ms/u,
  );
});
