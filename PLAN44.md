# PLAN44 — Single File for All Unfinished Work

This document is the **single source** for incomplete work. It consolidates unfinished tasks and research findings from **PLAN.md**, **PLAN2.md**, **PLAN3.md**, and **MIGRATE_TO_TYPESCRIPT.md**. Use only this file to track and execute remaining work.

**Source review date:** 2026-02-13.

**Completed (not in backlog):** Headless mode and WasmBoyHeadless were implemented per feature request: Phase 1 (headless config + frame callback in Worker path), Phase 2 (main-thread runner in `lib/headless/`, `dist/wasmboy.headless.*`), Phase 3 (tests + docs). See `docs/HEADLESS_MODE.md`, `wasm-fork.d.ts` (headless module + `mainThread` on config), and integration tests `headless-callback-test.cjs`, `headless-class-test.cjs`, `headless-mainthread-test.cjs`. When doing Phase 11 or typecheck, include `lib/headless/` and headless types.

---

## 1) Completion summary (from source plans)

| Source                   | Complete                                 | Incomplete (tracked below)                                                        |
| ------------------------ | ---------------------------------------- | --------------------------------------------------------------------------------- |
| PLAN.md                  | Milestones 0–10, backlog task159–task181 | task182–task200, S1-001–S1-020, S2-001–S2-030                                     |
| PLAN2.md                 | Superseded; work done at repo root       | Phase checkboxes in PLAN2 were not updated; scope covered here                    |
| PLAN3.md                 | Phases 0–10 effectively done at root     | Phase 11 (TypeScript lib/) not started                                            |
| MIGRATE_TO_TYPESCRIPT.md | Phases 0–10 checklist + PyBoy rigor      | Phase 11 (lib/ + voxel-wrapper strict TS) not in checklist; optional enhancements |

**Scope of PLAN44:** All tasks in §2–§4 below, plus research findings in §5 and success criteria in §7.

---

## 2) How to work this plan

1. Pick the next unchecked task (`[ ]`) in the recommended order (§6) or by priority.
2. Do the work in a branch or locally; run the relevant tests for that task.
3. Commit with a clear message; update this file: mark the task `[x]`.
4. Move to the next task. Add new tasks here when discovered.

---

## 3) CI blocker — fix first

### core:memory-offset:check

- **Symptom:** `npm run test:all:nobuild` fails in `automation:check` with:  
  `Expected invalid Game Boy offset -1 to map to sentinel -1 (received -6145).`
- **Cause:** Contract script loads `dist/core/getWasmBoyWasmCore.cjs.js` and calls WASM export `getWasmBoyOffsetFromGameBoyOffset(-1)`. Resolver must return `-1` for invalid offsets; it currently returns `-6145`.
- **Likely reasons:** (1) `dist/` is stale (core built before sentinel hardening), or (2) `core/memory/memoryMap.ts` only guards `if (<u32>gameboyOffset > 0xffff)` and does not explicitly guard negative input.
- **Fix:**
  - Rebuild: `npm run build` then re-run `npm run core:memory-offset:check`.
  - If still failing: in `core/memory/memoryMap.ts`, add at top:  
    `if (gameboyOffset < 0 || <u32>gameboyOffset > 0xffff) return -1;` and rebuild.
- **Verification:** `npm run automation:check` and `npm run test:all:nobuild`.

**Task:**

- [x] **CI:** Fix `core:memory-offset:check` so invalid offset -1 maps to sentinel -1; verify `npm run test:all:nobuild` and `npm run automation:check` pass. _(Validated after rebuilding core/lib and resolving workspace smoke/lint/typecheck blockers.)_

---

## 4) All unfinished tasks (properly formatted)

### 4.1 Backlog placeholders (task182–task200)

_Source: PLAN.md “Imported Incomplete Backlog Tasks (next-100)”. Resolve at implementation time (define validation/command or mark N/A)._

