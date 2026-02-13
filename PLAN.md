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
[x] - Milestone 0: Baseline - List worker entry points and message schemas (see `docs/migration/milestone-0-baseline-api-inventory.md`)
[x] - Milestone 0: Baseline - Map current snapshot fields to memory sources (see `docs/migration/milestone-0-baseline-api-inventory.md`)
[x] - Milestone 0: Baseline - Document current null/undefined behaviors (see `docs/migration/milestone-0-baseline-api-inventory.md`)
[x] - Milestone 0: Baseline - List ROMs used by existing tests/demos (see `docs/migration/milestone-0-baseline-api-inventory.md`)
[x] - Milestone 0: Baseline - Capture baseline snapshot JSON for each ROM (available local ROMs; see `test/baseline/snapshots/*.snapshot.json`)
[x] - Milestone 0: Baseline - Record baseline checksums for VRAM/OAM (see `test/baseline/snapshots/summary.json`)
[x] - Milestone 0: Baseline - Record baseline timing/accuracy metrics (see `test/baseline/snapshots/summary.json`)
[x] - Milestone 0: Baseline - Write initial contract table (function → payload) (see `docs/migration/milestone-0-baseline-api-inventory.md`)

[x] - Milestone 0.5: Repo Scaffolding - Decide workspace tool (pnpm vs turborepo) (see `docs/migration/milestone-0.5-scaffolding.md`)
[x] - Milestone 0.5: Repo Scaffolding - Add workspace config file(s) (`pnpm-workspace.yaml`)
[x] - Milestone 0.5: Repo Scaffolding - Add root `tsconfig.base.json` (strict)
[x] - Milestone 0.5: Repo Scaffolding - Add root TS project references (`tsconfig.json`)
[x] - Milestone 0.5: Repo Scaffolding - Add root ESLint config (TS + React) (`.eslintrc.cjs`)
[x] - Milestone 0.5: Repo Scaffolding - Add root Prettier config for new packages (`.prettierrc` update)
[x] - Milestone 0.5: Repo Scaffolding - Add `.editorconfig` for whitespace rules
[x] - Milestone 0.5: Repo Scaffolding - Add Node version pin (`.nvmrc` or `engines`) (`.nvmrc`)
[x] - Milestone 0.5: Repo Scaffolding - Add root scripts for new stack tasks (`package.json` scripts)
[x] - Milestone 0.5: Repo Scaffolding - Add `changeset` config (if publishing) (`.changeset/config.json`)

[x] - Milestone 1: Contracts + Types - Create `packages/api` skeleton
[x] - Milestone 1: Contracts + Types - Add `contracts/v1` directory
[x] - Milestone 1: Contracts + Types - Define `PpuSnapshot` schema in Zod
[x] - Milestone 1: Contracts + Types - Define `Registers` schema in Zod
[x] - Milestone 1: Contracts + Types - Define `MemorySection` schema in Zod
[x] - Milestone 1: Contracts + Types - Define `DebugFrame` schema in Zod
[x] - Milestone 1: Contracts + Types - Add schema version metadata
[x] - Milestone 1: Contracts + Types - Export inferred TS types from schemas
[x] - Milestone 1: Contracts + Types - Add schema validation helper
[x] - Milestone 1: Contracts + Types - Add contract registry (map of versions)
[x] - Milestone 1: Contracts + Types - Document contract usage in README

[x] - Milestone 2: Wrapper Integration - Identify all public wrapper entry points (see `docs/migration/milestone-2-wrapper-integration.md`)
[x] - Milestone 2: Wrapper Integration - Add contract gate for `getPpuSnapshot()`
[x] - Milestone 2: Wrapper Integration - Add contract gate for `getRegisters()`
[x] - Milestone 2: Wrapper Integration - Add contract gate for `getMemorySection()`
[x] - Milestone 2: Wrapper Integration - Add contract gate for debug events
[x] - Milestone 2: Wrapper Integration - Ensure `supportsPpuSnapshot()` guards
[x] - Milestone 2: Wrapper Integration - Keep null return on worker readiness
[x] - Milestone 2: Wrapper Integration - Add dev-only contract validation flag
[x] - Milestone 2: Wrapper Integration - Add `compat` wrapper for old API

