const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const getWasmBoyCorePath = path.resolve(process.cwd(), 'dist/core/getWasmBoyWasmCore.cjs.js');
const getWasmBoyCoreCjsPath = path.join(os.tmpdir(), 'getWasmBoyWasmCore.channel4-bounded.runtime.cjs');
fs.copyFileSync(getWasmBoyCorePath, getWasmBoyCoreCjsPath);
const getWasmBoyCore = require(getWasmBoyCoreCjsPath);

function createChannel4NoiseRom() {
  const rom = new Uint8Array(0x8000);
  let index = 0x100;

  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0xf0; // NR42: volume/envelope
  rom[index++] = 0xe0; // LDH (n), A
  rom[index++] = 0x21;

  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0x00; // NR43: short period
  rom[index++] = 0xe0;
  rom[index++] = 0x22;

  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0x80; // NR44 trigger
  rom[index++] = 0xe0;
  rom[index++] = 0x23;

  rom[index++] = 0x18; // JR -2
  rom[index++] = 0xfe;
  return rom;
}

describe('Channel 4 bounded cycle processing', function() {
  it('remains responsive when running many frames with active noise channel', async function() {
    this.timeout(30000);

    const wasmboyCore = await getWasmBoyCore();
    const wasmboy = wasmboyCore.instance.exports;
    const wasmByteMemoryArray = new Uint8Array(wasmboy.memory.buffer);

    wasmByteMemoryArray.set(createChannel4NoiseRom(), wasmboy.CARTRIDGE_ROM_LOCATION);
    wasmboy.config(
      0, // enableBootRom
      0, // useGbcWhenAvailable
      1, // audioBatchProcessing
      0, // graphicsBatchProcessing
      0, // timersBatchProcessing
      0, // graphicsDisableScanlineRendering
      1, // audioAccumulateSamples
      0, // tileRendering
      0, // tileCaching
      0, // enableAudioDebugging
    );

    wasmboy.executeMultipleFrames(240);
    const samples = wasmboy.getNumberOfSamplesInAudioBuffer();
    assert.ok(samples > 0, 'expected active channel 4 to produce audio samples without stalling');
  });
});
