export interface WasmBoyLibLike {
  paused: boolean;
  ready: boolean;
  loadedAndStarted: boolean;
  config(options?: unknown, canvasElement?: HTMLCanvasElement): Promise<void>;
  getCoreType(): unknown;
  getConfig(): unknown;
  setCanvas(canvasElement: HTMLCanvasElement): Promise<void>;
  getCanvas(): HTMLCanvasElement | undefined;
  addBootROM(type: string, file: ArrayBuffer): Promise<void>;
  getBootROMs(): Promise<unknown[]>;
  loadROM(rom: ArrayBuffer | Uint8Array): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  reset(options?: unknown): Promise<void>;
  whenReady(): Promise<void>;
  whenPlaying(): Promise<void>;
  whenPaused(): Promise<void>;
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
}

export const WasmBoyLib: WasmBoyLibLike;
