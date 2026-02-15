export interface MainThreadWasmLoadResult {
  instance: { exports: Record<string, unknown> };
  byteMemory: Uint8Array;
}

export function loadMainThreadWasm(): Promise<MainThreadWasmLoadResult>;
