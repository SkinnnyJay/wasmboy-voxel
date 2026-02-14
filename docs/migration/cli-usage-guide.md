# CLI Usage Guide (`@wasmboy/cli`)

## Build

```bash
cd packages/cli
npm run build
```

## Commands

### Run ROM metadata pass

```bash
wasmboy-voxel run <rom.gb|rom.gbc>
```

### Snapshot ROM metadata payload

```bash
wasmboy-voxel snapshot <rom.gb|rom.gbc> --out ./snapshot.json
```

### Compare baseline summaries

```bash
wasmboy-voxel compare test/baseline/snapshots/summary.json
```

### Contract check payload

```bash
wasmboy-voxel contract-check --contract registers --file ./registers.json
```

## Output format

Structured JSON logs are emitted with:

- `timestamp`
- `level`
- `message`
- `context`
