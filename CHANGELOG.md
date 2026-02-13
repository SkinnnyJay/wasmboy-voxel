# Changelog

## Current

- AssemblyScript core (`core/`) compiled to WebAssembly for the emulator runtime.
- JavaScript/TypeScript wrapper (`lib/`) that runs in browser and Node with worker-based rendering.
- Voxel-specific TypeScript wrapper (`voxel-wrapper.ts`) that exposes PPU snapshot helpers.
- Demo apps for debugger, benchmark, and iframe embed in `demo/`.

## Enhancements and Changes

- **Bug fixes:** Worker message waiters are cleared after firing to avoid memory growth; CLEAR_MEMORY loop uses `< length` instead of `<=`; `setSpeed()` returns a Promise so callers can await; PPU snapshot base cache is cleared on `reset()` and on resolve failure; PPU snapshot layout constants moved to `lib/ppuSnapshotConstants.js` for single source of truth with the worker and debug parser.
- **LLM / tooling API:** `getPpuSnapshotLayers(options?)` for partial snapshots by layer; `readMemory(start, endExclusive)` for raw Game Boy address-range reads; `subscribe('snapshot'|'error', handler)` with unsubscribe return; `clearPpuSnapshotCache()` and `reset()` wrapper that clears cache.
- Added `WasmBoyVoxelApi` with PPU snapshot support (`supportsPpuSnapshot`, `getPpuSnapshot`).
- Snapshot payload includes tile data, BG/window tile maps, OAM, and key PPU registers.
- Snapshot readiness retries around `_getWasmConstant` to tolerate worker startup.
- GBC palette helpers (`getGbcBgPalettes`, `getGbcObjPalettes`) that decode RGB555 data.
- Snapshot timing helper (`getLastSnapshotDurationMs`) for profiling.
- Stubbed APIs for dirty tiles, joypad trace, and direct memory access to preserve forward-compat.
- Documented performance review and snapshot overhead notes in `WASM_PERFORMANCE_REVIEW.md`.
- Added project changelog at repo root.
- Updated `README.md` with fork overview and voxel snapshot API notes.
