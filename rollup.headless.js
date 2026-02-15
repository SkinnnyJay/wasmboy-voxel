// Headless bundle: main-thread WASM runner (no Workers).
// Uses mainThreadCore.wasm.js (getWasmBoyWasmCore) when built with WASM.
// For TS build use mainThreadCore.ts.js and add a separate rollup run.
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';

const plugins = [
  resolve({
    extensions: ['.mjs', '.js', '.json', '.node', '.ts'],
  }),
  commonjs(),
  json(),
  babel({
    exclude: ['node_modules/**'],
    plugins: [['@babel/plugin-proposal-class-properties'], ['@babel/plugin-proposal-object-rest-spread']],
  }),
];

export default [
  {
    input: 'lib/headless/index.ts',
    output: {
      file: 'dist/wasmboy.headless.esm.js',
      format: 'es',
      sourcemap: true,
    },
    context: 'window',
    plugins,
  },
  {
    input: 'lib/headless/index.ts',
    output: {
      file: 'dist/wasmboy.headless.cjs.cjs',
      format: 'cjs',
      sourcemap: true,
    },
    context: 'global',
    plugins,
  },
];
