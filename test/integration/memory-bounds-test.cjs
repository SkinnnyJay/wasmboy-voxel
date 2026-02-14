/**
 * Memory view bounds checks for wrapper-level APIs.
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

describe('Memory bounds behavior', function() {
  before(function(done) {
    this.timeout(7500);
    WasmBoy.config(WASMBOY_INITIALIZE_OPTIONS)
      .then(() => WasmBoy.loadROM(getTestRomArray()))
      .then(() => done())
      .catch(done);
  });

  it('returns a typed view for valid memory ranges', async () => {
    const data = await WasmBoy.readMemory(0x8000, 0x10);
    assert.ok(data instanceof Uint8Array, 'expected Uint8Array from valid range');
    assert.strictEqual(data.length, 0x10);
  });

  it('throws clear errors for out-of-bounds ranges', async () => {
    await assert.rejects(
      () => WasmBoy.readMemory(0x200000, 0x20),
      /out of bounds/i,
      'expected out-of-bounds error from invalid memory read',
    );
  });
});
