/**
 * Asserts that with headless: true and updateGraphicsCallback,
 * the callback is invoked with RGBA frame data (160×144×4).
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const WasmBoy = require('../load-wasmboy-runtime.cjs');

const FRAME_SIZE_RGBA = 160 * 144 * 4;
const TEST_ROM_PATH = path.join(__dirname, '../performance/testroms/tobutobugirl/tobutobugirl.gb');

describe('Headless updateGraphicsCallback', () => {
  it('invokes callback with correct-sized RGBA when headless', async function () {
    this.timeout(20000);

    const frames = [];
    await WasmBoy.config({
      headless: true,
      gameboySpeed: 100.0,
      isGbcEnabled: true,
      updateGraphicsCallback: (imageDataArray) => {
        frames.push(imageDataArray);
      }
    });

    const rom = new Uint8Array(fs.readFileSync(TEST_ROM_PATH));
    await WasmBoy.loadROM(rom);

    await WasmBoy.play();
    for (let i = 0; i < 60; i++) {
      await WasmBoy._runWasmExport('executeFrame', []);
    }
    await WasmBoy.pause();

    assert.ok(frames.length >= 1, 'updateGraphicsCallback should be called at least once');
    assert.strictEqual(
      frames[0].length,
      FRAME_SIZE_RGBA,
      'callback should receive 160×144×4 RGBA'
    );
  });
});
