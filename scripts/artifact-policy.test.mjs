import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeArtifactPath, shouldBlockStagedArtifactPath, shouldRemoveGeneratedFile } from './artifact-policy.mjs';

test('normalizeArtifactPath normalizes windows and relative path prefixes', () => {
  assert.equal(normalizeArtifactPath('./dist\\worker\\audio.worker.js'), 'dist/worker/audio.worker.js');
  assert.equal(normalizeArtifactPath('.\\test\\integration\\headless.output.png'), 'test/integration/headless.output.png');
  assert.equal(normalizeArtifactPath('C:\\agent\\_work\\1\\s\\dist\\wasmboy.wasm.esm.js'), 'agent/_work/1/s/dist/wasmboy.wasm.esm.js');
  assert.equal(
    normalizeArtifactPath('D:/agent/_work/1/s/test/integration/headless.output'),
    'agent/_work/1/s/test/integration/headless.output',
  );
});

test('artifact policy path helpers reject non-string path inputs', () => {
  assert.throws(() => normalizeArtifactPath(42), /\[artifact-policy\] Expected candidatePath to be a string path\./u);
  assert.throws(() => shouldRemoveGeneratedFile(null), /\[artifact-policy\] Expected relativePath to be a string path\./u);
  assert.throws(() => shouldBlockStagedArtifactPath(undefined), /\[artifact-policy\] Expected stagedPath to be a string path\./u);
});

test('shouldRemoveGeneratedFile matches generated test output patterns', () => {
  assert.equal(shouldRemoveGeneratedFile('test/integration/headless.output.png'), true);
  assert.equal(shouldRemoveGeneratedFile('test/accuracy/testroms/suite/frame.output'), true);
  assert.equal(shouldRemoveGeneratedFile('test/accuracy/testroms/suite/frame.png'), true);
  assert.equal(shouldRemoveGeneratedFile('test/performance/testroms/suite/frame.png'), true);
});

test('shouldRemoveGeneratedFile matches mixed-case generated output patterns', () => {
  assert.equal(shouldRemoveGeneratedFile('Test/Integration/Headless.OUTPUT.PNG'), true);
  assert.equal(shouldRemoveGeneratedFile('TEST/ACCURACY/TESTROMS/SUITE/FRAME.OUTPUT'), true);
  assert.equal(shouldRemoveGeneratedFile('test/Accuracy/testroms/suite/frame.PNG'), true);
  assert.equal(shouldRemoveGeneratedFile('TEST/PERFORMANCE/TESTROMS/SUITE/FRAME.PNG'), true);
});

test('shouldRemoveGeneratedFile preserves golden and baseline reference files', () => {
  assert.equal(shouldRemoveGeneratedFile('test/integration/headless.golden.png'), false);
  assert.equal(shouldRemoveGeneratedFile('test/accuracy/testroms/suite/frame.golden.output'), false);
  assert.equal(shouldRemoveGeneratedFile('test/accuracy/testroms/suite/frame.golden.png'), false);
  assert.equal(shouldRemoveGeneratedFile('test/performance/testroms/suite/frame.noPerformanceOptions.png'), false);
});

test('shouldRemoveGeneratedFile preserves mixed-case golden and baseline reference files', () => {
  assert.equal(shouldRemoveGeneratedFile('TEST/INTEGRATION/HEADLESS.GOLDEN.PNG'), false);
  assert.equal(shouldRemoveGeneratedFile('Test/Accuracy/TestRoms/Suite/Frame.GOLDEN.OUTPUT'), false);
  assert.equal(shouldRemoveGeneratedFile('TEST/ACCURACY/TESTROMS/SUITE/FRAME.GOLDEN.PNG'), false);
  assert.equal(shouldRemoveGeneratedFile('test/performance/testroms/suite/frame.NoPerformanceOptions.PNG'), false);
});

test('shouldBlockStagedArtifactPath blocks dist/build plus generated outputs', () => {
  assert.equal(shouldBlockStagedArtifactPath('dist/wasmboy.wasm.esm.js'), true);
  assert.equal(shouldBlockStagedArtifactPath('build/assets/core.untouched.wasm'), true);
  assert.equal(shouldBlockStagedArtifactPath('DIST/worker/audio.worker.js'), true);
  assert.equal(shouldBlockStagedArtifactPath('Build/assets/core.untouched.wasm'), true);
  assert.equal(shouldBlockStagedArtifactPath('test/integration/headless.output'), true);
  assert.equal(shouldBlockStagedArtifactPath('TEST/INTEGRATION/HEADLESS.OUTPUT'), true);
  assert.equal(shouldBlockStagedArtifactPath('.\\test\\integration\\headless.output.png'), true);
  assert.equal(shouldBlockStagedArtifactPath('C:\\agent\\_work\\1\\s\\build\\assets\\core.untouched.wasm'), true);
  assert.equal(shouldBlockStagedArtifactPath('D:/agent/_work/1/s/test/accuracy/testroms/suite/frame.output'), true);
  assert.equal(shouldRemoveGeneratedFile('D:\\agent\\_work\\1\\s\\test\\performance\\testroms\\suite\\frame.png'), true);
  assert.equal(shouldBlockStagedArtifactPath('README.md'), false);
});
