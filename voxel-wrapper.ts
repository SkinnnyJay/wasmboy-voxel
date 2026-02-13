/* biome-ignore-all lint/style/noMagicNumbers: PPU memory addresses are hardware constants */
/**
 * WasmBoy Voxel Extension
 *
 * Wraps the vendored WasmBoy fork (./dist) with PPU snapshot capabilities for the
 * voxel rendering pipeline. Uses the fork's internal APIs
 * (_getWasmConstant, _getWasmMemorySection) to read VRAM, OAM,
 * tilemaps, and PPU registers directly from WASM memory.
 */
import { WasmBoy as BaseWasmBoy } from "./dist/wasmboy.wasm.esm.js";

export type { WasmBoyConfig, WasmBoyJoypadState };

/** Base API type for the vendored WasmBoy fork (mirrors wasm-fork.d.ts). */
interface WasmBoyApi {
  config(options?: WasmBoyConfig, canvasElement?: HTMLCanvasElement): Promise<void>;
  getConfig(): WasmBoyConfig;
  setCanvas(canvasElement: HTMLCanvasElement): Promise<void>;
  getCanvas(): HTMLCanvasElement | undefined;
  addBootROM(type: string, file: ArrayBuffer): Promise<void>;
  getBootROMs(): Promise<unknown[]>;
  loadROM(rom: ArrayBuffer | Uint8Array): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  reset(options?: WasmBoyConfig): Promise<void>;
  addPlugin(plugin: unknown): void;
  isPlaying(): boolean;
  isPaused(): boolean;
  isReady(): boolean;
  isLoadedAndStarted(): boolean;
  getVersion(): string;
  getSavedMemory(): Promise<unknown[]>;
  saveLoadedCartridge(additionalInfo?: Record<string, unknown>): Promise<unknown>;
  deleteSavedCartridge(cartridge: unknown): Promise<void>;
  saveState(): Promise<unknown>;
  getSaveStates(): Promise<unknown[]>;
  loadState(state: unknown): Promise<void>;
  deleteState(state: unknown): Promise<void>;
  getFPS(): number;
  setSpeed(speed: number): void;
  isGBC(): Promise<boolean>;
  enableDefaultJoypad(): void;
  disableDefaultJoypad(): void;
  setJoypadState(state: WasmBoyJoypadState): void;
  resumeAudioContext(): void;
  _getWasmMemorySection(start: number, end: number): Promise<Uint8Array>;
  _setWasmMemorySection?(start: number, data: Uint8Array | ArrayBuffer): Promise<boolean>;
  setWasmMemorySection?(start: number, data: Uint8Array | ArrayBuffer): Promise<boolean>;
  _getWasmConstant(name: string): Promise<number>;
  _getPpuSnapshotBuffer?(): Promise<ArrayBuffer | null>;
  _parsePpuSnapshotBuffer?(buffer: ArrayBuffer): WasmBoyPpuSnapshot | null;
  _runWasmExport(name: string, parameters?: readonly number[]): Promise<number>;
  _getCartridgeRam?(): Promise<Uint8Array>;
  getWRAM?(): Promise<Uint8Array>;
  setWRAM?(payload: Uint8Array): Promise<void>;
  getWorkRAM?(): Promise<Uint8Array>;
  setWorkRAM?(payload: Uint8Array): Promise<void>;
  writeRAM?(address: number, payload: Uint8Array): Promise<boolean>;
  getFullMemory?(): Promise<Uint8Array>;
  readMemory?(address: number, length: number): Promise<Uint8Array>;
}

interface WasmBoyConfig {
  headless?: boolean;
  disablePauseOnHidden?: boolean;
  isAudioEnabled?: boolean;
  isGbcEnabled?: boolean;
  updateGraphicsCallback?: ((imageDataArray: Uint8ClampedArray) => void) | null;
  [key: string]: unknown;
}

interface WasmBoyJoypadState {
  UP: boolean;
  RIGHT: boolean;
  DOWN: boolean;
  LEFT: boolean;
  A: boolean;
  B: boolean;
  SELECT: boolean;
  START: boolean;
}

