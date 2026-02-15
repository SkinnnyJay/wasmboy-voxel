const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const getWasmBoyCorePath = path.resolve(process.cwd(), 'dist/core/getWasmBoyWasmCore.cjs.js');
const getWasmBoyCoreCjsPath = path.join(os.tmpdir(), 'getWasmBoyWasmCore.channel3-dmg.runtime.cjs');
fs.copyFileSync(getWasmBoyCorePath, getWasmBoyCoreCjsPath);
const getWasmBoyCore = require(getWasmBoyCoreCjsPath);

function createDmgWaveRamReadRom() {
  const rom = new Uint8Array(0x8000);
  let index = 0x100;

  // Seed wave RAM while channel is disabled.
  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0x12;
  rom[index++] = 0xe0; // LDH (n), A
  rom[index++] = 0x30; // FF30

  // Enable CH3 DAC + output level.
  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0x80; // NR30 DAC on
  rom[index++] = 0xe0;
  rom[index++] = 0x1a;
  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0x20; // NR32 full volume
  rom[index++] = 0xe0;
  rom[index++] = 0x1c;

  // Frequency = 0 for long period, then trigger channel.
  rom[index++] = 0xaf; // XOR A
  rom[index++] = 0xe0;
  rom[index++] = 0x1d; // NR33
  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0x80; // NR34 trigger
  rom[index++] = 0xe0;
  rom[index++] = 0x1e;

  // Burn cycles so DMG wave RAM access window is closed.
  for (let i = 0; i < 32; i += 1) {
    rom[index++] = 0x00; // NOP
  }

  // Read FF30 while channel is enabled and persist result to C000.
  rom[index++] = 0xf0; // LDH A, (n)
  rom[index++] = 0x30; // FF30
  rom[index++] = 0xea; // LD (a16), A
  rom[index++] = 0x00;
  rom[index++] = 0xc0;

  // Halt loop.
  rom[index++] = 0x18; // JR -2
  rom[index++] = 0xfe;

  return rom;
}

function readGbMemoryByte(wasmboy, wasmByteMemoryArray, address) {
  const offset = wasmboy.getWasmBoyOffsetFromGameBoyOffset(address);
  return wasmByteMemoryArray[offset];
}

describe('Channel 3 DMG wave RAM access', function() {
  it('returns 0xFF for wave RAM reads outside DMG access window while channel is enabled', async function() {
    this.timeout(30000);

    const wasmboyCore = await getWasmBoyCore();
    const wasmboy = wasmboyCore.instance.exports;
    const wasmByteMemoryArray = new Uint8Array(wasmboy.memory.buffer);

    wasmByteMemoryArray.set(createDmgWaveRamReadRom(), wasmboy.CARTRIDGE_ROM_LOCATION);
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

    for (let step = 0; step < 120; step += 1) {
      wasmboy.executeStep();
    }

    const capturedReadValue = readGbMemoryByte(wasmboy, wasmByteMemoryArray, 0xc000);
    assert.strictEqual(capturedReadValue, 0xff, 'expected DMG wave RAM read to return 0xFF outside access window');
  });
});
