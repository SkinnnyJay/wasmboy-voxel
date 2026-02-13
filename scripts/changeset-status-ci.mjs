import { spawnSync } from 'node:child_process';
import { filterChangesetStatusOutput } from './changeset-status-ci-lib.mjs';
import { resolveStrictPositiveIntegerEnv } from './cli-timeout.mjs';

const DEFAULT_TIMEOUT_MS = 120000;
const TIMEOUT_ENV_VARIABLE = 'CHANGESET_STATUS_CI_TIMEOUT_MS';
const CLI_TIMEOUT_FLAG = '--timeout-ms';
const USAGE_TEXT = `Usage:
node scripts/changeset-status-ci.mjs

Runs \`changeset status\` and suppresses expected local workspace \`file:\`
dependency warnings for @wasmboy/* packages against @wasmboy/api.

Options:
  -h, --help               Show this help message
  --timeout-ms <ms>        Override timeout in milliseconds for this invocation
  --timeout-ms=<ms>        Inline timeout override variant

Environment:
  ${TIMEOUT_ENV_VARIABLE}=<ms>  changeset timeout in milliseconds (default: ${DEFAULT_TIMEOUT_MS})`;

function parseArgs(argv) {
  /** @type {{showHelp: boolean; timeoutMsOverride: string}} */
  const parsed = { showHelp: false, timeoutMsOverride: '' };
  let helpConfigured = false;
  let timeoutConfigured = false;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '--help' || token === '-h') {
      if (helpConfigured) {
        throw new Error('Duplicate help flag provided.');
      }
      parsed.showHelp = true;
      helpConfigured = true;
      continue;
    }

    if (token === CLI_TIMEOUT_FLAG) {
      if (timeoutConfigured) {
        throw new Error(`Duplicate ${CLI_TIMEOUT_FLAG} argument provided.`);
      }

      const value = argv[i + 1];
      if (!value || value === '--help' || value === '-h' || value === CLI_TIMEOUT_FLAG) {
        throw new Error(`Missing value for ${CLI_TIMEOUT_FLAG} argument.`);
      }

      parsed.timeoutMsOverride = value;
      timeoutConfigured = true;
      i += 1;
      continue;
    }

    if (token.startsWith(`${CLI_TIMEOUT_FLAG}=`)) {
      if (timeoutConfigured) {
        throw new Error(`Duplicate ${CLI_TIMEOUT_FLAG} argument provided.`);
      }

      const value = token.slice(`${CLI_TIMEOUT_FLAG}=`.length);
      if (value.length === 0) {
        throw new Error(`Missing value for ${CLI_TIMEOUT_FLAG} argument.`);
      }

      parsed.timeoutMsOverride = value;
      timeoutConfigured = true;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  if (parsed.showHelp && timeoutConfigured) {
    throw new Error('Help flag cannot be combined with timeout override arguments.');
  }

  return parsed;
}

let parsedArgs;
try {
  parsedArgs = parseArgs(process.argv.slice(2));
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Invalid arguments.';
  console.error(`[changeset:status:ci] ${errorMessage}`);
  console.error(USAGE_TEXT);
  process.exit(1);
}

if (parsedArgs.showHelp) {
  console.log(USAGE_TEXT);
  process.exit(0);
}

let timeoutMs = DEFAULT_TIMEOUT_MS;
try {
  const envTimeoutMs = resolveStrictPositiveIntegerEnv({
    name: TIMEOUT_ENV_VARIABLE,
    rawValue: process.env[TIMEOUT_ENV_VARIABLE],
    defaultValue: DEFAULT_TIMEOUT_MS,
  });
  timeoutMs = resolveStrictPositiveIntegerEnv({
    name: CLI_TIMEOUT_FLAG,
    rawValue: parsedArgs.timeoutMsOverride,
    defaultValue: envTimeoutMs,
  });
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Invalid timeout configuration.';
  console.error(`[changeset:status:ci] ${errorMessage}`);
  console.error(USAGE_TEXT);
  process.exit(1);
}

const statusResult = spawnSync('changeset', ['status'], {
  encoding: 'utf8',
  timeout: timeoutMs,
  killSignal: 'SIGTERM',
});

if (statusResult.error) {
  if (statusResult.error.code === 'ETIMEDOUT') {
    console.error(`[changeset:status:ci] changeset status timed out after ${timeoutMs}ms.`);
    process.exit(1);
  }

  console.error('[changeset:status:ci] Failed to execute changeset status.');
  console.error(statusResult.error);
  process.exit(1);
}

const combinedOutput = `${statusResult.stdout ?? ''}${statusResult.stderr ?? ''}`;
const { suppressedWarnings, passthroughOutput } = filterChangesetStatusOutput(combinedOutput);

if (suppressedWarnings.length > 0) {
  console.log(`[changeset:status:ci] Suppressed ${suppressedWarnings.length} expected workspace file-dependency notices:`);
  for (const warningLine of suppressedWarnings) {
    console.log(`- ${warningLine}`);
  }
}
if (passthroughOutput.length > 0) {
  process.stdout.write(`${passthroughOutput}\n`);
}

process.exit(statusResult.status ?? 1);
