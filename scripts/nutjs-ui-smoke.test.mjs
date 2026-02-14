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
    platform: 'darwin',
    env: {},
    loader: async () => {
      throw new Error('Cannot find module');
    },
  });

  assert.equal(summary.status, 'skipped');
  assert.deepEqual(summary.reasons, ['nutjs-module-unavailable']);
  assert.match(summary.moduleLoadError ?? '', /Cannot find module/u);
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
  assert.deepEqual(summary.smokeMetadata, { validated: true });
});
