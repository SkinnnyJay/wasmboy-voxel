const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const getWasmBoyCorePath = path.resolve(process.cwd(), 'dist/core/getWasmBoyWasmCore.cjs.js');
const getWasmBoyCoreCjsPath = path.join(os.tmpdir(), 'getWasmBoyWasmCore.channel3-nr52.runtime.cjs');
fs.copyFileSync(getWasmBoyCorePath, getWasmBoyCoreCjsPath);
const getWasmBoyCore = require(getWasmBoyCoreCjsPath);

const CHANNEL3_SAVE_STATE_SLOT = 9;
const SAVE_STATE_SLOT_STRIDE = 50;
const CHANNEL3_SAMPLE_BUFFER_OFFSET = 0x27;

function createChannel3PowerCycleRom() {
  const rom = new Uint8Array(0x8000);
  let index = 0x100;

  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0xff; // wave byte seed
  rom[index++] = 0xe0; // LDH (n), A
  rom[index++] = 0x30; // FF30

  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0x80; // NR30 DAC on
  rom[index++] = 0xe0;
  rom[index++] = 0x1a;

  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0x20; // NR32 volume
  rom[index++] = 0xe0;
  rom[index++] = 0x1c;

  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0xff; // NR33 frequency low
  rom[index++] = 0xe0;
  rom[index++] = 0x1d;

  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0x87; // NR34 trigger + high freq
  rom[index++] = 0xe0;
  rom[index++] = 0x1e;

  rom[index++] = 0x00; // NOP
  rom[index++] = 0x00; // NOP

  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0x00; // NR52 off
  rom[index++] = 0xe0;
  rom[index++] = 0x26;

  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0x80; // NR52 on
  rom[index++] = 0xe0;
  rom[index++] = 0x26;

  rom[index++] = 0x18; // JR -2
  rom[index++] = 0xfe;
  return rom;
}

function readChannel3SampleBuffer(wasmboy, wasmByteMemoryArray) {
  wasmboy.saveState();
  const offset = wasmboy.WASMBOY_STATE_LOCATION + CHANNEL3_SAVE_STATE_SLOT * SAVE_STATE_SLOT_STRIDE + CHANNEL3_SAMPLE_BUFFER_OFFSET;
  return wasmByteMemoryArray[offset] | (wasmByteMemoryArray[offset + 1] << 8) | (wasmByteMemoryArray[offset + 2] << 16) | (wasmByteMemoryArray[offset + 3] << 24);
}

function writeChannel3SampleBuffer(wasmboy, wasmByteMemoryArray, value) {
  wasmboy.saveState();
  const offset = wasmboy.WASMBOY_STATE_LOCATION + CHANNEL3_SAVE_STATE_SLOT * SAVE_STATE_SLOT_STRIDE + CHANNEL3_SAMPLE_BUFFER_OFFSET;
  wasmByteMemoryArray[offset] = value & 0xff;
  wasmByteMemoryArray[offset + 1] = (value >> 8) & 0xff;
  wasmByteMemoryArray[offset + 2] = (value >> 16) & 0xff;
  wasmByteMemoryArray[offset + 3] = (value >> 24) & 0xff;
  wasmboy.loadState();
}

describe('Channel3 NR52 sample buffer reset', function() {
  it('resets wave channel sample buffer when NR52 powers sound back on', async function() {
    this.timeout(30000);

    const wasmboyCore = await getWasmBoyCore();
    const wasmboy = wasmboyCore.instance.exports;
    const wasmByteMemoryArray = new Uint8Array(wasmboy.memory.buffer);

    wasmByteMemoryArray.set(createChannel3PowerCycleRom(), wasmboy.CARTRIDGE_ROM_LOCATION);
    wasmboy.config(
      0, // enableBootRom
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

    for (let step = 0; step < 10; step += 1) {
      wasmboy.executeStep();
    }
    writeChannel3SampleBuffer(wasmboy, wasmByteMemoryArray, 0x7f);

    for (let step = 0; step < 10; step += 1) {
      wasmboy.executeStep();
    }
    const sampleBufferAfterPowerCycle = readChannel3SampleBuffer(wasmboy, wasmByteMemoryArray);
    assert.strictEqual(sampleBufferAfterPowerCycle, 0, 'expected NR52 power-on to reset channel3 sample buffer');
  });
});
