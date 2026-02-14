/**
 * Synchronous headless runner: WASM on main thread, no Workers.
 * For testing, CI, and deterministic frame stepping.
 */

import { loadMainThreadWasm } from './mainThreadCore.wasm';
import { getImageDataFromGraphicsFrameBuffer } from '../graphics/worker/imageData';
import { parsePpuSnapshotBuffer } from '../ppuSnapshotParse';
import {
  PPU_SNAPSHOT_TILE_LEN,
  PPU_SNAPSHOT_MAP_LEN,
  PPU_SNAPSHOT_OAM_LEN,
  PPU_SNAPSHOT_REG_OFF,
  PPU_SNAPSHOT_TOTAL,
  PPU_SNAPSHOT_OFFSET_TILE_START,
  PPU_SNAPSHOT_OFFSET_MAP0,
  PPU_SNAPSHOT_OFFSET_MAP1,
  PPU_SNAPSHOT_OFFSET_OAM,
  PPU_SNAPSHOT_REG_OFFSET_SCX,
  PPU_SNAPSHOT_REG_OFFSET_SCY,
  PPU_SNAPSHOT_REG_OFFSET_WX,
  PPU_SNAPSHOT_REG_OFFSET_WY,
  PPU_SNAPSHOT_REG_OFFSET_LCDC,
  PPU_SNAPSHOT_REG_OFFSET_BGP,
  PPU_SNAPSHOT_REG_OFFSET_OBP0,
  PPU_SNAPSHOT_REG_OFFSET_OBP1,
} from '../ppuSnapshotConstants';

const BUTTON_MAP = {
  UP: 0,
  RIGHT: 1,
  DOWN: 2,
  LEFT: 3,
  A: 4,
  B: 5,
  SELECT: 6,
  START: 7,
};

export class WasmBoyHeadless {
  constructor() {
    this.instance = undefined;
    this.byteMemory = undefined;
    this.loaded = false;
    this.paused = true;
    this._frameLocation = 0;
    this._frameSize = 0;
    this._cartridgeRomLocation = 0;
    this._gameboyMemoryLocation = 0;
    this._gameboyMemorySize = 0;
    this._debugGameboyMemoryLocation = 0;
    this._internalStateLocation = 0;
    this._internalStateSize = 0;
    this._paletteMemoryLocation = 0;
    this._paletteMemorySize = 0;
    this._cartridgeRamLocation = 0;
    this._joypadState = [0, 0, 0, 0, 0, 0, 0, 0];
  }

  /**
   * Load the core and ROM. Call once before stepFrame / getFrameBuffer / getPpuSnapshot.
   * @param {Uint8Array} rom - ROM bytes
   * @param {object} [options] - optional: enableBootRom (bool), isGbcEnabled (bool)
   * @returns {Promise<void>}
   */
  async loadROM(rom, options = {}) {
    const { instance, byteMemory } = await loadMainThreadWasm();
    this.instance = instance;
    this.byteMemory = byteMemory;
    this.paused = true;

    const ex = instance.exports;
    this._frameLocation = ex.FRAME_LOCATION.valueOf();
    this._frameSize = ex.FRAME_SIZE.valueOf();
    this._cartridgeRomLocation = ex.CARTRIDGE_ROM_LOCATION.valueOf();
    this._gameboyMemoryLocation = ex.GAMEBOY_INTERNAL_MEMORY_LOCATION.valueOf();
    this._gameboyMemorySize = ex.GAMEBOY_INTERNAL_MEMORY_SIZE.valueOf();
    this._debugGameboyMemoryLocation = ex.DEBUG_GAMEBOY_MEMORY_LOCATION.valueOf();
    this._internalStateLocation = ex.WASMBOY_STATE_LOCATION.valueOf();
    this._internalStateSize = ex.WASMBOY_STATE_SIZE.valueOf();
    this._paletteMemoryLocation = ex.GBC_PALETTE_LOCATION.valueOf();
    this._paletteMemorySize = ex.GBC_PALETTE_SIZE.valueOf();
    this._cartridgeRamLocation = ex.CARTRIDGE_RAM_LOCATION.valueOf();

    const config = [options.enableBootRom !== false ? 1 : 0, options.isGbcEnabled !== false ? 1 : 0, 0, 0, 0, 0, 0, 0, 0, 0];
    ex.config.apply(null, config);

    const romBytes = rom instanceof Uint8Array ? rom : new Uint8Array(rom);
    const maxRom = Math.min(romBytes.length, 0x200000);
    this.byteMemory.set(romBytes.subarray(0, maxRom), this._cartridgeRomLocation);

    this.loaded = true;
  }

