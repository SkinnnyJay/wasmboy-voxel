// Rollup config to export the correct componation of bundles
import libBundles from './rollup.lib';
import workerBundles from './rollup.worker';
import coreTsBundles from './rollup.core';
import getCoreBundles from './rollup.getcore';
import debuggerBundles from './rollup.debugger';
import benchmarkBundles from './rollup.benchmark';
import ampBundles from './rollup.amp';

function buildExports(iframeBundles) {
  let exports = [];

  if (!process.env.SKIP_LIB) {
    exports = [...getCoreBundles, ...workerBundles, ...libBundles];

    // Add TS Bundles
    if (process.env.TS) {
      exports = [...coreTsBundles, ...exports];
    }
  }

  if (process.env.DEBUGGER) {
    exports = [...exports, ...debuggerBundles];
  }

  if (process.env.BENCHMARK) {
    exports = [...exports, ...benchmarkBundles];
  }

  if (process.env.AMP) {
    exports = [...exports, ...ampBundles];
  }

  if (process.env.IFRAME) {
    exports = [...exports, ...iframeBundles];
  }

  return exports;
}

// Load iframe (Svelte) only when building iframe to avoid pulling in Svelte/compiler for debugger
export default process.env.IFRAME ? import('./rollup.iframe.js').then(mod => buildExports(mod.default)) : buildExports([]);
