import React, { useEffect, useMemo, useState } from 'react';
import { useDebuggerStore } from '../store/debugger-store';

const MAX_TIMELINE_RENDER_ITEMS = 200;

interface TimelineSnapshotEntry {
  frameId: number;
  timestampMs: number;
}

interface SnapshotTimelinePage {
  pageFromNewest: number;
  pageNumber: number;
  totalPages: number;
  pageSnapshots: TimelineSnapshotEntry[];
  olderOmittedCount: number;
  newerOmittedCount: number;
  hasOlderPages: boolean;
  hasNewerPages: boolean;
}

export function buildSnapshotTimelinePage(
  snapshots: TimelineSnapshotEntry[],
  requestedPageFromNewest: number,
  pageSize = MAX_TIMELINE_RENDER_ITEMS,
): SnapshotTimelinePage {
  const effectivePageSize =
    Number.isInteger(pageSize) && pageSize > 0 ? pageSize : MAX_TIMELINE_RENDER_ITEMS;
  const totalPages = Math.max(1, Math.ceil(snapshots.length / effectivePageSize));
  const clampedPageFromNewest = Math.min(Math.max(0, requestedPageFromNewest), totalPages - 1);
  const endExclusive = Math.max(0, snapshots.length - clampedPageFromNewest * effectivePageSize);
  const start = Math.max(0, endExclusive - effectivePageSize);
  const pageSnapshots = snapshots.slice(start, endExclusive);

  return {
    pageFromNewest: clampedPageFromNewest,
    pageNumber: totalPages - clampedPageFromNewest,
    totalPages,
    pageSnapshots,
    olderOmittedCount: start,
    newerOmittedCount: Math.max(0, snapshots.length - endExclusive),
    hasOlderPages: clampedPageFromNewest < totalPages - 1,
    hasNewerPages: clampedPageFromNewest > 0,
  };
}

export function SnapshotTimelinePanel() {
  const snapshots = useDebuggerStore((state) => state.snapshots);
  const [pageFromNewest, setPageFromNewest] = useState(0);

  const timelinePage = useMemo(
    () => buildSnapshotTimelinePage(snapshots, pageFromNewest),
    [snapshots, pageFromNewest],
  );

  useEffect(() => {
    if (timelinePage.pageFromNewest !== pageFromNewest) {
      setPageFromNewest(timelinePage.pageFromNewest);
    }
  }, [pageFromNewest, timelinePage.pageFromNewest]);

  return (
    <section className="panel">
      <h3>Snapshot Timeline</h3>
      {snapshots.length > 0 ? (
        <p className="muted">
          Showing {timelinePage.pageSnapshots.length} snapshots on page {timelinePage.pageNumber} of{' '}
          {timelinePage.totalPages}.
        </p>
      ) : null}
      {timelinePage.olderOmittedCount > 0 || timelinePage.newerOmittedCount > 0 ? (
        <p className="muted">
          {timelinePage.olderOmittedCount} older snapshots hidden, {timelinePage.newerOmittedCount}{' '}
          newer snapshots hidden.
        </p>
      ) : null}
      {timelinePage.totalPages > 1 ? (
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <button
            type="button"
            disabled={!timelinePage.hasOlderPages}
            onClick={() => setPageFromNewest(timelinePage.totalPages - 1)}
          >
            Oldest
          </button>
          <button
            type="button"
            disabled={!timelinePage.hasOlderPages}
            onClick={() => setPageFromNewest(pageFromNewest + 1)}
          >
            Older
          </button>
          <button
            type="button"
            disabled={!timelinePage.hasNewerPages}
            onClick={() => setPageFromNewest(pageFromNewest - 1)}
          >
            Newer
          </button>
          <button
            type="button"
            disabled={!timelinePage.hasNewerPages}
            onClick={() => setPageFromNewest(0)}
          >
            Newest
          </button>
        </div>
      ) : null}
      <ol>
        {timelinePage.pageSnapshots.length === 0 ? (
          <li className="muted">No snapshots captured yet.</li>
        ) : (
          timelinePage.pageSnapshots.map((snapshot) => (
            <li key={snapshot.frameId}>
              frame {snapshot.frameId} @ {snapshot.timestampMs.toFixed(2)}ms
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
