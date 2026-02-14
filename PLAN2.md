# Migration Execution Plan (Combined)

This document combines the migration plan and detailed task checklist into a
single source of truth. Use it to track progress and preserve design intent.

## How to Work This Plan

1. Pick the next unchecked task (`[ ]`).
2. Do the work in a branch or locally as needed.
3. Run the most relevant tests for that task.
4. Commit the change with a clear message.
5. Update this file: mark the task `[x]`.
6. Move to the next task.
7. Do not stop until everything is `[x]`.
8. This plan is living. Add new tasks when discovered and complete them too.

## Completion status (review 2026-02-13)

This plan assumed work under `migration/` with Bun. The repo instead completed equivalent work at **repo root** with pnpm (see PLAN.md). Phases 0–10 are **effectively complete** per PLAN.md; Phase 11 (TypeScript migration) is not started. For remaining work (S1/S2, task182–200) and consolidated research findings, see **PLAN44.md**.

## Reference Info (Why + Constraints)

### Goals

1. Keep emulator correctness and memory layout unchanged.
2. Preserve API contracts for existing consumers (ex: `gameboy-remix`).
3. Add typed, validated, versioned APIs (Zod schemas + generated types).
4. Provide deep debugging and structured snapshots for AI/LLM tooling.
5. Introduce a CLI for headless testing and regression detection.
6. Enforce modern TypeScript quality standards (DRY, KISS, no magic numbers).
7. Maintain performance parity or better for hot paths.

### Engineering Principles (Quality First)

- DRY: consolidate repeated logic into small helpers in `packages/shared/`.
- KISS: avoid heavy abstractions; prefer plain functions and explicit types.
- No magic numbers/strings: use named constants for non-hardware values.
- Performance-minded: avoid unnecessary allocations and object churn in loops.
- Explicit contracts: public APIs must be fully typed and runtime-validated.
- Zero `any`: use `unknown` and narrow; avoid type assertions (`as`).

### No Magic Numbers/Strings Policy

- Hardware addresses remain as named constants and grouped by subsystem.
- All other literals should be defined in `packages/shared/constants/`.
- Prefer enums or `as const` maps for string unions (e.g. event names).
- Use Biome rules for magic numbers and naming (e.g. no magic numbers, prevent abbreviations where applicable).

### Migration Isolation (Where to Build)

**All new migration work lives under `migration/` until the project is done.** The
existing tree (`core/`, `lib/`, `demo/`, `dist/`, `build/`, current rollup
setup) stays untouched so that:

- Current consumers (e.g. `gameboy-remix`) and existing tests keep working.
- We can merge or cut over only after Phase 10 finalization and a chosen grace period.
- Rollback is trivial: ignore or remove `migration/` and keep using the current build.

Do not add new apps or packages at repo root until the migration is finalized and
the plan says to cut over (move `migration/*` into place and retire deprecated paths).

### Proposed Target Architecture (High Level)

**During migration** (all of this under `migration/`):

```
repo/
  core/                     (AssemblyScript WASM core, unchanged)
  lib/                      (JS/TS wrapper + workers, unchanged until cutover)
  demo/                     (existing debugger/demos, unchanged)
  migration/                (isolated until project is done; Bun + Biome + bun test)
    apps/
      debugger/             (Next.js + React + shadcn + Zustand)
    packages/
      api/                  (Zod schemas + types + client)
      cli/                  (Node CLI for snapshot/test automation)
      shared/                (shared utilities, constants)
    tools/                  (scripts, dev utilities)
```

**After finalization** (Phase 10 + grace period): promote `migration/apps` → `apps/`,
`migration/packages` → `packages/`, `migration/tools` → `tools/` as needed; then
retire or redirect old paths (e.g. `demo/debugger`) per the compatibility phase.

### Performance Guardrails

- Favor typed arrays and views for WASM memory access.
- Avoid per-frame object allocations in snapshot hot paths.
- Batch reads using `_getWasmMemorySection` and reuse buffers when safe.
- Measure performance before and after each phase using existing tests.

### Dependency Policy (Value-Driven)

