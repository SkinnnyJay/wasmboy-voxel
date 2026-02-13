import { create } from 'zustand';

export interface DebuggerEvent {
  type: 'input' | 'interrupt' | 'snapshot' | 'system';
  frameId: number;
  timestampMs: number;
  payload: Record<string, unknown>;
}

export interface SnapshotChecksums {
  tileDataHash: string;
  bgTileMapHash: string;
  windowTileMapHash: string;
  oamDataHash: string;
}

export interface SnapshotState {
  frameId: number;
  timestampMs: number;
  registers: {
    scx: number;
    scy: number;
    wx: number;
    wy: number;
    lcdc: number;
    bgp: number;
    obp0: number;
    obp1: number;
  };
  checksums: SnapshotChecksums;
}

interface DebuggerStoreState {
  frameId: number;
  timestampMs: number;
  rateLimitMs: number;
  lastCaptureAtMs: number;
  sandboxMode: boolean;
  snapshots: SnapshotState[];
  events: DebuggerEvent[];
}

interface DebuggerStoreActions {
  setRateLimitMs: (value: number) => void;
  setSandboxMode: (enabled: boolean) => void;
  appendInputEvent: (payload: Record<string, unknown>) => void;
  appendInterruptEvent: (payload: Record<string, unknown>) => void;
  captureSnapshot: (snapshot: Omit<SnapshotState, 'frameId' | 'timestampMs' | 'checksums'>) => boolean;
  clearEvents: () => void;
}

export type DebuggerStore = DebuggerStoreState & DebuggerStoreActions;

const MAX_EVENTS = 500;
const MAX_SNAPSHOTS = 300;

function hashBytes(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function frameNowMs(): number {
  return Date.now();
}

export const useDebuggerStore = create<DebuggerStore>((set, get) => ({
  frameId: 0,
  timestampMs: frameNowMs(),
  rateLimitMs: 16,
  lastCaptureAtMs: 0,
  sandboxMode: false,
  snapshots: [],
  events: [],
  setRateLimitMs(value: number) {
    set({ rateLimitMs: Math.max(1, Math.floor(value)) });
  },
  setSandboxMode(enabled: boolean) {
    set({ sandboxMode: enabled });
  },
  appendInputEvent(payload: Record<string, unknown>) {
    const state = get();
    const event: DebuggerEvent = {
      type: 'input',
      frameId: state.frameId,
      timestampMs: frameNowMs(),
      payload,
    };
    set({
      events: [...state.events, event].slice(-MAX_EVENTS),
    });
  },
  appendInterruptEvent(payload: Record<string, unknown>) {
    const state = get();
    const event: DebuggerEvent = {
      type: 'interrupt',
      frameId: state.frameId,
      timestampMs: frameNowMs(),
      payload,
    };
    set({
      events: [...state.events, event].slice(-MAX_EVENTS),
    });
  },
  captureSnapshot(snapshot: Omit<SnapshotState, 'frameId' | 'timestampMs' | 'checksums'>): boolean {
    const state = get();
    const nowMs = frameNowMs();
    if (nowMs - state.lastCaptureAtMs < state.rateLimitMs) {
      return false;
    }
    if (state.sandboxMode) {
      return false;
    }

    const frameId = state.frameId + 1;
    const timestampMs = nowMs;
    const checksums: SnapshotChecksums = {
      tileDataHash: hashBytes(JSON.stringify(snapshot)),
      bgTileMapHash: hashBytes(JSON.stringify(snapshot.registers)),
      windowTileMapHash: hashBytes(`${snapshot.registers.wx}:${snapshot.registers.wy}`),
      oamDataHash: hashBytes(`${snapshot.registers.obp0}:${snapshot.registers.obp1}`),
    };
    const nextSnapshot: SnapshotState = {
      frameId,
      timestampMs,
      registers: snapshot.registers,
      checksums,
    };
    const snapshotEvent: DebuggerEvent = {
      type: 'snapshot',
      frameId,
      timestampMs,
      payload: {
        checksums,
      },
    };

    set({
      frameId,
      timestampMs,
      lastCaptureAtMs: nowMs,
      snapshots: [...state.snapshots, nextSnapshot].slice(-MAX_SNAPSHOTS),
      events: [...state.events, snapshotEvent].slice(-MAX_EVENTS),
    });

    return true;
  },
  clearEvents() {
    set({ events: [] });
  },
}));

export const debuggerSelectors = {
  frameMetadata: (state: DebuggerStoreState) => ({
    frameId: state.frameId,
    timestampMs: state.timestampMs,
  }),
  latestChecksums: (state: DebuggerStoreState) =>
    state.snapshots.length > 0
      ? (state.snapshots[state.snapshots.length - 1] ?? null)?.checksums ?? null
      : null,
  eventStream: (state: DebuggerStoreState) => state.events,
  snapshots: (state: DebuggerStoreState) => state.snapshots,
};
