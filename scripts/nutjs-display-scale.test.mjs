import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveNutjsDisplayScale, transformNutjsPointerCoordinate } from './nutjs-display-scale.mjs';

test('resolveNutjsDisplayScale applies platform-specific scale overrides', () => {
  assert.deepEqual(resolveNutjsDisplayScale({ platform: 'win32', env: { NUTJS_WINDOWS_DPI_SCALE: '1.5' } }), {
    platform: 'win32',
    scale: 1.5,
    source: 'NUTJS_WINDOWS_DPI_SCALE',
  });
  assert.deepEqual(resolveNutjsDisplayScale({ platform: 'darwin', env: { NUTJS_MACOS_DPI_SCALE: '2' } }), {
    platform: 'darwin',
    scale: 2,
    source: 'NUTJS_MACOS_DPI_SCALE',
  });
});

test('resolveNutjsDisplayScale falls back to generic and default scale values', () => {
  assert.deepEqual(resolveNutjsDisplayScale({ platform: 'linux', env: { NUTJS_DPI_SCALE: '1.25' } }), {
    platform: 'linux',
    scale: 1.25,
    source: 'NUTJS_DPI_SCALE',
  });
  assert.deepEqual(resolveNutjsDisplayScale({ platform: 'linux', env: {} }), {
    platform: 'linux',
    scale: 1,
    source: 'default',
  });
});

test('resolveNutjsDisplayScale validates environment contracts and values', () => {
  assert.throws(() => resolveNutjsDisplayScale(null), /\[nutjs:display-scale\] Expected options to be an object\./u);
  assert.throws(
    () => resolveNutjsDisplayScale({ platform: 5 }),
    /\[nutjs:display-scale\] Expected options\.platform to be a string when provided\./u,
  );
  assert.throws(
    () => resolveNutjsDisplayScale({ platform: 'win32', env: { NUTJS_WINDOWS_DPI_SCALE: '0' } }),
    /\[nutjs:display-scale\] Invalid NUTJS_WINDOWS_DPI_SCALE value: 0/u,
  );
  assert.throws(
    () => resolveNutjsDisplayScale({ platform: 'darwin', env: { NUTJS_MACOS_DPI_SCALE: 'NaN' } }),
    /\[nutjs:display-scale\] Invalid NUTJS_MACOS_DPI_SCALE value: NaN/u,
  );
});

test('transformNutjsPointerCoordinate applies deterministic rounded scaling', () => {
  assert.deepEqual(transformNutjsPointerCoordinate({ x: 320, y: 180 }, { platform: 'win32', env: { NUTJS_WINDOWS_DPI_SCALE: '1.25' } }), {
    platform: 'win32',
    scale: 1.25,
    source: 'NUTJS_WINDOWS_DPI_SCALE',
    x: 400,
    y: 225,
  });

  assert.deepEqual(transformNutjsPointerCoordinate({ x: 100.4, y: 200.4 }, { platform: 'darwin', env: { NUTJS_MACOS_DPI_SCALE: '2' } }), {
    platform: 'darwin',
    scale: 2,
    source: 'NUTJS_MACOS_DPI_SCALE',
    x: 201,
    y: 401,
  });
});

test('transformNutjsPointerCoordinate validates coordinate contracts', () => {
  assert.throws(() => transformNutjsPointerCoordinate(null), /\[nutjs:display-scale\] Expected logicalCoordinate to be an object\./u);
  assert.throws(
    () => transformNutjsPointerCoordinate({ x: '1', y: 2 }),
    /\[nutjs:display-scale\] Expected logicalCoordinate\.x to be a finite number\./u,
  );
  assert.throws(
    () => transformNutjsPointerCoordinate({ x: 1, y: Number.NaN }),
    /\[nutjs:display-scale\] Expected logicalCoordinate\.y to be a finite number\./u,
  );
});
