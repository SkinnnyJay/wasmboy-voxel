import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EventLogPanel } from '../components/EventLogPanel';
import * as debuggerStoreModule from '../store/debugger-store';

const LARGE_EVENT_LOG_COUNT = 1200;

function createEventLogEntry(index: number) {
  return {
    type: 'snapshot' as const,
    frameId: index + 1,
    timestampMs: 1000 + index,
    payload: {
      index,
    },
  };
}

function createMockStoreState(
  events: Array<{
    type: 'snapshot';
    frameId: number;
    timestampMs: number;
    payload: { index: number };
  }>,
) {
  return {
    frameId: events.length,
    timestampMs: events.length > 0 ? (events[events.length - 1]?.timestampMs ?? 0) : 0,
    rateLimitMs: 16,
    lastCaptureAtMs: 0,
    sandboxMode: false,
    snapshots: [],
    events,
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

describe('EventLogPanel', () => {
  it('renders large event logs without falling back to empty state', () => {
    const largeEventLog = Array.from({ length: LARGE_EVENT_LOG_COUNT }, (_, index) =>
      createEventLogEntry(index),
    );
    const useDebuggerStoreSpy = vi
      .spyOn(debuggerStoreModule, 'useDebuggerStore')
      .mockImplementation((selector) => selector(createMockStoreState(largeEventLog)));

    let html = '';
    try {
      html = renderToStaticMarkup(<EventLogPanel />);
    } finally {
      useDebuggerStoreSpy.mockRestore();
    }

    expect(html).toContain('[snapshot] frame 1 @ 1000ms');
    expect(html).toContain(`[snapshot] frame ${LARGE_EVENT_LOG_COUNT} @ ${2199}ms`);
    expect(html).not.toContain('No events yet.');
  });
});
