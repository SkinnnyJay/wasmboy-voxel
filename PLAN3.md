# Migration Execution Plan v3 (Order of Operations, TypeScript Last)

This plan consolidates PLAN.md, PLAN2.md, and MIGRATE_TO_TYPESCRIPT.md into a single
execution order. **All new work lives under `migration/` until finalization.**
TypeScript conversion of the existing `lib/` is **last** (Phase 11).

## Status Overview

| Source     | Completed | Notes                                      |
|-----------|-----------|--------------------------------------------|
| PLAN.md  | 0%        | All tasks unchecked                        |
| PLAN2.md  | 0%        | All tasks unchecked; migration/ not started |
| MIGRATE   | 0%        | Design doc; no tasks marked done            |

**Conclusion:** Phases 0–10 are **effectively complete** (executed at repo root per PLAN.md; this doc assumed `migration/`). Phase 11 (TypeScript migration) is not started. Remaining work: PLAN.md S1/S2 and backlog task182–200; see **PLAN44.md** for consolidated incomplete items and research findings.

---

## What You Get (Outcomes)

When the plan is complete you have:

| Outcome | Where it lives / How you use it |
|--------|----------------------------------|
| **Versioned, validated API** | `migration/packages/api`: Zod schemas for `PpuSnapshot`, `Registers`, `MemorySection`, `DebugFrame`; inferred TS types; runtime validation at wrapper boundaries. |
| **Contract-safe wrapper** | Existing wrapper + optional contract gates (dev flag); `supportsPpuSnapshot()` guards; same behavior for consumers; optional `compat` layer. |
| **New debugger app** | `migration/apps/debugger`: Next.js + React + shadcn, ROM loader, emulator view, registers, memory viewer, snapshot timeline, event log; typed client from `packages/api`. |
| **Debug state + AI surface** | Zustand store, frame metadata, checksums, event stream; read-only AI debug endpoint; JSONL export; sandbox mode and rate limiting. |
| **Headless CLI** | `migration/packages/cli`: `run <rom>`, `snapshot <rom>`, `compare <baseline>`, `contract-check`; structured logs; safe errors; CI-friendly. |
| **Regression safety** | Golden snapshot tests, checksum regressions, contract validation tests, CLI regressions, debugger smoke tests; existing accuracy/integration/core tests still pass. |
| **Compatibility + policy** | Deprecation warnings (dev-only), gameboy-remix migration notes, backwards-compat tests, documented breaking-change policy. |
| **Strict TypeScript lib** | `lib/` fully typed (Phase 11); strict config; no `any` in public API; types aligned with contracts; root `typecheck` script. |
| **PyBoy-style rigor** | Tests for `tick(count, render)`, frame-skip equivalence, multi-instance isolation, memory bounds, input queue, error taxonomy, throughput baseline. |
| **Single-command workflow** | Migration: `bun run build`, `bun run test`, `bun run typecheck`; root scripts to run migration tasks; CI for lint/typecheck/tests/contract-check. |
| **Documentation** | API usage, debugger usage, CLI usage, troubleshooting FAQ, progress links. |

**In short:** A typed, contract-validated emulator API; a modern debugger app; a CLI for regression and contracts; full regression and compatibility coverage; then a fully TypeScript `lib/`—without breaking existing consumers until you choose to cut over.

---

## How to Work This Plan

1. Pick the next unchecked task (`[ ]`) in phase order.
2. Do the work in a branch or locally; keep new code under `migration/` (except Phase 11).
3. Run the tests and success checks listed for that phase.
4. Commit with a clear message; update this file to `[x]` for completed tasks.
5. Do not skip phases; do not start Phase 11 until Phase 10 is complete.
6. Add new tasks when discovered; treat this plan as living.

---

## Reference (Goals, Constraints, Stack)

### Goals

1. Keep emulator correctness and memory layout unchanged.
2. Preserve API contracts for existing consumers (e.g. `gameboy-remix`).
3. Add typed, validated, versioned APIs (Zod schemas + inferred types).
4. Provide deep debugging and structured snapshots for AI/LLM tooling.
5. Introduce a CLI for headless testing and regression detection.
6. Enforce modern TypeScript quality (DRY, KISS, no magic numbers).
7. Maintain performance parity or better for hot paths.

