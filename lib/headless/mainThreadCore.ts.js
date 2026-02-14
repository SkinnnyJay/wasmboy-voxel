/**
 * Load the WasmBoy TypeScript core on the main thread (TS build only).
 */
import getWasmBoyTsCore from '../../dist/core/getWasmBoyTsCore.esm';

export async function loadMainThreadWasm() {
  const response = await getWasmBoyTsCore();
  if (!response || !response.instance || !response.byteMemory) {
    throw new Error('WasmBoy core failed to load');
  }
  return {
    instance: response.instance,
    byteMemory: response.byteMemory,
  };
}
