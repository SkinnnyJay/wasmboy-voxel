import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldRemoveGeneratedFile } from './artifact-policy.mjs';
import { findBlockedArtifactPaths } from './guard-generated-artifacts-precommit.mjs';

test('artifact cleanup and staging guard stay aligned for generated test outputs', () => {
  const generatedPaths = [
    'test/accuracy/testroms/suite/frame.output',
    'test/accuracy/testroms/suite/frame.png',
    'test/performance/testroms/suite/frame.png',
    'test/integration/headless-simple.output',
    'test/integration/headless-simple.output.png',
  ];

  const blocked = findBlockedArtifactPaths(generatedPaths);
  const cleaned = generatedPaths.filter(path => shouldRemoveGeneratedFile(path)).sort((left, right) => left.localeCompare(right));
  const expectedBlocked = [...generatedPaths].sort((left, right) => left.localeCompare(right));

  assert.deepEqual(blocked, expectedBlocked);
  assert.deepEqual(cleaned, expectedBlocked);
});

test('artifact cleanup and staging guard allow golden and baseline reference artifacts', () => {
  const baselinePaths = [
    'test/accuracy/testroms/suite/frame.golden.output',
    'test/accuracy/testroms/suite/frame.golden.png',
    'test/performance/testroms/suite/frame.noPerformanceOptions.png',
    'test/integration/headless-simple.golden.png',
  ];

  const blocked = findBlockedArtifactPaths(baselinePaths);
  const cleaned = baselinePaths.filter(path => shouldRemoveGeneratedFile(path));

  assert.deepEqual(blocked, []);
  assert.deepEqual(cleaned, []);
});

test('artifact cleanup and staging guard classify mixed-case paths consistently', () => {
  const mixedCasePaths = [
    'TEST/ACCURACY/TESTROMS/SUITE/FRAME.OUTPUT',
    'test/accuracy/testroms/suite/frame.output',
    'Test/Integration/Headless-Simple.OUTPUT.PNG',
    'test/integration/headless-simple.output.png',
  ];

  const blocked = findBlockedArtifactPaths(mixedCasePaths);
  const cleaned = mixedCasePaths.filter(path => shouldRemoveGeneratedFile(path));

  assert.deepEqual(blocked, ['TEST/ACCURACY/TESTROMS/SUITE/FRAME.OUTPUT', 'Test/Integration/Headless-Simple.OUTPUT.PNG']);
  assert.equal(cleaned.length, mixedCasePaths.length);
});
