/**
 * Type declaration for the vendored WasmBoy fork ESM build (./dist/wasmboy.wasm.esm.js).
 */
declare module './dist/wasmboy.wasm.esm.js' {
  export interface WasmBoyConfig {
    headless?: boolean;
    mainThread?: boolean;
    disablePauseOnHidden?: boolean;
    isAudioEnabled?: boolean;
    enableAudioDebugging?: boolean;
    gameboyFrameRate?: number;
    frameSkip?: number;
    enableBootROMIfAvailable?: boolean;
    isGbcEnabled?: boolean;
    isGbcColorizationEnabled?: boolean;
    gbcColorizationPalette?: Uint8Array | null;
    audioBatchProcessing?: boolean;
    graphicsBatchProcessing?: boolean;
    timersBatchProcessing?: boolean;
    graphicsDisableScanlineRendering?: boolean;
    audioAccumulateSamples?: boolean;
    tileRendering?: boolean;
    tileCaching?: boolean;
    maxNumberOfAutoSaveStates?: number;
    updateGraphicsCallback?: ((imageDataArray: Uint8ClampedArray) => void) | null;
    updateAudioCallback?: ((audioBuffer: Float32Array) => void) | null;
    saveStateCallback?: ((state: unknown) => void) | null;
    breakpointCallback?: ((event: unknown) => void) | null;
    onReady?: (() => void) | null;
    onPlay?: (() => void) | null;
    onPause?: (() => void) | null;
    onLoadedAndStarted?: (() => void) | null;
  }

  export interface WasmBoyJoypadState {
    UP: boolean;
    RIGHT: boolean;
    DOWN: boolean;
    LEFT: boolean;
    A: boolean;
    B: boolean;
    SELECT: boolean;
    START: boolean;
  }

  export interface WasmBoyApi {
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
    _setWasmMemorySection(start: number, data: Uint8Array | ArrayBuffer): Promise<boolean>;
    setWasmMemorySection(start: number, data: Uint8Array | ArrayBuffer): Promise<boolean>;
    _getWasmConstant(name: string): Promise<number>;
    _runWasmExport(name: string, parameters?: readonly number[]): Promise<number>;
    _getCartridgeRam(): Promise<Uint8Array>;
    getWRAM(): Promise<Uint8Array>;
    setWRAM(payload: Uint8Array): Promise<void>;
    getWorkRAM(): Promise<Uint8Array>;
    setWorkRAM(payload: Uint8Array): Promise<void>;
    writeRAM(address: number, payload: Uint8Array): Promise<boolean>;
    getFullMemory(): Promise<Uint8Array>;
    readMemory(address: number, length: number): Promise<Uint8Array>;
  }

  export const WasmBoy: WasmBoyApi;
}

/**
 * Headless runner (main-thread WASM, no Workers).
 * Use for testing, CI, and deterministic frame stepping.
 */
declare module './dist/wasmboy.headless.esm.js' {
  export interface WasmBoyHeadlessCoreLoadResult {
    instance: { exports: Record<string, unknown> };
    byteMemory: Uint8Array;
  }

  export type WasmBoyHeadlessButton = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT' | 'A' | 'B' | 'SELECT' | 'START';

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

  export function loadMainThreadWasm(): Promise<WasmBoyHeadlessCoreLoadResult>;

  export class WasmBoyHeadless {
    loadROM(rom: Uint8Array, options?: { enableBootRom?: boolean; isGbcEnabled?: boolean }): Promise<void>;
    stepFrame(): void;
    stepFrames(count: number): void;
    getFrameBuffer(): Uint8ClampedArray;
    getPpuSnapshot(): WasmBoyHeadlessPpuSnapshot | null;
    readMemory(address: number): number;
    writeMemory(address: number, value: number): void;
    setButton(button: WasmBoyHeadlessButton, pressed: boolean): void;
    setJoypadState(state: {
      UP?: boolean;
      RIGHT?: boolean;
      DOWN?: boolean;
      LEFT?: boolean;
      A?: boolean;
      B?: boolean;
      SELECT?: boolean;
      START?: boolean;
    }): void;
    saveState(): unknown;
    loadState(state: unknown): void;
    reset(): void;
    destroy(): void;
  }
}