- [x] - task182 (S2 reliability): Backlog discovery candidate #82 — stabilize workspace stack smoke/lint/typecheck path resolution for `@wasmboy/api` (added Vitest aliases for CLI/debugger, refreshed formatting, and validated via `npm run test:all:nobuild`).
- [ ] - task183 (S2 reliability): Backlog discovery candidate #83 — define validation command at implementation time.
- [ ] - task184 (S2 reliability): Backlog discovery candidate #84 — define validation command at implementation time.
- [ ] - task185 (S2 reliability): Backlog discovery candidate #85 — define validation command at implementation time.
- [ ] - task186 (S2 reliability): Backlog discovery candidate #86 — define validation command at implementation time.
- [ ] - task187 (S2 reliability): Backlog discovery candidate #87 — define validation command at implementation time.
- [ ] - task188 (S2 reliability): Backlog discovery candidate #88 — define validation command at implementation time.
- [ ] - task189 (S2 reliability): Backlog discovery candidate #89 — define validation command at implementation time.
- [ ] - task190 (S2 reliability): Backlog discovery candidate #90 — define validation command at implementation time.
- [ ] - task191 (S2 reliability): Backlog discovery candidate #91 — define validation command at implementation time.
- [ ] - task192 (S2 reliability): Backlog discovery candidate #92 — define validation command at implementation time.
- [ ] - task193 (S2 reliability): Backlog discovery candidate #93 — define validation command at implementation time.
- [ ] - task194 (S2 reliability): Backlog discovery candidate #94 — define validation command at implementation time.
- [ ] - task195 (S2 reliability): Backlog discovery candidate #95 — define validation command at implementation time.
- [ ] - task196 (S2 reliability): Backlog discovery candidate #96 — define validation command at implementation time.
- [ ] - task197 (S2 reliability): Backlog discovery candidate #97 — define validation command at implementation time.
- [ ] - task198 (S2 reliability): Backlog discovery candidate #98 — define validation command at implementation time.
- [ ] - task199 (S2 reliability): Backlog discovery candidate #99 — define validation command at implementation time.
- [ ] - task200 (S2 reliability): Backlog discovery candidate #100 — define validation command at implementation time.

### 4.2 S1 Critical (S1-001 – S1-020)

_Source: PLAN.md. Core timing, graphics, audio, memory, serial, bootrom._

- [x] - S1-001 (core-timing): Fix unresolved LCD cycle timing TODOs in `core/graphics/graphics.ts` (clock-cycle constants at scanline transitions). _(Replaced unresolved TODO thresholds with explicit mode-duration-derived constants and validated core graphics/save-state regressions.)_
- [x] - S1-002 (core-timing): Root-cause and fix the explicit “Need to fix graphics timing” branch in `core/graphics/graphics.ts` to prevent frame drift. _(Fixed LY wrap from 153→0 without transient 154 and stopped rendering scanline 144 in per-scanline mode; added core regression test.)_
- [x] - S1-003 (core-render-race): Refactor scanline pixel writes in `core/graphics/graphics.ts` to avoid mid-scanline state mutation hazards. _(Captured per-scanline LCD/scroll/window state snapshot and threaded immutable values into background/window render paths.)_
- [x] - S1-004 (core-gbc): Implement missing GBC-specific rendering path flagged in `core/graphics/graphics.ts`. _(Threaded explicit CGB BG-priority override flag into sprite renderer so LCDC bit0 behavior is handled via per-scanline snapshot state.)_
- [x] - S1-005 (core-cache-correctness): Fix scanline-0 tile cache exclusion in `core/graphics/backgroundWindow.ts` without regressing first-line rendering. _(Enabled scanline-0 tile-cache path, corrected cache copy bounds (`xPos < 160`), and added first-scanline cache parity regression test.)_
- [x] - S1-006 (core-sprite-correctness): Fix sprite X overflow bug for values `< 8` documented in `core/graphics/sprites.ts`. _(Hardened sprite X clipping bounds to visible range (`0..159`) and removed stale overflow TODO; validated via graphics/headless regression suites.)_
- [x] - S1-007 (core-sprite-priority): Implement missing Pandocs sprite behavior in `core/graphics/sprites.ts` and validate against known ROMs. _(Implemented explicit 8x16 Pandocs tile-line selection (`NN&FE`/`NN|01`) with flip-aware line mapping and verified against headless + joypad integration runs.)_
- [x] - S1-008 (core-interrupts): Investigate and fix interrupt behavior regression called out for Pokémon Yellow / Link’s Awakening in `core/interrupts/interrupts.ts`. _(Removed unresolved TODO branch, retained compatibility HALT return-address path, and added `test/core/interrupt-halt-return-address-test.cjs` guard coverage.)_
- [x] - S1-009 (core-timer-state): Complete timer save-state coverage for new timer properties in `core/timers/timers.ts`. _(Removed stale save-state TODO and added deterministic timer save/load evolution regression test `test/core/timer-save-state-coverage-test.cjs`.)_
- [x] - S1-010 (core-timer-throughput): Replace TODO batch timer path in `core/timers/timers.ts` with deterministic bounded-cost processing. _(Implemented bounded chunked timer batching (`Timers.batchProcessCycles`) and added non-batch vs batch determinism regression coverage.)_
- [x] - S1-011 (core-audio-dmg): Implement DMG-specific wave channel behavior in `core/sound/channel3.ts`. _(Added DMG-only wave RAM access window semantics (reads return `0xFF`/writes ignored outside window) plus dedicated core regression test.)_
- [x] - S1-012 (core-audio-double-speed): Validate/fix channel 1 double-speed timing in `core/sound/channel1.ts`. _(Fixed channel 1 double-speed timer scaling to use `<< GBCDoubleSpeed` (x2) instead of x4 over-scaling.)_
- [x] - S1-013 (core-audio-double-speed): Validate/fix channel 2 double-speed timing in `core/sound/channel2.ts`. _(Validated and kept double-speed scaling path, removing unresolved TODO state.)_
- [x] - S1-014 (core-audio-double-speed): Validate/fix channel 3 double-speed timing in `core/sound/channel3.ts`. _(Validated double-speed scaling path and removed unresolved TODO state while preserving DMG wave-RAM semantics tests.)_
- [x] - S1-015 (core-audio-cycle-loop): Remove unbounded cycle-consumption risk in `core/sound/channel4.ts` TODO path. _(Resolved remaining TODO path and added channel-4 bounded-cycle regression test to guard responsiveness under long frame runs.)_
- [x] - S1-016 (core-memory-banking): Fix uncertain MBC5 high ROM bank handling in `core/memory/banking.ts`. _(Preserved upper ROM bank bit correctly across low/high writes and masked to 9-bit MBC5 bank range.)_
- [x] - S1-017 (core-memory-rtc): Implement missing MBC3 RTC register select path in `core/memory/banking.ts`. _(Added RTC register select state, read/write routing for `A000-BFFF`, and save-state persistence for RTC selection/registers.)_
- [x] - S1-018 (core-memory-rtc): Implement missing MBC3 clock latch handling in `core/memory/banking.ts`. _(Implemented 0→1 latch edge behavior with latched RTC register reads and regression coverage for latch semantics.)_
- [x] - S1-019 (core-serial): Complete incomplete serial transport behavior in `core/serial/serial.ts` and remove forced-success fallback. _(Implemented internal/external clock-aware transfer behavior, peer-byte injection + outgoing-byte capture exports, and serial transport regression tests.)_
- [x] - S1-020 (core-bootrom): Close Boot ROM correctness gaps in `core/execute.ts` and `core/core.ts` to avoid startup state divergence. _(Boot-ROM mode now preserves power-on defaults for post-boot register init paths, serial/interrupt init honors boot mode, and bootrom initialization regression coverage was added.)_

