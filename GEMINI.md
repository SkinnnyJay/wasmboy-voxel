# GEMINI.md

Quick reference for working in WasmBoy-Voxel.

## Project Summary
Fork of WasmBoy with PPU snapshot APIs used by `gameboy-remix` for voxel
rendering. AssemblyScript core -> WASM, JS wrapper + workers, TS voxel wrapper.

## Key Commands
- `npm run start` (or `npm run dev`) watch core + lib + debugger
- `npm run build` build core + lib
- `npm run test:accuracy`, `npm run test:performance`, `npm run test:integration`,
  `npm run test:core`
- `npm run prettier:lint` / `npm run prettier`

## Critical Constraints
- Do not edit `dist/` or `build/` directly; they are generated.
- Memory layout constants in `core/constants.ts` are fixed; update wrapper offsets
  and rebuild if they change.
- Snapshot reads use `_getWasmConstant` and `_getWasmMemorySection`; handle
  worker readiness and return `null` when unavailable.
