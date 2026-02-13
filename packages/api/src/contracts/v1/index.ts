import { z } from 'zod';
import { RegistersSchema } from './registers.js';
import { PpuSnapshotSchema } from './ppuSnapshot.js';
import { MemorySectionSchema } from './memorySection.js';
import { DebugFrameSchema } from './debugFrame.js';

export const CONTRACT_VERSION_V1 = 'v1' as const;

export const ContractVersionMetadataSchema = z.object({
  version: z.literal(CONTRACT_VERSION_V1),
  generatedBy: z.string().min(1),
});

export const ContractVersionMetadata = {
  version: CONTRACT_VERSION_V1,
  generatedBy: '@wasmboy/api',
} as const;

export const V1Schemas = {
  RegistersSchema,
  PpuSnapshotSchema,
  MemorySectionSchema,
  DebugFrameSchema,
  ContractVersionMetadataSchema,
} as const;

export type ContractVersionMetadataPayload = z.infer<typeof ContractVersionMetadataSchema>;
export type { Registers } from './registers.js';
export type { PpuSnapshot } from './ppuSnapshot.js';
export type { MemorySection } from './memorySection.js';
export type { DebugFrame, DebugEvent } from './debugFrame.js';
