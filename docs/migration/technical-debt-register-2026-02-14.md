# Technical Debt Register (2026-02-14)

This register tracks known debt discovered during migration hardening.

Severity scale:

- **S1 (Critical):** can break CI/release integrity or correctness guarantees.
- **S2 (High):** meaningful reliability/perf/maintainability risk.
- **S3 (Medium):** important cleanup/refactor opportunity.
- **S4 (Low):** quality polish / future optimization.

Ownership tags are subsystem owners (team-level), not individual names.

## Open debt items

| Debt ID | Area                         | Description                                                                                                                                                   | Severity | Owner Tag             | Source                                                                 | Status |
| ------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------- | ---------------------------------------------------------------------- | ------ |
| TD-001  | Core memory mapping          | `getWasmBoyOffsetFromGameBoyOffset` invalid-address sentinel logic depends on wrapper/runtime assumptions; protect with periodic wasm-export contract checks. | S2       | `@core-memory`        | `test/core/invalid-memory-trap-address-test.cjs`                       | Open   |
| TD-002  | Core save/load determinism   | `wasmboyState` region remains excluded from strict byte-equality determinism assertion; needs explicit volatile-field classification.                         | S2       | `@core-state`         | `test/core/serialization-determinism-test.cjs`                         | Open   |
| TD-003  | Core graphics perf           | Branch-heavy hot loops in scanline/background/sprite paths need selective branch-hoist refactors.                                                             | S3       | `@core-graphics`      | `docs/migration/core-graphics-branch-churn-profile-2026-02-14.md`      | Open   |
| TD-004  | Core sound perf/clarity      | Duplicate state-write sites and repeated frequency sync paths in sound channels remain partially redundant.                                                   | S3       | `@core-audio`         | `docs/migration/core-sound-duplicate-state-write-audit-2026-02-14.md`  | Open   |
| TD-005  | Core memory banking          | `handleBanking`/trap branching fan-out remains high; split-by-family refactor still pending.                                                                  | S3       | `@core-memory`        | `docs/migration/core-memory-banking-branch-audit-2026-02-14.md`        | Open   |
| TD-006  | Wrapper allocation pressure  | Snapshot fallback path still does repeated single-byte reads and full-layer fetches even for partial layer requests.                                          | S3       | `@wrapper-voxel`      | `docs/migration/voxel-wrapper-snapshot-allocation-audit-2026-02-14.md` | Open   |
| TD-007  | Wrapper direct memory        | `getDirectMemoryAccess()` remains a stub (`available: false`), limiting high-frequency read optimization paths.                                               | S4       | `@wrapper-voxel`      | `voxel-wrapper.ts`                                                     | Open   |
| TD-008  | Debugger worker lifecycle    | Crash auto-restart exists, but restart telemetry and capped backoff tuning are not yet instrumented in UI-level diagnostics.                                  | S3       | `@debugger-runtime`   | `docs/migration/debugger-worker-boot-race-audit-2026-02-14.md`         | Open   |
| TD-009  | Debugger large-dataset UX    | Bounded rendering is in place, but paginated/virtualized deep inspection UX for very large timelines remains incomplete.                                      | S4       | `@debugger-ui`        | `apps/debugger/docs/migration/debugger-usage-guide.md`                 | Open   |
| TD-010  | Automation parser complexity | Wrapper helper argument/timeout suites are comprehensive but now dense; candidate for shared fixture/schema-driven generation.                                | S4       | `@automation-tooling` | `scripts/**/*.test.mjs`                                                | Open   |
| TD-011  | Pre-commit architecture      | Husky v1 script hook style emits deprecation warnings; migrate to modern husky hook config.                                                                   | S3       | `@repo-tooling`       | pre-commit output warnings                                             | Open   |
| TD-012  | Dist/build policy ergonomics | Generated-artifact guard supports override env but lacks dedicated contributor docs for intentional release-time artifact commits.                            | S4       | `@repo-tooling`       | `scripts/guard-generated-artifacts-precommit.mjs`                      | Open   |

## Closed debt items (resolved in migration cycle)

| Debt ID | Area            | Resolution                                                                                                          | Severity at close | Owner Tag             |
| ------- | --------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------- |
| TD-C001 | Security/audit  | Removed vulnerable dependency chains and reached `npm audit --omit=optional` = 0 vulnerabilities.                   | S1                | `@repo-tooling`       |
| TD-C002 | Contract drift  | Added runtime + test-level schema validation gates for v1 payloads.                                                 | S1                | `@contracts-api`      |
| TD-C003 | CI parity drift | Consolidated quality gates into shared scripts and cross-workflow parity commands (`ci:local`, `automation:check`). | S2                | `@automation-tooling` |

## Triage cadence

- Re-rank severity weekly (or after major regressions).
- Move items to “Closed” only when code + tests + docs are landed.
- For S1/S2 items, include explicit issue links and milestone targets once
  formal tracker IDs are assigned.
