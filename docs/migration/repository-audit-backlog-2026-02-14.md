# Repository End-to-End Audit Backlog (2026-02-14)

## 1) Repo summary

### What this system appears to do

WasmBoy-Voxel is a Game Boy / Game Boy Color emulator stack:

- `core/` is the AssemblyScript emulator (CPU/PPU/APU/memory/timers/interrupts/serial).
- `lib/` + `voxel-wrapper.ts` expose runtime APIs, worker orchestration, and voxel-focused PPU snapshot extraction.
- `packages/api` provides versioned Zod contracts.
- `packages/cli` provides command-line validation and regression utilities.
- `apps/debugger` is a Next.js debugger UI shell and store/event layer.
- `scripts/` and `.github/workflows/` enforce automation, artifact hygiene, release checks, and CI policies.

### Key modules and responsibilities

- **Emulator correctness/runtime**: `core/**`, `lib/**`
- **Snapshot contract + typed payloads**: `voxel-wrapper.ts`, `packages/api/**`
- **Operational tooling**: `packages/cli/**`, `scripts/**`
- **Debug UX**: `apps/debugger/**`
- **Quality gates**: `test/**`, `.github/workflows/**`, root `package.json` scripts

### Current risk profile (top 5)

1. **P0 correctness risk in save/load paths**: multiple `loadState()` calls pass mutable runtime values instead of save-state slot IDs in `core/graphics/graphics.ts` and `core/sound/channel{1..4}.ts`.
2. **Unimplemented core TODOs in hot paths**: graphics timing, serial, banking RTC, and interrupt edge-cases are explicitly marked unresolved in core files.
3. **Feature gap risk in “new stack” surfaces**: debugger panels and CLI commands are partially stubbed/placeholder (hashing/demo flows instead of real emulator-backed behavior).
4. **Cross-platform/CI risk**: workflows run only on Ubuntu; no Windows/macOS lanes despite path-normalization complexity and claims of broad platform support.
5. **Dependency modernization risk**: freshness scan reports 44 outdated packages, including very old toolchain dependencies in root workspace.

---

## 2) Prioritized backlog (100 tasks)

### T001 — Fix Graphics save-state slot misuse in loadState

- Category: correctness
- Priority: P0
- Effort: S
- Evidence: `core/graphics/graphics.ts` uses `getSaveStateMemoryOffset(0x04, Graphics.scanlineRegister)` during load.
- Fix approach:
  - Replace second argument with `Graphics.saveStateSlot`.
  - Add regression assertion for restored `scanlineRegister`.
- Acceptance criteria:
  - `loadState()` restores LY from save-state data, independent of runtime LY value before load.
- Verification:
  - `npm run test:core:serialization`

### T002 — Fix Channel1 save-state slot misuse in loadState

- Category: correctness
- Priority: P0
- Effort: S
- Evidence: `core/sound/channel1.ts` uses `getSaveStateMemoryOffset(0x00, Channel1.cycleCounter)` during load.
- Fix approach:
  - Replace second argument with `Channel1.saveStateSlot`.
  - Add channel1 cycle-counter restore regression.
- Acceptance criteria:
  - Restored channel1 cycle counter equals previously saved value.
- Verification:
  - `npm run test:core:serialization`

### T003 — Fix Channel2 save-state slot misuse in loadState

- Category: correctness
- Priority: P0
- Effort: S
- Evidence: `core/sound/channel2.ts` uses `getSaveStateMemoryOffset(0x00, Channel2.cycleCounter)` during load.
- Fix approach:
  - Replace second argument with `Channel2.saveStateSlot`.
  - Add channel2 cycle-counter restore regression.
- Acceptance criteria:
  - Restored channel2 cycle counter equals previously saved value.
- Verification:
  - `npm run test:core:serialization`

### T004 — Fix Channel3 save-state slot misuse in loadState

- Category: correctness
- Priority: P0
- Effort: S
- Evidence: `core/sound/channel3.ts` uses `getSaveStateMemoryOffset(0x00, Channel3.cycleCounter)` during load.
- Fix approach:
  - Replace second argument with `Channel3.saveStateSlot`.
  - Add channel3 cycle-counter restore regression.
- Acceptance criteria:
  - Restored channel3 cycle counter equals previously saved value.
- Verification:
  - `npm run test:core:serialization`

### T005 — Fix Channel4 save-state slot misuse in loadState

- Category: correctness
- Priority: P0
- Effort: S
- Evidence: `core/sound/channel4.ts` uses `getSaveStateMemoryOffset(0x00, Channel4.cycleCounter)` during load.
- Fix approach:
  - Replace second argument with `Channel4.saveStateSlot`.
  - Add channel4 cycle-counter restore regression.
- Acceptance criteria:
  - Restored channel4 cycle counter equals previously saved value.
- Verification:
  - `npm run test:core:serialization`

### T006 — Add focused save/load regression tests for slot-ID bugs

- Category: testing
- Priority: P0
- Effort: M
- Evidence: Existing tests (`test/core/save-state.js`) are long-loop screenshot oriented and do not isolate slot-index integrity.
- Fix approach:
  - Add a compact deterministic save/load slot regression suite.
  - Assert per-component restored values across graphics + four channels.
- Acceptance criteria:
  - New regression fails on pre-fix code and passes post-fix.
- Verification:
  - `node --experimental-worker node_modules/mocha/bin/_mocha test/core/serialization-determinism-test.cjs --timeout 30000 --exit`

### T007 — Resolve interrupt PC push edge-case for halted CPU

- Category: correctness
- Priority: P0
- Effort: M
- Evidence: `core/interrupts/interrupts.ts` TODO notes Pokémon Yellow / Link’s Awakening breakage.
- Fix approach:
  - Instrument and compare halted interrupt sequencing with known reference behavior.
  - Implement conditional PC push semantics matching hardware.
  - Add game-specific regression fixture coverage.
- Acceptance criteria:
  - Interrupt service no longer regresses listed ROM behaviors.
- Verification:
  - `npm run test:core:interrupts && npm run test:integration:baseline`

### T008 — Implement missing Boot ROM error-path handling in execute loop

- Category: correctness
- Priority: P0
- Effort: M
- Evidence: `core/execute.ts` contains `// TODO: Boot ROM handling`.
- Fix approach:
  - Define expected boot ROM transition/error behavior.
  - Implement explicit branch for boot ROM mode execution errors.
  - Add deterministic tests for boot ROM enabled/disabled paths.
- Acceptance criteria:
  - Boot ROM mode execution paths are explicit and tested.
