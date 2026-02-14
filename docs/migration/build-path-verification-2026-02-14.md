# Build path verification (WASM + TS) — 2026-02-14

This note records current verification status for both supported library build
paths:

- **WASM path** (`npm run build` / `npm run lib:build:wasm`)
- **TS-core path** (`npm run lib:build:ts`)

## 1) WASM build path

### Build command

- `npm run lib:build:wasm`

### Expected outputs

- `dist/wasmboy.wasm.umd.js`
- `dist/wasmboy.wasm.iife.js`
- `dist/wasmboy.wasm.esm.js`
- `dist/wasmboy.wasm.cjs.cjs`
- `dist/wasmboy.headless.esm.js`
- `dist/wasmboy.headless.cjs.cjs`
- worker bundles under `dist/worker/*.js`

### Runtime verification commands

- `npm run test:integration:lib`
- `npm run test:integration:headless:callback`
- `npm run test:integration:headless:mainthread`
- `npm run test:integration:headless:class`
- `npm run test:integration:voxel`
- `npm run test:integration:voxel:wrapper`

All commands above are currently passing.

## 2) TS-core build path

### Build command

- `npm run lib:build:ts`

### Expected outputs

- `dist/wasmboy.ts.umd.js`
- `dist/wasmboy.ts.iife.js`
- `dist/wasmboy.ts.esm.js`
- `dist/wasmboy.ts.cjs.js`
- `dist/worker/wasmboy.ts.worker.js`
- `dist/core/getWasmBoyTsCore.*.js`

### Runtime smoke verification

- Added integration smoke script:
  - `npm run test:integration:lib:ts`
  - test file: `test/integration/lib-ts-build-smoke.cjs`
  - runtime helper: `test/load-wasmboy-ts-runtime.cjs`

This validates that the TS CJS runtime can be loaded, stepped, and queried for
debug memory sections in headless mode.

## 3) Stabilization changes applied during verification

The TS path uncovered ESM/runtime compatibility issues in rollup config loading
that are now fixed:

- Local rollup config imports now use explicit `.js` extensions in
  `rollup.config.js`.
- `rollup.core.js` now uses ESM `node:fs` import (no CJS `require`).
- `rollup.config.js` now lazy-loads optional app/demo bundle configs to avoid
  pulling unrelated legacy plugin stacks into lib-only TS builds.
- Added missing dev dependency required by existing postcss tooling:
  - `postcss`

These fixes keep `lib:build:ts` executable in the current Node 22 ESM runtime.
