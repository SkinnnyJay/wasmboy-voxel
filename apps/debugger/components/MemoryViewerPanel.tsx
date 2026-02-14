import { useDebuggerStore } from '../store/debugger-store';

const MEMORY_ROWS = [
  { range: '0x8000-0x8010', bytes: '00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00' },
  { range: '0x8010-0x8020', bytes: '00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00' },
];

export function MemoryViewerPanel() {
  const latestChecksums = useDebuggerStore((state) => {
    if (state.snapshots.length === 0) return null;
    const latestSnapshot = state.snapshots[state.snapshots.length - 1];
    return latestSnapshot ? latestSnapshot.checksums : null;
  });

  return (
    <section className="panel">
      <h3>Memory Viewer</h3>
      {MEMORY_ROWS.map((row) => (
        <pre key={row.range} style={{ margin: '6px 0' }}>
          <strong>{row.range}</strong> {row.bytes}
        </pre>
      ))}
      {latestChecksums ? (
        <p className="muted">tile checksum: {latestChecksums.tileDataHash}</p>
      ) : (
        <p className="muted">No memory snapshot checksum available yet.</p>
      )}
    </section>
  );
}
