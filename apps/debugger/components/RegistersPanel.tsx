const DEFAULT_REGISTERS = {
  lcdc: 0,
  scx: 0,
  scy: 0,
  wx: 0,
  wy: 0,
  bgp: 0,
  obp0: 0,
  obp1: 0,
};

export function RegistersPanel() {
  return (
    <section className="panel">
      <h3>Registers</h3>
      <ul>
        {Object.entries(DEFAULT_REGISTERS).map(([key, value]) => (
          <li key={key}>
            {key}: 0x{value.toString(16).padStart(2, '0')}
          </li>
        ))}
      </ul>
    </section>
  );
}
