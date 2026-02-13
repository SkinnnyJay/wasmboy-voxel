'use client';

import { useEffect, useMemo, useState } from 'react';
import { EmulatorViewPanel } from '../components/EmulatorViewPanel';
import { EventLogPanel } from '../components/EventLogPanel';
import { MemoryViewerPanel } from '../components/MemoryViewerPanel';
import { RegistersPanel } from '../components/RegistersPanel';
import { RomLoaderPanel } from '../components/RomLoaderPanel';
import { SnapshotTimelinePanel } from '../components/SnapshotTimelinePanel';
import { contractsClient } from '../lib/contracts-client';
import { exportDebugDataJsonl } from '../lib/export-jsonl';
import { createDebuggerWorker } from '../lib/worker-loader';
import { debuggerSelectors, useDebuggerStore } from '../store/debugger-store';

export default function HomePage() {
  const contractProbe = useMemo(() => contractsClient.createPlaceholderSnapshotValidation(), []);
  const [workerState, setWorkerState] = useState<string>('idle');
  const [jsonlPreview, setJsonlPreview] = useState<string>('');
  const frameMetadata = useDebuggerStore(debuggerSelectors.frameMetadata);
  const snapshots = useDebuggerStore(debuggerSelectors.snapshots);
  const events = useDebuggerStore(debuggerSelectors.eventStream);
  const setSandboxMode = useDebuggerStore((state) => state.setSandboxMode);
  const setRateLimitMs = useDebuggerStore((state) => state.setRateLimitMs);
  const captureSnapshot = useDebuggerStore((state) => state.captureSnapshot);
  const appendInterruptEvent = useDebuggerStore((state) => state.appendInterruptEvent);

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
        App-router shell with contract-aware panels for ROM loading, emulator view, memory,
        registers, snapshots, and logs.
      </p>
      <p className="muted">
        Contract gate probe:{' '}
        {contractProbe.success ? 'valid placeholder payload' : 'invalid payload'}
      </p>
      <p className="muted">Worker strategy: {workerState}</p>
      <p className="muted">
        Frame metadata: #{frameMetadata.frameId} @ {frameMetadata.timestampMs}
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => {
            captureSnapshot({
              registers: {
                scx: frameMetadata.frameId % 256,
                scy: (frameMetadata.frameId + 1) % 256,
                wx: 7,
                wy: 0,
                lcdc: 0x91,
                bgp: 0xe4,
                obp0: 0xd2,
                obp1: 0xf1,
              },
            });
          }}
        >
          Capture snapshot
        </button>
        <button
          type="button"
          onClick={() => appendInterruptEvent({ source: 'ui', kind: 'VBLANK' })}
        >
          Simulate interrupt
        </button>
        <button type="button" onClick={() => setSandboxMode(true)}>
          Enable sandbox mode
        </button>
        <button type="button" onClick={() => setSandboxMode(false)}>
          Disable sandbox mode
        </button>
        <button type="button" onClick={() => setRateLimitMs(50)}>
          Rate limit 50ms
        </button>
        <button
          type="button"
          onClick={() => setJsonlPreview(exportDebugDataJsonl(events, snapshots))}
        >
          Export JSONL
        </button>
      </div>

      <section className="panelGrid">
        <RomLoaderPanel />
        <EmulatorViewPanel />
        <RegistersPanel />
        <MemoryViewerPanel />
        <SnapshotTimelinePanel />
        <EventLogPanel />
      </section>
      {jsonlPreview.length > 0 ? (
        <section className="panel" style={{ marginTop: 12 }}>
          <h3>JSONL Export Preview</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{jsonlPreview.slice(0, 2000)}</pre>
        </section>
      ) : null}
    </div>
  );
}
