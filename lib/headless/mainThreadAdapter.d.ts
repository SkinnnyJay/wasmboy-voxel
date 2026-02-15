export interface MainThreadWorkerLike {
  postMessage(message: unknown, transferables?: readonly unknown[], timeoutMs?: number): Promise<unknown>;
  postMessageIgnoreResponse(message: unknown): void;
  addMessageListener(callback: (message: unknown) => void): string;
  removeMessageListener(listenerId?: string): void;
}

export interface MainThreadWorkerState {
  wasmInstance: { exports: Record<string, unknown> };
  wasmByteMemory: Uint8Array;
  options?: unknown;
  paused: boolean;
  frameLocation: number;
  frameSize: number;
  speed?: number;
}

export interface MainThreadWorkerCallbacks {
  onFrame?: (imageData: Uint8ClampedArray) => void;
}

export function createMainThreadWorker(
  wasm: { instance: { exports: Record<string, unknown> }; byteMemory: Uint8Array },
  callbacks?: MainThreadWorkerCallbacks,
): { worker: MainThreadWorkerLike; libState: MainThreadWorkerState };
