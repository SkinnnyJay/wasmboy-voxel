# Breaking Change Policy (Migration Window)

## Policy

During the migration window:

- Existing runtime behavior used by `gameboy-remix` must remain functional.
- New APIs may be added, but existing APIs are removed only after a documented
  deprecation period.
- Any behavior change must be accompanied by:
  - updated migration notes
  - regression tests
  - explicit changelog entry

## Deprecation Process

1. Add a dev-only deprecation warning.
2. Document migration replacement path.
3. Keep compatibility shim in place for at least one release cycle.
4. Remove deprecated behavior only after downstream confirmation.

## Required Gates Before Merge

- `stack:build`, `stack:typecheck`, and `stack:test` pass.
- integration/core regression checks pass.
- contract-check CI workflow passes.
