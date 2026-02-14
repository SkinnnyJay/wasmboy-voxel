import assert from 'node:assert/strict';
import test from 'node:test';
import { parseNutjsUiSmokeArgs, resolveNutjsUiCapabilities, runNutjsUiSmoke } from './nutjs-ui-smoke.mjs';

test('parseNutjsUiSmokeArgs parses baseline flags', () => {
  assert.deepEqual(parseNutjsUiSmokeArgs([]), { jsonOutput: false, shouldPrintUsage: false, strict: false });
  assert.deepEqual(parseNutjsUiSmokeArgs(['--json']), { jsonOutput: true, shouldPrintUsage: false, strict: false });
  assert.deepEqual(parseNutjsUiSmokeArgs(['--strict']), { jsonOutput: false, shouldPrintUsage: false, strict: true });
  assert.deepEqual(parseNutjsUiSmokeArgs(['--help']), { jsonOutput: false, shouldPrintUsage: true, strict: false });
  assert.deepEqual(parseNutjsUiSmokeArgs(['-h']), { jsonOutput: false, shouldPrintUsage: true, strict: false });
  assert.deepEqual(parseNutjsUiSmokeArgs(['--json', '--strict']), { jsonOutput: true, shouldPrintUsage: false, strict: true });
});

test('parseNutjsUiSmokeArgs rejects malformed arg contracts', () => {
  assert.throws(() => parseNutjsUiSmokeArgs('--json'), /\[nutjs:ui-smoke\] Expected argv to be an array\./u);
  assert.throws(() => parseNutjsUiSmokeArgs(['--json', 3]), /\[nutjs:ui-smoke\] Expected argv\[1\] to be a string\./u);
  assert.throws(() => parseNutjsUiSmokeArgs(['--json', '--json']), /\[nutjs:ui-smoke\] Duplicate --json flag received\./u);
  assert.throws(() => parseNutjsUiSmokeArgs(['--strict', '--strict']), /\[nutjs:ui-smoke\] Duplicate --strict flag received\./u);
  assert.throws(
    () => parseNutjsUiSmokeArgs(['--unknown']),
    /\[nutjs:ui-smoke\] Unknown argument "--unknown"\. Supported flags: --json, --strict, --help\./u,
  );
});

test('resolveNutjsUiCapabilities reports linux display requirements', () => {
  const missingDisplay = resolveNutjsUiCapabilities({
    platform: 'linux',
    env: {},
    nutjsModuleAvailable: true,
  });
  assert.equal(missingDisplay.isSupported, false);
  assert.deepEqual(missingDisplay.reasons, ['linux-display-unavailable']);

  const displayPresent = resolveNutjsUiCapabilities({
    platform: 'linux',
    env: { DISPLAY: ':99' },
    nutjsModuleAvailable: true,
  });
  assert.equal(displayPresent.isSupported, true);
  assert.deepEqual(displayPresent.reasons, []);
});

test('runNutjsUiSmoke skips when nutjs module is unavailable', async () => {
  const summary = await runNutjsUiSmoke({
    platform: 'linux',
    env: {
      DISPLAY: ':99',
    },
    loader: async () => {
      throw new Error('Cannot find module');
    },
  });

  assert.equal(summary.status, 'skipped');
  assert.deepEqual(summary.reasons, ['nutjs-module-unavailable']);
  assert.match(summary.moduleLoadError ?? '', /Cannot find module/u);
});

test('runNutjsUiSmoke reports Linux display fallback metadata when only Wayland is present', async () => {
  const summary = await runNutjsUiSmoke({
    platform: 'linux',
    env: {
      WAYLAND_DISPLAY: 'wayland-0',
    },
    loader: async () => ({ keyboard: {}, mouse: {} }),
  });

  assert.equal(summary.status, 'skipped');
  assert.deepEqual(summary.reasons, ['linux-wayland-disabled']);
  assert.equal(summary.capabilityMetadata.linuxDisplayStrategy.fallbackBackend, 'xvfb');
  assert.equal(summary.capabilityMetadata.linuxDisplayStrategy.selectedBackend, null);
});

