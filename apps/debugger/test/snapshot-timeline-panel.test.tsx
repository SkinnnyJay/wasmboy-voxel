import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  buildSnapshotTimelinePage,
  SnapshotTimelinePanel,
} from '../components/SnapshotTimelinePanel';
import * as debuggerStoreModule from '../store/debugger-store';

const LARGE_TIMELINE_COUNT = 5000;
const RENDER_LIMIT = 200;

function createMockStoreState(snapshotCount: number) {
  const snapshots = Array.from({ length: snapshotCount }, (_, index) => ({
    frameId: index + 1,
    timestampMs: index + 0.25,
    registers: {
      scx: 1,
      scy: 2,
      wx: 3,
      wy: 4,
      lcdc: 5,
      bgp: 6,
      obp0: 7,
      obp1: 8,
    },
    checksums: {
      tileDataHash: 'tile',
      bgTileMapHash: 'bg',
      windowTileMapHash: 'window',
      oamDataHash: 'oam',
    },
  }));

  return {
    frameId: snapshotCount,
    timestampMs: snapshotCount,
    rateLimitMs: 16,
    lastCaptureAtMs: 0,
    sandboxMode: false,
    snapshots,
    events: [],
    setRateLimitMs() {},
    setSandboxMode() {},
    appendInputEvent() {},
    appendInterruptEvent() {},
    captureSnapshot() {
      return false;
    },
    clearEvents() {},
  };
}

describe('SnapshotTimelinePanel', () => {
  it('buildSnapshotTimelinePage computes newest page window for oversized timelines', () => {
    const snapshots = createMockStoreState(LARGE_TIMELINE_COUNT).snapshots;
    const page = buildSnapshotTimelinePage(snapshots, 0);

    expect(page.pageSnapshots.length).toBe(RENDER_LIMIT);
    expect(page.pageSnapshots[0]?.frameId).toBe(4801);
    expect(page.pageSnapshots.at(-1)?.frameId).toBe(5000);
    expect(page.pageNumber).toBe(25);
    expect(page.totalPages).toBe(25);
    expect(page.olderOmittedCount).toBe(4800);
    expect(page.newerOmittedCount).toBe(0);
    expect(page.hasOlderPages).toBe(true);
    expect(page.hasNewerPages).toBe(false);
  });

  it('buildSnapshotTimelinePage clamps page indexes and exposes oldest page details', () => {
    const snapshots = createMockStoreState(LARGE_TIMELINE_COUNT).snapshots;
    const page = buildSnapshotTimelinePage(snapshots, 999);

    expect(page.pageSnapshots.length).toBe(RENDER_LIMIT);
    expect(page.pageSnapshots[0]?.frameId).toBe(1);
    expect(page.pageSnapshots.at(-1)?.frameId).toBe(200);
    expect(page.pageNumber).toBe(1);
    expect(page.totalPages).toBe(25);
    expect(page.olderOmittedCount).toBe(0);
    expect(page.newerOmittedCount).toBe(4800);
    expect(page.hasOlderPages).toBe(false);
    expect(page.hasNewerPages).toBe(true);
  });

  it('renders only the latest timeline window for oversized snapshot arrays', () => {
    const useDebuggerStoreSpy = vi
      .spyOn(debuggerStoreModule, 'useDebuggerStore')
      .mockImplementation(selector => selector(createMockStoreState(LARGE_TIMELINE_COUNT)));

    let html = '';
    try {
      html = renderToStaticMarkup(<SnapshotTimelinePanel />);
    } finally {
      useDebuggerStoreSpy.mockRestore();
    }

    expect(html).toContain(`Showing ${RENDER_LIMIT} snapshots on page 25 of 25`);
    expect(html).toContain('Oldest');
    expect(html).toContain('Older');
    expect(html).toContain('Newer');
    expect(html).toContain('Newest');
    expect(html).toContain('frame 5000 @ 4999.25ms');
    expect(html).toContain('frame 4801 @ 4800.25ms');
    expect(html).not.toContain('frame 1 @ 0.25ms');
  });
});
