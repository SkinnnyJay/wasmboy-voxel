import assert from 'node:assert/strict';
import test from 'node:test';
import { runCoreMemoryOffsetContractCheck, validateGameBoyOffsetResolver } from './core-memory-offset-contract-check-lib.mjs';

test('validateGameBoyOffsetResolver accepts sentinel and boundary mappings', () => {
  const resolver = offset => {
    if (offset < 0 || offset > 0xffff) {
      return -1;
    }
    return offset;
  };

  assert.doesNotThrow(() => validateGameBoyOffsetResolver(resolver));
});

test('validateGameBoyOffsetResolver rejects missing resolver function', () => {
  assert.throws(() => validateGameBoyOffsetResolver(undefined), /Core export getWasmBoyOffsetFromGameBoyOffset is unavailable/u);
});

test('validateGameBoyOffsetResolver rejects invalid sentinel behavior', () => {
  const resolver = () => 0;
  assert.throws(() => validateGameBoyOffsetResolver(resolver), /Expected invalid Game Boy offset -1 to map to sentinel -1/u);
});

test('validateGameBoyOffsetResolver rejects negative valid boundary mappings', () => {
  const resolver = offset => (offset < 0 || offset > 0xffff ? -1 : -5);
  assert.throws(() => validateGameBoyOffsetResolver(resolver), /Expected valid Game Boy offset 0x0 to map to a non-negative integer/u);
});

test('runCoreMemoryOffsetContractCheck validates loaded core exports', async () => {
  const loadCore = async () => ({
    instance: {
      exports: {
        getWasmBoyOffsetFromGameBoyOffset(offset) {
          if (offset < 0 || offset > 0xffff) {
            return -1;
          }
          return offset;
        },
      },
    },
  });

  await assert.doesNotReject(() => runCoreMemoryOffsetContractCheck({ loadCore }));
});

test('runCoreMemoryOffsetContractCheck rejects invalid loader responses', async () => {
  await assert.rejects(() => runCoreMemoryOffsetContractCheck({ loadCore: async () => null }), /Core loader returned an invalid value/u);
  await assert.rejects(
    () => runCoreMemoryOffsetContractCheck({ loadCore: async () => ({}) }),
    /Core loader did not return a valid wasm instance/u,
  );
  await assert.rejects(
    () => runCoreMemoryOffsetContractCheck({ loadCore: async () => ({ instance: {} }) }),
    /Core wasm instance exports are unavailable/u,
  );
});
