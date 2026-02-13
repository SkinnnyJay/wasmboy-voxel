export function EmulatorViewPanel() {
  return (
    <section className="panel">
      <h3>Emulator View</h3>
      <div
        style={{
          width: '100%',
          aspectRatio: '160 / 144',
          borderRadius: 8,
          border: '1px solid #334155',
          background: 'radial-gradient(circle at center, #1e293b 0%, #0b1220 100%)',
        }}
      />
      <p className="muted">Canvas surface placeholder for rendered frame output.</p>
    </section>
  );
}
