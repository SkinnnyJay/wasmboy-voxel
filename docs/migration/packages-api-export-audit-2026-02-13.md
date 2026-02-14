# `packages/api` public export audit (2026-02-13)

## Audit scope

Reviewed:

- `packages/api/package.json` export map
- `packages/api/src/index.ts` public entrypoint
- `packages/api/src/contracts/v1/index.ts`
- `packages/api/src/registry.ts`
- `packages/api/src/validate.ts`

## Export map findings

`package.json` exposes a **single root entrypoint**:

- `@wasmboy/api` (`.` export)
  - ESM: `dist/index.js`
  - CJS: `dist/index.cjs`
  - Types: `dist/index.d.ts`

No subpath exports are currently published, which narrows accidental surface-area growth.

## Current public API surface

Runtime exports from `src/index.ts`:

- `CONTRACT_VERSION_V1`
- `ContractVersionMetadata`
- `ContractVersionMetadataSchema`
- `V1Schemas`
- `ContractRegistry`
- `validateContractPayload`
- `validateRegistryPayload`

Type exports from `src/index.ts`:

- `ContractVersionMetadata`
- `DebugEvent`
- `DebugFrame`
- `MemorySection`
- `PpuSnapshot`
- `Registers`
- `ContractVersion`
- `ValidationResult`

## Backward-compatibility assessment

### Stable-by-contract candidates

The following symbols are consumed by downstream callers and should be treated as semver-sensitive:

- all runtime exports listed above
- shape of `ValidationResult`
- contract keys under `ContractRegistry.v1` (`registers`, `ppuSnapshot`, `memorySection`, `debugFrame`, `metadata`)

### Risk observations

- There is no dedicated export-surface snapshot test yet, so accidental export additions/removals could pass unnoticed.
- `V1Schemas` is exported as a grouped object; key renames/removals inside this object are API-breaking for direct consumers.

## Recommended guarantees

1. Keep root export map (`"."`) stable unless shipping a coordinated major version change.
2. Treat runtime symbol removals/renames in `src/index.ts` as breaking changes.
3. Treat `ContractRegistry.v1` key renames/removals as breaking changes.
4. Introduce an automated export-surface snapshot/assertion test in a follow-up increment if stronger guardrails are desired.

## Conclusion

Current API export surface is compact and controlled (single root export). Backward compatibility risk is moderate and mostly tied to accidental entrypoint symbol churn, which can be further reduced with follow-up export snapshot coverage.
