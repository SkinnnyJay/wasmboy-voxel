import type { ZodTypeAny } from 'zod';
import { CONTRACT_VERSION_V1, V1Schemas } from './contracts/v1/index.js';

export type ContractVersion = typeof CONTRACT_VERSION_V1;

export const ContractRegistry: Record<ContractVersion, Record<string, ZodTypeAny>> = {
  [CONTRACT_VERSION_V1]: {
    registers: V1Schemas.RegistersSchema,
    ppuSnapshot: V1Schemas.PpuSnapshotSchema,
    memorySection: V1Schemas.MemorySectionSchema,
    debugFrame: V1Schemas.DebugFrameSchema,
    metadata: V1Schemas.ContractVersionMetadataSchema,
  },
};
