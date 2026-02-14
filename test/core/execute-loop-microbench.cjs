/**
 * Core execute-loop microbenchmark regression guard.
 *
 * Runs a fixed frame batch with graphics scanline rendering disabled so we can
 * detect obvious execute-loop regressions without coupling to full render cost.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { performance } = require('perf_hooks');
const WasmBoy = require('../load-wasmboy-runtime.cjs');

const BASELINE_PATH = path.join(__dirname, './baseline/execute-loop-microbench.json');
const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));

const WASMBOY_INITIALIZE_OPTIONS = {
  headless: true,
  gameboySpeed: 100.0,
  isGbcEnabled: true,
  graphicsDisableScanlineRendering: true,
  isAudioEnabled: false,
};

const testRomsPath = path.join(__dirname, '../performance/testroms');
const getTestRomArray = () =>
  new Uint8Array(fs.readFileSync(path.join(testRomsPath, 'back-to-color/back-to-color.gbc')));

describe('Core execute-loop microbenchmark', function () {
  before(async function () {
    this.timeout(8000);
    await WasmBoy.config(WASMBOY_INITIALIZE_OPTIONS);
    await WasmBoy.loadROM(getTestRomArray());
  });

  it('keeps executeMultipleFrames throughput above microbench floor', async function () {
    this.timeout(30000);
    const start = performance.now();
    await WasmBoy._runWasmExport('executeMultipleFrames', [baseline.frames], 30000);
    const elapsedMs = performance.now() - start;
    const fps = baseline.frames / (elapsedMs / 1000);

    console.log(
      `Execute loop microbench: ${fps.toFixed(2)} FPS (${baseline.frames} frames in ${elapsedMs.toFixed(
        2,
      )}ms)`,
    );
    assert.ok(
      fps >= baseline.minFps,
      `Expected execute-loop microbench >= ${baseline.minFps} FPS, got ${fps.toFixed(2)} FPS`,
    );
  });
});
