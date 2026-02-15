import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveTimeoutFromCliAndEnv } from './cli-timeout.mjs';
import { readRequiredArgumentValue, validateRequiredArgumentValue } from './cli-arg-values.mjs';
import { attemptWindowsTimeoutTerminationFallback, resolveTimeoutKillSignal } from './subprocess-timeout-signals.mjs';

const WORKSPACE_PATHS = ['.', 'packages/api', 'packages/cli', 'apps/debugger'];
const FAIL_ON_VULNERABILITIES_FLAG = '--fail-on-vulnerabilities';
const SECURITY_SCAN_TIMEOUT_ENV_VARIABLE = 'SECURITY_SCAN_NPM_AUDIT_TIMEOUT_MS';
const DEFAULT_AUDIT_TIMEOUT_MS = 120000;
const CLI_TIMEOUT_FLAG = '--timeout-ms';
const HELP_SHORT_FLAG = '-h';
const HELP_LONG_FLAG = '--help';
const HELP_ARGS = new Set([HELP_LONG_FLAG, HELP_SHORT_FLAG]);
const KNOWN_ARGS = new Set([FAIL_ON_VULNERABILITIES_FLAG, CLI_TIMEOUT_FLAG, HELP_LONG_FLAG, HELP_SHORT_FLAG]);
const USAGE_TEXT = `Usage:
node scripts/security-scan-workspaces.mjs [--fail-on-vulnerabilities] [--timeout-ms <ms>] [--help]

Options:
  --fail-on-vulnerabilities   Exit non-zero when workspace audits report vulnerabilities
  --timeout-ms <ms>           Override npm audit timeout in milliseconds for this invocation
  --timeout-ms=<ms>           Inline timeout override variant
  -h, --help                  Show this help message

Environment:
  ${SECURITY_SCAN_TIMEOUT_ENV_VARIABLE}=<ms>  npm audit timeout in milliseconds (default: ${DEFAULT_AUDIT_TIMEOUT_MS})`;

/**
 * @param {string[]} argv
 */
export function parseSecurityScanArgs(argv) {
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
      failOnVulnerabilities: false,
      timeoutMsOverride: '',
    };
  }

  /** @type {{showHelp: boolean; failOnVulnerabilities: boolean; timeoutMsOverride: string}} */
  const parsed = {
    showHelp: false,
    failOnVulnerabilities: false,
    timeoutMsOverride: '',
  };
  let failOnVulnerabilitiesConfigured = false;
  let timeoutConfigured = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === FAIL_ON_VULNERABILITIES_FLAG) {
      if (failOnVulnerabilitiesConfigured) {
        throw new Error(`Duplicate ${FAIL_ON_VULNERABILITIES_FLAG} flag received.`);
      }
      parsed.failOnVulnerabilities = true;
      failOnVulnerabilitiesConfigured = true;
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
export function parseAuditJson(rawOutput) {
  if (typeof rawOutput !== 'string') {
    throw new Error(`Invalid npm audit output: ${formatUnknown(rawOutput)}`);
  }

  const trimmed = rawOutput.trim();
  if (!trimmed) {
    return {};
  }

  const parsed = JSON.parse(trimmed);
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid npm audit JSON structure.');
  }

  return parsed;
}

/**
 * @param {Record<string, unknown>} auditReport
 */
function extractVulnerabilitySummary(auditReport) {
  const metadata = auditReport.metadata;
  if (metadata && typeof metadata === 'object') {
    const metadataVulnerabilities = metadata.vulnerabilities;
    if (metadataVulnerabilities && typeof metadataVulnerabilities === 'object') {
      const summary = {
        info: Number(metadataVulnerabilities.info ?? 0),
        low: Number(metadataVulnerabilities.low ?? 0),
        moderate: Number(metadataVulnerabilities.moderate ?? 0),
        high: Number(metadataVulnerabilities.high ?? 0),
        critical: Number(metadataVulnerabilities.critical ?? 0),
        total: Number(metadataVulnerabilities.total ?? 0),
      };
      return summary;
    }
  }

  const vulnerabilities = auditReport.vulnerabilities;
  const total = vulnerabilities && typeof vulnerabilities === 'object' ? Object.keys(vulnerabilities).length : 0;
  return {
    info: 0,
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
    total,
  };
}

/**
 * @param {string} repoRoot
 * @param {string} workspacePath
 * @param {number} timeoutMs
 */
