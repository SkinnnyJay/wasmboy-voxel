/**
 * @param {unknown} rawOverride
 */
function normalizeBackendOverride(rawOverride) {
  if (rawOverride === undefined || rawOverride === null) {
    return 'auto';
  }

  if (typeof rawOverride !== 'string') {
    throw new TypeError('[nutjs:linux-display] Expected NUTJS_LINUX_DISPLAY_BACKEND to be a string when provided.');
  }

  const normalizedOverride = rawOverride.trim().toLowerCase();
  if (normalizedOverride.length === 0 || normalizedOverride === 'auto') {
    return 'auto';
  }

  if (normalizedOverride === 'x11' || normalizedOverride === 'wayland') {
    return normalizedOverride;
  }

  throw new Error(`[nutjs:linux-display] Invalid NUTJS_LINUX_DISPLAY_BACKEND value: ${rawOverride}`);
}

/**
 * @param {Record<string, unknown>} environment
 */
function hasDisplayVariable(environment, variableName) {
  const value = environment[variableName];
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * @param {Record<string, unknown>} environment
 */
function isWaylandEnabled(environment) {
  const rawValue = environment.NUTJS_ENABLE_WAYLAND;
  if (typeof rawValue !== 'string') {
    return false;
  }
  return rawValue.trim() === '1';
}

/**
 * @param {{
 *   env?: Record<string, unknown>;
 * }} [options]
 */
export function resolveNutjsLinuxDisplayStrategy(options = {}) {
  if (options === null || typeof options !== 'object') {
    throw new TypeError('[nutjs:linux-display] Expected options to be an object.');
  }

  if (options.env !== undefined && (options.env === null || typeof options.env !== 'object')) {
    throw new TypeError('[nutjs:linux-display] Expected options.env to be an object when provided.');
  }

  const environment = options.env ?? process.env;
  const backendOverride = normalizeBackendOverride(environment.NUTJS_LINUX_DISPLAY_BACKEND);
  const hasX11Display = hasDisplayVariable(environment, 'DISPLAY');
  const hasWaylandDisplay = hasDisplayVariable(environment, 'WAYLAND_DISPLAY');
  const waylandEnabled = isWaylandEnabled(environment);
  const detectedBackends = [...(hasX11Display ? ['x11'] : []), ...(hasWaylandDisplay ? ['wayland'] : [])];

  /**
   * @param {string[]} reasons
   * @param {'x11' | 'wayland' | 'xvfb'} fallback
   */
  const unsupportedResult = (reasons, fallback) => ({
    isSupported: false,
    selectedBackend: null,
    fallbackBackend: fallback,
    reasons,
    backendOverride,
    detectedBackends,
    hasX11Display,
    hasWaylandDisplay,
    waylandEnabled,
  });

  if (backendOverride === 'x11') {
    if (hasX11Display) {
      return {
        isSupported: true,
        selectedBackend: 'x11',
        fallbackBackend: 'x11',
        reasons: [],
        backendOverride,
        detectedBackends,
        hasX11Display,
        hasWaylandDisplay,
        waylandEnabled,
      };
    }
    return unsupportedResult(['linux-x11-display-missing'], 'xvfb');
  }

  if (backendOverride === 'wayland') {
    if (!hasWaylandDisplay) {
      return unsupportedResult(['linux-wayland-display-missing'], hasX11Display ? 'x11' : 'xvfb');
    }
    if (!waylandEnabled) {
      return unsupportedResult(['linux-wayland-disabled'], hasX11Display ? 'x11' : 'xvfb');
    }
    return {
      isSupported: true,
      selectedBackend: 'wayland',
      fallbackBackend: hasX11Display ? 'x11' : 'wayland',
      reasons: [],
      backendOverride,
      detectedBackends,
      hasX11Display,
      hasWaylandDisplay,
      waylandEnabled,
    };
  }

  if (hasX11Display) {
    return {
      isSupported: true,
      selectedBackend: 'x11',
      fallbackBackend: 'x11',
      reasons: [],
      backendOverride,
      detectedBackends,
      hasX11Display,
      hasWaylandDisplay,
      waylandEnabled,
    };
  }

  if (hasWaylandDisplay) {
    if (waylandEnabled) {
      return {
        isSupported: true,
        selectedBackend: 'wayland',
        fallbackBackend: 'wayland',
        reasons: [],
        backendOverride,
        detectedBackends,
        hasX11Display,
        hasWaylandDisplay,
        waylandEnabled,
      };
    }
    return unsupportedResult(['linux-wayland-disabled'], 'xvfb');
  }

  return unsupportedResult(['linux-display-unavailable'], 'xvfb');
}
