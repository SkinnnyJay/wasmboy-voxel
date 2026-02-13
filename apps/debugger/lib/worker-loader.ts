export function createDebuggerWorker(workerUrl: URL): Worker {
  return new Worker(workerUrl, {
    type: 'module',
    name: 'wasmboy-debugger-worker',
  });
}
