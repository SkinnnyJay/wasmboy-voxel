const SHORTCUT_SCAN_CODES = {
  'open-devtools': {
    default: ['ControlLeft', 'ShiftLeft', 'KeyI'],
    darwin: ['MetaLeft', 'AltLeft', 'KeyI'],
  },
  'reload-page': {
    default: ['ControlLeft', 'KeyR'],
    darwin: ['MetaLeft', 'KeyR'],
  },
  'hard-reload-page': {
    default: ['ControlLeft', 'ShiftLeft', 'KeyR'],
    darwin: ['MetaLeft', 'ShiftLeft', 'KeyR'],
  },
  'focus-address-bar': {
    default: ['ControlLeft', 'KeyL'],
    darwin: ['MetaLeft', 'KeyL'],
  },
};

const SCAN_CODE_TO_NUTJS_KEY_NAME = {
  ControlLeft: 'LeftControl',
  ShiftLeft: 'LeftShift',
  MetaLeft: 'LeftSuper',
  AltLeft: 'LeftAlt',
  KeyI: 'I',
  KeyL: 'L',
  KeyR: 'R',
};

/**
 * @param {string} platform
 */
function normalizePlatform(platform) {
  if (platform === 'darwin') {
    return 'darwin';
  }
  return 'default';
}

/**
 * @param {string} shortcutName
 */
function resolveShortcutEntry(shortcutName) {
  if (typeof shortcutName !== 'string' || shortcutName.trim().length === 0) {
    throw new TypeError('[nutjs:keyboard-map] Expected shortcutName to be a non-empty string.');
  }

  const normalizedShortcut = shortcutName.trim();
  const shortcutEntry = SHORTCUT_SCAN_CODES[normalizedShortcut];
  if (!shortcutEntry) {
    throw new Error(`[nutjs:keyboard-map] Unknown shortcut "${normalizedShortcut}".`);
  }
  return shortcutEntry;
}

/**
 * @param {string} shortcutName
 * @param {string} [platform]
 */
export function resolveNutjsShortcutScanCodes(shortcutName, platform = process.platform) {
  if (typeof platform !== 'string' || platform.length === 0) {
    throw new TypeError('[nutjs:keyboard-map] Expected platform to be a non-empty string.');
  }

  const shortcutEntry = resolveShortcutEntry(shortcutName);
  const platformBucket = normalizePlatform(platform);
  const scanCodes = shortcutEntry[platformBucket] ?? shortcutEntry.default;
  return [...scanCodes];
}

/**
 * @param {string[]} scanCodes
 */
export function mapScanCodesToNutjsKeyNames(scanCodes) {
  if (!Array.isArray(scanCodes)) {
    throw new TypeError('[nutjs:keyboard-map] Expected scanCodes to be an array.');
  }

  return scanCodes.map((scanCode, index) => {
    if (typeof scanCode !== 'string' || scanCode.length === 0) {
      throw new TypeError(`[nutjs:keyboard-map] Expected scanCodes[${String(index)}] to be a non-empty string.`);
    }

    const nutjsKeyName = SCAN_CODE_TO_NUTJS_KEY_NAME[scanCode];
    if (!nutjsKeyName) {
      throw new Error(`[nutjs:keyboard-map] No NutJS key mapping defined for scan code "${scanCode}".`);
    }

    return nutjsKeyName;
  });
}

/**
 * @param {string} shortcutName
 * @param {string} [platform]
 */
export function resolveNutjsShortcutKeyNames(shortcutName, platform = process.platform) {
  const scanCodes = resolveNutjsShortcutScanCodes(shortcutName, platform);
  return mapScanCodesToNutjsKeyNames(scanCodes);
}
