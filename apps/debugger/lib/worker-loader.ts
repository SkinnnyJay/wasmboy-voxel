export function createDebuggerWorker(workerUrl: URL): Worker {
  return new Worker(workerUrl, {
    type: 'module',
    name: 'wasmboy-debugger-worker',
  });
}

type WorkerCrashReason = 'error' | 'messageerror';

type WorkerTelemetryEventType =
  | 'crash-detected'
  | 'restart-scheduled'
  | 'restart-started'
  | 'restart-completed'
  | 'restart-skipped'
  | 'disposed';

export interface WorkerRestartTelemetry {
  eventType: WorkerTelemetryEventType;
  reason: WorkerCrashReason | 'disposed' | 'budget-exhausted' | 'already-scheduled' | 'unknown';
  restartCount: number;
  maxRestarts: number;
  delayMs: number;
  timestampMs: number;
}

interface AutoRestartWorkerOptions {
  maxRestarts?: number;
  onRestart?: (restartCount: number, worker: Worker) => void;
  onTelemetry?: (event: WorkerRestartTelemetry) => void;
  restartBaseDelayMs?: number;
  restartMaxDelayMs?: number;
  now?: () => number;
  scheduleRestart?: (delayMs: number, callback: () => void) => () => void;
}

interface AutoRestartWorkerHandle {
  getWorker: () => Worker;
  dispose: () => void;
}

function attachCrashHandlers(
  worker: Worker,
  onCrash: (reason: WorkerCrashReason) => void,
): () => void {
  const onError = () => onCrash('error');
  const onMessageError = () => onCrash('messageerror');
  worker.addEventListener('error', onError);
  worker.addEventListener('messageerror', onMessageError);

  return () => {
    worker.removeEventListener('error', onError);
    worker.removeEventListener('messageerror', onMessageError);
  };
}

export function createAutoRestartingDebuggerWorker(
  workerUrl: URL,
  options: AutoRestartWorkerOptions = {},
): AutoRestartWorkerHandle {
  const maxRestarts = options.maxRestarts ?? 1;
  const restartBaseDelayMs = Math.max(0, options.restartBaseDelayMs ?? 200);
  const restartMaxDelayMs = Math.max(restartBaseDelayMs, options.restartMaxDelayMs ?? 2000);
  const now = options.now ?? (() => Date.now());
  const scheduleRestart =
    options.scheduleRestart ??
    ((delayMs: number, callback: () => void): (() => void) => {
      const timeoutId = setTimeout(callback, delayMs);
      return () => clearTimeout(timeoutId);
    });
  let restartCount = 0;
  let disposed = false;
  let activeWorker = createDebuggerWorker(workerUrl);
  let detachCrashHandlers = () => {};
  let cancelScheduledRestart = () => {};
  let hasScheduledRestart = false;

  const emitTelemetry = (
    eventType: WorkerTelemetryEventType,
    reason: WorkerRestartTelemetry['reason'],
    delayMs: number,
  ): void => {
    options.onTelemetry?.({
      eventType,
      reason,
      restartCount,
      maxRestarts,
      delayMs,
      timestampMs: now(),
    });
  };

  const computeRestartDelayMs = (nextRestartCount: number): number => {
    if (nextRestartCount <= 0) {
      return 0;
    }
    const exponentialDelay = restartBaseDelayMs * Math.pow(2, nextRestartCount - 1);
    return Math.min(restartMaxDelayMs, Math.floor(exponentialDelay));
  };

  const onCrash = (reason: WorkerCrashReason) => {
    emitTelemetry('crash-detected', reason, 0);

    if (disposed || restartCount >= maxRestarts) {
      emitTelemetry('restart-skipped', disposed ? 'disposed' : 'budget-exhausted', 0);
      return;
    }

    if (hasScheduledRestart) {
      emitTelemetry('restart-skipped', 'already-scheduled', 0);
      return;
    }

    const nextRestartCount = restartCount + 1;
    const delayMs = computeRestartDelayMs(nextRestartCount);
    hasScheduledRestart = true;
    emitTelemetry('restart-scheduled', reason, delayMs);
    cancelScheduledRestart = scheduleRestart(delayMs, () => {
      if (disposed) {
        hasScheduledRestart = false;
        emitTelemetry('restart-skipped', 'disposed', delayMs);
        return;
      }

      restartCount = nextRestartCount;
      emitTelemetry('restart-started', reason, delayMs);
      detachCrashHandlers();
      activeWorker.terminate();
      activeWorker = createDebuggerWorker(workerUrl);
      detachCrashHandlers = attachCrashHandlers(activeWorker, onCrash);
      hasScheduledRestart = false;
      options.onRestart?.(restartCount, activeWorker);
      emitTelemetry('restart-completed', reason, delayMs);
    });
  };

  detachCrashHandlers = attachCrashHandlers(activeWorker, onCrash);

  return {
    getWorker() {
      return activeWorker;
    },
    dispose() {
      disposed = true;
      cancelScheduledRestart();
      hasScheduledRestart = false;
      detachCrashHandlers();
      activeWorker.terminate();
      emitTelemetry('disposed', 'disposed', 0);
    },
  };
}
