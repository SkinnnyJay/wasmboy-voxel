const assert = require('assert');
const WasmBoy = require('../load-wasmboy-runtime.cjs');

const WASMBOY_INITIALIZE_OPTIONS = {
  headless: true,
  gameboySpeed: 100.0,
  isGbcEnabled: false,
};

const TEST_ROM = new Uint8Array(0x8000);

async function getLy() {
  return WasmBoy._runWasmExport('getLY', [], 10000);
}

describe('Core graphics scanline timing', function() {
  beforeEach(async function() {
    this.timeout(15000);
    await WasmBoy.config(WASMBOY_INITIALIZE_OPTIONS);
    await WasmBoy.loadROM(TEST_ROM);
  });

  it('never exposes LY value 154 while stepping instructions', async function() {
    this.timeout(20000);

    let maxLy = 0;
    for (let step = 0; step < 22000; step += 1) {
      await WasmBoy._runWasmExport('executeStep', [], 10000);
      if ((step & 0x0f) !== 0) {
        continue;
      }

      const ly = await getLy();
      maxLy = Math.max(maxLy, ly);
      assert.ok(ly >= 0 && ly <= 153, `expected LY in [0, 153], received ${ly}`);
    }

    assert.ok(maxLy >= 120, `expected LY to progress through visible and vblank lines (max=${maxLy})`);
  });

  it('wraps LY from 153 back to 0 without an intermediate invalid value', async function() {
    this.timeout(20000);

    let saw153 = false;
    let sawWrapToZero = false;
    let previousLy = await getLy();

    for (let step = 0; step < 30000; step += 1) {
      await WasmBoy._runWasmExport('executeStep', [], 10000);
      if ((step & 0x03) !== 0) {
        continue;
      }

      const ly = await getLy();
      assert.ok(ly >= 0 && ly <= 153, `expected LY in [0, 153], received ${ly}`);

      if (ly === 153) {
        saw153 = true;
      }

      if (saw153 && previousLy === 153 && ly === 0) {
        sawWrapToZero = true;
        break;
      }

      previousLy = ly;
    }

    assert.ok(saw153, 'expected to observe LY=153 while stepping');
    assert.ok(sawWrapToZero, 'expected LY to wrap directly from 153 to 0');
  });
});
