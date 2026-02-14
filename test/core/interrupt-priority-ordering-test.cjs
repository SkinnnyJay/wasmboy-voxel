const assert = require('assert');
const WasmBoy = require('../load-wasmboy-runtime.cjs');

const WASMBOY_INITIALIZE_OPTIONS = {
  headless: true,
  gameboySpeed: 100.0,
  isGbcEnabled: false,
};

const INTERRUPT_VECTOR_BY_BIT = {
  0: 0x40, // VBlank
  1: 0x48, // LCD
  2: 0x50, // Timer
  3: 0x58, // Serial
  4: 0x60, // Joypad
};

const INTERRUPT_PRIORITY_CASES = [
  { mask: 0x1f, expectedBit: 0, label: 'all interrupt flags pending' },
  { mask: 0x14, expectedBit: 2, label: 'timer+joypad pending' },
  { mask: 0x18, expectedBit: 3, label: 'serial+joypad pending' },
  { mask: 0x06, expectedBit: 1, label: 'lcd+timer pending' },
];

function createInterruptPriorityRom(mask) {
  const rom = new Uint8Array(0x8000);
  rom[0x100] = 0x3e; // LD A, n
  rom[0x101] = mask & 0xff;
  rom[0x102] = 0xea; // LD (a16), A
  rom[0x103] = 0xff; // IE low byte
  rom[0x104] = 0xff; // IE high byte -> 0xFFFF
  rom[0x105] = 0xea; // LD (a16), A
  rom[0x106] = 0x0f; // IF low byte
  rom[0x107] = 0xff; // IF high byte -> 0xFF0F
  rom[0x108] = 0xfb; // EI
  rom[0x109] = 0x00; // NOP (interrupt should service before this executes)
  return rom;
}

describe('Core interrupt priority ordering', function () {
  for (const testCase of INTERRUPT_PRIORITY_CASES) {
    it(`services highest-priority interrupt first when ${testCase.label}`, async function () {
      this.timeout(15000);

      await WasmBoy.config(WASMBOY_INITIALIZE_OPTIONS);
      await WasmBoy.loadROM(createInterruptPriorityRom(testCase.mask));

      for (let step = 0; step < 5; step += 1) {
        await WasmBoy._runWasmExport('executeStep', [], 10000);
      }

      const cpuState = await WasmBoy.getCPURegisters();
      const expectedVector = INTERRUPT_VECTOR_BY_BIT[testCase.expectedBit];
      assert.strictEqual(
        cpuState.pc,
        expectedVector + 1,
        `expected PC to enter interrupt vector 0x${expectedVector.toString(16)} first`,
      );
    });
  }
});
