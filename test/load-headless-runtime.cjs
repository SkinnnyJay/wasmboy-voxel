const fs = require('fs');
const path = require('path');

const HEADLESS_CJS = path.resolve(__dirname, '../dist/wasmboy.headless.cjs.cjs');
if (!fs.existsSync(HEADLESS_CJS)) {
  throw new Error('Headless CJS bundle not found. Run: npm run lib:build:wasm');
}

module.exports = require(HEADLESS_CJS);
