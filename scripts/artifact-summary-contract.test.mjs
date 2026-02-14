import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ARTIFACT_SUMMARY_TIMESTAMP_ENV_NAME,
  ARTIFACT_SUMMARY_SCHEMA_VERSION,
  buildArtifactSummaryMetadata,
  buildCleanupArtifactSummary,
  buildGuardArtifactSummary,
  CLEAN_ARTIFACT_SUMMARY_TOOL,
  GUARD_ARTIFACT_SUMMARY_TOOL,
  resolveArtifactSummaryTimestampOverride,
  SUMMARY_TIMESTAMP_SOURCE_ENV_OVERRIDE,
  SUMMARY_TIMESTAMP_SOURCE_SYSTEM_CLOCK,
} from './artifact-summary-contract.mjs';

test('buildArtifactSummaryMetadata emits schema and timestamp defaults', () => {
  const summary = buildArtifactSummaryMetadata(CLEAN_ARTIFACT_SUMMARY_TOOL);

  assert.equal(summary.tool, CLEAN_ARTIFACT_SUMMARY_TOOL);
  assert.equal(summary.schemaVersion, ARTIFACT_SUMMARY_SCHEMA_VERSION);
  assert.equal(summary.timestampSource, SUMMARY_TIMESTAMP_SOURCE_SYSTEM_CLOCK);
  assert.equal(typeof summary.timestampMs, 'number');
  assert.equal(Number.isInteger(summary.timestampMs), true);
  assert.equal(summary.timestampMs > 0, true);
});

