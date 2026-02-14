/**
 * Load the WasmBoy core on the main thread (no Worker).
 * Uses the same core loader as the lib worker; build may bundle WASM or TS core.
 */

// Only one of these is bundled at build time (babel-plugin-filter-imports)
import getWasmBoyWasmCore from '../../dist/core/getWasmBoyWasmCore.esm';
import getWasmBoyTsCore from '../../dist/core/getWasmBoyTsCore.esm';

const isInBrowser = typeof window !== 'undefined' || typeof self !== 'undefined';

/**
 * Load and instantiate the WasmBoy core on the main thread.
 * @returns {Promise<{ instance: { exports: Record<string, unknown> }, byteMemory: Uint8Array }>}
 */
async function loadMainThreadWasm() {
  let response;

  if (typeof getWasmBoyWasmCore === 'function') {
    response = await getWasmBoyWasmCore(isInBrowser);
  }
  if (typeof getWasmBoyTsCore === 'function') {
    response = await getWasmBoyTsCore();
  }

  if (!response || !response.instance || !response.byteMemory) {
    throw new Error('WasmBoy core failed to load');
  }

  return {
    instance: response.instance,
    byteMemory: response.byteMemory,
  };
}

export { loadMainThreadWasm };
