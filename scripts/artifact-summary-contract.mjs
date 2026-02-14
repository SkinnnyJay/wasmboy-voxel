export const ARTIFACT_SUMMARY_SCHEMA_VERSION = 1;
export const CLEAN_ARTIFACT_SUMMARY_TOOL = 'clean:artifacts';
export const GUARD_ARTIFACT_SUMMARY_TOOL = 'guard:generated-artifacts';
export const ARTIFACT_SUMMARY_TIMESTAMP_ENV_NAME = 'WASMBOY_ARTIFACT_SUMMARY_TIMESTAMP_MS';
export const SUMMARY_TIMESTAMP_SOURCE_SYSTEM_CLOCK = 'system-clock';
export const SUMMARY_TIMESTAMP_SOURCE_ENV_OVERRIDE = 'env-override';

/**
 * @param {string} tool
 */
function assertSummaryTool(tool) {
  if (typeof tool !== 'string' || tool.trim().length === 0) {
    throw new TypeError('Expected tool to be a non-empty string.');
  }
}

/**
 * @param {number} timestampMs
 */
function assertTimestampMs(timestampMs) {
  if (!Number.isInteger(timestampMs) || timestampMs <= 0) {
    throw new TypeError('Expected timestampMs to be a positive integer.');
  }
}

/**
 * @param {unknown} candidateArray
 * @param {string} parameterName
 */
function assertStringArray(candidateArray, parameterName) {
  if (!Array.isArray(candidateArray)) {
    throw new TypeError(`Expected ${parameterName} to be an array.`);
  }

  for (let index = 0; index < candidateArray.length; index += 1) {
    if (typeof candidateArray[index] !== 'string') {
      throw new TypeError(`Expected ${parameterName}[${String(index)}] to be a string.`);
    }
  }
}

/**
 * @param {string[]} values
 */
function sortedStringArray(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

/**
 * @param {string} tool
 * @param {{
 *   timestampMs?: number;
 * }} [options]
 */
export function buildArtifactSummaryMetadata(tool, options = {}) {
  assertSummaryTool(tool);

  if (options === null || typeof options !== 'object') {
    throw new TypeError('Expected options to be an object.');
  }

  const timestampMs = options.timestampMs ?? Date.now();
  assertTimestampMs(timestampMs);
  const timestampSource = options.timestampMs === undefined ? SUMMARY_TIMESTAMP_SOURCE_SYSTEM_CLOCK : SUMMARY_TIMESTAMP_SOURCE_ENV_OVERRIDE;

  return {
    tool,
    schemaVersion: ARTIFACT_SUMMARY_SCHEMA_VERSION,
    timestampSource,
    timestampMs,
  };
}

/**
 * @param {{
 *   dryRun: boolean;
 *   deletedDirectories: string[];
 *   deletedFiles: string[];
 *   timestampMs?: number;
 * }} options
 */
export function buildCleanupArtifactSummary(options) {
  if (options === null || typeof options !== 'object') {
    throw new TypeError('Expected options to be an object.');
  }

  if (typeof options.dryRun !== 'boolean') {
    throw new TypeError('Expected options.dryRun to be a boolean.');
  }

  assertStringArray(options.deletedDirectories, 'options.deletedDirectories');
  assertStringArray(options.deletedFiles, 'options.deletedFiles');

  const deletedDirectories = sortedStringArray(options.deletedDirectories);
  const deletedFiles = sortedStringArray(options.deletedFiles);
  const removedCount = deletedDirectories.length + deletedFiles.length;

  return {
    ...buildArtifactSummaryMetadata(CLEAN_ARTIFACT_SUMMARY_TOOL, { timestampMs: options.timestampMs }),
    mode: options.dryRun ? 'dry-run' : 'apply',
    removedCount,
    hasRemovals: removedCount > 0,
    deletedDirectoryCount: deletedDirectories.length,
    deletedFileCount: deletedFiles.length,
    deletedDirectories,
    deletedFiles,
  };
}

/**
 * @param {{
 *   allowGeneratedEdits: boolean;
 *   isValid: boolean;
 *   blockedPaths: string[];
 *   stagedPathCount: number;
 *   timestampMs?: number;
 * }} options
 */
export function buildGuardArtifactSummary(options) {
  if (options === null || typeof options !== 'object') {
    throw new TypeError('Expected options to be an object.');
  }

  if (typeof options.allowGeneratedEdits !== 'boolean') {
    throw new TypeError('Expected options.allowGeneratedEdits to be a boolean.');
  }

  if (typeof options.isValid !== 'boolean') {
    throw new TypeError('Expected options.isValid to be a boolean.');
  }

  assertStringArray(options.blockedPaths, 'options.blockedPaths');
  const blockedPaths = sortedStringArray(options.blockedPaths);

  if (!Number.isInteger(options.stagedPathCount) || options.stagedPathCount < 0) {
    throw new TypeError('Expected options.stagedPathCount to be a non-negative integer.');
  }

  if (blockedPaths.length > options.stagedPathCount) {
    throw new RangeError('Expected options.stagedPathCount to be >= blocked path count.');
  }

  if (options.isValid && blockedPaths.length > 0) {
    throw new RangeError('Expected valid guard summaries to contain zero blocked paths.');
  }

  return {
    ...buildArtifactSummaryMetadata(GUARD_ARTIFACT_SUMMARY_TOOL, { timestampMs: options.timestampMs }),
    allowGeneratedEdits: options.allowGeneratedEdits,
    isValid: options.isValid,
    blockedPaths,
    blockedPathCount: blockedPaths.length,
    hasBlockedPaths: blockedPaths.length > 0,
    stagedPathCount: options.stagedPathCount,
  };
}

/**
 * @param {Record<string, unknown>} environment
 */
export function resolveArtifactSummaryTimestampOverride(environment) {
  if (environment === null || typeof environment !== 'object') {
    throw new TypeError('Expected environment to be an object.');
  }

  const rawTimestamp = environment[ARTIFACT_SUMMARY_TIMESTAMP_ENV_NAME];
  if (rawTimestamp === undefined) {
    return undefined;
  }

  if (typeof rawTimestamp !== 'string') {
    throw new TypeError(`Expected ${ARTIFACT_SUMMARY_TIMESTAMP_ENV_NAME} to be a string when provided.`);
  }

  const normalizedTimestamp = rawTimestamp.trim();
  if (!/^[0-9]+$/u.test(normalizedTimestamp)) {
    throw new Error(`${ARTIFACT_SUMMARY_TIMESTAMP_ENV_NAME} must be a positive integer when provided.`);
  }

  const parsedTimestamp = Number(normalizedTimestamp);
  if (!Number.isSafeInteger(parsedTimestamp) || parsedTimestamp <= 0) {
    throw new Error(`${ARTIFACT_SUMMARY_TIMESTAMP_ENV_NAME} must be a positive integer when provided.`);
  }

  return parsedTimestamp;
}
