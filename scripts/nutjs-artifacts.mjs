const DEFAULT_ARTIFACT_LANE = 'local';
const DEFAULT_ARTIFACT_RUN_ID = 'manual';
const DEFAULT_ARTIFACT_SEQUENCE = 1;
const DEFAULT_MAX_RETAINED_ARTIFACTS = 20;

/**
 * @param {string} rawValue
 * @param {string} tokenName
 */
function sanitizeArtifactToken(rawValue, tokenName) {
  if (typeof rawValue !== 'string' || rawValue.trim().length === 0) {
    throw new TypeError(`[nutjs:artifacts] Expected ${tokenName} to be a non-empty string.`);
  }
  return rawValue
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+/u, '')
    .replace(/-+$/u, '');
}

/**
 * @param {Record<string, unknown>} environment
 */
export function resolveNutjsArtifactTimestamp(environment = process.env) {
  if (environment === null || typeof environment !== 'object') {
    throw new TypeError('[nutjs:artifacts] Expected environment to be an object.');
  }

  const rawOverride = environment.NUTJS_ARTIFACT_TIMESTAMP_MS;
  if (rawOverride === undefined || rawOverride === null || String(rawOverride).trim().length === 0) {
    return Date.now();
  }

  const parsedTimestamp = Number(String(rawOverride).trim());
  if (!Number.isInteger(parsedTimestamp) || parsedTimestamp <= 0) {
    throw new Error(`[nutjs:artifacts] Invalid NUTJS_ARTIFACT_TIMESTAMP_MS value: ${String(rawOverride)}`);
  }
  return parsedTimestamp;
}

/**
 * @param {{
 *   scenario: string;
 *   platform: string;
 *   lane?: string;
 *   runId?: string;
 *   sequence?: number;
 *   timestampMs?: number;
 }} options
 */
export function buildNutjsArtifactNames(options) {
  if (options === null || typeof options !== 'object') {
    throw new TypeError('[nutjs:artifacts] Expected options to be an object.');
  }

  const scenario = sanitizeArtifactToken(options.scenario, 'options.scenario');
  const platform = sanitizeArtifactToken(options.platform, 'options.platform');
  const lane = sanitizeArtifactToken(options.lane ?? DEFAULT_ARTIFACT_LANE, 'options.lane');
  const runId = sanitizeArtifactToken(options.runId ?? DEFAULT_ARTIFACT_RUN_ID, 'options.runId');
  const sequence = options.sequence ?? DEFAULT_ARTIFACT_SEQUENCE;
  if (!Number.isInteger(sequence) || sequence <= 0) {
    throw new TypeError('[nutjs:artifacts] Expected options.sequence to be a positive integer when provided.');
  }
  const timestampMs = options.timestampMs ?? Date.now();
  if (!Number.isInteger(timestampMs) || timestampMs <= 0) {
    throw new TypeError('[nutjs:artifacts] Expected options.timestampMs to be a positive integer when provided.');
  }

  const sequenceToken = String(sequence).padStart(4, '0');
  const baseName = `nutjs-${scenario}-${platform}-${lane}-${runId}-${String(timestampMs)}-${sequenceToken}`;
  return {
    baseName,
    screenshot: `${baseName}.png`,
    video: `${baseName}.webm`,
    trace: `${baseName}.jsonl`,
  };
}

/**
 * @param {string} artifactFileName
 */
function extractArtifactSortKey(artifactFileName) {
  const match = /-(\d+)-(\d{4})\.[a-z0-9]+$/u.exec(artifactFileName);
  if (!match) {
    return {
      timestampMs: 0,
      sequence: 0,
    };
  }
  return {
    timestampMs: Number(match[1]),
    sequence: Number(match[2]),
  };
}

/**
 * @param {string[]} artifactFileNames
 * @param {number} [maxRetainedArtifacts]
 */
export function selectNutjsArtifactsForRetention(artifactFileNames, maxRetainedArtifacts = DEFAULT_MAX_RETAINED_ARTIFACTS) {
  if (!Array.isArray(artifactFileNames)) {
    throw new TypeError('[nutjs:artifacts] Expected artifactFileNames to be an array.');
  }
  if (!Number.isInteger(maxRetainedArtifacts) || maxRetainedArtifacts <= 0) {
    throw new TypeError('[nutjs:artifacts] Expected maxRetainedArtifacts to be a positive integer when provided.');
  }

  const normalizedFileNames = artifactFileNames.map((artifactFileName, index) => {
    if (typeof artifactFileName !== 'string' || artifactFileName.trim().length === 0) {
      throw new TypeError(`[nutjs:artifacts] Expected artifactFileNames[${String(index)}] to be a non-empty string.`);
    }
    return artifactFileName.trim();
  });

  const sortedFileNames = [...new Set(normalizedFileNames)].sort((left, right) => {
    const leftSortKey = extractArtifactSortKey(left);
    const rightSortKey = extractArtifactSortKey(right);
    if (leftSortKey.timestampMs !== rightSortKey.timestampMs) {
      return rightSortKey.timestampMs - leftSortKey.timestampMs;
    }
    if (leftSortKey.sequence !== rightSortKey.sequence) {
      return rightSortKey.sequence - leftSortKey.sequence;
    }
    return left.localeCompare(right);
  });

  return {
    keep: sortedFileNames.slice(0, maxRetainedArtifacts),
    prune: sortedFileNames.slice(maxRetainedArtifacts),
  };
}
