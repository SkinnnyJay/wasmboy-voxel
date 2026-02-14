import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findBlockedArtifactPaths,
  parseGeneratedArtifactGuardArgs,
  validateGeneratedArtifactStaging,
} from './guard-generated-artifacts-precommit.mjs';

test('findBlockedArtifactPaths flags staged dist and build paths', () => {
  const blockedPaths = findBlockedArtifactPaths(['dist/wasmboy.wasm.esm.js', 'build/assets/core.untouched.wasm', 'lib/index.js']);

  assert.deepEqual(blockedPaths, ['build/assets/core.untouched.wasm', 'dist/wasmboy.wasm.esm.js']);
});

test('findBlockedArtifactPaths normalizes leading dot segments and windows path separators', () => {
  const blockedPaths = findBlockedArtifactPaths(['./dist\\worker\\audio.worker.js', '.\\build\\iframe\\index.html', 'core/constants.ts']);

  assert.deepEqual(blockedPaths, ['build/iframe/index.html', 'dist/worker/audio.worker.js']);
});

test('findBlockedArtifactPaths flags staged integration output artifacts', () => {
  const blockedPaths = findBlockedArtifactPaths([
    'test/integration/headless-simple.golden.output.png',
    'test/integration/headless-simple.output',
    'test/integration/headless-simple.golden.png',
  ]);

  assert.deepEqual(blockedPaths, ['test/integration/headless-simple.golden.output.png', 'test/integration/headless-simple.output']);
});

test('findBlockedArtifactPaths de-duplicates equivalent blocked paths', () => {
  const blockedPaths = findBlockedArtifactPaths(['dist/wasmboy.wasm.esm.js', './dist/wasmboy.wasm.esm.js', '.\\dist\\wasmboy.wasm.esm.js']);

  assert.deepEqual(blockedPaths, ['dist/wasmboy.wasm.esm.js']);
});

test('findBlockedArtifactPaths validates staged path array contracts', () => {
  assert.throws(
    () => findBlockedArtifactPaths('dist/wasmboy.wasm.esm.js'),
    /\[guard:generated-artifacts\] Expected stagedPaths to be an array\./u,
  );
  assert.throws(
    () => findBlockedArtifactPaths(['dist/wasmboy.wasm.esm.js', 7]),
    /\[guard:generated-artifacts\] Expected stagedPaths\[1\] to be a string path\./u,
  );
});

test('findBlockedArtifactPaths blocks non-golden accuracy and performance outputs', () => {
  const blockedPaths = findBlockedArtifactPaths([
    'test/accuracy/testroms/suite/frame.output',
    'test/accuracy/testroms/suite/frame.golden.output',
    'test/accuracy/testroms/suite/frame.png',
    'test/accuracy/testroms/suite/frame.golden.png',
    'test/performance/testroms/suite/frame.png',
    'test/performance/testroms/suite/frame.noPerformanceOptions.png',
  ]);

  assert.deepEqual(blockedPaths, [
    'test/accuracy/testroms/suite/frame.output',
    'test/accuracy/testroms/suite/frame.png',
    'test/performance/testroms/suite/frame.png',
  ]);
});

test('validateGeneratedArtifactStaging passes when no generated artifact paths are staged', () => {
  const result = validateGeneratedArtifactStaging(['core/constants.ts', 'voxel-wrapper.ts']);

  assert.equal(result.isValid, true);
  assert.deepEqual(result.blockedPaths, []);
});

test('validateGeneratedArtifactStaging fails when generated artifact paths are staged', () => {
  const result = validateGeneratedArtifactStaging([
    'dist/wasmboy.wasm.esm.js',
    'build/debugger/index.html',
    'test/accuracy/testroms/suite/frame.output',
    'test/integration/headless-simple.output',
    'README.md',
  ]);

  assert.equal(result.isValid, false);
  assert.deepEqual(result.blockedPaths, [
    'build/debugger/index.html',
    'dist/wasmboy.wasm.esm.js',
    'test/accuracy/testroms/suite/frame.output',
    'test/integration/headless-simple.output',
  ]);
});

test('validateGeneratedArtifactStaging does not flag golden-only test artifacts', () => {
  const result = validateGeneratedArtifactStaging([
    'test/accuracy/testroms/suite/frame.golden.output',
    'test/accuracy/testroms/suite/frame.golden.png',
    'test/performance/testroms/suite/frame.noPerformanceOptions.png',
    'README.md',
  ]);

  assert.equal(result.isValid, true);
  assert.deepEqual(result.blockedPaths, []);
});

test('validateGeneratedArtifactStaging supports explicit override for intentional generated edits', () => {
  const result = validateGeneratedArtifactStaging(['dist/wasmboy.wasm.esm.js'], { allowGeneratedEdits: true });

  assert.equal(result.isValid, true);
  assert.deepEqual(result.blockedPaths, []);
});

test('parseGeneratedArtifactGuardArgs supports help flags', () => {
  assert.deepEqual(parseGeneratedArtifactGuardArgs([]), { jsonOutput: false, shouldPrintUsage: false });
  assert.deepEqual(parseGeneratedArtifactGuardArgs(['--json']), { jsonOutput: true, shouldPrintUsage: false });
  assert.deepEqual(parseGeneratedArtifactGuardArgs(['--help']), { jsonOutput: false, shouldPrintUsage: true });
  assert.deepEqual(parseGeneratedArtifactGuardArgs(['-h']), { jsonOutput: false, shouldPrintUsage: true });
});

test('parseGeneratedArtifactGuardArgs rejects unknown flags', () => {
  assert.throws(() => parseGeneratedArtifactGuardArgs(['--dry-run']), /Unknown argument "--dry-run"\. Supported flags: --json, --help\./u);
});