- Verification:
  - `npm run test:core:nobuild`

### T009 — Complete serial emulation baseline behavior

- Category: correctness
- Priority: P0
- Effort: L
- Evidence: `core/serial/serial.ts` has `// TODO: Finish serial`.
- Fix approach:
  - Implement spec-aligned serial transfer state machine.
  - Model transfer completion and interrupt semantics.
  - Add serial contract tests with known test ROM expectations.
- Acceptance criteria:
  - Serial tests validate bit transfer + interrupt behavior.
- Verification:
  - `npm run test:core:nobuild && npm run test:accuracy:nobuild`

### T010 — Remove hardcoded “always transfer 1” serial fallback

- Category: correctness
- Priority: P0
- Effort: M
- Evidence: `core/serial/serial.ts` TODO says transfer currently forces bit `1`.
- Fix approach:
  - Replace forced value with configurable/mock link behavior.
  - Add deterministic no-link and loopback modes.
- Acceptance criteria:
  - Serial data output depends on modeled source, not forced constants.
- Verification:
  - `npm run test:core:nobuild`

### T011 — Validate and correct scanline mode cycle constants

- Category: correctness
- Priority: P1
- Effort: M
- Evidence: `core/graphics/graphics.ts` TODOs in `MIN_CYCLES_*_LCD_MODE`.
- Fix approach:
  - Cross-check constants against Pan Docs / reference emulator traces.
  - Update constants and add mode transition tests.
- Acceptance criteria:
  - LCD mode transitions match expected cycle boundaries.
- Verification:
  - `npm run test:core:executeloop && npm run test:integration:headless:clean`

### T012 — Fix graphics scanline increment timing branch

- Category: correctness
- Priority: P1
- Effort: M
- Evidence: `core/graphics/graphics.ts` includes `// TODO: Need to fix graphics timing`.
- Fix approach:
  - Add line-by-line trace comparisons around LY=144..153 transitions.
  - Correct increment/reset sequencing.
- Acceptance criteria:
  - LY progression and VBlank boundary are deterministic across runs.
- Verification:
  - `npm run test:integration:baseline && npm run test:core:executeloop`

### T013 — Refactor scanline drawing to avoid mid-line mutable state drift

- Category: reliability
- Priority: P1
- Effort: M
- Evidence: `core/graphics/graphics.ts` TODO suggests `_drawPixelOnScanline`.
- Fix approach:
  - Snapshot read-once scanline inputs before rendering loop.
  - Minimize mutable global reads during scanline draw.
- Acceptance criteria:
  - Rendering result stable under equivalent register states.
- Verification:
  - `npm run test:integration:voxel && npm run test:integration:baseline`

### T014 — Implement CGB BG/window priority behavior for LCDC bit 0

- Category: correctness
- Priority: P1
- Effort: M
- Evidence: `core/graphics/graphics.ts` TODO in CGB priority branch.
- Fix approach:
  - Implement CGB master priority semantics.
  - Add sprite-over-background priority regressions in CGB mode.
- Acceptance criteria:
  - Sprite/background priority matches documented CGB behavior.
- Verification:
  - `npm run test:accuracy:nobuild`

### T015 — Enable tile-cache optimization on first scanline safely

- Category: performance
- Priority: P1
- Effort: M
- Evidence: `core/graphics/backgroundWindow.ts` TODO says scanline 0 cache disabled due bug.
- Fix approach:
  - Reproduce scanline-0 cache bug with focused test.
  - Fix cache priming/index logic for line 0.
- Acceptance criteria:
  - Cache path used for scanline 0 without visual regressions.
- Verification:
  - `npm run test:integration:baseline && npm run test:performance:throughput`

### T016 — Fix sprite X overflow handling for X<8

- Category: correctness
- Priority: P1
- Effort: S
- Evidence: `core/graphics/sprites.ts` TODO “Sprites are overflowing on x if less than 8”.
- Fix approach:
  - Correct clipping/index math for negative camera-space X.
  - Add regression image test for boundary sprites.
- Acceptance criteria:
  - Left-edge sprites no longer wrap/overflow.
- Verification:
  - `npm run test:integration:headless:clean`

### T017 — Complete 8x16 sprite tile-id behavior per Pan Docs

- Category: correctness
- Priority: P1
- Effort: M
- Evidence: `core/graphics/sprites.ts` TODO on 8x16 “actual Pandocs thing”.
- Fix approach:
  - Apply proper upper/lower tile ID mapping in 8x16 mode.
  - Add targeted 8x16 sprite regression ROM fixtures.
- Acceptance criteria:
  - 8x16 sprite rendering matches expected tile pair behavior.
- Verification:
  - `npm run test:accuracy:nobuild`

### T018 — Remove “Torch2424 continue here” incomplete sprite path

- Category: architecture
- Priority: P1
- Effort: M
- Evidence: `core/graphics/sprites.ts` contains unfinished TODO marker.
- Fix approach:
  - Replace placeholder with explicit implemented logic/comments.
  - Add tests for affected attribute combinations.
- Acceptance criteria:
  - No incomplete TODO placeholders remain in sprite hot path.
- Verification:
  - `npm run core:build && npm run test:integration:baseline`

### T019 — Implement timer save-state coverage for new timer properties

- Category: correctness
- Priority: P1
- Effort: M
- Evidence: `core/timers/timers.ts` TODO “Save state for new properties on Timers”.
- Fix approach:
  - Enumerate all timer stateful fields.
  - Extend save/load offsets and add backward-compat migration notes.
- Acceptance criteria:
  - Timer behavior after save/load roundtrip matches pre-save state.
- Verification:
  - `npm run test:core:serialization && npm run test:core:timeroverflow`

### T020 — Replace temporary timer batch-processing shortcut

- Category: performance
- Priority: P1
- Effort: M
- Evidence: `core/timers/timers.ts` TODO says batch processing rewrite pending.
- Fix approach:
  - Implement bounded chunking in batch timer updates.
  - Validate no cycle loss with overflow-focused tests.
- Acceptance criteria:
  - Batch mode preserves behavior and does not degrade throughput.
- Verification:
  - `npm run test:core:timeroverflow && npm run test:performance:throughput`

### T021 — Add explicit sound register bound constants in read traps

- Category: reliability
- Priority: P1
- Effort: S
- Evidence: `core/memory/readTraps.ts` TODO says move sound bounds to Sound class.
- Fix approach:
  - Centralize range constants in sound subsystem.
  - Reuse in read/write trap paths.
- Acceptance criteria:
  - No duplicated magic sound register ranges in trap code.
- Verification:
  - `npm run test:core:memorytraps`

