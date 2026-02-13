# Dependency Audit Notes (2026-02-13)

## What changed

- Replaced test image writer dependency usage from `pngjs-image` to direct
  `pngjs` usage in:
  - `test/common-test.cjs`
  - `test/common-test.js`
- Removed direct root dev dependency on `request`.
- Removed root dev dependency on `pngjs-image`.
- Added root dev dependency on `pngjs`.

## Why

- `request` is deprecated and carried high/critical advisory baggage in this
  stack.
- `pngjs-image` indirectly depended on older internals and hard-required
  `request` in runtime code paths.
- Direct `pngjs` usage provides the same output behavior needed by integration
  and core image snapshot tests.

## Validation

- `npm run test:integration:nobuild` passes
- `npm run test:core:nobuild` passes

## Current audit snapshot

`npm audit --omit=optional` now reports:

- **13 vulnerabilities total**
  - 8 low
  - 3 moderate
  - 2 high

Remaining findings are tied to legacy tooling chains (`mocha`, `np`, older
webpack-era utility deps) and need a staged upgrade plan to avoid breaking the
historical emulator test harness.
