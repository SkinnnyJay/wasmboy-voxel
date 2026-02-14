# Voxel Wrapper Snapshot Allocation Audit (2026-02-14)

## Scope

Audited snapshot-read paths in:

- `voxel-wrapper.ts`
  - `getPpuSnapshot()`
  - `getPpuSnapshotLayers()`
  - `readGameMemoryByte()`
  - `readMemory()` (for related per-read allocation behavior)

Focus: repeated allocations that occur on frame-by-frame snapshot polling.

## Observed snapshot read paths

### Path A: batched snapshot buffer (preferred when available)

- Uses `_getPpuSnapshotBuffer()` + `_parsePpuSnapshotBuffer()`.
- Allocation shape in wrapper is relatively small (wrapper does not allocate per-register byte reads here).
- Still allocates parsed snapshot objects/arrays returned by parser.

### Path B: fallback section reads (hot path when batched helper is unavailable/fails)

Per `getPpuSnapshot()` call, current implementation performs:

1. One `readGameMemoryByte()` for `LCDC` (for tilemap selection).
2. `Promise.all()` with:
   - 4 large section reads:
     - tile data: `0x1800` bytes
     - bg tilemap: `0x400` bytes
     - window tilemap: `0x400` bytes
     - OAM: `0xA0` bytes
   - 7 additional `readGameMemoryByte()` calls for register fields.
3. Construction of a new snapshot object and nested `registers` object.

## Allocation hotspots identified

### 1) Repeated one-byte `Uint8Array` allocations for register reads

`readGameMemoryByte()` currently calls `_getWasmMemorySection(start, start + 1)` for every register.

In fallback snapshot mode this yields **8 separate 1-byte section allocations per frame**:

- 1 for `LCDC` pre-read
- 7 for register payload (`SCX`, `SCY`, `WX`, `WY`, `BGP`, `OBP0`, `OBP1`)

This is avoidable churn in the frame-hot path.

### 2) Full snapshot allocation even for partial-layer consumers

`getPpuSnapshotLayers()` always calls `getPpuSnapshot()` first, then filters.

Even when caller requests only one layer (or only registers), wrapper still allocates/reads all snapshot sections before slicing result.

### 3) Contract-validation array conversion in memory reads

`readMemory()` validates via:

- `bytes: Array.from(bytes)`

This creates a new JS array copy on each validated memory read. It is outside `getPpuSnapshot()` itself, but still relevant to frequent debug polling/memory panel usage.

## Quantified baseline (fallback snapshot path)

Minimum payload bytes allocated per snapshot frame from large sections:

- `0x1800 + 0x400 + 0x400 + 0xA0 = 0x20A0` bytes = **8,352 bytes/frame** (excluding object/header overhead)

At 60 FPS, that is ~**501 KB/s** of payload bytes before engine-level object/Promise/typed-array overhead.

## Risk assessment

- Current implementation is functionally correct and contract-safe.
- Main risk is **GC pressure** in long-running frame loops when batched path is absent or intermittently failing.
- Risk increases in environments where snapshot polling and memory reads happen concurrently (debugger overlays, AI/debug route sampling).

## Recommended hardening sequence

1. **Coalesce register reads into one block read**
   - Read contiguous register span once, then index bytes locally.
   - Eliminates repeated 1-byte section allocations.
2. **Add selective snapshot-layer read path**
   - Allow `getPpuSnapshotLayers()` to read only requested sections/registers.
   - Avoid full-frame allocation when callers only need subsets.
3. **Introduce low-allocation memory validation mode**
   - Avoid unconditional `Array.from` on hot reads when runtime contract guarantees can be checked without full copying.
4. **Add targeted regression/perf tests for readiness + fallback paths**
   - Track null/retry semantics and allocation-sensitive fallback behavior in automated tests.

## Conclusion

The highest-impact allocation issue is repeated single-byte register section reads in fallback snapshot mode. Addressing this first should reduce avoidable per-frame allocation churn without changing public API behavior.