test('buildArtifactSummaryMetadata supports explicit deterministic timestamp overrides', () => {
  const summary = buildArtifactSummaryMetadata(GUARD_ARTIFACT_SUMMARY_TOOL, { timestampMs: 123 });

  assert.deepEqual(summary, {
    tool: GUARD_ARTIFACT_SUMMARY_TOOL,
    schemaVersion: ARTIFACT_SUMMARY_SCHEMA_VERSION,
    timestampSource: SUMMARY_TIMESTAMP_SOURCE_ENV_OVERRIDE,
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

test('resolveArtifactSummaryTimestampOverride trims whitespace around overrides', () => {
  const parsed = resolveArtifactSummaryTimestampOverride({
    [ARTIFACT_SUMMARY_TIMESTAMP_ENV_NAME]: ' 456 ',
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
    () => resolveArtifactSummaryTimestampOverride({ [ARTIFACT_SUMMARY_TIMESTAMP_ENV_NAME]: '   ' }),
    /WASMBOY_ARTIFACT_SUMMARY_TIMESTAMP_MS must be a positive integer when provided\./u,
  );
  assert.throws(
    () => resolveArtifactSummaryTimestampOverride({ [ARTIFACT_SUMMARY_TIMESTAMP_ENV_NAME]: '0' }),
    /WASMBOY_ARTIFACT_SUMMARY_TIMESTAMP_MS must be a positive integer when provided\./u,
  );
});

test('buildCleanupArtifactSummary emits derived count fields and mode', () => {
  const summary = buildCleanupArtifactSummary({
    dryRun: true,
    deletedDirectories: ['dist', 'build'],
    deletedFiles: ['test/integration/z.output', 'test/integration/a.output'],
    timestampMs: 789,
  });

  assert.deepEqual(summary, {
    tool: CLEAN_ARTIFACT_SUMMARY_TOOL,
    schemaVersion: ARTIFACT_SUMMARY_SCHEMA_VERSION,
    timestampSource: SUMMARY_TIMESTAMP_SOURCE_ENV_OVERRIDE,
    timestampMs: 789,
    mode: 'dry-run',
    removedCount: 4,
    hasRemovals: true,
    deletedDirectoryCount: 2,
    deletedFileCount: 2,
    deletedDirectories: ['build', 'dist'],
    deletedFiles: ['test/integration/a.output', 'test/integration/z.output'],
  });
});

test('buildCleanupArtifactSummary validates options contracts', () => {
  assert.throws(() => buildCleanupArtifactSummary(null), /Expected options to be an object\./u);
  assert.throws(
    () => buildCleanupArtifactSummary({ dryRun: 'yes', deletedDirectories: [], deletedFiles: [] }),
    /Expected options\.dryRun to be a boolean\./u,
  );
  assert.throws(
    () => buildCleanupArtifactSummary({ dryRun: false, deletedDirectories: [7], deletedFiles: [] }),
    /Expected options\.deletedDirectories\[0\] to be a string\./u,
  );
  assert.throws(
    () => buildCleanupArtifactSummary({ dryRun: false, deletedDirectories: [], deletedFiles: [7] }),
    /Expected options\.deletedFiles\[0\] to be a string\./u,
  );
});

test('buildGuardArtifactSummary emits derived blocked count fields', () => {
  const summary = buildGuardArtifactSummary({
    allowGeneratedEdits: false,
    isValid: false,
    blockedPaths: ['dist/generated.js', 'build/a-generated.js'],
    stagedPathCount: 2,
    timestampMs: 789,
  });

  assert.deepEqual(summary, {
    tool: GUARD_ARTIFACT_SUMMARY_TOOL,
    schemaVersion: ARTIFACT_SUMMARY_SCHEMA_VERSION,
    timestampSource: SUMMARY_TIMESTAMP_SOURCE_ENV_OVERRIDE,
    timestampMs: 789,
    allowGeneratedEdits: false,
    isValid: false,
    blockedPaths: ['build/a-generated.js', 'dist/generated.js'],
    blockedPathCount: 2,
    hasBlockedPaths: true,
    stagedPathCount: 2,
  });
});

test('buildGuardArtifactSummary validates options contracts', () => {
  assert.throws(() => buildGuardArtifactSummary(null), /Expected options to be an object\./u);
  assert.throws(
    () => buildGuardArtifactSummary({ allowGeneratedEdits: 'yes', isValid: true, blockedPaths: [], stagedPathCount: 0 }),
    /Expected options\.allowGeneratedEdits to be a boolean\./u,
  );
  assert.throws(
    () => buildGuardArtifactSummary({ allowGeneratedEdits: true, isValid: 'yes', blockedPaths: [], stagedPathCount: 0 }),
    /Expected options\.isValid to be a boolean\./u,
  );
  assert.throws(
    () => buildGuardArtifactSummary({ allowGeneratedEdits: true, isValid: true, blockedPaths: [3], stagedPathCount: 0 }),
    /Expected options\.blockedPaths\[0\] to be a string\./u,
  );
  assert.throws(
    () => buildGuardArtifactSummary({ allowGeneratedEdits: true, isValid: true, blockedPaths: [], stagedPathCount: -1 }),
    /Expected options\.stagedPathCount to be a non-negative integer\./u,
  );
  assert.throws(
    () => buildGuardArtifactSummary({ allowGeneratedEdits: true, isValid: false, blockedPaths: ['dist/generated.js'], stagedPathCount: 0 }),
    /Expected options\.stagedPathCount to be >= blocked path count\./u,
  );
  assert.throws(
    () => buildGuardArtifactSummary({ allowGeneratedEdits: true, isValid: true, blockedPaths: ['dist/generated.js'], stagedPathCount: 1 }),
    /Expected valid guard summaries to contain zero blocked paths\./u,
  );
});

test('summary builders expose boolean convenience flags for no-op payloads', () => {
  const cleanupSummary = buildCleanupArtifactSummary({
    dryRun: false,
    deletedDirectories: [],
    deletedFiles: [],
  });
  const guardSummary = buildGuardArtifactSummary({
    allowGeneratedEdits: false,
    isValid: true,
    blockedPaths: [],
    stagedPathCount: 0,
  });

  assert.equal(cleanupSummary.hasRemovals, false);
  assert.equal(guardSummary.hasBlockedPaths, false);
});

test('summary builders use locale-independent ordinal sorting for path arrays', () => {
  const cleanupSummary = buildCleanupArtifactSummary({
    dryRun: true,
    deletedDirectories: ['dist/a', 'dist/B'],
    deletedFiles: ['test/integration/z.output', 'test/integration/A.output'],
  });
  const guardSummary = buildGuardArtifactSummary({
    allowGeneratedEdits: false,
    isValid: false,
    blockedPaths: ['dist/generated-z.js', 'dist/generated-A.js'],
    stagedPathCount: 2,
  });

  assert.deepEqual(cleanupSummary.deletedDirectories, ['dist/B', 'dist/a']);
  assert.deepEqual(cleanupSummary.deletedFiles, ['test/integration/A.output', 'test/integration/z.output']);
  assert.deepEqual(guardSummary.blockedPaths, ['dist/generated-A.js', 'dist/generated-z.js']);
});