### 4.3 S2 High (S2-001 – S2-030)

_Source: PLAN.md. Sound bounds, wrapper memory, debugger soak/large-data, automation, cross-platform, NutJS._

- [x] - S2-001 (core-sound-bounds): Add strict sound read/write bounds protections for TODO paths in `core/memory/readTraps.ts` and `core/memory/writeTraps.ts`. _(Centralized sound register bounds constants, enforced FF27-FF2F write-ignore semantics, and added regression test coverage.)_
- [x] - S2-002 (core-audio-registers): Verify/fix wave channel sample buffer TODO path in `core/sound/registers.ts`. _(NR52 power-on path now explicitly resets channel3 sample buffer and is covered by dedicated regression test.)_
- [x] - S2-003 (core-audio-mix): Implement unresolved VIN mixing and read behavior TODOs in `core/sound/sound.ts`. _(Added explicit NR50 VIN enable-state tracking + read reconstruction, integrated VIN contribution into mixer path with bounded sample clamping, exposed VIN input sample control for runtime/tests, and added `test/core/sound-vin-mixing-read-test.cjs` regression coverage.)_
- [x] - S2-004 (core-palette-consistency): Normalize palette conversion constants/rounding in `core/graphics/palette.ts` to remove color drift. _(Replaced `_ 8`5-bit→8-bit component conversion with rounded integer scaling (`round(value _ 255 / 31)`), introduced explicit palette conversion constants, exported conversion helper for deterministic validation, and added`test/core/palette-color-conversion-test.cjs` coverage wired into core suites.)_
- [x] - S2-005 (debug-render-perf): Replace tile-debug pixel-by-pixel rendering TODO path in `core/debug/debug-graphics.ts` with tile-batched rendering. _(Reworked `drawBackgroundMapToWasmMemory()` to iterate by tile/tile-line and delegate pixel emission to `drawPixelsFromLineOfTile`, preserving CGB attribute handling (palette/bank/flip) while removing per-pixel decode loops; added `test/core/debug-background-map-batched-render-test.cjs` to validate CGB output parity over flipped/banked tiles.)_
- [x] - S2-006 (wrapper-memory): Audit snapshot/register acquisition for avoidable allocations and retained buffers in `voxel-wrapper.ts`. _(Removed avoidable allocations in register/memory paths: `getRegisters()` now reads only the register block (no full snapshot), section validation no longer clones bytes via `Array.from`, and snapshot/layer reads dedupe identical BG/window tilemap fetches; added readiness tests to assert read minimization behavior.)_
- [x] - S2-007 (debugger-worker-leak): Add long-run worker lifecycle soak test to detect event-listener or message-queue leaks in debugger worker restart flows. _(Extended `apps/debugger/test/worker-loader.test.ts` with a 200-restart lifecycle soak that alternates crash reasons, verifies per-instance listener cleanup, and asserts disposed/terminated state with no listener accumulation across restart cycles.)_
- [x] - S2-008 (debugger-large-data): Add capped windowing + disposal policy for large memory/snapshot UI datasets to prevent browser heap growth. _(Added bounded event-log rendering window (latest 200 + hidden-count messaging), compacted oversized event payloads before store insertion, capped/compacted JSONL export windows with metadata for omitted records, and limited in-memory preview retention in the page shell; covered by new debugger-store/export/event-log tests.)_
- [x] - S2-009 (automation-temp-cleanup): Ensure all script test temp repos/directories are cleaned deterministically after failures to avoid disk bloat. _(Added `scripts/temp-directory-cleanup.mjs` temp-dir registry + deterministic cleanup hooks, wired it into all script test suites that create temp dirs, and added dedicated cleanup contract tests; validated via full `npm run automation:test` pass.)_
- [x] - S2-010 (automation-subprocess): Standardize subprocess timeout/error handling to prevent hung child process leaks in script test harnesses. _(Added shared `scripts/subprocess-test-harness.mjs` with deterministic timeout + launch-error handling, migrated script-test subprocess wrappers to the shared harness, and added contract tests for success/timeout behavior; validated with full automation test suite.)_
- [x] - S2-011 (cross-platform-win): Add Windows CI lane for automation scripts to catch path separator, reserved-name, and shell invocation regressions. _(Added `automation-cross-platform-smoke` matrix lane on `windows-latest` running install + lockfile drift checks + automation smoke tests with failure log artifacts.)_
- [x] - S2-012 (cross-platform-macos): Add macOS CI lane for automation scripts to catch case-insensitive filesystem/path canonicalization regressions. _(Extended `automation-cross-platform-smoke` matrix with `macos-latest` and shared automation smoke gate + diagnostics artifact upload.)_
- [x] - S2-013 (cross-platform-linux): Add Linux distro variance smoke lane (glibc baseline + modern image) for script portability. _(Extended CI matrix with `ubuntu-22.04` (baseline) and `ubuntu-24.04` (modern) automation smoke lanes to catch distro-specific script regressions.)_
- [x] - S2-014 (cross-platform-tar): Replace hard dependency on external `tar` in diagnostics bundling with a Node-native fallback for Windows portability. _(Added Node `tar` package fallback in `scripts/bundle-diagnostics.mjs` when shell `tar` is unavailable, retained timeout/error semantics, and updated diagnostics tests to assert successful fallback archive creation when PATH lacks `tar`.)_
- [x] - S2-015 (cross-platform-signals): Verify subprocess termination behavior on Windows where `SIGTERM` semantics differ and add fallback shutdown strategy. _(Added shared timeout-signal policy module (`subprocess-timeout-signals.mjs`) with Windows-specific `taskkill` fallback on timeout, wired signal selection/fallback into script subprocess callsites, and added dedicated contract coverage for Windows/non-Windows fallback behavior.)_
- [x] - S2-016 (cross-platform-git-paths): Harden staged-path normalization for mixed slash/backslash and drive-letter forms in artifact guards. _(Strengthened artifact-path normalization for Windows drive-letter/absolute forms, added policy-relative anchor handling for block/cleanup checks, and expanded artifact-policy/guard tests for mixed separator + drive-letter coverage.)_
- [x] - S2-017 (cross-platform-crlf): Add CRLF/UTF-16 edge-case contract tests for CLI parser scripts and diagnostics bundling. _(Added CLI parser contract coverage for UTF-16 + CRLF argument tokens and diagnostics bundling tests that verify UTF-16/CRLF placeholder message preservation through archived outputs.)_
- [ ] - S2-018 (cross-platform-shell): Remove shell-quoting assumptions in npm script wrappers for paths containing spaces/special characters.
- [ ] - S2-019 (cross-platform-case): Add case-collision guardrails for generated artifact classification on macOS/Windows case-insensitive filesystems.
- [ ] - S2-020 (cross-platform-tmpdir): Add long-path and reserved-device-name stress tests for temp fixture creation behavior on Windows.
- [ ] - S2-021 (nutjs-baseline): Stand up NutJS-based cross-platform UI smoke harness for debugger flows (Linux/macOS/Windows).
- [ ] - S2-022 (nutjs-input-map): Normalize NutJS keyboard scan-code mappings across OS layouts to remove flaky shortcut/input behavior.
- [ ] - S2-023 (nutjs-display-scale): Add DPI-aware coordinate transforms for NutJS pointer actions on Windows/macOS high-DPI displays.
- [ ] - S2-024 (nutjs-linux-display): Add X11/Wayland detection and stable fallback strategy for NutJS on Linux runners.
- [ ] - S2-025 (nutjs-permissions): Add proactive accessibility permission checks/retry hints for NutJS on macOS.
- [ ] - S2-026 (nutjs-image-match): Calibrate NutJS image matching thresholds per OS/compositor to reduce false negatives.
- [ ] - S2-027 (nutjs-memory): Add leak guard for repeated NutJS screenshots/template matching in long UI test runs.
- [ ] - S2-028 (nutjs-process-cleanup): Ensure NutJS child processes/resources are always disposed on failures/timeouts.
- [ ] - S2-029 (nutjs-artifacts): Standardize deterministic screenshot/video artifact naming and retention for NutJS triage outputs.
- [ ] - S2-030 (nutjs-simplification): Create a small shared NutJS action DSL to simplify test flows and remove duplicated wait/retry boilerplate.