[x] - Milestone 2.5: Build + Packaging - Add tsup/esbuild config for packages (`packages/api/tsup.config.ts`)
[x] - Milestone 2.5: Build + Packaging - Configure ESM/CJS outputs + `types` (`tsup` outputs + d.ts)
[x] - Milestone 2.5: Build + Packaging - Add `exports` maps for new packages (`packages/api/package.json`)
[x] - Milestone 2.5: Build + Packaging - Add `typecheck` script for packages
[x] - Milestone 2.5: Build + Packaging - Add `test` runner (vitest/jest) (vitest)
[x] - Milestone 2.5: Build + Packaging - Add publish metadata (name/version/files)
[x] - Milestone 2.5: Build + Packaging - Add `sideEffects` metadata if needed
[x] - Milestone 2.5: Build + Packaging - Add `tsconfig.build.json` per package

[x] - Milestone 3: Next.js Debugger - Create `apps/debugger` skeleton
[x] - Milestone 3: Next.js Debugger - Configure Next.js (app router)
[x] - Milestone 3: Next.js Debugger - Add global styles and layout
[x] - Milestone 3: Next.js Debugger - Add top-level routing and nav
[x] - Milestone 3: Next.js Debugger - Add error boundary and fallback UI
[x] - Milestone 3: Next.js Debugger - Configure WASM asset handling
[x] - Milestone 3: Next.js Debugger - Configure worker loading strategy
[x] - Milestone 3: Next.js Debugger - Add ROM loader UI
[x] - Milestone 3: Next.js Debugger - Add emulator view panel component
[x] - Milestone 3: Next.js Debugger - Add registers panel component
[x] - Milestone 3: Next.js Debugger - Add memory viewer component
[x] - Milestone 3: Next.js Debugger - Add snapshot timeline component
[x] - Milestone 3: Next.js Debugger - Add event log panel component
[x] - Milestone 3: Next.js Debugger - Wire typed client to `packages/api`

[x] - Milestone 4: State + Events - Add Zustand store for debugger state
[x] - Milestone 4: State + Events - Add selectors and actions for UI panels
[x] - Milestone 4: State + Events - Add frame metadata (timestamp/frame ID)
[x] - Milestone 4: State + Events - Add snapshot checksums
[x] - Milestone 4: State + Events - Add event stream for inputs/interrupts
[x] - Milestone 4: State + Events - Add read-only AI debug endpoint
[x] - Milestone 4: State + Events - Add JSONL export for events/snapshots
[x] - Milestone 4: State + Events - Add debug sandbox mode (no mutations)
[x] - Milestone 4: State + Events - Add rate limiting for snapshot capture

[x] - Milestone 5: CLI - Create `packages/cli` skeleton
[x] - Milestone 5: CLI - Add CLI argument parser and command router
[x] - Milestone 5: CLI - Implement `run <rom>` command
[x] - Milestone 5: CLI - Implement `snapshot <rom>` command
[x] - Milestone 5: CLI - Implement `compare <baseline>` command
[x] - Milestone 5: CLI - Implement `contract-check` command
[x] - Milestone 5: CLI - Add structured logging output
[x] - Milestone 5: CLI - Add ROM path validation and safe errors
[x] - Milestone 5: CLI - Add `bin` entry + packaging metadata
[x] - Milestone 5: CLI - Add help text and usage examples

[x] - Milestone 6: Regression Safety - Add golden snapshot tests
[x] - Milestone 6: Regression Safety - Add checksum regression tests
[x] - Milestone 6: Regression Safety - Add contract validation tests
[x] - Milestone 6: Regression Safety - Add headless CLI regression tests
[x] - Milestone 6: Regression Safety - Add Next.js debugger smoke tests
[x] - Milestone 6: Regression Safety - Add CI job for contract checks
[x] - Milestone 6: Regression Safety - Ensure existing test suites still pass

[x] - Milestone 7: Compatibility - Add deprecation warnings (dev-only)
[x] - Milestone 7: Compatibility - Add migration notes for `gameboy-remix`
[x] - Milestone 7: Compatibility - Add backwards-compat test coverage
[x] - Milestone 7: Compatibility - Document breaking change policy

