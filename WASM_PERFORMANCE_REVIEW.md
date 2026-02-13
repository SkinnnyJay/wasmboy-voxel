# WebAssembly Performance Review

Review of the WasmBoy-Voxel codebase for WebAssembly and Game Boy emulator performance anti-patterns. Scope: AssemblyScript core (`core/`), JavaScript/TypeScript wrapper (`lib/`, `voxel-wrapper.ts`), excluding generated `dist/` and `build/`.

---

## 1. Core (AssemblyScript) Hot-Path Anti-Patterns

### 1.1 Per-pixel tile map and VRAM lookups (High)

**File:** [core/graphics/backgroundWindow.ts](core/graphics/backgroundWindow.ts)

The background/window scanline loop (lines 88–176) recomputes tile map address and loads the tile ID from VRAM for every pixel, even though tiles are 8×8. Same tile is used for 8 consecutive pixels.

- **Pattern:** `tileMapAddress = tileMapMemoryLocation + (tileYPositionInMap << 5) + tileXPositionInMap` and `loadFromVramBank(tileMapAddress, 0)` inside `for (let i = iStart; i < 160; ++i)`.
- **Impact:** Unnecessary address math and memory loads in the hottest render path; 160 iterations per scanline × 144 scanlines.
- **Best practice:** Compute per-tile (every 8 pixels); reuse tile ID across the tile width.

### 1.2 Repeated VRAM base-address computation (Medium)

**File:** [core/graphics/graphics.ts](core/graphics/graphics.ts)

`loadFromVramBank` (lines 344–348) recomputes the WASM base address on every call:

```ts
let wasmBoyAddress = gameboyOffset - Memory.videoRamLocation + GAMEBOY_INTERNAL_MEMORY_LOCATION + 0x2000 * (vramBankId & 0x01);
return load<u8>(wasmBoyAddress);
```

- **Pattern:** Used inside per-pixel and per-tile loops (background, window, tiles, sprites). The expression is invariant for a given `vramBankId` and could be hoisted or cached per bank.
- **Impact:** Redundant arithmetic in hot paths.
- **Best practice:** Hoist bank base computation outside inner loops or provide a bank-base getter used once per draw context.

### 1.3 Per-pixel branching and palette work in tile line drawing (High)

**File:** [core/graphics/tiles.ts](core/graphics/tiles.ts)

The inner pixel loop (lines 58–150) does, per pixel: bit tests for color ID, GBC vs monochrome branch, palette/hex lookups, `getTilePixelStart`, three `store` calls, and `addPriorityforPixel`.

- **Pattern:** Deep branching (Cpu.GBCEnabled, paletteLocation, shouldRepresentMonochromeColorByColorId) and multiple helper calls in the innermost loop.
- **Impact:** Branch misprediction and call overhead in the PPU’s hottest path.
- **Best practice:** Split monochrome vs GBC paths at scanline or tile level; minimize branches and helper calls in the inner loop; consider precomputing palette tables and indexing by color ID.

### 1.4 Loop index mutation in tile cache copy (Medium)

**File:** [core/graphics/backgroundWindow.ts](core/graphics/backgroundWindow.ts)

In `drawLineOfTileFromTileCache` (lines 370–398), the loop mutates the index when flip state differs:

```ts
for (let tileCacheIndex = 0; tileCacheIndex < 8; ++tileCacheIndex) {
  if (wasLastTileHorizontallyFlipped !== isCurrentTileHorizontallyFlipped) {
    tileCacheIndex = 7 - tileCacheIndex;
  }
  // ...
}
```

- **Pattern:** Modifying the loop variable makes control flow non-linear and can confuse WASM/JS optimizers.
- **Impact:** Harder to optimize; possible redundant or inconsistent iteration.
- **Best practice:** Use a separate variable for the source index (e.g. `srcIndex = flip ? 7 - tileCacheIndex : tileCacheIndex`) and keep the loop index monotonic.

### 1.5 Full-frame priority map clear (Medium)

**File:** [core/graphics/priority.ts](core/graphics/priority.ts)

`clearPriorityMap()` (lines 23–29) does 160×144 stores every frame:

```ts
for (let y = 0; y < 144; ++y) {
  for (let x = 0; x < 160; ++x) {
    store<u8>(BG_PRIORITY_MAP_LOCATION + getPixelStart(x, y), 0);
  }
}
```

