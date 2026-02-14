const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const getWasmBoyCorePath = path.resolve(
  process.cwd(),
  'dist/core/getWasmBoyWasmCore.cjs.js',
);
const getWasmBoyCoreCjsPath = path.join(
  os.tmpdir(),
  'getWasmBoyWasmCore.invalid-memory.runtime.cjs',
);
fs.copyFileSync(getWasmBoyCorePath, getWasmBoyCoreCjsPath);
const getWasmBoyCore = require(getWasmBoyCoreCjsPath);

describe('Core invalid memory trap address handling', function () {
  it('returns sentinel -1 for out-of-range gameboy offsets', async function () {
    const wasmboyCore = await getWasmBoyCore();
    const wasmExports = wasmboyCore.instance.exports;

    assert.strictEqual(wasmExports.getWasmBoyOffsetFromGameBoyOffset(-1), -1);
    assert.strictEqual(wasmExports.getWasmBoyOffsetFromGameBoyOffset(0x10000), -1);
    assert.strictEqual(wasmExports.getWasmBoyOffsetFromGameBoyOffset(0x200000), -1);
  });

  it('continues mapping valid address boundaries into wasm memory space', async function () {
    const wasmboyCore = await getWasmBoyCore();
    const wasmExports = wasmboyCore.instance.exports;

    const lowerBoundary = wasmExports.getWasmBoyOffsetFromGameBoyOffset(0x0000);
    const upperBoundary = wasmExports.getWasmBoyOffsetFromGameBoyOffset(0xffff);

    assert.ok(lowerBoundary >= 0, '0x0000 should map to a valid wasm offset');
    assert.ok(upperBoundary >= 0, '0xFFFF should map to a valid wasm offset');
  });
});
