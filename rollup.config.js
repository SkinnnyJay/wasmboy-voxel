// Rollup config to export the correct componation of bundles
import libBundles from './rollup.lib.js';
import workerBundles from './rollup.worker.js';
import coreTsBundles from './rollup.core.js';
import getCoreBundles from './rollup.getcore.js';

async function buildExports() {
  let exports = [];

  if (!process.env.SKIP_LIB) {
    exports = [...getCoreBundles, ...workerBundles, ...libBundles];

    // Add TS Bundles
    if (process.env.TS) {
      exports = [...coreTsBundles, ...exports];
    }
  }

  if (process.env.DEBUGGER) {
    const debuggerBundlesModule = await import('./rollup.debugger.js');
    const debuggerBundles = debuggerBundlesModule.default;
    exports = [...exports, ...debuggerBundles];
  }

  if (process.env.BENCHMARK) {
    const benchmarkBundlesModule = await import('./rollup.benchmark.js');
    const benchmarkBundles = benchmarkBundlesModule.default;
    exports = [...exports, ...benchmarkBundles];
  }

  if (process.env.AMP) {
    const ampBundlesModule = await import('./rollup.amp.js');
    const ampBundles = ampBundlesModule.default;
    exports = [...exports, ...ampBundles];
  }

  if (process.env.IFRAME) {
    const iframeBundlesModule = await import('./rollup.iframe.js');
    const iframeBundles = iframeBundlesModule.default;
    exports = [...exports, ...iframeBundles];
  }

  return exports;
}

export default buildExports();
