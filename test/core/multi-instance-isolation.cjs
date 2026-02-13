/**
 * PyBoy-rigor style test: multiple core instances should not share mutable
 * memory state.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const getWasmBoyCorePath = path.resolve(process.cwd(), 'dist/core/getWasmBoyWasmCore.cjs.js');
const getWasmBoyCoreCjsPath = path.join(os.tmpdir(), 'getWasmBoyWasmCore.multi-instance.cjs');
fs.copyFileSync(getWasmBoyCorePath, getWasmBoyCoreCjsPath);
const getWasmBoyCore = require(getWasmBoyCoreCjsPath);

describe('WasmBoy core multi-instance isolation', () => {
  it('keeps memory buffers isolated between instances', async () => {
    const coreA = await getWasmBoyCore();
    const coreB = await getWasmBoyCore();

    const wasmA = coreA.instance.exports;
    const wasmB = coreB.instance.exports;
    const memoryA = new Uint8Array(wasmA.memory.buffer);
    const memoryB = new Uint8Array(wasmB.memory.buffer);

    assert.notStrictEqual(
      wasmA.memory.buffer,
      wasmB.memory.buffer,
      'core instances should not share memory buffers',
    );

    const probeOffsetA = wasmA.WASMBOY_STATE_LOCATION;
    const probeOffsetB = wasmB.WASMBOY_STATE_LOCATION;
    const beforeA = memoryA[probeOffsetA];
    const beforeB = memoryB[probeOffsetB];
    const nextValueA = ((beforeA ?? 0) + 1) & 0xff;

    memoryA[probeOffsetA] = nextValueA;

    assert.strictEqual(
      memoryB[probeOffsetB],
      beforeB,
      'writes in instance A should not mutate instance B memory',
    );
  });
});