/** WASM export for the base of the 64K Game Boy memory mirror (core/constants.ts). */
const GAME_MEMORY_BASE_CONSTANT = "DEBUG_GAMEBOY_MEMORY_LOCATION";
const TILE_DATA_START = 0x8000;
const TILE_DATA_END_EXCLUSIVE = 0x9800;
const BG_TILEMAP_0_START = 0x9800;
const BG_TILEMAP_1_START = 0x9c00;
const TILEMAP_SIZE = 0x400;
const OAM_START = 0xfe00;
const OAM_END_EXCLUSIVE = 0xfea0;
const REG_LCDC = 0xff40;
const REG_SCY = 0xff42;
const REG_SCX = 0xff43;
const REG_WY = 0xff4a;
const REG_WX = 0xff4b;
const REG_BGP = 0xff47;
const REG_OBP0 = 0xff48;
const REG_OBP1 = 0xff49;
const LCDC_BG_TILEMAP_SELECT_BIT = 0x08;
const LCDC_WINDOW_TILEMAP_SELECT_BIT = 0x40;

const SUPPORT_CHECK_RETRY_DELAY_MS = 200;
const SUPPORT_CHECK_MAX_RETRIES = 5;
const CONTRACT_VERSION = "v1";
const BYTE_MIN = 0;
const BYTE_MAX = 0xff;

interface WasmBoyInternalSnapshotApi extends WasmBoyApi {
  _getWasmMemorySection(start: number, end: number): Promise<Uint8Array>;
  _getWasmConstant(name: string): Promise<number>;
}

interface MemorySectionContractPayload {
  version: "v1";
  start: number;
  endExclusive: number;
  bytes: number[];
}

export interface WasmBoyPpuSnapshot {
  registers: {
    scx: number;
    scy: number;
    wx: number;
    wy: number;
    lcdc: number;
    bgp: number;
    obp0: number;
    obp1: number;
  };
  tileData: Uint8Array;
  bgTileMap: Uint8Array;
  windowTileMap: Uint8Array;
  oamData: Uint8Array;
}

/** Layer names for getPpuSnapshotLayers (LLM/tooling). */
export type PpuSnapshotLayer =
  | "tileData"
  | "bgTileMap"
  | "windowTileMap"
  | "oamData"
  | "registers";

export interface GetPpuSnapshotLayersOptions {
  layers?: PpuSnapshotLayer[];
}

/** Event handler for subscribe('snapshot', ...). */
export type SnapshotEventHandler = (snapshot: WasmBoyPpuSnapshot) => void;
/** Event handler for subscribe('error', ...). */
export type SnapshotErrorEventHandler = (error: unknown) => void;

/** Debug/fork API types (see fork-api-spec.ts). */
interface DirtyTileBitfield {
  data: Uint8Array;
  count: number;
  paletteChanged: boolean;
}

interface JoypadTraceEntry {
  pc: number;
  p14Selected: boolean;
  p15Selected: boolean;
  rawValue: number;
  buttons: {
    right: boolean;
    left: boolean;
    up: boolean;
    down: boolean;
    a: boolean;
    b: boolean;
    select: boolean;
    start: boolean;
  };
  frameNumber: number;
}

interface JoypadTraceConfig {
  enabled: boolean;
  maxEntries: number;
}

interface GbcBgPalette {
  palettes: Array<Array<[number, number, number]>>;
}

interface GbcObjPalette {
  palettes: Array<Array<[number, number, number]>>;
}

interface VramBankState {
  currentBank: 0 | 1;
  combinedTileData: Uint8Array;
}

interface DirectMemoryAccess {
  available: boolean;
  getView(offset: number, length: number): Uint8Array | null;
}

const DIRTY_TILE_BITFIELD_BYTES = 48;
const GBC_PALETTE_BYTES = 64;
const GBC_COLORS_PER_PALETTE = 4;
const GBC_PALETTES = 8;
const BYTES_PER_GBC_COLOR = 2;

