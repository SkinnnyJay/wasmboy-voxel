/**
 * @param {Record<string, unknown>} environment
 * @param {string} variableName
 */
function readBooleanFlag(environment, variableName) {
  const rawValue = environment[variableName];
  if (rawValue === undefined || rawValue === null) {
    return null;
  }

  if (typeof rawValue !== 'string') {
    throw new TypeError(`[nutjs:macos-permissions] Expected ${variableName} to be a string when provided.`);
  }

  const normalizedValue = rawValue.trim();
  if (normalizedValue === '1' || normalizedValue.toLowerCase() === 'true') {
    return true;
  }
  if (normalizedValue === '0' || normalizedValue.toLowerCase() === 'false') {
    return false;
  }

  throw new Error(`[nutjs:macos-permissions] Invalid ${variableName} value: ${rawValue}`);
}

/**
 * @param {{
 *   platform?: string;
 *   env?: Record<string, unknown>;
 * }} [options]
 */
export function resolveNutjsMacOsPermissionState(options = {}) {
  if (options === null || typeof options !== 'object') {
    throw new TypeError('[nutjs:macos-permissions] Expected options to be an object.');
  }

  if (options.platform !== undefined && typeof options.platform !== 'string') {
    throw new TypeError('[nutjs:macos-permissions] Expected options.platform to be a string when provided.');
  }

  if (options.env !== undefined && (options.env === null || typeof options.env !== 'object')) {
    throw new TypeError('[nutjs:macos-permissions] Expected options.env to be an object when provided.');
  }

  const platform = options.platform ?? process.platform;
  const environment = options.env ?? process.env;

  if (platform !== 'darwin') {
    return {
      platform,
      isSupported: true,
      required: false,
      reasons: [],
      retryHints: [],
      trusted: true,
    };
  }

  const trustedOverride = readBooleanFlag(environment, 'NUTJS_MACOS_ACCESSIBILITY_TRUSTED');
  const promptSuggested = readBooleanFlag(environment, 'NUTJS_MACOS_ACCESSIBILITY_PROMPT_SUGGESTED');
  const trusted = trustedOverride ?? false;

  if (trusted) {
    return {
      platform,
      isSupported: true,
      required: true,
      reasons: [],
      retryHints: [],
      trusted: true,
    };
  }

  const retryHints = [
    'Open System Settings → Privacy & Security → Accessibility.',
    'Enable accessibility access for your terminal/CI agent process.',
    'Re-run with NUTJS_MACOS_ACCESSIBILITY_TRUSTED=1 once access is granted.',
  ];
  if (promptSuggested === true) {
    retryHints.unshift('Trigger a one-time accessibility prompt by running a local dry-run action first.');
  }

  return {
    platform,
    isSupported: false,
    required: true,
    reasons: ['macos-accessibility-untrusted'],
    retryHints,
    trusted: false,
  };
}
