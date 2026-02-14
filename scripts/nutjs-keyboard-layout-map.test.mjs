import assert from 'node:assert/strict';
import test from 'node:test';
import { mapScanCodesToNutjsKeyNames, resolveNutjsShortcutKeyNames, resolveNutjsShortcutScanCodes } from './nutjs-keyboard-layout-map.mjs';

test('resolveNutjsShortcutScanCodes normalizes modifier scan codes by platform', () => {
  assert.deepEqual(resolveNutjsShortcutScanCodes('open-devtools', 'linux'), ['ControlLeft', 'ShiftLeft', 'KeyI']);
  assert.deepEqual(resolveNutjsShortcutScanCodes('open-devtools', 'win32'), ['ControlLeft', 'ShiftLeft', 'KeyI']);
  assert.deepEqual(resolveNutjsShortcutScanCodes('open-devtools', 'darwin'), ['MetaLeft', 'AltLeft', 'KeyI']);
});

test('resolveNutjsShortcutScanCodes rejects invalid shortcut and platform contracts', () => {
  assert.throws(
    () => resolveNutjsShortcutScanCodes('', 'linux'),
    /\[nutjs:keyboard-map\] Expected shortcutName to be a non-empty string\./u,
  );
  assert.throws(
    () => resolveNutjsShortcutScanCodes('unknown-shortcut', 'linux'),
    /\[nutjs:keyboard-map\] Unknown shortcut "unknown-shortcut"\./u,
  );
  assert.throws(
    () => resolveNutjsShortcutScanCodes('open-devtools', ''),
    /\[nutjs:keyboard-map\] Expected platform to be a non-empty string\./u,
  );
});

test('mapScanCodesToNutjsKeyNames maps scan codes to NutJS key names', () => {
  assert.deepEqual(mapScanCodesToNutjsKeyNames(['ControlLeft', 'KeyR']), ['LeftControl', 'R']);
  assert.deepEqual(mapScanCodesToNutjsKeyNames(['MetaLeft', 'ShiftLeft', 'KeyR']), ['LeftSuper', 'LeftShift', 'R']);
});

test('mapScanCodesToNutjsKeyNames validates scan code contracts', () => {
  assert.throws(() => mapScanCodesToNutjsKeyNames('ControlLeft'), /\[nutjs:keyboard-map\] Expected scanCodes to be an array\./u);
  assert.throws(
    () => mapScanCodesToNutjsKeyNames(['ControlLeft', '']),
    /\[nutjs:keyboard-map\] Expected scanCodes\[1\] to be a non-empty string\./u,
  );
  assert.throws(
    () => mapScanCodesToNutjsKeyNames(['ControlLeft', 'KeyZ']),
    /\[nutjs:keyboard-map\] No NutJS key mapping defined for scan code "KeyZ"\./u,
  );
});

test('resolveNutjsShortcutKeyNames resolves cross-platform key chord names', () => {
  assert.deepEqual(resolveNutjsShortcutKeyNames('reload-page', 'linux'), ['LeftControl', 'R']);
  assert.deepEqual(resolveNutjsShortcutKeyNames('reload-page', 'darwin'), ['LeftSuper', 'R']);
  assert.deepEqual(resolveNutjsShortcutKeyNames('hard-reload-page', 'darwin'), ['LeftSuper', 'LeftShift', 'R']);
  assert.deepEqual(resolveNutjsShortcutKeyNames('focus-address-bar', 'win32'), ['LeftControl', 'L']);
});
