import { WasmBoyLib } from '../wasmboy/wasmboy';
import { WasmBoyGraphics } from '../graphics/graphics';

import { waitForLibWorkerMessageType } from '../wasmboy/onmessage';
import { WORKER_MESSAGE_TYPE } from '../worker/constants';
import { getEventData } from '../worker/util';
import { PPU_SNAPSHOT_TILE_LEN, PPU_SNAPSHOT_MAP_LEN, PPU_SNAPSHOT_OAM_LEN, PPU_SNAPSHOT_REG_OFF } from '../ppuSnapshotConstants';

// requestAnimationFrame() for headless mode
import raf from 'raf';

// https://www.npmjs.com/package/big-integer
import bigInt from 'big-integer';

let currentRaf = undefined;
const forceOutputFrame = () => {
  WasmBoyLib.worker.postMessage({
    type: WORKER_MESSAGE_TYPE.FORCE_OUTPUT_FRAME
  });
  WasmBoyGraphics.renderFrame();
};

export const runNumberOfFrames = async frames => {
  await WasmBoyLib.pause();

  // Set up a raf function to continually update the canvas
  const rafUpdateCanvas = () => {
    currentRaf = raf(() => {
      if (currentRaf) {
        forceOutputFrame();
        rafUpdateCanvas();
      }
    });
  };
  rafUpdateCanvas();

  for (let i = 0; i < frames; i++) {
    await runWasmExport('executeFrame', []);
  }

  currentRaf = undefined;
  forceOutputFrame();
};

export const runWasmExport = async (exportKey, parameters, timeout) => {
  if (!WasmBoyLib.worker) {
    return;
  }

  const event = await WasmBoyLib.worker.postMessage(
    {
      type: WORKER_MESSAGE_TYPE.RUN_WASM_EXPORT,
      export: exportKey,
      parameters
    },
    undefined,
    timeout
  );

  const eventData = getEventData(event);
  return eventData.message.response;
};

export const getWasmMemorySection = async (start, end) => {
  if (!WasmBoyLib.worker) {
    return;
  }

  const event = await WasmBoyLib.worker.postMessage({
    type: WORKER_MESSAGE_TYPE.GET_WASM_MEMORY_SECTION,
    start,
    end
  });

  const eventData = getEventData(event);
  return new Uint8Array(eventData.message.response);
};

export const setWasmMemorySection = async (start, data) => {
  if (!WasmBoyLib.worker) {
    return false;
  }

  let payload = null;
  if (data instanceof Uint8Array) {
    payload = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  } else if (data instanceof ArrayBuffer) {
    payload = data;
  }

  if (!payload) {
    return false;
  }

  const event = await WasmBoyLib.worker.postMessage(
    {
      type: WORKER_MESSAGE_TYPE.SET_WASM_MEMORY_SECTION,
      start,
      data: payload
    },
    [payload]
  );

  const eventData = getEventData(event);
  return Boolean(eventData.message && eventData.message.response);
};

export const getWasmConstant = async constantKey => {
  if (!WasmBoyLib.worker) {
    return;
  }

  const event = await WasmBoyLib.worker.postMessage({
    type: WORKER_MESSAGE_TYPE.GET_WASM_CONSTANT,
    constant: constantKey
  });

  const eventData = getEventData(event);
  return eventData.message.response;
};

export const getPpuSnapshotBuffer = async () => {
  if (!WasmBoyLib.worker) {
    return null;
  }

  const event = await WasmBoyLib.worker.postMessage({
    type: WORKER_MESSAGE_TYPE.GET_PPU_SNAPSHOT
  });

  const eventData = getEventData(event);
  if (!eventData.message || eventData.message.type !== WORKER_MESSAGE_TYPE.GET_PPU_SNAPSHOT) {
    return null;
  }
  return eventData.message.response || null;
};

export const parsePpuSnapshotBuffer = buffer => {
  if (!buffer || buffer.byteLength < PPU_SNAPSHOT_REG_OFF + 8) {
    return null;
  }
  const u8 = new Uint8Array(buffer);
  const tileData = u8.subarray(0, PPU_SNAPSHOT_TILE_LEN);
  const map0 = u8.subarray(PPU_SNAPSHOT_TILE_LEN, PPU_SNAPSHOT_TILE_LEN + PPU_SNAPSHOT_MAP_LEN);
  const map1 = u8.subarray(PPU_SNAPSHOT_TILE_LEN + PPU_SNAPSHOT_MAP_LEN, PPU_SNAPSHOT_TILE_LEN + PPU_SNAPSHOT_MAP_LEN * 2);
  const oamData = u8.subarray(
    PPU_SNAPSHOT_TILE_LEN + PPU_SNAPSHOT_MAP_LEN * 2,
    PPU_SNAPSHOT_TILE_LEN + PPU_SNAPSHOT_MAP_LEN * 2 + PPU_SNAPSHOT_OAM_LEN
  );
  const lcdc = u8[PPU_SNAPSHOT_REG_OFF + 4];
  const r = PPU_SNAPSHOT_REG_OFF;
  return {
    registers: {
      scx: u8[r + 0],
      scy: u8[r + 1],
      wx: u8[r + 2],
      wy: u8[r + 3],
      lcdc,
      bgp: u8[r + 5],
      obp0: u8[r + 6],
      obp1: u8[r + 7]
    },
    tileData,
    bgTileMap: (lcdc & 0x08) !== 0 ? map1 : map0,
    windowTileMap: (lcdc & 0x40) !== 0 ? map1 : map0,
    oamData
  };
};

export const getStepsAsString = async radix => {
  const stepsPerStepSet = await runWasmExport('getStepsPerStepSet');
  const stepSets = await runWasmExport('getStepSets');
  const steps = await runWasmExport('getSteps');

  const bigSteps = bigInt(stepsPerStepSet)
    .multiply(stepSets)
    .add(steps);

  if (radix) {
    return bigSteps.toString(radix);
  }
  return bigSteps.toString(10);
};

export const getCyclesAsString = async radix => {
  const cyclesPerCycleSet = await runWasmExport('getCyclesPerCycleSet');
  const cycleSets = await runWasmExport('getCycleSets');
  const cycles = await runWasmExport('getCycles');

  const bigCycles = bigInt(cyclesPerCycleSet)
    .multiply(cycleSets)
    .add(cycles);

  if (radix) {
    return bigCycles.toString(radix);
  }
  return bigCycles.toString(10);
};
