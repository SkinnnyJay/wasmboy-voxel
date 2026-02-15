const DEFAULT_DPI_SCALE = 1;

/**
 * @param {unknown} rawValue
 * @param {string} variableName
 */
function parseScaleValue(rawValue, variableName) {
  if (rawValue === undefined || rawValue === null) {
    return null;
  }

  if (typeof rawValue !== 'string') {
    throw new TypeError(`[nutjs:display-scale] Expected ${variableName} to be a string when provided.`);
  }

  const trimmedValue = rawValue.trim();
  if (trimmedValue.length === 0) {
    return null;
  }

  const parsedScale = Number(trimmedValue);
  if (!Number.isFinite(parsedScale) || parsedScale <= 0) {
    throw new Error(`[nutjs:display-scale] Invalid ${variableName} value: ${trimmedValue}`);
  }

  return parsedScale;
}

/**
 * @param {{
 *   platform?: string;
 *   env?: Record<string, unknown>;
 * }} [options]
 */
export function resolveNutjsDisplayScale(options = {}) {
  if (options === null || typeof options !== 'object') {
    throw new TypeError('[nutjs:display-scale] Expected options to be an object.');
  }

  if (options.platform !== undefined && typeof options.platform !== 'string') {
    throw new TypeError('[nutjs:display-scale] Expected options.platform to be a string when provided.');
  }

  if (options.env !== undefined && (options.env === null || typeof options.env !== 'object')) {
    throw new TypeError('[nutjs:display-scale] Expected options.env to be an object when provided.');
  }

  const platform = options.platform ?? process.platform;
  const environment = options.env ?? process.env;
  const platformScaleKey = platform === 'win32' ? 'NUTJS_WINDOWS_DPI_SCALE' : platform === 'darwin' ? 'NUTJS_MACOS_DPI_SCALE' : null;
  const platformScale = platformScaleKey === null ? null : parseScaleValue(environment[platformScaleKey], platformScaleKey);
  if (platformScale !== null) {
    return {
      platform,
      scale: platformScale,
      source: platformScaleKey,
    };
  }

  const genericScale = parseScaleValue(environment.NUTJS_DPI_SCALE, 'NUTJS_DPI_SCALE');
  if (genericScale !== null) {
    return {
      platform,
      scale: genericScale,
      source: 'NUTJS_DPI_SCALE',
    };
  }

  return {
    platform,
    scale: DEFAULT_DPI_SCALE,
    source: 'default',
  };
}

/**
 * @param {{
 *   x: number;
 *   y: number;
 * }} logicalCoordinate
 * @param {{
 *   platform?: string;
 *   env?: Record<string, unknown>;
 * }} [options]
 */
export function transformNutjsPointerCoordinate(logicalCoordinate, options = {}) {
  if (logicalCoordinate === null || typeof logicalCoordinate !== 'object') {
    throw new TypeError('[nutjs:display-scale] Expected logicalCoordinate to be an object.');
  }

  if (typeof logicalCoordinate.x !== 'number' || !Number.isFinite(logicalCoordinate.x)) {
    throw new TypeError('[nutjs:display-scale] Expected logicalCoordinate.x to be a finite number.');
  }

  if (typeof logicalCoordinate.y !== 'number' || !Number.isFinite(logicalCoordinate.y)) {
    throw new TypeError('[nutjs:display-scale] Expected logicalCoordinate.y to be a finite number.');
  }

  const displayScale = resolveNutjsDisplayScale(options);
  return {
    platform: displayScale.platform,
    scale: displayScale.scale,
    source: displayScale.source,
    x: Math.round(logicalCoordinate.x * displayScale.scale),
    y: Math.round(logicalCoordinate.y * displayScale.scale),
  };
}
