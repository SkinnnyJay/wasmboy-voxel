import { resolveNutjsLinuxDisplayStrategy } from './nutjs-linux-display.mjs';

const DEFAULT_THRESHOLDS = {
  'linux-x11': 0.93,
  'linux-wayland': 0.9,
  win32: 0.92,
  darwin: 0.94,
  default: 0.92,
};

/**
 * @param {unknown} rawValue
 * @param {string} variableName
 */
function parseThreshold(rawValue, variableName) {
  if (rawValue === undefined || rawValue === null) {
    return null;
  }

  if (typeof rawValue !== 'string') {
    throw new TypeError(`[nutjs:image-thresholds] Expected ${variableName} to be a string when provided.`);
  }

  const trimmedValue = rawValue.trim();
  if (trimmedValue.length === 0) {
    return null;
  }

  const thresholdValue = Number(trimmedValue);
  if (!Number.isFinite(thresholdValue) || thresholdValue <= 0 || thresholdValue > 1) {
    throw new Error(`[nutjs:image-thresholds] Invalid ${variableName} value: ${trimmedValue}`);
  }

  return thresholdValue;
}

/**
 * @param {{
 *   platform?: string;
 *   env?: Record<string, unknown>;
 * }} [options]
 */
export function resolveNutjsImageMatchThreshold(options = {}) {
  if (options === null || typeof options !== 'object') {
    throw new TypeError('[nutjs:image-thresholds] Expected options to be an object.');
  }

  if (options.platform !== undefined && typeof options.platform !== 'string') {
    throw new TypeError('[nutjs:image-thresholds] Expected options.platform to be a string when provided.');
  }

  if (options.env !== undefined && (options.env === null || typeof options.env !== 'object')) {
    throw new TypeError('[nutjs:image-thresholds] Expected options.env to be an object when provided.');
  }

  const platform = options.platform ?? process.platform;
  const environment = options.env ?? process.env;
  const globalOverride = parseThreshold(environment.NUTJS_IMAGE_MATCH_THRESHOLD, 'NUTJS_IMAGE_MATCH_THRESHOLD');
  if (globalOverride !== null) {
    return {
      platform,
      profile: 'global',
      threshold: globalOverride,
      source: 'NUTJS_IMAGE_MATCH_THRESHOLD',
    };
  }

  if (platform === 'linux') {
    const linuxDisplayStrategy = resolveNutjsLinuxDisplayStrategy({ env: environment });
    const backendProfile = linuxDisplayStrategy.selectedBackend === 'wayland' ? 'linux-wayland' : 'linux-x11';
    const backendVariableName =
      backendProfile === 'linux-wayland' ? 'NUTJS_IMAGE_MATCH_THRESHOLD_LINUX_WAYLAND' : 'NUTJS_IMAGE_MATCH_THRESHOLD_LINUX_X11';
    const backendOverride = parseThreshold(environment[backendVariableName], backendVariableName);
    if (backendOverride !== null) {
      return {
        platform,
        profile: backendProfile,
        threshold: backendOverride,
        source: backendVariableName,
      };
    }

    return {
      platform,
      profile: backendProfile,
      threshold: DEFAULT_THRESHOLDS[backendProfile],
      source: 'default',
    };
  }

  if (platform === 'darwin') {
    const darwinOverride = parseThreshold(environment.NUTJS_IMAGE_MATCH_THRESHOLD_MACOS, 'NUTJS_IMAGE_MATCH_THRESHOLD_MACOS');
    if (darwinOverride !== null) {
      return {
        platform,
        profile: 'darwin',
        threshold: darwinOverride,
        source: 'NUTJS_IMAGE_MATCH_THRESHOLD_MACOS',
      };
    }
    return {
      platform,
      profile: 'darwin',
      threshold: DEFAULT_THRESHOLDS.darwin,
      source: 'default',
    };
  }

  if (platform === 'win32') {
    const windowsOverride = parseThreshold(environment.NUTJS_IMAGE_MATCH_THRESHOLD_WINDOWS, 'NUTJS_IMAGE_MATCH_THRESHOLD_WINDOWS');
    if (windowsOverride !== null) {
      return {
        platform,
        profile: 'win32',
        threshold: windowsOverride,
        source: 'NUTJS_IMAGE_MATCH_THRESHOLD_WINDOWS',
      };
    }
    return {
      platform,
      profile: 'win32',
      threshold: DEFAULT_THRESHOLDS.win32,
      source: 'default',
    };
  }

  return {
    platform,
    profile: 'default',
    threshold: DEFAULT_THRESHOLDS.default,
    source: 'default',
  };
}