- **Pattern:** 23,040 individual stores with address computation each time.
- **Impact:** Predictable but non-trivial per-frame cost; could be a single contiguous clear or memset-style loop.
- **Best practice:** Treat the priority map as a contiguous region (160×144 bytes) and clear with a single loop over a linear index, or use a bulk store if the runtime supports it.

### 1.6 Per-sample audio conversion (Medium)

**File:** [core/sound/sound.ts](core/sound/sound.ts)

`getSampleAsUnsignedByte` (lines 501–534) recomputes `maxDivider` on every call and does multiple multiplies/divides with a large precision constant.

- **Pattern:** `maxDivider = i32Portable((120 * precision) / 254)` and division by `maxDivider` inside a per-sample path.
- **Impact:** Redundant work in the audio hot path; `maxDivider` is constant and can be computed once.
- **Best practice:** Hoist `maxDivider` (and any other constants) to module scope or a one-time init so the per-sample path does minimal arithmetic.

### 1.7 Sprite inner loop: priority and palette per pixel (High)

**File:** [core/graphics/sprites.ts](core/graphics/sprites.ts)

The 8-pixel sprite loop (lines 99–189) does, per pixel: color ID from bit tests, priority read via `getPriorityforPixel`, multiple priority/LCDC branches, palette lookup, and three `setPixelOnFrame` calls.

- **Pattern:** Same style as tile drawing: heavy branching and multiple memory/helper calls in the innermost loop.
- **Impact:** Major hotspot when many sprites are on a scanline.
- **Best practice:** Reduce branches (e.g. separate code paths for GBC vs DMG, priority vs no priority); batch pixel writes where possible; consider inlining or flattening priority logic.

---

## 2. Worker and Memory Transfer Overhead

### 2.1 Per-frame full memory snapshot and saveState (High)

**Files:** [lib/wasmboy/worker/update.js](lib/wasmboy/worker/update.js), [lib/wasmboy/worker/memory/internalstate.js](lib/wasmboy/worker/memory/internalstate.js)

Every frame after execution, the lib worker sends full cartridge RAM, full Game Boy memory, palette memory, and internal state to the memory worker. Each of these is obtained via `.slice()` (copy), and internal state forces a full `saveState()` call.

- **Pattern:** `getInternalState(libWorker)` calls `libWorker.wasmInstance.exports.saveState()` then `libWorker.wasmByteMemory.slice(...)`. Same pattern for `getGameBoyMemory`, `getPaletteMemory`, `getCartridgeRam` (all `.slice()`). All four buffers are posted every frame.
- **Impact:** Large per-frame CPU and GC cost; saveState is expensive and intended for snapshots, not every-frame sync.
- **Best practice:** Send full memory/state only when needed (e.g. save state, debugger, or explicit snapshot). For normal gameplay, avoid per-frame saveState and full memory transfer; use dirty regions or on-demand reads if the main thread needs specific data.

### 2.2 Main-thread reconstruction of typed arrays on UPDATED (Medium)

**File:** [lib/memory/memory.js](lib/memory/memory.js)

On each `WORKER_MESSAGE_TYPE.UPDATED`, the memory service allocates new `Uint8Array` instances for every region present in the message (lines 88–105).

- **Pattern:** `this.cartridgeRam = new Uint8Array(eventData.message[MEMORY_TYPE.CARTRIDGE_RAM])`, and similarly for gameboyMemory, paletteMemory, internalState.
- **Impact:** When combined with 2.1, this doubles allocation and copy pressure (worker slice + main-thread copy) every frame.
- **Best practice:** Only process UPDATED when the consumer actually needs fresh memory (e.g. save-state UI); otherwise skip or throttle. Consider reusing a single buffer and transferring ownership instead of allocating new arrays every time.

### 2.3 GET_WASM_MEMORY_SECTION copies entire requested range (Medium)

**File:** [lib/wasmboy/worker/wasmboy.worker.js](lib/wasmboy/worker/wasmboy.worker.js)

Each `GET_WASM_MEMORY_SECTION` request triggers a `slice(start, end)` and transfer of that buffer (lines 234–255).

