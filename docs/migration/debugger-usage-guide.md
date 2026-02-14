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

## Snapshot timeline paging for large histories

The `Snapshot Timeline` panel keeps rendering bounded with a fixed page size and
navigation controls:

- `Oldest` jumps to the earliest captured page window.
- `Older` steps one page deeper into history.
- `Newer` steps back toward recent pages.
- `Newest` jumps to the latest page window.

This enables deep inspection of long-running sessions without mounting thousands
of timeline rows into the DOM at once.

## Memory panel constraints for large dumps

The current `Memory Viewer` panel is intentionally constrained for UI safety:

- it renders a small fixed row window instead of full raw dumps
- it surfaces checksum metadata from the latest snapshot instead of bulk memory payloads
- it avoids mounting large byte arrays directly into React component trees

Practical implications:

- very large VRAM/OAM dumps should be inspected through exported JSONL artifacts, contract-check
  files, or backend diagnostics rather than direct panel rendering
- if you need full dump views, prefer paginated/virtualized rendering to prevent browser memory
  spikes and long main-thread stalls
- keep per-panel rendered byte windows bounded when adding new memory visualization features