export interface WasmBoyVoxelApi extends WasmBoyApi {
  supportsPpuSnapshot(): Promise<boolean>;
  getPpuSnapshot(): Promise<WasmBoyPpuSnapshot | null>;
  getRegisters(): Promise<WasmBoyPpuSnapshot["registers"] | null>;
  getMemorySection(start: number, endExclusive: number): Promise<Uint8Array | null>;
  getPpuSnapshotLayers(options?: GetPpuSnapshotLayersOptions): Promise<Partial<WasmBoyPpuSnapshot> | null>;
  getLastSnapshotDurationMs(): number | null;
  clearPpuSnapshotCache(): void;
  readMemory(start: number, endExclusive: number): Promise<Uint8Array | null>;
  setContractValidationEnabled(enabled: boolean): void;
  getContractValidationEnabled(): boolean;
  subscribe(
    event: "snapshot",
    handler: SnapshotEventHandler
  ): () => void;
  subscribe(
    event: "error",
    handler: SnapshotErrorEventHandler
  ): () => void;
  getDirtyTiles(): DirtyTileBitfield;
  getJoypadTrace(): JoypadTraceEntry[];
  setJoypadTraceConfig(config: JoypadTraceConfig): void;
  getGbcBgPalettes(): Promise<GbcBgPalette | null>;
  getGbcObjPalettes(): Promise<GbcObjPalette | null>;
  getVramBankState(): Promise<VramBankState>;
  getDirectMemoryAccess(): DirectMemoryAccess;
}

const hasSnapshotInternals = (api: WasmBoyApi): api is WasmBoyInternalSnapshotApi =>
  typeof (api as WasmBoyInternalSnapshotApi)._getWasmConstant === "function" &&
  typeof (api as WasmBoyInternalSnapshotApi)._getWasmMemorySection === "function";

const isByte = (value: number): boolean =>
  Number.isInteger(value) && value >= BYTE_MIN && value <= BYTE_MAX;

const hasExpectedLength = (value: Uint8Array, expected: number): boolean =>
  value.length === expected;

const isValidRegistersContract = (
  registers: WasmBoyPpuSnapshot["registers"],
): boolean =>
  isByte(registers.scx) &&
  isByte(registers.scy) &&
  isByte(registers.wx) &&
  isByte(registers.wy) &&
  isByte(registers.lcdc) &&
  isByte(registers.bgp) &&
  isByte(registers.obp0) &&
  isByte(registers.obp1);

const isValidPpuSnapshotContract = (snapshot: WasmBoyPpuSnapshot): boolean =>
  isValidRegistersContract(snapshot.registers) &&
  hasExpectedLength(snapshot.tileData, TILE_DATA_END_EXCLUSIVE - TILE_DATA_START) &&
  hasExpectedLength(snapshot.bgTileMap, TILEMAP_SIZE) &&
  hasExpectedLength(snapshot.windowTileMap, TILEMAP_SIZE) &&
  hasExpectedLength(snapshot.oamData, OAM_END_EXCLUSIVE - OAM_START);

const isValidMemorySectionContract = (payload: MemorySectionContractPayload): boolean => {
  if (payload.version !== CONTRACT_VERSION) return false;
  if (!Number.isInteger(payload.start) || payload.start < 0) return false;
  if (!Number.isInteger(payload.endExclusive) || payload.endExclusive <= payload.start) return false;
  if (payload.bytes.length !== payload.endExclusive - payload.start) return false;
  return payload.bytes.every(isByte);
};

const isProductionNodeEnv = (): boolean =>
  typeof process !== "undefined" &&
  typeof process.env === "object" &&
  process.env !== null &&
  process.env.NODE_ENV === "production";

const readGameMemorySection = async (
  api: WasmBoyInternalSnapshotApi,
  gameMemoryBase: number,
  start: number,
  endExclusive: number,
): Promise<Uint8Array> =>
  api._getWasmMemorySection(gameMemoryBase + start, gameMemoryBase + endExclusive);

