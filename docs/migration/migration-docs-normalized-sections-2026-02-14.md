# Migration Docs — Normalized Sections (2026-02-14)

This document consolidates repeated migration-log items into stable sections so
readers can scan outcomes without walking duplicate per-iteration entries.

Primary sources normalized:

- `PLAN.md` execution log tail
- `docs/migration/completion-summary-2026-02-13.md` rolling bullets

## 1) CI, release, and quality-gate automation

Normalized outcomes:

- Unified quality gate orchestration through `ci:local` / `test:all:nobuild`.
- Shared automation preflight via `automation:check`.
- Deterministic install and cache flows across CI/contract/nightly/release.
- Failure artifact capture, compression, and retention standardization.
- Manual-dispatch strict/full-gate controls across major workflows.
- Lockfile drift + generated-artifact guardrails in CI and pre-commit.

Representative implementation anchors:

- `.github/workflows/*.yml`
- `scripts/bundle-diagnostics*.mjs`
- `scripts/changeset-status-ci*.mjs`
- root `package.json` quality-gate scripts

## 2) Automation helper CLI hardening

Normalized outcomes:

- Strict argument parsing parity (split + equals forms).
- Deterministic duplicate/help/unknown-token handling.
- Timeout precedence + bounds enforcement (`1..2147483647`).
- Clear usage/error-prefix contracts.
- High-coverage regression matrix for parser/runtime edge cases.

Representative implementation anchors:

- `scripts/cli-arg-values.mjs`
- `scripts/cli-timeout.mjs`
- `scripts/*.{test.mjs}`

## 3) Contracts and package surfaces

Normalized outcomes:

- `@wasmboy/api` schema strictness hardening (required fields, finite numeric checks,
  non-object rejection, roundtrip stability, throughput smoke checks).
- API export-surface auditing and semver policy documentation.
- `@wasmboy/cli` argument/FS/path/input hardening and docs expansion.

Representative implementation anchors:

- `packages/api/**`
- `packages/cli/**`
- `docs/migration/packages-api-export-audit-2026-02-13.md`
- `docs/migration/packages-cli-error-phrasing-audit-2026-02-13.md`

## 4) Debugger and wrapper resilience

Normalized outcomes:

- Worker boot/race/lifecycle hardening with restart behavior.
- Large timeline/log rendering safeguards.
- Malformed payload sanitization and selector-rerender optimizations.
- Wrapper readiness retries, null-fallback semantics, and partial-read failure safety.
- Core/wrapper memory-layout dependency documentation + automated drift checks.

Representative implementation anchors:

- `apps/debugger/**`
- `voxel-wrapper.ts`
- `test/integration/voxel-wrapper-readiness-test.mjs`
- `scripts/core-wrapper-memory-layout-check*.mjs`

## 5) Core reliability and performance guardrails

Normalized outcomes:

- Execute-loop throughput microbenchmark enforcement.
- Timer overflow and interrupt-priority regression coverage.
- Save/load determinism checks across core memory regions.
- Invalid memory address sentinel/guard behavior.
- Graphics/sound/memory branch-churn and duplicate-write audit docs.

Representative implementation anchors:

- `core/**`
- `test/core/*.cjs`
- `docs/migration/core-*.md`

## 6) Repository hygiene and contributor safety rails

Normalized outcomes:

- Pre-commit accidental artifact cleanup.
- Pre-commit staged `dist/**` / `build/**` guard.
- Library-console usage lint enforcement with allowlist.
- Scoped package/app test smoke matrix command coverage.

Representative implementation anchors:

- `scripts/clean-accidental-build-artifacts*.mjs`
- `scripts/guard-generated-artifacts-precommit*.mjs`
- `scripts/check-library-console-usage*.mjs`
- root `package.json` (`stack:test:smoke:scopes`)

## Ongoing update rule

For future entries, append details to subsystem-specific docs and only update
this normalized index when a new capability area is introduced or a section’s
high-level guarantees change.
