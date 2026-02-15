const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const getWasmBoyCorePath = path.resolve(process.cwd(), 'dist/core/getWasmBoyWasmCore.cjs.js');
const getWasmBoyCoreCjsPath = path.join(os.tmpdir(), 'getWasmBoyWasmCore.bootrom-init.runtime.cjs');
fs.copyFileSync(getWasmBoyCorePath, getWasmBoyCoreCjsPath);
const getWasmBoyCore = require(getWasmBoyCoreCjsPath);

function readGbMemoryByte(wasmboy, wasmByteMemoryArray, address) {
  const offset = wasmboy.getWasmBoyOffsetFromGameBoyOffset(address);
  return wasmByteMemoryArray[offset];
}

describe('Boot ROM initialization state', function() {
  it('preserves power-on register defaults when boot ROM mode is enabled', async function() {
    this.timeout(30000);

    const wasmboyCore = await getWasmBoyCore();
    const wasmboy = wasmboyCore.instance.exports;
    const wasmByteMemoryArray = new Uint8Array(wasmboy.memory.buffer);

    const rom = new Uint8Array(0x8000);
    wasmByteMemoryArray.set(rom, wasmboy.CARTRIDGE_ROM_LOCATION);

    wasmboy.config(
      1, // enableBootRom
      0, // useGbcWhenAvailable
      0, // audioBatchProcessing
      0, // graphicsBatchProcessing
      0, // timersBatchProcessing
      0, // graphicsDisableScanlineRendering
      0, // audioAccumulateSamples
      0, // tileRendering
      0, // tileCaching
      0, // enableAudioDebugging
    );

    assert.strictEqual(readGbMemoryByte(wasmboy, wasmByteMemoryArray, 0xff00), 0x00, 'FF00 should remain power-on default');
    assert.strictEqual(readGbMemoryByte(wasmboy, wasmByteMemoryArray, 0xff02), 0x00, 'FF02 should remain power-on default');
    assert.strictEqual(readGbMemoryByte(wasmboy, wasmByteMemoryArray, 0xff0f), 0x00, 'IF should remain power-on default');
  });
});
