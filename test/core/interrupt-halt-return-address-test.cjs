const assert = require('assert');
const WasmBoy = require('../load-wasmboy-runtime.cjs');

const WASMBOY_INITIALIZE_OPTIONS = {
  headless: true,
  gameboySpeed: 100.0,
  isGbcEnabled: false,
};

function createInterruptFromHaltRom() {
  const rom = new Uint8Array(0x8000);
  rom[0x100] = 0x3e; // LD A, n
  rom[0x101] = 0x01; // enable/request VBlank
  rom[0x102] = 0xea; // LD (a16), A
  rom[0x103] = 0xff;
  rom[0x104] = 0xff; // IE
  rom[0x105] = 0xea; // LD (a16), A
  rom[0x106] = 0x0f;
  rom[0x107] = 0xff; // IF
  rom[0x108] = 0xfb; // EI
  rom[0x109] = 0x76; // HALT
  rom[0x10a] = 0x00; // NOP (expected return address)
  return rom;
}

async function readDebugByte(address) {
  await WasmBoy._runWasmExport('updateDebugGBMemory');
  const base = await WasmBoy._getWasmConstant('DEBUG_GAMEBOY_MEMORY_LOCATION');
  const memory = await WasmBoy._getWasmMemorySection(base + address, base + address + 1);
  return memory[0];
}

describe('Core interrupt halt return address', function() {
  it('preserves HALT return address semantics when servicing interrupt', async function() {
    this.timeout(15000);

    await WasmBoy.config(WASMBOY_INITIALIZE_OPTIONS);
    await WasmBoy.loadROM(createInterruptFromHaltRom());

    for (let step = 0; step < 9; step += 1) {
      await WasmBoy._runWasmExport('executeStep', [], 10000);
    }

    const cpuState = await WasmBoy.getCPURegisters();
    assert.ok(
      cpuState.pc >= 0x40 && cpuState.pc < 0x80,
      `expected to be executing inside interrupt handler region, got PC=0x${cpuState.pc.toString(16)}`,
    );

    const returnLow = await readDebugByte(cpuState.sp);
    const returnHigh = await readDebugByte(cpuState.sp + 1);
    const returnAddress = returnLow | (returnHigh << 8);

    assert.strictEqual(returnAddress, 0x109, 'expected interrupt return address used by current HALT compatibility path');
  });
});
