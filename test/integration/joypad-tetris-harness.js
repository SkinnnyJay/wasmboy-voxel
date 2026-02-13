/**
 * Joypad input regression harness: Tetris, Space Invaders, and baseline ROM.
 *
 * Validates that joypad input reaches the core and affects game state (frame
 * or tilemap change within N frames).
 *
 * - Baseline: tobutobugirl, set Down, run frames, assert frame change.
 * - Tetris: run to title, set Down, run ~45 frames, assert cursor moved
 *   (1 PLAYER -> 2 PLAYER); skip if Tetris.gb not in test/fixtures or test/performance/testroms/tetris.
 * - Space Invaders: run a few frames, set A or START, run frames, assert frame
 *   change; skip if Space Invaders.gb not in test/fixtures or repo root.
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

const SPACE_INVADERS_ROM_PATHS = [
  path.join(fixturesPath, 'Space Invaders.gb'),
  path.join(__dirname, '../../Space Invaders.gb'),
  path.join(testRomsPath, 'space-invaders', 'Space Invaders.gb')
];

function findRom(paths) {
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (_) {
      /* ignore */
    }
  }
  return null;
}

function findTetrisRom() {
  return findRom(TETRIS_ROM_PATHS);
}

function findSpaceInvadersRom() {
  return findRom(SPACE_INVADERS_ROM_PATHS);
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

  describe('Space Invaders', () => {
    it('should change game state when A or START is pressed', async function () {
      const romPath = findSpaceInvadersRom();
      if (!romPath) {
        this.skip();
        return;
      }

      const rom = new Uint8Array(fs.readFileSync(romPath));
      await WasmBoy.loadROM(rom);

      WasmBoy.setJoypadState({ ...JOYPAD_NEUTRAL });
      await runFrames(120);

      const before = await commonTest.getImageDataFromFrame();
      const sigBefore = frameSignature(before);

      WasmBoy.setJoypadState({ ...JOYPAD_NEUTRAL, A: true });
      await runFrames(30);
      WasmBoy.setJoypadState({ ...JOYPAD_NEUTRAL });
      await runFrames(30);

      const after = await commonTest.getImageDataFromFrame();
      const sigAfter = frameSignature(after);

      assert.notStrictEqual(sigAfter, sigBefore, 'Space Invaders frame should change after A press (input reaches core)');
    });
  });
});
