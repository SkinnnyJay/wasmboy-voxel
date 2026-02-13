const MEMORY_ROWS = [
  { range: '0x8000-0x8010', bytes: '00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00' },
  { range: '0x8010-0x8020', bytes: '00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00' },
];

export function MemoryViewerPanel() {
  return (
    <section className="panel">
      <h3>Memory Viewer</h3>
      {MEMORY_ROWS.map((row) => (
        <pre key={row.range} style={{ margin: '6px 0' }}>
          <strong>{row.range}</strong> {row.bytes}
        </pre>
      ))}
    </section>
  );
}
