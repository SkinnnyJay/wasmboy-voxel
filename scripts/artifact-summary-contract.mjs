export const ARTIFACT_SUMMARY_SCHEMA_VERSION = 1;
export const CLEAN_ARTIFACT_SUMMARY_TOOL = 'clean:artifacts';
export const GUARD_ARTIFACT_SUMMARY_TOOL = 'guard:generated-artifacts';

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

  return {
    tool,
    schemaVersion: ARTIFACT_SUMMARY_SCHEMA_VERSION,
    timestampMs,
  };
}
