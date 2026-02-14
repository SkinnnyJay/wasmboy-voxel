import { describe, expect, it } from 'vitest';
import {
  CONTRACT_VERSION_V1,
  ContractRegistry,
  Registers,
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

const REGISTER_KEYS: (keyof Registers)[] = [
  'scx',
  'scy',
  'wx',
  'wy',
  'lcdc',
  'bgp',
  'obp0',
  'obp1',
];
const NON_FINITE_NUMBERS = [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
const VALIDATE_BATCH_ITERATIONS = 2000;
const VALIDATE_THROUGHPUT_BUDGET_MS = 2500;

const makeValidDebugFrame = () => ({
  version: 'v1',
  frameId: 1,
  timestampMs: 16.67,
  fps: 60,
  registers: makeValidRegisters(),
  checksums: {
    tileDataSha256: 'a'.repeat(64),
    bgTileMapSha256: 'b'.repeat(64),
    windowTileMapSha256: 'c'.repeat(64),
    oamDataSha256: 'd'.repeat(64),
  },
  events: [],
});

const makeValidPpuSnapshot = () => ({
  version: 'v1',
  registers: makeValidRegisters(),
  tileData: makeFilledBytes(0x1800, 1),
  bgTileMap: makeFilledBytes(0x400, 2),
  windowTileMap: makeFilledBytes(0x400, 3),
  oamData: makeFilledBytes(0xa0, 4),
});

describe('contracts v1', () => {
  it('accepts valid PPU snapshot payload', () => {
    const payload = makeValidPpuSnapshot();

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

  it('keeps snapshot schema fields required (no optional drift)', () => {
    const validPayload = makeValidPpuSnapshot();

    const snapshotShape = V1Schemas.PpuSnapshotSchema.shape;
    for (const fieldSchema of Object.values(snapshotShape)) {
      expect(fieldSchema.isOptional()).toBe(false);
    }

    for (const key of Object.keys(validPayload)) {
      const payloadMissingOneField = { ...validPayload };
      delete payloadMissingOneField[key as keyof typeof payloadMissingOneField];
      expect(V1Schemas.PpuSnapshotSchema.safeParse(payloadMissingOneField).success).toBe(false);
    }
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

  it('enforces register u8 bounds for all register fields', () => {
    for (const registerKey of REGISTER_KEYS) {
      const belowRangePayload = { ...makeValidRegisters(), [registerKey]: -1 };
      const aboveRangePayload = { ...makeValidRegisters(), [registerKey]: 0x100 };

      expect(V1Schemas.RegistersSchema.safeParse(belowRangePayload).success).toBe(false);
      expect(V1Schemas.RegistersSchema.safeParse(aboveRangePayload).success).toBe(false);
    }
  });

  it('rejects coercible register field payloads (string/boolean) instead of coercing', () => {
    for (const registerKey of REGISTER_KEYS) {
      const stringPayload = { ...makeValidRegisters(), [registerKey]: '12' };
      const booleanPayload = { ...makeValidRegisters(), [registerKey]: true };

      expect(V1Schemas.RegistersSchema.safeParse(stringPayload).success).toBe(false);
      expect(V1Schemas.RegistersSchema.safeParse(booleanPayload).success).toBe(false);
    }
  });

  it('rejects non-object payloads across all v1 contract entrypoints', () => {
    const nonObjectPayloads: unknown[] = [undefined, null, 42, 'invalid-payload', true, 42n];
    const contractCases = [
      { contractName: 'registers', schema: V1Schemas.RegistersSchema },
      { contractName: 'ppuSnapshot', schema: V1Schemas.PpuSnapshotSchema },
      { contractName: 'memorySection', schema: V1Schemas.MemorySectionSchema },
      { contractName: 'debugFrame', schema: V1Schemas.DebugFrameSchema },
      { contractName: 'metadata', schema: V1Schemas.ContractVersionMetadataSchema },
    ] as const;

    for (const nonObjectPayload of nonObjectPayloads) {
      for (const contractCase of contractCases) {
        const registryResult = validateRegistryPayload(
          CONTRACT_VERSION_V1,
          contractCase.contractName,
          nonObjectPayload,
        );
        expect(registryResult.success).toBe(false);
        expect(registryResult.data).toBeNull();
        expect(typeof registryResult.errorMessage).toBe('string');

        const directResult = validateContractPayload(contractCase.schema, nonObjectPayload);
        expect(directResult.success).toBe(false);
        expect(directResult.data).toBeNull();
        expect(typeof directResult.errorMessage).toBe('string');
      }
    }
  });

  it('rejects bigint payload fields where numeric values are required', () => {
    expect(V1Schemas.RegistersSchema.safeParse({ ...makeValidRegisters(), scx: 1n }).success).toBe(
      false,
    );
    expect(
      V1Schemas.PpuSnapshotSchema.safeParse({ ...makeValidPpuSnapshot(), tileData: [1n] }).success,
    ).toBe(false);
    expect(
      V1Schemas.MemorySectionSchema.safeParse({
        version: 'v1',
        start: 0n,
        endExclusive: 4,
        bytes: [1, 2, 3, 4],
      }).success,
    ).toBe(false);
    expect(
      V1Schemas.DebugFrameSchema.safeParse({ ...makeValidDebugFrame(), frameId: 1n }).success,
    ).toBe(false);
  });

  it('rejects NaN and Infinity across numeric contract fields', () => {
    for (const nonFiniteNumber of NON_FINITE_NUMBERS) {
      for (const registerKey of REGISTER_KEYS) {
        expect(
          V1Schemas.RegistersSchema.safeParse({
            ...makeValidRegisters(),
            [registerKey]: nonFiniteNumber,
          }).success,
        ).toBe(false);
      }

      const snapshotWithInvalidTileData = makeValidPpuSnapshot();
      snapshotWithInvalidTileData.tileData[0] = nonFiniteNumber;
      expect(V1Schemas.PpuSnapshotSchema.safeParse(snapshotWithInvalidTileData).success).toBe(
        false,
      );

      const snapshotWithInvalidBgTileMap = makeValidPpuSnapshot();
      snapshotWithInvalidBgTileMap.bgTileMap[0] = nonFiniteNumber;
      expect(V1Schemas.PpuSnapshotSchema.safeParse(snapshotWithInvalidBgTileMap).success).toBe(
        false,
      );

      const snapshotWithInvalidWindowTileMap = makeValidPpuSnapshot();
      snapshotWithInvalidWindowTileMap.windowTileMap[0] = nonFiniteNumber;
      expect(V1Schemas.PpuSnapshotSchema.safeParse(snapshotWithInvalidWindowTileMap).success).toBe(
        false,
      );

      const snapshotWithInvalidOamData = makeValidPpuSnapshot();
      snapshotWithInvalidOamData.oamData[0] = nonFiniteNumber;
      expect(V1Schemas.PpuSnapshotSchema.safeParse(snapshotWithInvalidOamData).success).toBe(false);

      expect(
        V1Schemas.MemorySectionSchema.safeParse({
          version: 'v1',
          start: nonFiniteNumber,
          endExclusive: 4,
          bytes: [1, 2, 3, 4],
        }).success,
      ).toBe(false);
      expect(
        V1Schemas.MemorySectionSchema.safeParse({
          version: 'v1',
          start: 0,
          endExclusive: nonFiniteNumber,
          bytes: [1, 2, 3, 4],
        }).success,
      ).toBe(false);
      expect(
        V1Schemas.MemorySectionSchema.safeParse({
          version: 'v1',
          start: 0,
          endExclusive: 4,
          bytes: [nonFiniteNumber, 2, 3, 4],
        }).success,
      ).toBe(false);

      expect(
        V1Schemas.DebugFrameSchema.safeParse({
          ...makeValidDebugFrame(),
          frameId: nonFiniteNumber,
        }).success,
      ).toBe(false);
      expect(
        V1Schemas.DebugFrameSchema.safeParse({
          ...makeValidDebugFrame(),
          timestampMs: nonFiniteNumber,
        }).success,
      ).toBe(false);
      expect(
        V1Schemas.DebugFrameSchema.safeParse({
          ...makeValidDebugFrame(),
          fps: nonFiniteNumber,
        }).success,
      ).toBe(false);
    }
  });

  it('preserves debug frame payload validity across JSON serialization roundtrip', () => {
    const payload = {
      ...makeValidDebugFrame(),
      events: [
        {
          type: 'frame-start',
          payload: {
            line: 144,
            mode: 'vblank',
            flags: [true, false],
            metrics: {
              cycle: 70224,
            },
          },
        },
        {
          type: 'apu',
          payload: {
            channel: 1,
            envelope: {
              volume: 7,
            },
          },
        },
      ],
    };

    const serializedPayload = JSON.stringify(payload);
    const parsedPayload = JSON.parse(serializedPayload);

    const directResult = validateContractPayload(V1Schemas.DebugFrameSchema, parsedPayload);
    expect(directResult.success).toBe(true);
    expect(directResult.errorMessage).toBeNull();
    expect(directResult.data).toEqual(payload);

    const registryResult = validateRegistryPayload(
      CONTRACT_VERSION_V1,
      'debugFrame',
      parsedPayload,
    );
    expect(registryResult.success).toBe(true);
    expect(registryResult.errorMessage).toBeNull();
    expect(registryResult.data).toEqual(payload);
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
    expect(
      validateRegistryPayload(CONTRACT_VERSION_V1, 'debugFrame', makeValidDebugFrame()).success,
    ).toBe(true);
  });

  it('keeps validate() throughput within smoke budget for batched payloads', () => {
    const directValidationBatch = [
      { schema: V1Schemas.RegistersSchema, payload: makeValidRegisters() },
      {
        schema: V1Schemas.MemorySectionSchema,
        payload: {
          version: 'v1',
          start: 0x8000,
          endExclusive: 0x8004,
          bytes: [1, 2, 3, 4],
        },
      },
      { schema: V1Schemas.DebugFrameSchema, payload: makeValidDebugFrame() },
      {
        schema: V1Schemas.ContractVersionMetadataSchema,
        payload: {
          version: 'v1',
          generatedBy: '@wasmboy/api',
        },
      },
    ] as const;

    const registryValidationBatch = [
      { contractName: 'registers', payload: makeValidRegisters() },
      {
        contractName: 'memorySection',
        payload: {
          version: 'v1',
          start: 0x8000,
          endExclusive: 0x8004,
          bytes: [1, 2, 3, 4],
        },
      },
      { contractName: 'debugFrame', payload: makeValidDebugFrame() },
      {
        contractName: 'metadata',
        payload: {
          version: 'v1',
          generatedBy: '@wasmboy/api',
        },
      },
    ] as const;

    const startTime = process.hrtime.bigint();

    for (let index = 0; index < VALIDATE_BATCH_ITERATIONS; index += 1) {
      for (const validationCase of directValidationBatch) {
        const result = validateContractPayload(validationCase.schema, validationCase.payload);
        if (!result.success) {
          throw new Error(`direct validation failed during throughput smoke run: ${index}`);
        }
      }
      for (const validationCase of registryValidationBatch) {
        const result = validateRegistryPayload(
          CONTRACT_VERSION_V1,
          validationCase.contractName,
          validationCase.payload,
        );
        if (!result.success) {
          throw new Error(`registry validation failed during throughput smoke run: ${index}`);
        }
      }
    }

    const elapsedMilliseconds = Number(process.hrtime.bigint() - startTime) / 1_000_000;
    expect(elapsedMilliseconds).toBeLessThan(VALIDATE_THROUGHPUT_BUDGET_MS);
  });
});