### Migration Isolation

All new migration work lives under **`migration/`** until the project is finalized.
Existing tree (`core/`, `lib/`, `demo/`, `dist/`, `build/`, current rollup) stays
untouched so current consumers and tests keep working. Do not add new apps or
packages at repo root until cutover (Phase 10 + grace period).

### Target Layout (Under `migration/`)

```
migration/
  apps/debugger/        Next.js + React + shadcn + Zustand
  packages/
    api/                Zod schemas + types + client
    cli/                Node CLI for snapshot/test automation
    shared/             Shared utilities, constants
  tools/                Scripts, dev utilities
```

### Tech Stack (Migration)

| Concern       | Choice      | Notes                                  |
|---------------|-------------|----------------------------------------|
| Runtime / PM  | Bun         | Package manager and runtime for migration. |
| Tests         | bun test    | Built-in test runner.                  |
| Lint / Format | Biome       | Single tool for lint + format.        |
| App           | Next.js     | App Router for debugger.               |
| UI            | React + shadcn/ui | Debugger components.            |
| State         | Zustand     | Debugger state.                        |

### Principles

- **DRY:** shared logic in `migration/packages/shared/`.
- **KISS:** plain functions, explicit types; avoid heavy abstractions.
- **No magic numbers/strings:** named constants; hardware addresses stay as documented constants.
- **Zero `any`:** use `unknown` and narrow; avoid type assertions (`as`).
- **Performance:** typed arrays for WASM access; avoid per-frame allocations in snapshot paths.

---

## Phase 0: Baseline (Discovery, No Behavior Changes)

**Objective:** Document current public API, snapshot shape, worker messages, and baseline metrics so later phases can preserve behavior.

### Tasks

- [ ] - Inventory public exports in `index.ts`
- [ ] - Inventory public exports in `voxel-wrapper.ts`
- [ ] - Inventory public exports in `lib/` entry points
- [ ] - List worker entry points and message schemas
- [ ] - Map current snapshot fields to memory sources (`_getWasmConstant`, `_getWasmMemorySection`)
- [ ] - Document current null/undefined behaviors (e.g. `getPpuSnapshot()` when worker not ready)
- [ ] - List ROMs used by existing tests/demos
- [ ] - Capture baseline snapshot JSON for each ROM
- [ ] - Record baseline checksums for VRAM/OAM
- [ ] - Record baseline timing/accuracy metrics
- [ ] - Write initial contract table (function → payload shape)

### Success Metrics

- All exports from `index.ts`, `voxel-wrapper.ts`, and lib entry points are listed in a baseline doc.
- Worker messages and snapshot field → memory source mapping are documented.
- At least one baseline snapshot JSON and checksum per ROM used in tests/demos.
- Contract table covers: `getPpuSnapshot`, `getRegisters`, `getMemorySection`, debug events.

### Testing

- Run existing suite to confirm no regressions: `npm run test:accuracy`, `npm run test:integration`, `npm run test:core`.
- Manually verify baseline snapshot files exist and checksums are reproducible for a fixed frame count.

---

## Phase 0.5: Repo Scaffolding (Migration Root)

**Objective:** Create `migration/` and workspace tooling so all later phases build and test there.

### Tasks

- [ ] - Create `migration/` directory
- [ ] - Add Bun workspace under `migration/` (`migration/package.json` + workspaces)
- [ ] - Add workspace config file(s) under `migration/`
- [ ] - Add `migration/tsconfig.base.json` (strict)
- [ ] - Add TS project references for `migration/`
- [ ] - Add Biome config for `migration/` (lint + format, TS + React)
- [ ] - Add `.editorconfig` for whitespace rules
- [ ] - Pin Bun version (e.g. in `migration/package.json` or root)
- [ ] - Add root scripts that delegate to `migration/` tasks (e.g. `bun run` in migration)
- [ ] - Add `changeset` config (if publishing)

### Success Metrics

