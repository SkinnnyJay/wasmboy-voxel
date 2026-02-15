import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { resolveTimeoutFromCliAndEnv } from './cli-timeout.mjs';
import { readRequiredArgumentValue, validateRequiredArgumentValue } from './cli-arg-values.mjs';
import { attemptWindowsTimeoutTerminationFallback, resolveTimeoutKillSignal } from './subprocess-timeout-signals.mjs';

const RELEASE_TARGETS = [
  { packageName: '@wasmboy/api', packageDirectory: 'packages/api' },
  { packageName: '@wasmboy/cli', packageDirectory: 'packages/cli' },
];
const RELEASE_CHECKLIST_TIMEOUT_ENV_VARIABLE = 'RELEASE_CHECKLIST_NPM_TIMEOUT_MS';
const DEFAULT_RELEASE_CHECKLIST_TIMEOUT_MS = 120000;
const CLI_TIMEOUT_FLAG = '--timeout-ms';
const HELP_SHORT_FLAG = '-h';
const HELP_LONG_FLAG = '--help';
const HELP_ARGS = new Set([HELP_LONG_FLAG, HELP_SHORT_FLAG]);
const KNOWN_ARGS = new Set([CLI_TIMEOUT_FLAG, HELP_LONG_FLAG, HELP_SHORT_FLAG]);
const USAGE_TEXT = `Usage:
node scripts/release-checklist-dry-run.mjs [--timeout-ms <ms>] [--help]

Options:
  --timeout-ms <ms>           Override npm publish dry-run timeout in milliseconds for this invocation
  --timeout-ms=<ms>           Inline timeout override variant
  -h, --help                  Show this help message

Environment:
  ${RELEASE_CHECKLIST_TIMEOUT_ENV_VARIABLE}=<ms>  npm publish dry-run timeout in milliseconds (default: ${DEFAULT_RELEASE_CHECKLIST_TIMEOUT_MS})`;

/**
 * @param {string[]} argv
 */
export function parseReleaseChecklistArgs(argv) {
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
      timeoutMsOverride: '',
    };
  }

  /** @type {{showHelp: boolean; timeoutMsOverride: string}} */
  const parsed = {
    showHelp: false,
    timeoutMsOverride: '',
  };
  let timeoutConfigured = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === CLI_TIMEOUT_FLAG) {
      if (timeoutConfigured) {
        throw new Error(`Duplicate ${CLI_TIMEOUT_FLAG} flag received.`);
      }
      const timeoutValue = readRequiredArgumentValue(argv, index, {
        flagName: CLI_TIMEOUT_FLAG,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      });
      parsed.timeoutMsOverride = timeoutValue;
      timeoutConfigured = true;
      index += 1;
      continue;
    }

    if (token.startsWith(`${CLI_TIMEOUT_FLAG}=`)) {
      if (timeoutConfigured) {
        throw new Error(`Duplicate ${CLI_TIMEOUT_FLAG} flag received.`);
      }
      const timeoutValue = token.slice(`${CLI_TIMEOUT_FLAG}=`.length);
      if (timeoutValue.startsWith('=')) {
        throw new Error(`Malformed inline value for ${CLI_TIMEOUT_FLAG} argument.`);
      }
      validateRequiredArgumentValue(timeoutValue, {
        flagName: CLI_TIMEOUT_FLAG,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      });
      parsed.timeoutMsOverride = timeoutValue;
      timeoutConfigured = true;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return parsed;
}

/**
 * @param {Record<string, unknown>} environment
 * @param {string} [cliTimeoutMsOverride]
 */
export function resolveReleaseChecklistTimeoutFromEnv(environment, cliTimeoutMsOverride = '') {
  return resolveTimeoutFromCliAndEnv({
    defaultValue: DEFAULT_RELEASE_CHECKLIST_TIMEOUT_MS,
    env: {
      name: RELEASE_CHECKLIST_TIMEOUT_ENV_VARIABLE,
      rawValue: environment[RELEASE_CHECKLIST_TIMEOUT_ENV_VARIABLE],
    },
    cli: {
      name: CLI_TIMEOUT_FLAG,
      rawValue: cliTimeoutMsOverride,
    },
  });
}

function runNpmPublishDryRun(repoRoot, releaseTarget, timeoutMs) {
  const targetDirectory = path.resolve(repoRoot, releaseTarget.packageDirectory);
  const commandArguments = ['publish', '--dry-run', '--access', 'public'];
  const command = `npm ${commandArguments.join(' ')}`;
  const result = spawnSync('npm', commandArguments, {
    cwd: targetDirectory,
    encoding: 'utf8',
    env: process.env,
    timeout: timeoutMs,
    killSignal: resolveTimeoutKillSignal(),
  });

  if (result.error) {
    if (result.error.code === 'ETIMEDOUT') {
      attemptWindowsTimeoutTerminationFallback(result.pid);
      throw new Error(
        `"${command}" timed out for ${releaseTarget.packageName} after ${String(timeoutMs)}ms in ${releaseTarget.packageDirectory}.`,
      );
    }
    throw new Error(`Failed to execute "${command}" for ${releaseTarget.packageName}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const outputSegments = [];
    if (result.stdout?.trim()) {
      outputSegments.push(`stdout: ${result.stdout.trim()}`);
    }
    if (result.stderr?.trim()) {
      outputSegments.push(`stderr: ${result.stderr.trim()}`);
    }

    const outputDetails = outputSegments.length > 0 ? ` ${outputSegments.join(' ')}` : '';
    throw new Error(
      `"${command}" failed for ${releaseTarget.packageName} (exit ${String(result.status)}) in ${
        releaseTarget.packageDirectory
      }.${outputDetails}`,
    );
  }

  process.stdout.write(`[release-checklist] npm publish dry-run passed for ${releaseTarget.packageName}\n`);
}

/**
 * @param {{
 *   timeoutMsOverride?: string;
 * }} [options]
 */
function runReleaseChecklistDryRun(options = {}) {
  const repoRoot = process.cwd();
  const timeoutMs = resolveReleaseChecklistTimeoutFromEnv(process.env, options.timeoutMsOverride ?? '');
  for (const releaseTarget of RELEASE_TARGETS) {
    runNpmPublishDryRun(repoRoot, releaseTarget, timeoutMs);
  }
}

try {
  const parsedArgs = parseReleaseChecklistArgs(process.argv.slice(2));
  if (parsedArgs.showHelp) {
    process.stdout.write(`${USAGE_TEXT}\n`);
    process.exit(0);
  }
  runReleaseChecklistDryRun({ timeoutMsOverride: parsedArgs.timeoutMsOverride });
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown release checklist error';
  process.stderr.write(`[release-checklist] ${message}\n${USAGE_TEXT}\n`);
  process.exitCode = 1;
}
