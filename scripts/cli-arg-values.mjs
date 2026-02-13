const SHORT_FLAG_TOKEN_PATTERN = /^-[a-zA-Z]$/u;

/**
 * @param {string} flagName
 */
function createMissingValueError(flagName) {
  return new Error(`Missing value for ${flagName} argument.`);
}

/**
 * @param {RequiredArgumentValueOptions} options
 */
function assertValidRequiredArgumentValueOptions(options) {
  if (typeof options.flagName !== 'string' || options.flagName.trim().length === 0) {
    throw new Error(`Invalid flag name: ${options.flagName}`);
  }

  if (!(options.knownArgs instanceof Set)) {
    throw new Error(`Invalid known-args set for ${options.flagName}`);
  }

  if (typeof options.allowDoubleDashValue !== 'boolean') {
    throw new Error(`Invalid allowDoubleDashValue option for ${options.flagName}`);
  }

  if (options.allowWhitespaceOnly !== undefined && typeof options.allowWhitespaceOnly !== 'boolean') {
    throw new Error(`Invalid allowWhitespaceOnly option for ${options.flagName}`);
  }

  if (options.allowedKnownValues !== undefined && !(options.allowedKnownValues instanceof Set)) {
    throw new Error(`Invalid allowedKnownValues set for ${options.flagName}`);
  }
}

/**
 * @typedef {{
 *   flagName: string;
 *   knownArgs: Set<string>;
 *   allowDoubleDashValue: boolean;
 *   allowWhitespaceOnly?: boolean;
 *   allowedKnownValues?: Set<string>;
 * }} RequiredArgumentValueOptions
 */

/**
 * @param {string | undefined} value
 * @param {RequiredArgumentValueOptions} options
 */
export function validateRequiredArgumentValue(value, options) {
  assertValidRequiredArgumentValueOptions(options);

  const isKnownToken = value ? options.knownArgs.has(value) : false;
  const isAllowedKnownValue = Boolean(value && options.allowedKnownValues?.has(value));

  if (!value || (isKnownToken && !isAllowedKnownValue)) {
    throw createMissingValueError(options.flagName);
  }

  if (!options.allowWhitespaceOnly && value.trim().length === 0) {
    throw createMissingValueError(options.flagName);
  }

  if (!options.allowDoubleDashValue && value.startsWith('--')) {
    throw createMissingValueError(options.flagName);
  }

  if (!options.allowDoubleDashValue && SHORT_FLAG_TOKEN_PATTERN.test(value)) {
    throw createMissingValueError(options.flagName);
  }
}

/**
 * @param {string[]} argv
 * @param {number} index
 * @param {RequiredArgumentValueOptions} options
 */
export function readRequiredArgumentValue(argv, index, options) {
  assertValidRequiredArgumentValueOptions(options);

  if (!Array.isArray(argv)) {
    throw new Error(`Invalid argv array for ${options.flagName}`);
  }

  if (!Number.isSafeInteger(index) || index < 0) {
    throw new Error(`Invalid argument index for ${options.flagName}: ${index}`);
  }

  const value = argv[index + 1];
  validateRequiredArgumentValue(value, options);
  return value;
}
