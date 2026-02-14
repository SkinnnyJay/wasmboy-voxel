import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRequiredArgumentValue, validateRequiredArgumentValue } from './cli-arg-values.mjs';
import { runCoreMemoryOffsetContractCheck } from './core-memory-offset-contract-check-lib.mjs';

const HELP_SHORT_FLAG = '-h';
const HELP_LONG_FLAG = '--help';
const REPO_ROOT_FLAG = '--repo-root';
const HELP_ARGS = new Set([HELP_LONG_FLAG, HELP_SHORT_FLAG]);
const KNOWN_ARGS = new Set([REPO_ROOT_FLAG, HELP_LONG_FLAG, HELP_SHORT_FLAG]);
const USAGE_TEXT = `Usage:
node scripts/core-memory-offset-contract-check.mjs [--repo-root <path>] [--help]

Options:
  --repo-root <path>         Override repository root for core dist lookup
  --repo-root=<path>         Inline repo-root override variant
  -h, --help                 Show this help message`;

/**
 * @param {string[]} argv
 */
export function parseCoreMemoryOffsetCheckArgs(argv) {
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
      repoRootOverride: '',
    };
  }

  /** @type {{showHelp: boolean; repoRootOverride: string}} */
  const parsed = {
    showHelp: false,
    repoRootOverride: '',
  };
  let repoRootConfigured = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === REPO_ROOT_FLAG) {
      if (repoRootConfigured) {
        throw new Error(`Duplicate ${REPO_ROOT_FLAG} flag received.`);
      }
      const repoRootValue = readRequiredArgumentValue(argv, index, {
        flagName: REPO_ROOT_FLAG,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: false,
      });
      parsed.repoRootOverride = repoRootValue;
      repoRootConfigured = true;
      index += 1;
      continue;
    }

    if (token.startsWith(`${REPO_ROOT_FLAG}=`)) {
      if (repoRootConfigured) {
        throw new Error(`Duplicate ${REPO_ROOT_FLAG} flag received.`);
      }
      const repoRootValue = token.slice(`${REPO_ROOT_FLAG}=`.length);
      if (repoRootValue.startsWith('=')) {
        throw new Error(`Malformed inline value for ${REPO_ROOT_FLAG} argument.`);
      }
      validateRequiredArgumentValue(repoRootValue, {
        flagName: REPO_ROOT_FLAG,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: false,
      });
      parsed.repoRootOverride = repoRootValue;
      repoRootConfigured = true;
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
    const parsedArgs = parseCoreMemoryOffsetCheckArgs(process.argv.slice(2));
    if (parsedArgs.showHelp) {
      process.stdout.write(`${USAGE_TEXT}\n`);
      process.exit(0);
    }

    await runCoreMemoryOffsetContractCheck({
      repoRoot: parsedArgs.repoRootOverride || undefined,
    });
    process.stdout.write('[core:memory-offset:check] core offset mapping contract is valid.\n');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown core memory offset contract error';
    process.stderr.write(`[core:memory-offset:check] ${message}\n${USAGE_TEXT}\n`);
    process.exitCode = 1;
  }
}
