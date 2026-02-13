# Migration Execution Plan

## How to Work This Plan

1. Pick the next unchecked task (`[ ]`).
2. Do the work in a branch or locally as needed.
3. Run the most relevant tests for that task.
4. Commit the change with a clear message.
5. Update this file: mark the task `[x]`.
6. Move to the next task.
7. Do not stop until everything is `[x]`.
8. This plan is living. Add new tasks when discovered and complete them too.

## Tasks (0% → 100%)

[x] - Milestone 0: Baseline - Inventory public exports in `index.ts` (see `docs/migration/milestone-0-baseline-api-inventory.md`)
[x] - Milestone 0: Baseline - Inventory public exports in `voxel-wrapper.ts` (see `docs/migration/milestone-0-baseline-api-inventory.md`)
[x] - Milestone 0: Baseline - Inventory public exports in `lib/` entry points (see `docs/migration/milestone-0-baseline-api-inventory.md`)
[ ] - Milestone 0: Baseline - List worker entry points and message schemas
[ ] - Milestone 0: Baseline - Map current snapshot fields to memory sources
[ ] - Milestone 0: Baseline - Document current null/undefined behaviors
[ ] - Milestone 0: Baseline - List ROMs used by existing tests/demos
[ ] - Milestone 0: Baseline - Capture baseline snapshot JSON for each ROM
[ ] - Milestone 0: Baseline - Record baseline checksums for VRAM/OAM
[ ] - Milestone 0: Baseline - Record baseline timing/accuracy metrics
[ ] - Milestone 0: Baseline - Write initial contract table (function → payload)

[ ] - Milestone 0.5: Repo Scaffolding - Decide workspace tool (pnpm vs turborepo)
[ ] - Milestone 0.5: Repo Scaffolding - Add workspace config file(s)
[ ] - Milestone 0.5: Repo Scaffolding - Add root `tsconfig.base.json` (strict)
[ ] - Milestone 0.5: Repo Scaffolding - Add root TS project references
[ ] - Milestone 0.5: Repo Scaffolding - Add root ESLint config (TS + React)
[ ] - Milestone 0.5: Repo Scaffolding - Add root Prettier config for new packages
[ ] - Milestone 0.5: Repo Scaffolding - Add `.editorconfig` for whitespace rules
[ ] - Milestone 0.5: Repo Scaffolding - Add Node version pin (`.nvmrc` or `engines`)
[ ] - Milestone 0.5: Repo Scaffolding - Add root scripts for new stack tasks
[ ] - Milestone 0.5: Repo Scaffolding - Add `changeset` config (if publishing)

[ ] - Milestone 1: Contracts + Types - Create `packages/api` skeleton
[ ] - Milestone 1: Contracts + Types - Add `contracts/v1` directory
[ ] - Milestone 1: Contracts + Types - Define `PpuSnapshot` schema in Zod
[ ] - Milestone 1: Contracts + Types - Define `Registers` schema in Zod
[ ] - Milestone 1: Contracts + Types - Define `MemorySection` schema in Zod
[ ] - Milestone 1: Contracts + Types - Define `DebugFrame` schema in Zod
[ ] - Milestone 1: Contracts + Types - Add schema version metadata
[ ] - Milestone 1: Contracts + Types - Export inferred TS types from schemas
[ ] - Milestone 1: Contracts + Types - Add schema validation helper
[ ] - Milestone 1: Contracts + Types - Add contract registry (map of versions)
[ ] - Milestone 1: Contracts + Types - Document contract usage in README

[ ] - Milestone 2: Wrapper Integration - Identify all public wrapper entry points
[ ] - Milestone 2: Wrapper Integration - Add contract gate for `getPpuSnapshot()`
[ ] - Milestone 2: Wrapper Integration - Add contract gate for `getRegisters()`
[ ] - Milestone 2: Wrapper Integration - Add contract gate for `getMemorySection()`
[ ] - Milestone 2: Wrapper Integration - Add contract gate for debug events
[ ] - Milestone 2: Wrapper Integration - Ensure `supportsPpuSnapshot()` guards
[ ] - Milestone 2: Wrapper Integration - Keep null return on worker readiness
[ ] - Milestone 2: Wrapper Integration - Add dev-only contract validation flag
[ ] - Milestone 2: Wrapper Integration - Add `compat` wrapper for old API

[ ] - Milestone 2.5: Build + Packaging - Add tsup/esbuild config for packages
[ ] - Milestone 2.5: Build + Packaging - Configure ESM/CJS outputs + `types`
[ ] - Milestone 2.5: Build + Packaging - Add `exports` maps for new packages
[ ] - Milestone 2.5: Build + Packaging - Add `typecheck` script for packages
[ ] - Milestone 2.5: Build + Packaging - Add `test` runner (vitest/jest)
[ ] - Milestone 2.5: Build + Packaging - Add publish metadata (name/version/files)
[ ] - Milestone 2.5: Build + Packaging - Add `sideEffects` metadata if needed
[ ] - Milestone 2.5: Build + Packaging - Add `tsconfig.build.json` per package

