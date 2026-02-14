/**
 * Backwards-compat regression checks for legacy debug/memory APIs.
 */
const WasmBoy = require('../load-wasmboy-runtime.cjs');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const WASMBOY_INITIALIZE_OPTIONS = {
  headless: true,
  gameboySpeed: 100.0,
  isGbcEnabled: true
};

const testRomsPath = path.join(__dirname, '../performance/testroms');
const getTestRomArray = () =>
  new Uint8Array(fs.readFileSync(path.join(testRomsPath, 'back-to-color/back-to-color.gbc')));

describe('Compatibility API surface', function() {
  before(function(done) {
    this.timeout(7500);
    WasmBoy.config(WASMBOY_INITIALIZE_OPTIONS)
      .then(() => WasmBoy.loadROM(getTestRomArray()))
      .then(() => WasmBoy._runNumberOfFrames(5))
      .then(() => done())
      .catch(done);
  });

  it('legacy debug APIs remain callable', async () => {
    const cpu = await WasmBoy.getCPURegisters();
    const timer = await WasmBoy.getTimerState();
    const lcd = await WasmBoy.getLCDState();

    assert.ok(cpu && typeof cpu === 'object', 'cpu registers should exist');
    assert.ok(timer && typeof timer === 'object', 'timer state should exist');
    assert.ok(lcd && typeof lcd === 'object', 'lcd state should exist');
  });

  it('legacy memory helpers remain callable', async () => {
    const view = await WasmBoy.readMemory(0x8000, 16);
    assert.ok(view instanceof Uint8Array, 'readMemory should return Uint8Array');
    assert.strictEqual(view.length, 16);
  });
});
