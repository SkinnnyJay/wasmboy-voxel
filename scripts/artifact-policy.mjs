import path from 'node:path';

export const BLOCKED_ARTIFACT_PREFIXES = ['dist/', 'build/'];
const BLOCKED_INTEGRATION_OUTPUT_PREFIX = 'test/integration/';
const BLOCKED_ACCURACY_OUTPUT_PREFIX = 'test/accuracy/testroms/';
const BLOCKED_PERFORMANCE_OUTPUT_PREFIX = 'test/performance/testroms/';
const POLICY_PATH_ANCHORS = [
  ...BLOCKED_ARTIFACT_PREFIXES,
  BLOCKED_INTEGRATION_OUTPUT_PREFIX,
  BLOCKED_ACCURACY_OUTPUT_PREFIX,
  BLOCKED_PERFORMANCE_OUTPUT_PREFIX,
];

/**
 * @param {unknown} candidatePath
 * @param {string} parameterName
 */
function assertPathString(candidatePath, parameterName) {
  if (typeof candidatePath !== 'string') {
    throw new TypeError(`[artifact-policy] Expected ${parameterName} to be a string path.`);
  }
}

/**
 * @param {string} candidatePath
 */
export function normalizeArtifactPath(candidatePath) {
  assertPathString(candidatePath, 'candidatePath');
  const normalizedPath = candidatePath
    .trim()
    .replace(/^\\\\\?\\?/u, '')
    .replaceAll('\\', '/')
    .replace(/^[A-Za-z]:\//u, '/')
    .split(path.sep)
    .join('/');
  const normalizedPosixPath = path.posix.normalize(normalizedPath);
  if (normalizedPosixPath === '.') {
    return '';
  }
  return normalizedPosixPath.replace(/^\.?\//u, '').replace(/^\/+/u, '');
}

/**
 * @param {string} normalizedPath
 */
function toPolicyRelativePath(normalizedPath) {
  const lowerPath = normalizedPath.toLowerCase();

  for (const anchor of POLICY_PATH_ANCHORS) {
    const lowerAnchor = anchor.toLowerCase();
    const anchorIndex = lowerPath.indexOf(lowerAnchor);
    if (anchorIndex === 0) {
      return normalizedPath;
    }
    if (anchorIndex > 0 && normalizedPath[anchorIndex - 1] === '/') {
      return normalizedPath.slice(anchorIndex);
    }
  }

  return normalizedPath;
}

/**
 * @param {string} candidatePath
 */
function isIntegrationGeneratedOutput(candidatePath) {
  const lowerPath = candidatePath.toLowerCase();
  return lowerPath.startsWith(BLOCKED_INTEGRATION_OUTPUT_PREFIX) && (lowerPath.endsWith('.output') || lowerPath.endsWith('.output.png'));
}

/**
 * @param {string} candidatePath
 */
function isAccuracyGeneratedOutput(candidatePath) {
  const lowerPath = candidatePath.toLowerCase();
  if (!lowerPath.startsWith(BLOCKED_ACCURACY_OUTPUT_PREFIX)) {
    return false;
  }

  if (lowerPath.endsWith('.output')) {
    return !lowerPath.endsWith('.golden.output');
  }

  if (lowerPath.endsWith('.png')) {
    return !lowerPath.endsWith('.golden.png');
  }

  return false;
}

/**
 * @param {string} candidatePath
 */
function isPerformanceGeneratedOutput(candidatePath) {
  const lowerPath = candidatePath.toLowerCase();
  if (!lowerPath.startsWith(BLOCKED_PERFORMANCE_OUTPUT_PREFIX)) {
    return false;
  }

  if (lowerPath.endsWith('.png')) {
    return !lowerPath.endsWith('.noperformanceoptions.png');
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
  assertPathString(relativePath, 'relativePath');
  const normalizedPath = toPolicyRelativePath(normalizeArtifactPath(relativePath));
  return matchesGeneratedArtifactPolicy(normalizedPath);
}

/**
 * @param {string} stagedPath
 */
export function shouldBlockStagedArtifactPath(stagedPath) {
  assertPathString(stagedPath, 'stagedPath');
  const normalizedPath = toPolicyRelativePath(normalizeArtifactPath(stagedPath));
  const normalizedLowerPath = normalizedPath.toLowerCase();
  return BLOCKED_ARTIFACT_PREFIXES.some(prefix => normalizedLowerPath.startsWith(prefix)) || matchesGeneratedArtifactPolicy(normalizedPath);
}