- `cd migration && bun install` succeeds.
- `bun run build` (or equivalent) runs without error for migration workspace.
- `bun run lint` and format pass for any placeholder files under `migration/`.
- Root `package.json` has scripts that invoke migration tasks (e.g. `migration:build`, `migration:test`).

### Testing

- No existing repo tests are changed; run `npm run test:accuracy` and `npm run test:integration` from repo root to confirm isolation.

---

## Phase 1: Contracts + Types (Zod Schemas, No Lib Changes)

**Objective:** Define versioned API contracts and inferred TypeScript types under `migration/packages/api/`.

### Tasks

- [ ] - Create `migration/packages/api` skeleton
- [ ] - Add `migration/packages/api/contracts/v1` directory
- [ ] - Define `PpuSnapshot` schema in Zod
- [ ] - Define `Registers` schema in Zod
- [ ] - Define `MemorySection` schema in Zod
- [ ] - Define `DebugFrame` schema in Zod
- [ ] - Add schema version metadata
- [ ] - Export inferred TS types from schemas (e.g. `z.infer<typeof PpuSnapshotSchema>`)
- [ ] - Add schema validation helper (e.g. `validatePpuSnapshot(data)`)
- [ ] - Add contract registry (map of versions)
- [ ] - Document contract usage in README

### Success Metrics

- All snapshot and debug payloads used by the wrapper have a Zod schema and exported type.
- Validation helper returns typed result or clear validation errors.
- Contract registry allows selecting schema by version.
- README explains how to import schemas and validate payloads.

### Testing

- Unit tests: valid fixture objects pass schema parse; invalid shapes fail with expected errors.
- Run from migration workspace: `bun test packages/api` (or equivalent).

---

## Phase 2: Wrapper Integration (Contract Gates, Existing Lib)

**Objective:** Add contract validation at API boundaries in the **existing** wrapper; no conversion of lib to TS yet.

### Tasks

- [ ] - Identify all public wrapper entry points (from Phase 0)
- [ ] - Add contract gate for `getPpuSnapshot()` (validate with Zod when flag set)
- [ ] - Add contract gate for `getRegisters()`
- [ ] - Add contract gate for `getMemorySection()`
- [ ] - Add contract gate for debug events
- [ ] - Ensure `supportsPpuSnapshot()` guards all snapshot usage
- [ ] - Keep null return on worker readiness (no behavior change)
- [ ] - Add dev-only contract validation flag
- [ ] - Add `compat` wrapper for old API (if needed for gameboy-remix)

### Success Metrics

- With validation enabled (dev flag), invalid snapshot/registers/memory payloads are caught.
- With validation disabled or in production, behavior matches current (null when not ready, same shapes).
- `supportsPpuSnapshot()` remains the guard for snapshot APIs.
- Existing integration tests still pass: `npm run test:integration:voxel`, `npm run test:integration:lib`.

### Testing

- Run `npm run test:integration` and `npm run test:accuracy`.
- Optional: add a small test that enables validation and asserts valid snapshot passes and malformed data fails.

---

## Phase 2.5: Build + Packaging (Migration Packages)

**Objective:** Build and package migration packages (api, later cli) with ESM/CJS and types.

### Tasks

- [ ] - Add tsup or esbuild config for packages
- [ ] - Configure ESM/CJS outputs + `types`
- [ ] - Add `exports` maps for new packages
- [ ] - Add `typecheck` script for packages
- [ ] - Add `test` script using `bun test`
- [ ] - Add publish metadata (name, version, files)
- [ ] - Add `sideEffects` metadata if needed
- [ ] - Add `tsconfig.build.json` per package

### Success Metrics

- `bun run build` from migration root builds all packages.
- `bun run typecheck` passes.
- Package consumers can `import { PpuSnapshotSchema } from '@wasmboy-voxel/api'` (or chosen name) with types.

### Testing

- `bun test` in migration root passes.
- Smoke: build debugger app (Phase 3) that imports from `packages/api` and typechecks.

---

## Phase 3: Next.js Debugger App

**Objective:** New debugger UI under `migration/apps/debugger` using typed client and packages/api.

