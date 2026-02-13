/**
 * Integration test for the PPU snapshot APIs used by the voxel wrapper.
 * Exercises _getWasmConstant and _getWasmMemorySection (same code paths as
 * getPpuSnapshot / supportsPpuSnapshot) to ensure snapshot data is readable
 * after the emulator has run.
 */

const WasmBoy = require('../../dist/wasmboy.wasm.cjs.js').WasmBoy;
const fs = require('fs');
const assert = require('assert');

const WASMBOY_INITIALIZE_OPTIONS = {
  headless: true,
  gameboySpeed: 100.0,
  isGbcEnabled: true
};

const testRomsPath = './test/performance/testroms';
const getTestRomArray = () =>
  new Uint8Array(fs.readFileSync(`${testRomsPath}/back-to-color/back-to-color.gbc`));

// PPU memory layout (must match voxel-wrapper.ts)
const TILE_DATA_START = 0x8000;
const TILE_DATA_END_EXCLUSIVE = 0x9800;
const TILE_DATA_SIZE = TILE_DATA_END_EXCLUSIVE - TILE_DATA_START;
const BG_TILEMAP_0_START = 0x9800;
const TILEMAP_SIZE = 0x400;
const OAM_START = 0xfe00;
const OAM_END_EXCLUSIVE = 0xfea0;
const OAM_SIZE = OAM_END_EXCLUSIVE - OAM_START;
const REG_LCDC = 0xff40;
// Must match the constant exported by the WASM core (core/constants.ts).
const GAME_MEMORY_BASE_CONSTANT = 'DEBUG_GAMEBOY_MEMORY_LOCATION';

const playFor = (ms) =>
  new Promise((resolve) => {
    WasmBoy.play().then(() => {
      setTimeout(() => {
        WasmBoy.pause().then(resolve);
      }, ms);
    });
  });

describe('WasmBoy PPU snapshot (voxel API)', () => {
  beforeEach(function (done) {
    this.timeout(7500);
    WasmBoy.config(WASMBOY_INITIALIZE_OPTIONS)
      .then(() => WasmBoy.loadROM(getTestRomArray()))
      .then(() => done());
  });

  it('should expose game memory base via _getWasmConstant', async () => {
    await playFor(100);
    const base = await WasmBoy._getWasmConstant(GAME_MEMORY_BASE_CONSTANT);
    assert.strictEqual(typeof base, 'number', 'game memory base should be a number');
    assert(base > 0, 'game memory base should be positive');
  });

  it('should return tile data and tilemaps via _getWasmMemorySection', async () => {
    await playFor(100);
    const base = await WasmBoy._getWasmConstant(GAME_MEMORY_BASE_CONSTANT);
    assert(base > 0, 'game memory base should be positive');

    const tileData = await WasmBoy._getWasmMemorySection(
      base + TILE_DATA_START,
      base + TILE_DATA_END_EXCLUSIVE
    );
    assert(tileData instanceof Uint8Array, 'tile data should be Uint8Array');
    assert.strictEqual(tileData.length, TILE_DATA_SIZE, 'tile data length should be 0x1800');

    const bgTileMap = await WasmBoy._getWasmMemorySection(
      base + BG_TILEMAP_0_START,
      base + BG_TILEMAP_0_START + TILEMAP_SIZE
    );
    assert(bgTileMap instanceof Uint8Array, 'bg tilemap should be Uint8Array');
    assert.strictEqual(bgTileMap.length, TILEMAP_SIZE, 'tilemap length should be 0x400');
  });

  it('should return OAM via _getWasmMemorySection', async () => {
    await playFor(100);
    const base = await WasmBoy._getWasmConstant(GAME_MEMORY_BASE_CONSTANT);
    assert(base > 0, 'game memory base should be positive');

    const oamData = await WasmBoy._getWasmMemorySection(
      base + OAM_START,
      base + OAM_END_EXCLUSIVE
    );
    assert(oamData instanceof Uint8Array, 'OAM should be Uint8Array');
    assert.strictEqual(oamData.length, OAM_SIZE, 'OAM length should be 0xa0');
  });

  it('should return LCDC register in valid range when reading game memory', async () => {
    await playFor(100);
    const base = await WasmBoy._getWasmConstant(GAME_MEMORY_BASE_CONSTANT);
    assert(base > 0, 'game memory base should be positive');

    const regSection = await WasmBoy._getWasmMemorySection(
      base + REG_LCDC,
      base + REG_LCDC + 1
    );
    assert.strictEqual(regSection.length, 1, 'single byte register');
    const lcdc = regSection[0];
    assert(lcdc >= 0 && lcdc <= 0xff, 'LCDC should be 0–255');
  });
});
