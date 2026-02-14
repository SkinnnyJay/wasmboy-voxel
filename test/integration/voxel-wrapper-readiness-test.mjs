import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';

const SUPPORT_CHECK_MAX_RETRIES = 5;
const GAME_MEMORY_BASE_CONSTANT = 'DEBUG_GAMEBOY_MEMORY_LOCATION';
const GAME_MEMORY_BASE = 0x1000;
const TILE_DATA_START = 0x8000;
const TILE_DATA_END_EXCLUSIVE = 0x9800;
const BG_TILEMAP_0_START = 0x9800;
const BG_TILEMAP_1_START = 0x9c00;
const TILEMAP_SIZE = 0x400;
const REG_LCDC = 0xff40;
const REG_SCY = 0xff42;
const REG_SCX = 0xff43;
const REG_BGP = 0xff47;
const REG_OBP0 = 0xff48;
const REG_OBP1 = 0xff49;
const REG_WY = 0xff4a;
const REG_WX = 0xff4b;
const REGISTER_BLOCK_END_EXCLUSIVE = REG_WX + 1;
const LCDC_BG_TILEMAP_SELECT_BIT = 0x08;

const IDB_GLOBAL_NAMES = [
  'IDBIndex',
  'IDBCursor',
  'IDBObjectStore',
  'IDBTransaction',
  'IDBDatabase',
  'IDBRequest',
  'IDBOpenDBRequest',
  'IDBFactory',
  'IDBKeyRange',
  'IDBVersionChangeEvent',
];

for (const name of IDB_GLOBAL_NAMES) {
  if (!(name in globalThis)) {
    globalThis[name] = class {};
  }
}

if (!('indexedDB' in globalThis)) {
  globalThis.indexedDB = {
    open() {
      return {};
    },
    deleteDatabase() {
      return {};
    },
  };
}

const { WasmBoy } = await import('../../voxel-wrapper.ts');

const originalGetWasmConstant = WasmBoy._getWasmConstant;
const originalGetWasmMemorySection = WasmBoy._getWasmMemorySection;
const originalGetWasmMemoryBuffer = WasmBoy._getWasmMemoryBuffer;
const originalGetWasmMemoryView = WasmBoy._getWasmMemoryView;
const originalGetPpuSnapshotBuffer = WasmBoy._getPpuSnapshotBuffer;
const originalParsePpuSnapshotBuffer = WasmBoy._parsePpuSnapshotBuffer;

afterEach(() => {
  WasmBoy._getWasmConstant = originalGetWasmConstant;
  WasmBoy._getWasmMemorySection = originalGetWasmMemorySection;
  WasmBoy._getWasmMemoryBuffer = originalGetWasmMemoryBuffer;
  WasmBoy._getWasmMemoryView = originalGetWasmMemoryView;
  WasmBoy._getPpuSnapshotBuffer = originalGetPpuSnapshotBuffer;
  WasmBoy._parsePpuSnapshotBuffer = originalParsePpuSnapshotBuffer;
  WasmBoy.clearPpuSnapshotCache();
});

test('supportsPpuSnapshot retries until _getWasmConstant becomes available', async () => {
  let calls = 0;
  WasmBoy.clearPpuSnapshotCache();

  WasmBoy._getWasmConstant = async name => {
    assert.equal(name, GAME_MEMORY_BASE_CONSTANT);
    calls += 1;
    if (calls < 3) {
      throw new Error('worker-not-ready');
    }
    return GAME_MEMORY_BASE;
  };

  const supported = await WasmBoy.supportsPpuSnapshot();
  assert.equal(supported, true);
  assert.equal(calls, 3);
});

test('getPpuSnapshot returns null when worker readiness retries are exhausted', async () => {
  let constantCalls = 0;
  let memoryReads = 0;
  WasmBoy.clearPpuSnapshotCache();

  WasmBoy._getWasmConstant = async () => {
    constantCalls += 1;
    throw new Error('worker-not-ready');
  };
  WasmBoy._getWasmMemorySection = async () => {
    memoryReads += 1;
    return new Uint8Array(0);
  };

  const snapshot = await WasmBoy.getPpuSnapshot();
  assert.equal(snapshot, null);
  assert.equal(constantCalls, SUPPORT_CHECK_MAX_RETRIES);
  assert.equal(memoryReads, 0);
});

test('getPpuSnapshot falls back to cached base when _getWasmConstant later fails', async () => {
  let constantCalls = 0;
  let memoryReads = 0;
  WasmBoy.clearPpuSnapshotCache();

  WasmBoy._getWasmConstant = async () => {
    constantCalls += 1;
    if (constantCalls === 1) {
      return 0x2000;
    }
    throw new Error('constant-unavailable');
  };
  WasmBoy._getPpuSnapshotBuffer = undefined;
  WasmBoy._parsePpuSnapshotBuffer = undefined;
  WasmBoy._getWasmMemorySection = async (start, endExclusive) => {
    memoryReads += 1;
    const length = endExclusive - start;
    if (length === 1) {
      return new Uint8Array([0]);
    }
    return new Uint8Array(length).fill(1);
  };

  const supported = await WasmBoy.supportsPpuSnapshot();
  assert.equal(supported, true);

  const snapshot = await WasmBoy.getPpuSnapshot();
  assert.notEqual(snapshot, null);
  assert.equal(snapshot.tileData.length, 0x1800);
  assert.equal(snapshot.bgTileMap.length, 0x400);
  assert.equal(snapshot.windowTileMap.length, 0x400);
  assert.equal(snapshot.oamData.length, 0xa0);
  assert.ok(memoryReads > 0);
  assert.equal(constantCalls, 1, 'cached memory base should avoid additional constant lookups');
});

