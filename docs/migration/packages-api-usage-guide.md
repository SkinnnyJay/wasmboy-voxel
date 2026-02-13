# `@wasmboy/api` Usage Guide

## Install / workspace use

The migration keeps `@wasmboy/api` as a workspace package (and publishable
package) providing runtime-validated schemas and inferred TypeScript types.

## Core imports

```ts
import {
  CONTRACT_VERSION_V1,
  V1Schemas,
  validateContractPayload,
  validateRegistryPayload,
} from '@wasmboy/api';
```

## Common patterns

### Validate one known schema

```ts
const result = validateContractPayload(V1Schemas.PpuSnapshotSchema, payload);
if (!result.success) {
  throw new Error(result.errorMessage ?? 'invalid payload');
}
```

### Validate by contract registry name

```ts
const result = validateRegistryPayload(CONTRACT_VERSION_V1, 'registers', payload);
```

## Contract set (v1)

- `registers`
- `ppuSnapshot`
- `memorySection`
- `debugFrame`
- `versionMetadata`
