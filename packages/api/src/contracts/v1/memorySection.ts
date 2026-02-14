import { z } from 'zod';

const u8 = z.number().int().min(0).max(0xff);

export const MemorySectionSchema = z
  .object({
    version: z.literal('v1'),
    start: z.number().int().nonnegative(),
    endExclusive: z.number().int().positive(),
    bytes: z.array(u8),
  })
  .refine((payload) => payload.endExclusive > payload.start, {
    message: 'endExclusive must be greater than start',
    path: ['endExclusive'],
  })
  .refine((payload) => payload.bytes.length === payload.endExclusive - payload.start, {
    message: 'bytes length must match address span',
    path: ['bytes'],
  });

export type MemorySection = z.infer<typeof MemorySectionSchema>;