- **Pattern:** Snapshot and debug APIs call this for multiple regions; each call is a copy + postMessage.
- **Impact:** Multiple round-trips and copies per snapshot (see 3.2); more overhead when snapshot is called every frame (e.g. voxel renderer).
- **Best practice:** Prefer a single batched “get PPU snapshot” message that returns one buffer (or a few) with known layout, instead of many small GET_WASM_MEMORY_SECTION calls.

---

## 3. Graphics and Audio Conversion Pipelines

### 3.1 Per-frame graphics pipeline: multiple copies and RGB→RGBA conversion (High)

**Files:** [lib/wasmboy/worker/graphics/transfer.js](lib/wasmboy/worker/graphics/transfer.js), [lib/graphics/worker/graphics.worker.js](lib/graphics/worker/graphics.worker.js), [lib/graphics/worker/imageData.js](lib/graphics/worker/imageData.js), [lib/graphics/graphics.js](lib/graphics/graphics.js)

Each frame: lib worker slices the frame buffer and posts it; graphics worker wraps it in `new Uint8ClampedArray(eventData.message.graphicsFrameBuffer)`, allocates a new 160×144×4 `Uint8ClampedArray`, and fills it pixel-by-pixel (RGB→RGBA with alpha=255); main thread then allocates another `Uint8ClampedArray` from the received buffer and copies into `canvasImageData.data`.

- **Pattern:** `wasmByteMemory.slice(...).buffer` → transfer → `new Uint8ClampedArray(...)` → new 69120-byte array + 160×144 loop → transfer → `new Uint8ClampedArray(imageDataArrayBuffer)` → `canvasImageData.data.set(this.imageDataArray)`.
- **Impact:** Several allocations and two full 160×144 pixel conversions per frame.
- **Best practice:** Reuse a single RGBA buffer in the graphics worker and in the main thread where possible; consider producing RGBA in WASM to avoid the conversion worker step, or use a single transfer with a shared layout to minimize copies.

### 3.2 PPU snapshot: many worker round-trips (High)

**File:** [voxel-wrapper.ts](voxel-wrapper.ts)

`getPpuSnapshot()` (lines 243–286) first does a round-trip for `readGameMemoryByte(..., REG_LCDC)`, then `Promise.all` of 4 section reads and 7 single-byte reads. Each read is a separate `_getWasmMemorySection` / `readGameMemoryByte` call, each resulting in a worker message and a `slice` in the worker.

- **Pattern:** 1 (LCDC) + 4 (tile data, BG map, window map, OAM) + 7 (registers) = 12 round-trips per snapshot; single-byte reads each request a 1-byte section (extra overhead).
- **Impact:** When the voxel renderer calls `getPpuSnapshot()` every frame, this dominates per-frame cost due to message and copy overhead.
- **Best practice:** Add a single “get PPU snapshot” worker message that returns one (or few) buffers with a fixed layout (tile data, tilemaps, OAM, registers). Implement in the worker with one or two slices and one response instead of 12.

### 3.3 Redundant copy in getVramBankState (Low)

**File:** [voxel-wrapper.ts](voxel-wrapper.ts)

`getVramBankState()` (lines 369–378) calls `getPpuSnapshot()`, then does `combinedTileData: new Uint8Array(tileData)` when `tileData` is already a `Uint8Array`.

- **Pattern:** Unnecessary copy of tile data for the combined bank view.
- **Impact:** Extra allocation and copy per call; smaller than 3.2 but avoidable.
- **Best practice:** Return `tileData` (or a view) directly when no actual combination of banks is needed; if a copy is required, document why and keep a single copy.

### 3.4 Audio: per-update buffer slice and Float32 conversion (Medium)

**Files:** [lib/wasmboy/worker/update.js](lib/wasmboy/worker/update.js), [lib/audio/worker/audio.worker.js](lib/audio/worker/audio.worker.js)

Audio path: lib worker slices wasm audio output and posts it; audio worker allocates left/right `Float32Array`s and fills them in two loops with `getUnsignedAudioSampleAsFloat` per sample.

- **Pattern:** `wasmByteMemory.slice(WASMBOY_SOUND_OUTPUT_LOCATION, ...).buffer` every time audio is sent; in the worker, `new Float32Array(numberOfSamples)` ×2 and two passes over the buffer.
- **Impact:** Allocation and conversion every audio update; acceptable for correctness but can be optimized with buffer reuse and a single deinterleave pass.
- **Best practice:** Reuse Float32 buffers when size is stable; consider a single loop that fills both channels if it improves cache behavior.

