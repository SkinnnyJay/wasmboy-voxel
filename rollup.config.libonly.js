// Lib-only rollup config: core + worker + lib + headless bundles.
// Use this for PROD,WASM build to avoid loading rollup-plugin-svelte (iframe/demo).
import libBundles from './rollup.lib.js';
import workerBundles from './rollup.worker.js';
import getCoreBundles from './rollup.getcore.js';
import headlessBundles from './rollup.headless.js';

const exports = [...getCoreBundles, ...workerBundles, ...libBundles, ...headlessBundles];
export default exports;
