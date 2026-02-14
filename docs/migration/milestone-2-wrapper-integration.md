# Milestone 2 Wrapper Integration Notes

## Public wrapper entry points (current)

Primary exports from `voxel-wrapper.ts`:
- `WasmBoy` (`WasmBoyVoxelApi`)
- `WasmBoyCompat` (`WasmBoyCompatApi`)

Wrapper APIs covered by contract gates:
- `supportsPpuSnapshot()`
- `getPpuSnapshot()`
- `getRegisters()`
- `getMemorySection(start, endExclusive)`
- `readMemory(start, endExclusive)`
- snapshot event emission via `subscribe("snapshot", handler)`

## Contract gate behavior

- Snapshot payloads are validated for:
  - register byte bounds (`0..255`)
  - expected lengths for tile/map/OAM buffers
- Memory section payloads are validated for:
  - valid range (`endExclusive > start`)
  - byte-length alignment with span
  - byte bounds (`0..255`)
- Register payloads are validated for byte bounds.

Validation is **dev-oriented** and can be toggled:
- `setContractValidationEnabled(boolean)`
- `getContractValidationEnabled()`

Default state:
- enabled when `NODE_ENV !== "production"`

Failure behavior:
- Emits an error via snapshot error subscribers.
- Returns `null` for guarded read APIs when validation fails.

## Compatibility wrapper

`WasmBoyCompat` is provided as a compatibility surface that preserves legacy
`readMemory` semantics while exposing `getMemorySection`.