### T022 — Evaluate re-enabling VRAM/OAM access trap restrictions safely

- Category: correctness
- Priority: P1
- Effort: L
- Evidence: `core/memory/readTraps.ts` and `writeTraps.ts` disable mode-gated checks with TODO comments.
- Fix approach:
  - Introduce optional strict mode behind config flag.
  - Build regression corpus for timing-sensitive ROMs before default-on.
- Acceptance criteria:
  - Strict-mode path exists with validated behavior and documented default.
- Verification:
  - `npm run test:accuracy:nobuild && npm run test:integration:headless:clean`

### T023 — Implement DMG-specific wave RAM read timing behavior

- Category: correctness
- Priority: P1
- Effort: M
- Evidence: `core/sound/channel3.ts` TODO “Handle DMG case”.
- Fix approach:
  - Implement read timing window semantics for DMG mode.
  - Add DMG-only wave RAM access regressions.
- Acceptance criteria:
  - DMG wave RAM reads obey timing constraints.
- Verification:
  - `npm run test:accuracy:nobuild`

### T024 — Validate Channel1 frequency timer behavior under double-speed

- Category: correctness
- Priority: P1
- Effort: M
- Evidence: `core/sound/channel1.ts` TODO on GBC double-speed correctness.
- Fix approach:
  - Compare output timing against known traces.
  - Correct scaling behavior if mismatch detected.
- Acceptance criteria:
  - Channel1 timing stable in both normal and double-speed.
- Verification:
  - `npm run test:performance:throughput && npm run test:integration:headless:clean`

### T025 — Validate Channel2 frequency timer behavior under double-speed

- Category: correctness
- Priority: P1
- Effort: M
- Evidence: `core/sound/channel2.ts` TODO on GBC double-speed correctness.
- Fix approach:
  - Repeat channel2 timing trace validation and correction.
  - Add dedicated regression assertions.
- Acceptance criteria:
  - Channel2 timing stable in both normal and double-speed.
- Verification:
  - `npm run test:performance:throughput && npm run test:integration:headless:clean`

### T026 — Validate Channel3 frequency timer behavior under double-speed

- Category: correctness
- Priority: P1
- Effort: M
- Evidence: `core/sound/channel3.ts` TODO on GBC double-speed correctness.
- Fix approach:
  - Validate timer scale and stepping logic for channel3.
  - Add regression coverage.
- Acceptance criteria:
  - Channel3 timing stable across speed modes.
- Verification:
  - `npm run test:performance:throughput && npm run test:integration:headless:clean`

### T027 — Rework Channel4 cycle-consumption loop to avoid missed updates

- Category: correctness
- Priority: P1
- Effort: M
- Evidence: `core/sound/channel4.ts` TODO says while-loop approach is incorrect.
- Fix approach:
  - Implement event-driven or bounded-step noise period updates.
  - Validate pseudo-random sequence continuity.
- Acceptance criteria:
  - Channel4 output deterministic and timing-correct under large cycle deltas.
- Verification:
  - `npm run test:core:serialization && npm run test:integration:headless:clean`

### T028 — Implement MBC5 high ROM bank behavior definitively

- Category: correctness
- Priority: P1
- Effort: M
- Evidence: `core/memory/banking.ts` TODO uncertainty on MBC5 high bits.
- Fix approach:
  - Implement spec-accurate high-bit handling.
  - Add MBC5 banking regression ROM tests.
- Acceptance criteria:
  - MBC5 bank switching passes targeted ROM checks.
- Verification:
  - `npm run test:core:memorytraps && npm run test:integration:memorybounds`

### T029 — Implement MBC3 RTC register select behavior

- Category: correctness
- Priority: P1
- Effort: M
- Evidence: `core/memory/banking.ts` TODO “MBC3 RTC Register Select”.
- Fix approach:
  - Implement RTC register routing for 0x08..0x0C values.
  - Add unit tests for RAM/RTC selection transitions.
- Acceptance criteria:
  - RTC register selection no longer no-op.
- Verification:
  - `npm run test:core:memorytraps`

### T030 — Implement MBC3 latch clock data behavior

- Category: correctness
- Priority: P1
- Effort: M
- Evidence: `core/memory/banking.ts` TODO “MBC3 Latch Clock Data”.
- Fix approach:
  - Add latch transition handling for RTC.
  - Add serialization/restore tests for latched values.
- Acceptance criteria:
  - RTC latch sequence produces expected latched state.
- Verification:
  - `npm run test:core:serialization`

### T031 — Implement VIN mixing behavior in sound mixer

- Category: correctness
- Priority: P2
- Effort: M
- Evidence: `core/sound/sound.ts` TODO “Vin Mixing”.
- Fix approach:
  - Implement VIN bit handling in mixer path.
  - Add mixer-state regression tests.
- Acceptance criteria:
  - Mixer output reflects VIN control bits where applicable.
- Verification:
  - `npm run test:integration:headless:clean`

### T032 — Add configurable per-channel mute controls for debugability

- Category: DX
- Priority: P2
- Effort: S
- Evidence: `core/sound/sound.ts` TODO “Allow individual channels to be muted”.
- Fix approach:
  - Add optional debug config for channel mute flags.
  - Wire into mixer path with default disabled.
- Acceptance criteria:
  - Channel mute flags deterministically silence selected channels.
- Verification:
  - `npm run test:integration:headless:clean`

### T033 — Normalize palette constant ownership

- Category: architecture
- Priority: P2
- Effort: S
- Evidence: `core/graphics/palette.ts` TODO “Make these colors into a constant”.
- Fix approach:
  - Extract color constants to dedicated constant module.
  - Replace inline literals with named constants.
- Acceptance criteria:
  - Palette conversion uses centralized constants only.
- Verification:
  - `npm run core:build && npm run prettier:lint`

### T034 — Correct approximate RGB conversion comment/logic mismatch

- Category: correctness
- Priority: P2
- Effort: S
- Evidence: `core/graphics/palette.ts` TODO notes inexact 255/31 conversion.
- Fix approach:
  - Clarify formula and align implementation with intent.
  - Add deterministic conversion unit tests.
- Acceptance criteria:
  - Conversion tests pass exact expected mappings for sampled inputs.
- Verification:
  - `npm run test:integration:nobuild`

### T035 — Replace pixel-by-pixel debug rendering with tile-path option

- Category: performance
- Priority: P2
- Effort: M
- Evidence: `core/debug/debug-graphics.ts` TODO “Render by tile”.
- Fix approach:
  - Implement tile-oriented rendering path for debug output.
  - Keep pixel-path fallback for validation.
