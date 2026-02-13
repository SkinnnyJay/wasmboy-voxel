// Lib-only rollup config: core + worker + lib bundles only.
// Use this for PROD,WASM build to avoid loading rollup-plugin-svelte (iframe/demo).
import libBundles from './rollup.lib.js';
import workerBundles from './rollup.worker.js';
import getCoreBundles from './rollup.getcore.js';

const exports = [...getCoreBundles, ...workerBundles, ...libBundles];
export default exports;
