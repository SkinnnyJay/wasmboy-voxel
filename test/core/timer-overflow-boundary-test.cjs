const fs = require('fs');
const path = require('path');
const assert = require('assert');
const WasmBoy = require('../load-wasmboy-runtime.cjs');

const WASMBOY_INITIALIZE_OPTIONS = {
  headless: true,
  gameboySpeed: 100.0,
  isGbcEnabled: true,
};

const testRomsPath = path.join(__dirname, '../performance/testroms');
const getTestRomArray = () =>
  new Uint8Array(fs.readFileSync(path.join(testRomsPath, 'back-to-color/back-to-color.gbc')));

const MAX_DIVIDER_VALUE = 0xffff;
const WRAP_SEARCH_FRAMES = 48;

describe('Core timer divider overflow boundaries', function () {
  before(async function () {
    this.timeout(8000);
    await WasmBoy.config(WASMBOY_INITIALIZE_OPTIONS);
    await WasmBoy.loadROM(getTestRomArray());
  });

  it('keeps divider bounded and wraps across 16-bit overflow edge', async function () {
    this.timeout(30000);

    const initialState = await WasmBoy.getTimerState();
    let previousDivider = initialState.div;
    const initialTimerCounter = initialState.tima;
    let wrapped = false;

    for (let frame = 0; frame < WRAP_SEARCH_FRAMES; frame += 1) {
      await WasmBoy._runWasmExport('executeMultipleFrames', [1], 10000);
      const timerState = await WasmBoy.getTimerState();

      assert.ok(timerState.div >= 0, 'divider should never be negative');
      assert.ok(
        timerState.div <= MAX_DIVIDER_VALUE,
        `divider should stay within 16-bit range, got ${timerState.div}`,
      );

      if (timerState.div < previousDivider) {
        wrapped = true;
        assert.ok(
          previousDivider > MAX_DIVIDER_VALUE - 10000,
          `expected wrap near 16-bit edge, previous divider=${previousDivider}`,
        );
        assert.strictEqual(
          timerState.tima,
          initialTimerCounter,
          'TIMA should remain stable while timer is disabled across DIV wrap',
        );
        break;
      }

      assert.ok(
        timerState.div > previousDivider,
        `divider should increase before wrap (${previousDivider} -> ${timerState.div})`,
      );
      previousDivider = timerState.div;
    }

    assert.ok(wrapped, `expected divider wrap within ${WRAP_SEARCH_FRAMES} frames`);
  });
});