[x] - Milestone 8: Tooling - Add workspace scripts (`dev`, `build`, `test`)
[x] - Milestone 8: Tooling - Add lint + prettier for new packages
[x] - Milestone 8: Tooling - Add strict TS config per package
[x] - Milestone 8: Tooling - Add CI workflow for lint/typecheck/tests
[x] - Milestone 8: Tooling - Add build caching for workspace tasks
[x] - Milestone 8: Tooling - Add release automation (changesets)

[x] - Milestone 9: Documentation - Update `MIGRATE_TO_TYPESCRIPT.md` progress links
[x] - Milestone 9: Documentation - Add `packages/api` usage guide
[x] - Milestone 9: Documentation - Add debugger usage guide
[x] - Milestone 9: Documentation - Add CLI usage guide
[x] - Milestone 9: Documentation - Add troubleshooting FAQ

[x] - Milestone 10: Finalization - Verify all tests + contract checks pass
[x] - Milestone 10: Finalization - Tag release and update changelog
[x] - Milestone 10: Finalization - Remove deprecated code after grace period

## Execution Log

- 2026-02-13: Completed M0-01, M0-02, M0-03 by creating baseline API inventory doc. Reason: lock down current public contract surfaces before migration refactors.
- 2026-02-13: Completed M0-04 by documenting worker entry points and message payload schemas. Reason: preserve worker protocol compatibility during refactors.
- 2026-02-13: Completed M0-05 and M0-06 by documenting snapshot memory mapping and null/undefined baseline behavior. Reason: prevent accidental behavior drift in migration.
- 2026-02-13: Completed M0-07 by cataloging ROMs used in tests/demos (including optional fixtures and derived accuracy identifiers). Reason: establish reproducible baseline ROM coverage.
- 2026-02-13: Completed M0-08, M0-09, M0-10 by adding a snapshot-capture script and committed JSON/checksum/timing artifacts for local test ROMs. Reason: create executable baseline evidence for migration regression checks.
- 2026-02-13: Completed M0-11 with initial function-to-payload contract table for snapshot/debug APIs. Reason: establish explicit migration contract targets before adding Zod schemas.
- 2026-02-13: Completed all M0.5 scaffolding tasks (workspace, strict TS base, lint/format/editor configs, node pin, stack scripts, changeset config). Reason: establish monorepo-ready foundations before adding new packages.
- 2026-02-13: Completed all M1 tasks by creating `packages/api` + `contracts/v1`, implementing Zod schemas/metadata/registry/validation helpers, and adding contract tests plus usage docs. Reason: establish typed runtime contracts before wrapper integration.
- 2026-02-13: Completed all M2 tasks by adding snapshot/register/memory contract gates, debug event validation, explicit support guards, dev-toggle validation controls, and `WasmBoyCompat` export. Reason: preserve compatibility while introducing contract-first wrapper behavior.
- 2026-02-13: Completed all M2.5 tasks by moving `packages/api` to tsup (ESM/CJS+d.ts), adding exports/publish metadata/sideEffects, and switching tests to vitest. Reason: make new package production-consumable and verifiable.
- 2026-02-13: Completed all M3 tasks by scaffolding `apps/debugger` (Next app-router), adding layout/routes/error UI/panel components, wiring typed contract client usage, and validating with `next build`.
- 2026-02-13: Completed all M4 tasks by introducing a Zustand debugger store with selectors/actions, frame metadata + checksums, input/interrupt event stream, JSONL export helper, sandbox mode, rate-limited snapshot capture, and a read-only AI debug API route.
- 2026-02-13: Completed all M5 tasks by creating `packages/cli` with command routing (`run/snapshot/compare/contract-check`), structured JSON logging, safe path validation, bin metadata, help text/examples, and vitest coverage.
- 2026-02-13: Completed all M6 tasks by adding baseline checksum/golden regression tests, debugger smoke tests, expanded CLI regression coverage, a CI contract-check workflow, and by re-running integration/core suites to confirm pass status.
- 2026-02-13: Completed all M7 tasks by adding dev-only deprecation warnings, publishing migration/breaking-change docs for `gameboy-remix`, and adding explicit compatibility API integration tests.
- 2026-02-13: Completed all M8 tasks by enabling workspace lint/typecheck/test scripts across packages/apps, wiring Prettier checks, and adding CI/release workflows with cache + changesets automation.
- 2026-02-13: Completed all M9 tasks by adding migration progress links and dedicated usage/troubleshooting guides for API package, debugger app, and CLI workflows.
- 2026-02-13: Completed all M10 tasks by running final build/lint/typecheck/tests + integration/core/contract checks, updating changelog release notes, and removing deprecated `.cjs.cjs` test runtime references in favor of the unified loader helper.
- 2026-02-13: Added release changeset metadata for `@wasmboy/api` and `@wasmboy/cli` (`.changeset/strong-llamas-juggle.md`) so release automation has explicit version intent for the migration rollout.
- 2026-02-13: Audited legacy test dependency surface and replaced `pngjs-image` + `request` usage with direct `pngjs` integration in test helpers, reducing audit pressure while preserving integration/core snapshot behavior.
- 2026-02-13: Continued dependency hardening by removing direct `np` dependency, switching deploy publish script to `npx np`, and pinning mocha to `11.3.0`, reducing `npm audit --omit=optional` findings from 13 to 5 while keeping all workspace/integration/core checks passing.
- 2026-02-13: Added PyBoy-rigor headless throughput baseline test (`test:performance:throughput`) with JSON-configured FPS threshold and validated runtime output (~834 FPS locally).
- 2026-02-13: Added core multi-instance isolation regression (`test:core:isolation`) and wired it into `test:core` / `test:core:nobuild` to enforce no shared mutable memory between parallel core instances.
- 2026-02-13: Added memory view bounds regression coverage (`test:integration:memorybounds`) and integrated it into `test:integration` pipelines, asserting valid range reads and explicit out-of-bounds error behavior.
- 2026-02-13: Added CLI/error-taxonomy rigor by introducing typed CLI error codes (`InvalidInput`, `InvalidOperation`, `OutOfBounds`) with regression tests and entrypoint-safe execution export for direct command-router testing.
- 2026-02-13: Added PyBoy-rigor tick/frame equivalence/input-delay regression coverage (`test:integration:tick`) to validate tick contract input checks, `tick(1)xN` vs `tick(N)` determinism, and queued delayed input scheduling behavior.
- 2026-02-13: Applied `npm audit fix --omit=optional --legacy-peer-deps` to pick up safe transitive updates; post-change audit moved to 4 high findings (from 5 total), with remaining issues isolated to legacy webpack-era minifier dependency chains.
- 2026-02-13: Completed Phase 8 dependency audit hardening by removing unused vulnerable `uglifyjs-webpack-plugin`, rerunning full workspace/integration/core suites, and reaching `npm audit --omit=optional` = 0 vulnerabilities.
- 2026-02-13: Added consolidated root quality-gate scripts (`test:all`, `test:all:nobuild`, `audit:check`) and updated CI to run the unified no-build quality suite end-to-end.
- 2026-02-13: Added migration completion summary doc capturing final validation script, audit posture, and release markers for quick downstream reference.
- 2026-02-13: Added scheduled nightly regression workflow to run `test:all:nobuild` on CI daily (plus manual trigger) for ongoing post-migration drift detection.
- 2026-02-13: Updated contract-check CI workflow to reuse the unified `test:all:nobuild` quality gate and include `changeset:status`, reducing duplicate workflow logic while enforcing release metadata checks.
- 2026-02-13: Extended migration completion summary with CI mapping details, documenting how push/PR, contract-check, and nightly workflows share the same consolidated quality gate.
- 2026-02-13: Added `ci:local` root alias and README guidance so contributors can run the exact CI no-build quality gate locally with one command.
- 2026-02-13: Added reusable sample contract fixture/script for CI contract validation and removed CLI `import.meta` CJS build warning by switching to path-based entrypoint detection.
- 2026-02-13: Removed Next.js multi-lockfile root warning in debugger builds by setting `outputFileTracingRoot` explicitly in app config.
- 2026-02-13: Hardened GitHub Actions workflows with explicit least-privilege permissions and concurrency cancellation guards across CI, contract-check, nightly, and release pipelines.
- 2026-02-13: Updated README and completion summary with explicit CI workflow map + hardening notes so contributors can mirror and reason about automation behavior locally.
- 2026-02-13: Added explicit job timeouts to CI, contract-check, and release workflows to prevent runaway minutes and align pipeline reliability with nightly timeout behavior.
- 2026-02-13: Added root `install:stack` script and migrated all workflows to it, reducing duplicated dependency install logic and keeping CI/release setup behavior aligned.
- 2026-02-13: Strengthened release automation by requiring `test:all:nobuild` and `changeset:status` prior to the changesets publish/create-PR action.
- 2026-02-13: Optimized contract-check automation by introducing `stack:build:packages` and using it in the contract workflow, avoiding unnecessary debugger app build work before contract validation.
- 2026-02-13: Improved workflow cache determinism by configuring `setup-node` cache dependency paths with all workspace lockfiles across CI, contract, nightly, and release pipelines.
- 2026-02-13: Migrated all workflows from install to lockfile-driven `install:stack:ci` for deterministic dependency resolution while preserving existing build/test behavior.
- 2026-02-13: Optimized CI dependency bootstrap by running lockfile installs with `--ignore-scripts`, removing redundant prepare-time builds while keeping explicit quality/build stages authoritative.
- 2026-02-13: Added Next.js cache step to release workflow to speed repeated debugger app builds during release validations.
- 2026-02-13: Introduced `release:build` script and switched release workflow to it, aligning release build scope with publish artifacts (root emulator/lib + workspace packages) while avoiding unnecessary app builds.
- 2026-02-13: Added consolidated `release:verify` and `contract:ci` scripts and updated workflows to call them, improving local parity and reducing per-workflow command duplication.
- 2026-02-13: Reduced CI install overhead by disabling install-time audit/funding output in `install:stack:ci`; security audit remains enforced by `audit:check` in the unified quality gate.
- 2026-02-13: Refined `contract:ci` scope to package-level build/typecheck/tests plus contract and changeset checks, reducing duplicate full-stack validation while preserving contract workflow intent.
- 2026-02-13: Added path filters to `contract-checks.yml` so contract CI only triggers when relevant package/contract/changeset files change, reducing redundant workflow executions.
- 2026-02-13: Added reusable `ci:packages` script and composed `contract:ci` from it, further reducing command duplication and improving local/workflow parity for package-focused validation.
- 2026-02-13: Extended contract workflow path filters to include debugger package metadata files consumed by changeset validation, preventing missed contract/release-metadata checks on app package updates.
- 2026-02-13: Added push path filters to release workflow so release automation only runs on changes that can affect published artifacts or release metadata, reducing unnecessary master-branch release jobs.
- 2026-02-13: Added manual dispatch support and path filters to main CI workflow, plus manual dispatch to contract checks, improving operational control while reducing redundant runs on irrelevant changes.
- 2026-02-13: Cleaned CI/contract path filter lists to remove stale `pnpm-workspace.yaml` references, keeping workflow trigger rules aligned with actual repo files.
- 2026-02-13: Added `workflow:lint` and wired it into `test:all:nobuild` so GitHub Actions YAML formatting is validated as part of the standard quality gate.
- 2026-02-13: Added `workflow:format` helper command for local auto-fix of workflow YAML formatting, complementing required `workflow:lint` checks.
- 2026-02-13: Added failure-diagnostics artifact uploads (quality logs + generated screenshots) to CI and nightly workflows to improve regression triage speed when quality gates fail.
- 2026-02-13: Extended failure-diagnostics artifact support to contract and release workflows by teeing gate logs and uploading them on failure for consistent cross-pipeline observability.
- 2026-02-13: Updated `contract:ci` to include `workflow:lint`, ensuring contract workflow changes also enforce YAML formatting standards before package-level validation.
- 2026-02-13: Updated README CI section with trigger/filter and failure-artifact behavior notes so contributors can better understand when workflows run and where diagnostics appear.
- 2026-02-13: Added 14-day retention policies to CI/contract/nightly/release failure artifacts, standardizing diagnostics lifecycle management across workflows.
- 2026-02-13: Expanded CI path filters to include `.github/workflows/*.yml`, ensuring workflow-only edits still execute the full quality gate.
- 2026-02-13: Set explicit `shell: bash` on log-capturing workflow steps so `set -o pipefail` behavior is guaranteed across CI, nightly, contract, and release gates.
- 2026-02-13: Updated diagnostic artifact names to include GitHub run id/attempt, improving failure-trace disambiguation across reruns and repeated pipeline executions.
