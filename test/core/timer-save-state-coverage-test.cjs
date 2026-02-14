const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const getWasmBoyCorePath = path.resolve(process.cwd(), 'dist/core/getWasmBoyWasmCore.cjs.js');
const getWasmBoyCoreCjsPath = path.join(os.tmpdir(), 'getWasmBoyWasmCore.timer-state.runtime.cjs');
fs.copyFileSync(getWasmBoyCorePath, getWasmBoyCoreCjsPath);
const getWasmBoyCore = require(getWasmBoyCoreCjsPath);

const WASMBOY_CONFIG_ARGS = [
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
];

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

function captureTimerSnapshot(wasmboy, wasmByteMemoryArray) {
  return {
    div: wasmboy.getDIV(),
    tima: wasmboy.getTIMA(),
    tma: wasmboy.getTMA(),
    tac: wasmboy.getTAC(),
    interruptFlags: readGbMemoryByte(wasmboy, wasmByteMemoryArray, 0xff0f),
  };
}

function readStateSlices(wasmboy, wasmByteMemoryArray) {
  return {
    cartridgeRam: wasmByteMemoryArray.slice(
      wasmboy.CARTRIDGE_RAM_LOCATION,
      wasmboy.CARTRIDGE_RAM_LOCATION + wasmboy.CARTRIDGE_RAM_SIZE,
    ),
    gameboyMemory: wasmByteMemoryArray.slice(
      wasmboy.GAMEBOY_INTERNAL_MEMORY_LOCATION,
      wasmboy.GAMEBOY_INTERNAL_MEMORY_LOCATION + wasmboy.GAMEBOY_INTERNAL_MEMORY_SIZE,
    ),
    paletteMemory: wasmByteMemoryArray.slice(
      wasmboy.GBC_PALETTE_LOCATION,
      wasmboy.GBC_PALETTE_LOCATION + wasmboy.GBC_PALETTE_SIZE,
    ),
    wasmboyState: wasmByteMemoryArray.slice(
      wasmboy.WASMBOY_STATE_LOCATION,
      wasmboy.WASMBOY_STATE_LOCATION + wasmboy.WASMBOY_STATE_SIZE,
    ),
  };
}

function writeStateSlices(wasmboy, wasmByteMemoryArray, snapshot) {
  wasmByteMemoryArray.set(snapshot.cartridgeRam, wasmboy.CARTRIDGE_RAM_LOCATION);
  wasmByteMemoryArray.set(snapshot.gameboyMemory, wasmboy.GAMEBOY_INTERNAL_MEMORY_LOCATION);
  wasmByteMemoryArray.set(snapshot.paletteMemory, wasmboy.GBC_PALETTE_LOCATION);
  wasmByteMemoryArray.set(snapshot.wasmboyState, wasmboy.WASMBOY_STATE_LOCATION);
}

describe('Core timer save-state coverage', function() {
  it('preserves timer evolution across save/load restore point', async function() {
    this.timeout(30000);

    const wasmboyCore = await getWasmBoyCore();
    const wasmboy = wasmboyCore.instance.exports;
    const wasmByteMemoryArray = new Uint8Array(wasmboy.memory.buffer);

    wasmByteMemoryArray.set(createTimerStressRom(), wasmboy.CARTRIDGE_ROM_LOCATION);
    wasmboy.config(...WASMBOY_CONFIG_ARGS);

    for (let step = 0; step < 30; step += 1) {
      wasmboy.executeStep();
    }

    wasmboy.saveState();
    const baselineState = readStateSlices(wasmboy, wasmByteMemoryArray);

    for (let step = 0; step < 60; step += 1) {
      wasmboy.executeStep();
    }
    const timerSnapshotAfterProgress = captureTimerSnapshot(wasmboy, wasmByteMemoryArray);

    writeStateSlices(wasmboy, wasmByteMemoryArray, baselineState);
    wasmboy.loadState();

    for (let step = 0; step < 60; step += 1) {
      wasmboy.executeStep();
    }
    const timerSnapshotAfterRestore = captureTimerSnapshot(wasmboy, wasmByteMemoryArray);

    assert.deepStrictEqual(
      timerSnapshotAfterRestore,
      timerSnapshotAfterProgress,
      'timer registers + interrupt flags should evolve identically after restore',
    );
  });
});
