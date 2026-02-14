import type { DebuggerEvent, SnapshotState } from '../store/debugger-store';

export function exportDebugDataJsonl(events: DebuggerEvent[], snapshots: SnapshotState[]): string {
  const lines: string[] = [];

  events.forEach((event) => {
    lines.push(
      JSON.stringify({
        kind: 'event',
        ...event,
      }),
    );
  });

  snapshots.forEach((snapshot) => {
    lines.push(
      JSON.stringify({
        kind: 'snapshot',
        ...snapshot,
      }),
    );
  });

  return lines.join('\n');
}
