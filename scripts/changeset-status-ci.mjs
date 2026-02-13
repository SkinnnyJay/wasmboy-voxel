import { spawnSync } from 'node:child_process';
import { filterChangesetStatusOutput } from './changeset-status-ci-lib.mjs';

const USAGE_TEXT = `Usage:
node scripts/changeset-status-ci.mjs

Runs \`changeset status\` and suppresses expected local workspace \`file:\`
dependency warnings for @wasmboy/* packages against @wasmboy/api.

Options:
  -h, --help   Show this help message`;
const DEFAULT_TIMEOUT_MS = 120000;
const TIMEOUT_ENV_VARIABLE = 'CHANGESET_STATUS_CI_TIMEOUT_MS';

function resolveTimeoutMs(rawTimeoutValue) {
  if (rawTimeoutValue === undefined || rawTimeoutValue.length === 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  const parsedTimeout = Number.parseInt(rawTimeoutValue, 10);
  if (!Number.isFinite(parsedTimeout) || parsedTimeout <= 0) {
    throw new Error(`Invalid ${TIMEOUT_ENV_VARIABLE} value: ${rawTimeoutValue}`);
  }

  return parsedTimeout;
}

function parseArgs(argv) {
  /** @type {{showHelp: boolean}} */
  const parsed = { showHelp: false };

  for (const token of argv) {
    if (token === '--help' || token === '-h') {
      parsed.showHelp = true;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
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
  timeoutMs = resolveTimeoutMs(process.env[TIMEOUT_ENV_VARIABLE]);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Invalid timeout configuration.';
  console.error(`[changeset:status:ci] ${errorMessage}`);
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
