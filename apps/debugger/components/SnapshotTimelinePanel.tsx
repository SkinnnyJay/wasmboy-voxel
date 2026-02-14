import React from 'react';
import { useDebuggerStore } from '../store/debugger-store';

const MAX_TIMELINE_RENDER_ITEMS = 200;

export function SnapshotTimelinePanel() {
  const snapshots = useDebuggerStore(state => state.snapshots);
  const timelineSnapshots = snapshots.slice(-MAX_TIMELINE_RENDER_ITEMS);
  const truncatedSnapshotsCount = Math.max(0, snapshots.length - timelineSnapshots.length);

  return (
    <section className="panel">
      <h3>Snapshot Timeline</h3>
      {truncatedSnapshotsCount > 0 ? (
        <p className="muted">
          Showing latest {timelineSnapshots.length} snapshots ({truncatedSnapshotsCount} older
          entries omitted).
        </p>
      ) : null}
      <ol>
        {timelineSnapshots.length === 0 ? (
          <li className="muted">No snapshots captured yet.</li>
        ) : (
          timelineSnapshots.map(snapshot => (
            <li key={snapshot.frameId}>
              frame {snapshot.frameId} @ {snapshot.timestampMs.toFixed(2)}ms
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
