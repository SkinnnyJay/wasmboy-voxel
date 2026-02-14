import { describe, expect, it } from 'vitest';
import { createAutoRestartingDebuggerWorker, createDebuggerWorker } from '../lib/worker-loader';

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

class RestartableMockWorker {
  static instances: RestartableMockWorker[] = [];

  static terminateCount = 0;

  static optionsHistory: WorkerOptions[] = [];

  private readonly listeners = {
    error: new Set<(event: Event) => void>(),
    messageerror: new Set<(event: Event) => void>(),
  };

  constructor(_workerUrl: URL, options: WorkerOptions) {
    RestartableMockWorker.instances.push(this);
    RestartableMockWorker.optionsHistory.push(options);
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (type !== 'error' && type !== 'messageerror') {
      return;
    }
    if (typeof listener === 'function') {
      this.listeners[type].add(listener);
      return;
    }
    this.listeners[type].add(event => listener.handleEvent(event));
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (type !== 'error' && type !== 'messageerror') {
      return;
    }
    if (typeof listener === 'function') {
      this.listeners[type].delete(listener);
    }
  }

  postMessage(): void {}

  terminate(): void {
    RestartableMockWorker.terminateCount += 1;
  }

  trigger(type: 'error' | 'messageerror'): void {
    this.listeners[type].forEach(listener => listener(new Event(type)));
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

  it('auto-restarts workers after crash events until restart budget is exhausted', () => {
    const originalWorker = globalThis.Worker;
    RestartableMockWorker.instances = [];
    RestartableMockWorker.optionsHistory = [];
    RestartableMockWorker.terminateCount = 0;
    const restartCounts: number[] = [];

    Object.defineProperty(globalThis, 'Worker', {
      configurable: true,
      writable: true,
      value: RestartableMockWorker,
    });

    try {
      const workerHandle = createAutoRestartingDebuggerWorker(
        new URL('file:///debugger.worker.js'),
        {
          maxRestarts: 2,
          onRestart(restartCount) {
            restartCounts.push(restartCount);
          },
        },
      );

      expect(RestartableMockWorker.instances.length).toBe(1);
      RestartableMockWorker.instances[0]?.trigger('error');
      expect(RestartableMockWorker.instances.length).toBe(2);
      expect(restartCounts).toEqual([1]);

      RestartableMockWorker.instances[1]?.trigger('messageerror');
      expect(RestartableMockWorker.instances.length).toBe(3);
      expect(restartCounts).toEqual([1, 2]);

      RestartableMockWorker.instances[2]?.trigger('error');
      expect(RestartableMockWorker.instances.length).toBe(3);

      workerHandle.dispose();
      const terminateCountAfterDispose = RestartableMockWorker.terminateCount;
      RestartableMockWorker.instances[2]?.trigger('error');
      expect(RestartableMockWorker.instances.length).toBe(3);
      expect(RestartableMockWorker.terminateCount).toBe(terminateCountAfterDispose);
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
  });
});