### Tasks

- [ ] - Create `migration/apps/debugger` skeleton (Next.js + React)
- [ ] - Configure Next.js (App Router) in `migration/apps/debugger`
- [ ] - Add shadcn/ui and global styles/layout
- [ ] - Add top-level routing and nav
- [ ] - Add error boundary and fallback UI
- [ ] - Configure WASM asset handling
- [ ] - Configure worker loading strategy
- [ ] - Add ROM loader UI (React + shadcn)
- [ ] - Add emulator view panel component
- [ ] - Add registers panel component
- [ ] - Add memory viewer component
- [ ] - Add snapshot timeline component
- [ ] - Add event log panel component
- [ ] - Wire typed client to `packages/api`

### Success Metrics

- Debugger app builds and runs (`bun run dev` or equivalent).
- Can load a ROM and see emulator view; registers and memory viewer show data.
- No use of `any`; client uses types from `packages/api`.
- WASM and workers load without console errors for happy path.

### Testing

- Manual smoke: load ROM, run a few frames, open panels.
- Optional: Playwright or similar E2E that loads app, loads ROM, checks for visible frame/registers (Phase 6 can add formal E2E).

---

## Phase 4: State + Events (Zustand, Debug Stream, AI-Safe)

**Objective:** Debugger state management, frame metadata, event stream, and read-only AI-friendly surface.

### Tasks

- [ ] - Add Zustand store for debugger state
- [ ] - Add selectors and actions for UI panels
- [ ] - Add frame metadata (timestamp, frame ID)
- [ ] - Add snapshot checksums (from contracts)
- [ ] - Add event stream for inputs/interrupts
- [ ] - Add read-only AI debug endpoint (typed, no mutations)
- [ ] - Add JSONL export for events/snapshots
- [ ] - Add debug sandbox mode (no mutations)
- [ ] - Add rate limiting for snapshot capture

### Success Metrics

- UI panels reflect Zustand state; actions update store predictably.
- Frame metadata and checksums appear in debug payloads.
- AI endpoint returns only typed, read-only data; no state mutation.
- JSONL export produces valid lines; sandbox mode prevents writes.

### Testing

- Unit tests for store selectors/actions.
- Integration test: enable sandbox, call AI endpoint, assert no mutation.
- Optional: snapshot export test (run N frames, export JSONL, validate schema per line).

---

## Phase 5: CLI (Headless Run, Snapshot, Compare, Contract Check)

**Objective:** Node CLI under `migration/packages/cli` for regression and contract validation.

### Tasks

- [ ] - Create `migration/packages/cli` skeleton
- [ ] - Add CLI argument parser and command router
- [ ] - Implement `run <rom>` command
- [ ] - Implement `snapshot <rom>` command
- [ ] - Implement `compare <baseline>` command
- [ ] - Implement `contract-check` command
- [ ] - Add structured logging output
- [ ] - Add ROM path validation and safe errors
- [ ] - Add `bin` entry + packaging metadata
- [ ] - Add help text and usage examples

### Success Metrics

- `wasmboy-voxel run <rom>` runs headless for a configurable duration.
- `wasmboy-voxel snapshot <rom>` produces snapshot JSON that passes contract validation.
- `wasmboy-voxel compare <baseline>` exits 0 when current matches baseline, non-zero otherwise.
- `wasmboy-voxel contract-check` validates all contract schemas and exits 0.
- Invalid ROM path or invalid args produce clear errors, no crashes.

### Testing

- CLI tests: run, snapshot, compare, contract-check with fixture ROMs.
- Contract-check must pass when schemas are valid; snapshot output must validate against PpuSnapshot (and related) schemas.

---

## Phase 6: Regression Safety (Golden, Checksums, Contract, E2E)

**Objective:** Lock behavior with golden snapshots, checksums, contract tests, and debugger smoke tests.

### Tasks

