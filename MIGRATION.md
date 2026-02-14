# Migration Guide — WasmBoy-Voxel

This guide covers how to migrate between different versions and entry points of the WasmBoy-Voxel fork. See **PLAN44.md** (§4.8) for the release layout (V1 / V2) and **README.md** for the Migration/Versioning link.

---

## Overview

- **Old** — Upstream WasmBoy or this fork before the migration stack and headless/main-thread work.
- **V1** — Current “classic” layout: JS lib (`lib/`), AssemblyScript core → WASM (`core/`), `dist/wasmboy.wasm.*` and `dist/wasmboy.headless.*`, Preact demos (`demo/`). Built with `npm run build` (WASM).
- **V2** — New layout: migration stack (`packages/api`, `packages/cli`, `apps/debugger`), TypeScript lib when Phase 11 is done, voxel-wrapper TS, and consolidated build/test via Makefile.

The root **Makefile** provides targets such as `make v1-build`,
`make v1-test`, `make v2-build`, `make v2-test`, and `make test-all`.

---

## Migrating from Old to V1

_Use this path if you are on upstream WasmBoy or an older fork and want the current JS/WASM build and headless support._

### Entry points

- **Main lib (browser/Node):** `dist/wasmboy.wasm.esm.js` or `dist/wasmboy.wasm.cjs.cjs` (after `npm run build`).
- **Headless (no Workers):** `dist/wasmboy.headless.esm.js` or `dist/wasmboy.headless.cjs.cjs` — use `WasmBoyHeadless` for synchronous frame stepping and snapshot.

### Breaking changes vs upstream

- This fork adds voxel/PPU snapshot APIs and headless options. Config can include `headless`, `mainThread`, and `updateGraphicsCallback`. See `docs/HEADLESS_MODE.md`.
- If you only need the classic canvas/audio API, use the same `WasmBoy.config()` and `loadROM()` as upstream; headless options are optional.

### Steps

1. Depend on this fork (e.g. `"wasmboy": "github:YourOrg/WasmBoy-Voxel#main"` or copy `dist/` outputs).
2. Run `npm run build` to produce `dist/wasmboy.wasm.*` and `dist/wasmboy.headless.*`.
3. Import the main lib or headless bundle as needed; add types from `wasm-fork.d.ts` if using TypeScript.
4. For Node headless, use `--experimental-worker` with the Worker-based lib, or use `WasmBoyHeadless` (no Workers) for CI/headless Chrome.

---

## Migrating from Old to V2

_Use this path when you want the TypeScript lib, migration stack (packages/api,
packages/cli, apps/debugger), and unified tooling._

### Entry points (when V2 is in place)

- **V2 lib:** TBD (e.g. `V2/dist/` or workspace packages).
- **V2 apps:** `apps/debugger` (Next.js), CLI via `packages/cli`.

### Breaking changes vs old

- Typed contracts from `packages/api`; snapshot/register payloads validated at boundaries.
- Build and test driven by Makefile or npm scripts under `V2/`.

### Steps

1. Review `V2/README.md` and Makefile targets for the current V2 layout.
2. Use `make v2-build` (or equivalent) to build the TS lib and migration stack.
3. Consume packages from the workspace or built artifacts; see `docs/migration/packages-api-usage-guide.md` and related migration docs.
4. For headless, use the same headless/mainThread APIs as V1; entry paths may differ (see V1→V2 below).

---

## Migrating from V1 to V2

_Use this path when you are already on V1 (current JS/WASM + headless) and want to move to the V2 layout and TypeScript lib._

### What stays the same

- Headless behavior: `headless: true`, `mainThread: true`, `WasmBoyHeadless`, and `updateGraphicsCallback` semantics remain. Snapshot and memory APIs stay compatible.
- ROM and frame format; baseline and golden tests should remain valid.

### What changes

- **Entry points:** Import paths and `dist/` locations may move under `V2/`. Makefile targets replace some npm scripts for build/test.
- **Types:** Phase 11 (TypeScript lib) will provide strict types and `npm run typecheck` at root; replace `wasm-fork.d.ts` usage with generated or source types where applicable.
- **Packages:** Depend on `packages/api` for contracts and optionally `packages/cli` / `apps/debugger` for tooling.

### Steps

1. Ensure V1 tests pass (`make v1-test` or `npm run test:integration` including headless).
2. Switch to V2 build and entry points per this guide’s “Old to V2” section.
3. Run `make v2-test` (or equivalent); fix any import or type breaks.
4. Update consumer (e.g. gameboy-remix) to use V2 entry points and typed APIs; see `docs/migration/troubleshooting-faq.md` for common issues.

---

## Quick reference

| From → To | Doc section | Key actions                                                                   |
| --------- | ----------- | ----------------------------------------------------------------------------- |
| Old → V1  | Old to V1   | Use `dist/wasmboy.wasm.*` and `dist/wasmboy.headless.*`; see HEADLESS_MODE.md |
| Old → V2  | Old to V2   | Use V2 layout and Makefile when available                                     |
| V1 → V2   | V1 to V2    | Switch entry points and build; keep headless API                              |

For repository architecture and backlog, see **PLAN44.md** and **docs/migration/repository-architecture-map-2026-02-14.md**.