### 4.4 Phase 11: TypeScript migration (lib/ + voxel-wrapper)

_Source: PLAN3.md, MIGRATE_TO_TYPESCRIPT.md. MIGRATE Phase 1 narrative mentions “Convert lib/ and voxel-wrapper.ts to strict TypeScript” but the checklist there covers only packages/api; full lib/ conversion is Phase 11 in PLAN3, not started. Do after S1/S2 critical items are under control. **Include headless:** `lib/headless/` (WasmBoyHeadless, mainThreadCore._), headless module types in `wasm-fork.d.ts`, and `voxel-wrapper.ts` `WasmBoyConfig.mainThread`.\*

- [ ] - Phase 11: Create `lib/` TypeScript config (strict; no `any`; project references if needed).
- [ ] - Phase 11: Convert lib entry points to `.ts` with explicit types.
- [ ] - Phase 11: Convert worker entry points to `.ts`; type message schemas (align with Phase 0 docs).
- [ ] - Phase 11: Type all snapshot and memory paths used by voxel-wrapper (use contracts from packages/api where applicable).
- [ ] - Phase 11: Convert `lib/headless/` to `.ts`; align with `wasm-fork.d.ts` headless module and `WasmBoyHeadless` / `loadMainThreadWasm` types.
- [ ] - Phase 11: Remove all `any` and unsafe type assertions in `lib/`.
- [ ] - Phase 11: Add shared types/constants in `lib/` or from `packages/shared` (no magic numbers for non-hardware).
- [ ] - Phase 11: Ensure `voxel-wrapper.ts` and `index.ts` consume typed lib; no new `any`.
- [ ] - Phase 11: Add `npm run typecheck` (or equivalent) for repo root that includes lib.
- [ ] - Phase 11: Update Prettier/ESLint (or Biome) to include `lib/**/*.ts` if not already.
- [ ] - Phase 11: Document any remaining intentional `unknown` or narrowings.

