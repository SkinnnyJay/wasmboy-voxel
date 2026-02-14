import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformNutjsPointerCoordinate } from './nutjs-display-scale.mjs';
import { resolveNutjsShortcutKeyNames, resolveNutjsShortcutScanCodes } from './nutjs-keyboard-layout-map.mjs';
import { resolveNutjsLinuxDisplayStrategy } from './nutjs-linux-display.mjs';
import { resolveNutjsMacOsPermissionState } from './nutjs-macos-permissions.mjs';

const DEFAULT_NUTJS_PACKAGE_NAME = '@nut-tree-fork/nut-js';
const SCRIPT_USAGE = `Usage: node scripts/nutjs-ui-smoke.mjs [--json] [--strict] [--help]\n\nOptions:\n  --json      Emit machine-readable JSON summary.\n  --strict    Fail when NutJS or host capabilities are unavailable.\n  --help, -h  Show this usage message.\n`;

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
 * @param {Record<string, unknown>} environment
 */
function resolveNutjsPackageName(environment) {
  const rawOverride = environment.NUTJS_PACKAGE_NAME;
  if (typeof rawOverride === 'string' && rawOverride.trim().length > 0) {
    return rawOverride.trim();
  }
  return DEFAULT_NUTJS_PACKAGE_NAME;
}

/**
 * @param {{
 *   platform?: string;
 *   env?: Record<string, unknown>;
 *   nutjsModuleAvailable?: boolean;
 * }} [options]
 */
export function resolveNutjsUiCapabilities(options = {}) {
  if (options === null || typeof options !== 'object') {
    throw new TypeError('[nutjs:ui-smoke] Expected options to be an object.');
  }

  if (options.platform !== undefined && typeof options.platform !== 'string') {
    throw new TypeError('[nutjs:ui-smoke] Expected options.platform to be a string when provided.');
  }

  if (options.env !== undefined && (options.env === null || typeof options.env !== 'object')) {
    throw new TypeError('[nutjs:ui-smoke] Expected options.env to be an object when provided.');
  }

  if (options.nutjsModuleAvailable !== undefined && typeof options.nutjsModuleAvailable !== 'boolean') {
    throw new TypeError('[nutjs:ui-smoke] Expected options.nutjsModuleAvailable to be a boolean when provided.');
  }

  const platform = options.platform ?? process.platform;
  const environment = options.env ?? process.env;
  const nutjsModuleAvailable = options.nutjsModuleAvailable ?? true;
  const reasons = [];
  const metadata = {};

  if (!nutjsModuleAvailable) {
    reasons.push('nutjs-module-unavailable');
  }

  if (platform === 'linux') {
    const linuxDisplayStrategy = resolveNutjsLinuxDisplayStrategy({ env: environment });
    metadata.linuxDisplayStrategy = linuxDisplayStrategy;
    if (!linuxDisplayStrategy.isSupported) {
      reasons.push(...linuxDisplayStrategy.reasons);
    }
  }

  if (platform === 'darwin') {
    const macosPermissionState = resolveNutjsMacOsPermissionState({ platform, env: environment });
    metadata.macosPermissionState = macosPermissionState;
    if (!macosPermissionState.isSupported) {
      reasons.push(...macosPermissionState.reasons);
    }
  }

  return {
    platform,
    isSupported: reasons.length === 0,
    reasons,
    metadata,
  };
}

/**
 * @param {{
 *   packageName?: string;
 *   loader?: (specifier: string) => Promise<unknown>;
 * }} [options]
 */
