import path from 'node:path';

export const BLOCKED_ARTIFACT_PREFIXES = ['dist/', 'build/'];
const BLOCKED_INTEGRATION_OUTPUT_PREFIX = 'test/integration/';
const BLOCKED_ACCURACY_OUTPUT_PREFIX = 'test/accuracy/testroms/';
const BLOCKED_PERFORMANCE_OUTPUT_PREFIX = 'test/performance/testroms/';

/**
 * @param {string} candidatePath
 */
export function normalizeArtifactPath(candidatePath) {
  return candidatePath
    .replaceAll('\\', '/')
    .split(path.sep)
    .join('/')
    .replace(/^\.?\//u, '');
}

/**
 * @param {string} candidatePath
 */
function isIntegrationGeneratedOutput(candidatePath) {
  return (
    candidatePath.startsWith(BLOCKED_INTEGRATION_OUTPUT_PREFIX) &&
    (candidatePath.endsWith('.output') || candidatePath.endsWith('.output.png'))
  );
}

/**
 * @param {string} candidatePath
 */
function isAccuracyGeneratedOutput(candidatePath) {
  if (!candidatePath.startsWith(BLOCKED_ACCURACY_OUTPUT_PREFIX)) {
    return false;
  }

  if (candidatePath.endsWith('.output')) {
    return !candidatePath.endsWith('.golden.output');
  }

  if (candidatePath.endsWith('.png')) {
    return !candidatePath.endsWith('.golden.png');
  }

  return false;
}

/**
 * @param {string} candidatePath
 */
function isPerformanceGeneratedOutput(candidatePath) {
  if (!candidatePath.startsWith(BLOCKED_PERFORMANCE_OUTPUT_PREFIX)) {
    return false;
  }

  if (candidatePath.endsWith('.png')) {
    return !candidatePath.endsWith('.noPerformanceOptions.png');
  }

  return false;
}

/**
 * @param {string} normalizedPath
 */
function matchesGeneratedArtifactPolicy(normalizedPath) {
  return (
    isIntegrationGeneratedOutput(normalizedPath) ||
    isAccuracyGeneratedOutput(normalizedPath) ||
    isPerformanceGeneratedOutput(normalizedPath)
  );
}

/**
 * @param {string} relativePath
 */
export function shouldRemoveGeneratedFile(relativePath) {
  const normalizedPath = normalizeArtifactPath(relativePath);
  return matchesGeneratedArtifactPolicy(normalizedPath);
}

/**
 * @param {string} stagedPath
 */
export function shouldBlockStagedArtifactPath(stagedPath) {
  const normalizedPath = normalizeArtifactPath(stagedPath);
  return BLOCKED_ARTIFACT_PREFIXES.some(prefix => normalizedPath.startsWith(prefix)) || matchesGeneratedArtifactPolicy(normalizedPath);
}
