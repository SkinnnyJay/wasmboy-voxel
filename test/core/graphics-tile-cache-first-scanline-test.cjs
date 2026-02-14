const assert = require('assert');
const fs = require('fs');
const path = require('path');
const WasmBoy = require('../load-wasmboy-runtime.cjs');

const TEST_ROM_PATH = path.join(__dirname, '../performance/testroms/tobutobugirl/tobutobugirl.gb');
const TEST_ROM = new Uint8Array(fs.readFileSync(TEST_ROM_PATH));
const FRAME_WIDTH = 160;
const RGB_COMPONENTS = 3;
const FIRST_SCANLINE_RGB_LENGTH = FRAME_WIDTH * RGB_COMPONENTS;

const BASE_OPTIONS = {
  headless: true,
  gameboySpeed: 100.0,
  isGbcEnabled: true,
  tileRendering: true,
};

async function runAndCaptureFrame(tileCachingEnabled) {
  await WasmBoy.config({
    ...BASE_OPTIONS,
    tileCaching: tileCachingEnabled,
  });
  await WasmBoy.loadROM(TEST_ROM);
  await WasmBoy._runWasmExport('executeMultipleFrames', [180], 20000);

  const frameLocation = await WasmBoy._getWasmConstant('FRAME_LOCATION');
  const frameSize = await WasmBoy._getWasmConstant('FRAME_SIZE');
  return WasmBoy._getWasmMemorySection(frameLocation, frameLocation + frameSize);
}

describe('Core graphics tile cache first scanline', function() {
  it('keeps first scanline output identical with tile cache enabled', async function() {
    this.timeout(30000);

    const frameWithoutCache = await runAndCaptureFrame(false);
    await WasmBoy.reset({
      ...BASE_OPTIONS,
      tileCaching: false,
    });

    const frameWithCache = await runAndCaptureFrame(true);

    const firstScanlineWithoutCache = Array.from(frameWithoutCache.slice(0, FIRST_SCANLINE_RGB_LENGTH));
    const firstScanlineWithCache = Array.from(frameWithCache.slice(0, FIRST_SCANLINE_RGB_LENGTH));

    assert.deepStrictEqual(
      firstScanlineWithCache,
      firstScanlineWithoutCache,
      'expected first scanline RGB output to remain stable when tile cache is enabled',
    );
  });
});
