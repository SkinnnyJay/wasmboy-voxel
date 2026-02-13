# Debugger Usage Guide (`apps/debugger`)

## Start local debugger

```bash
cd apps/debugger
npm run dev
```

## Key UI panels

- ROM Loader
- Emulator View
- Registers
- Memory Viewer
- Snapshot Timeline
- Event Log

## State + events

The debugger uses a Zustand store for:

- frame metadata (`frameId`, `timestampMs`)
- rate-limited snapshot capture
- snapshot checksums
- input/interrupt event stream
- sandbox mode toggle

## Debug API route

Read-only route:

- `GET /api/ai/debug`

Returns recent events/snapshots and frame/checksum metadata.

## JSONL export

Use the UI `Export JSONL` action to generate event + snapshot JSONL output for
LLM/debug tooling ingestion.
