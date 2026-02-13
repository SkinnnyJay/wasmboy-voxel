const SHORT_FLAG_TOKEN_PATTERN = /^-[a-zA-Z]$/u;

/**
 * @param {unknown} value
 */
function formatErrorValue(value) {
  try {
    return String(value);
  } catch {
    return '[unprintable]';
  }
}

/**
 * @param {unknown} flagName
 */
function createMissingValueError(flagName) {
  return new Error(`Missing value for ${formatErrorValue(flagName)} argument.`);
}

/**
 * @param {RequiredArgumentValueOptions} options
 */
function assertValidRequiredArgumentValueOptions(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('Invalid required argument options.');
  }

  if (typeof options.flagName !== 'string' || options.flagName.trim().length === 0) {
    throw new Error(`Invalid flag name: ${formatErrorValue(options.flagName)}`);
  }

  if (!(options.knownArgs instanceof Set)) {
    throw new Error(`Invalid known-args set for ${options.flagName}`);
  }
  assertStringSetValues('known-args', options.knownArgs, options.flagName);

  if (typeof options.allowDoubleDashValue !== 'boolean') {
    throw new Error(`Invalid allowDoubleDashValue option for ${options.flagName}`);
  }

  if (options.allowWhitespaceOnly !== undefined && typeof options.allowWhitespaceOnly !== 'boolean') {
    throw new Error(`Invalid allowWhitespaceOnly option for ${options.flagName}`);
  }

  if (options.allowedKnownValues !== undefined && !(options.allowedKnownValues instanceof Set)) {
    throw new Error(`Invalid allowedKnownValues set for ${options.flagName}`);
  }

  if (options.allowedKnownValues) {
    assertStringSetValues('allowedKnownValues', options.allowedKnownValues, options.flagName);
  }
}

/**
 * @param {string} optionName
 * @param {Set<unknown>} values
 * @param {string} flagName
 */
function assertStringSetValues(optionName, values, flagName) {
  for (const value of values) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`Invalid ${optionName} entries for ${formatErrorValue(flagName)}`);
    }
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

  if (value !== undefined && typeof value !== 'string') {
    throw new Error(`Invalid value type for ${options.flagName} argument: ${formatErrorValue(value)}`);
  }

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
    throw new Error(`Invalid argument index for ${options.flagName}: ${formatErrorValue(index)}`);
  }

  const value = argv[index + 1];
  validateRequiredArgumentValue(value, options);
  return value;
}