- Add a dependency only if it reduces complexity or measurably improves
  performance, safety, or maintenance.
- Prefer small, single-purpose packages with stable APIs.
- Keep versions current and remove unused dependencies promptly.

### Tech Stack (Migration / New Work)

All new work under `migration/` uses this stack:

| Concern        | Choice        | Notes                                                |
|----------------|---------------|------------------------------------------------------|
| Runtime / PM   | **Bun**       | Package manager, scripts, and runtime for migration. |
| Tests          | **bun test**  | Built-in test runner; no separate test framework.   |
| Lint / Format  | **Biome**     | Single tool for lint + format (no ESLint/Prettier). |
| App framework  | **Next.js**   | App Router for the debugger app.                     |
| UI library     | **React**     | Components for debugger UI.                         |
| Components     | **shadcn/ui** | Accessible, customizable React components.           |
| State          | **Zustand**   | Lightweight store for debugger state.               |

Existing repo (outside `migration/`) keeps current tooling (npm, rollup, etc.)
until cutover.

## Tasks (0% → 100%)

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

[ ] - Phase 0.5: Repo Scaffolding - Create `migration/` directory (all new work lives here)
[ ] - Phase 0.5: Repo Scaffolding - Add Bun workspace under `migration/` (e.g. `migration/package.json` + workspaces)
[ ] - Phase 0.5: Repo Scaffolding - Add workspace config file(s) under `migration/`
[ ] - Phase 0.5: Repo Scaffolding - Add `migration/tsconfig.base.json` (strict)
[ ] - Phase 0.5: Repo Scaffolding - Add TS project references for `migration/`
[ ] - Phase 0.5: Repo Scaffolding - Add Biome config for `migration/` (lint + format, TS + React)
[ ] - Phase 0.5: Repo Scaffolding - Add `.editorconfig` for whitespace rules
[ ] - Phase 0.5: Repo Scaffolding - Pin Bun version (e.g. in `migration/package.json` or root)
[ ] - Phase 0.5: Repo Scaffolding - Add root scripts that delegate to `migration/` tasks (e.g. `bun run` in migration)
[ ] - Phase 0.5: Repo Scaffolding - Add `changeset` config (if publishing)

[ ] - Phase 1: Contracts + Types - Create `migration/packages/api` skeleton
[ ] - Phase 1: Contracts + Types - Add `migration/packages/api/contracts/v1` directory
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
[ ] - Phase 2.5: Build + Packaging - Add `test` script using `bun test`
[ ] - Phase 2.5: Build + Packaging - Add publish metadata (name/version/files)
[ ] - Phase 2.5: Build + Packaging - Add `sideEffects` metadata if needed
[ ] - Phase 2.5: Build + Packaging - Add `tsconfig.build.json` per package

[ ] - Phase 3: Next.js Debugger - Create `migration/apps/debugger` skeleton (Next.js + React)
[ ] - Phase 3: Next.js Debugger - Configure Next.js (app router) in `migration/apps/debugger`
[ ] - Phase 3: Next.js Debugger - Add shadcn/ui and global styles/layout
[ ] - Phase 3: Next.js Debugger - Add top-level routing and nav
[ ] - Phase 3: Next.js Debugger - Add error boundary and fallback UI
[ ] - Phase 3: Next.js Debugger - Configure WASM asset handling
[ ] - Phase 3: Next.js Debugger - Configure worker loading strategy
[ ] - Phase 3: Next.js Debugger - Add ROM loader UI (React + shadcn)
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

[ ] - Phase 5: CLI - Create `migration/packages/cli` skeleton
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
[ ] - Phase 8: Tooling - Add Biome (lint + format) for `migration/` packages
[ ] - Phase 8: Tooling - Add strict TS config per package
[ ] - Phase 8: Tooling - Add CI workflow for lint/typecheck/tests
[ ] - Phase 8: Tooling - Add build caching for workspace tasks
[ ] - Phase 8: Tooling - Add release automation (changesets)
[ ] - Phase 8: Tooling - Audit and replace vulnerable/deprecated packages

[ ] - Phase 9: Documentation - Update migration progress links
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
