const SHORT_FLAG_TOKEN_PATTERN = /^-[a-zA-Z]$/u;

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
    throw new Error(`Missing value for ${options.flagName} argument.`);
  }

  if (!options.allowWhitespaceOnly && value.trim().length === 0) {
    throw new Error(`Missing value for ${options.flagName} argument.`);
  }

  if (!options.allowDoubleDashValue && value.startsWith('--')) {
    throw new Error(`Missing value for ${options.flagName} argument.`);
  }

  if (!options.allowDoubleDashValue && SHORT_FLAG_TOKEN_PATTERN.test(value)) {
    throw new Error(`Missing value for ${options.flagName} argument.`);
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
