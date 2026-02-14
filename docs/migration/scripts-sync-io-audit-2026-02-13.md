# Scripts synchronous I/O audit (2026-02-13)

## Scope

Audited non-test files under `scripts/` for synchronous filesystem/process operations:

- `bundle-diagnostics.mjs`
- `changeset-status-ci.mjs`
- `changeset-status-ci-lib.mjs`
- `cli-arg-values.mjs`
- `cli-timeout.mjs`
- `test-fixtures.mjs`

## Findings

### `scripts/bundle-diagnostics.mjs`

Synchronous calls:

- `fs.realpathSync`
- `fs.globSync`
- `fs.existsSync`
- `fs.statSync`
- `fs.writeFileSync`
- `fs.mkdirSync`
- `fs.unlinkSync`
- `spawnSync('tar', ...)`

Tradeoff assessment:

- This script is an explicit batch CLI utility (single invocation, then exit).
- Sync I/O keeps error propagation linear and deterministic for usage/error messaging.
- Archive creation already dominates total runtime; async conversion would add complexity with limited practical latency gain.
- Current sync usage is acceptable for CI script ergonomics.

Potential future optimization:

- If this utility is ever embedded in a long-lived process, switch collection/cleanup flows to async `fs/promises` APIs and stream tar creation.

### `scripts/changeset-status-ci.mjs`

Synchronous calls:

- `spawnSync('changeset', ['status'])`

Tradeoff assessment:

- The script is a CI gate and naturally blocking on one subprocess.
- `spawnSync` simplifies exit-code propagation and keeps stdout/stderr ordering deterministic for logs.
- Async spawning would not reduce wall-clock time because no parallel work is performed.

Potential future optimization:

- None required unless this script is integrated into a daemonized service.

### `scripts/changeset-status-ci-lib.mjs`

Synchronous calls:

- none

Tradeoff assessment:

- Pure string processing library; no I/O hotspots.

### `scripts/cli-arg-values.mjs`

Synchronous calls:

- none

Tradeoff assessment:

- Pure validation/parser helpers; no I/O hotspots.

### `scripts/cli-timeout.mjs`

Synchronous calls:

- none

Tradeoff assessment:

- Pure timeout parsing/validation helpers; no I/O hotspots.

### `scripts/test-fixtures.mjs`

Synchronous calls:

- `fs.mkdirSync`
- `fs.writeFileSync`
- `fs.chmodSync`

Tradeoff assessment:

- Test-only helper used by synchronous integration tests.
- Sync calls reduce fixture setup complexity and avoid race conditions in tests.
- Cost is negligible relative to process spawn/test startup overhead.

Potential future optimization:

- Keep as-is unless test runtime profiling indicates fixture creation dominates execution time (currently low risk).

## Conclusion

No critical synchronous I/O hotspots were found for current use-cases. Existing sync calls are intentionally aligned with:

- deterministic CI output/error behavior,
- low implementation complexity for short-lived scripts,
- stable test fixture setup semantics.
