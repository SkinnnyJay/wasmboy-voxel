import assert from 'node:assert/strict';
import test from 'node:test';
import { createNutjsMemoryGuard } from './nutjs-memory-guard.mjs';

test('createNutjsMemoryGuard tracks snapshot counts and bytes', () => {
  const memoryGuard = createNutjsMemoryGuard({
    maxTrackedBuffers: 4,
    maxTrackedBytes: 2048,
  });

  memoryGuard.trackSnapshot(new Uint8Array(256), 'first');
  memoryGuard.trackSnapshot(new Uint8Array(512), 'second');
  assert.deepEqual(memoryGuard.getState(), {
    maxTrackedBuffers: 4,
    maxTrackedBytes: 2048,
    trackedBuffers: 2,
    trackedBytes: 768,
    evictedBuffers: 0,
    evictedBytes: 0,
  });
});

test('createNutjsMemoryGuard evicts oldest snapshots on buffer count overflow', () => {
  const memoryGuard = createNutjsMemoryGuard({
    maxTrackedBuffers: 2,
    maxTrackedBytes: 4096,
  });

  memoryGuard.trackSnapshot(new Uint8Array(100), 'first');
  memoryGuard.trackSnapshot(new Uint8Array(100), 'second');
  memoryGuard.trackSnapshot(new Uint8Array(100), 'third');
  assert.deepEqual(memoryGuard.getState(), {
    maxTrackedBuffers: 2,
    maxTrackedBytes: 4096,
    trackedBuffers: 2,
    trackedBytes: 200,
    evictedBuffers: 1,
    evictedBytes: 100,
  });
});

test('createNutjsMemoryGuard evicts snapshots on byte limit overflow', () => {
  const memoryGuard = createNutjsMemoryGuard({
    maxTrackedBuffers: 10,
    maxTrackedBytes: 300,
  });

  memoryGuard.trackSnapshot(new Uint8Array(120), 'first');
  memoryGuard.trackSnapshot(new Uint8Array(140), 'second');
  memoryGuard.trackSnapshot(new Uint8Array(160), 'third');
  assert.deepEqual(memoryGuard.getState(), {
    maxTrackedBuffers: 10,
    maxTrackedBytes: 300,
    trackedBuffers: 2,
    trackedBytes: 300,
    evictedBuffers: 1,
    evictedBytes: 120,
  });
});

test('createNutjsMemoryGuard dispose clears tracked snapshots', () => {
  const memoryGuard = createNutjsMemoryGuard({
    maxTrackedBuffers: 5,
    maxTrackedBytes: 500,
  });

  memoryGuard.trackSnapshot(new Uint8Array(100), 'first');
  memoryGuard.trackSnapshot(new Uint8Array(200), 'second');
  memoryGuard.dispose();
  assert.deepEqual(memoryGuard.getState(), {
    maxTrackedBuffers: 5,
    maxTrackedBytes: 500,
    trackedBuffers: 0,
    trackedBytes: 0,
    evictedBuffers: 0,
    evictedBytes: 0,
  });
});

test('createNutjsMemoryGuard validates constructor and track contracts', () => {
  assert.throws(() => createNutjsMemoryGuard(null), /\[nutjs:memory-guard\] Expected options to be an object\./u);
  assert.throws(
    () => createNutjsMemoryGuard({ maxTrackedBuffers: 0 }),
    /\[nutjs:memory-guard\] Expected options\.maxTrackedBuffers to be a positive integer when provided\./u,
  );
  assert.throws(
    () => createNutjsMemoryGuard({ maxTrackedBytes: -1 }),
    /\[nutjs:memory-guard\] Expected options\.maxTrackedBytes to be a positive integer when provided\./u,
  );

  const memoryGuard = createNutjsMemoryGuard();
  assert.throws(
    () => memoryGuard.trackSnapshot(new ArrayBuffer(10)),
    /\[nutjs:memory-guard\] Expected snapshotBytes to be a Uint8Array\./u,
  );
  assert.throws(
    () => memoryGuard.trackSnapshot(new Uint8Array(10), ' '),
    /\[nutjs:memory-guard\] Expected label to be a non-empty string when provided\./u,
  );
});