const readGameMemoryByte = async (
  api: WasmBoyInternalSnapshotApi,
  gameMemoryBase: number,
  address: number,
): Promise<number> => {
  const data = await readGameMemorySection(api, gameMemoryBase, address, address + 1);
  return data[0] ?? 0;
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

let cachedGameMemoryBase: number | null = null;
let lastSnapshotDurationMs: number | null = null;
let contractValidationEnabled = !isProductionNodeEnv();
const emittedDeprecationWarnings = new Set<string>();

function emitDeprecationWarningOnce(key: string, message: string): void {
  if (isProductionNodeEnv()) return;
  if (emittedDeprecationWarnings.has(key)) return;
  emittedDeprecationWarnings.add(key);
  // eslint-disable-next-line no-console
  console.warn(`[WasmBoy-Voxel deprecation] ${message}`);
}

const supportsPpuSnapshot = async (api: WasmBoyApi): Promise<boolean> => {
  if (!hasSnapshotInternals(api)) return false;
  const internal = api as WasmBoyInternalSnapshotApi;
  for (let attempt = 0; attempt < SUPPORT_CHECK_MAX_RETRIES; attempt += 1) {
    try {
      const gameMemoryBase = await internal._getWasmConstant(GAME_MEMORY_BASE_CONSTANT);
      if (Number.isFinite(gameMemoryBase) && gameMemoryBase > 0) {
        cachedGameMemoryBase = gameMemoryBase;
        return true;
      }
    } catch {
      /* Worker not ready yet. */
    }
    if (attempt < SUPPORT_CHECK_MAX_RETRIES - 1) await delay(SUPPORT_CHECK_RETRY_DELAY_MS);
  }
  return false;
};

const resolveGameMemoryBase = async (api: WasmBoyInternalSnapshotApi): Promise<number | null> => {
  if (cachedGameMemoryBase !== null) return cachedGameMemoryBase;
  try {
    const base = await api._getWasmConstant(GAME_MEMORY_BASE_CONSTANT);
    if (Number.isFinite(base) && base > 0) {
      cachedGameMemoryBase = base;
      return base;
    }
  } catch {
    /* Worker communication failed. */
  }
  cachedGameMemoryBase = null;
  return null;
};

/** Clears cached PPU snapshot base. Call after reset() or worker reload so next snapshot uses fresh base. */
function clearPpuSnapshotCache(): void {
  cachedGameMemoryBase = null;
}

const snapshotHandlers: SnapshotEventHandler[] = [];
const errorHandlers: SnapshotErrorEventHandler[] = [];

function emitSnapshot(snapshot: WasmBoyPpuSnapshot): void {
  if (contractValidationEnabled && !isValidPpuSnapshotContract(snapshot)) {
    emitSnapshotError(new Error("PPU snapshot contract validation failed during event emit."));
    return;
  }

  snapshotHandlers.forEach((h) => {
    try {
      h(snapshot);
    } catch {
      /* ignore handler errors */
    }
  });
}

function emitSnapshotError(error: unknown): void {
  errorHandlers.forEach((h) => {
    try {
      h(error);
    } catch {
      /* ignore handler errors */
    }
  });
}

const getPpuSnapshot = async (api: WasmBoyApi): Promise<WasmBoyPpuSnapshot | null> => {
  if (!hasSnapshotInternals(api)) return null;
  const internal = api as WasmBoyInternalSnapshotApi;
  if (cachedGameMemoryBase === null) {
    const supported = await supportsPpuSnapshot(api);
    if (!supported) return null;
  }
  const snapshotStart = typeof performance !== "undefined" ? performance.now() : Date.now();

  const batched = internal._getPpuSnapshotBuffer?.();
  if (batched) {
    try {
      const buffer = await batched;
      if (buffer) {
        const snapshot = internal._parsePpuSnapshotBuffer?.(buffer);
        if (snapshot) {
          if (contractValidationEnabled && !isValidPpuSnapshotContract(snapshot)) {
            emitSnapshotError(new Error("PPU snapshot contract validation failed (batched)."));
            return null;
          }
          lastSnapshotDurationMs =
            (typeof performance !== "undefined" ? performance.now() : Date.now()) - snapshotStart;
          emitSnapshot(snapshot);
          return snapshot;
        }
      }
    } catch (e) {
      emitSnapshotError(e);
      /* Batched path failed; fall back to per-section reads. */
    }
  }

  const gameMemoryBase = await resolveGameMemoryBase(internal);
  if (gameMemoryBase === null) {
    emitSnapshotError(new Error("resolveGameMemoryBase failed"));
    return null;
  }

  const lcdc = await readGameMemoryByte(internal, gameMemoryBase, REG_LCDC);
  const bgMapStart =
    (lcdc & LCDC_BG_TILEMAP_SELECT_BIT) !== 0 ? BG_TILEMAP_1_START : BG_TILEMAP_0_START;
  const windowMapStart =
    (lcdc & LCDC_WINDOW_TILEMAP_SELECT_BIT) !== 0 ? BG_TILEMAP_1_START : BG_TILEMAP_0_START;

  const [tileData, bgTileMap, windowTileMap, oamData, scx, scy, wx, wy, bgp, obp0, obp1] =
    await Promise.all([
      readGameMemorySection(internal, gameMemoryBase, TILE_DATA_START, TILE_DATA_END_EXCLUSIVE),
      readGameMemorySection(internal, gameMemoryBase, bgMapStart, bgMapStart + TILEMAP_SIZE),
      readGameMemorySection(
        internal,
        gameMemoryBase,
        windowMapStart,
        windowMapStart + TILEMAP_SIZE,
      ),
      readGameMemorySection(internal, gameMemoryBase, OAM_START, OAM_END_EXCLUSIVE),
      readGameMemoryByte(internal, gameMemoryBase, REG_SCX),
      readGameMemoryByte(internal, gameMemoryBase, REG_SCY),
      readGameMemoryByte(internal, gameMemoryBase, REG_WX),
      readGameMemoryByte(internal, gameMemoryBase, REG_WY),
      readGameMemoryByte(internal, gameMemoryBase, REG_BGP),
      readGameMemoryByte(internal, gameMemoryBase, REG_OBP0),
      readGameMemoryByte(internal, gameMemoryBase, REG_OBP1),
    ]);

  lastSnapshotDurationMs =
    (typeof performance !== "undefined" ? performance.now() : Date.now()) - snapshotStart;

  const snapshot: WasmBoyPpuSnapshot = {
    registers: { scx, scy, wx, wy, lcdc, bgp, obp0, obp1 },
    tileData,
    bgTileMap,
    windowTileMap,
    oamData,
  };
  if (contractValidationEnabled && !isValidPpuSnapshotContract(snapshot)) {
    emitSnapshotError(new Error("PPU snapshot contract validation failed (section reads)."));
    return null;
  }
  emitSnapshot(snapshot);
  return snapshot;
};

async function getRegisters(
  api: WasmBoyApi,
): Promise<WasmBoyPpuSnapshot["registers"] | null> {
  const snapshot = await getPpuSnapshot(api);
  if (!snapshot) return null;
  if (contractValidationEnabled && !isValidRegistersContract(snapshot.registers)) {
    emitSnapshotError(new Error("Registers contract validation failed."));
    return null;
  }
  return snapshot.registers;
}

async function getPpuSnapshotLayers(
  api: WasmBoyApi,
  options?: GetPpuSnapshotLayersOptions,
): Promise<Partial<WasmBoyPpuSnapshot> | null> {
  const full = await getPpuSnapshot(api);
  if (!full) return null;
  const layers = options?.layers;
  if (!layers || layers.length === 0) return full;
  const result: Partial<WasmBoyPpuSnapshot> = {};
  for (const layer of layers) {
    if (layer === "registers") result.registers = full.registers;
    else if (layer in full) (result as WasmBoyPpuSnapshot)[layer] = full[layer];
  }
  return result;
}

async function readMemory(
  api: WasmBoyApi,
  start: number,
  endExclusive: number,
): Promise<Uint8Array | null> {
  if (!hasSnapshotInternals(api)) return null;
  if (cachedGameMemoryBase === null) {
    const supported = await supportsPpuSnapshot(api);
    if (!supported) return null;
  }
  const internal = api as WasmBoyInternalSnapshotApi;
  const base = await resolveGameMemoryBase(internal);
  if (base === null) return null;
  try {
    const bytes = await internal._getWasmMemorySection(base + start, base + endExclusive);
    if (!contractValidationEnabled) return bytes;
    const payload: MemorySectionContractPayload = {
      version: CONTRACT_VERSION,
      start,
      endExclusive,
      bytes: Array.from(bytes),
    };
    if (!isValidMemorySectionContract(payload)) {
      emitSnapshotError(new Error("Memory section contract validation failed."));
      return null;
    }
    return bytes;
  } catch {
    return null;
  }
}

async function getMemorySection(
  api: WasmBoyApi,
  start: number,
  endExclusive: number,
): Promise<Uint8Array | null> {
  return readMemory(api, start, endExclusive);
}

function setContractValidation(enabled: boolean): void {
  contractValidationEnabled = enabled;
}

function getContractValidation(): boolean {
  return contractValidationEnabled;
}

function subscribeSnapshot(handler: SnapshotEventHandler): () => void {
  snapshotHandlers.push(handler);
  return () => {
    const i = snapshotHandlers.indexOf(handler);
    if (i !== -1) snapshotHandlers.splice(i, 1);
  };
}

function subscribeError(handler: SnapshotErrorEventHandler): () => void {
  errorHandlers.push(handler);
  return () => {
    const i = errorHandlers.indexOf(handler);
    if (i !== -1) errorHandlers.splice(i, 1);
  };
}

const BaseApi = BaseWasmBoy as unknown as WasmBoyApi;

function createStubDirtyTileBitfield(): DirtyTileBitfield {
  return {
    data: new Uint8Array(DIRTY_TILE_BITFIELD_BYTES),
    count: 0,
    paletteChanged: false,
  };
}

function rgb555ToRgb(word: number): [number, number, number] {
  const r = (((word >> 0) & 31) * 255) / 31;
  const g = (((word >> 5) & 31) * 255) / 31;
  const b = (((word >> 10) & 31) * 255) / 31;
  return [Math.round(r), Math.round(g), Math.round(b)];
}

function parseGbcPaletteBytes(raw: Uint8Array): Array<Array<[number, number, number]>> {
  const palettes: Array<Array<[number, number, number]>> = [];
  for (let p = 0; p < GBC_PALETTES; p += 1) {
    const colors: Array<[number, number, number]> = [];
    for (let c = 0; c < GBC_COLORS_PER_PALETTE; c += 1) {
      const offset = (p * GBC_COLORS_PER_PALETTE + c) * BYTES_PER_GBC_COLOR;
      const lo = raw[offset] ?? 0;
      const hi = raw[offset + 1] ?? 0;
      const word = lo | (hi << 8);
      colors.push(rgb555ToRgb(word));
    }
    palettes.push(colors);
  }
  return palettes;
}

async function fetchGbcPalettes(api: WasmBoyInternalSnapshotApi): Promise<{
  bg: GbcBgPalette | null;
  obj: GbcObjPalette | null;
}> {
  try {
    const loc = await api._getWasmConstant("GBC_PALETTE_LOCATION");
    const size = await api._getWasmConstant("GBC_PALETTE_SIZE");
    if (!Number.isFinite(loc) || !Number.isFinite(size) || size < GBC_PALETTE_BYTES * 2) {
      return { bg: null, obj: null };
    }
    const raw = await api._getWasmMemorySection(loc, loc + size);
    const bgRaw = raw.subarray(0, GBC_PALETTE_BYTES);
    const objRaw = raw.subarray(GBC_PALETTE_BYTES, GBC_PALETTE_BYTES * 2);
    return {
      bg: { palettes: parseGbcPaletteBytes(bgRaw) },
      obj: { palettes: parseGbcPaletteBytes(objRaw) },
    };
  } catch {
    return { bg: null, obj: null };
  }
}

export const WasmBoy: WasmBoyVoxelApi = Object.assign(BaseWasmBoy, {
  supportsPpuSnapshot(): Promise<boolean> {
    return supportsPpuSnapshot(BaseApi);
  },
  getPpuSnapshot(): Promise<WasmBoyPpuSnapshot | null> {
    return getPpuSnapshot(BaseApi);
  },
  getRegisters(): Promise<WasmBoyPpuSnapshot["registers"] | null> {
    return getRegisters(BaseApi);
  },
  getMemorySection(start: number, endExclusive: number): Promise<Uint8Array | null> {
    return getMemorySection(BaseApi, start, endExclusive);
  },
  getPpuSnapshotLayers(options?: GetPpuSnapshotLayersOptions): Promise<Partial<WasmBoyPpuSnapshot> | null> {
    return getPpuSnapshotLayers(BaseApi, options);
  },
  getLastSnapshotDurationMs(): number | null {
    return lastSnapshotDurationMs;
  },
  clearPpuSnapshotCache(): void {
    clearPpuSnapshotCache();
  },
  readMemory(start: number, endExclusive: number): Promise<Uint8Array | null> {
    emitDeprecationWarningOnce(
      "readMemory",
      "readMemory() is kept for compatibility. Prefer getMemorySection().",
    );
    return readMemory(BaseApi, start, endExclusive);
  },
  setContractValidationEnabled(enabled: boolean): void {
    setContractValidation(enabled);
  },
  getContractValidationEnabled(): boolean {
    return getContractValidation();
  },
  subscribe(event: "snapshot" | "error", handler: SnapshotEventHandler | SnapshotErrorEventHandler): () => void {
    if (event === "snapshot") return subscribeSnapshot(handler as SnapshotEventHandler);
    return subscribeError(handler as SnapshotErrorEventHandler);
  },
  reset(options?: WasmBoyConfig): Promise<void> {
    clearPpuSnapshotCache();
    return BaseApi.reset(options);
  },
  getDirtyTiles(): DirtyTileBitfield {
    return createStubDirtyTileBitfield();
  },
  getJoypadTrace(): JoypadTraceEntry[] {
    return [];
  },
  setJoypadTraceConfig(_config: JoypadTraceConfig): void {
    /* No-op until WASM core supports JOYP tracing. */
  },
  async getGbcBgPalettes(): Promise<GbcBgPalette | null> {
    if (!hasSnapshotInternals(BaseApi)) return null;
    const { bg } = await fetchGbcPalettes(BaseApi as WasmBoyInternalSnapshotApi);
    return bg;
  },
  async getGbcObjPalettes(): Promise<GbcObjPalette | null> {
    if (!hasSnapshotInternals(BaseApi)) return null;
    const { obj } = await fetchGbcPalettes(BaseApi as WasmBoyInternalSnapshotApi);
    return obj;
  },
  async getVramBankState(): Promise<VramBankState> {
    const snapshot = await getPpuSnapshot(BaseApi);
    const tileData =
      snapshot?.tileData ?? new Uint8Array(TILE_DATA_END_EXCLUSIVE - TILE_DATA_START);
    return {
      currentBank: 0,
      combinedTileData: tileData,
    };
  },
  getDirectMemoryAccess(): DirectMemoryAccess {
    return {
      available: false,
      getView: () => null,
    };
  },
}) as WasmBoyVoxelApi;

export interface WasmBoyCompatApi extends WasmBoyVoxelApi {}

export const WasmBoyCompat: WasmBoyCompatApi = Object.assign({}, WasmBoy, {
  getMemorySection(start: number, endExclusive: number): Promise<Uint8Array | null> {
    return WasmBoy.readMemory(start, endExclusive);
  },
});

export type { WasmBoyApi };
