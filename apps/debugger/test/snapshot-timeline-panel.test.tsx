import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SnapshotTimelinePanel } from '../components/SnapshotTimelinePanel';
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

    expect(html).toContain(`Showing latest ${RENDER_LIMIT} snapshots`);
    expect(html).toContain('frame 5000 @ 4999.25ms');
    expect(html).toContain('frame 4801 @ 4800.25ms');
    expect(html).not.toContain('frame 1 @ 0.25ms');
  });
});
