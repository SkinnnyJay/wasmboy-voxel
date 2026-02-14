/**
 * Load the WasmBoy WASM core on the main thread (WASM build only).
 */
import getWasmBoyWasmCore from '../../dist/core/getWasmBoyWasmCore.esm';

const isInBrowser = typeof window !== 'undefined' || typeof self !== 'undefined';

export async function loadMainThreadWasm() {
  const response = await getWasmBoyWasmCore(isInBrowser);
  if (!response || !response.instance || !response.byteMemory) {
    throw new Error('WasmBoy core failed to load');
  }
  return {
    instance: response.instance,
    byteMemory: response.byteMemory,
  };
}