- [ ] - Add golden snapshot tests (compare to Phase 0 baselines)
- [ ] - Add checksum regression tests (VRAM/OAM)
- [ ] - Add contract validation tests (all schemas, valid/invalid fixtures)
- [ ] - Add headless CLI regression tests
- [ ] - Add Next.js debugger smoke tests (E2E or build + load)
- [ ] - Add CI job for contract checks
- [ ] - Ensure existing test suites still pass (`test:accuracy`, `test:integration`, `test:core`)

### Success Metrics

- Golden tests fail when snapshot shape or checksums change without baseline update.
- Contract tests cover all v1 schemas; CI runs contract-check.
- Existing repo tests unchanged and passing.
- Debugger smoke test (e.g. build + load ROM) runs in CI.

### Testing

- Run full migration test suite and full repo test suite; both green.
- CI: lint, typecheck, migration tests, contract-check, existing accuracy/integration/core tests.

---

## Phase 7: Compatibility (Deprecation, gameboy-remix, Policy)

**Objective:** Document deprecations, migration path for gameboy-remix, and breaking-change policy.

### Tasks

- [ ] - Add deprecation warnings (dev-only) for any APIs to be retired
- [ ] - Add migration notes for `gameboy-remix` (how to move to new API/contracts)
- [ ] - Add backwards-compat test coverage (existing entry points still work)
- [ ] - Document breaking change policy (versioning, changelog, grace period)

### Success Metrics

- Consumers using current public API still pass compat tests.
- Migration doc exists for gameboy-remix; no breaking change without version bump and doc update.
- Deprecation warnings are visible only in dev or when opt-in flag is set.

### Testing

- Backwards-compat tests: call existing wrapper API from test; assert shapes and null behavior unchanged.
- Run existing integration and voxel tests again.

---

## Phase 8: Tooling (Scripts, Lint, CI, Caching, Release)

**Objective:** Single-command dev/build/test, lint/format, CI, and release automation.

### Tasks

- [ ] - Add workspace scripts (`dev`, `build`, `test`) in migration and/or root
- [ ] - Add Biome (lint + format) for `migration/` packages
- [ ] - Add strict TS config per package
- [ ] - Add CI workflow for lint, typecheck, tests (migration + existing)
- [ ] - Add build caching for workspace tasks (if applicable)
- [ ] - Add release automation (changesets)
- [ ] - Audit and replace vulnerable/deprecated packages

### Success Metrics

- One command to run all migration tests; one to build all migration artifacts.
- CI runs on PR: lint, typecheck, migration tests, contract-check, existing accuracy/integration/core.
- No high/critical vulnerabilities in dependencies; deprecated packages replaced or documented.

### Testing

- CI green for a dummy PR (lint, typecheck, tests).
- Local: `bun run build`, `bun run test`, `bun run typecheck` (or root equivalents) succeed.

---

## Phase 9: Documentation (Guides, FAQ, Progress)

**Objective:** Usage guides and troubleshooting so adopters and AI tooling can use the new stack.

### Tasks

- [ ] - Update migration progress links (e.g. in MIGRATE_TO_TYPESCRIPT.md)
- [ ] - Add `packages/api` usage guide
- [ ] - Add debugger usage guide
- [ ] - Add CLI usage guide
- [ ] - Add troubleshooting FAQ

### Success Metrics

- New contributors can follow docs to run debugger, run CLI, and validate contracts.
- API guide shows how to import schemas, validate payloads, and use types.
- FAQ covers common failures (worker not ready, WASM load, ROM format).

### Testing

- Doc review only; optional link-check or build-the-docs step in CI.

---

## Phase 10: Finalization + PyBoy Rigor

**Objective:** Ship-ready state: all tests pass, contract checks in CI, changelog, and PyBoy-style rigor tests.

### Tasks (Finalization)

- [ ] - Verify all tests + contract checks pass (migration and existing)
- [ ] - Tag release and update changelog
- [ ] - Remove deprecated code after grace period (or document timeline)

### Tasks (PyBoy Rigor)

- [ ] - Add `tick(count, render)` contract + tests (headless parity)
- [ ] - Add frame-skip equivalence tests (`tick(1)` vs `tick(n)`)
- [ ] - Add multi-instance isolation test (no shared state)
- [ ] - Add memory view bounds tests (read/write, out-of-bounds errors)
- [ ] - Add delayed input queue tests (press/release scheduling)
- [ ] - Add API error taxonomy tests (InvalidInput, InvalidOperation, OutOfBounds)
- [ ] - Add headless throughput baseline (frames/sec) for regression

