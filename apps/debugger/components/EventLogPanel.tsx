import { useDebuggerStore } from '../store/debugger-store';

export function EventLogPanel() {
  const events = useDebuggerStore((state) => state.events);

  return (
    <section className="panel">
      <h3>Event Log</h3>
      <ul>
        {events.length === 0 ? (
          <li className="muted">No events yet.</li>
        ) : (
          events.map((entry) => (
            <li key={`${entry.type}-${entry.frameId}-${entry.timestampMs}`}>
              [{entry.type}] frame {entry.frameId} @ {entry.timestampMs}ms
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
