import { z } from 'zod';
import { RegistersSchema } from './registers.js';

const sha256Hex = z.string().regex(/^[a-f0-9]{64}$/i, 'must be a 64-char hex SHA-256');

export const DebugEventSchema = z.object({
  type: z.string().min(1),
  payload: z.unknown(),
});

export const DebugFrameSchema = z.object({
  version: z.literal('v1'),
  frameId: z.number().int().nonnegative(),
  timestampMs: z.number().nonnegative(),
  fps: z.number().nonnegative(),
  registers: RegistersSchema,
  checksums: z.object({
    tileDataSha256: sha256Hex,
    bgTileMapSha256: sha256Hex,
    windowTileMapSha256: sha256Hex,
    oamDataSha256: sha256Hex,
  }),
  events: z.array(DebugEventSchema).default([]),
});

export type DebugEvent = z.infer<typeof DebugEventSchema>;
export type DebugFrame = z.infer<typeof DebugFrameSchema>;