  /**
   * Execute one frame (synchronous).
   */
  stepFrame() {
    if (!this.instance || !this.loaded) return;
    if (this._joypadState.some(Boolean)) {
      this.instance.exports.setJoypadState.apply(null, this._joypadState);
    }
    this.instance.exports.executeFrame();
  }

  /**
   * Execute N frames (synchronous).
   * @param {number} count
   */
  stepFrames(count) {
    for (let i = 0; i < count; i++) {
      this.stepFrame();
    }
  }

  /**
   * Current frame as RGBA (160×144×4). New copy each call.
   * @returns {Uint8ClampedArray}
   */
  getFrameBuffer() {
    if (!this.byteMemory || !this._frameSize) {
      return new Uint8ClampedArray(160 * 144 * 4);
    }
    const frameSlice = this.byteMemory.slice(this._frameLocation, this._frameLocation + this._frameSize);
    return getImageDataFromGraphicsFrameBuffer(frameSlice);
  }

  /**
   * PPU snapshot from current memory (synchronous).
   * @returns {import('../debug/debug').WasmBoyPpuSnapshot | null}
   */
  getPpuSnapshot() {
    if (!this.byteMemory || !this.instance) return null;
    const base = this._gameboyMemoryLocation;
    const mem = this.byteMemory;
    const out = new Uint8Array(PPU_SNAPSHOT_TOTAL);
    const tileStart = base + PPU_SNAPSHOT_OFFSET_TILE_START;
    const map0Start = base + PPU_SNAPSHOT_OFFSET_MAP0;
    const map1Start = base + PPU_SNAPSHOT_OFFSET_MAP1;
    const oamStart = base + PPU_SNAPSHOT_OFFSET_OAM;
    for (let i = 0; i < PPU_SNAPSHOT_TILE_LEN; i++) out[i] = mem[tileStart + i];
    for (let i = 0; i < PPU_SNAPSHOT_MAP_LEN; i++) out[PPU_SNAPSHOT_TILE_LEN + i] = mem[map0Start + i];
    for (let i = 0; i < PPU_SNAPSHOT_MAP_LEN; i++) out[PPU_SNAPSHOT_TILE_LEN + PPU_SNAPSHOT_MAP_LEN + i] = mem[map1Start + i];
    for (let i = 0; i < PPU_SNAPSHOT_OAM_LEN; i++) out[PPU_SNAPSHOT_TILE_LEN + PPU_SNAPSHOT_MAP_LEN * 2 + i] = mem[oamStart + i];
    out[PPU_SNAPSHOT_REG_OFF + 0] = mem[base + PPU_SNAPSHOT_REG_OFFSET_SCX];
    out[PPU_SNAPSHOT_REG_OFF + 1] = mem[base + PPU_SNAPSHOT_REG_OFFSET_SCY];
    out[PPU_SNAPSHOT_REG_OFF + 2] = mem[base + PPU_SNAPSHOT_REG_OFFSET_WX];
    out[PPU_SNAPSHOT_REG_OFF + 3] = mem[base + PPU_SNAPSHOT_REG_OFFSET_WY];
    out[PPU_SNAPSHOT_REG_OFF + 4] = mem[base + PPU_SNAPSHOT_REG_OFFSET_LCDC];
    out[PPU_SNAPSHOT_REG_OFF + 5] = mem[base + PPU_SNAPSHOT_REG_OFFSET_BGP];
    out[PPU_SNAPSHOT_REG_OFF + 6] = mem[base + PPU_SNAPSHOT_REG_OFFSET_OBP0];
    out[PPU_SNAPSHOT_REG_OFF + 7] = mem[base + PPU_SNAPSHOT_REG_OFFSET_OBP1];
    return parsePpuSnapshotBuffer(out.buffer);
  }