test('clearPpuSnapshotCache forces null fallback when _getWasmConstant is unavailable', async () => {
  let constantCalls = 0;
  WasmBoy.clearPpuSnapshotCache();

  WasmBoy._getWasmConstant = async () => {
    constantCalls += 1;
    if (constantCalls === 1) {
      return 0x3000;
    }
    throw new Error('constant-unavailable');
  };
  WasmBoy._getWasmMemorySection = async (start, endExclusive) => {
    const length = endExclusive - start;
    if (length === 1) {
      return new Uint8Array([0]);
    }
    return new Uint8Array(length);
  };
  WasmBoy._getPpuSnapshotBuffer = undefined;
  WasmBoy._parsePpuSnapshotBuffer = undefined;

  const supported = await WasmBoy.supportsPpuSnapshot();
  assert.equal(supported, true);

  WasmBoy.clearPpuSnapshotCache();
  const snapshot = await WasmBoy.getPpuSnapshot();
  assert.equal(snapshot, null);
  assert.equal(constantCalls, 1 + SUPPORT_CHECK_MAX_RETRIES);
});

test('supportsPpuSnapshot returns false when core internals are unavailable', async () => {
  WasmBoy.clearPpuSnapshotCache();
  WasmBoy._getWasmConstant = undefined;
  WasmBoy._getWasmMemorySection = async () => new Uint8Array(0);

  const supported = await WasmBoy.supportsPpuSnapshot();
  assert.equal(supported, false);
});

test('getPpuSnapshot returns null when core lacks memory-section internals', async () => {
  WasmBoy.clearPpuSnapshotCache();
  WasmBoy._getWasmConstant = async () => 0x1000;
  WasmBoy._getWasmMemorySection = undefined;

  const snapshot = await WasmBoy.getPpuSnapshot();
  assert.equal(snapshot, null);
});

test('getDirectMemoryAccess reports unavailable when no sync memory hooks are present', () => {
  WasmBoy._getWasmMemoryBuffer = undefined;
  WasmBoy._getWasmMemoryView = undefined;

  const directMemory = WasmBoy.getDirectMemoryAccess();
  assert.equal(directMemory.available, false);
  assert.equal(directMemory.getView(0, 1), null);
});

test('getDirectMemoryAccess exposes view reads from sync memory buffers', () => {
  const buffer = new Uint8Array([5, 6, 7, 8, 9]).buffer;
  WasmBoy._getWasmMemoryView = undefined;
  WasmBoy._getWasmMemoryBuffer = () => buffer;

  const directMemory = WasmBoy.getDirectMemoryAccess();
  assert.equal(directMemory.available, true);
  assert.deepEqual(Array.from(directMemory.getView(1, 3) ?? []), [6, 7, 8]);
  assert.equal(directMemory.getView(-1, 1), null);
  assert.equal(directMemory.getView(3, 3), null);
});

test('getDirectMemoryAccess prefers explicit sync memory view provider when available', () => {
  const calls = [];
  WasmBoy._getWasmMemoryBuffer = () => new ArrayBuffer(16);
  WasmBoy._getWasmMemoryView = (offset, length) => {
    calls.push([offset, length]);
    return new Uint8Array([1, 2, 3]);
  };

  const directMemory = WasmBoy.getDirectMemoryAccess();
  assert.equal(directMemory.available, true);
  assert.deepEqual(Array.from(directMemory.getView(4, 3) ?? []), [1, 2, 3]);
  assert.deepEqual(calls, [[4, 3]]);
});

test('getPpuSnapshotLayers reads only tile data when only tileData layer is requested', async () => {
  const memoryReads = [];
  WasmBoy.clearPpuSnapshotCache();
  WasmBoy._getWasmConstant = async () => GAME_MEMORY_BASE;
  WasmBoy._getPpuSnapshotBuffer = undefined;
  WasmBoy._parsePpuSnapshotBuffer = undefined;
  WasmBoy._getWasmMemorySection = async (start, endExclusive) => {
    memoryReads.push([start, endExclusive]);
    return new Uint8Array(endExclusive - start).fill(3);
  };

  const snapshot = await WasmBoy.getPpuSnapshotLayers({ layers: ['tileData'] });
  assert.notEqual(snapshot, null);
  assert.equal(snapshot.tileData?.length, TILE_DATA_END_EXCLUSIVE - TILE_DATA_START);
  assert.equal(snapshot.bgTileMap, undefined);
  assert.equal(snapshot.windowTileMap, undefined);
  assert.equal(snapshot.oamData, undefined);
  assert.equal(snapshot.registers, undefined);
  assert.deepEqual(memoryReads, [[GAME_MEMORY_BASE + TILE_DATA_START, GAME_MEMORY_BASE + TILE_DATA_END_EXCLUSIVE]]);
});

