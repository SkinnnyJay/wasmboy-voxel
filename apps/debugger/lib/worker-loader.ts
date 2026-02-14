export function createDebuggerWorker(workerUrl: URL): Worker {
  return new Worker(workerUrl, {
    type: 'module',
    name: 'wasmboy-debugger-worker',
  });
}

interface AutoRestartWorkerOptions {
  maxRestarts?: number;
  onRestart?: (restartCount: number, worker: Worker) => void;
}

interface AutoRestartWorkerHandle {
  getWorker: () => Worker;
  dispose: () => void;
}

function attachCrashHandlers(worker: Worker, onCrash: () => void): () => void {
  worker.addEventListener('error', onCrash);
  worker.addEventListener('messageerror', onCrash);

  return () => {
    worker.removeEventListener('error', onCrash);
    worker.removeEventListener('messageerror', onCrash);
  };
}

export function createAutoRestartingDebuggerWorker(
  workerUrl: URL,
  options: AutoRestartWorkerOptions = {},
): AutoRestartWorkerHandle {
  const maxRestarts = options.maxRestarts ?? 1;
  let restartCount = 0;
  let disposed = false;
  let activeWorker = createDebuggerWorker(workerUrl);
  let detachCrashHandlers = () => {};

  const onCrash = () => {
    if (disposed || restartCount >= maxRestarts) {
      return;
    }

    restartCount += 1;
    detachCrashHandlers();
    activeWorker.terminate();
    activeWorker = createDebuggerWorker(workerUrl);
    detachCrashHandlers = attachCrashHandlers(activeWorker, onCrash);
    options.onRestart?.(restartCount, activeWorker);
  };

  detachCrashHandlers = attachCrashHandlers(activeWorker, onCrash);

  return {
    getWorker() {
      return activeWorker;
    },
    dispose() {
      disposed = true;
      detachCrashHandlers();
      activeWorker.terminate();
    },
  };
}