test('runNutjsUiSmoke rejects unavailable environments in strict mode', async () => {
  await assert.rejects(
    () =>
      runNutjsUiSmoke({
        strict: true,
        platform: 'darwin',
        env: {},
        loader: async () => {
          throw new Error('Cannot find module');
        },
      }),
    /\[nutjs:ui-smoke\] Environment does not support NutJS smoke run: nutjs-module-unavailable/u,
  );
});

test('runNutjsUiSmoke executes smoke action with loaded NutJS module', async () => {
  let smokeActionInvoked = false;
  const summary = await runNutjsUiSmoke({
    platform: 'linux',
    env: { DISPLAY: ':99' },
    loader: async () => ({ keyboard: { type: async () => {} }, mouse: {} }),
    smokeAction: async ({ nutjsModule, platform }) => {
      smokeActionInvoked = true;
      assert.equal(platform, 'linux');
      assert.equal(typeof nutjsModule, 'object');
      return {
        validated: true,
      };
    },
  });

  assert.equal(smokeActionInvoked, true);
  assert.equal(summary.status, 'passed');
  assert.deepEqual(summary.reasons, []);
  assert.deepEqual(summary.smokeMetadata, {
    validated: true,
    resourceCleanup: {
      timeoutMs: 10000,
    },
  });
});

test('runNutjsUiSmoke default smoke action reports platform shortcut mapping metadata', async () => {
  const summary = await runNutjsUiSmoke({
    platform: 'darwin',
    env: {
      NUTJS_MACOS_ACCESSIBILITY_TRUSTED: '1',
    },
    loader: async () => ({ keyboard: {}, mouse: {} }),
  });

  assert.equal(summary.status, 'passed');
  assert.deepEqual(summary.smokeMetadata.defaultShortcutAction, 'open-devtools');
  assert.deepEqual(summary.smokeMetadata.defaultShortcutScanCodes, ['MetaLeft', 'AltLeft', 'KeyI']);
  assert.deepEqual(summary.smokeMetadata.defaultShortcutKeyNames, ['LeftSuper', 'LeftAlt', 'I']);
  assert.deepEqual(summary.smokeMetadata.pointerTransformSample, {
    platform: 'darwin',
    scale: 1,
    source: 'default',
    x: 320,
    y: 180,
  });
  assert.deepEqual(summary.smokeMetadata.imageMatchThreshold, {
    platform: 'darwin',
    profile: 'darwin',
    threshold: 0.94,
    source: 'default',
  });
  assert.deepEqual(summary.smokeMetadata.memoryGuard.beforeDispose, {
    maxTrackedBuffers: 4,
    maxTrackedBytes: 1024,
    trackedBuffers: 2,
    trackedBytes: 896,
    evictedBuffers: 1,
    evictedBytes: 256,
  });
  assert.deepEqual(summary.smokeMetadata.memoryGuard.afterDispose, {
    maxTrackedBuffers: 4,
    maxTrackedBytes: 1024,
    trackedBuffers: 0,
    trackedBytes: 0,
    evictedBuffers: 1,
    evictedBytes: 256,
  });
  assert.deepEqual(summary.smokeMetadata.resourceCleanup, {
    timeoutMs: 10000,
  });
});

test('runNutjsUiSmoke reports macOS accessibility retry hints when untrusted', async () => {
  const summary = await runNutjsUiSmoke({
    platform: 'darwin',
    env: {},
    loader: async () => ({ keyboard: {}, mouse: {} }),
  });

  assert.equal(summary.status, 'skipped');
  assert.deepEqual(summary.reasons, ['macos-accessibility-untrusted']);
  assert.ok(summary.capabilityMetadata.macosPermissionState.retryHints.length >= 3);
});

test('runNutjsUiSmoke enforces timeout and disposes custom sessions', async () => {
  let disposed = false;
  await assert.rejects(
    () =>
      runNutjsUiSmoke({
        platform: 'linux',
        env: {
          DISPLAY: ':99',
        },
        timeoutMs: 10,
        loader: async () => ({ keyboard: {}, mouse: {} }),
        createSession: async () => ({
          dispose: async () => {
            disposed = true;
          },
        }),
        smokeAction: async () => {
          await new Promise(resolve => setTimeout(resolve, 30));
          return { shouldNotReach: true };
        },
      }),
    /\[nutjs:resource-cleanup\] action timed out after 10ms\./u,
  );
  assert.equal(disposed, true);
});