**Completion criteria (Phase 11):** `lib/` and `voxel-wrapper.ts` are strict TypeScript; no `any` in public API; types aligned with `packages/api` contracts; root `npm run typecheck` includes lib and passes; consumer (e.g. gameboy-remix) can rely on typed exports. Headless bundle and types remain valid.

### 4.5 Optional (MIGRATE_TO_TYPESCRIPT.md — include only if in scope)

_Source: MIGRATE_TO_TYPESCRIPT.md “Optional Future Enhancements”._

- [ ] - Optional: Record/replay input sessions for deterministic debugging.
- [ ] - Optional: Streaming snapshot export for time-series analysis.
- [ ] - Optional: Dedicated “AI debug console” in the Next.js app.

### 4.6 Test confidence (unit, integration, e2e) for new features

_Ensure we have confidence in headless, mainThread, WasmBoyHeadless, and voxel snapshot paths. Use ROMs, Playwright MCP, Chrome DevTools MCP, and existing test scripts._

- [ ] - **Test-audit:** Document current coverage: which tests run for (1) headless Worker path, (2) headless mainThread path, (3) WasmBoyHeadless class, (4) voxel snapshot APIs. See §5.1 and `test/integration/*headless*`, `test/performance/headless-throughput.cjs`.
- [x] - **Integration:** Add `test:integration:headless:mainthread` to the default `test:integration` and `test:integration:nobuild` (and CI) so all three headless paths are run every time. _(Done: scripts already include it.)_
- [ ] - **voxel-wrapper test:** Fix or document `test:integration:voxel:wrapper` (voxel-wrapper-readiness-test.mjs). It fails with "Unknown file extension .ts" when Node loads `voxel-wrapper.ts`; either run against built JS output or use ts-node/tsx and add to docs.
- [ ] - **E2E headless (Playwright):** Add at least one Playwright (or Chrome DevTools MCP) E2E that loads the debugger or a minimal page, loads a ROM with `headless: true` (and optionally `mainThread: true`), runs frames, and asserts snapshot/frame data or no console errors. Artifacts under `./temp/playwright/`; see §8.3.
- [ ] - **ROM coverage:** Confirm test ROMs (e.g. `test/performance/testroms/tobutobugirl`, `test/accuracy/testroms/mooneye/*`) are used in headless and baseline tests; document in PLAN44 or test README.

