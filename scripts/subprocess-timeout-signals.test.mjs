import assert from 'node:assert/strict';
import test from 'node:test';
import { attemptWindowsTimeoutTerminationFallback, resolveTimeoutKillSignal } from './subprocess-timeout-signals.mjs';

test('resolveTimeoutKillSignal uses SIGKILL on Windows and SIGTERM elsewhere', () => {
  assert.equal(resolveTimeoutKillSignal('win32'), 'SIGKILL');
  assert.equal(resolveTimeoutKillSignal('linux'), 'SIGTERM');
  assert.equal(resolveTimeoutKillSignal('darwin'), 'SIGTERM');
});

test('attemptWindowsTimeoutTerminationFallback returns false on non-Windows platforms', () => {
  const didFallback = attemptWindowsTimeoutTerminationFallback(1234, {
    platform: 'linux',
    spawn() {
      throw new Error('spawn should not be called on non-windows');
    },
  });
  assert.equal(didFallback, false);
});

test('attemptWindowsTimeoutTerminationFallback runs taskkill on Windows and reports success', () => {
  const spawnCalls = [];
  const didFallback = attemptWindowsTimeoutTerminationFallback(4567, {
    platform: 'win32',
    spawn(command, args, options) {
      spawnCalls.push({ command, args, options });
      return { status: 0 };
    },
  });

  assert.equal(didFallback, true);
  assert.deepEqual(spawnCalls, [
    {
      command: 'taskkill',
      args: ['/PID', '4567', '/T', '/F'],
      options: { stdio: 'ignore' },
    },
  ]);
});

test('attemptWindowsTimeoutTerminationFallback reports false when fallback spawn fails', () => {
  const didFallback = attemptWindowsTimeoutTerminationFallback(7890, {
    platform: 'win32',
    spawn() {
      return { status: 1, error: new Error('taskkill failed') };
    },
  });

  assert.equal(didFallback, false);
});
