/**
 * WasmBoy Fork API Specification
 *
 * This file documents the APIs that should be added to the WasmBoy
 * fork when AssemblyScript source access is available. These interfaces
 * are the target for Phase 0F tasks.
 *
 * Once implemented in the WASM core, the wrapper in index.ts should
 * be updated to expose these through the WasmBoyVoxelApi interface.
 */

/* ----------------------------------------------------------------
 * 0F-C: VRAM Write Tracking (Dirty Tiles)
 * ----------------------------------------------------------------
 * Hook VRAM writes in the WASM CPU write handler for $8000-$97FF.
 * Maintain a bitfield (384 bits = 48 bytes) tracking which tiles
 * changed since last getPpuSnapshot() call.
 */

/** Dirty tile bitfield: 384 bits = 48 bytes, one bit per tile. */
export interface DirtyTileBitfield {
  /** Raw bitfield data. Bit N = 1 means tile N was written. */
  data: Uint8Array; // 48 bytes
  /** Number of tiles marked dirty in this snapshot. */
  count: number;
  /** Whether palette registers ($FF47-$FF49 DMG, $FF68-$FF6B GBC) changed. */
  paletteChanged: boolean;
}

/* ----------------------------------------------------------------
 * 0F-D: JOYP (Input) Instrumentation
 * ----------------------------------------------------------------
 * Hook MMIO reads/writes at $FF00 (JOYP register) in the WASM core.
 * Record: program counter (PC), P14/P15 select bits, returned value,
 * decoded pressed buttons.
 */

export interface JoypadTraceEntry {
  /** Program counter at the time of the JOYP read. */
  pc: number;
  /** P14 (D-pad) select bit. 0 = selected. */
  p14Selected: boolean;
  /** P15 (buttons) select bit. 0 = selected. */
  p15Selected: boolean;
  /** Raw byte value returned from JOYP register. */
  rawValue: number;
  /** Decoded button state (active-low: 0 = pressed). */
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
  /** Frame number when this read occurred. */
  frameNumber: number;
}

export interface JoypadTraceConfig {
  /** Enable/disable JOYP tracing. Disabled by default for performance. */
  enabled: boolean;
  /** Maximum number of entries in the circular buffer. */
  maxEntries: number;
}

/* ----------------------------------------------------------------
 * 0F-E: GBC Extensions
 * ----------------------------------------------------------------
 * Expose GBC color palettes and VRAM bank state.
 */

/** GBC background color palette (8 palettes x 4 colors x RGB). */
export interface GbcBgPalette {
  /** 8 palettes, each with 4 colors as [r, g, b] (0-255). */
  palettes: Array<Array<[number, number, number]>>;
}

/** GBC object color palette (8 palettes x 4 colors x RGB). */
export interface GbcObjPalette {
  palettes: Array<Array<[number, number, number]>>;
}

/** GBC VRAM bank state. */
export interface VramBankState {
  /** Currently active VRAM bank (0 or 1). */
  currentBank: 0 | 1;
  /** Combined tile data from both banks (bank 0 + bank 1 = 12288 bytes). */
  combinedTileData: Uint8Array;
}

/* ----------------------------------------------------------------
 * 0F-G: Direct WASM Memory Access
 * ----------------------------------------------------------------
 * When WASM runs on the main thread, use WebAssembly.Memory.buffer
 * ArrayBuffer view for zero-copy snapshot capture.
 */

export interface DirectMemoryAccess {
  /** Whether direct memory access is available (main thread WASM). */
  available: boolean;
  /** Get a view into WASM memory at the given offset and length. */
  getView(offset: number, length: number): Uint8Array | null;
}

/* ----------------------------------------------------------------
 * Extended WasmBoy Fork API
 * ----------------------------------------------------------------
 * These methods should be added to the WasmBoy JS API when the
 * fork is built from AssemblyScript source.
 */

export interface WasmBoyForkApi {
  /** Get dirty tile bitfield from last frame (0F-C). */
  getDirtyTiles(): DirtyTileBitfield;

  /** Get JOYP trace buffer (0F-D). */
  getJoypadTrace(): JoypadTraceEntry[];

  /** Configure JOYP tracing (0F-D). */
  setJoypadTraceConfig(config: JoypadTraceConfig): void;

  /** Get GBC background palettes (0F-E). */
  getGbcBgPalettes(): GbcBgPalette | null;

  /** Get GBC object palettes (0F-E). */
  getGbcObjPalettes(): GbcObjPalette | null;

  /** Get VRAM bank state (0F-E). */
  getVramBankState(): VramBankState;

  /** Get direct WASM memory access helper (0F-G). */
  getDirectMemoryAccess(): DirectMemoryAccess;
}
