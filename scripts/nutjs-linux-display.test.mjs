import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveNutjsLinuxDisplayStrategy } from './nutjs-linux-display.mjs';

test('resolveNutjsLinuxDisplayStrategy prefers X11 backend when DISPLAY is available', () => {
  const strategy = resolveNutjsLinuxDisplayStrategy({
    env: {
      DISPLAY: ':99',
    },
  });

  assert.equal(strategy.isSupported, true);
  assert.equal(strategy.selectedBackend, 'x11');
  assert.equal(strategy.fallbackBackend, 'x11');
  assert.deepEqual(strategy.reasons, []);
});

test('resolveNutjsLinuxDisplayStrategy gates Wayland backend unless explicitly enabled', () => {
  const disabledWayland = resolveNutjsLinuxDisplayStrategy({
    env: {
      WAYLAND_DISPLAY: 'wayland-0',
    },
  });
  assert.equal(disabledWayland.isSupported, false);
  assert.deepEqual(disabledWayland.reasons, ['linux-wayland-disabled']);
  assert.equal(disabledWayland.fallbackBackend, 'xvfb');

  const enabledWayland = resolveNutjsLinuxDisplayStrategy({
    env: {
      WAYLAND_DISPLAY: 'wayland-0',
      NUTJS_ENABLE_WAYLAND: '1',
    },
  });
  assert.equal(enabledWayland.isSupported, true);
  assert.equal(enabledWayland.selectedBackend, 'wayland');
});

test('resolveNutjsLinuxDisplayStrategy honors explicit backend overrides', () => {
  const forcedX11MissingDisplay = resolveNutjsLinuxDisplayStrategy({
    env: {
      NUTJS_LINUX_DISPLAY_BACKEND: 'x11',
    },
  });
  assert.equal(forcedX11MissingDisplay.isSupported, false);
  assert.deepEqual(forcedX11MissingDisplay.reasons, ['linux-x11-display-missing']);

  const forcedWaylandMissingDisplay = resolveNutjsLinuxDisplayStrategy({
    env: {
      NUTJS_LINUX_DISPLAY_BACKEND: 'wayland',
      DISPLAY: ':99',
    },
  });
  assert.equal(forcedWaylandMissingDisplay.isSupported, false);
  assert.deepEqual(forcedWaylandMissingDisplay.reasons, ['linux-wayland-display-missing']);
  assert.equal(forcedWaylandMissingDisplay.fallbackBackend, 'x11');
});

test('resolveNutjsLinuxDisplayStrategy validates option contracts', () => {
  assert.throws(() => resolveNutjsLinuxDisplayStrategy(null), /\[nutjs:linux-display\] Expected options to be an object\./u);
  assert.throws(
    () => resolveNutjsLinuxDisplayStrategy({ env: null }),
    /\[nutjs:linux-display\] Expected options\.env to be an object when provided\./u,
  );
  assert.throws(
    () => resolveNutjsLinuxDisplayStrategy({ env: { NUTJS_LINUX_DISPLAY_BACKEND: 'invalid' } }),
    /\[nutjs:linux-display\] Invalid NUTJS_LINUX_DISPLAY_BACKEND value: invalid/u,
  );
});
