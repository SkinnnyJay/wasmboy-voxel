# Migration to Next.js + React + Zod + Zustand + TypeScript

This document outlines a realistic, low-regression migration plan from the
current WasmBoy-Voxel repo to a modern Next.js + React + Zod + Zustand + TypeScript
stack with deep debugging and AI/LLM-friendly client interaction. It focuses on
preserving emulator correctness, API contracts, and existing consumer behavior.

## Summary

- **Feasibility**: Medium-to-hard. The emulator core is AssemblyScript + WASM
  and must remain stable; the biggest work is in restructuring the JS wrapper,
  adding typed APIs, and building a modern UI + debugging layer around it.
- **Difficulty level**: **7/10** (complexity comes from WASM/core constraints
  and the need to preserve existing API contracts).
- **Time estimate** (1-2 engineers):
  - Phase 0-2: ~2-3 weeks
  - Phase 3-4: ~3-5 weeks
  - Phase 5-6: ~2-4 weeks
  - Phase 7+: ongoing hardening and performance tuning

## Goals

1. Keep emulator correctness and memory layout unchanged.
2. Preserve API contracts for existing consumers (ex: `gameboy-remix`).
3. Add typed, validated, versioned APIs (Zod schemas + generated types).
4. Provide deep debugging and structured snapshots for AI/LLM tooling.
5. Introduce a CLI for headless testing and regression detection.
6. Enforce modern TypeScript quality standards (DRY, KISS, no magic numbers).
7. Maintain performance parity or better for hot paths.

## Engineering Principles (Quality First)

- **DRY**: consolidate repeated logic into small helpers in `packages/shared/`.
- **KISS**: avoid heavy abstractions; prefer plain functions and explicit types.
- **No magic numbers/strings**: use named constants for non-hardware values.
- **Performance-minded**: avoid unnecessary allocations and object churn in loops.
- **Explicit contracts**: public APIs must be fully typed and runtime-validated.
- **Zero `any`**: use `unknown` and narrow; avoid type assertions (`as`).

### No Magic Numbers/Strings Policy

- Hardware addresses remain as named constants and grouped by subsystem.
- All other literals should be defined in `packages/shared/constants/`.
- Prefer enums or `as const` maps for string unions (e.g. event names).
- Add lint rules: `@typescript-eslint/no-magic-numbers` and
  `unicorn/prevent-abbreviations` (as applicable).

## Proposed Target Architecture

```
repo/
  core/                     (AssemblyScript WASM core, unchanged)
  lib/                      (JS/TS wrapper + workers, typed)
  apps/
    debugger/               (Next.js app for UI + debugging)
  packages/
    api/                    (Zod schemas + types + client)
    cli/                    (Node CLI for snapshot/test automation)
    shared/                 (shared utilities, constants)
  tools/                    (scripts, dev utilities)
```

