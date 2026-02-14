import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveTimeoutFromCliAndEnv } from './cli-timeout.mjs';
import { readRequiredArgumentValue, validateRequiredArgumentValue } from './cli-arg-values.mjs';

const WORKSPACE_PATHS = ['.', 'packages/api', 'packages/cli', 'apps/debugger'];
const DEPENDENCY_FRESHNESS_TIMEOUT_ENV_VARIABLE = 'DEPENDENCY_FRESHNESS_NPM_TIMEOUT_MS';
const DEFAULT_OUTDATED_TIMEOUT_MS = 120000;
const FAIL_ON_OUTDATED_FLAG = '--fail-on-outdated';
const CLI_TIMEOUT_FLAG = '--timeout-ms';
const HELP_SHORT_FLAG = '-h';
const HELP_LONG_FLAG = '--help';
const HELP_ARGS = new Set([HELP_LONG_FLAG, HELP_SHORT_FLAG]);
const KNOWN_ARGS = new Set([FAIL_ON_OUTDATED_FLAG, CLI_TIMEOUT_FLAG, HELP_LONG_FLAG, HELP_SHORT_FLAG]);
const USAGE_TEXT = `Usage:
node scripts/dependency-freshness-audit.mjs [--fail-on-outdated] [--timeout-ms <ms>] [--help]

Options:
  --fail-on-outdated          Exit non-zero when any outdated dependency is detected
  --timeout-ms <ms>           Override npm outdated timeout in milliseconds for this invocation
  --timeout-ms=<ms>           Inline timeout override variant
  -h, --help                  Show this help message

Environment:
  ${DEPENDENCY_FRESHNESS_TIMEOUT_ENV_VARIABLE}=<ms>  npm outdated timeout in milliseconds (default: ${DEFAULT_OUTDATED_TIMEOUT_MS})`;

/**
 * @param {string[]} argv
 */
export function parseDependencyFreshnessArgs(argv) {
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
      shouldFailOnOutdated: false,
      timeoutMsOverride: '',
    };
  }

  /** @type {{showHelp: boolean; shouldFailOnOutdated: boolean; timeoutMsOverride: string}} */
  const parsed = {
    showHelp: false,
    shouldFailOnOutdated: false,
    timeoutMsOverride: '',
  };
  let failOnOutdatedConfigured = false;
  let timeoutConfigured = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === FAIL_ON_OUTDATED_FLAG) {
      if (failOnOutdatedConfigured) {
        throw new Error(`Duplicate ${FAIL_ON_OUTDATED_FLAG} flag received.`);
      }
      parsed.shouldFailOnOutdated = true;
      failOnOutdatedConfigured = true;
      continue;
    }

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
 * @param {unknown} value
 */
function formatUnknown(value) {
  try {
    return String(value);
  } catch {
    return '[unprintable]';
  }
}

/**
 * @param {string} rawOutput
 */
export function parseOutdatedJson(rawOutput) {
  if (typeof rawOutput !== 'string') {
    throw new Error(`Invalid npm outdated output: ${formatUnknown(rawOutput)}`);
  }

  const trimmedOutput = rawOutput.trim();
  if (!trimmedOutput) {
    return {};
  }

  const parsed = JSON.parse(trimmedOutput);
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid npm outdated JSON structure.');
  }
  return parsed;
}

/**
 * @param {string} repoRoot
 * @param {string} workspacePath
 * @param {number} timeoutMs
 */
function runOutdatedForWorkspace(repoRoot, workspacePath, timeoutMs) {
  const workspaceRoot = path.resolve(repoRoot, workspacePath);
  const result = spawnSync('npm', ['outdated', '--json', '--long'], {
    cwd: workspaceRoot,
    encoding: 'utf8',
    env: process.env,
    timeout: timeoutMs,
    killSignal: 'SIGTERM',
  });

  if (result.error) {
    if (result.error.code === 'ETIMEDOUT') {
      throw new Error(`npm outdated timed out in ${workspacePath} after ${String(timeoutMs)}ms.`);
    }
    throw new Error(`Failed to run npm outdated in ${workspacePath}: ${result.error.message}`);
  }

  if (result.status !== 0 && result.status !== 1) {
    const stderr = result.stderr?.trim();
    const details = stderr ? ` ${stderr}` : '';
    throw new Error(`npm outdated failed in ${workspacePath} with exit ${String(result.status)}.${details}`);
  }

  return {
    status: result.status ?? 0,
    stdout: result.stdout ?? '',
  };
}

/**
 * @param {Record<string, unknown>} environment
 * @param {string} [cliTimeoutMsOverride]
 */