[ ] - Milestone 3: Next.js Debugger - Create `apps/debugger` skeleton
[ ] - Milestone 3: Next.js Debugger - Configure Next.js (app router)
[ ] - Milestone 3: Next.js Debugger - Add global styles and layout
[ ] - Milestone 3: Next.js Debugger - Add top-level routing and nav
[ ] - Milestone 3: Next.js Debugger - Add error boundary and fallback UI
[ ] - Milestone 3: Next.js Debugger - Configure WASM asset handling
[ ] - Milestone 3: Next.js Debugger - Configure worker loading strategy
[ ] - Milestone 3: Next.js Debugger - Add ROM loader UI
[ ] - Milestone 3: Next.js Debugger - Add emulator view panel component
[ ] - Milestone 3: Next.js Debugger - Add registers panel component
[ ] - Milestone 3: Next.js Debugger - Add memory viewer component
[ ] - Milestone 3: Next.js Debugger - Add snapshot timeline component
[ ] - Milestone 3: Next.js Debugger - Add event log panel component
[ ] - Milestone 3: Next.js Debugger - Wire typed client to `packages/api`

[ ] - Milestone 4: State + Events - Add Zustand store for debugger state
[ ] - Milestone 4: State + Events - Add selectors and actions for UI panels
[ ] - Milestone 4: State + Events - Add frame metadata (timestamp/frame ID)
[ ] - Milestone 4: State + Events - Add snapshot checksums
[ ] - Milestone 4: State + Events - Add event stream for inputs/interrupts
[ ] - Milestone 4: State + Events - Add read-only AI debug endpoint
[ ] - Milestone 4: State + Events - Add JSONL export for events/snapshots
[ ] - Milestone 4: State + Events - Add debug sandbox mode (no mutations)
[ ] - Milestone 4: State + Events - Add rate limiting for snapshot capture

[ ] - Milestone 5: CLI - Create `packages/cli` skeleton
[ ] - Milestone 5: CLI - Add CLI argument parser and command router
[ ] - Milestone 5: CLI - Implement `run <rom>` command
[ ] - Milestone 5: CLI - Implement `snapshot <rom>` command
[ ] - Milestone 5: CLI - Implement `compare <baseline>` command
[ ] - Milestone 5: CLI - Implement `contract-check` command
[ ] - Milestone 5: CLI - Add structured logging output
[ ] - Milestone 5: CLI - Add ROM path validation and safe errors
[ ] - Milestone 5: CLI - Add `bin` entry + packaging metadata
[ ] - Milestone 5: CLI - Add help text and usage examples

[ ] - Milestone 6: Regression Safety - Add golden snapshot tests
[ ] - Milestone 6: Regression Safety - Add checksum regression tests
[ ] - Milestone 6: Regression Safety - Add contract validation tests
[ ] - Milestone 6: Regression Safety - Add headless CLI regression tests
[ ] - Milestone 6: Regression Safety - Add Next.js debugger smoke tests
[ ] - Milestone 6: Regression Safety - Add CI job for contract checks
[ ] - Milestone 6: Regression Safety - Ensure existing test suites still pass

[ ] - Milestone 7: Compatibility - Add deprecation warnings (dev-only)
[ ] - Milestone 7: Compatibility - Add migration notes for `gameboy-remix`
[ ] - Milestone 7: Compatibility - Add backwards-compat test coverage
[ ] - Milestone 7: Compatibility - Document breaking change policy

[ ] - Milestone 8: Tooling - Add workspace scripts (`dev`, `build`, `test`)
[ ] - Milestone 8: Tooling - Add lint + prettier for new packages
[ ] - Milestone 8: Tooling - Add strict TS config per package
[ ] - Milestone 8: Tooling - Add CI workflow for lint/typecheck/tests
[ ] - Milestone 8: Tooling - Add build caching for workspace tasks
[ ] - Milestone 8: Tooling - Add release automation (changesets)

[ ] - Milestone 9: Documentation - Update `MIGRATE_TO_TYPESCRIPT.md` progress links
[ ] - Milestone 9: Documentation - Add `packages/api` usage guide
[ ] - Milestone 9: Documentation - Add debugger usage guide
[ ] - Milestone 9: Documentation - Add CLI usage guide
[ ] - Milestone 9: Documentation - Add troubleshooting FAQ

[ ] - Milestone 10: Finalization - Verify all tests + contract checks pass
[ ] - Milestone 10: Finalization - Tag release and update changelog
[ ] - Milestone 10: Finalization - Remove deprecated code after grace period

## Execution Log

- 2026-02-13: Completed M0-01, M0-02, M0-03 by creating baseline API inventory doc. Reason: lock down current public contract surfaces before migration refactors.
