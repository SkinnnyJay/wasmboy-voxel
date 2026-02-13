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

## Version metadata

```ts
import { CONTRACT_VERSION_V1, ContractVersionMetadata } from '@wasmboy/api';
```
