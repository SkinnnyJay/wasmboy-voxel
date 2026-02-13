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
- 2026-02-13: Added `scripts:lint`/`scripts:format` for automation helpers and wired `scripts:lint` into `test:all:nobuild` to keep CI helper scripts formatting-gated alongside workflows.
- 2026-02-13: Added `workflow:check` to compose workflow/script format checks and reused it in `test:all:nobuild` + `contract:ci`, reducing duplicated script chains while preserving gate coverage.
- 2026-02-13: Added `automation:test` with Node-based tests for CI helper scripts (including diagnostics bundling), and wired it into both strict and CI-flavored full quality gates.
- 2026-02-13: Added reusable `automation:check` (`workflow:check + automation:test`) and switched quality-gate scripts (`test:all:nobuild*`, `contract:ci`) to use the consolidated automation preflight.
- 2026-02-13: Expanded diagnostics bundler automation tests with duplicate-pattern deduplication coverage, complementing existing matched-file and empty-placeholder assertions.
- 2026-02-13: Expanded diagnostics bundler automation coverage for custom placeholder message handling when no diagnostics files are present.
- 2026-02-13: Updated diagnostics bundling to clean up temporary placeholder files after archive creation, with automation coverage validating placeholder content via archive extraction and on-disk cleanup.
- 2026-02-13: Added diagnostics bundler coverage to ensure directory glob matches are ignored, preserving file-only archive semantics.
- 2026-02-13: Made diagnostics bundling deterministic by lexicographically sorting matched files before archive creation, and added automation coverage for archive ordering stability.
- 2026-02-13: Hardened diagnostics file deduplication to use canonical resolved paths so equivalent relative/absolute glob matches cannot produce duplicate archive entries.
- 2026-02-13: Hardened diagnostics archive creation by passing `--` to tar before file arguments, preventing option-parsing issues for dash-prefixed filenames (with regression coverage).
- 2026-02-13: Added diagnostics bundler protection to exclude the output archive path from matched input files, preventing self-archiving with broad artifact patterns.
- 2026-02-13: Improved diagnostics archive path selection so absolute matches under the working directory are normalized to relative archive entries, reducing host-path leakage and preserving deterministic artifact structure.
- 2026-02-13: Added configurable tar timeout protection to diagnostics bundler (`BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS`, default 120000ms), including regression coverage for invalid timeout config and timeout failure reporting.
- 2026-02-13: Reduced timeout-fixture sleep durations in automation tests to keep suite runtime lower while retaining timeout-path validation for both diagnostics and changeset wrappers.
- 2026-02-13: Tightened timeout env parsing to strict numeric-only values for both automation wrappers, adding regression coverage for suffix-style invalid values (e.g. `50ms`).
- 2026-02-13: Extended README helper references with timeout override examples for both automation wrappers to improve operational discoverability during CI triage.
- 2026-02-13: Tightened diagnostics helper argument handling so unknown flags still fail even when help is requested, preserving strict invocation semantics across automation scripts.
- 2026-02-13: Standardized diagnostics helper failure output with `[bundle-diagnostics]` prefixed error lines and usage-on-parse-failure behavior for clearer CI troubleshooting logs.
- 2026-02-13: Extended helper failure UX so invalid timeout-config errors also print usage context (not just parse errors), improving operator guidance in CI logs.
- 2026-02-13: Added regression assertions for helper error-prefix contracts (`[bundle-diagnostics]`, `[changeset:status:ci]`) to keep automation troubleshooting output stable.
- 2026-02-13: Expanded bundle CLI regression assertions so missing/unknown argument failures must include usage text, preserving operator guidance quality in error output.
- 2026-02-13: Tightened diagnostics helper CLI semantics by rejecting mixed help + operational argument combinations, reducing ambiguous invocation modes.
- 2026-02-13: Added regression coverage ensuring `changeset-status-ci` rejects unknown arguments even when mixed with help flags, aligning strict invocation guarantees across both automation helpers.
- 2026-02-13: Expanded `changeset-status-ci` timeout-suffix regression assertions to require usage-text output for timeout-config failures, preserving operator guidance guarantees.
- 2026-02-13: Tightened helper arg parsing to reject duplicate help-flag combinations (`--help -h`) in both wrappers, with regression coverage for strict help-flag semantics.
- 2026-02-13: Added regression coverage for unknown short-flag arguments (`-x`) across both helpers to preserve strict short-option handling contracts.
- 2026-02-13: Extracted shared strict timeout env parsing into `scripts/cli-timeout.mjs` and wired both automation wrappers to it, with dedicated helper unit coverage to reduce duplicated parsing logic.
- 2026-02-13: Added timeout upper-bound validation (`<= 2147483647ms`) in shared timeout parsing helper, with regression coverage to prevent out-of-range process timeout configuration.
- 2026-02-13: Expanded shared timeout helper coverage to reject whitespace-only env values, ensuring invalid CI timeout config is surfaced explicitly.
- 2026-02-13: Added shared timeout helper coverage for empty-string env values to confirm default-timeout fallback semantics remain stable.
- 2026-02-13: Expanded shared timeout helper coverage for plus-prefixed and negative numeric strings, confirming strict positive-integer-only timeout input semantics.
- 2026-02-13: Added wrapper-level regression coverage for above-ceiling timeout env values in both helpers so shared timeout-bound enforcement remains visible through CLI behavior.
- 2026-02-13: Updated README helper usage examples to explicitly document timeout env bounds (`1..2147483647`) for both automation wrappers.
- 2026-02-13: Refined diagnostics argument parsing so values starting with `--` are accepted when valid (e.g. custom message text) while true flag-missing cases still fail reliably.
- 2026-02-13: Tightened diagnostics value parsing for `--output` / `--pattern` so unknown long-flag tokens are treated as missing values (while `--message` still allows dash-prefixed content), reducing accidental argument-swallowing risk.
- 2026-02-13: Expanded diagnostics parser regression coverage around dash-prefixed tokens to explicitly lock intended boundary behavior (accepted for message payloads, rejected for path-value positions).
- 2026-02-13: Extended token-capture regression assertions so malformed path-value flag tokens (`--output/--pattern`) must surface usage guidance alongside missing-value errors.
- 2026-02-13: Extended diagnostics value guards to reject short-flag-like tokens (e.g. `-x`) for `--output` / `--pattern`, with regression coverage to prevent accidental option-token capture in path-value slots.
- 2026-02-13: Added wrapper-level regression coverage for empty-string timeout env behavior in both helpers, verifying default-timeout fallback semantics at CLI boundaries.
- 2026-02-13: Added equals-form argument support for diagnostics helper (`--output=`, `--pattern=`, `--message=`), with regression coverage for valid equals flows and empty inline-value guardrails.
- 2026-02-13: Added mixed split/equals duplicate-flag regression coverage (`--output`, `--message`) to ensure duplicate detection semantics remain consistent across argument styles.
- 2026-02-13: Refactored `changeset:status:ci` filtering into a reusable module and added automation tests for warning suppression/dedup behavior, improving confidence in CI log-sanitization correctness.
- 2026-02-13: Generalized `changeset:status:ci` suppression matching to support future `@wasmboy/*` workspace package names and non-`0.0.0` expected versions while still only filtering `file:`-based notices.
- 2026-02-13: Added direct automation tests for `changeset-status-ci.mjs` wrapper behavior, covering filtered output reporting, non-zero exit pass-through, and missing-command error handling.
- 2026-02-13: Stabilized `changeset:status:ci` warning reporting by sorting suppressed warnings lexicographically, plus added deterministic-order assertions in library tests.
- 2026-02-13: Expanded changeset warning filter/wrapper coverage to ensure non-`@wasmboy/*` `file:` warnings are never suppressed while suppressed workspace warnings remain deterministically ordered in wrapper output.
- 2026-02-13: Added `--help`/`-h` support to `changeset-status-ci` wrapper with automation tests for both help entrypoints.
- 2026-02-13: Added CRLF-focused regression coverage for changeset warning filtering to validate cross-platform output parsing behavior.
- 2026-02-13: Tightened `changeset-status-ci` argument handling to fail on unknown flags (with usage output), plus added automation coverage for the strict-arg error path.
- 2026-02-13: Added configurable timeout protection to `changeset-status-ci` (`CHANGESET_STATUS_CI_TIMEOUT_MS`, default 120000ms), with regression coverage for invalid timeout config and explicit timeout failures.
- 2026-02-13: Added diagnostics bundler negative-path tests for required CLI arguments (`--output`, `--pattern`), strengthening guardrail coverage for automation script misuse.
- 2026-02-13: Expanded diagnostics bundler negative-path automation coverage for unknown flags and missing flag values, hardening script argument-validation guarantees.
- 2026-02-13: Expanded diagnostics bundler negative-path coverage for missing `--output` and `--message` flag values to lock down strict argument parsing semantics.
- 2026-02-13: Hardened diagnostics bundler argument parsing against duplicate `--output` / `--message` flags, with regression tests for both duplicate-flag failure paths.
- 2026-02-13: Added `--help` usage output support to diagnostics bundler and covered it via automation tests for CLI discoverability.
- 2026-02-13: Added `-h` short-help alias support to diagnostics bundler (with automation coverage) for standard CLI ergonomics parity.
- 2026-02-13: Updated README command reference with direct `--help` usage examples for both automation helper scripts to improve discoverability for maintainers.
- 2026-02-13: Added failure-diagnostics artifact uploads (quality logs + generated screenshots) to CI and nightly workflows to improve regression triage speed when quality gates fail.
- 2026-02-13: Extended failure-diagnostics artifact support to contract and release workflows by teeing gate logs and uploading them on failure for consistent cross-pipeline observability.
- 2026-02-13: Expanded release failure artifact payloads to include generated core/headless screenshots from verification failures, aligning triage depth with CI/nightly diagnostics.
- 2026-02-13: Updated `contract:ci` to include `workflow:lint`, ensuring contract workflow changes also enforce YAML formatting standards before package-level validation.
- 2026-02-13: Updated README CI section with trigger/filter and failure-artifact behavior notes so contributors can better understand when workflows run and where diagnostics appear.
- 2026-02-13: Added 14-day retention policies to CI/contract/nightly/release failure artifacts, standardizing diagnostics lifecycle management across workflows.
- 2026-02-13: Expanded CI path filters to include `.github/workflows/*.yml`, ensuring workflow-only edits still execute the full quality gate.
- 2026-02-13: Set explicit `shell: bash` on log-capturing workflow steps so `set -o pipefail` behavior is guaranteed across CI, nightly, contract, and release gates.
- 2026-02-13: Updated diagnostic artifact names to include GitHub run id/attempt, improving failure-trace disambiguation across reruns and repeated pipeline executions.
- 2026-02-13: Added `changeset:status:ci` wrapper to suppress repeated known workspace file-dependency notices and switched release/contract verification scripts to use cleaner CI status output.
- 2026-02-13: Updated CI/contract/release path filters to include `scripts/**`, ensuring workflow runs are triggered when shared automation scripts (including changeset CI wrappers) are modified.
- 2026-02-13: Expanded diagnostics artifact upload conditions to run on cancellations as well as failures, preserving partial logs/screenshots from interrupted CI runs.
- 2026-02-13: Added job-level `defaults.run.shell: bash` to all workflows and removed per-step shell overrides, simplifying workflow definitions while keeping consistent pipefail-compatible shell behavior.
- 2026-02-13: Expanded contract workflow path filters with `contracts/**` so contract-schema/documentation changes trigger contract CI validation consistently.
- 2026-02-13: Added `install:packages:ci` and switched contract workflow to package-only deterministic installs, reducing unnecessary debugger app dependency bootstrap during contract CI.
- 2026-02-13: Refined contract workflow npm cache inputs to package-only lockfiles, improving cache relevance after adopting package-only deterministic installs.
- 2026-02-13: Switched CI and nightly workflows to execute the shared `ci:local` alias directly, tightening local/remote command parity for the no-build quality gate.
- 2026-02-13: Updated `release:verify` to compose `ci:local + changeset:status:ci`, aligning release verification command flow with the same shared quality gate used by CI/nightly.
- 2026-02-13: Added `release:verify:strict` and release workflow manual `strict` input path, enabling opt-in no-retry release verification while retaining default CI-retry behavior.
- 2026-02-13: Refactored `install:stack:ci` to compose `install:packages:ci` plus debugger install, reducing duplication between stack-level and package-level deterministic install commands.
- 2026-02-13: Added `contract:ci:full` and a `full_gate` manual-dispatch input in contract workflow, enabling optional full-gate verification runs while keeping default contract checks package-focused.
- 2026-02-13: Added `automation:test` into default `contract:ci` path so contract workflow validates helper-script behavior in addition to workflow/script formatting and package contract checks.
- 2026-02-13: Added `contract:ci:full:strict` and contract workflow `strict` manual input (when `full_gate=true`) to support optional no-retry full-gate contract verification.
- 2026-02-13: Added fast-fail validation for contract workflow dispatch input combinations so `strict=true` without `full_gate=true` exits with a clear configuration error.
- 2026-02-13: Updated contributor docs to explicitly map manual dispatch input options across CI/nightly (`strict`), release (`strict`), and contract (`full_gate`, optional `strict`) workflows.
- 2026-02-13: Added a single retry to `test:integration:headless` (`--retries 1`) to mitigate occasional golden-frame flake in CI while retaining strict pixel-diff assertions.
- 2026-02-13: Added a single retry to `test:core:savestate` (`--retries 1`) to reduce occasional screenshot-timing flakes while preserving strict save-state golden comparisons.
- 2026-02-13: Refined retry strategy by restoring strict default local headless/save-state commands and introducing CI-specific retry scripts (`test:integration:headless:ci`, `test:core:savestate:ci`) used by `test:all:nobuild`.
- 2026-02-13: Added compression steps for CI/contract/nightly/release diagnostics and upload archived tarballs, keeping failure artifacts compact and easier to fetch/inspect while retaining log+screenshot coverage.
- 2026-02-13: Added `ci:local:strict` and `test:all:nobuild:strict` for full-gate strict single-run verification, while keeping `ci:local` aligned with CI retry-scoped commands.
- 2026-02-13: Hardened diagnostics bundling steps to archive only existing files (and emit placeholder manifests when none exist), reducing tar warning noise on early-cancel/early-fail workflow exits.
- 2026-02-13: Introduced shared `scripts/bundle-diagnostics.mjs` and switched all workflows to use it for diagnostics archive creation, eliminating duplicated bash bundling logic and keeping behavior consistent across pipelines.
- 2026-02-13: Added `strict` manual-dispatch inputs to CI and nightly workflows so maintainers can optionally run strict no-retry quality-gate variants directly in GitHub Actions.
- 2026-02-13: Added per-invocation timeout override support to `changeset-status-ci` (`--timeout-ms` / `--timeout-ms=<ms>`) with strict parse guards (duplicate/missing/help-mixed) and regression coverage for CLI-over-env precedence.
- 2026-02-13: Added per-invocation tar-timeout override support to `bundle-diagnostics` (`--tar-timeout-ms` / `--tar-timeout-ms=<ms>`) with strict parse guards and regression coverage for CLI-over-env timeout precedence.
- 2026-02-13: Hardened `changeset-status-ci` timeout argument parsing to treat unknown/short flag tokens as missing timeout values (instead of swallowing them), with regression coverage for those malformed-value paths.
- 2026-02-13: Extended `changeset-status-ci` timeout hardening so inline-equals timeout values (`--timeout-ms=...`) also reject unknown/short flag tokens as missing values, matching split-arg guard behavior.
- 2026-02-13: Expanded `bundle-diagnostics` timeout parsing regression coverage for malformed flag-token values across split/inline forms (`--tar-timeout-ms --unexpected`, `--tar-timeout-ms=-x`) to keep timeout missing-value semantics locked down.
- 2026-02-13: Expanded wrapper timeout-override regression coverage to include whitespace-only CLI values for both helpers, ensuring invalid timeout input handling remains explicit at command-entry boundaries.
- 2026-02-13: Expanded wrapper timeout-override regression coverage with plus-prefixed and negative CLI values (`+5000`, `-5`) for both helpers, preserving strict numeric timeout validation behavior at CLI boundaries.
- 2026-02-13: Added split/inline parity regression coverage for wrapper timeout overrides (whitespace/plus/negative values) across both helpers, locking equivalent strict-validation behavior for `--flag value` and `--flag=value` forms.
- 2026-02-13: Expanded help-mixed timeout regression coverage to include inline timeout forms for both helpers, preserving strict help-flag exclusivity semantics across split and equals argument styles.
- 2026-02-13: Expanded help-mode strictness regression coverage with unknown short-flag mixes (`--help -x`) for both helpers, preserving unknown-short rejection guarantees even when help is present.
- 2026-02-13: Expanded timeout-value token-guard regression coverage with help-alias tokens (`--help`, `-h`) across split/inline timeout value positions for both helpers, preserving missing-value semantics when option tokens are misused as timeout values.
- 2026-02-13: Expanded duplicate-timeout regression coverage with inline-first ordering (`--flag=...` then `--flag ...`) in both helpers, preserving ordering-agnostic duplicate detection across split and equals argument forms.
- 2026-02-13: Expanded help-timeout exclusivity regression coverage with short-help alias scenarios (`-h --flag ...`, `-h --flag=...`) for both helpers, preserving help-flag exclusivity semantics across both help aliases and timeout argument styles.
- 2026-02-13: Expanded help-mode unknown-argument regression coverage with short-help alias scenarios (`-h --unknown`, `-h -x`) for both helpers, preserving strict unknown-argument rejection behavior even when help alias mode is active.
- 2026-02-13: Hardened `bundle-diagnostics` path-value parsing so whitespace-only `--output` / `--pattern` values are treated as missing (split and equals forms), with regression coverage to prevent blank path-value acceptance.
- 2026-02-13: Expanded duplicate-help regression coverage with short-first alias ordering (`-h --help`) for both helpers, preserving ordering-agnostic duplicate-help detection semantics.
- 2026-02-13: Expanded duplicate-timeout regression coverage to include split-only and inline-only duplicates for both helpers, preserving syntax/order-agnostic duplicate-timeout detection semantics across split, equals, and mixed forms.
- 2026-02-13: Expanded timeout-override precedence regression coverage with inline CLI override forms for both helpers, preserving env-override precedence parity between split (`--flag value`) and equals (`--flag=value`) styles.
- 2026-02-13: Expanded diagnostics placeholder-message regression coverage with whitespace-only message values in split and equals forms, preserving intended whitespace payload semantics for custom empty-artifact notes.
- 2026-02-13: Updated `bundle-diagnostics` message parsing to allow help-token literals (`--help`, `-h`) as intentional message payloads (split and equals forms), with regression coverage for both literal cases.
- 2026-02-13: Expanded diagnostics help-token message regression coverage to full split/equals parity (`--message --help`, `--message -h`, `--message=--help`, `--message=-h`) so intentional help-literal placeholder text remains stable across argument styles.
- 2026-02-13: Expanded timeout-value token-guard regression coverage with self-flag misuse cases (`--timeout-ms --timeout-ms`, `--timeout-ms=--timeout-ms`, plus diagnostics equivalents), preserving missing-value semantics when timeout flag tokens are repeated in value positions.
- 2026-02-13: Expanded diagnostics duplicate-flag regression coverage with equals-only duplicate cases for `--output` and `--message`, preserving duplicate-detection semantics across split-only, equals-only, and mixed argument forms.
- 2026-02-13: Expanded diagnostics path-value token-guard regression coverage with help-token cases for `--output`/`--pattern` in split and equals forms, preserving missing-value semantics when help tokens are misused as path values.
- 2026-02-13: Expanded help-timeout exclusivity regression coverage with trailing-help permutations (timeout args preceding help in split and inline forms, across both long and short help aliases) for both helper wrappers.
- 2026-02-13: Refactored `changeset-status-ci` timeout argument parsing to use a reusable value-validation helper (known-token + prefix guards), aligning parser structure with diagnostics helper semantics while preserving existing timeout error behavior.
- 2026-02-13: Expanded diagnostics path-value token-guard regression coverage with timeout-flag token misuse cases for `--output`/`--pattern` (split and equals forms), preserving missing-value semantics for known timeout flag tokens in path-value positions.
- 2026-02-13: Expanded diagnostics message-value token-guard regression coverage with timeout-flag token misuse cases in split and equals forms, preserving current known-token missing-value semantics for non-whitelisted message-token inputs.
- 2026-02-13: Expanded diagnostics message-value token-guard regression coverage with operational known-flag misuse cases (`--output` / `--pattern`) in split and equals forms, preserving non-whitelisted known-token missing-value semantics while retaining explicit help-token message allowances.
- 2026-02-13: Refactored `bundle-diagnostics` parser internals to use shared flag-name constants for known-token registration, split/equals parsing branches, and duplicate-argument errors, reducing literal drift risk while preserving existing CLI semantics.
- 2026-02-13: Expanded diagnostics timeout-value token-guard regression coverage with known operational-flag misuse cases (`--output`, `--pattern`, `--message`) in split and equals forms, preserving missing-value semantics when known flags appear in timeout value positions.
- 2026-02-13: Expanded diagnostics help-literal message regression coverage with explicit-help follow-up permutations (split/equals forms for `--help` and `-h` literals), preserving help-flag exclusivity semantics even when help-token literals are intentionally used as message payloads.
- 2026-02-13: Expanded diagnostics help-literal message regression coverage with timeout-coexistence permutations (split and equals forms), preserving intentional help-literal message payload semantics when timeout override arguments are also provided.
- 2026-02-13: Expanded duplicate-help regression coverage with same-alias permutations (`--help --help` and `-h -h`) across both wrappers, preserving duplicate-help failure semantics independent of alias mixing order.
- 2026-02-13: Refactored `changeset-status-ci` split-form timeout argument parsing to use a shared required-value helper, aligning helper structure with diagnostics parser internals while preserving existing timeout validation behavior.
- 2026-02-13: Expanded wrapper-level CLI timeout boundary regression coverage with zero, non-numeric suffix, and above-ceiling override values (split and inline forms) across both helper wrappers.
- 2026-02-13: Expanded wrapper-level timeout-environment boundary regression coverage with explicit zero-value env rejection cases for both helper wrappers, preserving strict positive-timeout semantics at wrapper entry points.
- 2026-02-13: Expanded wrapper-level timeout-environment boundary regression coverage with plus-prefixed and negative env-value rejection cases across both helper wrappers, preserving strict positive integer timeout semantics at wrapper entry points.
- 2026-02-13: Expanded wrapper-level CLI timeout boundary regression coverage with maximum supported timeout acceptance cases (`2147483647`) in split and inline forms across both helper wrappers, preserving inclusive upper-bound semantics.
- 2026-02-13: Expanded wrapper-level timeout-environment boundary regression coverage with maximum supported timeout acceptance cases (`2147483647`) across both helper wrappers, preserving inclusive upper-bound semantics for env-driven timeout resolution.
- 2026-02-13: Expanded timeout-override precedence regression coverage with invalid-CLI/valid-env failure-path cases (split and inline forms) across both wrappers, preserving strict CLI timeout validation semantics under precedence rules.
- 2026-02-13: Refactored diagnostics timeout automation fixtures to use a shared delayed-fake-tar helper, reducing duplicated test setup while preserving timeout regression behavior.
- 2026-02-13: Refactored changeset timeout automation fixtures to use shared fake-changeset helpers for delayed and no-bump outputs, reducing duplicated test setup while preserving timeout and success-path regression behavior.
- 2026-02-13: Expanded timeout-override precedence regression coverage with empty-timeout-env permutations (split and inline CLI overrides) across both wrappers, preserving CLI override behavior when env timeout inputs fall back to defaults.
- 2026-02-13: Expanded timeout-override regression coverage with leading-zero CLI override permutations (`00050`) in split and inline forms across both wrappers, preserving numeric parsing semantics while enforcing configured timeout behavior.
- 2026-02-13: Expanded timeout parsing regression coverage with whitespace-padded timeout values (`' 50 '`) across env and CLI override paths (split and inline) for both wrappers, preserving trimmed numeric parsing semantics while enforcing configured timeout behavior.
- 2026-02-13: Expanded timeout-override precedence regression coverage with invalid-env/valid-CLI permutations (split and inline forms) across both wrappers, preserving current env-first timeout resolution semantics.
- 2026-02-13: Expanded timeout-environment regression coverage with leading-zero acceptance cases (`00050`) across both wrappers, preserving trimmed numeric parsing semantics for canonicalizable integer env inputs.
- 2026-02-13: Reduced delayed-timeout fixture defaults in automation tests from `0.2s` to `0.1s` for both wrapper harness helpers, preserving timeout assertions while improving automation runtime.
- 2026-02-13: Expanded timeout-environment boundary regression coverage with whitespace-padded max-int acceptance cases (`' 2147483647 '`) across both wrappers, preserving trim semantics at the upper supported timeout boundary.
- 2026-02-13: Refactored wrapper argument-value parsing internals to use a shared `cli-arg-values` helper (`validateRequiredArgumentValue` / `readRequiredArgumentValue`) across both wrappers, reducing duplicate parser logic while preserving existing token-guard semantics; added focused helper unit tests.
- 2026-02-13: Refactored wrapper timeout resolution internals to use shared `resolveTimeoutFromCliAndEnv` helper across both wrappers, reducing duplicate env/CLI timeout scaffolding while preserving current env-first validation + CLI override semantics; added focused helper unit tests for precedence and invalid-input failure paths.
- 2026-02-13: Expanded wrapper-level CLI timeout boundary regression coverage with whitespace-padded max-int override acceptance cases (`' 2147483647 '`) in split and inline forms across both wrappers, preserving trim semantics at the upper supported CLI timeout boundary.
- 2026-02-13: Refactored automation test harness internals to use shared `test-fixtures` fake-executable helper across changeset/diagnostics wrappers, reducing duplicated fake command setup logic; added focused helper unit coverage for runnable fake-bin command creation.
- 2026-02-13: Expanded shared `cli-arg-values` helper unit coverage with unknown-long-token rejection, explicit whitespace-allowed acceptance, and allowed-known-token read-path assertions, further locking parser-helper semantics used by both wrappers.
- 2026-02-13: Expanded shared `resolveTimeoutFromCliAndEnv` helper unit coverage with empty-env+CLI override resolution, whitespace-padded max-int CLI override acceptance, and whitespace-only CLI rejection with valid env fallback, further locking timeout-precedence semantics used by both wrappers.
- 2026-02-13: Refactored shared `cli-arg-values` helper internals to centralize missing-value error creation, reducing repeated error-construction logic while preserving existing error text contracts and parser behavior.
- 2026-02-13: Expanded `changeset-status-ci-lib` regression coverage with whitespace-padded warning suppression and passthrough blank-line preservation cases, locking output-format behavior for mixed warning/info streams.
- 2026-02-13: Expanded `changeset-status-ci-lib` regression coverage with whitespace-variant warning deduplication and empty-output handling cases, locking normalization behavior for duplicate-heavy and sparse output streams.
- 2026-02-13: Hardened shared `test-fixtures` helper with executable-name validation (reject empty and path-segment names) to prevent fake-bin escape paths; added focused unit coverage for invalid-name rejection.
- 2026-02-13: Extended shared `test-fixtures` executable-name validation to reject backslash path separators for cross-platform path safety; added focused unit coverage for backslash-separated invalid names.
- 2026-02-13: Extended shared `test-fixtures` executable-name validation to reject dot-segment names (`.` / `..`) to avoid invalid directory-like executable identifiers; added focused unit coverage for dot-segment rejection.
- 2026-02-13: Extended shared `test-fixtures` executable-name validation to reject whitespace-containing names, reducing ambiguous shell-token fixture command identifiers; added focused unit coverage for whitespace-only and embedded-space invalid names.
- 2026-02-13: Hardened shared `test-fixtures` input contracts by validating non-string executable-name rejection and empty-body rejection, preventing ambiguous fixture helper inputs; added focused unit coverage for both invalid-input paths.
- 2026-02-13: Expanded shared `resolveStrictPositiveIntegerEnv` helper unit coverage with max-boundary acceptance (`2147483647`) and leading-zero acceptance (`00050`) cases, locking canonicalizable upper-bound timeout semantics directly at helper level.
- 2026-02-13: Extended shared `test-fixtures` body-validation semantics to reject whitespace-only executable bodies (in addition to empty bodies), preventing ambiguous no-op fixture scripts; added focused unit coverage for whitespace-only body rejection.
- 2026-02-13: Hardened shared timeout parser internals to validate default timeout values (`defaultValue`) as strict positive safe integers within supported bounds; expanded helper unit coverage with invalid-default rejection cases (zero, non-integer, above-ceiling) to lock fallback contract semantics.
- 2026-02-13: Expanded `changeset-status-ci-lib` regression coverage with an only-warnings output case asserting empty passthrough output, locking filtered-output behavior when warning suppression removes all lines.
- 2026-02-13: Expanded shared timeout default-validation unit coverage with non-finite (`NaN`) default rejection, locking finite-number constraints in helper fallback semantics.
- 2026-02-13: Hardened shared `test-fixtures` temp-directory input validation (non-string and empty-string rejection), preventing ambiguous path inputs before fake-bin filesystem operations; added focused unit coverage for invalid temp-directory paths.
- 2026-02-13: Expanded shared timeout default-validation regression coverage with explicit `Infinity` rejection in both `resolveStrictPositiveIntegerEnv` and `resolveTimeoutFromCliAndEnv` helper tests, locking finite default constraints across direct and composed timeout resolution paths.
- 2026-02-13: Expanded shared `test-fixtures` regression coverage with non-string executable-body rejection, locking helper body-type input contract semantics in addition to empty/whitespace body guards.
- 2026-02-13: Hardened shared timeout parser option-metadata validation with explicit option-name guards (rejecting empty/non-string names) and expanded helper unit coverage for direct/composed invalid-name rejection paths.
- 2026-02-13: Hardened shared `cli-arg-values` helper option-contract validation (flag-name, known-args set, boolean option toggles, allowed-known-values set) and expanded helper unit coverage for invalid-option rejection paths.
- 2026-02-13: Hardened shared timeout parser raw-value input contract by rejecting non-string timeout values before normalization and expanded helper unit coverage for direct/composed non-string raw-value rejection.
- 2026-02-13: Hardened shared timeout precedence helper composed-options contract validation (required `env`/`cli` option objects) and expanded helper unit coverage for missing option-object rejection paths.
- 2026-02-13: Hardened `readRequiredArgumentValue` call-site contract validation in shared `cli-arg-values` helper (`argv` array + non-negative integer index) and expanded helper unit coverage for invalid argv/index rejection paths.
- 2026-02-13: Hardened shared `test-fixtures` path-token sanitization by rejecting null-byte temp-directory/executable-name inputs and expanded helper unit coverage for null-byte rejection paths.
- 2026-02-13: Hardened shared `cli-arg-values` top-level options-object contract validation (missing/non-object options rejection) and expanded helper unit coverage for direct/read-path invalid-options rejection.
- 2026-02-13: Expanded shared timeout precedence helper options-shape coverage with missing top-level options and non-object `env`/`cli` option rejection paths.
- 2026-02-13: Hardened shared `test-fixtures` script-payload sanitization by rejecting null-byte executable-body inputs and expanded helper unit coverage for null-byte body rejection.
- 2026-02-13: Hardened shared timeout precedence helper options-shape validation by rejecting array-shaped `options`/`env`/`cli` containers and expanded helper unit coverage for array-shape rejection paths.
- 2026-02-13: Hardened shared `cli-arg-values` options-shape validation by rejecting array-shaped options containers and expanded helper unit coverage for array-options rejection across direct/read-path entrypoints.
- 2026-02-13: Expanded shared timeout default-validation coverage with non-numeric default-type (`string`) rejection paths for both direct and composed timeout-resolution helpers.
- 2026-02-13: Hardened shared `cli-arg-values` token-set contract validation by enforcing string-only entries in `knownArgs`/`allowedKnownValues` and expanded helper unit coverage for non-string set-entry rejection.
- 2026-02-13: Hardened shared `cli-arg-values` value-type contract by rejecting non-string required argument values before string-token operations and expanded helper unit coverage for direct/read-path non-string value rejection.
- 2026-02-13: Hardened shared `cli-arg-values` token-set entry contract by rejecting empty/whitespace `knownArgs`/`allowedKnownValues` entries and expanded helper unit coverage for blank token-entry rejection paths.
- 2026-02-13: Hardened shared timeout env-resolution helper top-level options contract (missing/array options rejection before destructuring) and expanded helper unit coverage for malformed options-object rejection paths.
- 2026-02-13: Hardened shared timeout parser error-value formatting with safe string conversion (Symbol-safe) and expanded helper unit coverage for Symbol invalid option-name/default/raw-value rejection paths.
- 2026-02-13: Hardened shared `cli-arg-values` error-value formatting with safe string conversion (Symbol-safe) and expanded helper unit coverage for Symbol invalid value/flag-name/index rejection paths.
- 2026-02-13: Hardened shared `test-fixtures` error-value formatting with safe string conversion (Symbol-safe) and expanded helper unit coverage for Symbol temp-directory/executable-name/body rejection paths.
- 2026-02-13: Expanded shared timeout precedence helper coverage with composed Symbol option-name rejection for `env.name` and `cli.name`.
- 2026-02-13: Expanded shared timeout parser error-format coverage with unprintable (`toString`-throwing) option-name/default/raw-value inputs, locking `[unprintable]` fallback semantics.
- 2026-02-13: Expanded shared `cli-arg-values` error-format coverage with unprintable (`toString`-throwing) value/flag-name/index inputs, locking `[unprintable]` fallback semantics.
- 2026-02-13: Expanded shared `test-fixtures` error-format coverage with unprintable (`toString`-throwing) temp-directory/executable-name/body inputs, locking `[unprintable]` fallback semantics.
- 2026-02-13: Expanded shared timeout precedence helper coverage with unprintable (`toString`-throwing) composed `env.name`/`cli.name` option-name rejection paths.
- 2026-02-13: Hardened shared `readRequiredArgumentValue` cursor-bounds validation by rejecting out-of-range indexes (`index >= argv.length`) and expanded helper unit coverage for out-of-range index rejection.
- 2026-02-13: Hardened `changeset-status-ci-lib` input contract with explicit non-string output rejection and expanded helper unit coverage for non-string/symbol/unprintable output rejection paths.
- 2026-02-13: Expanded shared timeout-helper coverage with explicit `null` invalid-input rejection paths (direct raw timeout + composed env-name + composed cli raw timeout cases).
- 2026-02-13: Expanded shared `cli-arg-values` coverage with explicit `null` invalid-input rejection paths (value token, `flagName`, options object, argument index).
- 2026-02-13: Expanded shared `test-fixtures` coverage with explicit `null` invalid-input rejection paths (`tempDirectory`, executable name, executable body).
- 2026-02-13: Expanded `changeset-status-ci-lib` coverage with explicit `null` output rejection, locking null-input contract semantics for filter helper entrypoints.
- 2026-02-13: Hardened shared `cli-arg-values` option-contract validation by requiring `allowedKnownValues` entries to be a subset of `knownArgs`, with focused helper unit coverage for mismatched token-set rejection paths.
- 2026-02-13: Expanded shared timeout precedence helper coverage with explicit `null` environment raw-timeout rejection, locking null-value contract semantics alongside existing composed env/cli option guards.
- 2026-02-13: Expanded shared timeout-helper coverage with explicit `null` default-timeout rejection and `null` composed CLI option-name rejection paths, locking additional null-input contract semantics in direct/composed timeout resolution.
- 2026-02-13: Expanded shared `cli-arg-values` token-set coverage with explicit `null` entry rejection for both `knownArgs` and `allowedKnownValues`, locking null token-entry contract semantics in helper option validation.
