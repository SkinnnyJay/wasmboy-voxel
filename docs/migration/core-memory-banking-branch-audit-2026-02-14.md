# Core Memory Banking Branch-Churn Audit (2026-02-14)

## Scope

Audited branch-heavy memory banking and write-trap paths in:

- `core/memory/banking.ts`
- `core/memory/writeTraps.ts`
- `core/memory/memoryMap.ts`

Goal: identify repeated branch checks in high-frequency memory control paths.

## Static branch density snapshot

- `core/memory/banking.ts`
  - `if (...)` count: **19**
  - `switch (...)` count: **0**
- `core/memory/writeTraps.ts`
  - `if (...)` count: **28**
  - `switch (...)` count: **2**
- `core/memory/memoryMap.ts`
  - `if (...)` count: **7**
  - `switch (...)` count: **1**

The densest control fan-out is split between `handleBanking()` and `checkWriteTraps()`.

## Key findings

### 1) `handleBanking()` has nested offset-range + MBC-type branch fan-out

`handleBanking(offset, value)` combines:

- offset-range routing (`<=0x1fff`, `<=0x3fff`, `<=0x5fff`, `<=0x7fff`)
- MBC model checks (`isMBC1`, `isMBC2`, `isMBC3`, `isMBC5`)
- mode-specific branch behavior (`isMBC1RomModeEnabled`)

This is correctness-critical but branch-dense for a path reached by many ROM-area writes.

### 2) Repeated model checks are mixed between cached locals and direct globals

The function caches `isMBC1`/`isMBC2` (and `isMBC5` in a nested branch), but still accesses other
model flags directly (`Memory.isMBC3`, `Memory.isMBC5`) in deeper branches.

This pattern can create extra branch/field-load churn and makes branch behavior harder to reason about.

### 3) `checkWriteTraps()` front-loads many range checks before trap-specific handling

`checkWriteTraps()` is broad and branch-heavy because it multiplexes:

- CPU register traps
- banking handling
- VRAM/OAM restrictions
- serial/sound/timer/interrupt/joypad traps
- GBC palette/HDMA edge cases

The function is intentionally centralized, but frequent writes repeatedly walk a long branch ladder.

### 4) Bank-address helpers include additional correction branches

`getRomBankAddress()` includes:

- MBC5 exception behavior (`bank 0` correction path for non-MBC5)

Small but frequently reached in ROM switchable-bank reads.

## Optimization candidates (risk-aware)

1. **Normalize MBC flag reads at function entry**
   - Cache all model booleans once (`isMBC1/2/3/5`) and use locals consistently.
2. **Split `handleBanking()` by MBC family helper**
   - Route once by controller family, then run mode-specific logic in dedicated helpers.
3. **Early-return fast paths in `checkWriteTraps()` by tight hot ranges**
   - Keep common-path checks near the top and isolate rarer subsystems into helper calls.
4. **Add microbench before refactors**
   - Branch refactors in banking paths are correctness-sensitive; guard with deterministic ROM banking tests.

## Conclusion

Memory banking and write traps are intentionally branch-heavy due hardware behavior, but the current shape contains opportunities to reduce repeated checks and improve readability/hot-path predictability. The safest first step is localizing repeated model-flag reads and adding focused microbench/regression coverage before structural refactors.

## 2026-02-14 resolution update

The primary `handleBanking()` fan-out item has been addressed by splitting offset
range handlers into focused helpers:

- `updateRamBankingEnabledState`
- `updateRomBankLowBits`
- `updateRamBankOrMbc1UpperRomBits`
- `updateMbc1RomMode`

This keeps behavior-compatible routing while reducing nested branch complexity in
the main banking entrypoint. Validation run:

- `npm run core:build`
- `npm run lib:build:wasm`
- `npm run test:core:memorytraps`
- `npm run test:integration:memorybounds`
