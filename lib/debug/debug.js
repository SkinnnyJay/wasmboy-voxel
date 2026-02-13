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
  if (eventData.message && eventData.message.error) {
    return undefined;
  }
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

const BP_ID_READ = 'bp-read';
const BP_ID_WRITE = 'bp-write';

/**
 * Set a memory breakpoint. Core supports one read and one write breakpoint.
 * @param {{ address: number, access: 'read' | 'write' }} opts
 * @returns {Promise<{ id: string }>}
 */
export const setMemoryBreakpoint = async ({ address, access }) => {
  if (!WasmBoyLib.worker) {
    return { id: access === 'read' ? BP_ID_READ : BP_ID_WRITE };
  }
  const exportName = access === 'read' ? 'setReadGbMemoryBreakpoint' : 'setWriteGbMemoryBreakpoint';
  await runWasmExport(exportName, [address]);
  return { id: access === 'read' ? BP_ID_READ : BP_ID_WRITE };
};

/**
 * Clear a memory breakpoint by ID. Use 'bp-read' or 'bp-write'.
 * @param {string} id
 * @returns {Promise<void>}
 */
export const clearMemoryBreakpoint = async id => {
  if (!WasmBoyLib.worker) {
    return;
  }
  if (id === BP_ID_READ) {
    await runWasmExport('resetReadGbMemoryBreakpoint', []);
  } else if (id === BP_ID_WRITE) {
    await runWasmExport('resetWriteGbMemoryBreakpoint', []);
  }
};

/**
 * Clear all memory breakpoints (read and write).
 * @returns {Promise<void>}
 */
export const clearAllMemoryBreakpoints = async () => {
  if (!WasmBoyLib.worker) {
    return;
  }
  await runWasmExport('resetReadGbMemoryBreakpoint', []);
  await runWasmExport('resetWriteGbMemoryBreakpoint', []);
};

const BG_MAP_WIDTH = 256;
const BG_MAP_HEIGHT = 256;
const TILE_DATA_WIDTH = 248; // 0x1f * 8
const TILE_DATA_HEIGHT = 184; // 0x17 * 8
const OAM_SPRITES_WIDTH = 64; // 8 * 8
const OAM_SPRITES_HEIGHT = 80; // 16 * 5

function rgbToImageData(rgbBytes, width, height) {
  if (typeof ImageData === 'undefined') {
    return null;
  }
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = rgbBytes[i * 3];
    data[i * 4 + 1] = rgbBytes[i * 3 + 1];
    data[i * 4 + 2] = rgbBytes[i * 3 + 2];
    data[i * 4 + 3] = 255;
  }
  return new ImageData(data, width, height);
}

/**
 * Draw background map to WASM memory and return as ImageData (256x256). Returns null if worker unavailable or ImageData not supported.
 * @returns {Promise<ImageData | null>}
 */
export const getBackgroundMapImage = async () => {
  if (!WasmBoyLib.worker) {
    return null;
  }
  try {
    await runWasmExport('drawBackgroundMapToWasmMemory', [1]);
    const loc = await getWasmConstant('BACKGROUND_MAP_LOCATION');
    const mem = await getWasmMemorySection(loc, loc + BG_MAP_WIDTH * BG_MAP_HEIGHT * 3);
    if (!mem || mem.length < BG_MAP_WIDTH * BG_MAP_HEIGHT * 3) {
      return null;
    }
    return rgbToImageData(mem, BG_MAP_WIDTH, BG_MAP_HEIGHT);
  } catch (_) {
    return null;
  }
};

/**
 * Draw tile data to WASM memory and return as ImageData (248x184). Returns null if worker unavailable or ImageData not supported.
 * @returns {Promise<ImageData | null>}
 */
export const getTileDataImage = async () => {
  if (!WasmBoyLib.worker) {
    return null;
  }
  try {
    await runWasmExport('drawTileDataToWasmMemory');
    const loc = await getWasmConstant('TILE_DATA_LOCATION');
    const size = TILE_DATA_WIDTH * TILE_DATA_HEIGHT * 3;
    const mem = await getWasmMemorySection(loc, loc + size);
    if (!mem || mem.length < size) {
      return null;
    }
    return rgbToImageData(mem, TILE_DATA_WIDTH, TILE_DATA_HEIGHT);
  } catch (_) {
    return null;
  }
};

/**
 * Draw OAM sprites to WASM memory and return as ImageData (64x80). Returns null if worker unavailable or ImageData not supported.
 * @returns {Promise<ImageData | null>}
 */
