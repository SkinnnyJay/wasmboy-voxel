const assert = require('assert');
const fs = require('fs');

const WasmBoy = require('../load-wasmboy-ts-runtime.cjs');

const TEST_ROM_PATH = './test/performance/testroms/back-to-color/back-to-color.gbc';
const TEST_CONFIG = {
  headless: true,
  gameboySpeed: 100.0,
  isGbcEnabled: true,
};

describe('WasmBoy TS build smoke', () => {
  beforeEach(async function() {
    this.timeout(10000);
    await WasmBoy.config(TEST_CONFIG);
    const rom = new Uint8Array(fs.readFileSync(TEST_ROM_PATH));
    await WasmBoy.loadROM(rom);
  });

  it('loads and advances frames via CJS TS runtime', async () => {
    await WasmBoy._runWasmExport('executeFrame', []);
    await WasmBoy._runWasmExport('executeFrame', []);
    const fps = WasmBoy.getFPS();
    assert.strictEqual(typeof fps, 'number');
  });

  it('provides valid memory section reads through debug API', async () => {
    const memory = await WasmBoy._getWasmMemorySection(0, 16);
    assert.ok(memory instanceof Uint8Array);
    assert.strictEqual(memory.length, 16);
  });
});
