# Technical Debt Register (2026-02-14)

This register tracks known debt discovered during migration hardening.

Severity scale:

- **S1 (Critical):** can break CI/release integrity or correctness guarantees.
- **S2 (High):** meaningful reliability/perf/maintainability risk.
- **S3 (Medium):** important cleanup/refactor opportunity.
- **S4 (Low):** quality polish / future optimization.

Ownership tags are subsystem owners (team-level), not individual names.

## Open debt items

| Debt ID | Area | Description | Severity | Owner Tag | Source | Status |
| ------- | ---- | ----------- | -------- | --------- | ------ | ------ |


## Closed debt items (resolved in migration cycle)

| Debt ID | Area                                | Resolution                                                                                                                                                                                                   | Severity at close | Owner Tag             |
| ------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- | --------------------- |
| TD-C001 | Security/audit                      | Removed vulnerable dependency chains and reached `npm audit --omit=optional` = 0 vulnerabilities.                                                                                                            | S1                | `@repo-tooling`       |
| TD-C002 | Contract drift                      | Added runtime + test-level schema validation gates for v1 payloads.                                                                                                                                          | S1                | `@contracts-api`      |
| TD-C003 | CI parity drift                     | Consolidated quality gates into shared scripts and cross-workflow parity commands (`ci:local`, `automation:check`).                                                                                          | S2                | `@automation-tooling` |
| TD-C004 | Pre-commit architecture             | Migrated from deprecated `scripts.precommit` hook discovery to explicit `husky.hooks.pre-commit` wiring (`precommit:hook`).                                                                                  | S3                | `@repo-tooling`       |
| TD-C005 | Dist/build policy ergonomics        | Added dedicated contributor guidance for intentional generated-artifact commits, including per-command override usage and safeguards (`generated-artifact-commit-policy-2026-02-14.md`).                     | S4                | `@repo-tooling`       |
| TD-C006 | Core memory mapping contract        | Added periodic wasm-export contract check (`core:memory-offset:check`) plus script-level regression coverage to enforce invalid-offset sentinel and valid-boundary mappings.                                 | S2                | `@core-memory`        |
| TD-C007 | Core save/load determinism          | Classified volatile `WASMBOY_STATE` byte offsets and enforced non-volatile determinism in serialization regression coverage (`core-save-state-volatile-field-classification-2026-02-14.md`).                 | S2                | `@core-state`         |
| TD-C008 | Automation parser complexity        | Added shared schema-driven throw-case registration helper (`scripts/test-schema-helpers.mjs`) and migrated repeated parser validation suites to the shared fixture pattern.                                  | S4                | `@automation-tooling` |
| TD-C009 | Wrapper allocation pressure         | Refactored snapshot fallback reads to batch register-block fetches and selective layer retrieval for `getPpuSnapshotLayers`, preventing full snapshot allocations for partial layer requests.                | S3                | `@wrapper-voxel`      |
| TD-C010 | Wrapper direct memory               | Implemented capability-based `getDirectMemoryAccess()` using optional sync hooks (`_getWasmMemoryView` / `_getWasmMemoryBuffer`) with bounds validation and wrapper readiness integration coverage.          | S4                | `@wrapper-voxel`      |
| TD-C011 | Debugger worker lifecycle           | Added worker restart telemetry events, capped exponential backoff tuning, and surfaced restart diagnostics in debugger UI state (`apps/debugger/lib/worker-loader.ts`, `apps/debugger/app/page.tsx`).        | S3                | `@debugger-runtime`   |
| TD-C012 | Debugger large-dataset UX           | Added paginated timeline deep-inspection UX with oldest/older/newer/newest controls and tested page-window selection helpers for large snapshot histories.                                                   | S4                | `@debugger-ui`        |
| TD-C013 | Core memory banking                 | Split `handleBanking` branch fan-out into focused banking helpers (RAM enable, ROM lower bits, RAM/upper ROM select, mode toggles) while preserving behavior and validating with core/integration tests.     | S3                | `@core-memory`        |
| TD-C014 | Core sound perf/clarity             | Consolidated repeated sound-channel frequency synchronization writes into shared `syncFrequencyFromRegisters()` helpers across channels 1-3, reducing redundant update sites while preserving behavior.      | S3                | `@core-audio`         |
| TD-C015 | Core graphics perf                  | Hoisted frame-stable config/mode branches out of background pixel loops and cached per-iteration scanline cycle budget in graphics update loop; validated with throughput + headless integration tests.      | S3                | `@core-graphics`      |
| TD-C016 | Integration artifact hygiene        | Updated headless integration output paths to `.output` artifacts and expanded cleanup automation to remove integration `.output` files, preventing accidental tracked screenshot churn during local tests.   | S4                | `@repo-tooling`       |
| TD-C017 | Integration cleanup defaults        | Added cleanup-wrapped headless integration commands and routed aggregate integration scripts to use them by default, preventing residual output artifact accumulation in local/CI workflows.                 | S4                | `@repo-tooling`       |
| TD-C018 | Integration script contracts        | Added package-script contract regressions to enforce cleanup-wrapped headless integration wiring (`scripts/package-scripts-contract.test.mjs`) across aggregate integration commands.                        | S4                | `@automation-tooling` |
| TD-C019 | Integration staging guard           | Extended generated-artifact pre-commit guard to block staged `test/integration/*.output` artifacts and updated policy docs/tests to prevent accidental commit churn from transient headless outputs.         | S4                | `@repo-tooling`       |
| TD-C020 | Accuracy/perf staging guard         | Extended generated-artifact pre-commit guard to block non-golden `test/accuracy/testroms` outputs and non-baseline `test/performance/testroms` PNG artifacts while allowing golden/baseline files.           | S4                | `@repo-tooling`       |
| TD-C021 | Artifact policy parity              | Added artifact-policy parity regressions to ensure cleanup and staging-guard behavior remain aligned across generated test outputs and approved baseline artifacts.                                          | S4                | `@automation-tooling` |
| TD-C022 | Artifact policy centralization      | Consolidated generated-artifact policy rules into a shared module (`scripts/artifact-policy.mjs`) consumed by both cleanup and pre-commit guard scripts, reducing duplicated logic and drift risk.           | S4                | `@automation-tooling` |
| TD-C023 | Artifact policy source tests        | Added direct unit coverage for shared artifact-policy helper predicates and path normalization to lock generated-artifact classification behavior independent of wrapper scripts.                            | S4                | `@automation-tooling` |
| TD-C024 | Cleanup dry-run ergonomics          | Added `clean-accidental-build-artifacts` CLI flag parsing (`--dry-run`, `--help`) with dry-run candidate reporting and parser regressions to support safer local artifact policy verification workflows.     | S4                | `@automation-tooling` |
| TD-C025 | Cleanup dry-run discoverability     | Added package script and contract coverage for `clean:artifacts:precommit:dry-run` plus README/policy docs so dry-run artifact inspection stays visible and regression-checked across contributor workflows. | S4                | `@automation-tooling` |
| TD-C026 | Guard CLI usability                 | Added generated-artifact guard CLI parser/help contract (`--help`, unknown-flag rejection) with regression tests so manual pre-commit guard invocation has explicit, validated usage behavior.               | S4                | `@automation-tooling` |
| TD-C027 | Artifact CLI executable contracts   | Added subprocess-driven CLI contract tests covering cleanup/guard script usage and unknown-flag behavior, protecting executable interface guarantees beyond direct function-level tests.                     | S4                | `@automation-tooling` |
| TD-C028 | Artifact CLI diagnostic clarity     | Removed duplicate script-prefix noise from cleanup/guard unknown-flag parser failures and refreshed function + subprocess contract tests so diagnostics stay concise and actionable.                         | S4                | `@automation-tooling` |
| TD-C029 | Guard blocked-path dedupe           | De-duplicated normalized blocked artifact paths in `findBlockedArtifactPaths` and added regression coverage so pre-commit diagnostics remain concise under duplicate path alias staging scenarios.           | S4                | `@automation-tooling` |
| TD-C030 | Artifact policy normalization reuse | Consolidated shared artifact-policy predicate flow to avoid redundant normalization between remove/block helpers and added windows-path generated-output block coverage to protect cross-platform behavior.  | S4                | `@automation-tooling` |
| TD-C031 | Cleanup CLI behavior contracts      | Added subprocess-level dry-run vs destructive cleanup behavior tests in temporary workspaces to ensure command-line cleanup semantics stay correct beyond internal helper unit coverage.                     | S4                | `@automation-tooling` |
| TD-C032 | Artifact policy input guards        | Added explicit string-parameter validation in shared artifact-policy helpers plus non-string regression tests, making consumer contract violations fail fast with actionable diagnostics.                    | S4                | `@automation-tooling` |
| TD-C033 | Guard input contract checks         | Added strict staged-path input validation (array + string entries) in `findBlockedArtifactPaths` with regression coverage to prevent opaque failures from malformed guard helper consumers.                  | S4                | `@automation-tooling` |
| TD-C034 | Cleanup JSON output contract        | Added `clean-accidental-build-artifacts --json` support with parser + subprocess regression coverage, providing deterministic machine-readable cleanup summaries for automation and tooling integrations.    | S4                | `@automation-tooling` |

## Triage cadence

- Re-rank severity weekly (or after major regressions).
- Move items to “Closed” only when code + tests + docs are landed.
- For S1/S2 items, include explicit issue links and milestone targets once
  formal tracker IDs are assigned.
