# Repository Guidelines

## Project Summary
WasmBoy-Voxel is a fork of WasmBoy that adds PPU snapshot and debug APIs for voxel
rendering. It is consumed by the parent `gameboy-remix` project via
`@libs/WasmBoy-Voxel`.

## Architecture
- `core/` AssemblyScript Game Boy emulator compiled to WASM.
- `lib/` JavaScript wrapper and workers.
- `voxel-wrapper.ts` and `index.ts` add voxel snapshot helpers.
- `demo/` debugger, benchmark, iframe demos.

## Key Constraints
- `dist/` and `build/` are generated output; do not edit by hand.
- Memory layout constants in `core/constants.ts` are fixed; update wrapper logic
  if they change.
- Snapshot reads must use `_getWasmConstant` and `_getWasmMemorySection` and
  tolerate worker readiness delays.
- Keep compatibility with the voxel pipeline in `gameboy-remix`.

## Development Commands
- `npm run start` (or `npm run dev`) watch core + lib + debugger
- `npm run build` build core + lib
- `npm run core:build` build the WASM core
- `npm run lib:build:wasm` build the JS wrapper for WASM core
- `npm run debugger:watch` build the debugger UI

## Tests
- `npm run test:accuracy`
- `npm run test:performance`
- `npm run test:integration`
- `npm run test:core`

## Formatting
- `npm run prettier:lint`
- `npm run prettier` (auto-fix)

## Type Safety
- Prefer explicit types for TypeScript public APIs.
- Avoid `any` and type assertions; use narrowing or helpers instead.
