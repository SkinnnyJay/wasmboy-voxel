# Generated Artifact Commit Policy (2026-02-14)

By default, pre-commit blocks staged:

- `dist/**`
- `build/**`
- `test/integration/**/*.output`
- `test/integration/**/*.output.png`
- non-golden `test/accuracy/testroms/**/*.output`
- non-golden `test/accuracy/testroms/**/*.png`
- non-baseline `test/performance/testroms/**/*.png`

This protects the repo from accidental generated-output drift.

## Default behavior

- `scripts/clean-accidental-build-artifacts.mjs` removes transient generated files
  (use `node scripts/clean-accidental-build-artifacts.mjs --dry-run` to inspect
  candidates without deleting, or `--dry-run --json` for machine-readable
  summaries; npm shortcuts: `clean:artifacts:precommit:dry-run` and
  `clean:artifacts:precommit:json`).
- `scripts/guard-generated-artifacts-precommit.mjs` blocks staged generated paths
  and integration output artifacts (use `--help` for invocation/usage details,
  or `--json` for machine-readable validation summaries; npm shortcut:
  `guard:generated-artifacts:precommit:json`).

## Intentional exception path

If a generated artifact commit is intentional (for coordinated release/debug
reasons), temporarily allow it for that commit only:

```bash
WASMBOY_ALLOW_GENERATED_EDITS=1 git add -A
WASMBOY_ALLOW_GENERATED_EDITS=1 git commit -m "intentional generated artifact update"
```

## Required safeguards for intentional generated commits

1. Explain _why_ generated files are intentionally committed in the commit
   message and PR description.
2. Ensure source-of-truth files are included in the same change.
3. Run relevant build/test commands locally before committing.
4. Avoid setting `WASMBOY_ALLOW_GENERATED_EDITS=1` globally in shell startup
   files; use per-command env prefix only.

## Typical valid scenarios

- Controlled release artifact synchronization where downstream automation
  requires checked-in generated outputs.
- One-time migration snapshots that must be versioned for cross-repo consumers.

## Non-valid scenarios

- Local experiment artifacts.
- Partial build output from interrupted test runs.
- Headless integration `.output` screenshot/log artifacts.
- Any generated file added without corresponding source changes.
