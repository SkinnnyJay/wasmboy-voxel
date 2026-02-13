const SHORT_FLAG_TOKEN_PATTERN = /^-[a-zA-Z]$/u;

/**
 * @param {string} flagName
 */
function createMissingValueError(flagName) {
  return new Error(`Missing value for ${flagName} argument.`);
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
  const value = argv[index + 1];
  validateRequiredArgumentValue(value, options);
  return value;
}
