const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const getWasmBoyCorePath = path.resolve(process.cwd(), 'dist/core/getWasmBoyWasmCore.cjs.js');
const getWasmBoyCoreCjsPath = path.join(os.tmpdir(), 'getWasmBoyWasmCore.serial.runtime.cjs');
fs.copyFileSync(getWasmBoyCorePath, getWasmBoyCoreCjsPath);
const getWasmBoyCore = require(getWasmBoyCoreCjsPath);

function createSerialRom(serialControlValue) {
  const rom = new Uint8Array(0x8000);
  let index = 0x100;

  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0xa5; // serial payload
  rom[index++] = 0xe0; // LDH (n), A
  rom[index++] = 0x01; // SB

  rom[index++] = 0x3e; // LD A, n
  rom[index++] = serialControlValue; // SC
  rom[index++] = 0xe0; // LDH (n), A
  rom[index++] = 0x02;

  rom[index++] = 0x00; // NOP
  rom[index++] = 0x18; // JR -3
  rom[index++] = 0xfd;
  return rom;
}

function readGbMemoryByte(wasmboy, wasmByteMemoryArray, address) {
  const offset = wasmboy.getWasmBoyOffsetFromGameBoyOffset(address);
  return wasmByteMemoryArray[offset];
}

async function bootCoreWithRom(rom) {
  const wasmboyCore = await getWasmBoyCore();
  const wasmboy = wasmboyCore.instance.exports;
  const wasmByteMemoryArray = new Uint8Array(wasmboy.memory.buffer);
  wasmByteMemoryArray.set(rom, wasmboy.CARTRIDGE_ROM_LOCATION);
  wasmboy.config(
    0, // enableBootRom
    0, // useGbcWhenAvailable
    0, // audioBatchProcessing
    0, // graphicsBatchProcessing
    0, // timersBatchProcessing
    0, // graphicsDisableScanlineRendering
    0, // audioAccumulateSamples
    0, // tileRendering
    0, // tileCaching
    0, // enableAudioDebugging
  );
  return { wasmboy, wasmByteMemoryArray };
}

describe('Serial transport behavior', function() {
  it('completes internal-clock transfer and sets serial interrupt with disconnected peer', async function() {
    this.timeout(30000);
    const { wasmboy, wasmByteMemoryArray } = await bootCoreWithRom(createSerialRom(0x81));
    wasmboy.executeMultipleFrames(4);

    const sb = readGbMemoryByte(wasmboy, wasmByteMemoryArray, 0xff01);
    const sc = readGbMemoryByte(wasmboy, wasmByteMemoryArray, 0xff02);
    const interruptFlags = readGbMemoryByte(wasmboy, wasmByteMemoryArray, 0xff0f);

    assert.strictEqual(sb, 0xff, 'expected disconnected transfer to shift in high bits');
    assert.strictEqual((sc >> 7) & 0x01, 0, 'expected transfer start flag cleared after 8 bits');
    assert.strictEqual((interruptFlags >> 3) & 0x01, 1, 'expected serial interrupt bit requested');
  });

  it('supports deterministic peer byte transfer when incoming byte is provided', async function() {
    this.timeout(30000);
    const { wasmboy, wasmByteMemoryArray } = await bootCoreWithRom(createSerialRom(0x81));
    wasmboy.setSerialIncomingByte(0x3c);
    wasmboy.executeMultipleFrames(4);

    const sb = readGbMemoryByte(wasmboy, wasmByteMemoryArray, 0xff01);
    const outgoingByte = wasmboy.getSerialOutgoingByte();
    assert.strictEqual(sb, 0x3c, 'expected transfer to shift in provided peer byte');
    assert.strictEqual(outgoingByte, 0xa5, 'expected outgoing serial byte to mirror original SB payload');
  });

  it('does not advance transfer when external clock is selected', async function() {
    this.timeout(30000);
    const { wasmboy, wasmByteMemoryArray } = await bootCoreWithRom(createSerialRom(0x80));
    wasmboy.executeMultipleFrames(4);

    const sb = readGbMemoryByte(wasmboy, wasmByteMemoryArray, 0xff01);
    const interruptFlags = readGbMemoryByte(wasmboy, wasmByteMemoryArray, 0xff0f);
    assert.strictEqual(sb, 0xa5, 'expected SB unchanged without internal shift clock');
    assert.strictEqual((interruptFlags >> 3) & 0x01, 0, 'expected no serial interrupt without clock ticks');
  });
});
