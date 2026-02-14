import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ARTIFACT_SUMMARY_TIMESTAMP_ENV_NAME,
  ARTIFACT_SUMMARY_SCHEMA_VERSION,
  buildArtifactSummaryMetadata,
  CLEAN_ARTIFACT_SUMMARY_TOOL,
  GUARD_ARTIFACT_SUMMARY_TOOL,
  resolveArtifactSummaryTimestampOverride,
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

test('resolveArtifactSummaryTimestampOverride returns parsed override when set', () => {
  const parsed = resolveArtifactSummaryTimestampOverride({
    [ARTIFACT_SUMMARY_TIMESTAMP_ENV_NAME]: '456',
  });

  assert.equal(parsed, 456);
});

test('resolveArtifactSummaryTimestampOverride supports unset override', () => {
  assert.equal(resolveArtifactSummaryTimestampOverride({}), undefined);
});

test('resolveArtifactSummaryTimestampOverride validates environment and timestamp contracts', () => {
  assert.throws(() => resolveArtifactSummaryTimestampOverride(null), /Expected environment to be an object\./u);
  assert.throws(
    () => resolveArtifactSummaryTimestampOverride({ [ARTIFACT_SUMMARY_TIMESTAMP_ENV_NAME]: 7 }),
    /Expected WASMBOY_ARTIFACT_SUMMARY_TIMESTAMP_MS to be a string when provided\./u,
  );
  assert.throws(
    () => resolveArtifactSummaryTimestampOverride({ [ARTIFACT_SUMMARY_TIMESTAMP_ENV_NAME]: 'abc' }),
    /WASMBOY_ARTIFACT_SUMMARY_TIMESTAMP_MS must be a positive integer when provided\./u,
  );
  assert.throws(
    () => resolveArtifactSummaryTimestampOverride({ [ARTIFACT_SUMMARY_TIMESTAMP_ENV_NAME]: '0' }),
    /WASMBOY_ARTIFACT_SUMMARY_TIMESTAMP_MS must be a positive integer when provided\./u,
  );
});
