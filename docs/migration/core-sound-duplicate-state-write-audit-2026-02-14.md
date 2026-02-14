# Core Sound Duplicate State-Write Audit (2026-02-14)

## Scope

Audited sound update and register paths in:

- `core/sound/sound.ts`
- `core/sound/registers.ts`
- `core/sound/channel1.ts`
- `core/sound/channel2.ts`
- `core/sound/channel3.ts`
- `core/sound/channel4.ts`

Goal: find repeated state writes that are likely redundant on hot paths.

## Findings

### 1) Sound init writes register bytes and mirrored decoded state separately

In `initializeSound()`:

- `eightBitStoreIntoGBMemory(Sound.memoryLocationNR50/NR51/NR52, ...)`
- immediately followed by `Sound.updateNR50/NR51/NR52(...)`

This happens for both default-init values and Boot ROM override values.

Interpretation:

- Not necessarily incorrect (memory image + cached decoded fields both maintained),
- but it duplicates work per initialization path.

### 2) Channel frequency fields are recomputed/written in multiple update sites

Across channels 1–3:

- `updateNRx3()` writes `NRx3FrequencyLSB` and recomputes `frequency`.
- `updateNRx4()` writes `NRx4FrequencyMSB` and recomputes `frequency`.
- `setFrequency()` writes memory registers again and reassigns `NRx3FrequencyLSB`, `NRx4FrequencyMSB`, and `frequency`.

Interpretation:

- Same derived `frequency` field can be written multiple times in close succession.
- The duplication is likely correctness-motivated (trap-safe synchronization), but it is a repeat-write hotspot.

### 3) NR52 power-off path performs broad trapped zero writes

In `SoundRegisterWriteTraps()` when powering sound off:

- loops `0xff10..0xff25`
- calls `eightBitStoreIntoGBMemoryWithTraps(i, 0x00)`

Interpretation:

- This intentionally fans out into per-register trap handlers.
- Ensures hardware-accurate reset behavior, but triggers repeated writes/derived updates even for already-zero values.

### 4) Mixer accumulator flags are force-reset every mix pass

In `mixChannelSamples()`:

- `SoundAccumulator.mixerVolumeChanged = false`
- `SoundAccumulator.mixerEnabledChanged = false`
- `SoundAccumulator.needToRemixSamples = false`

Interpretation:

- Fast and simple, but unconditional writes occur each sample mix even when flags are already false.

## Hotness / risk ranking

| Area                                        | Runtime hotness     | Correctness sensitivity | Optimization risk |
| ------------------------------------------- | ------------------- | ----------------------- | ----------------- |
| Channel frequency recompute/write fan-out   | High                | High                    | Medium-High       |
| Mixer flag unconditional resets             | High                | Medium                  | Low-Medium        |
| NR52 power-off trapped zero loop            | Low (event-driven)  | High                    | High              |
| Initialization register+decoded dual writes | Low (startup/reset) | Medium                  | Low               |

## Recommendations

1. **Low-risk first:** gate accumulator flag resets behind change checks in mix path.
2. **Medium-risk:** introduce tiny channel helper to recompute/write frequency once per logical update event (while preserving trap semantics).
3. **Do not optimize blindly:** keep NR52 full reset fan-out behavior unless hardware-accuracy tests prove safe alternatives.
4. **Add focused regression before refactors:** channel sweep/length tests and power-toggle behavior tests should guard any dedupe attempts.

## Conclusion

The highest-impact duplicated state writes are in per-sample/per-update channel state synchronization and accumulator-flag resets. The most practical near-term win is minimizing unconditional mixer flag writes; deeper channel frequency deduplication should be test-first due to high APU correctness sensitivity.

## 2026-02-14 resolution update

Implemented the medium-risk channel-frequency deduplication step by introducing
`syncFrequencyFromRegisters()` helpers in:

- `core/sound/channel1.ts`
- `core/sound/channel2.ts`
- `core/sound/channel3.ts`

`updateNRx3`, `updateNRx4`, and channel-set frequency paths now route through the
same helper instead of repeating inline frequency recomputation logic.

Validation run:

- `npm run core:build`
- `npm run lib:build:wasm`
- `npm run test:core:serialization`
- `npm run test:integration:headless`
