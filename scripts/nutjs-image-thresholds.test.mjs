import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveNutjsImageMatchThreshold } from './nutjs-image-thresholds.mjs';

test('resolveNutjsImageMatchThreshold chooses deterministic platform defaults', () => {
  assert.deepEqual(resolveNutjsImageMatchThreshold({ platform: 'win32', env: {} }), {
    platform: 'win32',
    profile: 'win32',
    threshold: 0.92,
    source: 'default',
  });
  assert.deepEqual(resolveNutjsImageMatchThreshold({ platform: 'darwin', env: {} }), {
    platform: 'darwin',
    profile: 'darwin',
    threshold: 0.94,
    source: 'default',
  });
  assert.deepEqual(resolveNutjsImageMatchThreshold({ platform: 'linux', env: { DISPLAY: ':99' } }), {
    platform: 'linux',
    profile: 'linux-x11',
    threshold: 0.93,
    source: 'default',
  });
});

test('resolveNutjsImageMatchThreshold resolves Linux Wayland profile when enabled', () => {
  const threshold = resolveNutjsImageMatchThreshold({
    platform: 'linux',
    env: {
      WAYLAND_DISPLAY: 'wayland-0',
      NUTJS_ENABLE_WAYLAND: '1',
    },
  });

  assert.deepEqual(threshold, {
    platform: 'linux',
    profile: 'linux-wayland',
    threshold: 0.9,
    source: 'default',
  });
});

test('resolveNutjsImageMatchThreshold applies override precedence in order', () => {
  assert.deepEqual(
    resolveNutjsImageMatchThreshold({
      platform: 'linux',
      env: {
        DISPLAY: ':99',
        NUTJS_IMAGE_MATCH_THRESHOLD: '0.77',
        NUTJS_IMAGE_MATCH_THRESHOLD_LINUX_X11: '0.8',
      },
    }),
    {
      platform: 'linux',
      profile: 'global',
      threshold: 0.77,
      source: 'NUTJS_IMAGE_MATCH_THRESHOLD',
    },
  );

  assert.deepEqual(
    resolveNutjsImageMatchThreshold({
      platform: 'linux',
      env: {
        DISPLAY: ':99',
        NUTJS_IMAGE_MATCH_THRESHOLD_LINUX_X11: '0.84',
      },
    }),
    {
      platform: 'linux',
      profile: 'linux-x11',
      threshold: 0.84,
      source: 'NUTJS_IMAGE_MATCH_THRESHOLD_LINUX_X11',
    },
  );

  assert.deepEqual(
    resolveNutjsImageMatchThreshold({
      platform: 'darwin',
      env: {
        NUTJS_IMAGE_MATCH_THRESHOLD_MACOS: '0.88',
      },
    }),
    {
      platform: 'darwin',
      profile: 'darwin',
      threshold: 0.88,
      source: 'NUTJS_IMAGE_MATCH_THRESHOLD_MACOS',
    },
  );
});

test('resolveNutjsImageMatchThreshold validates contracts and invalid values', () => {
  assert.throws(() => resolveNutjsImageMatchThreshold(null), /\[nutjs:image-thresholds\] Expected options to be an object\./u);
  assert.throws(
    () => resolveNutjsImageMatchThreshold({ platform: 7 }),
    /\[nutjs:image-thresholds\] Expected options\.platform to be a string when provided\./u,
  );
  assert.throws(
    () => resolveNutjsImageMatchThreshold({ platform: 'win32', env: { NUTJS_IMAGE_MATCH_THRESHOLD_WINDOWS: '1.5' } }),
    /\[nutjs:image-thresholds\] Invalid NUTJS_IMAGE_MATCH_THRESHOLD_WINDOWS value: 1\.5/u,
  );
  assert.throws(
    () => resolveNutjsImageMatchThreshold({ platform: 'darwin', env: { NUTJS_IMAGE_MATCH_THRESHOLD_MACOS: 'nope' } }),
    /\[nutjs:image-thresholds\] Invalid NUTJS_IMAGE_MATCH_THRESHOLD_MACOS value: nope/u,
  );
});
