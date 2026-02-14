/**
 * Integration test for memory breakpoint API: setMemoryBreakpoint,
 * clearMemoryBreakpoint, clearAllMemoryBreakpoints.
 * Requires built lib and a ROM (same as lib-test).
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

describe('Memory breakpoint API', function() {
  beforeEach(function(done) {
    this.timeout(7500);
    WasmBoy.config(WASMBOY_INITIALIZE_OPTIONS)
      .then(() => WasmBoy.loadROM(getTestRomArray()))
      .then(() => done())
      .catch(done);
  });

  it('setMemoryBreakpoint returns id and clear does not throw', async () => {
    const setResult = await WasmBoy.setMemoryBreakpoint({ address: 0xff44, access: 'write' });
    assert.strictEqual(setResult.id, 'bp-write');
    await WasmBoy.clearMemoryBreakpoint('bp-write');

    const setRead = await WasmBoy.setMemoryBreakpoint({ address: 0xff00, access: 'read' });
    assert.strictEqual(setRead.id, 'bp-read');
    await WasmBoy.clearMemoryBreakpoint('bp-read');
  });

  it('clearAllMemoryBreakpoints does not throw', async () => {
    await WasmBoy.setMemoryBreakpoint({ address: 0xff44, access: 'write' });
    await WasmBoy.setMemoryBreakpoint({ address: 0xff00, access: 'read' });
    await WasmBoy.clearAllMemoryBreakpoints();
  });
});