export function resolveDependencyFreshnessTimeoutFromEnv(environment, cliTimeoutMsOverride = '') {
  return resolveTimeoutFromCliAndEnv({
    defaultValue: DEFAULT_OUTDATED_TIMEOUT_MS,
    env: {
      name: DEPENDENCY_FRESHNESS_TIMEOUT_ENV_VARIABLE,
      rawValue: environment[DEPENDENCY_FRESHNESS_TIMEOUT_ENV_VARIABLE],
    },
    cli: {
      name: CLI_TIMEOUT_FLAG,
      rawValue: cliTimeoutMsOverride,
    },
  });
}

/**
 * @param {{
 *   repoRoot?: string;
 *   workspacePaths?: string[];
 *   runOutdated?: (repoRoot: string, workspacePath: string, timeoutMs: number) => { status: number; stdout: string };
 *   outdatedTimeoutMs?: number;
 * }} [options]
 */
export function collectDependencyFreshness(options = {}) {
  const repoRoot = options.repoRoot ?? process.cwd();
  const workspacePaths = options.workspacePaths ?? WORKSPACE_PATHS;
  const runOutdated = options.runOutdated ?? runOutdatedForWorkspace;
  const outdatedTimeoutMs = options.outdatedTimeoutMs ?? resolveDependencyFreshnessTimeoutFromEnv(process.env);
  const workspaces = [];
  let totalOutdatedCount = 0;

  for (const workspacePath of workspacePaths) {
    const outdatedResult = runOutdated(repoRoot, workspacePath, outdatedTimeoutMs);
    const outdatedPackages = parseOutdatedJson(outdatedResult.stdout);
    const packageEntries = Object.entries(outdatedPackages);
    totalOutdatedCount += packageEntries.length;

    workspaces.push({
      workspacePath,
      outdatedCount: packageEntries.length,
      outdatedPackages,
    });
  }

  return {
    generatedAtIso: new Date().toISOString(),
    totalOutdatedCount,
    workspaces,
  };
}

/**
 * @param {ReturnType<typeof collectDependencyFreshness>} report
 */
export function formatFreshnessReport(report) {
  const lines = [];
  lines.push(`[dependency:freshness] generatedAt=${report.generatedAtIso}`);
  lines.push(`[dependency:freshness] totalOutdated=${String(report.totalOutdatedCount)}`);

  for (const workspace of report.workspaces) {
    lines.push(`[dependency:freshness] workspace=${workspace.workspacePath} outdated=${String(workspace.outdatedCount)}`);
    const sortedPackageEntries = Object.entries(workspace.outdatedPackages).sort(([leftName], [rightName]) =>
      leftName === rightName ? 0 : leftName < rightName ? -1 : 1,
    );
    for (const [packageName, metadata] of sortedPackageEntries) {
      if (metadata && typeof metadata === 'object') {
        const wanted = typeof metadata.wanted === 'string' ? metadata.wanted : 'unknown';
        const latest = typeof metadata.latest === 'string' ? metadata.latest : 'unknown';
        const location = typeof metadata.location === 'string' ? metadata.location : workspace.workspacePath;
        lines.push(`[dependency:freshness]   - ${packageName} wanted=${wanted} latest=${latest} location=${location}`);
      } else {
        lines.push(`[dependency:freshness]   - ${packageName} metadata=unparseable`);
      }
    }
  }

  return lines.join('\n');
}

const currentFilePath = fileURLToPath(import.meta.url);
const invokedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : null;
const shouldRunAsScript = invokedFilePath === currentFilePath;

if (shouldRunAsScript) {
  try {
    const parsedArgs = parseDependencyFreshnessArgs(process.argv.slice(2));
    if (parsedArgs.showHelp) {
      process.stdout.write(`${USAGE_TEXT}\n`);
      process.exit(0);
    }

    const report = collectDependencyFreshness({
      outdatedTimeoutMs: resolveDependencyFreshnessTimeoutFromEnv(process.env, parsedArgs.timeoutMsOverride),
    });
    process.stdout.write(`${formatFreshnessReport(report)}\n`);

    if (parsedArgs.shouldFailOnOutdated && report.totalOutdatedCount > 0) {
      process.stderr.write(`[dependency:freshness] Found ${String(report.totalOutdatedCount)} outdated dependencies across workspaces.\n`);
      process.exitCode = 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown dependency freshness audit error';
    process.stderr.write(`[dependency:freshness] ${message}\n${USAGE_TEXT}\n`);
    process.exitCode = 1;
  }
}
