import { DebuggerEvent, SnapshotState } from '../store/debugger-store';

const MAX_EXPORT_EVENTS = 500;
const MAX_EXPORT_SNAPSHOTS = 300;
const MAX_EXPORT_OBJECT_KEYS = 40;
const MAX_EXPORT_ARRAY_ITEMS = 40;
const MAX_EXPORT_STRING_LENGTH = 512;
const MAX_EXPORT_DEPTH = 4;
const TRUNCATED_DEPTH_MARKER = '[truncated-depth]';

function compactJsonValue(value: unknown, depth: number): unknown {
  if (depth >= MAX_EXPORT_DEPTH) {
    return TRUNCATED_DEPTH_MARKER;
  }

  if (value === null || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value.length <= MAX_EXPORT_STRING_LENGTH) {
      return value;
    }
    return `${value.slice(0, MAX_EXPORT_STRING_LENGTH)}…[${value.length -
      MAX_EXPORT_STRING_LENGTH} chars omitted]`;
  }

  if (Array.isArray(value)) {
    const compactArray = value
      .slice(0, MAX_EXPORT_ARRAY_ITEMS)
      .map(entry => compactJsonValue(entry, depth + 1));
    if (value.length > MAX_EXPORT_ARRAY_ITEMS) {
      compactArray.push(`[${value.length - MAX_EXPORT_ARRAY_ITEMS} items omitted]`);
    }
    return compactArray;
  }

  if (typeof value === 'object') {
    const compactObject: Record<string, unknown> = {};
    const entries = Object.entries(value);
    entries.slice(0, MAX_EXPORT_OBJECT_KEYS).forEach(([key, entryValue]) => {
      compactObject[key] = compactJsonValue(entryValue, depth + 1);
    });
    if (entries.length > MAX_EXPORT_OBJECT_KEYS) {
      compactObject.__truncatedKeys = entries.length - MAX_EXPORT_OBJECT_KEYS;
    }
    return compactObject;
  }

  return String(value);
}

function compactJsonRecord(value: object): Record<string, unknown> {
  const compactValue = compactJsonValue(value, 0);
  if (typeof compactValue === 'object' && compactValue !== null && !Array.isArray(compactValue)) {
    return { ...compactValue };
  }
  return {};
}

export function exportDebugDataJsonl(events: DebuggerEvent[], snapshots: SnapshotState[]): string {
  const lines: string[] = [];
  const eventWindow = events.slice(-MAX_EXPORT_EVENTS);
  const snapshotWindow = snapshots.slice(-MAX_EXPORT_SNAPSHOTS);
  const omittedEvents = Math.max(0, events.length - eventWindow.length);
  const omittedSnapshots = Math.max(0, snapshots.length - snapshotWindow.length);

  if (omittedEvents > 0 || omittedSnapshots > 0) {
    lines.push(
      JSON.stringify({
        kind: 'meta',
        omittedEvents,
        omittedSnapshots,
      }),
    );
  }

  eventWindow.forEach(event => {
    const compactEvent = compactJsonRecord(event);
    lines.push(
      JSON.stringify({
        kind: 'event',
        ...compactEvent,
      }),
    );
  });

  snapshotWindow.forEach(snapshot => {
    const compactSnapshot = compactJsonRecord(snapshot);
    lines.push(
      JSON.stringify({
        kind: 'snapshot',
        ...compactSnapshot,
      }),
    );
  });

  return lines.join('\n');
}
