import assert from 'node:assert/strict';
import test from 'node:test';
import { buildNutjsArtifactNames, resolveNutjsArtifactTimestamp, selectNutjsArtifactsForRetention } from './nutjs-artifacts.mjs';

test('buildNutjsArtifactNames creates deterministic screenshot/video/trace names', () => {
  const artifactNames = buildNutjsArtifactNames({
    scenario: 'Smoke Flow',
    platform: 'darwin',
    lane: 'CI',
    runId: 'Run 42',
    timestampMs: 1700000000000,
    sequence: 12,
  });

  assert.deepEqual(artifactNames, {
    baseName: 'nutjs-smoke-flow-darwin-ci-run-42-1700000000000-0012',
    screenshot: 'nutjs-smoke-flow-darwin-ci-run-42-1700000000000-0012.png',
    video: 'nutjs-smoke-flow-darwin-ci-run-42-1700000000000-0012.webm',
    trace: 'nutjs-smoke-flow-darwin-ci-run-42-1700000000000-0012.jsonl',
  });
});

test('resolveNutjsArtifactTimestamp honors explicit deterministic overrides', () => {
  const defaultTimestamp = resolveNutjsArtifactTimestamp({});
  assert.equal(Number.isInteger(defaultTimestamp), true);
  assert.equal(defaultTimestamp > 0, true);
  assert.equal(resolveNutjsArtifactTimestamp({ NUTJS_ARTIFACT_TIMESTAMP_MS: '1700000000012' }), 1700000000012);
  assert.throws(
    () => resolveNutjsArtifactTimestamp({ NUTJS_ARTIFACT_TIMESTAMP_MS: 'not-a-number' }),
    /\[nutjs:artifacts\] Invalid NUTJS_ARTIFACT_TIMESTAMP_MS value: not-a-number/u,
  );
});

test('selectNutjsArtifactsForRetention keeps latest artifacts and prunes older ones', () => {
  const retention = selectNutjsArtifactsForRetention(
    [
      'nutjs-smoke-linux-local-run-1700000000000-0001.png',
      'nutjs-smoke-linux-local-run-1700000000010-0001.png',
      'nutjs-smoke-linux-local-run-1700000000005-0001.png',
    ],
    2,
  );

  assert.deepEqual(retention, {
    keep: ['nutjs-smoke-linux-local-run-1700000000010-0001.png', 'nutjs-smoke-linux-local-run-1700000000005-0001.png'],
    prune: ['nutjs-smoke-linux-local-run-1700000000000-0001.png'],
  });
});

test('artifact helpers validate contract inputs', () => {
  assert.throws(() => buildNutjsArtifactNames(null), /\[nutjs:artifacts\] Expected options to be an object\./u);
  assert.throws(
    () => buildNutjsArtifactNames({ scenario: '', platform: 'linux' }),
    /\[nutjs:artifacts\] Expected options\.scenario to be a non-empty string\./u,
  );
  assert.throws(
    () => buildNutjsArtifactNames({ scenario: 'smoke', platform: 'linux', sequence: 0 }),
    /\[nutjs:artifacts\] Expected options\.sequence to be a positive integer when provided\./u,
  );
  assert.throws(() => selectNutjsArtifactsForRetention('x'), /\[nutjs:artifacts\] Expected artifactFileNames to be an array\./u);
  assert.throws(
    () => selectNutjsArtifactsForRetention(['x.png'], 0),
    /\[nutjs:artifacts\] Expected maxRetainedArtifacts to be a positive integer when provided\./u,
  );
});
