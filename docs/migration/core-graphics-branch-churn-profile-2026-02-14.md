# Core Graphics Hot-Path Branch Churn Profile (2026-02-14)

## Scope

Profile/audit focused on high-frequency rendering paths in:

- `core/graphics/graphics.ts`
- `core/graphics/backgroundWindow.ts`
- `core/graphics/sprites.ts`
- `core/graphics/lcd.ts`

Goal: identify branch-heavy patterns that run per scanline/per pixel and may create avoidable churn.

## Baseline runtime signal

Command:

```bash
npm run test:performance:throughput
```

Observed baseline on this branch:

- **820.28 FPS** (`1200` frames in `1462.92ms`)

This confirms current performance remains healthy, but does not rule out branch-efficiency wins in hot loops.

## Branch density snapshot (static)

`if (...)` count by file:

- `core/graphics/backgroundWindow.ts`: **23**
- `core/graphics/graphics.ts`: **17**
- `core/graphics/sprites.ts`: **14**
- `core/graphics/lcd.ts`: **14**

The highest concentration is in the per-pixel background/window renderer.

## Hot-path branch findings

### 1) Per-pixel config-mode branching in background renderer

In `drawBackgroundWindowScanline(...)`, the inner `for (iStart; i < 160; ++i)` loop repeatedly branches on:

- `Config.tileCaching`
- `Config.tileRendering`
- `Cpu.GBCEnabled`

These values are effectively frame-stable/runtime-stable toggles and do not need to be re-evaluated per pixel.

### 2) Repeated attribute bit checks on tile/sprite-local invariants

Multiple `checkBitOnByte(...)` calls are executed repeatedly where source attributes are already known for the current tile/sprite line:

- background/window tile attribute flips and palette selection
- sprite flip/priority/palette decisions

Several of these can be hoisted once per tile/sprite line and reused.

### 3) Scanline-mode branching repeatedly re-evaluates derived constants

`updateGraphics(...)` calls `Graphics.MAX_CYCLES_PER_SCANLINE()` in loop condition and body.
That helper itself branches on `scanlineRegister === 153`, creating repeat branch traffic in the scanline processing loop.

### 4) Sprite pixel path has nested priority branches per visible pixel

`renderSprites(...)` includes nested visibility/priority gates per pixel:

- transparent color check
- camera bounds check
- LCDC priority override
- OAM priority suppression
- BG priority suppression

Correctness-sensitive, but still a major branch fan-out region.

## Candidate branch-churn reductions (no behavior change intended)

1. **Hoist per-frame/per-scanline booleans outside inner pixel loops**
   - Cache `Config.tileCaching`, `Config.tileRendering`, `Cpu.GBCEnabled` in locals before entering scanline pixel loops.
2. **Precompute tile/sprite attribute booleans once**
   - Derive flip/priority/palette booleans once per tile/sprite line and reuse.
3. **Cache scanline cycle budget once per scanline iteration**
   - Avoid repeated `MAX_CYCLES_PER_SCANLINE()` calls inside the same iteration.
4. **Split hot paths by mode (GB vs GBC)**
   - Prefer mode-specific loops/functions to remove repeated `if (Cpu.GBCEnabled)` checks in the innermost path.

## Conclusion

No immediate correctness regressions were observed, but branch churn is concentrated in the background/window and sprite inner loops. The most promising low-risk optimization is hoisting stable mode/config checks out of pixel loops before pursuing deeper structural refactors.

## 2026-02-14 resolution update

Implemented the low-risk branch-hoist items in:

- `core/graphics/backgroundWindow.ts`
  - hoisted frame-stable `Config.tileCaching`, `Config.tileRendering`, and
    `Cpu.GBCEnabled` checks out of the per-pixel inner loop.
- `core/graphics/graphics.ts`
  - cached `MAX_CYCLES_PER_SCANLINE()` once per loop iteration in
    `updateGraphics(...)` instead of re-evaluating it twice.

Validation run:

- `npm run core:build`
- `npm run lib:build:wasm`
- `npm run test:performance:throughput`
  - observed: **830.39 FPS** (`1200` frames in `1445.11ms`)
- `npm run test:integration:headless`
