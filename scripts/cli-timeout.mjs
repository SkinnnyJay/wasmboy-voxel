/**
 * @param {{name: string; rawValue: string | undefined; defaultValue: number}} options
 */
export function resolveStrictPositiveIntegerEnv(options) {
  const { name, rawValue, defaultValue } = options;
  if (rawValue === undefined || rawValue.length === 0) {
    return defaultValue;
  }

  const normalizedTimeout = rawValue.trim();
  if (!/^\d+$/u.test(normalizedTimeout)) {
    throw new Error(`Invalid ${name} value: ${rawValue}`);
  }

  const parsedTimeout = Number.parseInt(normalizedTimeout, 10);
  if (!Number.isFinite(parsedTimeout) || parsedTimeout <= 0) {
    throw new Error(`Invalid ${name} value: ${rawValue}`);
  }

  return parsedTimeout;
}
