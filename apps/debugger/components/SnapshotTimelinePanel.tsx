const SNAPSHOTS = [
  { frameId: 0, timestampMs: 0 },
  { frameId: 1, timestampMs: 16.67 },
  { frameId: 2, timestampMs: 33.34 },
];

export function SnapshotTimelinePanel() {
  return (
    <section className="panel">
      <h3>Snapshot Timeline</h3>
      <ol>
        {SNAPSHOTS.map((snapshot) => (
          <li key={snapshot.frameId}>
            frame {snapshot.frameId} @ {snapshot.timestampMs.toFixed(2)}ms
          </li>
        ))}
      </ol>
    </section>
  );
}