### 4.7 JS vs TypeScript build verification

_Confirm the current JS (WASM) build and the TypeScript (TS core) build both work and are tested._

- [ ] - **JS (WASM) path:** Document that `npm run build` (lib:build:wasm) produces `dist/wasmboy.wasm.*` and `dist/wasmboy.headless.*`; `test:integration:nobuild` uses CJS WASM runtime. Ensure all headless integration tests pass with WASM build.
- [ ] - **TS path:** Run `npm run lib:build:ts` and confirm `dist/wasmboy.ts.*` (or equivalent) builds; add or run integration test that loads the TS-built lib (if entry differs) and runs a minimal headless or snapshot check. If TS lib is not consumed by current integration tests, add a smoke test or document in MIGRATION.md.
- [ ] - **Dual-version sign-off:** If both builds must ship, add a CI job or Makefile target that builds and tests both WASM and TS versions and document in README/MIGRATION.

### 4.8 Release layout: V1 / V2 isolation and Makefile

_Final release step: two isolated versions in one package, single control surface, migration docs._

- [ ] - **V1 layout:** Create `V1/` at repo root. Move or symlink "old" artifacts into V1: e.g. current `lib/` (JS), `core/` (AS→WASM), `dist/` outputs for WASM lib, `demo/` (Preact debugger/benchmark/iframe), and npm scripts that build/run only V1. Document what "old" means (pre–migration stack, pre–TypeScript lib).
- [ ] - **V2 layout:** Create `V2/` at repo root. Move or symlink "new" artifacts: migration stack (`packages/api`, `packages/cli`, `apps/debugger`), TypeScript lib (when Phase 11 done), voxel-wrapper TS, and any new build outputs. Document what "new" means.
- [ ] - **Makefile:** Add root `Makefile` with targets to build, test, and run either V1 or V2 (e.g. `make v1-build`, `make v1-test`, `make v2-build`, `make v2-test`, `make test-all`). Keep targets simple and documented in README.
- [x] - **MIGRATION.md:** Create `MIGRATION.md` with: (1) Migrating from old (upstream WasmBoy or pre-fork) to V1; (2) Migrating from old to V2; (3) Migrating from V1 to V2. Include breaking changes, entry points, and npm/import paths. Reference MIGRATION.md from root README. _(Done: MIGRATION.md created; README links to it in "Migration and versioning".)_
- [ ] - **README:** When V1/V2 and Makefile exist, add or expand the "Migration and versioning" section to describe V1 vs V2 and how to use the Makefile.

---

## 5) Research findings — context for fixes

_Use this section for evidence and references when implementing the tasks above._

### 5.1 Tests

- **core:memory-offset:check:** See §3; blocks `test:all:nobuild` and CI.
- **Existing suites:** `test:accuracy`, `test:integration`, `test:core`, `test:performance:throughput`; ensure they pass after contract fix and S1/S2 work.
- **Headless:** Integration includes `test:integration:headless:callback` (headless + updateGraphicsCallback), `test:integration:headless:class` (WasmBoyHeadless), and `test:integration:headless:mainthread` (headless + mainThread). Keep these green when changing lib/headless or graphics/load path. E2E with Playwright/Chrome DevTools MCP for headless in browser is not yet added (§4.6).
- **Save-state slot tests:** Repository audit (T001–T006) calls out missing focused save/load slot-ID regression tests; save-state tests are currently long-loop/screenshot oriented.

