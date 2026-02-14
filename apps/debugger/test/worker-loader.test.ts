import { describe, expect, it } from 'vitest';
import { createDebuggerWorker } from '../lib/worker-loader';

const INIT_DISPOSE_CYCLES = 250;

class MockWorker {
  static activeInstances = new Set<MockWorker>();

  static optionsHistory: WorkerOptions[] = [];

  public readonly onerror: Worker['onerror'] = null;

  public readonly onmessage: Worker['onmessage'] = null;

  public readonly onmessageerror: Worker['onmessageerror'] = null;

  constructor(_workerUrl: URL, options: WorkerOptions) {
    MockWorker.activeInstances.add(this);
    MockWorker.optionsHistory.push(options);
  }

  postMessage(): void {}

  terminate(): void {
    MockWorker.activeInstances.delete(this);
  }
}

describe('worker loader', () => {
  it('repeated init/dispose cycles do not accumulate active workers', () => {
    const originalWorker = globalThis.Worker;
    MockWorker.activeInstances.clear();
    MockWorker.optionsHistory = [];

    Object.defineProperty(globalThis, 'Worker', {
      configurable: true,
      writable: true,
      value: MockWorker,
    });

    try {
      for (let index = 0; index < INIT_DISPOSE_CYCLES; index += 1) {
        const worker = createDebuggerWorker(new URL('file:///debugger.worker.js'));
        worker.terminate();
      }
    } finally {
      if (originalWorker) {
        Object.defineProperty(globalThis, 'Worker', {
          configurable: true,
          writable: true,
          value: originalWorker,
        });
      } else {
        Object.defineProperty(globalThis, 'Worker', {
          configurable: true,
          writable: true,
          value: undefined,
        });
      }
    }

    expect(MockWorker.activeInstances.size).toBe(0);
    expect(MockWorker.optionsHistory.length).toBe(INIT_DISPOSE_CYCLES);
    MockWorker.optionsHistory.forEach(workerOptions => {
      expect(workerOptions.type).toBe('module');
      expect(workerOptions.name).toBe('wasmboy-debugger-worker');
    });
  });
});
