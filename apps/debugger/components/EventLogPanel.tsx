import React from 'react';
import { useDebuggerStore } from '../store/debugger-store';

const MAX_EVENT_LOG_RENDER_ITEMS = 200;

export function EventLogPanel() {
  const events = useDebuggerStore((state) => state.events);
  const renderedEvents = events.slice(-MAX_EVENT_LOG_RENDER_ITEMS);
  const hiddenEventCount = Math.max(0, events.length - renderedEvents.length);

  return (
    <section className="panel">
      <h3>Event Log</h3>
      {hiddenEventCount > 0 ? (
        <p className="muted">
          {hiddenEventCount} older events hidden to keep log rendering bounded.
        </p>
      ) : null}
      <ul>
        {events.length === 0 ? (
          <li className="muted">No events yet.</li>
        ) : (
          renderedEvents.map((entry) => (
            <li key={`${entry.type}-${entry.frameId}-${entry.timestampMs}`}>
              [{entry.type}] frame {entry.frameId} @ {entry.timestampMs}ms
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
