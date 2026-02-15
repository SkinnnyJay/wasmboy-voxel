const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const getWasmBoyCorePath = path.resolve(process.cwd(), 'dist/core/getWasmBoyWasmCore.cjs.js');
const getWasmBoyCoreCjsPath = path.join(os.tmpdir(), 'getWasmBoyWasmCore.timer-batch.runtime.cjs');
fs.copyFileSync(getWasmBoyCorePath, getWasmBoyCoreCjsPath);
const getWasmBoyCore = require(getWasmBoyCoreCjsPath);

function createTimerStressRom() {
  const rom = new Uint8Array(0x8000);
  rom[0x100] = 0x3e; // LD A, n
  rom[0x101] = 0xac; // TMA = 0xAC
  rom[0x102] = 0xe0; // LDH (n), A
  rom[0x103] = 0x06; // TMA
  rom[0x104] = 0x3e; // LD A, n
  rom[0x105] = 0xff; // TIMA = 0xFF
  rom[0x106] = 0xe0; // LDH (n), A
  rom[0x107] = 0x05; // TIMA
  rom[0x108] = 0x3e; // LD A, n
  rom[0x109] = 0x05; // TAC enable, 16-cycle clock
  rom[0x10a] = 0xe0; // LDH (n), A
  rom[0x10b] = 0x07; // TAC
  rom[0x10c] = 0x00; // NOP
  rom[0x10d] = 0x18; // JR -2
  rom[0x10e] = 0xfe;
  return rom;
}

function readGbMemoryByte(wasmboy, wasmByteMemoryArray, address) {
  const offset = wasmboy.getWasmBoyOffsetFromGameBoyOffset(address);
  return wasmByteMemoryArray[offset];
}

async function runWithTimersBatchProcessing(timersBatchProcessingEnabled) {
  const wasmboyCore = await getWasmBoyCore();
  const wasmboy = wasmboyCore.instance.exports;
  const wasmByteMemoryArray = new Uint8Array(wasmboy.memory.buffer);

  wasmByteMemoryArray.set(createTimerStressRom(), wasmboy.CARTRIDGE_ROM_LOCATION);
  wasmboy.config(
    0, // enableBootRom
    0, // useGbcWhenAvailable
    0, // audioBatchProcessing
    0, // graphicsBatchProcessing
    timersBatchProcessingEnabled ? 1 : 0, // timersBatchProcessing
    0, // graphicsDisableScanlineRendering
    0, // audioAccumulateSamples
    0, // tileRendering
    0, // tileCaching
    0, // enableAudioDebugging
  );

  for (let step = 0; step < 500; step += 1) {
    wasmboy.executeStep();
  }

  return {
    div: wasmboy.getDIV(),
    tima: wasmboy.getTIMA(),
    tma: wasmboy.getTMA(),
    tac: wasmboy.getTAC(),
    interruptFlags: readGbMemoryByte(wasmboy, wasmByteMemoryArray, 0xff0f),
    programCounter: wasmboy.getProgramCounter(),
  };
}

describe('Core timer batch processing determinism', function() {
  it('matches non-batch timer state evolution after identical instruction stream', async function() {
    this.timeout(30000);

    const baseline = await runWithTimersBatchProcessing(false);
    const batched = await runWithTimersBatchProcessing(true);

    assert.deepStrictEqual(
      batched,
      baseline,
      'timers batch processing should preserve timer/interrupt state deterministically',
    );
  });
});
