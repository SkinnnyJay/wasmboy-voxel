const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const getWasmBoyCorePath = path.resolve(process.cwd(), 'dist/core/getWasmBoyWasmCore.cjs.js');
const getWasmBoyCoreCjsPath = path.join(os.tmpdir(), 'getWasmBoyWasmCore.sound-bounds.runtime.cjs');
fs.copyFileSync(getWasmBoyCorePath, getWasmBoyCoreCjsPath);
const getWasmBoyCore = require(getWasmBoyCoreCjsPath);

function createSoundBoundsRom() {
  const rom = new Uint8Array(0x8000);
  let index = 0x100;

  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0x12;
  rom[index++] = 0xe0; // LDH (n), A
  rom[index++] = 0x27;

  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0x34;
  rom[index++] = 0xe0; // LDH (n), A
  rom[index++] = 0x2f;

  rom[index++] = 0xf0; // LDH A, (n)
  rom[index++] = 0x27;
  rom[index++] = 0xea; // LD (a16), A
  rom[index++] = 0x00;
  rom[index++] = 0xc0;

  rom[index++] = 0xf0; // LDH A, (n)
  rom[index++] = 0x2f;
  rom[index++] = 0xea; // LD (a16), A
  rom[index++] = 0x01;
  rom[index++] = 0xc0;

  rom[index++] = 0x18; // JR -2
  rom[index++] = 0xfe;
  return rom;
}

function readGbMemoryByte(wasmboy, wasmByteMemoryArray, address) {
  const offset = wasmboy.getWasmBoyOffsetFromGameBoyOffset(address);
  return wasmByteMemoryArray[offset];
}

describe('Sound register bounds protections', function() {
  it('ignores writes to FF27-FF2F and always returns 0xFF on reads', async function() {
    this.timeout(30000);

    const wasmboyCore = await getWasmBoyCore();
    const wasmboy = wasmboyCore.instance.exports;
    const wasmByteMemoryArray = new Uint8Array(wasmboy.memory.buffer);

    wasmByteMemoryArray.set(createSoundBoundsRom(), wasmboy.CARTRIDGE_ROM_LOCATION);
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

    for (let step = 0; step < 50; step += 1) {
      wasmboy.executeStep();
    }

    const readShadow27 = readGbMemoryByte(wasmboy, wasmByteMemoryArray, 0xc000);
    const readShadow2f = readGbMemoryByte(wasmboy, wasmByteMemoryArray, 0xc001);
    const raw27 = readGbMemoryByte(wasmboy, wasmByteMemoryArray, 0xff27);
    const raw2f = readGbMemoryByte(wasmboy, wasmByteMemoryArray, 0xff2f);

    assert.strictEqual(readShadow27, 0xff, 'FF27 reads should return 0xFF');
    assert.strictEqual(readShadow2f, 0xff, 'FF2F reads should return 0xFF');
    assert.strictEqual(raw27, 0x00, 'FF27 writes should be ignored');
    assert.strictEqual(raw2f, 0x00, 'FF2F writes should be ignored');
  });
});
