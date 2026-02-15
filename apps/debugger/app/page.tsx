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
import { markFrameRendered, measureFrameRenderLatency } from '../lib/performance-marks';
import { createAutoRestartingDebuggerWorker } from '../lib/worker-loader';
import { debuggerSelectors, useDebuggerStore } from '../store/debugger-store';

const MAX_JSONL_PREVIEW_CHARS = 2000;

function buildJsonlPreview(exportedJsonl: string): string {
  if (exportedJsonl.length <= MAX_JSONL_PREVIEW_CHARS) {
    return exportedJsonl;
  }
  const omittedCharacters = exportedJsonl.length - MAX_JSONL_PREVIEW_CHARS;
  return `${exportedJsonl.slice(
    0,
    MAX_JSONL_PREVIEW_CHARS,
  )}\n…[${omittedCharacters} chars omitted from preview]`;
}

export default function HomePage() {
  const contractProbe = useMemo(() => contractsClient.createPlaceholderSnapshotValidation(), []);
  const [workerState, setWorkerState] = useState<string>('idle');
  const [workerTelemetry, setWorkerTelemetry] = useState<{
    crashes: number;
    scheduledRestarts: number;
    completedRestarts: number;
    skippedRestarts: number;
    lastDelayMs: number;
    lastReason: string;
  }>({
    crashes: 0,
    scheduledRestarts: 0,
    completedRestarts: 0,
    skippedRestarts: 0,
    lastDelayMs: 0,
    lastReason: 'none',
  });
  const [jsonlPreview, setJsonlPreview] = useState<string>('');
  const frameId = useDebuggerStore(debuggerSelectors.frameId);
  const frameTimestampMs = useDebuggerStore(debuggerSelectors.frameTimestampMs);
  const snapshots = useDebuggerStore(debuggerSelectors.snapshots);
  const events = useDebuggerStore(debuggerSelectors.eventStream);
  const setSandboxMode = useDebuggerStore((state) => state.setSandboxMode);
  const setRateLimitMs = useDebuggerStore((state) => state.setRateLimitMs);
  const captureSnapshot = useDebuggerStore((state) => state.captureSnapshot);
  const appendInterruptEvent = useDebuggerStore((state) => state.appendInterruptEvent);

  useEffect(() => {
    try {
      const workerController = createAutoRestartingDebuggerWorker(
        new URL('../workers/debugger.worker.ts', import.meta.url),
        {
          maxRestarts: 2,
          restartBaseDelayMs: 250,
          restartMaxDelayMs: 2000,
          onRestart(restartCount, worker) {
            setWorkerState(`restarted-${restartCount}`);
            worker.postMessage({ ping: `hello-debugger-restart-${restartCount}` });
          },
          onTelemetry(event) {
            setWorkerTelemetry((previous) => ({
              crashes: previous.crashes + (event.eventType === 'crash-detected' ? 1 : 0),
              scheduledRestarts:
                previous.scheduledRestarts + (event.eventType === 'restart-scheduled' ? 1 : 0),
              completedRestarts:
                previous.completedRestarts + (event.eventType === 'restart-completed' ? 1 : 0),
              skippedRestarts:
                previous.skippedRestarts + (event.eventType === 'restart-skipped' ? 1 : 0),
              lastDelayMs: event.delayMs,
              lastReason: event.reason,
            }));
          },
        },
      );
      const worker = workerController.getWorker();
      setWorkerState('ready');
      worker.postMessage({ ping: 'hello-debugger' });
      return () => {
        workerController.dispose();
        setWorkerState('terminated');
      };
    } catch {
      setWorkerState('not-supported');
      return undefined;
    }
  }, []);

  useEffect(() => {
    if (frameId <= 0) {
      return;
    }

    markFrameRendered(frameId);
    measureFrameRenderLatency(frameId);
  }, [frameId]);

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
        Worker restart diagnostics: crashes={workerTelemetry.crashes}, scheduled=
        {workerTelemetry.scheduledRestarts}, completed={workerTelemetry.completedRestarts}, skipped=
        {workerTelemetry.skippedRestarts}, lastDelayMs={workerTelemetry.lastDelayMs}, lastReason=
        {workerTelemetry.lastReason}
      </p>
      <p className="muted">
        Frame metadata: #{frameId} @ {frameTimestampMs}
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => {
            captureSnapshot({
              registers: {
                scx: frameId % 256,
                scy: (frameId + 1) % 256,
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
          onClick={() =>
            setJsonlPreview(buildJsonlPreview(exportDebugDataJsonl(events, snapshots)))
          }
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
          <pre style={{ whiteSpace: 'pre-wrap' }}>{jsonlPreview}</pre>
        </section>
      ) : null}
    </div>
  );
}
