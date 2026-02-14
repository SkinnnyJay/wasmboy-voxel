export interface WasmBoyMemoryLike {
  getCartridgeInfo(): unknown;
  getCartridgeRam(): Promise<Uint8Array>;
  getWRAM(): Promise<Uint8Array>;
  setWRAM(payload: Uint8Array): Promise<void>;
  getWorkRAM(): Promise<Uint8Array>;
  setWorkRAM(payload: Uint8Array): Promise<void>;
  writeRAM(address: number, payload: Uint8Array): Promise<boolean>;
  getFullMemory(): Promise<Uint8Array>;
  readMemory(address: number, length: number): Promise<Uint8Array>;
}

export const WasmBoyMemory: WasmBoyMemoryLike;