- Acceptance criteria:
  - Tile path reduces debug rendering runtime on representative samples.
- Verification:
  - `npm run test:performance:throughput`

### T036 — Audit suspicious debug-graphics calculation marker

- Category: correctness
- Priority: P2
- Effort: S
- Evidence: `core/debug/debug-graphics.ts` contains TODO “This may be wrong”.
- Fix approach:
  - Reconcile math with expected tile map layout.
  - Add test asserting expected output indices.
- Acceptance criteria:
  - Known-good debug frame outputs match expected maps.
- Verification:
  - `npm run test:integration:baseline`

### T037 — Complete CB opcode micro-optimization refactor safety check

- Category: performance
- Priority: P2
- Effort: S
- Evidence: `core/cpu/cbOpcodes.ts` TODO about register set-back optimization.
- Fix approach:
  - Implement optimized path and benchmark delta.
  - Ensure no CPU behavior regressions.
- Acceptance criteria:
  - Perf improves or remains neutral; accuracy unchanged.
- Verification:
  - `npm run test:accuracy:nobuild && npm run test:performance:throughput`

### T038 — Track and close instruction refactor TODO debt in CPU instruction file

- Category: architecture
- Priority: P2
- Effort: M
- Evidence: `core/cpu/instructions.ts` has explicit refactor TODO note.
- Fix approach:
  - Break large instruction handling into smaller helpers.
  - Preserve opcode behavior with exhaustive tests.
- Acceptance criteria:
  - Instruction module complexity reduced; tests unchanged.
- Verification:
  - `npm run test:accuracy:nobuild`

### T039 — Finalize colors disambiguation TODO

- Category: docs
- Priority: P2
- Effort: S
- Evidence: `core/graphics/colors.ts` TODO unresolved.
- Fix approach:
  - Replace placeholder comment with actionable explanation or implementation.
  - Link to issue/spec reference.
- Acceptance criteria:
  - No ambiguous TODO text remains for color disambiguation section.
- Verification:
  - `npm run prettier:lint`

### T040 — Rename sixteenBit load API for trap semantics clarity

- Category: DX
- Priority: P2
- Effort: S
- Evidence: `core/memory/load.ts` TODO rename to include trap behavior.
- Fix approach:
  - Introduce renamed function with compatibility alias.
  - Update call sites incrementally.
- Acceptance criteria:
  - Public/internal naming reflects trap behavior accurately.
- Verification:
  - `npm run core:build && npm run test:core:nobuild`

### T041 — Deduplicate requested layer names in getPpuSnapshotLayers

- Category: performance
- Priority: P1
- Effort: S
- Evidence: `voxel-wrapper.ts` `selectedLayers` filters but does not deduplicate.
- Fix approach:
  - Normalize to unique layer list before scheduling memory reads.
  - Add duplicate-layer contract test.
- Acceptance criteria:
  - Duplicate requested layers trigger one read per unique layer.
- Verification:
  - `node --test test/integration/voxel-wrapper-readiness-test.mjs`

### T042 — Add explicit start/end bounds validation for readMemory/getMemorySection

- Category: correctness
- Priority: P1
- Effort: S
- Evidence: `voxel-wrapper.ts` read paths do not reject negative/inverted ranges before calling internals.
- Fix approach:
  - Guard `start >= 0`, `endExclusive > start`, and finite integers.
  - Emit structured snapshot error on invalid inputs.
- Acceptance criteria:
  - Invalid ranges return `null` without internal calls.
- Verification:
  - `node --test test/integration/voxel-wrapper-readiness-test.mjs`

### T043 — Scope cached game-memory base per API instance

- Category: reliability
- Priority: P1
- Effort: M
- Evidence: `voxel-wrapper.ts` uses module-global `cachedGameMemoryBase`.
- Fix approach:
  - Move cache to per-instance map keyed by API identity.
  - Clear instance-specific cache on reset/worker swap.
- Acceptance criteria:
  - Multiple API instances do not share stale memory-base state.
- Verification:
  - `node --test test/integration/voxel-wrapper-readiness-test.mjs`

### T044 — Add handler cap and diagnostics for snapshot/error subscriptions

- Category: memory
- Priority: P1
- Effort: M
- Evidence: `voxel-wrapper.ts` unbounded `snapshotHandlers`/`errorHandlers` arrays.
- Fix approach:
  - Add optional max-listener guard or warning threshold.
  - Add tests for subscribe/unsubscribe churn.
- Acceptance criteria:
  - Repeated subscriptions do not cause uncontrolled listener growth.
- Verification:
  - `node --test test/integration/voxel-wrapper-readiness-test.mjs`

### T045 — Replace O(n) byte-array contract check in memory-section validation

- Category: performance
- Priority: P2
- Effort: M
- Evidence: `voxel-wrapper.ts` `isValidMemorySectionContract` uses `payload.bytes.every(isByte)` after `Array.from(bytes)`.
- Fix approach:
  - Add fast-path validation for `Uint8Array` inputs.
  - Avoid full array conversion in hot reads.
- Acceptance criteria:
  - Memory-section calls avoid per-byte JS array conversion in validated paths.
- Verification:
  - `npm run test:performance:throughput`

### T046 — Implement real dirty-tile tracking API

- Category: feature gap
- Priority: P1
- Effort: L
- Evidence: `voxel-wrapper.ts` `getDirtyTiles()` returns static stub.
- Fix approach:
  - Wire dirty tile bitfield from core or wrapper-diffing strategy.
  - Add tests for changed tile tracking between frames.
- Acceptance criteria:
  - Dirty-tile API returns non-empty changes when tile data mutates.
- Verification:
  - `node --test test/integration/voxel-snapshot-test.cjs`

### T047 — Implement joypad trace API or remove unsupported contract

- Category: architecture
- Priority: P1
- Effort: M
- Evidence: `voxel-wrapper.ts` `getJoypadTrace()` returns `[]`; config setter is no-op.
- Fix approach:
  - Either implement trace collection or mark API experimental and gated.
  - Add migration-safe deprecation path if removing.
- Acceptance criteria:
  - Joypad trace behavior is explicit, tested, and documented.
- Verification:
  - `npm run test:integration:tick`

### T048 — Cache GBC palette location/size constants

- Category: performance
- Priority: P2
- Effort: S
- Evidence: `voxel-wrapper.ts` `fetchGbcPalettes` fetches constants every call.
- Fix approach:
  - Memoize palette location/size until cache reset.
  - Keep explicit cache invalidation on reset.
