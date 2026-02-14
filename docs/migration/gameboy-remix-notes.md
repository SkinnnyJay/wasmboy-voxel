# gameboy-remix Migration Notes

These notes document compatibility expectations for the parent `gameboy-remix`
consumer while the WasmBoy-Voxel migration lands.

## Stable assumptions to keep

- `supportsPpuSnapshot()` is the gate before reading snapshots.
- Snapshot reads may return `null` while workers initialize.
- Existing consumers that call `readMemory()` continue to work.
- Contract validation is dev-oriented and can be disabled.

## New capabilities now available

- `getRegisters()` for direct register payload reads.
- `getMemorySection(start, endExclusive)` as the preferred memory helper.
- `WasmBoyCompat` export for legacy integration paths.
- Typed runtime validation via `@wasmboy/api`.

## Parent-project integration checklist

1. Keep `supportsPpuSnapshot()` + `null` fallback handling in render loop.
2. Prefer `getMemorySection()` for new memory reads.
3. Use `@wasmboy/api` validation in debug tooling boundaries.
4. Watch dev logs for deprecation warnings and migrate off `readMemory()`.
