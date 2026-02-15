# Headless + Voxel test coverage audit (2026-02-14)

This audit documents current automated coverage for the headless execution paths
and voxel snapshot APIs, including ROM usage evidence and the voxel-wrapper test
runtime note that was previously tracked as a `.ts` extension loader risk.

## Coverage matrix

| Area                                                              | Command                                        | Primary test file(s)                                | Current status                              |
| ----------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------- | ------------------------------------------- |
| Headless Worker path (`headless: true`)                           | `npm run test:integration:headless:callback`   | `test/integration/headless-callback-test.cjs`       | ✅ passing                                  |
| Headless main-thread adapter (`headless: true, mainThread: true`) | `npm run test:integration:headless:mainthread` | `test/integration/headless-mainthread-test.cjs`     | ✅ passing                                  |
| `WasmBoyHeadless` class API                                       | `npm run test:integration:headless:class`      | `test/integration/headless-class-test.cjs`          | ✅ passing                                  |
| Voxel snapshot API surface                                        | `npm run test:integration:voxel`               | `test/integration/voxel-snapshot-test.cjs`          | ✅ passing                                  |
| Voxel wrapper readiness + contract behavior                       | `npm run test:integration:voxel:wrapper`       | `test/integration/voxel-wrapper-readiness-test.mjs` | ✅ passing                                  |
| Browser E2E headless smoke with artifacts                         | `npm run test:e2e:playwright:headless`         | `test/e2e/playwright-headless-smoke.mjs`            | ✅ passing (artifacts in `temp/playwright`) |
| Headless deterministic throughput budget                          | `npm run test:performance:throughput`          | `test/performance/headless-throughput.cjs`          | ✅ passing (780.33 FPS in latest local run) |

## voxel-wrapper `.ts` loading note

`test:integration:voxel:wrapper` imports `../../voxel-wrapper.ts` directly and is
currently green under the repository Node runtime (`node --test` on Node 22).

- Previous risk item: Node runtime rejecting direct `.ts` imports with
  `Unknown file extension ".ts"`.
- Current state: no repro on current toolchain; wrapper readiness suite executes
  successfully via the default script.
- Operational guidance: keep this test running in CI and local validation so any
  future Node/runtime regression is detected quickly.

## ROM coverage evidence (headless + baseline relevant suites)

### Headless-focused suites

- `test/integration/headless-callback-test.cjs` → `test/performance/testroms/tobutobugirl/tobutobugirl.gb`
- `test/integration/headless-mainthread-test.cjs` → `test/performance/testroms/tobutobugirl/tobutobugirl.gb`
- `test/integration/headless-class-test.cjs` → `test/performance/testroms/tobutobugirl/tobutobugirl.gb`
- `test/performance/headless-throughput.cjs` → `test/performance/testroms/back-to-color/back-to-color.gbc`
- `test/e2e/playwright-headless-smoke.mjs` → `test/performance/testroms/back-to-color/back-to-color.gbc`

### Baseline/snapshot suites

- `test/baseline/snapshots/back-to-color.snapshot.json` references
  `test/performance/testroms/back-to-color/back-to-color.gbc`.
- `test/baseline/snapshots/tobutobugirl.snapshot.json` references
  `test/performance/testroms/tobutobugirl/tobutobugirl.gb`.
- `test/integration/voxel-snapshot-test.cjs` uses
  `test/performance/testroms/back-to-color/back-to-color.gbc`.

### Accuracy ROM set

- `test/accuracy/accuracy-test.js` iterates `test/accuracy/testroms` (mooneye and
  other correctness ROMs) and also runs baseline checks against:
  - `test/performance/testroms/back-to-color/back-to-color.gbc`
  - `test/performance/testroms/tobutobugirl/tobutobugirl.gb`

## Commands run for this audit

- `npm run test:integration:headless:callback`
- `npm run test:integration:headless:mainthread`
- `npm run test:integration:headless:class`
- `npm run test:integration:voxel`
- `npm run test:integration:voxel:wrapper`
- `npm run test:e2e:playwright:headless`
- `npm run test:performance:throughput`
