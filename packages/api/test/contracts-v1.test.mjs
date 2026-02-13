import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTRACT_VERSION_V1,
  ContractRegistry,
  V1Schemas,
  validateContractPayload,
  validateRegistryPayload,
} from '../dist/index.js';

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

const makeFilledBytes = (length, value) => Array.from({ length }, () => value);

test('PpuSnapshotSchema accepts valid v1 payload', () => {
  const payload = {
    version: 'v1',
    registers: makeValidRegisters(),
    tileData: makeFilledBytes(0x1800, 1),
    bgTileMap: makeFilledBytes(0x400, 2),
    windowTileMap: makeFilledBytes(0x400, 3),
    oamData: makeFilledBytes(0xa0, 4),
  };

  const parsed = V1Schemas.PpuSnapshotSchema.safeParse(payload);
  assert.equal(parsed.success, true);
});

test('PpuSnapshotSchema rejects wrong tileData length', () => {
  const payload = {
    version: 'v1',
    registers: makeValidRegisters(),
    tileData: makeFilledBytes(8, 1),
    bgTileMap: makeFilledBytes(0x400, 2),
    windowTileMap: makeFilledBytes(0x400, 3),
    oamData: makeFilledBytes(0xa0, 4),
  };

  const parsed = V1Schemas.PpuSnapshotSchema.safeParse(payload);
  assert.equal(parsed.success, false);
});

test('MemorySectionSchema enforces byte-length/address-span alignment', () => {
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

  assert.equal(V1Schemas.MemorySectionSchema.safeParse(okPayload).success, true);
  assert.equal(V1Schemas.MemorySectionSchema.safeParse(badPayload).success, false);
});

test('validateContractPayload returns typed success/error envelope', () => {
  const success = validateContractPayload(V1Schemas.RegistersSchema, makeValidRegisters());
  assert.equal(success.success, true);
  assert.equal(success.errorMessage, null);

  const failure = validateContractPayload(V1Schemas.RegistersSchema, { scx: -1 });
  assert.equal(failure.success, false);
  assert.equal(typeof failure.errorMessage, 'string');
});

test('registry lookups validate known schemas and unknown keys', () => {
  const ok = validateRegistryPayload(CONTRACT_VERSION_V1, 'registers', makeValidRegisters());
  assert.equal(ok.success, true);

  const unknown = validateRegistryPayload(
    CONTRACT_VERSION_V1,
    'missingSchema',
    makeValidRegisters(),
  );
  assert.equal(unknown.success, false);
  assert.match(String(unknown.errorMessage), /Unknown contract schema/);

  assert.equal(typeof ContractRegistry.v1.ppuSnapshot.safeParse, 'function');
});
