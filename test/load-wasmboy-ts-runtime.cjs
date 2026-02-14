const fs = require('fs');
const os = require('os');
const path = require('path');

const RUNTIME_CANDIDATES = ['../dist/wasmboy.ts.cjs.js'];

const runtimePath = RUNTIME_CANDIDATES.find(candidatePath => fs.existsSync(path.resolve(__dirname, candidatePath)));

if (!runtimePath) {
  throw new Error('Unable to locate CJS TypeScript WasmBoy runtime in dist/.');
}

let runtimeLoadPath = path.resolve(__dirname, runtimePath);
if (runtimeLoadPath.endsWith('.js')) {
  const cjsCopyPath = path.join(os.tmpdir(), 'wasmboy-ts-runtime.cjs');
  fs.copyFileSync(runtimeLoadPath, cjsCopyPath);
  runtimeLoadPath = cjsCopyPath;
}

module.exports = require(runtimeLoadPath).WasmBoy;
