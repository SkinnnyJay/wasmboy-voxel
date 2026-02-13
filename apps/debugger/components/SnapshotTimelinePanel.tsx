import { useDebuggerStore } from '../store/debugger-store';

export function SnapshotTimelinePanel() {
  const snapshots = useDebuggerStore((state) => state.snapshots);

  return (
    <section className="panel">
      <h3>Snapshot Timeline</h3>
      <ol>
        {snapshots.length === 0 ? (
          <li className="muted">No snapshots captured yet.</li>
        ) : (
          snapshots.map((snapshot) => (
            <li key={snapshot.frameId}>
              frame {snapshot.frameId} @ {snapshot.timestampMs.toFixed(2)}ms
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
