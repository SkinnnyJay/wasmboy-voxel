import { z } from 'zod';

const u8 = z.number().int().min(0).max(0xff);

export const RegistersSchema = z.object({
  scx: u8,
  scy: u8,
  wx: u8,
  wy: u8,
  lcdc: u8,
  bgp: u8,
  obp0: u8,
  obp1: u8,
});

export type Registers = z.infer<typeof RegistersSchema>;