- Acceptance criteria:
  - Repeated palette calls avoid redundant constant queries.
- Verification:
  - `node --test test/integration/voxel-wrapper-readiness-test.mjs`

### T049 — Add contract validation for parsed GBC palette payload size/shape

- Category: correctness
- Priority: P2
- Effort: S
- Evidence: `voxel-wrapper.ts` only checks `size >= expected`; no strict post-parse validation.
- Fix approach:
  - Validate parsed palette count and per-color tuple dimensions.
  - Return null + error event on invalid parse.
- Acceptance criteria:
  - Malformed palette buffers are rejected deterministically.
- Verification:
  - `node --test test/integration/voxel-wrapper-readiness-test.mjs`

### T050 — Add direct-memory view overflow-safe range check

- Category: security
- Priority: P1
- Effort: S
- Evidence: `voxel-wrapper.ts` checks `offset + length > buffer.byteLength` without overflow-safe helper.
- Fix approach:
  - Use safe-add guard (`offset <= byteLength - length`).
  - Add boundary tests near `Number.MAX_SAFE_INTEGER`.
- Acceptance criteria:
  - Out-of-range and overflow inputs always return `null`.
- Verification:
  - `node --test test/integration/voxel-wrapper-readiness-test.mjs`

### T051 — Replace placeholder VRAM bank state with real bank-aware data

- Category: feature gap
- Priority: P1
- Effort: M
- Evidence: `voxel-wrapper.ts` `getVramBankState()` hardcodes `currentBank: 0`.
- Fix approach:
  - Read active bank register and include both banks where relevant.
  - Add integration tests for bank switch visibility.
- Acceptance criteria:
  - VRAM bank state reflects actual current bank and combined data semantics.
- Verification:
  - `npm run test:integration:voxel`

### T052 — Improve subscribe() typing to avoid runtime casts

- Category: DX
- Priority: P2
- Effort: S
- Evidence: `voxel-wrapper.ts` casts handlers in `subscribe`.
- Fix approach:
  - Use function overload signatures with narrowed handler types.
  - Remove runtime `as` casts.
- Acceptance criteria:
  - TypeScript catches mismatched handler/event pairings.
- Verification:
  - `npm run stack:typecheck`

### T053 — Implement emulator-backed run command in CLI

- Category: feature gap
- Priority: P1
- Effort: L
- Evidence: `packages/cli/src/commands.ts` `runCommand` only hashes ROM metadata.
- Fix approach:
  - Integrate with headless emulator execution path.
  - Emit run summary with frame/time/sample metrics.
- Acceptance criteria:
  - `run` command executes ROM frames instead of metadata-only output.
- Verification:
  - `npm --prefix packages/cli test && npm run test:integration:nobuild`

### T054 — Implement emulator-backed snapshot command in CLI

- Category: feature gap
- Priority: P1
- Effort: L
- Evidence: `packages/cli/src/commands.ts` snapshot output contains ROM hash only.
- Fix approach:
  - Capture real PPU snapshot using wrapper APIs.
  - Output contract-compatible snapshot payload.
- Acceptance criteria:
  - Snapshot file validates against `ppuSnapshot` contract.
- Verification:
  - `npm --prefix packages/cli test && node packages/cli/dist/index.js contract-check --contract ppuSnapshot --file ./snapshot.json`

### T055 — Validate compare command input schema before diffing

- Category: correctness
- Priority: P1
- Effort: M
- Evidence: `packages/cli/src/commands.ts` `readSummary()` uses unchecked `JSON.parse(... as SummaryFile)`.
- Fix approach:
  - Add Zod schema for summary file shape.
  - Emit actionable validation errors.
- Acceptance criteria:
  - Invalid summary files fail with structured `InvalidInput`.
- Verification:
  - `npm --prefix packages/cli test`

### T056 — Detect ROMs missing in current summary during compare

- Category: correctness
- Priority: P2
- Effort: S
- Evidence: Compare maps baseline entries only; no reverse missing-in-current report.
- Fix approach:
  - Add reverse diff pass for baseline entries absent in current.
  - Include missing list in output context.
- Acceptance criteria:
  - Compare output reports both “missing-in-baseline” and “missing-in-current”.
- Verification:
  - `npm --prefix packages/cli test`

### T057 — Harden flag parsing for missing flag values in CLI

- Category: reliability
- Priority: P2
- Effort: S
- Evidence: `packages/cli/src/index.ts` `readFirstFlagValue` returns `args[index+1]` without validating token shape.
- Fix approach:
  - Reject missing/flag-token values explicitly.
  - Add parser tests for `--out --current` style malformed input.
- Acceptance criteria:
  - CLI returns `InvalidInput` for missing option values.
- Verification:
  - `npm --prefix packages/cli test`

### T058 — Improve contract-check JSON parse error classification

- Category: DX
- Priority: P2
- Effort: S
- Evidence: `packages/cli/src/commands.ts` raw `JSON.parse` exceptions bubble as generic errors.
- Fix approach:
  - Catch parse errors and wrap as `CliError('InvalidInput', ...)`.
  - Include file path in error context.
- Acceptance criteria:
  - Malformed JSON yields deterministic `InvalidInput` code.
- Verification:
  - `npm --prefix packages/cli test`

### T059 — Add regression test for stdin empty ROM in snapshot/run

- Category: testing
- Priority: P2
- Effort: S
- Evidence: Code checks empty stdin in `readRomInput`, but edge-case coverage should be explicit.
- Fix approach:
  - Add tests for empty stdin path in both commands.
  - Assert code/message stability.
- Acceptance criteria:
  - Empty stdin inputs fail consistently with expected error code.
- Verification:
  - `npm --prefix packages/cli test`

### T060 — Add contract-level CLI integration tests against real baseline fixture

- Category: testing
- Priority: P2
- Effort: M
- Evidence: Current command tests are mostly synthetic fixture-level behavior.
- Fix approach:
  - Add CLI integration tests against real baseline snapshot artifacts.
  - Validate compare and contract-check end-to-end.
- Acceptance criteria:
  - CLI tests cover real repository baseline inputs.
- Verification:
  - `npm --prefix packages/cli test`

### T061 — Replace debugger Home page demo controls with emulator-driven wiring

- Category: feature gap
- Priority: P1
- Effort: L
- Evidence: `apps/debugger/app/page.tsx` triggers synthetic snapshot/interrupt events.
- Fix approach:
  - Connect buttons/panels to actual emulator worker messages.
  - Keep synthetic mode behind explicit dev flag only.
- Acceptance criteria:
  - User actions operate real emulator state in debugger app.