- **core/** stays AssemblyScript and continues to compile to WASM.
- **lib/** becomes fully TypeScript, strict, typed API surface.
- **apps/debugger/** is a Next.js app that talks to the lib wrapper and exposes
  debugging and AI tooling.
- **packages/api/** hosts Zod schemas and versioned API contracts.
- **packages/cli/** provides headless tests, snapshot export, regression checks.
- **packages/shared/** hosts constants, pure helpers, and shared types.

## Keep One Repo, Run Both Stacks

Do **not** add a `repo/typeScript/` sub-tree that duplicates the repo. Instead,
keep one repo with **old + new code side-by-side** and migrate gradually:

- **Old stays put**: `core/`, `lib/`, `demo/` remain as-is.
- **New lives in `apps/` + `packages/`** for Next.js, CLI, and contracts.
- **Compatibility layer** sits in `lib/` to preserve existing consumers.

This avoids duplicated tooling, makes WASM/worker paths stable, and keeps
contracts and tests centralized.

### Example NPM Scripts

```
"scripts": {
  "dev:debugger": "next dev apps/debugger",
  "build:debugger": "next build apps/debugger",
  "dev:cli": "ts-node packages/cli/src/index.ts",
  "test:contracts": "node packages/cli/dist/contract-check.js",
  "test:new": "pnpm -r --filter ./packages/** test"
}
```

If desired, add `pnpm` workspaces or `turborepo` to orchestrate builds.

## Migration Phases

### Phase 0 — Discovery and Baseline (No behavior changes)

- Inventory current public APIs in `lib/`, `voxel-wrapper.ts`, and `index.ts`.
- Record current behavior with golden tests for:
  - Snapshot data shape
  - Emulator outputs for known ROMs
  - Timing/accuracy baselines
- Define a stable API contract document and version it.

**Outputs**
- `contracts/v1/` docs (or `packages/api/` Zod schemas)
- Baseline test logs and expected snapshots

### Phase 1 — TypeScript Strictness and API Stabilization

- Convert `lib/` and `voxel-wrapper.ts` to strict TypeScript (no `any`).
- Add `packages/shared/` for constants and DRY helpers.
- Extract public API interfaces into `packages/api/`.
- Add Zod schemas for all snapshot and debug outputs.
- Validate data at API boundaries with Zod (compile-time + runtime safety).

**Outputs**
- `packages/api/` with Zod schemas and generated types
- Strict TS config for wrapper + worker packages
- `packages/shared/` with constants, helpers, and shared types

### Phase 2 — Contract-First Integration

- Wrap existing APIs with a contract-first layer:
  - `getPpuSnapshot(): PpuSnapshot | null`
  - `getRegisters(): Registers`
  - `getMemorySection(...): Uint8Array`
- Add versioned `ApiContract` type and schema.
- Add `supportsPpuSnapshot()` gating everywhere.

**Outputs**
- Minimal change for consumers: same function names, same outputs
- Contract validation in development/test builds

### Phase 3 — Next.js Debugger App (Parallel, Non-breaking)

- Create `apps/debugger` (Next.js + React + Zustand).
- Embed emulator view, inspector panes, memory viewer, register panels.
- Use a typed client that consumes `packages/api/`.
- Provide a debug event log stream (optional WebSocket/worker event channel).

**Outputs**
- New UI without removing old demos
- Modern, typed developer interface

### Phase 4 — AI/LLM Integration Layer

- Add structured debug snapshots and events:
  - `DebugFrame` with timestamp, frame ID, checksums, registers
  - PPU/OAM/VRAM dumps with checksums and metadata
  - Event stream for inputs, interrupts, and state changes
- Provide a **read-only API** for AI:
  - Strict schemas with `zod` for all payloads
  - Optional JSONL export for LLM tools
- Add a “debug sandbox mode” to prevent mutating state.

**Outputs**
- A dedicated AI-friendly data contract
- Configurable debug verbosity + safety boundaries

### Phase 5 — CLI Tooling

- Node CLI for regression testing and snapshot export.
- Commands:
  - `wasmboy-voxel run <rom>` (headless run)
  - `wasmboy-voxel snapshot <rom>`
  - `wasmboy-voxel compare <baseline>`
  - `wasmboy-voxel contract-check`

**Outputs**
- Automated regression guardrails
- Easy CI integration

### Phase 6 — Deprecation Plan

- Keep old APIs for at least one major version.
- Provide `compat` layer if needed.
- Publish migration guide and changelog.

## Migration Tasks (Checklist)

[ ] - Phase 0: Baseline - Inventory public exports in `index.ts`
[ ] - Phase 0: Baseline - Inventory public exports in `voxel-wrapper.ts`
[ ] - Phase 0: Baseline - Inventory public exports in `lib/` entry points
[ ] - Phase 0: Baseline - List worker entry points and message schemas
[ ] - Phase 0: Baseline - Map current snapshot fields to memory sources
[ ] - Phase 0: Baseline - Document current null/undefined behaviors
[ ] - Phase 0: Baseline - List ROMs used by existing tests/demos
[ ] - Phase 0: Baseline - Capture baseline snapshot JSON for each ROM
[ ] - Phase 0: Baseline - Record baseline checksums for VRAM/OAM
[ ] - Phase 0: Baseline - Record baseline timing/accuracy metrics
[ ] - Phase 0: Baseline - Write initial contract table (function → payload)

[ ] - Phase 1: Contracts + Types - Create `packages/api` skeleton
[ ] - Phase 1: Contracts + Types - Add `contracts/v1` directory
[ ] - Phase 1: Contracts + Types - Define `PpuSnapshot` schema in Zod
[ ] - Phase 1: Contracts + Types - Define `Registers` schema in Zod
[ ] - Phase 1: Contracts + Types - Define `MemorySection` schema in Zod
[ ] - Phase 1: Contracts + Types - Define `DebugFrame` schema in Zod
[ ] - Phase 1: Contracts + Types - Add schema version metadata
[ ] - Phase 1: Contracts + Types - Export inferred TS types from schemas
[ ] - Phase 1: Contracts + Types - Add schema validation helper
[ ] - Phase 1: Contracts + Types - Add contract registry (map of versions)
[ ] - Phase 1: Contracts + Types - Document contract usage in README

[ ] - Phase 2: Wrapper Integration - Identify all public wrapper entry points
[ ] - Phase 2: Wrapper Integration - Add contract gate for `getPpuSnapshot()`
[ ] - Phase 2: Wrapper Integration - Add contract gate for `getRegisters()`
[ ] - Phase 2: Wrapper Integration - Add contract gate for `getMemorySection()`
[ ] - Phase 2: Wrapper Integration - Add contract gate for debug events
[ ] - Phase 2: Wrapper Integration - Ensure `supportsPpuSnapshot()` guards
[ ] - Phase 2: Wrapper Integration - Keep null return on worker readiness
[ ] - Phase 2: Wrapper Integration - Add dev-only contract validation flag
[ ] - Phase 2: Wrapper Integration - Add `compat` wrapper for old API

[ ] - Phase 2.5: Build + Packaging - Add tsup/esbuild config for packages
[ ] - Phase 2.5: Build + Packaging - Configure ESM/CJS outputs + `types`
[ ] - Phase 2.5: Build + Packaging - Add `exports` maps for new packages
[ ] - Phase 2.5: Build + Packaging - Add `typecheck` script for packages
[ ] - Phase 2.5: Build + Packaging - Add `test` runner (vitest/jest)
[ ] - Phase 2.5: Build + Packaging - Add publish metadata (name/version/files)
[ ] - Phase 2.5: Build + Packaging - Add `sideEffects` metadata if needed
[ ] - Phase 2.5: Build + Packaging - Add `tsconfig.build.json` per package

[ ] - Phase 3: Next.js Debugger - Create `apps/debugger` skeleton
[ ] - Phase 3: Next.js Debugger - Configure Next.js (app router)
[ ] - Phase 3: Next.js Debugger - Add global styles and layout
[ ] - Phase 3: Next.js Debugger - Add top-level routing and nav
[ ] - Phase 3: Next.js Debugger - Add error boundary and fallback UI
[ ] - Phase 3: Next.js Debugger - Configure WASM asset handling
[ ] - Phase 3: Next.js Debugger - Configure worker loading strategy
[ ] - Phase 3: Next.js Debugger - Add ROM loader UI
[ ] - Phase 3: Next.js Debugger - Add emulator view panel component
[ ] - Phase 3: Next.js Debugger - Add registers panel component
[ ] - Phase 3: Next.js Debugger - Add memory viewer component
[ ] - Phase 3: Next.js Debugger - Add snapshot timeline component
[ ] - Phase 3: Next.js Debugger - Add event log panel component
[ ] - Phase 3: Next.js Debugger - Wire typed client to `packages/api`

[ ] - Phase 4: State + Events - Add Zustand store for debugger state
[ ] - Phase 4: State + Events - Add selectors and actions for UI panels
[ ] - Phase 4: State + Events - Add frame metadata (timestamp/frame ID)
[ ] - Phase 4: State + Events - Add snapshot checksums
[ ] - Phase 4: State + Events - Add event stream for inputs/interrupts
[ ] - Phase 4: State + Events - Add read-only AI debug endpoint
[ ] - Phase 4: State + Events - Add JSONL export for events/snapshots
[ ] - Phase 4: State + Events - Add debug sandbox mode (no mutations)
[ ] - Phase 4: State + Events - Add rate limiting for snapshot capture

[ ] - Phase 5: CLI - Create `packages/cli` skeleton
[ ] - Phase 5: CLI - Add CLI argument parser and command router
[ ] - Phase 5: CLI - Implement `run <rom>` command
[ ] - Phase 5: CLI - Implement `snapshot <rom>` command
[ ] - Phase 5: CLI - Implement `compare <baseline>` command
[ ] - Phase 5: CLI - Implement `contract-check` command
[ ] - Phase 5: CLI - Add structured logging output
[ ] - Phase 5: CLI - Add ROM path validation and safe errors
[ ] - Phase 5: CLI - Add `bin` entry + packaging metadata
[ ] - Phase 5: CLI - Add help text and usage examples

[ ] - Phase 6: Regression Safety - Add golden snapshot tests
[ ] - Phase 6: Regression Safety - Add checksum regression tests
[ ] - Phase 6: Regression Safety - Add contract validation tests
[ ] - Phase 6: Regression Safety - Add headless CLI regression tests
[ ] - Phase 6: Regression Safety - Add Next.js debugger smoke tests
[ ] - Phase 6: Regression Safety - Add CI job for contract checks
[ ] - Phase 6: Regression Safety - Ensure existing test suites still pass

[ ] - Phase 7: Compatibility - Add deprecation warnings (dev-only)
[ ] - Phase 7: Compatibility - Add migration notes for `gameboy-remix`
[ ] - Phase 7: Compatibility - Add backwards-compat test coverage
[ ] - Phase 7: Compatibility - Document breaking change policy

[ ] - Phase 8: Tooling - Add workspace scripts (`dev`, `build`, `test`)
[ ] - Phase 8: Tooling - Add lint + prettier for new packages
[ ] - Phase 8: Tooling - Add strict TS config per package
[ ] - Phase 8: Tooling - Add CI workflow for lint/typecheck/tests
[ ] - Phase 8: Tooling - Add build caching for workspace tasks
[ ] - Phase 8: Tooling - Add release automation (changesets)
[ ] - Phase 8: Tooling - Audit and replace vulnerable/deprecated packages

[ ] - Phase 9: Documentation - Update `MIGRATE_TO_TYPESCRIPT.md` progress links
[ ] - Phase 9: Documentation - Add `packages/api` usage guide
[ ] - Phase 9: Documentation - Add debugger usage guide
[ ] - Phase 9: Documentation - Add CLI usage guide
[ ] - Phase 9: Documentation - Add troubleshooting FAQ

[ ] - Phase 10: Finalization - Verify all tests + contract checks pass
[ ] - Phase 10: Finalization - Tag release and update changelog
[ ] - Phase 10: Finalization - Remove deprecated code after grace period

[ ] - Phase 10: PyBoy Rigor - Add `tick(count, render)` contract + tests
[ ] - Phase 10: PyBoy Rigor - Add frame-skip equivalence tests
[ ] - Phase 10: PyBoy Rigor - Add multi-instance isolation test
[ ] - Phase 10: PyBoy Rigor - Add memory view bounds tests
[ ] - Phase 10: PyBoy Rigor - Add delayed input queue tests
[ ] - Phase 10: PyBoy Rigor - Add API error taxonomy tests
[ ] - Phase 10: PyBoy Rigor - Add headless throughput baseline

## Ensuring No Regressions

### Contract Safety

- **Zod schemas** for every public payload.
- Versioned contracts (`contracts/v1`, `contracts/v2`).
- `contract-check` CLI command to validate schema compliance.

### Quality Gates

- ESLint with `@typescript-eslint` in strict mode.
- Enforce `no-magic-numbers` and restricted literal rules for strings.
- Ban `any` and type assertions in public APIs.
- Prettier for formatting; no formatting exceptions.

### Behavioral Tests

- Golden tests for:
  - Snapshot shape and checksums
  - Known ROM output samples
  - Timing and accuracy metrics
- Keep existing tests:
  - `npm run test:accuracy`
  - `npm run test:performance`
  - `npm run test:integration`
  - `npm run test:core`

### PyBoy-Inspired Rigor Checklist

- **Headless parity**: add tests for `tick(count, render=false)` behavior and
  verify deterministic snapshots when rendering is disabled.
- **Frame-skip correctness**: verify logic consistency across `tick(1)` vs
  `tick(n)` with render-on-last-frame semantics.
- **Multi-instance stability**: run two emulators side-by-side and ensure no
  shared state or cross-talk.
- **Memory view API**: test read/write slices with bounds checks and clear
  error types for invalid access.
- **Input queue**: verify delayed input scheduling and release semantics.
- **Error taxonomy**: assert `InvalidInput`, `InvalidOperation`, and
  `OutOfBounds` errors at API boundaries.
- **Perf budget tests**: keep `test:performance` thresholds and add a
  headless throughput baseline (frames/sec) for regression detection.

#### PyBoy Rigor Tasks (Actionable)

- [ ] Add `tick(count, render)` contract and unit tests for headless parity.
- [ ] Add frame-skip equivalence tests (`tick(1)` vs `tick(n)`).
- [ ] Add multi-instance isolation test (no shared state across instances).
- [ ] Add memory view bounds tests (read/write, out-of-bounds errors).
- [ ] Add delayed input queue tests (press/release scheduling).
- [ ] Add API error taxonomy tests (`InvalidInput`, `InvalidOperation`, `OutOfBounds`).
- [ ] Add headless throughput regression baseline (frames/sec).

### Incremental Release Plan

- Ship TypeScript conversions behind a compatibility wrapper.
- Gate Next.js debugger as a new optional package/app.
- Minimize breaking changes and announce in a migration guide.

## Typed API Contracts (Example)

```ts
// packages/api/src/schemas/ppuSnapshot.ts
import { z } from "zod";

export const PpuSnapshotSchema = z.object({
  frameId: z.number().int(),
  timestampMs: z.number(),
  mode: z.number().int(),
  registers: z.object({
    lcdc: z.number().int(),
    stat: z.number().int(),
    scy: z.number().int(),
    scx: z.number().int(),
    ly: z.number().int(),
    lyc: z.number().int(),
    wy: z.number().int(),
    wx: z.number().int(),
    bgp: z.number().int(),
    obp0: z.number().int(),
    obp1: z.number().int(),
  }),
  vramChecksum: z.string(),
  oamChecksum: z.string(),
});

export type PpuSnapshot = z.infer<typeof PpuSnapshotSchema>;
```

## Debugging + AI/LLM Integration Strategy

- **Structured, typed payloads** with explicit limits.
- **Deterministic snapshots** with checksums for reproducibility.
- **Event stream** for UI and AI tooling (frame-by-frame).
- **Read-only safety** for AI endpoints.
- **Redaction hooks** for any sensitive data (if ROMs are proprietary).

## Packages to Leverage

### Core / Build
- `typescript` with strict mode.
- `tsup` or `esbuild` for fast TS builds.
- `rollup` for WASM wrapper bundling (already present).
- `vitest` for fast unit tests.
- `zod` for runtime schema validation.
- `zustand` for state management.
- `eslint` + `@typescript-eslint/*` for quality gates.
- `eslint-plugin-unicorn` for safer defaults (optional).
- `renovate` or `dependabot` for keeping versions current.

### Debugging + Instrumentation
- `@sentry/browser` or `@sentry/node` for error tracking (optional).
- `pino` for structured logs in CLI (optional).
- `protobuf` or `msgpack` if snapshot payload size becomes heavy.

### Developer Experience
- `turborepo` or `pnpm` workspaces for monorepo management.
- `eslint` + `prettier` for formatting and linting.
- `changesets` for versioning and publishing.

## Modern TypeScript Patterns (Keep It Simple)

- Use `satisfies` for config objects to avoid over-widening types.
- Prefer discriminated unions for event payloads and message channels.
- Use `readonly` arrays and `as const` for constant maps.
- Avoid class-based patterns unless they reduce complexity.
- Prefer pure functions with explicit inputs/outputs over hidden state.

## Performance Guardrails

- Favor typed arrays and views for WASM memory access.
- Avoid per-frame object allocations in snapshot hot paths.
- Batch reads using `_getWasmMemorySection` and reuse buffers when safe.
- Measure performance before and after each phase using existing tests.

## Dependency Policy (Value-Driven)

- Add a dependency only if it reduces complexity or measurably improves
  performance, safety, or maintenance.
- Prefer small, single-purpose packages with stable APIs.
- Keep versions current and remove unused dependencies promptly.

## Compatibility Notes

- **Do not** change `core/constants.ts` memory layout unless all wrapper offsets
  and snapshot readers are updated in lockstep.
- Snapshot reads must use `_getWasmConstant` and `_getWasmMemorySection`.
- Always tolerate worker readiness delays (retry or return `null`).
- Keep `getPpuSnapshot()` behavior backward compatible and return `null` when
  unavailable.

## Risk Areas

- WASM memory layout drift.
- Snapshot shape or timing changes that break downstream consumers.
- Debug tooling that mutates core state or introduces timing regressions.

## Recommended Success Criteria

- All existing tests pass.
- Golden snapshots match within acceptable thresholds.
- Contracts validated with Zod in CI.
- No breaking API changes without version bump.

## Optional Future Enhancements

- Record/replay input sessions for deterministic debugging.
- Streaming snapshot export for time-series analysis.
- Dedicated "AI debug console" in the Next.js app.
