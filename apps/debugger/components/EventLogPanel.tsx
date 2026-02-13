const EVENT_LOG = [
  { type: 'load-rom', detail: 'ROM selected by user' },
  { type: 'snapshot', detail: 'Snapshot captured for frame 2' },
  { type: 'debug', detail: 'Contract validation passed' },
];

export function EventLogPanel() {
  return (
    <section className="panel">
      <h3>Event Log</h3>
      <ul>
        {EVENT_LOG.map((entry) => (
          <li key={`${entry.type}-${entry.detail}`}>
            [{entry.type}] {entry.detail}
          </li>
        ))}
      </ul>
    </section>
  );
}
