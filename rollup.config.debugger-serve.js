// Rollup config for debugger + lib only (no iframe/Svelte, no benchmark, no amp).
// Use: rollup -c rollup.config.debugger-serve.js -w --environment DEBUGGER,SERVE
import libBundles from './rollup.lib.js';
import workerBundles from './rollup.worker.js';
import getCoreBundles from './rollup.getcore.js';
import debuggerBundles from './rollup.debugger.js';

let exports = [...getCoreBundles, ...workerBundles, ...libBundles, ...debuggerBundles];
export default exports;
