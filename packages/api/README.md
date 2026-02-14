# @wasmboy/api

Zod-based runtime contracts for WasmBoy-Voxel migration work.

## Contracts (v1)

- `RegistersSchema`
- `PpuSnapshotSchema`
- `MemorySectionSchema`
- `DebugFrameSchema`

## Usage

```ts
import { V1Schemas, validateContractPayload } from '@wasmboy/api';

const result = validateContractPayload(V1Schemas.PpuSnapshotSchema, payload);
if (!result.success) {
  throw new Error(result.errorMessage ?? 'Invalid PPU snapshot payload');
}
```

## Invalid payload error handling

Use the `errorMessage` field from the validation envelope when schema validation fails:

```ts
import { V1Schemas, validateContractPayload } from '@wasmboy/api';

const invalidRegisters = {
  scx: 512, // out of u8 range
  scy: 0,
  wx: 0,
  wy: 0,
  lcdc: 0x91,
  bgp: 0xe4,
  obp0: 0xd2,
  obp1: 0xf1,
};

const result = validateContractPayload(V1Schemas.RegistersSchema, invalidRegisters);
if (!result.success) {
  // Example output: 'scx: Number must be less than or equal to 255'
  console.error(result.errorMessage);
}
```

For registry-based validation, unknown contract names and invalid payloads both return
`success: false` with a human-readable `errorMessage`:

```ts
import { CONTRACT_VERSION_V1, validateRegistryPayload } from '@wasmboy/api';

const result = validateRegistryPayload(CONTRACT_VERSION_V1, 'debugFrame', {
  version: 'v1',
  frameId: -1, // invalid: must be non-negative
});

if (!result.success) {
  console.error(`Contract validation failed: ${result.errorMessage}`);
}
```

## Version metadata

```ts
import { CONTRACT_VERSION_V1, ContractVersionMetadata } from '@wasmboy/api';
```
