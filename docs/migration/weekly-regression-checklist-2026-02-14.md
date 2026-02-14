# Weekly Regression Checklist (2026-02-14)

Use this checklist once per week (or before significant release windows) to
confirm regression coverage, docs alignment, and CI health.

## 1) CI and workflow health

- [ ] `ci.yml` latest default-branch run is green (quality gate + automation matrix).
- [ ] `contract-checks.yml` latest run is green.
- [ ] `nightly-regression.yml` latest scheduled run is green.
- [ ] `release.yml` latest verification run is green (or intentionally dry-run only).
- [ ] No unresolved flaky warnings in automation-matrix logs.
- [ ] Failure diagnostics artifacts (if any) were reviewed and triaged.

## 2) Local quality gate verification

Run and verify success:

```bash
npm run ci:local
```

If strict validation is needed:

```bash
npm run ci:local:strict
```

## 3) Focused smoke and safety checks

- [ ] Scoped workspace test smoke matrix:
  ```bash
  npm run stack:test:smoke:scopes
  ```
- [ ] Memory-layout compatibility:
  ```bash
  npm run memory:layout:check
  ```
- [ ] Library console lint guard:
  ```bash
  npm run lint:library:console
  ```
- [ ] Security advisory scan:
  ```bash
  npm run security:scan:workspaces:strict
  ```
- [ ] Dependency freshness report review:
  ```bash
  npm run dependency:freshness:audit
  ```

## 4) Regression suites and performance budgets

- [ ] Core regression suite passes:
  ```bash
  npm run test:core:nobuild
  ```
- [ ] Integration regression suite passes:
  ```bash
  npm run test:integration:nobuild
  ```
- [ ] Throughput and budget checks pass:
  ```bash
  npm run test:performance:throughput
  npm --prefix apps/debugger test
  ```
- [ ] Review `docs/migration/performance-budgets-2026-02-14.md` for threshold drift requests.

## 5) Documentation and debt sync

- [ ] `PLAN.md` execution log reflects newly completed hardening tasks.
- [ ] `docs/migration/completion-summary-2026-02-13.md` includes this week’s outcomes.
- [ ] `docs/migration/technical-debt-register-2026-02-14.md` severities/statuses reviewed.
- [ ] `docs/migration/migration-docs-normalized-sections-2026-02-14.md` updated if new capability areas were added.
- [ ] `README.md` command/workflow docs remain aligned with automation changes.

## 6) Release readiness spot-check (optional weekly, required pre-release)

- [ ] Verification-only release path:
  ```bash
  npm run release:verify
  npm run release:checklist:npm-dry-run
  ```
- [ ] Confirm release workflow mode expectations (dry-run vs approved publish).
