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
  'getWasmBoyWasmCore.serialization.runtime.cjs',
);
fs.copyFileSync(getWasmBoyCorePath, getWasmBoyCoreCjsPath);
const getWasmBoyCore = require(getWasmBoyCoreCjsPath);

const testRomsPath = path.join(__dirname, '../performance/testroms');
const getTestRomArray = () =>
  new Uint8Array(fs.readFileSync(path.join(testRomsPath, 'back-to-color/back-to-color.gbc')));

const WASMBOY_CONFIG_ARGS = [
  0, // enableBootRom
  1, // useGbcWhenAvailable
  1, // audioBatchProcessing
  0, // graphicsBatchProcessing
  0, // timersBatchProcessing
  0, // graphicsDisableScanlineRendering
  1, // audioAccumulateSamples
  0, // tileRendering
  0, // tileCaching
  0, // enableAudioDebugging
];

const VOLATILE_WASMBOY_STATE_DIFF_INDICES = new Set([54, 350, 351, 397, 400, 401, 450, 451, 500, 501, 502, 503]);

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

function assertStateSliceEqual(first, second, label) {
  assert.strictEqual(first.length, second.length, `${label} length should match`);
  assert.strictEqual(
    Buffer.compare(Buffer.from(first), Buffer.from(second)),
    0,
    `${label} bytes should match`,
  );
}

function assertWasmBoyStateDeterminism(first, second, label) {
  assert.strictEqual(first.length, second.length, `${label} length should match`);

  const unexpectedDiffs = [];
  for (let index = 0; index < first.length; index += 1) {
    if (first[index] === second[index]) {
      continue;
    }
    if (!VOLATILE_WASMBOY_STATE_DIFF_INDICES.has(index)) {
      unexpectedDiffs.push(index);
    }
  }

  assert.deepStrictEqual(
    unexpectedDiffs,
    [],
    `${label} should only differ at volatile indices (${Array.from(VOLATILE_WASMBOY_STATE_DIFF_INDICES).join(', ')})`,
  );
}

function assertSnapshotsEqual(firstSnapshot, secondSnapshot) {
  assertStateSliceEqual(firstSnapshot.cartridgeRam, secondSnapshot.cartridgeRam, 'cartridgeRam');
  assertStateSliceEqual(firstSnapshot.gameboyMemory, secondSnapshot.gameboyMemory, 'gameboyMemory');
  assertStateSliceEqual(firstSnapshot.paletteMemory, secondSnapshot.paletteMemory, 'paletteMemory');
  assertWasmBoyStateDeterminism(firstSnapshot.wasmboyState, secondSnapshot.wasmboyState, 'wasmboyState');
}

describe('Core serialization determinism', function () {
  it('preserves identical core memory snapshots across repeated save/load cycles', async function () {
    this.timeout(30000);

    const wasmboyCore = await getWasmBoyCore();
    const wasmboy = wasmboyCore.instance.exports;
    const wasmByteMemoryArray = new Uint8Array(wasmboy.memory.buffer);

    wasmByteMemoryArray.set(getTestRomArray(), wasmboy.CARTRIDGE_ROM_LOCATION);
    wasmboy.config(...WASMBOY_CONFIG_ARGS);

    wasmboy.executeMultipleFrames(60);
    wasmboy.clearAudioBuffer();
    wasmboy.saveState();
    const baselineSnapshot = readStateSlices(wasmboy, wasmByteMemoryArray);

    wasmboy.executeMultipleFrames(15);
    wasmboy.clearAudioBuffer();
    writeStateSlices(wasmboy, wasmByteMemoryArray, baselineSnapshot);
    wasmboy.loadState();
    wasmboy.saveState();
    const restoredSnapshot = readStateSlices(wasmboy, wasmByteMemoryArray);

    assertSnapshotsEqual(baselineSnapshot, restoredSnapshot);

    wasmboy.executeMultipleFrames(12);
    wasmboy.clearAudioBuffer();
    writeStateSlices(wasmboy, wasmByteMemoryArray, restoredSnapshot);
    wasmboy.loadState();
    wasmboy.saveState();
    const restoredAgainSnapshot = readStateSlices(wasmboy, wasmByteMemoryArray);

    assertSnapshotsEqual(restoredSnapshot, restoredAgainSnapshot);
  });
});
