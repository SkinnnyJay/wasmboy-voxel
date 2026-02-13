# CLAUDE.md

Guidance for working in the WasmBoy-Voxel fork.

## Project Overview
WasmBoy-Voxel is a fork of WasmBoy that adds a PPU snapshot layer used by
`gameboy-remix` to build voxel scenes. The emulator core is AssemblyScript
compiled to WebAssembly, with a JavaScript wrapper, workers, and demo apps.

## Key Goals
- Preserve emulator correctness while adding snapshot APIs.
- Keep memory layout compatibility with the AssemblyScript core.
- Maintain stable APIs for the voxel renderer in the parent project.

## Development Commands
- `npm run start` (or `npm run dev`) watch core + lib + debugger
- `npm run build` build core + lib
- `npm run core:build` / `npm run core:watch` build or watch the WASM core
- `npm run lib:build:wasm` / `npm run lib:watch:wasm` build or watch the JS wrapper
- `npm run debugger:watch` build the debugger UI
- `npm run prettier:lint` / `npm run prettier` format checks

## Testing
- `npm run test:accuracy`
- `npm run test:performance`
- `npm run test:integration`
- `npm run test:core`

## Architecture
1. **Core (`core/`)** AssemblyScript emulator compiled to `dist/core/core.untouched.wasm`.
2. **Library (`lib/`)** JavaScript wrapper and workers, built to `dist/wasmboy.wasm.*`.
3. **Voxel wrapper (`voxel-wrapper.ts`, `index.ts`)** TypeScript layer that exposes
   `WasmBoyVoxelApi` with PPU snapshot helpers.

## PPU Snapshot System
- Snapshot uses `_getWasmConstant("DEBUG_GAMEBOY_MEMORY_LOCATION")` for base memory.
- Reads VRAM, tilemaps, OAM, and registers (see `voxel-wrapper.ts`).
- Always call `supportsPpuSnapshot()` and handle `null` from `getPpuSnapshot()`.

## Constraints and Guardrails
- Do not edit `dist/` or `build/` directly; they are generated.
- Memory layout constants in `core/constants.ts` are fixed; if they change,
  update wrapper offsets and rebuild.
- Wrapper functions must tolerate worker readiness delays (retry or return `null`).
- Keep compatibility with the voxel pipeline in the parent `gameboy-remix` project.

## Integration with Parent Project
The parent project imports `WasmBoy` from `@libs/WasmBoy-Voxel` and calls
`getPpuSnapshot()` each frame to drive the voxel renderer. Changes to the
snapshot API must remain backward compatible or be coordinated with the parent.
