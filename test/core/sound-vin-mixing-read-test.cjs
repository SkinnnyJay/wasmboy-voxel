const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const getWasmBoyCorePath = path.resolve(process.cwd(), 'dist/core/getWasmBoyWasmCore.cjs.js');
const getWasmBoyCoreCjsPath = path.join(os.tmpdir(), 'getWasmBoyWasmCore.sound-vin.runtime.cjs');
fs.copyFileSync(getWasmBoyCorePath, getWasmBoyCoreCjsPath);
const getWasmBoyCore = require(getWasmBoyCoreCjsPath);

function createNr50ReadRom() {
  const rom = new Uint8Array(0x8000);
  let index = 0x100;

  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0xda; // VIN-left on, left volume=5, VIN-right on, right volume=2
  rom[index++] = 0xe0; // LDH (n), A
  rom[index++] = 0x24; // FF24 (NR50)
  rom[index++] = 0xf0; // LDH A, (n)
  rom[index++] = 0x24; // FF24 (NR50)
  rom[index++] = 0xea; // LD (a16), A
  rom[index++] = 0x00;
  rom[index++] = 0xc0; // C000
  rom[index++] = 0x18; // JR -2
  rom[index++] = 0xfe;

  return rom;
}

function createVinMixRom(enableVin) {
  const rom = new Uint8Array(0x8000);
  let index = 0x100;

  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0x00; // Disable all channel routing
  rom[index++] = 0xe0; // LDH (n), A
  rom[index++] = 0x25; // FF25 (NR51)

  rom[index++] = 0x3e; // LD A, n
  rom[index++] = enableVin ? 0xff : 0x77; // FF24 (NR50)
  rom[index++] = 0xe0; // LDH (n), A
  rom[index++] = 0x24;

  rom[index++] = 0x00; // NOP
  rom[index++] = 0x18; // JR -3
  rom[index++] = 0xfd;
  return rom;
}

function getExportI32(value) {
  return typeof value === 'number' ? value : value.valueOf();
}

function getFirstStereoSample(wasmboy, wasmByteMemoryArray) {
  for (let step = 0; step < 24 && wasmboy.getNumberOfSamplesInAudioBuffer() === 0; step += 1) {
    wasmboy.executeStep();
  }

  assert.ok(wasmboy.getNumberOfSamplesInAudioBuffer() > 0, 'expected at least one generated audio sample');
  const audioBufferLocation = getExportI32(wasmboy.AUDIO_BUFFER_LOCATION);
  return {
    left: wasmByteMemoryArray[audioBufferLocation],
    right: wasmByteMemoryArray[audioBufferLocation + 1],
  };
}

function configureCore(wasmboy) {
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
}

describe('Sound VIN mixing and NR50 read behavior', function() {
  it('mixes VIN input only when NR50 VIN output bits are enabled', async function() {
    this.timeout(30000);

    const wasmboyCore = await getWasmBoyCore();
    const wasmboy = wasmboyCore.instance.exports;
    const wasmByteMemoryArray = new Uint8Array(wasmboy.memory.buffer);

    wasmByteMemoryArray.set(createVinMixRom(false), wasmboy.CARTRIDGE_ROM_LOCATION);
    configureCore(wasmboy);
    wasmboy.setVinInputSample(30);
    wasmboy.clearAudioBuffer();
    const withoutVin = getFirstStereoSample(wasmboy, wasmByteMemoryArray);

    const withVinCore = await getWasmBoyCore();
    const withVinWasmBoy = withVinCore.instance.exports;
    const withVinMemory = new Uint8Array(withVinWasmBoy.memory.buffer);
    withVinMemory.set(createVinMixRom(true), withVinWasmBoy.CARTRIDGE_ROM_LOCATION);
    configureCore(withVinWasmBoy);
    withVinWasmBoy.setVinInputSample(30);
    withVinWasmBoy.clearAudioBuffer();
    const withVin = getFirstStereoSample(withVinWasmBoy, withVinMemory);

    assert.ok(withVin.left > withoutVin.left, `expected left output to increase when VIN-left is enabled (${withVin.left} > ${withoutVin.left})`);
    assert.ok(withVin.right > withoutVin.right, `expected right output to increase when VIN-right is enabled (${withVin.right} > ${withoutVin.right})`);
  });

  it('reads NR50 from tracked mixer state, including VIN routing bits', async function() {
    this.timeout(30000);

    const wasmboyCore = await getWasmBoyCore();
    const wasmboy = wasmboyCore.instance.exports;
    const wasmByteMemoryArray = new Uint8Array(wasmboy.memory.buffer);

    wasmByteMemoryArray.set(createNr50ReadRom(), wasmboy.CARTRIDGE_ROM_LOCATION);
    configureCore(wasmboy);

    for (let step = 0; step < 12; step += 1) {
      wasmboy.executeStep();
    }

    const readShadow = wasmByteMemoryArray[wasmboy.getWasmBoyOffsetFromGameBoyOffset(0xc000)];
    assert.strictEqual(readShadow, 0xda, 'expected NR50 reads to include VIN enable bits and mixer volumes');
  });
});
