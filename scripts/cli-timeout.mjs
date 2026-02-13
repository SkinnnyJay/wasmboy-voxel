const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * @param {string} name
 * @param {number} defaultValue
 */
function assertValidDefaultValue(name, defaultValue) {
  if (!Number.isFinite(defaultValue) || !Number.isSafeInteger(defaultValue) || defaultValue <= 0 || defaultValue > MAX_TIMEOUT_MS) {
    throw new Error(`Invalid default value for ${name}: ${defaultValue}`);
  }
}

/**
 * @param {{name: string; rawValue: string | undefined; defaultValue: number}} options
 */
export function resolveStrictPositiveIntegerEnv(options) {
  const { name, rawValue, defaultValue } = options;
  assertValidDefaultValue(name, defaultValue);

  if (rawValue === undefined || rawValue.length === 0) {
    return defaultValue;
  }

  const normalizedTimeout = rawValue.trim();
  if (!/^\d+$/u.test(normalizedTimeout)) {
    throw new Error(`Invalid ${name} value: ${rawValue}`);
  }

  const parsedTimeout = Number.parseInt(normalizedTimeout, 10);
  if (!Number.isFinite(parsedTimeout) || !Number.isSafeInteger(parsedTimeout) || parsedTimeout <= 0) {
    throw new Error(`Invalid ${name} value: ${rawValue}`);
  }

  if (parsedTimeout > MAX_TIMEOUT_MS) {
    throw new Error(`Invalid ${name} value: ${rawValue}`);
  }

  return parsedTimeout;
}

/**
 * @param {{
 *   defaultValue: number;
 *   env: {name: string; rawValue: string | undefined};
 *   cli: {name: string; rawValue: string | undefined};
 * }} options
 */
export function resolveTimeoutFromCliAndEnv(options) {
  const envTimeout = resolveStrictPositiveIntegerEnv({
    name: options.env.name,
    rawValue: options.env.rawValue,
    defaultValue: options.defaultValue,
  });

  return resolveStrictPositiveIntegerEnv({
    name: options.cli.name,
    rawValue: options.cli.rawValue,
    defaultValue: envTimeout,
  });
}
