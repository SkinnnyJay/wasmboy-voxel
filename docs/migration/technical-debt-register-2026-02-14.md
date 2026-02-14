# Technical Debt Register (2026-02-14)

This register tracks known debt discovered during migration hardening.

Severity scale:

- **S1 (Critical):** can break CI/release integrity or correctness guarantees.
- **S2 (High):** meaningful reliability/perf/maintainability risk.
- **S3 (Medium):** important cleanup/refactor opportunity.
- **S4 (Low):** quality polish / future optimization.

Ownership tags are subsystem owners (team-level), not individual names.

## Open debt items

| Debt ID | Area                      | Description                                                                                                                  | Severity | Owner Tag           | Source                                                                | Status |
| ------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------- | --------------------------------------------------------------------- | ------ |
| TD-003  | Core graphics perf        | Branch-heavy hot loops in scanline/background/sprite paths need selective branch-hoist refactors.                            | S3       | `@core-graphics`    | `docs/migration/core-graphics-branch-churn-profile-2026-02-14.md`     | Open   |
| TD-004  | Core sound perf/clarity   | Duplicate state-write sites and repeated frequency sync paths in sound channels remain partially redundant.                  | S3       | `@core-audio`       | `docs/migration/core-sound-duplicate-state-write-audit-2026-02-14.md` | Open   |
| TD-005  | Core memory banking       | `handleBanking`/trap branching fan-out remains high; split-by-family refactor still pending.                                 | S3       | `@core-memory`      | `docs/migration/core-memory-banking-branch-audit-2026-02-14.md`       | Open   |
| TD-007  | Wrapper direct memory     | `getDirectMemoryAccess()` remains a stub (`available: false`), limiting high-frequency read optimization paths.              | S4       | `@wrapper-voxel`    | `voxel-wrapper.ts`                                                    | Open   |
| TD-008  | Debugger worker lifecycle | Crash auto-restart exists, but restart telemetry and capped backoff tuning are not yet instrumented in UI-level diagnostics. | S3       | `@debugger-runtime` | `docs/migration/debugger-worker-boot-race-audit-2026-02-14.md`        | Open   |
| TD-009  | Debugger large-dataset UX | Bounded rendering is in place, but paginated/virtualized deep inspection UX for very large timelines remains incomplete.     | S4       | `@debugger-ui`      | `apps/debugger/docs/migration/debugger-usage-guide.md`                | Open   |

## Closed debt items (resolved in migration cycle)

| Debt ID | Area                         | Resolution                                                                                                                                                                                    | Severity at close | Owner Tag             |
| ------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------- |
| TD-C001 | Security/audit               | Removed vulnerable dependency chains and reached `npm audit --omit=optional` = 0 vulnerabilities.                                                                                             | S1                | `@repo-tooling`       |
| TD-C002 | Contract drift               | Added runtime + test-level schema validation gates for v1 payloads.                                                                                                                           | S1                | `@contracts-api`      |
| TD-C003 | CI parity drift              | Consolidated quality gates into shared scripts and cross-workflow parity commands (`ci:local`, `automation:check`).                                                                           | S2                | `@automation-tooling` |
| TD-C004 | Pre-commit architecture      | Migrated from deprecated `scripts.precommit` hook discovery to explicit `husky.hooks.pre-commit` wiring (`precommit:hook`).                                                                   | S3                | `@repo-tooling`       |
| TD-C005 | Dist/build policy ergonomics | Added dedicated contributor guidance for intentional generated-artifact commits, including per-command override usage and safeguards (`generated-artifact-commit-policy-2026-02-14.md`).      | S4                | `@repo-tooling`       |
| TD-C006 | Core memory mapping contract | Added periodic wasm-export contract check (`core:memory-offset:check`) plus script-level regression coverage to enforce invalid-offset sentinel and valid-boundary mappings.                  | S2                | `@core-memory`        |
| TD-C007 | Core save/load determinism   | Classified volatile `WASMBOY_STATE` byte offsets and enforced non-volatile determinism in serialization regression coverage (`core-save-state-volatile-field-classification-2026-02-14.md`).  | S2                | `@core-state`         |
| TD-C008 | Automation parser complexity | Added shared schema-driven throw-case registration helper (`scripts/test-schema-helpers.mjs`) and migrated repeated parser validation suites to the shared fixture pattern.                   | S4                | `@automation-tooling` |
| TD-C009 | Wrapper allocation pressure  | Refactored snapshot fallback reads to batch register-block fetches and selective layer retrieval for `getPpuSnapshotLayers`, preventing full snapshot allocations for partial layer requests. | S3                | `@wrapper-voxel`      |

## Triage cadence

- Re-rank severity weekly (or after major regressions).
- Move items to “Closed” only when code + tests + docs are landed.
- For S1/S2 items, include explicit issue links and milestone targets once
  formal tracker IDs are assigned.