### 5.2 Performance

- **Performance budgets:** `docs/migration/performance-budgets-2026-02-14.md` — scripts parser, CLI startup, debugger frame instrumentation, core execute-loop FPS; verify enforced in CI.
- **Voxel wrapper:** `docs/migration/voxel-wrapper-snapshot-allocation-audit-2026-02-14.md` — per-frame allocation hotspots: repeated 1-byte `Uint8Array` for register reads in fallback path; full snapshot for partial-layer consumers in `getPpuSnapshotLayers()`; `Array.from(bytes)` in `readMemory()` validation. Coalesce register reads, selective layer reads, avoid full snapshot when only layers requested.
- **Core graphics:** `docs/migration/core-graphics-branch-churn-profile-2026-02-14.md` — branch churn and throughput baseline; S1/S2 graphics items may affect performance.

### 5.3 Memory

- Snapshot path allocation (see 5.2) affects GC in long-running frame loops.
- S2-008: Capped windowing and disposal for large memory/snapshot UI (debugger-large-data).
- S2-007: Worker lifecycle soak test for listener/queue leaks.

### 5.4 Correctness (P0 / repository audit overlap)

- **Save-state slot misuse (T001–T005):** `core/graphics/graphics.ts` and `core/sound/channel1.ts`–`channel4.ts` use `getSaveStateMemoryOffset(_, runtimeValue)` instead of `saveStateSlot` in `loadState()`; restored LY and cycle counters can be wrong. Fix: use `Graphics.saveStateSlot` and `ChannelN.saveStateSlot`; add regressions.
- **Interrupts (T007, S1-008):** Pokémon Yellow / Link’s Awakening; halted CPU PC push edge-case.
- **Boot ROM (T008, S1-020):** TODO in `core/execute.ts`; error-path and transition behavior.
- **Serial (T009–T010, S1-019):** Incomplete; forced “always transfer 1” fallback.
- **Graphics timing (T011–T013, S1-001–S1-003):** LCD mode constants, “Need to fix graphics timing” branch, scanline mutable state.
- **GBC / sprite / cache (T014–T016, S1-004–S1-007):** CGB priority, tile-cache scanline 0, sprite X overflow and Pandocs behavior.
- **MBC3 RTC / MBC5 (S1-016–S1-018):** Banking and RTC paths incomplete or uncertain.

### 5.5 Application / feature gaps

- Repository audit: “Debugger panels and CLI commands are partially stubbed/placeholder.” Validate which flows are real vs stub; complete or document.
- Phase 11: lib/ TypeScript migration not started (see 4.4).

### 5.6 Cross-platform and CI

- Workflows run on Ubuntu only; no Windows/macOS lanes (S2-011–S2-012). S2-013–S2-020 and NutJS S2-021–S2-030 cover variance, tar fallback, signals, paths, CRLF, shell, case/tmpdir, and NutJS UI harness.

### 5.7 Dependency and tooling

- Repository audit: “44 outdated packages, including very old toolchain dependencies.” Run `dependency:freshness:audit` and plan upgrades.
- **Technical debt register:** `docs/migration/technical-debt-register-2026-02-14.md` — log new S1/S2 items and track closure.

### 5.8 Documentation and process

- **docs/migration/repository-audit-backlog-2026-02-14.md:** Prioritized backlog (T001–T100); align PLAN44 and S1/S2 with T001–T020+ where overlapping.
- **docs/migration/iterative-backlog-process-2026-02-14.md:** “Next 100” backlog process for triaging task182–200 and S2.
- **docs/migration/weekly-regression-checklist-2026-02-14.md:** CI health, local gates, performance budgets, docs/debt sync, release readiness.

---

## 6) Recommended order of work

1. **Unblock CI:** Fix core:memory-offset:check (§3) so `npm run test:all:nobuild` and `automation:check` pass.
2. **P0 correctness:** T001–T006 (save-state slot misuse + focused slot regression tests); then T007–T010 (interrupts, Boot ROM, serial) as capacity allows.
3. **S1 Critical:** S1-001–S1-020 in dependency order (graphics timing → GBC/sprite/cache → audio → memory → serial → bootrom).
4. **S2 High:** S2-006 (wrapper allocation), S2-007–S2-008 (debugger soak + large-data), then automation and cross-platform (S2-009–S2-020), then NutJS if needed (S2-021–S2-030).
5. **Tests:** Full suite green after each change; add focused regressions for save-state slots and new behavior.
6. **Performance/memory:** Re-verify performance budgets and voxel-wrapper allocation mitigations after core/wrapper changes.
7. **Phase 11:** Start TypeScript migration of `lib/` only after S1/S2 and critical PLAN44 items are under control.
8. **Test confidence (§4.6):** Run test-audit; add headless:mainthread to default integration run; fix or document voxel-wrapper test; add Playwright E2E for headless if required.
9. **JS vs TS (§4.7):** Verify WASM and TS builds and document or add smoke tests.
10. **Release layout (§4.8):** After core work is stable, add V1/V2 layout, Makefile, MIGRATION.md, and README link.

