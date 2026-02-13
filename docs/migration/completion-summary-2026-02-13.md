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

CI automation now runs the same gate in:

- `ci.yml` (push/PR)
- `contract-checks.yml` (contract-focused gate + explicit contract payload validation)
- `nightly-regression.yml` (daily scheduled drift detection)
- `release.yml` (pre-publish release guard before changesets action)

Release pipeline build uses:

- `npm run release:build` (root emulator/lib build + workspace package builds)
- `npm run release:verify` (full no-build quality gate + changeset status)

Contract workflow uses:

- `npm run contract:ci` (package build + quality gate + changeset status + sample contract validation)

Workflow hardening applied:

- explicit workflow permissions (least privilege defaults)
- concurrency groups with `cancel-in-progress` to avoid duplicate CI spend
- shared install command (`npm run install:stack`) to keep CI/release dependency setup consistent across workflows
- deterministic lockfile install command (`npm run install:stack:ci`) now used across all workflows
- CI install command uses `--ignore-scripts` to avoid redundant prepare builds during dependency bootstrap
- setup-node cache dependency paths include all workspace lockfiles for stable multi-package npm cache keys
- release workflow now also caches Next.js build artifacts for debugger app builds

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