- Verification:
  - `npm --prefix apps/debugger test && npm --prefix apps/debugger build`

### T062 — Replace EmulatorViewPanel placeholder with real canvas rendering

- Category: feature gap
- Priority: P1
- Effort: M
- Evidence: `apps/debugger/components/EmulatorViewPanel.tsx` is a static gradient placeholder.
- Fix approach:
  - Add `<canvas>` and frame blit path.
  - Add render smoke test for frame update.
- Acceptance criteria:
  - Emulator panel displays live frame pixels.
- Verification:
  - `npm --prefix apps/debugger test`

### T063 — Replace MemoryViewer hardcoded rows with real memory data

- Category: feature gap
- Priority: P1
- Effort: M
- Evidence: `apps/debugger/components/MemoryViewerPanel.tsx` uses fixed fake bytes.
- Fix approach:
  - Load memory windows from snapshot/debug API.
  - Add scrolling and address-range controls.
- Acceptance criteria:
  - Memory viewer renders actual memory values from runtime state.
- Verification:
  - `npm --prefix apps/debugger test`

### T064 — Add deterministic key strategy for EventLog entries

- Category: reliability
- Priority: P2
- Effort: S
- Evidence: `EventLogPanel.tsx` key uses `${type}-${frameId}-${timestampMs}`; collisions possible under same timestamp.
- Fix approach:
  - Add monotonic event ID in store.
  - Render keys from unique IDs.
- Acceptance criteria:
  - No React key collision warnings under burst event loads.
- Verification:
  - `npm --prefix apps/debugger test`

### T065 — Use stable checksum algorithm aligned with API naming

- Category: architecture
- Priority: P2
- Effort: M
- Evidence: `debugger-store.ts` labels hashes as checksums but uses custom FNV over JSON strings.
- Fix approach:
  - Either rename fields or implement SHA-256 to match semantics.
  - Add checksum determinism tests.
- Acceptance criteria:
  - Checksum naming and algorithm are consistent and documented.
- Verification:
  - `npm --prefix apps/debugger test`

### T066 — Reduce captureSnapshot allocation churn from repeated JSON.stringify

- Category: performance
- Priority: P2
- Effort: M
- Evidence: `debugger-store.ts` computes hashes by serializing full snapshot repeatedly.
- Fix approach:
  - Hash minimal canonical payload once per capture.
  - Reuse precomputed register serialization.
- Acceptance criteria:
  - Capture loop allocates less and stays within perf budget.
- Verification:
  - `npm --prefix apps/debugger test -- --runInBand`

### T067 — Add auth/rate limits for AI debug endpoint

- Category: security
- Priority: P1
- Effort: M
- Evidence: `apps/debugger/app/api/ai/debug/route.ts` exposes internal state read-only without auth/throttling.
- Fix approach:
  - Add auth token/allowlist gate for non-local environments.
  - Add request-rate limiter for endpoint.
- Acceptance criteria:
  - Unauthorized requests rejected; high-rate requests throttled.
- Verification:
  - `npm --prefix apps/debugger test`

### T068 — Add payload size capping/sanitization for AI debug endpoint

- Category: reliability
- Priority: P1
- Effort: S
- Evidence: Route returns event/snapshot payloads and relies on basic sanitization only.
- Fix approach:
  - Enforce max payload size and field truncation rules.
  - Log truncation metadata.
- Acceptance criteria:
  - Endpoint responses stay below configured size cap.
- Verification:
  - `npm --prefix apps/debugger test`

### T069 — Ensure worker crash-budget exhausted path terminates broken worker deterministically

- Category: reliability
- Priority: P1
- Effort: M
- Evidence: `worker-loader.ts` skips restart when budget exhausted; behavior of current worker lifecycle should be explicit/tested.
- Fix approach:
  - Define policy (terminate/keep worker) when budget exhausted.
  - Add test for final-state semantics.
- Acceptance criteria:
  - Crash budget exhaustion behavior is explicit and tested.
- Verification:
  - `npm --prefix apps/debugger test`

### T070 — Clear performance marks/measures to prevent accumulation

- Category: memory
- Priority: P2
- Effort: S
- Evidence: `performance-marks.ts` creates marks/measures but never clears them.
- Fix approach:
  - Clear marks/measures after read/aggregation.
  - Add long-loop memory-pressure test.
- Acceptance criteria:
  - Mark count does not grow unbounded over long sessions.
- Verification:
  - `npm --prefix apps/debugger test`

### T071 — Avoid repeated large placeholder snapshot allocations in contracts client

- Category: performance
- Priority: P2
- Effort: S
- Evidence: `contracts-client.ts` recreates arrays of 0x1800/0x400/0xA0 bytes on each probe call.
- Fix approach:
  - Cache immutable placeholder payload.
  - Reuse typed arrays/arrays for probe calls.
- Acceptance criteria:
  - Probe call allocations reduced measurably.
- Verification:
  - `npm --prefix apps/debugger test`

### T072 — Align ROM loader accepted formats with actual support

- Category: correctness
- Priority: P2
- Effort: S
- Evidence: `RomLoaderPanel.tsx` accepts `.zip` but no unzip/parse path exists.
- Fix approach:
  - Either implement zip extraction or remove `.zip` from accept list.
  - Update tests/docs accordingly.
- Acceptance criteria:
  - Accepted extensions are actually supported end-to-end.
- Verification:
  - `npm --prefix apps/debugger test`

### T073 — Add exact output contract tests for debugger API route

- Category: testing
- Priority: P2
- Effort: S
- Evidence: Current smoke tests assert selected fields, not full response contract.
- Fix approach:
  - Add strict schema validation for route payload.
  - Assert field bounds and truncation behavior.
- Acceptance criteria:
  - Route contract is machine-validated in tests.
- Verification:
  - `npm --prefix apps/debugger test`

### T074 — Replace locale-sensitive sort in guard blocked path output

- Category: reliability
- Priority: P1
- Effort: S
- Evidence: `scripts/guard-generated-artifacts-precommit.mjs` sorts blocked paths with `localeCompare`.
- Fix approach:
  - Switch to ordinal comparator for deterministic cross-locale ordering.
  - Update tests for mixed-case ordering.
- Acceptance criteria:
  - Guard JSON/text ordering stable across locales/OSes.
- Verification:
  - `node --test "scripts/guard-generated-artifacts-precommit.test.mjs" && node --test "scripts/artifact-cli-contract.test.mjs"`

### T075 — Add timeout controls to git staged-path subprocess in guard script

