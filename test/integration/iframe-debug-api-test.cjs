/**
 * Integration test for debug APIs used by the iframe port: getCPURegisters,
 * getTimerState, getLCDState, getScanlineParameters, getBackgroundMapImage,
 * getTileDataImage, getOamSpritesImage.
 * Requires built lib and a ROM (same as breakpoint-test).
 */
const WasmBoy = require('../../dist/wasmboy.wasm.cjs.cjs').WasmBoy;
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

const CPU_REGISTER_KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'h', 'l', 'pc', 'sp', 'opcode'];
const TIMER_STATE_KEYS = ['div', 'tima', 'tma', 'tac', 'enabled'];
const LCD_STATE_KEYS = ['ly', 'lcdc', 'stat', 'scrollX', 'scrollY', 'windowX', 'windowY'];

describe('Debug API (iframe port)', function() {
  before(function(done) {
    this.timeout(7500);
    WasmBoy.config(WASMBOY_INITIALIZE_OPTIONS)
      .then(() => WasmBoy.loadROM(getTestRomArray()))
      .then(() => WasmBoy._runNumberOfFrames(10))
      .then(() => done())
      .catch(done);
  });

  it('getCPURegisters returns non-null object with expected keys', async () => {
    const cpu = await WasmBoy.getCPURegisters();
    assert.ok(cpu !== null && typeof cpu === 'object', 'getCPURegisters returns object');
    for (const key of CPU_REGISTER_KEYS) {
      assert.ok(key in cpu, `has ${key}`);
      assert.strictEqual(typeof cpu[key], 'number', `${key} is number`);
    }
  });

  it('getTimerState returns non-null object with expected keys', async () => {
    const timer = await WasmBoy.getTimerState();
    assert.ok(timer !== null && typeof timer === 'object', 'getTimerState returns object');
    for (const key of TIMER_STATE_KEYS) {
      assert.ok(key in timer, `has ${key}`);
    }
    assert.strictEqual(typeof timer.enabled, 'boolean', 'enabled is boolean');
    assert.strictEqual(typeof timer.div, 'number', 'div is number');
  });

  it('getLCDState returns non-null object with expected keys', async () => {
    const lcd = await WasmBoy.getLCDState();
    assert.ok(lcd !== null && typeof lcd === 'object', 'getLCDState returns object');
    for (const key of LCD_STATE_KEYS) {
      assert.ok(key in lcd, `has ${key}`);
      assert.strictEqual(typeof lcd[key], 'number', `${key} is number`);
    }
  });

  it('getScanlineParameters returns array of 144 tuples', async () => {
    const scanlines = await WasmBoy.getScanlineParameters();
    assert.ok(scanlines !== null && Array.isArray(scanlines), 'getScanlineParameters returns array');
    assert.strictEqual(scanlines.length, 144, 'length 144');
    for (let i = 0; i < scanlines.length; i++) {
      assert.ok(Array.isArray(scanlines[i]), `scanlines[${i}] is array`);
      assert.strictEqual(scanlines[i].length, 4, `scanlines[${i}] length 4`);
      scanlines[i].forEach((v, j) => assert.strictEqual(typeof v, 'number', `scanlines[${i}][${j}] is number`));
    }
  });

  it('getBackgroundMapImage returns ImageData 256x256 or null when ImageData unavailable', async () => {
    const img = await WasmBoy.getBackgroundMapImage();
    if (img === null) {
      assert.strictEqual(typeof globalThis.ImageData, 'undefined', 'ImageData undefined in Node');
      return;
    }
    assert.strictEqual(img.width, 256, 'width 256');
    assert.strictEqual(img.height, 256, 'height 256');
    assert.ok(img.data instanceof Uint8ClampedArray, 'data is Uint8ClampedArray');
    assert.strictEqual(img.data.length, 256 * 256 * 4, 'data length 256*256*4');
  });

  it('getTileDataImage returns ImageData 248x184 or null when ImageData unavailable', async () => {
    const img = await WasmBoy.getTileDataImage();
    if (img === null) {
      assert.strictEqual(typeof globalThis.ImageData, 'undefined', 'ImageData undefined in Node');
      return;
    }
    assert.strictEqual(img.width, 248, 'width 248');
    assert.strictEqual(img.height, 184, 'height 184');
    assert.ok(img.data instanceof Uint8ClampedArray, 'data is Uint8ClampedArray');
    assert.strictEqual(img.data.length, 248 * 184 * 4, 'data length 248*184*4');
  });

  it('getOamSpritesImage returns ImageData 64x80 or null when ImageData unavailable', async () => {
    const img = await WasmBoy.getOamSpritesImage();
    if (img === null) {
      assert.strictEqual(typeof globalThis.ImageData, 'undefined', 'ImageData undefined in Node');
      return;
    }
    assert.strictEqual(img.width, 64, 'width 64');
    assert.strictEqual(img.height, 80, 'height 80');
    assert.ok(img.data instanceof Uint8ClampedArray, 'data is Uint8ClampedArray');
    assert.strictEqual(img.data.length, 64 * 80 * 4, 'data length 64*80*4');
  });
});
