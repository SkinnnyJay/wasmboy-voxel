import { describe, expect, it } from 'vitest';
import {
  CONTRACT_VERSION_V1,
  ContractRegistry,
  V1Schemas,
  validateContractPayload,
  validateRegistryPayload,
} from '../src/index.js';

const makeValidRegisters = () => ({
  scx: 1,
  scy: 2,
  wx: 3,
  wy: 4,
  lcdc: 0x91,
  bgp: 0xe4,
  obp0: 0xd2,
  obp1: 0xf1,
});

const makeFilledBytes = (length: number, value: number): number[] =>
  Array.from({ length }, () => value);

describe('contracts v1', () => {
  it('accepts valid PPU snapshot payload', () => {
    const payload = {
      version: 'v1',
      registers: makeValidRegisters(),
      tileData: makeFilledBytes(0x1800, 1),
      bgTileMap: makeFilledBytes(0x400, 2),
      windowTileMap: makeFilledBytes(0x400, 3),
      oamData: makeFilledBytes(0xa0, 4),
    };

    const parsed = V1Schemas.PpuSnapshotSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it('rejects wrong tileData length in snapshot payload', () => {
    const payload = {
      version: 'v1',
      registers: makeValidRegisters(),
      tileData: makeFilledBytes(8, 1),
      bgTileMap: makeFilledBytes(0x400, 2),
      windowTileMap: makeFilledBytes(0x400, 3),
      oamData: makeFilledBytes(0xa0, 4),
    };

    const parsed = V1Schemas.PpuSnapshotSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it('enforces memory section byte-length and address-span alignment', () => {
    const okPayload = {
      version: 'v1',
      start: 0x8000,
      endExclusive: 0x8004,
      bytes: [1, 2, 3, 4],
    };
    const badPayload = {
      version: 'v1',
      start: 0x8000,
      endExclusive: 0x8004,
      bytes: [1, 2],
    };

    expect(V1Schemas.MemorySectionSchema.safeParse(okPayload).success).toBe(true);
    expect(V1Schemas.MemorySectionSchema.safeParse(badPayload).success).toBe(false);
  });

  it('returns success and error envelopes from validateContractPayload', () => {
    const success = validateContractPayload(V1Schemas.RegistersSchema, makeValidRegisters());
    expect(success.success).toBe(true);
    expect(success.errorMessage).toBeNull();

    const failure = validateContractPayload(V1Schemas.RegistersSchema, { scx: -1 });
    expect(failure.success).toBe(false);
    expect(typeof failure.errorMessage).toBe('string');
  });

  it('validates known registry schemas and reports unknown keys', () => {
    const ok = validateRegistryPayload(CONTRACT_VERSION_V1, 'registers', makeValidRegisters());
    expect(ok.success).toBe(true);

    const unknown = validateRegistryPayload(
      CONTRACT_VERSION_V1,
      'missingSchema',
      makeValidRegisters(),
    );
    expect(unknown.success).toBe(false);
    expect(String(unknown.errorMessage)).toMatch(/Unknown contract schema/);

    expect(typeof ContractRegistry.v1.ppuSnapshot.safeParse).toBe('function');
  });
});
