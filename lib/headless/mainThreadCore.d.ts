export interface MainThreadCoreLoadResult {
  instance: { exports: Record<string, unknown> };
  byteMemory: Uint8Array;
}

export function loadMainThreadWasm(): Promise<MainThreadCoreLoadResult>;