export const getOamSpritesImage = async () => {
  if (!WasmBoyLib.worker) {
    return null;
  }
  try {
    await runWasmExport('drawOamToWasmMemory');
    const loc = await getWasmConstant('OAM_TILES_LOCATION');
    const size = OAM_SPRITES_WIDTH * OAM_SPRITES_HEIGHT * 3;
    const mem = await getWasmMemorySection(loc, loc + size);
    if (!mem || mem.length < size) {
      return null;
    }
    return rgbToImageData(mem, OAM_SPRITES_WIDTH, OAM_SPRITES_HEIGHT);
  } catch (_) {
    return null;
  }
};

/**
 * Get CPU registers and PC/SP/opcode. Returns null if worker unavailable.
 * @returns {Promise<{ a: number; b: number; c: number; d: number; e: number; f: number; h: number; l: number; pc: number; sp: number; opcode: number } | null>}
 */
export const getCPURegisters = async () => {
  if (!WasmBoyLib.worker) {
    return null;
  }
  try {
    const [a, b, c, d, e, f, h, l, pc, sp, opcode] = await Promise.all([
      runWasmExport('getRegisterA'),
      runWasmExport('getRegisterB'),
      runWasmExport('getRegisterC'),
      runWasmExport('getRegisterD'),
      runWasmExport('getRegisterE'),
      runWasmExport('getRegisterF'),
      runWasmExport('getRegisterH'),
      runWasmExport('getRegisterL'),
      runWasmExport('getProgramCounter'),
      runWasmExport('getStackPointer'),
      runWasmExport('getOpcodeAtProgramCounter')
    ]);
    return { a, b, c, d, e, f, h, l, pc, sp, opcode };
  } catch (_) {
    return null;
  }
};

/**
 * Get timer state (DIV, TIMA, TMA, TAC, enabled). Returns null if worker unavailable.
 * @returns {Promise<{ div: number; tima: number; tma: number; tac: number; enabled: boolean } | null>}
 */
export const getTimerState = async () => {
  if (!WasmBoyLib.worker) {
    return null;
  }
  try {
    const [div, tima, tma, tac] = await Promise.all([
      runWasmExport('getDIV'),
      runWasmExport('getTIMA'),
      runWasmExport('getTMA'),
      runWasmExport('getTAC')
    ]);
    const enabled = (tac & 0x04) !== 0;
    return { div, tima, tma, tac, enabled };
  } catch (_) {
    return null;
  }
};

/**
 * Get LCD state (ly, lcdc, stat, scrollX/Y, windowX/Y). Returns null if worker unavailable.
 * @returns {Promise<{ ly: number; lcdc: number; stat: number; scrollX: number; scrollY: number; windowX: number; windowY: number } | null>}
 */
export const getLCDState = async () => {
  if (!WasmBoyLib.worker) {
    return null;
  }
  try {
    const [ly, scrollX, scrollY, windowX, windowY] = await Promise.all([
      runWasmExport('getLY'),
      runWasmExport('getScrollX'),
      runWasmExport('getScrollY'),
      runWasmExport('getWindowX'),
      runWasmExport('getWindowY')
    ]);
    const gbBase = 0xff00;
    const offsetStart = await runWasmExport('getWasmBoyOffsetFromGameBoyOffset', [gbBase]);
    const mem = await getWasmMemorySection(offsetStart, offsetStart + 0x100);
    if (!mem || mem.length < 0x46) {
      return { ly, lcdc: 0, stat: 0, scrollX, scrollY, windowX, windowY };
    }
    const lcdc = mem[0x40];
    const stat = mem[0x41];
    return { ly, lcdc, stat, scrollX, scrollY, windowX, windowY };
  } catch (_) {
    return null;
  }
};

const SCANLINE_COUNT = 144;
const SCANLINE_PARAMS_STRIDE = 4;

/**
 * Get per-scanline scroll/window parameters (scx, scy, wx, wy) for all 144 visible scanlines.
 * Returns null if worker unavailable or core does not support the buffer.
 * @returns {Promise<Array<[number, number, number, number]> | null>}
 */
export const getScanlineParameters = async () => {
  if (!WasmBoyLib.worker) {
    return null;
  }
  try {
    const loc = await getWasmConstant('SCANLINE_DEBUG_BUFFER_LOCATION');
    if (loc == null || loc === undefined) {
      return null;
    }
    const size = SCANLINE_COUNT * SCANLINE_PARAMS_STRIDE;
    const mem = await getWasmMemorySection(loc, loc + size);
    if (!mem || mem.length < size) {
      return null;
    }
    const out = [];
    for (let i = 0; i < SCANLINE_COUNT; i++) {
      const base = i * SCANLINE_PARAMS_STRIDE;
      out.push([mem[base], mem[base + 1], mem[base + 2], mem[base + 3]]);
    }
    return out;
  } catch (_) {
    return null;
  }
};
