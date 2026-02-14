import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GET } from '../app/api/ai/debug/route';
import { contractsClient } from '../lib/contracts-client';
import { useDebuggerStore } from '../store/debugger-store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('debugger smoke', () => {
  it('contracts client returns registry summary', () => {
    const summary = contractsClient.getRegistrySummary();
    expect(summary.version).toBe('v1');
    expect(summary.contracts.length).toBeGreaterThan(0);
  });

  it('read-only AI debug endpoint returns JSON payload', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.readOnly).toBe(true);
  });

  it('read-only AI debug endpoint sanitizes malformed frame and list payloads', async () => {
    const originalState = useDebuggerStore.getState();
    const nextState = { ...originalState };
    Reflect.set(nextState, 'events', [
      {
        type: 'snapshot',
        frameId: 7,
        timestampMs: 101,
        payload: { kind: 'valid' },
      },
      {
        type: 'not-a-valid-event-type',
        frameId: 'bad-frame-id',
        timestampMs: 'bad-timestamp',
        payload: null,
      },
    ]);
    Reflect.set(nextState, 'snapshots', [
      {
        frameId: 9,
        timestampMs: 202,
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
      },
      {
        frameId: 'bad-frame-id',
        timestampMs: Infinity,
        registers: null,
        checksums: {
          tileDataHash: 1,
          bgTileMapHash: null,
          windowTileMapHash: undefined,
          oamDataHash: 'still-invalid',
        },
      },
    ]);
    Reflect.set(nextState, 'frameId', Number.NaN);
    Reflect.set(nextState, 'timestampMs', Number.POSITIVE_INFINITY);
    useDebuggerStore.setState(nextState);

    try {
      const response = await GET();
      expect(response.status).toBe(200);
      const payload = await response.json();

      expect(payload.frame).toEqual({
        frameId: 0,
        timestampMs: 0,
      });
      expect(payload.latestChecksums).toBeNull();
      expect(payload.events).toHaveLength(1);
      expect(payload.events[0]).toMatchObject({
        type: 'snapshot',
        frameId: 7,
        timestampMs: 101,
      });
      expect(payload.snapshots).toHaveLength(1);
      expect(payload.snapshots[0]).toMatchObject({
        frameId: 9,
        timestampMs: 202,
      });
    } finally {
      useDebuggerStore.setState(originalState);
    }
  });

  it('key app routes and components exist', () => {
    const expectedPaths = [
      'app/page.tsx',
      'app/contracts/page.tsx',
      'app/error.tsx',
      'components/RomLoaderPanel.tsx',
      'components/EventLogPanel.tsx',
      'store/debugger-store.ts',
    ];

    expectedPaths.forEach((relativePath) => {
      const absolutePath = path.resolve(__dirname, '..', relativePath);
      expect(fs.existsSync(absolutePath)).toBe(true);
    });
  });
});