### 3.5 No direct memory access for snapshot consumers (Medium)

**File:** [voxel-wrapper.ts](voxel-wrapper.ts)

`getDirectMemoryAccess()` always returns `available: false` and `getView: () => null` (lines 379–384). Snapshot data is only available via async worker messages and copies.

- **Pattern:** When the same thread could hold a reference to the WASM memory (e.g. in a non-worker or shared-array setup), direct views would avoid copies.
- **Impact:** In the current worker-based design, every snapshot is copy-heavy; if the architecture ever supports same-thread or shared memory, exposing a view would reduce overhead.
- **Best practice:** Document that direct access is not available; if a shared-memory or same-thread path is added later, expose a view there and use it for per-frame snapshot consumers like the voxel renderer.

---

## 4. Severity Summary and Recommendations

### High severity (address first)

| ID  | Issue                                      | Location              | Recommendation |
|-----|--------------------------------------------|-----------------------|----------------|
| 1.1 | Per-pixel tile map/VRAM lookup             | backgroundWindow.ts  | Compute per 8 pixels; reuse tile ID. |
| 1.3 | Per-pixel branching in tile line           | tiles.ts              | Split GBC/DMG paths; reduce inner-loop branches. |
| 1.7 | Sprite inner-loop priority and palette     | sprites.ts            | Reduce branches; consider path splitting. |
| 2.1 | Per-frame full memory + saveState          | update.js, internalstate.js | Only send full state when needed; avoid saveState every frame. |
| 3.1 | Multiple graphics copies + RGB→RGBA        | transfer.js, imageData.js, graphics.js | Reuse buffers; consider WASM RGBA or fewer transfers. |
| 3.2 | PPU snapshot as 12 round-trips             | voxel-wrapper.ts, worker | Single “get PPU snapshot” message with one or two buffers. |

### Medium severity

| ID  | Issue                                      | Location              | Recommendation |
|-----|--------------------------------------------|-----------------------|----------------|
| 1.2 | loadFromVramBank address recomputation     | graphics.ts           | Hoist or cache bank base. |
| 1.4 | Loop index mutation in tile cache          | backgroundWindow.ts   | Use separate source index variable. |
| 1.5 | Full-frame priority map clear              | priority.ts           | Contiguous clear or single-loop clear. |
| 1.6 | maxDivider recomputed per sample           | sound.ts              | Hoist constant to module scope. |
| 2.2 | New typed arrays on every UPDATED          | memory.js             | Throttle or reuse buffers. |
| 2.3 | GET_WASM_MEMORY_SECTION per region         | wasmboy.worker.js     | Batch into a snapshot message. |
| 3.4 | Audio buffer slice + Float32 each update   | update.js, audio.worker.js | Reuse buffers; optional single-pass deinterleave. |
| 3.5 | No direct memory access                    | voxel-wrapper.ts      | Document; add view API if architecture allows. |

### Low severity

| ID  | Issue                                      | Location              | Recommendation |
|-----|--------------------------------------------|-----------------------|----------------|
| 3.3 | Redundant tile data copy in getVramBankState | voxel-wrapper.ts    | Return or reuse existing buffer. |

---

## 5. WebAssembly / Emulator Best Practices Applied

- **Minimize host↔WASM boundary:** Reduce per-pixel and per-sample calls into helpers that do address math or loads; do work in batches and hoist invariants (1.1, 1.2, 1.6).
- **Keep hot loops simple:** Avoid loop-variable mutation and deep branching in innermost loops (1.4, 1.3, 1.7).
- **Prefer contiguous and bulk operations:** Use linear scans and bulk clears instead of 2D index computations where possible (1.5).
- **Reduce copies across workers:** One batched snapshot message instead of many small memory-section requests (2.3, 3.2).
- **Avoid per-frame heavy work on the host:** No full saveState and full memory transfer every frame; only when needed for save state or debug (2.1, 2.2).
- **Reuse buffers:** Graphics and audio pipelines should reuse typed arrays and avoid allocating every frame (3.1, 3.4).

---

*Report generated as part of the WebAssembly performance review plan. No changes were made to the codebase.*