### Success Metrics

- All Phase 0–9 success metrics still met.
- PyBoy rigor tests in place and passing.
- Changelog and release tag reflect current state; deprecation timeline clear.

### Testing

- Full regression run: accuracy, integration, core, migration suite, contract-check, CLI, debugger smoke, PyBoy rigor tests.
- Throughput baseline recorded and CI fails if below threshold (optional).

---

## Phase 11: TypeScript Migration (Last)

**Objective:** Convert existing `lib/` (and any remaining JS) to strict TypeScript; remove `any`; align with contracts and voxel-wrapper types. This phase is **last** so that contracts, wrapper integration, and tooling are stable first.

### Tasks

- [ ] - Create `lib/` TypeScript config (strict; no `any`; project references if needed)
- [ ] - Convert lib entry points to `.ts` with explicit types
- [ ] - Convert worker entry points to `.ts`; type message schemas (align with Phase 0 docs)
- [ ] - Type all snapshot and memory paths used by voxel-wrapper (use contracts from packages/api where applicable)
- [ ] - Remove all `any` and unsafe type assertions in `lib/`
- [ ] - Add shared types/constants in `lib/` or from `migration/packages/shared` (no magic numbers for non-hardware)
- [ ] - Ensure `voxel-wrapper.ts` and `index.ts` consume typed lib; no new `any`
- [ ] - Add `npm run typecheck` (or equivalent) for repo root that includes lib
- [ ] - Update Prettier/ESLint (or Biome) to include `lib/**/*.ts` if not already
- [ ] - Document any remaining intentional `unknown` or narrowings

### Success Metrics

- `lib/` builds and typechecks with strict TypeScript; no `any` in public API or snapshot paths.
- All existing tests pass: `npm run test:accuracy`, `npm run test:integration`, `npm run test:core`.
- voxel-wrapper and index.ts have no type errors; consumer (gameboy-remix) can rely on typed exports.
- Snapshot and register types align with Zod schemas in `migration/packages/api` (or documented divergence).

### Testing

- `npm run typecheck` (root) passes.
- `npm run test:accuracy`, `npm run test:integration`, `npm run test:integration:voxel`, `npm run test:core` pass.
- Optional: add a small test that imports public API from `index.ts` and asserts types (e.g. `getPpuSnapshot` return type).

### Notes

- Do not change `core/constants.ts` memory layout; if constants change, update wrapper offsets and snapshot readers together.
- Keep worker readiness behavior: snapshot APIs return `null` when worker not ready; document in types (e.g. `getPpuSnapshot(): PpuSnapshot | null`).

---

## Summary: Order of Operations

| Phase | Name                    | Dependency        |
|-------|-------------------------|-------------------|
| 0     | Baseline                | —                 |
| 0.5   | Repo Scaffolding        | 0                 |
| 1     | Contracts + Types      | 0, 0.5            |
| 2     | Wrapper Integration     | 0, 1              |
| 2.5   | Build + Packaging      | 1                 |
| 3     | Next.js Debugger       | 1, 2.5            |
| 4     | State + Events         | 3                 |
| 5     | CLI                     | 1, 2.5            |
| 6     | Regression Safety      | 0–5               |
| 7     | Compatibility           | 2, 6              |
| 8     | Tooling                 | 2.5, 6            |
| 9     | Documentation           | 1–8               |
| 10    | Finalization + PyBoy   | 0–9               |
| **11**| **TypeScript Migration**| **0–10** (last)  |

---

## Recommended Success Criteria (Overall)

- All existing tests pass at every phase.
- Golden snapshots and checksums match within accepted thresholds (or baselines updated intentionally).
- Contracts validated with Zod in CI; contract-check command exits 0.
- No breaking API changes without version bump and migration notes.
- Phase 11 complete: lib is strict TypeScript, no `any` in public surface, types aligned with contracts.