---

## 7) References

- **PLAN.md** — Main execution plan; completion status and S1/S2 task list (incomplete items moved here).
- **PLAN2.md** — Combined plan; work done at root; remaining work in this file.
- **PLAN3.md** — Order of operations; Phase 11 last; remaining work in this file.
- **MIGRATE_TO_TYPESCRIPT.md** — Migration design; Phase 0–10 checklist complete; Phase 11 (lib/ TS) tracked here.
- **docs/HEADLESS_MODE.md** — Headless config, callback, and WasmBoyHeadless usage; `dist/wasmboy.headless.*`.
- **docs/migration/repository-audit-backlog-2026-02-14.md** — Prioritized backlog T001–T100.
- **docs/migration/technical-debt-register-2026-02-14.md** — Open/closed debt and severity.
- **docs/migration/performance-budgets-2026-02-14.md** — Budgets and enforcement.
- **docs/migration/voxel-wrapper-snapshot-allocation-audit-2026-02-14.md** — Snapshot allocation hotspots and hardening.
- **docs/migration/debugger-worker-boot-race-audit-2026-02-14.md** — Worker readiness/handshake/lifecycle.
- **docs/migration/core-wrapper-offset-dependency-map-2026-02-14.md** — Core constants vs wrapper offsets.
- **MIGRATION.md** — Migrating old → V1, old → V2, V1 → V2; entry points and breaking changes (§4.8).

---

## 8) Success metrics and sign-off

### 8.1 Automation and CI

| Metric         | How to confirm                                                                                                                         |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Quality gate   | `npm run test:all:nobuild` exits 0 (includes automation:check, lint/typecheck/test, integration, core, performance throughput, audit). |
| Contract check | `npm run core:memory-offset:check` and contract-check CI pass; invalid offset -1 maps to sentinel -1.                                  |
| No regression  | `npm run test:accuracy`, `npm run test:integration`, `npm run test:core`, `npm run test:performance:throughput` all pass.              |

### 8.2 ROMs and determinism

- ROMs used in tests/demos load and produce deterministic snapshot/checksum for a fixed frame count (see baseline API inventory and `test/baseline/snapshots`).
- Golden snapshot and checksum tests pass; baselines updated when changes are intentional.

### 8.3 Playwright + Chrome (E2E / UI)

- Playwright screenshots, traces, videos under **`./temp/playwright/`**; `temp/` in `.gitignore`.
- Debugger app loads in Chrome without console errors; WASM and workers load on happy path.
- ROM load in debugger: emulator view advances; registers/memory/snapshot panels reflect data.
- Use Playwright MCP to automate: navigate, load ROM, run frames, open panels; capture screenshots to `./temp/playwright/`.

### 8.4 API and contract surface

- Public API typed and validated; snapshot/register/memory payloads validate against `packages/api` schemas where applicable.
- `supportsPpuSnapshot()` and snapshot APIs return null when worker not ready; documented and covered by tests.

### 8.5 Phase 11 completion (when applicable)

- `lib/` and `voxel-wrapper.ts` build and typecheck with strict TypeScript; no `any` in public API.
- Root `npm run typecheck` includes lib and passes.
- Consumer compatibility (e.g. gameboy-remix) verified; snapshot/register types align with `packages/api` or divergence documented.

### 8.6 Sign-off checklist

- [ ] `npm run test:all:nobuild` passes (and `npm run test:all` if full build required).
- [ ] Baseline ROMs load and produce expected snapshot/checksum for fixed frame count.
- [ ] Playwright E2E runs debugger flows with artifacts under **`./temp/playwright/`**.
- [ ] No known P0/S1 correctness gaps open (save-state slot misuse, core:memory-offset sentinel, and critical S1 items resolved or tracked).
- [ ] Performance budgets and voxel-wrapper allocation guidance met or deferred and documented.
- [ ] When Phase 11 is in scope: lib/ strict TypeScript, root typecheck passes, consumer compatibility verified.
