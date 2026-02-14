/**
 * WasmBoyHeadless: load ROM, step frames, getFrameBuffer, getPpuSnapshot, readMemory.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { WasmBoyHeadless } = require('../load-headless-runtime.cjs');

const TEST_ROM_PATH = path.join(__dirname, '../performance/testroms/tobutobugirl/tobutobugirl.gb');
const FRAME_SIZE_RGBA = 160 * 144 * 4;

describe('WasmBoyHeadless', () => {
  let emu;

  afterEach(() => {
    if (emu) emu.destroy();
    emu = null;
  });

  it('loadROM, stepFrames, getFrameBuffer returns 160×144×4', async function () {
    this.timeout(15000);
    emu = new WasmBoyHeadless();
    const rom = new Uint8Array(fs.readFileSync(TEST_ROM_PATH));
    await emu.loadROM(rom);

    emu.stepFrames(60);
    const frame = emu.getFrameBuffer();
    assert.ok(frame instanceof Uint8ClampedArray, 'getFrameBuffer returns Uint8ClampedArray');
    assert.strictEqual(frame.length, FRAME_SIZE_RGBA, 'frame is 160×144×4');
  });

  it('getPpuSnapshot returns non-null with expected shape', async function () {
    this.timeout(15000);
    emu = new WasmBoyHeadless();
    const rom = new Uint8Array(fs.readFileSync(TEST_ROM_PATH));
    await emu.loadROM(rom);
    emu.stepFrames(10);

    const ppu = emu.getPpuSnapshot();
    assert.ok(ppu !== null, 'getPpuSnapshot returns object');
    assert.ok(ppu.registers && typeof ppu.registers.lcdc === 'number', 'registers present');
    assert.ok(ppu.tileData && ppu.tileData.length === 0x1800, 'tileData length');
    assert.ok(ppu.oamData && ppu.oamData.length === 0xa0, 'oamData length');
  });

  it('readMemory returns byte at Game Boy address', async function () {
    this.timeout(15000);
    emu = new WasmBoyHeadless();
    const rom = new Uint8Array(fs.readFileSync(TEST_ROM_PATH));
    await emu.loadROM(rom);
    emu.stepFrames(5);

    const v = emu.readMemory(0xff44);
    assert.ok(typeof v === 'number' && v >= 0 && v <= 0xff, 'readMemory returns 0-255');
  });

  it('setJoypadState and stepFrame advance state', async function () {
    this.timeout(15000);
    emu = new WasmBoyHeadless();
    const rom = new Uint8Array(fs.readFileSync(TEST_ROM_PATH));
    await emu.loadROM(rom);

    emu.setButton('A', true);
    emu.stepFrame();
    emu.setButton('A', false);
    emu.stepFrames(5);
    const frame = emu.getFrameBuffer();
    assert.strictEqual(frame.length, FRAME_SIZE_RGBA);
  });
});
