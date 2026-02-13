/**
 * Headless throughput regression baseline.
 *
 * Inspired by PyBoy-style rigor checks: this verifies that the emulator can
 * process a fixed frame count above a minimum FPS threshold in headless mode.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { performance } = require('perf_hooks');
const WasmBoy = require('../load-wasmboy-runtime.cjs');

const BASELINE_PATH = path.join(__dirname, './baseline/headless-throughput.json');
const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));

const WASMBOY_INITIALIZE_OPTIONS = {
  headless: true,
  gameboySpeed: 100.0,
  isGbcEnabled: true
};

const testRomsPath = path.join(__dirname, './testroms');
const getTestRomArray = () =>
  new Uint8Array(fs.readFileSync(path.join(testRomsPath, 'back-to-color/back-to-color.gbc')));

describe('Headless throughput baseline', function() {
  before(async function() {
    this.timeout(8000);
    await WasmBoy.config(WASMBOY_INITIALIZE_OPTIONS);
    await WasmBoy.loadROM(getTestRomArray());
  });

  it('runs above minimum fps threshold', async function() {
    this.timeout(30000);
    const start = performance.now();
    await WasmBoy._runWasmExport('executeMultipleFrames', [baseline.frames], 30000);
    const elapsedMs = performance.now() - start;
    const fps = baseline.frames / (elapsedMs / 1000);

    console.log(
      `Headless throughput: ${fps.toFixed(2)} FPS (${baseline.frames} frames in ${elapsedMs.toFixed(
        2,
      )}ms)`,
    );
    assert.ok(
      fps >= baseline.minFps,
      `Expected at least ${baseline.minFps} FPS, got ${fps.toFixed(2)} FPS`,
    );
  });
});
