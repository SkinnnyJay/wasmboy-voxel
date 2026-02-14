import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveNutjsMacOsPermissionState } from './nutjs-macos-permissions.mjs';

test('resolveNutjsMacOsPermissionState is a no-op on non-macOS platforms', () => {
  const state = resolveNutjsMacOsPermissionState({
    platform: 'linux',
    env: {},
  });

  assert.equal(state.isSupported, true);
  assert.equal(state.required, false);
  assert.deepEqual(state.reasons, []);
});

test('resolveNutjsMacOsPermissionState reports retry hints when accessibility is untrusted', () => {
  const state = resolveNutjsMacOsPermissionState({
    platform: 'darwin',
    env: {},
  });

  assert.equal(state.isSupported, false);
  assert.equal(state.required, true);
  assert.deepEqual(state.reasons, ['macos-accessibility-untrusted']);
  assert.ok(state.retryHints.length >= 3);
});

test('resolveNutjsMacOsPermissionState supports trusted accessibility override', () => {
  const state = resolveNutjsMacOsPermissionState({
    platform: 'darwin',
    env: {
      NUTJS_MACOS_ACCESSIBILITY_TRUSTED: '1',
    },
  });

  assert.equal(state.isSupported, true);
  assert.equal(state.trusted, true);
  assert.deepEqual(state.reasons, []);
});

test('resolveNutjsMacOsPermissionState validates option contracts and env flags', () => {
  assert.throws(() => resolveNutjsMacOsPermissionState(null), /\[nutjs:macos-permissions\] Expected options to be an object\./u);
  assert.throws(
    () => resolveNutjsMacOsPermissionState({ platform: 5 }),
    /\[nutjs:macos-permissions\] Expected options\.platform to be a string when provided\./u,
  );
  assert.throws(
    () => resolveNutjsMacOsPermissionState({ platform: 'darwin', env: { NUTJS_MACOS_ACCESSIBILITY_TRUSTED: 'maybe' } }),
    /\[nutjs:macos-permissions\] Invalid NUTJS_MACOS_ACCESSIBILITY_TRUSTED value: maybe/u,
  );
});
