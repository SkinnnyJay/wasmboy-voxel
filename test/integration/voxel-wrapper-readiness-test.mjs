import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';

const SUPPORT_CHECK_MAX_RETRIES = 5;
const GAME_MEMORY_BASE_CONSTANT = 'DEBUG_GAMEBOY_MEMORY_LOCATION';

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

afterEach(() => {
  WasmBoy._getWasmConstant = originalGetWasmConstant;
  WasmBoy._getWasmMemorySection = originalGetWasmMemorySection;
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
    return 0x1000;
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
