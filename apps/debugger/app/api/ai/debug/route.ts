import { NextResponse } from 'next/server';
import { debuggerSelectors, useDebuggerStore } from '../../../../store/debugger-store';

const EVENT_TYPES = new Set(['input', 'interrupt', 'snapshot', 'system']);

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toStringOrFallback(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function sanitizeFrameMetadata(frameMetadata: unknown): { frameId: number; timestampMs: number } {
  if (!isObjectRecord(frameMetadata)) {
    return {
      frameId: 0,
      timestampMs: 0,
    };
  }

  return {
    frameId: toFiniteNumber(frameMetadata.frameId, 0),
    timestampMs: toFiniteNumber(frameMetadata.timestampMs, 0),
  };
}

function sanitizeChecksums(checksums: unknown): Record<string, string> | null {
  if (!isObjectRecord(checksums)) {
    return null;
  }

  const sanitized = {
    tileDataHash: toStringOrFallback(checksums.tileDataHash),
    bgTileMapHash: toStringOrFallback(checksums.bgTileMapHash),
    windowTileMapHash: toStringOrFallback(checksums.windowTileMapHash),
    oamDataHash: toStringOrFallback(checksums.oamDataHash),
  };

  return Object.values(sanitized).every(value => value.length > 0) ? sanitized : null;
}

function sanitizeEvents(events: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(events)) {
    return [];
  }

  return events
    .filter(entry => isObjectRecord(entry))
    .filter(entry => EVENT_TYPES.has(toStringOrFallback(entry.type)))
    .map(entry => ({
      type: toStringOrFallback(entry.type),
      frameId: toFiniteNumber(entry.frameId, 0),
      timestampMs: toFiniteNumber(entry.timestampMs, 0),
      payload: isObjectRecord(entry.payload) ? entry.payload : {},
    }));
}

function sanitizeSnapshots(snapshots: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(snapshots)) {
    return [];
  }

  return snapshots
    .filter(entry => isObjectRecord(entry))
    .map(entry => ({
      frameId: toFiniteNumber(entry.frameId, 0),
      timestampMs: toFiniteNumber(entry.timestampMs, 0),
      registers: isObjectRecord(entry.registers) ? entry.registers : {},
      checksums: sanitizeChecksums(entry.checksums),
    }))
    .filter(entry => entry.checksums !== null);
}

export async function GET(): Promise<Response> {
  const state = useDebuggerStore.getState();
  const frame = sanitizeFrameMetadata({
    frameId: debuggerSelectors.frameId(state),
    timestampMs: debuggerSelectors.frameTimestampMs(state),
  });
  const latestChecksums = sanitizeChecksums(debuggerSelectors.latestChecksums(state));
  const events = sanitizeEvents(debuggerSelectors.eventStream(state)).slice(-50);
  const snapshots = sanitizeSnapshots(debuggerSelectors.snapshots(state)).slice(-10);

  const payload = {
    readOnly: true,
    frame,
    latestChecksums,
    events,
    snapshots,
  };
  return NextResponse.json(payload);
}
