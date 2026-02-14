import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readRequiredArgumentValue, validateRequiredArgumentValue } from './cli-arg-values.mjs';
import { runCoreWrapperMemoryLayoutCheck } from './core-wrapper-memory-layout-check-lib.mjs';

const HELP_SHORT_FLAG = '-h';
const HELP_LONG_FLAG = '--help';
const CORE_CONSTANTS_PATH_FLAG = '--core-constants-path';
const WRAPPER_PATH_FLAG = '--wrapper-path';
const HELP_ARGS = new Set([HELP_LONG_FLAG, HELP_SHORT_FLAG]);
const KNOWN_ARGS = new Set([CORE_CONSTANTS_PATH_FLAG, WRAPPER_PATH_FLAG, HELP_LONG_FLAG, HELP_SHORT_FLAG]);
const USAGE_TEXT = `Usage:
node scripts/core-wrapper-memory-layout-check.mjs [--core-constants-path <path>] [--wrapper-path <path>] [--help]

Options:
  --core-constants-path <path>   Override core/constants.ts source path
  --core-constants-path=<path>   Inline core constants path override variant
  --wrapper-path <path>          Override voxel-wrapper.ts source path
  --wrapper-path=<path>          Inline wrapper path override variant
  -h, --help                     Show this help message`;

/**
 * @param {string[]} argv
 */
export function parseCoreWrapperMemoryLayoutCheckArgs(argv) {
  if (!Array.isArray(argv)) {
    throw new Error('Expected argv to be an array.');
  }

  for (let index = 0; index < argv.length; index += 1) {
    if (typeof argv[index] !== 'string') {
      throw new Error(`Expected argv[${String(index)}] to be a string.`);
    }
  }

  if (argv.some(token => HELP_ARGS.has(token))) {
    return {
      showHelp: true,
      coreConstantsPathOverride: '',
      wrapperPathOverride: '',
    };
  }

  /** @type {{showHelp: boolean; coreConstantsPathOverride: string; wrapperPathOverride: string}} */
  const parsed = {
    showHelp: false,
    coreConstantsPathOverride: '',
    wrapperPathOverride: '',
  };
  let coreConstantsPathConfigured = false;
  let wrapperPathConfigured = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === CORE_CONSTANTS_PATH_FLAG) {
      if (coreConstantsPathConfigured) {
        throw new Error(`Duplicate ${CORE_CONSTANTS_PATH_FLAG} flag received.`);
      }
      const coreConstantsPathValue = readRequiredArgumentValue(argv, index, {
        flagName: CORE_CONSTANTS_PATH_FLAG,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: false,
      });
      parsed.coreConstantsPathOverride = coreConstantsPathValue;
      coreConstantsPathConfigured = true;
      index += 1;
      continue;
    }

    if (token.startsWith(`${CORE_CONSTANTS_PATH_FLAG}=`)) {
      if (coreConstantsPathConfigured) {
        throw new Error(`Duplicate ${CORE_CONSTANTS_PATH_FLAG} flag received.`);
      }
      const coreConstantsPathValue = token.slice(`${CORE_CONSTANTS_PATH_FLAG}=`.length);
      if (coreConstantsPathValue.startsWith('=')) {
        throw new Error(`Malformed inline value for ${CORE_CONSTANTS_PATH_FLAG} argument.`);
      }
      validateRequiredArgumentValue(coreConstantsPathValue, {
        flagName: CORE_CONSTANTS_PATH_FLAG,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: false,
      });
      parsed.coreConstantsPathOverride = coreConstantsPathValue;
      coreConstantsPathConfigured = true;
      continue;
    }

    if (token === WRAPPER_PATH_FLAG) {
      if (wrapperPathConfigured) {
        throw new Error(`Duplicate ${WRAPPER_PATH_FLAG} flag received.`);
      }
      const wrapperPathValue = readRequiredArgumentValue(argv, index, {
        flagName: WRAPPER_PATH_FLAG,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: false,
      });
      parsed.wrapperPathOverride = wrapperPathValue;
      wrapperPathConfigured = true;
      index += 1;
      continue;
    }

    if (token.startsWith(`${WRAPPER_PATH_FLAG}=`)) {
      if (wrapperPathConfigured) {
        throw new Error(`Duplicate ${WRAPPER_PATH_FLAG} flag received.`);
      }
      const wrapperPathValue = token.slice(`${WRAPPER_PATH_FLAG}=`.length);
      if (wrapperPathValue.startsWith('=')) {
        throw new Error(`Malformed inline value for ${WRAPPER_PATH_FLAG} argument.`);
      }
      validateRequiredArgumentValue(wrapperPathValue, {
        flagName: WRAPPER_PATH_FLAG,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: false,
      });
      parsed.wrapperPathOverride = wrapperPathValue;
      wrapperPathConfigured = true;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return parsed;
}

const currentFilePath = fileURLToPath(import.meta.url);
const invokedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : null;
const shouldRunAsScript = invokedFilePath === currentFilePath;

if (shouldRunAsScript) {
  try {
    const parsedArgs = parseCoreWrapperMemoryLayoutCheckArgs(process.argv.slice(2));
    if (parsedArgs.showHelp) {
      process.stdout.write(`${USAGE_TEXT}\n`);
      process.exit(0);
    }

    const result = await runCoreWrapperMemoryLayoutCheck({
      coreConstantsFileUrl: parsedArgs.coreConstantsPathOverride
        ? pathToFileURL(path.resolve(parsedArgs.coreConstantsPathOverride))
        : undefined,
      wrapperFileUrl: parsedArgs.wrapperPathOverride ? pathToFileURL(path.resolve(parsedArgs.wrapperPathOverride)) : undefined,
    });

    if (!result.isValid) {
      process.stderr.write('[memory-layout:check] core/constants.ts and voxel-wrapper.ts are out of sync.\n');
      for (const error of result.errors) {
        process.stderr.write(`[memory-layout:check] - ${error}\n`);
      }
      process.exitCode = 1;
    } else {
      process.stdout.write('[memory-layout:check] core/constants.ts and voxel-wrapper.ts are compatible.\n');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown memory-layout check error';
    process.stderr.write(`[memory-layout:check] ${message}\n${USAGE_TEXT}\n`);
    process.exitCode = 1;
  }
}
