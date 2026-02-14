import path from 'node:path';
import { createRequire } from 'node:module';
import os from 'node:os';
import { copyFile, mkdtemp } from 'node:fs/promises';

const INVALID_OFFSETS = [-1, 0x10000, 0x200000];
const VALID_BOUNDARY_OFFSETS = [0x0000, 0xffff];

/**
 * @param {unknown} resolver
 */
export function validateGameBoyOffsetResolver(resolver) {
  if (typeof resolver !== 'function') {
    throw new Error('Core export getWasmBoyOffsetFromGameBoyOffset is unavailable.');
  }

  for (const invalidOffset of INVALID_OFFSETS) {
    const mappedOffset = resolver(invalidOffset);
    if (mappedOffset !== -1) {
      throw new Error(
        `Expected invalid Game Boy offset ${String(invalidOffset)} to map to sentinel -1 (received ${String(mappedOffset)}).`,
      );
    }
  }

  for (const validOffset of VALID_BOUNDARY_OFFSETS) {
    const mappedOffset = resolver(validOffset);
    if (!Number.isInteger(mappedOffset) || mappedOffset < 0) {
      throw new Error(
        `Expected valid Game Boy offset 0x${validOffset.toString(16)} to map to a non-negative integer (received ${String(mappedOffset)}).`,
      );
    }
  }
}

/**
 * @param {string} distCoreEntryPath
 */
async function loadCoreFromDist(distCoreEntryPath) {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'core-memory-offset-contract-'));
  const temporaryCjsEntryPath = path.join(tempDirectory, 'getWasmBoyWasmCore.contract.cjs');
  await copyFile(distCoreEntryPath, temporaryCjsEntryPath);

  const require = createRequire(import.meta.url);
  const getWasmBoyWasmCore = require(temporaryCjsEntryPath);

  if (typeof getWasmBoyWasmCore !== 'function') {
    throw new Error(`Expected dist core entry to export a function at ${distCoreEntryPath}.`);
  }

  return getWasmBoyWasmCore();
}

/**
 * @param {{
 *   repoRoot?: string;
 *   loadCore?: () => Promise<unknown>;
 }} [options]
 */
export async function runCoreMemoryOffsetContractCheck(options = {}) {
  const repoRoot = options.repoRoot ?? process.cwd();
  const distCoreEntryPath = path.resolve(repoRoot, 'dist/core/getWasmBoyWasmCore.cjs.js');
  const loadCore = options.loadCore ?? (() => loadCoreFromDist(distCoreEntryPath));
  const wasmBoyCore = await loadCore();

  if (!wasmBoyCore || typeof wasmBoyCore !== 'object') {
    throw new Error('Core loader returned an invalid value.');
  }

  const instance = wasmBoyCore.instance;
  if (!instance || typeof instance !== 'object') {
    throw new Error('Core loader did not return a valid wasm instance.');
  }

  const exportsObject = instance.exports;
  if (!exportsObject || typeof exportsObject !== 'object') {
    throw new Error('Core wasm instance exports are unavailable.');
  }

  validateGameBoyOffsetResolver(exportsObject.getWasmBoyOffsetFromGameBoyOffset);
}