- Category: reliability
- Priority: P1
- Effort: S
- Evidence: `guard-generated-artifacts-precommit.mjs` `spawnSync('git', ...)` has no timeout.
- Fix approach:
  - Add configurable timeout env/flag.
  - Surface deterministic timeout error.
- Acceptance criteria:
  - Hung git subprocesses fail fast with clear message.
- Verification:
  - `node --test "scripts/guard-generated-artifacts-precommit.test.mjs"`

### T076 — Add timeout controls to dependency freshness audit subprocesses

- Category: reliability
- Priority: P1
- Effort: S
- Evidence: `scripts/dependency-freshness-audit.mjs` `spawnSync('npm', ...)` has no timeout.
- Fix approach:
  - Add per-workspace timeout config with sane defaults.
  - Add timeout failure tests.
- Acceptance criteria:
  - Outdated scan cannot hang indefinitely.
- Verification:
  - `node --test "scripts/dependency-freshness-audit.test.mjs"`

### T077 — Add timeout controls to workspace security scan subprocesses

- Category: reliability
- Priority: P1
- Effort: S
- Evidence: `scripts/security-scan-workspaces.mjs` `spawnSync('npm', ...)` has no timeout.
- Fix approach:
  - Add timeout config and ETIMEDOUT handling.
  - Add regression tests.
- Acceptance criteria:
  - Security scan fails deterministically on timeout.
- Verification:
  - `node --test "scripts/security-scan-workspaces.test.mjs"`

### T078 — Add timeout controls to release checklist dry-run publish calls

- Category: reliability
- Priority: P1
- Effort: S
- Evidence: `scripts/release-checklist-dry-run.mjs` `spawnSync('npm', ...)` has no timeout.
- Fix approach:
  - Add configurable timeout and timeout-specific diagnostics.
  - Add test fixture for hanging publish simulation.
- Acceptance criteria:
  - Release checklist cannot hang indefinitely.
- Verification:
  - `node --test "scripts/release-checklist-dry-run.test.mjs"`

### T079 — Add repository-root safety guard before destructive cleanup

- Category: security
- Priority: P1
- Effort: S
- Evidence: `clean-accidental-build-artifacts.mjs` removes configured directories recursively.
- Fix approach:
  - Validate target paths remain under repo root before `rm`.
  - Refuse symlink-escape scenarios.
- Acceptance criteria:
  - Cleanup aborts on unsafe target resolution.
- Verification:
  - `node --test "scripts/clean-accidental-build-artifacts.test.mjs"`

### T080 — Add path traversal/symlink tests for cleanup scanner

- Category: testing
- Priority: P1
- Effort: M
- Evidence: Recursive scanner in `clean-accidental-build-artifacts.mjs` currently traverses filesystem tree directly.
- Fix approach:
  - Add test fixtures for symlinked directories/files.
  - Decide/implement safe symlink policy.
- Acceptance criteria:
  - Cleanup scanner behavior is explicit and tested for symlink cases.
- Verification:
  - `node --test "scripts/clean-accidental-build-artifacts.test.mjs"`

### T081 — Harden next-backlog generator parser against markdown format drift

- Category: reliability
- Priority: P2
- Effort: M
- Evidence: `scripts/next-backlog-generator.mjs` parses debt table with positional split cells.
- Fix approach:
  - Add robust parser for markdown table rows with escaped pipes/spacing variants.
  - Add fixtures for malformed/variant tables.
- Acceptance criteria:
  - Generator handles valid format variants without silent row loss.
- Verification:
  - `node --test "scripts/next-backlog-generator.test.mjs"`

### T082 — Normalize risk enum casing in backlog generator output

- Category: DX
- Priority: P2
- Effort: S
- Evidence: `mapSeverityToRisk` returns `'DX'` uppercase while table risk values are otherwise lowercase.
- Fix approach:
  - Normalize to lowercase canonical risk labels.
  - Update tests/docs.
- Acceptance criteria:
  - Generated backlog risk values are consistently cased.
- Verification:
  - `node --test "scripts/next-backlog-generator.test.mjs"`

### T083 — Add JSON output mode for dependency freshness audit

- Category: DX
- Priority: P2
- Effort: M
- Evidence: Freshness audit currently emits text lines only; parsing requires log scraping.
- Fix approach:
  - Add `--json` output contract with schemaVersion/tool metadata.
  - Add contract tests.
- Acceptance criteria:
  - Tool emits machine-readable JSON suitable for CI artifact ingestion.
- Verification:
  - `node --test "scripts/dependency-freshness-audit.test.mjs"`

### T084 — Add JSON output mode for workspace security scan

- Category: DX
- Priority: P2
- Effort: M
- Evidence: Security scan currently emits text summary only.
- Fix approach:
  - Add `--json` payload output.
  - Include per-workspace vulnerability summary fields.
- Acceptance criteria:
  - Security scan has deterministic machine-readable output contract.
- Verification:
  - `node --test "scripts/security-scan-workspaces.test.mjs"`

### T085 — Add deterministic sort for dependency freshness package rows

- Category: reliability
- Priority: P2
- Effort: S
- Evidence: Freshness report iterates `Object.entries()` over parsed output.
- Fix approach:
  - Sort package names before emitting lines.
  - Assert deterministic order in tests.
- Acceptance criteria:
  - Output package ordering stable across Node versions.
- Verification:
  - `node --test "scripts/dependency-freshness-audit.test.mjs"`

### T086 — Add deterministic sort for security scan workspace rows

- Category: reliability
- Priority: P2
- Effort: S
- Evidence: Workspace iteration depends on configured array order only; add explicit sort for defensive stability.
- Fix approach:
  - Sort workspace outputs by path.
  - Add regression assertion.
- Acceptance criteria:
  - Security report ordering deterministic regardless of input order.
- Verification:
  - `node --test "scripts/security-scan-workspaces.test.mjs"`

### T087 — Add Windows CI lane for automation + script contracts

- Category: reliability
- Priority: P1
- Effort: M
- Evidence: `.github/workflows/*.yml` all use `runs-on: ubuntu-latest`.
- Fix approach:
  - Add `windows-latest` matrix jobs for automation/script suite.
  - Keep path/line ending normalization checks.
- Acceptance criteria:
  - Script/automation gate passes on Windows in CI.
- Verification:
  - `gh run list --workflow ci.yml`

### T088 — Add macOS CI lane for automation + app/package smoke tests

- Category: reliability
- Priority: P1
- Effort: M
- Evidence: No macOS runners configured in workflows.
- Fix approach:
  - Add `macos-latest` matrix lane.
  - Scope to smoke tests to control cost.
