const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const getWasmBoyCorePath = path.resolve(process.cwd(), 'dist/core/getWasmBoyWasmCore.cjs.js');
const getWasmBoyCoreCjsPath = path.join(os.tmpdir(), 'getWasmBoyWasmCore.memory-banking.runtime.cjs');
fs.copyFileSync(getWasmBoyCorePath, getWasmBoyCoreCjsPath);
const getWasmBoyCore = require(getWasmBoyCoreCjsPath);

function readGbMemoryByte(wasmboy, wasmByteMemoryArray, address) {
  const offset = wasmboy.getWasmBoyOffsetFromGameBoyOffset(address);
  return wasmByteMemoryArray[offset];
}

function runProgram(rom) {
  return getWasmBoyCore().then(wasmboyCore => {
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
    for (let step = 0; step < 80; step += 1) {
      wasmboy.executeStep();
    }
    return { wasmboy, wasmByteMemoryArray };
  });
}

function createMbc5HighBankRom() {
  const banks = 258; // includes bank 0 + bank 257 target
  const rom = new Uint8Array(0x4000 * banks);
  rom[0x0147] = 0x19; // MBC5

  let index = 0x100;
  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0x01; // lower 8 bank bits
  rom[index++] = 0xea; // LD (a16), A
  rom[index++] = 0x00;
  rom[index++] = 0x20;
  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0x01; // high bank bit
  rom[index++] = 0xea; // LD (a16), A
  rom[index++] = 0x00;
  rom[index++] = 0x30;
  rom[index++] = 0xfa; // LD A, (a16)
  rom[index++] = 0x00;
  rom[index++] = 0x40; // read switchable ROM bank start
  rom[index++] = 0xea; // LD (a16), A
  rom[index++] = 0x00;
  rom[index++] = 0xc0;
  rom[index++] = 0x18; // JR -2
  rom[index++] = 0xfe;

  rom[0x4000] = 0x11; // bank 1 marker
  rom[0x4000 * 257] = 0x42; // bank 257 marker
  return rom;
}

function createMbc3RtcRom() {
  const rom = new Uint8Array(0x8000);
  rom[0x0147] = 0x0f; // MBC3 + timer + battery

  let index = 0x100;
  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0x0a; // enable RAM/RTC
  rom[index++] = 0xea; // LD (a16), A
  rom[index++] = 0x00;
  rom[index++] = 0x00;

  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0x08; // select RTC seconds register
  rom[index++] = 0xea;
  rom[index++] = 0x00;
  rom[index++] = 0x40;

  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0x21; // seconds = 0x21
  rom[index++] = 0xea;
  rom[index++] = 0x00;
  rom[index++] = 0xa0;

  rom[index++] = 0xaf; // XOR A
  rom[index++] = 0xea; // write 0 latch
  rom[index++] = 0x00;
  rom[index++] = 0x60;
  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0x01;
  rom[index++] = 0xea; // write 1 latch
  rom[index++] = 0x00;
  rom[index++] = 0x60;

  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0x33; // update live seconds
  rom[index++] = 0xea;
  rom[index++] = 0x00;
  rom[index++] = 0xa0;

  rom[index++] = 0xfa; // LD A, (a16)
  rom[index++] = 0x00;
  rom[index++] = 0xa0;
  rom[index++] = 0xea; // LD (a16), A
  rom[index++] = 0x00;
  rom[index++] = 0xc0;
  rom[index++] = 0x18; // JR -2
  rom[index++] = 0xfe;

  return rom;
}

describe('Memory banking MBC3/MBC5', function() {
  it('supports selecting MBC5 ROM bank high bit', async function() {
    this.timeout(30000);
    const { wasmboy, wasmByteMemoryArray } = await runProgram(createMbc5HighBankRom());
    const observed = readGbMemoryByte(wasmboy, wasmByteMemoryArray, 0xc000);
    assert.strictEqual(observed, 0x42, 'expected read to come from MBC5 bank 0x101');
  });

  it('supports MBC3 RTC register select and latch command sequence', async function() {
    this.timeout(30000);
    const { wasmboy, wasmByteMemoryArray } = await runProgram(createMbc3RtcRom());
    const observed = readGbMemoryByte(wasmboy, wasmByteMemoryArray, 0xc000);
    assert.strictEqual(observed, 0x21, 'expected latched RTC seconds register value after 0->1 latch');
  });
});
