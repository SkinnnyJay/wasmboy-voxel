# Migration Completion Summary (2026-02-13)

## Outcome

The migration plan phases were executed end-to-end, including:

- typed contracts package (`@wasmboy/api`)
- wrapper contract gates and compatibility export
- debugger app scaffold + state/events + read-only debug API
- CLI tooling package (`@wasmboy/cli`)
- regression safety suite expansion
- CI/release workflow automation
- dependency hardening and audit cleanup

## Validation snapshot

Primary command used for final continuous validation:

```bash
npm run test:all:nobuild
```

This executes:

- workspace lint/typecheck/tests
- integration regressions
- core regressions
- headless throughput baseline
- dependency audit check

Stability hardening:

- headless integration command now includes a single Mocha retry (`--retries 1`) to reduce intermittent golden-frame CI flakes while preserving strict golden comparison semantics.
- core save-state command now includes a single Mocha retry (`--retries 1`) to reduce intermittent screenshot-timing flakes while preserving golden-state assertions.
- retries are scoped to CI-specific commands (`test:integration:headless:ci`, `test:core:savestate:ci`), while default local commands remain strict single-run checks.
- `ci:local:strict` is available to run the full no-build gate using strict single-run integration/core commands.

CI automation now runs the same gate in:

- `ci.yml` (push/PR)
- `contract-checks.yml` (contract-focused gate + explicit contract payload validation)
- `nightly-regression.yml` (daily scheduled drift detection)
- `release.yml` (pre-publish release guard before changesets action)
- CI and nightly workflows invoke `npm run ci:local` directly to keep local/remote quality-gate parity exact

CI and contract workflows now include:

- `workflow_dispatch` manual trigger support
- push/PR path filters so full CI runs only for relevant runtime/package/test/workflow changes
- trigger path lists aligned to existing repo files (removed stale `pnpm-workspace.yaml` references)
- CI workflow path filters include `.github/workflows/*.yml` so workflow-only changes still get full quality-gate validation
- workflow trigger paths include `scripts/**` where scripts are used by CI/contract/release gates (e.g. `changeset:status:ci`)
- CI and nightly manual dispatch include `strict` input support to run no-retry full-gate verification on demand

Release pipeline build uses:

- `npm run release:build` (root emulator/lib build + workspace package builds)
- `npm run release:verify` (full no-build quality gate + changeset status)
- push trigger path filters so release automation runs only when releasable/runtime/package metadata changes
- `release:verify` now composes `ci:local + changeset:status:ci` for direct local/CI gate parity
- `release:verify:strict` is available for strict no-retry release verification and is selectable in manual release workflow runs

Contract workflow uses:

- `npm run ci:packages` (package build + package typecheck/tests)
- `npm run contract:ci` (workflow lint + package CI checks + changeset status + sample contract validation)
- `npm run contract:ci:full` (full `ci:local` gate + changeset status + sample contract validation)
- `npm run changeset:status:ci` (deduplicated/suppressed expected local file-dependency notices in CI output)
- path filters so the workflow runs only when contract/package/release-metadata files change (including debugger package metadata used by changeset checks)
- contract workflow path filters include `contracts/**` so contract-schema/documentation edits still exercise contract CI gates
- contract workflow manual dispatch supports `full_gate=true` to execute `contract:ci:full` on demand

Workflow hardening applied:

- explicit workflow permissions (least privilege defaults)
- concurrency groups with `cancel-in-progress` to avoid duplicate CI spend
- shared install command (`npm run install:stack`) to keep CI/release dependency setup consistent across workflows
- deterministic lockfile install command (`npm run install:stack:ci`) now used across all workflows
- CI install command uses `--ignore-scripts` to avoid redundant prepare builds during dependency bootstrap
- CI install command disables install-time audit/fund output (`--no-audit --fund=false`) since audit is enforced in the dedicated quality gate
- package-focused deterministic install command (`npm run install:packages:ci`) used by contract workflow to avoid unnecessary app dependency bootstrap
- stack-level deterministic install now composes package-level install (`install:stack:ci` -> `install:packages:ci` + debugger install) to reduce duplication
- setup-node cache dependency paths include all workspace lockfiles for stable multi-package npm cache keys
- contract workflow cache keys now omit debugger lockfile to better match package-only install inputs
- release workflow now also caches Next.js build artifacts for debugger app builds
- workflow formatting checks are enforced via `workflow:lint` and included in the unified quality gate
- workflow formatting can be auto-remediated locally via `workflow:format`
- automation helper scripts are linted via `scripts:lint` and included in the unified quality gate
- automation helper scripts can be auto-formatted via `scripts:format`
- `workflow:check` consolidates workflow + automation script format checks for reuse in CI scripts
- automation helper scripts are covered by `automation:test` (Node test runner), and this test step is included in the unified quality gate
- automation coverage includes diagnostics bundle behavior checks (matched files, empty-placeholder fallback, duplicate-pattern deduplication)
- automation coverage includes `changeset:status:ci` filtering behavior checks (expected warning suppression and deduplication)
- CI and nightly workflows now capture full quality-gate logs and relevant screenshot outputs as artifacts on failure for faster triage
- contract and release workflows now capture gate logs as failure artifacts to support post-failure debugging without reruns
- release workflow failure artifacts now also include core/headless generated screenshots from release verification test failures
- failure diagnostics artifacts use a 14-day retention window to balance triage utility with storage footprint
- log-capturing workflow steps explicitly use `shell: bash` to guarantee `set -o pipefail` behavior
- failure artifact names include run id/attempt for clearer traceability in repeated or retried runs
- diagnostics upload steps now run on both failure and cancellation, preserving partial logs from interrupted pipelines
- workflows now set job-level `defaults.run.shell: bash` so bash semantics are consistently applied across all run steps
- diagnostics are archived into per-workflow tarballs before upload to keep artifacts compact and grouped for easier download/inspection
- diagnostics bundling now collects only existing files (with placeholder manifests when empty), avoiding noisy tar missing-file warnings on early-fail/early-cancel paths
- diagnostics bundling is centralized via `scripts/bundle-diagnostics.mjs`, reducing duplicated workflow shell logic across CI/contract/nightly/release pipelines

## Security posture at completion

```bash
npm audit --omit=optional
```

Result at completion: **0 vulnerabilities**.

## Release markers

- annotated tag: `v0.8.0-migration-preview.1`
- release changeset added for:
  - `@wasmboy/api` (minor)
  - `@wasmboy/cli` (minor)
