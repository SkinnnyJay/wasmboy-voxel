'use client';

import { useEffect, useMemo, useState } from 'react';
import { EmulatorViewPanel } from '../components/EmulatorViewPanel';
import { EventLogPanel } from '../components/EventLogPanel';
import { MemoryViewerPanel } from '../components/MemoryViewerPanel';
import { RegistersPanel } from '../components/RegistersPanel';
import { RomLoaderPanel } from '../components/RomLoaderPanel';
import { SnapshotTimelinePanel } from '../components/SnapshotTimelinePanel';
import { contractsClient } from '../lib/contracts-client';
import { createDebuggerWorker } from '../lib/worker-loader';

export default function HomePage() {
  const contractProbe = useMemo(() => contractsClient.createPlaceholderSnapshotValidation(), []);
  const [workerState, setWorkerState] = useState<string>('idle');

  useEffect(() => {
    try {
      const worker = createDebuggerWorker(
        new URL('../workers/debugger.worker.ts', import.meta.url),
      );
      setWorkerState('ready');
      worker.postMessage({ ping: 'hello-debugger' });
      return () => {
        worker.terminate();
        setWorkerState('terminated');
      };
    } catch {
      setWorkerState('not-supported');
      return undefined;
    }
  }, []);

  return (
    <div>
      <h2>WasmBoy Debugger (Next.js)</h2>
      <p className="muted">
        App-router shell with contract-aware panels for ROM loading, emulator view, memory, registers,
        snapshots, and logs.
      </p>
      <p className="muted">
        Contract gate probe: {contractProbe.success ? 'valid placeholder payload' : 'invalid payload'}
      </p>
      <p className="muted">Worker strategy: {workerState}</p>

      <section className="panelGrid">
        <RomLoaderPanel />
        <EmulatorViewPanel />
        <RegistersPanel />
        <MemoryViewerPanel />
        <SnapshotTimelinePanel />
        <EventLogPanel />
      </section>
    </div>
  );
}
