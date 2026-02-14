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

export function runNumberOfFrames(...args: readonly unknown[]): unknown;
export function runWasmExport(name: string, parameters?: readonly number[]): Promise<number>;
export function getWasmMemorySection(start: number, end: number): Promise<Uint8Array>;
export function setWasmMemorySection(start: number, data: Uint8Array | ArrayBuffer): Promise<boolean>;
export function getWasmConstant(name: string): Promise<number>;
export function getPpuSnapshotBuffer(): Promise<ArrayBuffer | null>;
export function parsePpuSnapshotBuffer(buffer: ArrayBuffer): WasmBoyPpuSnapshot | null;
export function getStepsAsString(): string;
export function getCyclesAsString(): string;
export function setMemoryBreakpoint(address: number): void;
export function clearMemoryBreakpoint(address: number): void;
export function clearAllMemoryBreakpoints(): void;
export function getBackgroundMapImage(): Uint8ClampedArray;
export function getTileDataImage(): Uint8ClampedArray;
export function getOamSpritesImage(): Uint8ClampedArray;
export function getCPURegisters(): unknown;
export function getTimerState(): unknown;
export function getLCDState(): unknown;
export function getScanlineParameters(): unknown;