test('getPpuSnapshotLayers reads register block and selected tilemap for bgTileMap requests', async () => {
  const memoryReads = [];
  WasmBoy.clearPpuSnapshotCache();
  WasmBoy._getWasmConstant = async () => GAME_MEMORY_BASE;
  WasmBoy._getPpuSnapshotBuffer = undefined;
  WasmBoy._parsePpuSnapshotBuffer = undefined;
  WasmBoy._getWasmMemorySection = async (start, endExclusive) => {
    memoryReads.push([start, endExclusive]);
    if (start === GAME_MEMORY_BASE + REG_LCDC && endExclusive === GAME_MEMORY_BASE + REGISTER_BLOCK_END_EXCLUSIVE) {
      const registerBlock = new Uint8Array(REGISTER_BLOCK_END_EXCLUSIVE - REG_LCDC);
      registerBlock[0] = LCDC_BG_TILEMAP_SELECT_BIT;
      return registerBlock;
    }
    if (start === GAME_MEMORY_BASE + BG_TILEMAP_1_START && endExclusive === GAME_MEMORY_BASE + BG_TILEMAP_1_START + TILEMAP_SIZE) {
      return new Uint8Array(TILEMAP_SIZE).fill(9);
    }
    throw new Error(`unexpected read: ${String(start)}-${String(endExclusive)}`);
  };

  const snapshot = await WasmBoy.getPpuSnapshotLayers({ layers: ['bgTileMap'] });
  assert.notEqual(snapshot, null);
  assert.equal(snapshot.bgTileMap?.length, TILEMAP_SIZE);
  assert.equal(snapshot.registers, undefined);
  assert.deepEqual(memoryReads, [
    [GAME_MEMORY_BASE + REG_LCDC, GAME_MEMORY_BASE + REGISTER_BLOCK_END_EXCLUSIVE],
    [GAME_MEMORY_BASE + BG_TILEMAP_1_START, GAME_MEMORY_BASE + BG_TILEMAP_1_START + TILEMAP_SIZE],
  ]);
});

test('getPpuSnapshotLayers reads one register block for registers-only requests', async () => {
  const memoryReads = [];
  WasmBoy.clearPpuSnapshotCache();
  WasmBoy._getWasmConstant = async () => GAME_MEMORY_BASE;
  WasmBoy._getPpuSnapshotBuffer = undefined;
  WasmBoy._parsePpuSnapshotBuffer = undefined;
  WasmBoy._getWasmMemorySection = async (start, endExclusive) => {
    memoryReads.push([start, endExclusive]);
    if (start === GAME_MEMORY_BASE + REG_LCDC && endExclusive === GAME_MEMORY_BASE + REGISTER_BLOCK_END_EXCLUSIVE) {
      const registerBlock = new Uint8Array(REGISTER_BLOCK_END_EXCLUSIVE - REG_LCDC);
      registerBlock[REG_SCX - REG_LCDC] = 11;
      registerBlock[REG_SCY - REG_LCDC] = 22;
      registerBlock[REG_WX - REG_LCDC] = 33;
      registerBlock[REG_WY - REG_LCDC] = 44;
      registerBlock[REG_LCDC - REG_LCDC] = 55;
      registerBlock[REG_BGP - REG_LCDC] = 66;
      registerBlock[REG_OBP0 - REG_LCDC] = 77;
      registerBlock[REG_OBP1 - REG_LCDC] = 88;
      return registerBlock;
    }
    throw new Error(`unexpected read: ${String(start)}-${String(endExclusive)}`);
  };

  const snapshot = await WasmBoy.getPpuSnapshotLayers({ layers: ['registers'] });
  assert.notEqual(snapshot, null);
  assert.deepEqual(snapshot.registers, {
    scx: 11,
    scy: 22,
    wx: 33,
    wy: 44,
    lcdc: 55,
    bgp: 66,
    obp0: 77,
    obp1: 88,
  });
  assert.deepEqual(memoryReads, [[GAME_MEMORY_BASE + REG_LCDC, GAME_MEMORY_BASE + REGISTER_BLOCK_END_EXCLUSIVE]]);
});

test('getPpuSnapshot returns null when a partial section read fails', async () => {
  let sectionReads = 0;
  WasmBoy.clearPpuSnapshotCache();
  WasmBoy._getWasmConstant = async () => 0x1000;
  WasmBoy._getPpuSnapshotBuffer = undefined;
  WasmBoy._parsePpuSnapshotBuffer = undefined;
  WasmBoy._getWasmMemorySection = async (start, endExclusive) => {
    sectionReads += 1;
    const length = endExclusive - start;
    if (sectionReads === 3) {
      throw new Error('partial-read-failure');
    }
    if (length === 1) {
      return new Uint8Array([0]);
    }
    return new Uint8Array(length).fill(1);
  };

  const snapshot = await WasmBoy.getPpuSnapshot();
  assert.equal(snapshot, null);
});
