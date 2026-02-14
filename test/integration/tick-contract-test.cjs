/**
 * PyBoy-rigor inspired contract checks for ticking and frame equivalence.
 */
const WasmBoy = require('../load-wasmboy-runtime.cjs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert');

const WASMBOY_INITIALIZE_OPTIONS = {
  headless: true,
  gameboySpeed: 100.0,
  isGbcEnabled: true
};

const testRomsPath = path.join(__dirname, '../performance/testroms');
const getTestRomArray = () =>
  new Uint8Array(fs.readFileSync(path.join(testRomsPath, 'back-to-color/back-to-color.gbc')));

const createJoypadState = (overrides = {}) => ({
  UP: false,
  RIGHT: false,
  DOWN: false,
  LEFT: false,
  A: false,
  B: false,
  SELECT: false,
  START: false,
  ...overrides
});

const sha256Hex = (bytes) =>
  crypto.createHash('sha256').update(Buffer.from(bytes)).digest('hex');

async function initRom() {
  await WasmBoy.config(WASMBOY_INITIALIZE_OPTIONS);
  await WasmBoy.loadROM(getTestRomArray());
}

async function tick(count, render = false) {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error('InvalidInput: count must be a positive integer');
  }
  if (typeof render !== 'boolean') {
    throw new Error('InvalidInput: render must be a boolean');
  }

  await WasmBoy._runWasmExport('executeMultipleFrames', [count], 20000);
  return {
    executedFrames: count,
    render
  };
}

function createDelayedInputQueue() {
  const queue = [];

  return {
    enqueue(state, delayFrames) {
      if (!Number.isInteger(delayFrames) || delayFrames < 0) {
        throw new Error('InvalidInput: delayFrames must be >= 0');
      }

      queue.push({
        state,
        framesRemaining: delayFrames
      });
    },
    async tickWithQueue(count) {
      const appliedFrameIndexes = [];

      for (let frameIndex = 0; frameIndex < count; frameIndex += 1) {
        for (let i = queue.length - 1; i >= 0; i -= 1) {
          const entry = queue[i];
          if (entry.framesRemaining <= 0) {
            WasmBoy.setJoypadState(entry.state);
            appliedFrameIndexes.push(frameIndex);
            queue.splice(i, 1);
          } else {
            entry.framesRemaining -= 1;
          }
        }

        await tick(1, false);
      }

      return appliedFrameIndexes;
    },
    size() {
      return queue.length;
    }
  };
}

async function captureStateFingerprint() {
  const gameMemoryBase = await WasmBoy._getWasmConstant('DEBUG_GAMEBOY_MEMORY_LOCATION');
  const [tileData, oamData] = await Promise.all([
    WasmBoy._getWasmMemorySection(gameMemoryBase + 0x8000, gameMemoryBase + 0x9800),
    WasmBoy._getWasmMemorySection(gameMemoryBase + 0xfe00, gameMemoryBase + 0xfea0)
  ]);

  return {
    tileDataSha256: sha256Hex(tileData),
    oamDataSha256: sha256Hex(oamData)
  };
}

describe('Tick contract + frame equivalence', function() {
  beforeEach(async function() {
    this.timeout(8000);
    await initRom();
  });

  it('enforces tick input contract and returns execution metadata', async () => {
    await assert.rejects(() => tick(0, false), /InvalidInput/);
    await assert.rejects(() => tick(1, 'nope'), /InvalidInput/);

    const result = await tick(3, false);
    assert.deepStrictEqual(result, {
      executedFrames: 3,
      render: false
    });
  });

  it('keeps equivalent state for tick(1)xN and tick(N)', async () => {
    for (let i = 0; i < 30; i += 1) {
      await tick(1, false);
    }
    const fingerprintSingleStep = await captureStateFingerprint();

    await WasmBoy.reset(WASMBOY_INITIALIZE_OPTIONS);
    await WasmBoy.loadROM(getTestRomArray());
    await tick(30, false);
    const fingerprintBatchStep = await captureStateFingerprint();

    assert.deepStrictEqual(fingerprintSingleStep, fingerprintBatchStep);
  });

  it('applies delayed input queue on the expected frame indexes', async () => {
    const queue = createDelayedInputQueue();
    queue.enqueue(createJoypadState({ START: true }), 0);
    queue.enqueue(createJoypadState({ A: true }), 2);

    const applied = await queue.tickWithQueue(4);
    assert.deepStrictEqual(applied, [0, 2]);
    assert.strictEqual(queue.size(), 0);
  });
});
