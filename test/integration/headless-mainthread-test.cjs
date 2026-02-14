/**
 * Asserts that with headless: true and mainThread: true, frames reach
 * updateGraphicsCallback without using Workers.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const WasmBoy = require('../load-wasmboy-runtime.cjs');

const FRAME_SIZE_RGBA = 160 * 144 * 4;
const TEST_ROM_PATH = path.join(__dirname, '../performance/testroms/tobutobugirl/tobutobugirl.gb');

describe('Headless mainThread', () => {
  it('invokes callback with RGBA when headless and mainThread', async function () {
    this.timeout(20000);

    const frames = [];
    await WasmBoy.config({
      headless: true,
      mainThread: true,
      gameboySpeed: 100.0,
      isGbcEnabled: true,
      updateGraphicsCallback: (imageDataArray) => {
        frames.push(imageDataArray);
      },
    });

    const rom = new Uint8Array(fs.readFileSync(TEST_ROM_PATH));
    await WasmBoy.loadROM(rom);

    await WasmBoy.play();
    await new Promise((r) => setTimeout(r, 500));
    await WasmBoy.pause();

    assert.ok(frames.length >= 1, 'updateGraphicsCallback should be called at least once when mainThread');
    assert.strictEqual(
      frames[0].length,
      FRAME_SIZE_RGBA,
      'callback should receive 160×144×4 RGBA'
    );
  });
});
