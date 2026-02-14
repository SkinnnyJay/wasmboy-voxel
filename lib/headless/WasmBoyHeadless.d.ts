export type WasmBoyHeadlessButton = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT' | 'A' | 'B' | 'SELECT' | 'START';

export interface WasmBoyHeadlessJoypadState {
  UP?: boolean;
  RIGHT?: boolean;
  DOWN?: boolean;
  LEFT?: boolean;
  A?: boolean;
  B?: boolean;
  SELECT?: boolean;
  START?: boolean;
}

export interface WasmBoyHeadlessPpuSnapshot {
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

export interface WasmBoyHeadlessConfig {
  enableBootRom?: boolean;
  isGbcEnabled?: boolean;
}

export class WasmBoyHeadless {
  loadROM(rom: Uint8Array, options?: WasmBoyHeadlessConfig): Promise<void>;
  stepFrame(): void;
  stepFrames(count: number): void;
  getFrameBuffer(): Uint8ClampedArray;
  getPpuSnapshot(): WasmBoyHeadlessPpuSnapshot | null;
  readMemory(address: number): number;
  writeMemory(address: number, value: number): void;
  setButton(button: WasmBoyHeadlessButton, pressed: boolean): void;
  setJoypadState(state: WasmBoyHeadlessJoypadState): void;
  saveState(): unknown;
  loadState(state: unknown): void;
  reset(): void;
  destroy(): void;
}
