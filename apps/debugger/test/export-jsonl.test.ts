import { describe, expect, it } from 'vitest';
import { exportDebugDataJsonl } from '../lib/export-jsonl';
import { DebuggerEvent, SnapshotState } from '../store/debugger-store';

function createEvent(frameId: number): DebuggerEvent {
  return {
    type: 'snapshot',
    frameId,
    timestampMs: frameId,
    payload: { frameId },
  };
}

function createSnapshot(frameId: number): SnapshotState {
  return {
    frameId,
    timestampMs: frameId,
    registers: {
      scx: frameId & 0xff,
      scy: frameId & 0xff,
      wx: 7,
      wy: 0,
      lcdc: 0x91,
      bgp: 0xe4,
      obp0: 0xd2,
      obp1: 0xf1,
    },
    checksums: {
      tileDataHash: `tile-${frameId}`,
      bgTileMapHash: `bg-${frameId}`,
      windowTileMapHash: `window-${frameId}`,
      oamDataHash: `oam-${frameId}`,
    },
  };
}

describe('exportDebugDataJsonl', () => {
  it('caps exported event/snapshot windows and emits omitted metadata', () => {
    const events = Array.from({ length: 600 }, (_, index) => createEvent(index + 1));
    const snapshots = Array.from({ length: 350 }, (_, index) => createSnapshot(index + 1));

    const jsonl = exportDebugDataJsonl(events, snapshots);
    const lines = jsonl.split('\n');
    const meta = JSON.parse(lines[0] ?? '{}');
    const firstEvent = JSON.parse(lines[1] ?? '{}');
    const firstSnapshot = JSON.parse(lines[1 + 500] ?? '{}');

    expect(meta.kind).toBe('meta');
    expect(meta.omittedEvents).toBe(100);
    expect(meta.omittedSnapshots).toBe(50);
    expect(lines).toHaveLength(1 + 500 + 300);
    expect(firstEvent.kind).toBe('event');
    expect(firstEvent.frameId).toBe(101);
    expect(firstSnapshot.kind).toBe('snapshot');
    expect(firstSnapshot.frameId).toBe(51);
  });

  it('truncates oversized payload strings in exported JSONL records', () => {
    const largePayload = 'x'.repeat(2048);
    const events: DebuggerEvent[] = [
      {
        type: 'input',
        frameId: 1,
        timestampMs: 100,
        payload: {
          action: largePayload,
        },
      },
    ];

    const lines = exportDebugDataJsonl(events, []).split('\n');
    const eventLine = JSON.parse(lines[0] ?? '{}');
    const truncatedAction = eventLine.payload?.action;

    expect(typeof truncatedAction).toBe('string');
    if (typeof truncatedAction === 'string') {
      expect(truncatedAction.includes('chars omitted')).toBe(true);
      expect(truncatedAction.length).toBeLessThan(700);
    }
  });
});