export async function loadNutjsModule(options = {}) {
  if (options === null || typeof options !== 'object') {
    throw new TypeError('[nutjs:ui-smoke] Expected options to be an object.');
  }

  if (options.packageName !== undefined && typeof options.packageName !== 'string') {
    throw new TypeError('[nutjs:ui-smoke] Expected options.packageName to be a string when provided.');
  }

  if (options.loader !== undefined && typeof options.loader !== 'function') {
    throw new TypeError('[nutjs:ui-smoke] Expected options.loader to be a function when provided.');
  }

  const packageName = options.packageName ?? DEFAULT_NUTJS_PACKAGE_NAME;
  const loadModule = options.loader ?? (specifier => import(specifier));

  try {
    const nutjsModule = await loadModule(packageName);
    return {
      packageName,
      nutjsModule,
      loadError: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : formatErrorValue(error);
    return {
      packageName,
      nutjsModule: null,
      loadError: message,
    };
  }
}

/**
 * @param {unknown} nutjsModule
 * @param {string} platform
 * @param {Record<string, unknown>} environment
 */
async function runDefaultSmokeAction(nutjsModule, platform, environment) {
  if (nutjsModule === null || typeof nutjsModule !== 'object') {
    throw new Error('NutJS module did not resolve to an object export.');
  }

  const exportedKeys = Object.keys(nutjsModule);
  if (exportedKeys.length === 0) {
    throw new Error('NutJS module export is empty; expected at least one API key.');
  }

  return {
    exportedKeyCount: exportedKeys.length,
    exportedKeys: exportedKeys.slice(0, 10),
    defaultShortcutAction: 'open-devtools',
    defaultShortcutScanCodes: resolveNutjsShortcutScanCodes('open-devtools', platform),
    defaultShortcutKeyNames: resolveNutjsShortcutKeyNames('open-devtools', platform),
    pointerTransformSample: transformNutjsPointerCoordinate({ x: 320, y: 180 }, { platform, env: environment }),
  };
}

/**
 * @param {{
 *   strict?: boolean;
 *   platform?: string;
 *   env?: Record<string, unknown>;
 *   loader?: (specifier: string) => Promise<unknown>;
 *   smokeAction?: (context: {
 *     nutjsModule: unknown;
 *     platform: string;
 *     env: Record<string, unknown>;
 *   }) => Promise<Record<string, unknown> | void>;
 * }} [options]
 */
export async function runNutjsUiSmoke(options = {}) {
  if (options === null || typeof options !== 'object') {
    throw new TypeError('[nutjs:ui-smoke] Expected options to be an object.');
  }

  if (options.strict !== undefined && typeof options.strict !== 'boolean') {
    throw new TypeError('[nutjs:ui-smoke] Expected options.strict to be a boolean when provided.');
  }

  if (options.platform !== undefined && typeof options.platform !== 'string') {
    throw new TypeError('[nutjs:ui-smoke] Expected options.platform to be a string when provided.');
  }

  if (options.env !== undefined && (options.env === null || typeof options.env !== 'object')) {
    throw new TypeError('[nutjs:ui-smoke] Expected options.env to be an object when provided.');
  }

  if (options.loader !== undefined && typeof options.loader !== 'function') {
    throw new TypeError('[nutjs:ui-smoke] Expected options.loader to be a function when provided.');
  }

  if (options.smokeAction !== undefined && typeof options.smokeAction !== 'function') {
    throw new TypeError('[nutjs:ui-smoke] Expected options.smokeAction to be a function when provided.');
  }

  const strict = options.strict ?? false;
  const platform = options.platform ?? process.platform;
  const environment = options.env ?? process.env;
  const packageName = resolveNutjsPackageName(environment);
  const loadedModule = await loadNutjsModule({
    packageName,
    loader: options.loader,
  });
  const capabilities = resolveNutjsUiCapabilities({
    platform,
    env: environment,
    nutjsModuleAvailable: loadedModule.nutjsModule !== null,
  });

  const summary = {
    tool: 'nutjs-ui-smoke',
    status: /** @type {'passed' | 'skipped'} */ (capabilities.isSupported ? 'passed' : 'skipped'),
    strict,
    platform,
    packageName,
    reasons: capabilities.reasons,
    capabilityMetadata: capabilities.metadata,
    moduleLoadError: loadedModule.loadError,
    timestampMs: Date.now(),
    smokeMetadata: /** @type {Record<string, unknown>} */ ({}),
  };

  if (!capabilities.isSupported) {
    if (strict) {
      throw new Error(`[nutjs:ui-smoke] Environment does not support NutJS smoke run: ${capabilities.reasons.join(', ')}`);
    }
    return summary;
  }

  const smokeAction = options.smokeAction ?? (async context => runDefaultSmokeAction(context.nutjsModule, context.platform, context.env));
  const smokeMetadata = await smokeAction({
    nutjsModule: loadedModule.nutjsModule,
    platform,
    env: environment,
  });
  if (smokeMetadata && typeof smokeMetadata === 'object' && !Array.isArray(smokeMetadata)) {
    summary.smokeMetadata = smokeMetadata;
  }

  return summary;
}

/**
 * @param {string[]} argv
 */
export function parseNutjsUiSmokeArgs(argv) {
  if (!Array.isArray(argv)) {
    throw new TypeError('[nutjs:ui-smoke] Expected argv to be an array.');
  }

  let helpRequested = false;
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (typeof token !== 'string') {
      throw new TypeError(`[nutjs:ui-smoke] Expected argv[${String(index)}] to be a string.`);
    }
    if (token === '--help' || token === '-h') {
      helpRequested = true;
    }
  }

  if (helpRequested) {
    return { jsonOutput: false, shouldPrintUsage: true, strict: false };
  }

  let jsonOutput = false;
  let strict = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--json') {
      if (jsonOutput) {
        throw new Error('[nutjs:ui-smoke] Duplicate --json flag received.');
      }
      jsonOutput = true;
      continue;
    }

    if (token === '--strict') {
      if (strict) {
        throw new Error('[nutjs:ui-smoke] Duplicate --strict flag received.');
      }
      strict = true;
      continue;
    }

    throw new Error(`[nutjs:ui-smoke] Unknown argument "${token}". Supported flags: --json, --strict, --help.`);
  }

  return {
    jsonOutput,
    shouldPrintUsage: false,
    strict,
  };
}

async function runAsScript() {
  try {
    const args = parseNutjsUiSmokeArgs(process.argv.slice(2));
    if (args.shouldPrintUsage) {
      process.stdout.write(SCRIPT_USAGE);
      process.exitCode = 0;
      return;
    }

    const summary = await runNutjsUiSmoke({
      strict: args.strict,
    });

    if (args.jsonOutput) {
      process.stdout.write(`${JSON.stringify(summary)}\n`);
    } else if (summary.status === 'skipped') {
      process.stdout.write(
        `[nutjs:ui-smoke] skipped on ${summary.platform}: ${summary.reasons.join(', ') || 'no-skip-reason'} (strict=${String(
          summary.strict,
        )}).\n`,
      );
    } else {
      process.stdout.write(
        `[nutjs:ui-smoke] passed on ${summary.platform} using ${summary.packageName} (exportedKeyCount=${String(
          summary.smokeMetadata.exportedKeyCount ?? 'unknown',
        )}).\n`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : formatErrorValue(error);
    process.stderr.write(`[nutjs:ui-smoke] ${message}\n`);
    process.exitCode = 1;
  }
}

const currentFilePath = fileURLToPath(import.meta.url);
const invokedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : null;
const shouldRunAsScript = invokedFilePath === currentFilePath;

if (shouldRunAsScript) {
  await runAsScript();
}