- Acceptance criteria:
  - Core automation smoke and package tests run on macOS.
- Verification:
  - `gh run list --workflow ci.yml`

### T089 — Add Linux distro variance lane for script portability

- Category: reliability
- Priority: P2
- Effort: M
- Evidence: Current Linux testing uses only `ubuntu-latest`.
- Fix approach:
  - Add second Linux image/container variant.
  - Run script and CLI contract smoke there.
- Acceptance criteria:
  - Script stack validated against at least two Linux environments.
- Verification:
  - `gh run list --workflow ci.yml`

### T090 — Introduce NutJS-based UI smoke automation harness

- Category: testing
- Priority: P2
- Effort: L
- Evidence: Repo contains no NutJS dependency or GUI automation harness (`rg "nutjs|@nut-tree"` returns no source matches).
- Fix approach:
  - Add dedicated UI smoke package for NutJS tests.
  - Implement baseline launch/open/load ROM smoke scenario.
- Acceptance criteria:
  - NutJS smoke test runs locally and in at least one CI lane.
- Verification:
  - `npm run test:ui:smoke`

### T091 — Add NutJS screenshot artifact contract + retention policy

- Category: DX
- Priority: P2
- Effort: M
- Evidence: No standardized UI automation artifact naming/retention in current scripts/workflows.
- Fix approach:
  - Define deterministic screenshot naming format.
  - Upload and retain artifacts on failure paths.
- Acceptance criteria:
  - Failed UI runs always produce discoverable screenshot artifacts.
- Verification:
  - `gh run view --log <run-id>`

### T092 — Add NutJS platform capability checks (Wayland/X11/macOS accessibility)

- Category: reliability
- Priority: P2
- Effort: M
- Evidence: No current code handles NutJS host capability preflight.
- Fix approach:
  - Add environment probe script and skip/fail policy.
  - Emit actionable diagnostics for missing capabilities.
- Acceptance criteria:
  - UI automation failures clearly classify environment vs product issues.
- Verification:
  - `npm run test:ui:smoke`

### T093 — Add SBOM generation to release verification

- Category: security
- Priority: P2
- Effort: M
- Evidence: Current release workflow does not generate software bill of materials artifacts.
- Fix approach:
  - Add SBOM generation step for root/packages.
  - Upload SBOM as release/CI artifact.
- Acceptance criteria:
  - Each release verification run emits SBOM artifact.
- Verification:
  - `gh run view --log <run-id>`

### T094 — Add license-compliance scanning in CI quality gate

- Category: security
- Priority: P2
- Effort: M
- Evidence: Current quality gate includes audit + freshness, but no license policy check.
- Fix approach:
  - Add license scanner with allow/deny policy.
  - Document triage workflow for violations.
- Acceptance criteria:
  - CI fails on disallowed licenses with actionable report.
- Verification:
  - `npm run test:all:nobuild`

### T095 — Modernize legacy Husky v1 configuration to supported major

- Category: deps
- Priority: P1
- Effort: M
- Evidence: Root `package.json` uses `husky` `^1.0.0-rc.8`.
- Fix approach:
  - Upgrade Husky to current major.
  - Migrate hook wiring preserving existing pre-commit behavior.
- Acceptance criteria:
  - Hooks run via supported Husky version with no behavior regressions.
- Verification:
  - `npm run precommit:hook && npm run automation:test`

### T096 — Plan and execute AssemblyScript toolchain upgrade path

- Category: deps
- Priority: P1
- Effort: L
- Evidence: Root uses `assemblyscript ^0.15.1`; freshness scan reports latest `0.28.9`.
- Fix approach:
  - Create staged migration plan with compatibility checkpoints.
  - Upgrade with compile/behavior benchmarks and rollback plan.
- Acceptance criteria:
  - Core builds and regression suites pass on upgraded AssemblyScript.
- Verification:
  - `npm run core:build && npm run test:core:nobuild && npm run test:integration:nobuild`

### T097 — Reduce root workspace dependency staleness in controlled batches

- Category: deps
- Priority: P1
- Effort: L
- Evidence: `npm run dependency:freshness:audit` reports `totalOutdated=44`.
- Fix approach:
  - Upgrade deps in small batches grouped by subsystem.
  - Run full no-build gate after each batch.
- Acceptance criteria:
  - Outdated count reduced with no regression in quality gate.
- Verification:
  - `npm run dependency:freshness:audit:strict && npm run test:all:nobuild`

### T098 — Replace deprecated Google Universal Analytics integration

- Category: security
- Priority: P2
- Effort: M
- Evidence: `demo/*/analytics*.js` loads `UA-125276735-*` trackers.
- Fix approach:
  - Migrate to supported analytics provider/version or remove.
  - Update privacy documentation accordingly.
- Acceptance criteria:
  - No deprecated UA tracker IDs remain in runtime code.
- Verification:
  - `rg "UA-125276735" demo`

### T099 — Add consent gate for analytics script injection

- Category: security
- Priority: P2
- Effort: M
- Evidence: `demo/debugger/analytics.js`, `demo/benchmark/analytics.js`, `demo/iframe/scripts/load-analytics.js` auto-load analytics scripts.
- Fix approach:
  - Require explicit consent before analytics script injection.
  - Add persistent consent preference handling.
- Acceptance criteria:
  - Analytics script does not load before consent.
- Verification:
  - Manual browser check + `npm run debugger:build`

### T100 — Update README claims and links to match current CI/runtime reality

- Category: docs
- Priority: P2
- Effort: S
- Evidence: `README.md` still includes legacy badges/tooling references and broad support claims without matching cross-platform CI coverage.
- Fix approach:
  - Update badges/workflow references to current pipelines.
  - Clarify tested platform matrix and known limitations.
- Acceptance criteria:
  - README reflects actual maintained workflows and support boundaries.
- Verification:
  - `npm run prettier:lint && rg "travis-ci.org|Supported Platforms" README.md`

---

## 3) Suggested execution order (first 10 tasks)

1. **T001**
2. **T002**
3. **T003**
4. **T004**
5. **T005**
6. **T006**
7. **T007**
8. **T008**
9. **T009**
10. **T010**

### Rationale

- T001–T005 are high-confidence, low-effort **P0 correctness defects** in state restoration and should be fixed first to prevent hidden corruption.
- T006 ensures those fixes are permanently guarded by targeted tests.
- T007–T010 address the highest-impact unresolved emulation correctness gaps explicitly called out in code comments and likely user-visible behavior.
- Completing these first collapses the top correctness risk cluster before broader optimization/DX/dependency work.
