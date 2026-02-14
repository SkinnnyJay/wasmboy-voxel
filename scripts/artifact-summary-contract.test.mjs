import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ARTIFACT_SUMMARY_SCHEMA_VERSION,
  buildArtifactSummaryMetadata,
  CLEAN_ARTIFACT_SUMMARY_TOOL,
  GUARD_ARTIFACT_SUMMARY_TOOL,
} from './artifact-summary-contract.mjs';

test('buildArtifactSummaryMetadata emits schema and timestamp defaults', () => {
  const summary = buildArtifactSummaryMetadata(CLEAN_ARTIFACT_SUMMARY_TOOL);

  assert.equal(summary.tool, CLEAN_ARTIFACT_SUMMARY_TOOL);
  assert.equal(summary.schemaVersion, ARTIFACT_SUMMARY_SCHEMA_VERSION);
  assert.equal(typeof summary.timestampMs, 'number');
  assert.equal(Number.isInteger(summary.timestampMs), true);
  assert.equal(summary.timestampMs > 0, true);
});

test('buildArtifactSummaryMetadata supports explicit deterministic timestamp overrides', () => {
  const summary = buildArtifactSummaryMetadata(GUARD_ARTIFACT_SUMMARY_TOOL, { timestampMs: 123 });

  assert.deepEqual(summary, {
    tool: GUARD_ARTIFACT_SUMMARY_TOOL,
    schemaVersion: ARTIFACT_SUMMARY_SCHEMA_VERSION,
    timestampMs: 123,
  });
});

test('buildArtifactSummaryMetadata validates tool, timestamp, and options contracts', () => {
  assert.throws(() => buildArtifactSummaryMetadata(''), /Expected tool to be a non-empty string\./u);
  assert.throws(() => buildArtifactSummaryMetadata(CLEAN_ARTIFACT_SUMMARY_TOOL, null), /Expected options to be an object\./u);
  assert.throws(
    () => buildArtifactSummaryMetadata(CLEAN_ARTIFACT_SUMMARY_TOOL, { timestampMs: 0 }),
    /Expected timestampMs to be a positive integer\./u,
  );
  assert.throws(
    () => buildArtifactSummaryMetadata(CLEAN_ARTIFACT_SUMMARY_TOOL, { timestampMs: 1.5 }),
    /Expected timestampMs to be a positive integer\./u,
  );
});
