/**
 * Minimal harness for Tetris (Game Boy) joypad input and baseline ROM check.
 *
 * Tetris test: Load Tetris.gb, run to title, set Down, run frames, assert cursor
 * moved (frame or tilemap change). Skip if Tetris.gb is not present; place at
 * test/fixtures/Tetris.gb or test/performance/testroms/tetris/Tetris.gb.
 *
 * Baseline test: Load tobutobugirl (in testroms), run to menu, set joypad,
 * run frames, assert frame changed to confirm input path works.
 *
 * Run: npm run test:integration:joypad (or test:integration).
 */

const commonTest = require('../common-test');
const WasmBoy = require('../../dist/wasmboy.wasm.cjs.js').WasmBoy;
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const WASMBOY_INITIALIZE_OPTIONS = {
  headless: true,
  gameboySpeed: 100.0,
  isGbcEnabled: false
};

const testRomsPath = path.join(__dirname, '../performance/testroms');
const fixturesPath = path.join(__dirname, '../fixtures');

const JOYPAD_NEUTRAL = {
  UP: false,
  RIGHT: false,
  DOWN: false,
  LEFT: false,
  A: false,
  B: false,
  SELECT: false,
  START: false
};

const TETRIS_ROM_PATHS = [
  path.join(fixturesPath, 'Tetris.gb'),
  path.join(testRomsPath, 'tetris', 'Tetris.gb')
];

function findTetrisRom() {
  for (const p of TETRIS_ROM_PATHS) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (_) {
      /* ignore */
    }
  }
  return null;
}

function runFrames(n) {
  return WasmBoy._runWasmExport('executeMultipleFrames', [n]);
}

/** Hash of frame image data for quick change detection (middle band only). */
function frameSignature(imageDataArray) {
  const w = 160;
  const h = 144;
  const bandTop = Math.floor(h * 0.3);
  const bandBottom = Math.floor(h * 0.7);
  let sum = 0;
  for (let y = bandTop; y < bandBottom; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      sum = (sum * 31 + (imageDataArray[i] | 0) + (imageDataArray[i + 1] | 0) + (imageDataArray[i + 2] | 0)) | 0;
    }
  }
  return sum;
}

describe('Joypad Tetris harness', () => {
  before(function (done) {
    this.timeout(10000);
    WasmBoy.config(WASMBOY_INITIALIZE_OPTIONS).then(() => done());
  });

  describe('baseline (tobutobugirl)', () => {
    it('should process joypad input and change frame', async function () {
      const romPath = path.join(testRomsPath, 'tobutobugirl', 'tobutobugirl.gb');
      const rom = new Uint8Array(fs.readFileSync(romPath));
      await WasmBoy.loadROM(rom);

      WasmBoy.setJoypadState({ ...JOYPAD_NEUTRAL });
      await runFrames(60);

      const before = await commonTest.getImageDataFromFrame();
      const sigBefore = frameSignature(before);

      WasmBoy.setJoypadState({ ...JOYPAD_NEUTRAL, DOWN: true });
      await runFrames(30);
      WasmBoy.setJoypadState({ ...JOYPAD_NEUTRAL });
      await runFrames(30);

      const after = await commonTest.getImageDataFromFrame();
      const sigAfter = frameSignature(after);

      assert.notStrictEqual(sigAfter, sigBefore, 'frame should change after joypad Down on baseline ROM');
    });
  });

  describe('Tetris', () => {
    it('should move title cursor when Down is pressed', async function () {
      const tetrisPath = findTetrisRom();
      if (!tetrisPath) {
        this.skip();
        return;
      }

      const rom = new Uint8Array(fs.readFileSync(tetrisPath));
      await WasmBoy.loadROM(rom);

      WasmBoy.setJoypadState({ ...JOYPAD_NEUTRAL });
      await runFrames(180);

      const before = await commonTest.getImageDataFromFrame();
      const sigBefore = frameSignature(before);

      WasmBoy.setJoypadState({ ...JOYPAD_NEUTRAL, DOWN: true });
      await runFrames(45);
      WasmBoy.setJoypadState({ ...JOYPAD_NEUTRAL });
      await runFrames(15);

      const after = await commonTest.getImageDataFromFrame();
      const sigAfter = frameSignature(after);

      assert.notStrictEqual(sigAfter, sigBefore, 'Tetris title cursor should move from 1 PLAYER to 2 PLAYER when Down is pressed');
    });
  });
});
