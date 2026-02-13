import { z } from 'zod';
import { RegistersSchema } from './registers.js';

const u8 = z.number().int().min(0).max(0xff);
const TILE_DATA_LEN = 0x1800;
const TILE_MAP_LEN = 0x400;
const OAM_LEN = 0xa0;

export const PpuSnapshotSchema = z.object({
  version: z.literal('v1'),
  registers: RegistersSchema,
  tileData: z.array(u8).length(TILE_DATA_LEN),
  bgTileMap: z.array(u8).length(TILE_MAP_LEN),
  windowTileMap: z.array(u8).length(TILE_MAP_LEN),
  oamData: z.array(u8).length(OAM_LEN),
});

export type PpuSnapshot = z.infer<typeof PpuSnapshotSchema>;