  /**
   * Read one byte at Game Boy address (0x0000–0xFFFF). Uses DEBUG_GAMEBOY_MEMORY_LOCATION mirror.
   * @param {number} address - GB address
   * @returns {number} 0–255
   */
  readMemory(address) {
    if (!this.byteMemory || address < 0 || address > 0xffff) return 0;
    const offset = this._debugGameboyMemoryLocation + address;
    if (offset >= this.byteMemory.length) return 0;
    return this.byteMemory[offset];
  }

  /**
   * Write one byte at Game Boy address (uses same mirror as readMemory).
   * @param {number} address
   * @param {number} value 0–255
   */
  writeMemory(address, value) {
    if (!this.byteMemory || address < 0 || address > 0xffff) return;
    const offset = this._debugGameboyMemoryLocation + address;
    if (offset < this.byteMemory.length) {
      this.byteMemory[offset] = value & 0xff;
    }
  }

  /**
   * Set one button.
   * @param {string} button - UP, RIGHT, DOWN, LEFT, A, B, SELECT, START
   * @param {boolean} pressed
   */
  setButton(button, pressed) {
    const idx = BUTTON_MAP[button];
    if (idx !== undefined) {
      this._joypadState[idx] = pressed ? 1 : 0;
    }
  }

  /**
   * Set full joypad state.
   * @param {{ UP?: boolean, RIGHT?: boolean, DOWN?: boolean, LEFT?: boolean, A?: boolean, B?: boolean, SELECT?: boolean, START?: boolean }} state
   */
  setJoypadState(state) {
    this._joypadState[0] = state.UP ? 1 : 0;
    this._joypadState[1] = state.RIGHT ? 1 : 0;
    this._joypadState[2] = state.DOWN ? 1 : 0;
    this._joypadState[3] = state.LEFT ? 1 : 0;
    this._joypadState[4] = state.A ? 1 : 0;
    this._joypadState[5] = state.B ? 1 : 0;
    this._joypadState[6] = state.SELECT ? 1 : 0;
    this._joypadState[7] = state.START ? 1 : 0;
  }

  /**
   * Save state (simplified: full byte memory copy). Compatible with loadState from same class.
   * @returns {unknown} state object
   */
  saveState() {
    if (!this.byteMemory) return null;
    if (typeof this.instance.exports.saveState === 'function') {
      this.instance.exports.saveState();
    }
    return {
      byteMemory: this.byteMemory.slice(0).buffer,
      schema: 'WasmBoyHeadless',
    };
  }

  /**
   * Load state from saveState() or worker save state shape.
   * @param {unknown} state
   */
  loadState(state) {
    if (!state || !this.byteMemory) return;
    if (state.schema === 'WasmBoyHeadless' && state.byteMemory) {
      this.byteMemory.set(new Uint8Array(state.byteMemory));
      return;
    }
    const wm = state.wasmboyMemory;
    if (wm) {
      const ex = this.instance.exports;
      const set = (arr, loc, len) => {
        if (arr && arr.length) {
          this.byteMemory.set(new Uint8Array(arr).subarray(0, len), loc);
        }
      };
      set(wm.wasmBoyInternalState, this._internalStateLocation, this._internalStateSize);
      set(wm.wasmBoyPaletteMemory, this._paletteMemoryLocation, this._paletteMemorySize);
      set(wm.gameBoyMemory, this._gameboyMemoryLocation, this._gameboyMemorySize);
      set(wm.cartridgeRam, this._cartridgeRamLocation, 0x20000);
    }
  }

  /**
   * Reset core (re-run config and clear audio). Does not reload ROM.
   */
  reset() {
    if (!this.instance) return;
    this.instance.exports.clearAudioBuffer();
    this.instance.exports.config.apply(null, [0, 1, 0, 0, 0, 0, 0, 0, 0, 0]);
  }

  /**
   * Release references. Call when done.
   */
  destroy() {
    this.instance = undefined;
    this.byteMemory = undefined;
    this.loaded = false;
  }
}