function runAuditForWorkspace(repoRoot, workspacePath, timeoutMs) {
  const workspaceRoot = path.resolve(repoRoot, workspacePath);
  const result = spawnSync('npm', ['audit', '--omit=optional', '--json'], {
    cwd: workspaceRoot,
    encoding: 'utf8',
    env: process.env,
    timeout: timeoutMs,
    killSignal: resolveTimeoutKillSignal(),
  });

  if (result.error) {
    if (result.error.code === 'ETIMEDOUT') {
      attemptWindowsTimeoutTerminationFallback(result.pid);
      throw new Error(`npm audit timed out in ${workspacePath} after ${String(timeoutMs)}ms.`);
    }
    throw new Error(`Failed to run npm audit in ${workspacePath}: ${result.error.message}`);
  }

  if (result.status !== 0 && result.status !== 1) {
    const stderr = result.stderr?.trim();
    const details = stderr ? ` ${stderr}` : '';
    throw new Error(`npm audit failed in ${workspacePath} with exit ${String(result.status)}.${details}`);
  }

  return {
    stdout: result.stdout ?? '',
    status: result.status ?? 0,
  };
}

/**
 * @param {Record<string, unknown>} environment
 * @param {string} [cliTimeoutMsOverride]
 */
export function resolveSecurityScanTimeoutFromEnv(environment, cliTimeoutMsOverride = '') {
  return resolveTimeoutFromCliAndEnv({
    defaultValue: DEFAULT_AUDIT_TIMEOUT_MS,
    env: {
      name: SECURITY_SCAN_TIMEOUT_ENV_VARIABLE,
      rawValue: environment[SECURITY_SCAN_TIMEOUT_ENV_VARIABLE],
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
 *   runAudit?: (repoRoot: string, workspacePath: string, timeoutMs: number) => { stdout: string; status: number };
 *   auditTimeoutMs?: number;
 * }} [options]
 */
export function collectWorkspaceSecurityScan(options = {}) {
  const repoRoot = options.repoRoot ?? process.cwd();
  const workspacePaths = options.workspacePaths ?? WORKSPACE_PATHS;
  const runAudit = options.runAudit ?? runAuditForWorkspace;
  const auditTimeoutMs = options.auditTimeoutMs ?? resolveSecurityScanTimeoutFromEnv(process.env);
  const workspaces = [];
  let totalVulnerabilities = 0;

  for (const workspacePath of workspacePaths) {
    const auditResult = runAudit(repoRoot, workspacePath, auditTimeoutMs);
    const parsedReport = parseAuditJson(auditResult.stdout);
    const vulnerabilitySummary = extractVulnerabilitySummary(parsedReport);
    totalVulnerabilities += vulnerabilitySummary.total;

    workspaces.push({
      workspacePath,
      vulnerabilitySummary,
    });
  }

  return {
    generatedAtIso: new Date().toISOString(),
    totalVulnerabilities,
    workspaces,
  };
}

/**
 * @param {ReturnType<typeof collectWorkspaceSecurityScan>} report
 */
function formatSecurityScanReport(report) {
  const lines = [];
  lines.push(`[security:scan] generatedAt=${report.generatedAtIso}`);
  lines.push(`[security:scan] totalVulnerabilities=${String(report.totalVulnerabilities)}`);

  for (const workspace of report.workspaces) {
    const summary = workspace.vulnerabilitySummary;
    lines.push(
      `[security:scan] workspace=${workspace.workspacePath} total=${String(summary.total)} critical=${String(
        summary.critical,
      )} high=${String(summary.high)} moderate=${String(summary.moderate)} low=${String(summary.low)} info=${String(summary.info)}`,
    );
  }

  return lines.join('\n');
}

const currentFilePath = fileURLToPath(import.meta.url);
const invokedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : null;
const shouldRunAsScript = invokedFilePath === currentFilePath;

if (shouldRunAsScript) {
  try {
    const parsedArgs = parseSecurityScanArgs(process.argv.slice(2));
    if (parsedArgs.showHelp) {
      process.stdout.write(`${USAGE_TEXT}\n`);
      process.exit(0);
    }

    const report = collectWorkspaceSecurityScan({
      auditTimeoutMs: resolveSecurityScanTimeoutFromEnv(process.env, parsedArgs.timeoutMsOverride),
    });
    process.stdout.write(`${formatSecurityScanReport(report)}\n`);

    if (parsedArgs.failOnVulnerabilities && report.totalVulnerabilities > 0) {
      process.stderr.write(`[security:scan] Found ${String(report.totalVulnerabilities)} vulnerabilities across workspace audits.\n`);
      process.exitCode = 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown security scan error';
    process.stderr.write(`[security:scan] ${message}\n${USAGE_TEXT}\n`);
    process.exitCode = 1;
  }
}
