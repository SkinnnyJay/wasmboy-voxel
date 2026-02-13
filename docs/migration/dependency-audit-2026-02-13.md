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

## Follow-up (same day)

- Removed direct `np` dependency from root devDependencies.
- Switched `lib:deploy:np` script to `npx np --no-cleanup`.
- Pinned `mocha` to `11.3.0` to avoid the currently-audited vulnerable range.

Post-change `npm audit --omit=optional` result:

- **5 vulnerabilities total**
  - 3 moderate
  - 2 high

## Follow-up (audit fix pass)

- Ran `npm audit fix --omit=optional --legacy-peer-deps`.
- Applied non-breaking transitive updates in the legacy toolchain lockfile.

Current `npm audit --omit=optional` result:

- **4 vulnerabilities total**
  - 4 high

Remaining advisories are still tied to legacy webpack-era minification tooling
(`uglifyjs-webpack-plugin`/`cacache`/`serialize-javascript` chain), which
requires a larger toolchain migration to eliminate cleanly.
