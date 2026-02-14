import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGuardArtifactSummary, resolveArtifactSummaryTimestampOverride } from './artifact-summary-contract.mjs';
import { normalizeArtifactPath, shouldBlockStagedArtifactPath } from './artifact-policy.mjs';
const ALLOW_OVERRIDE_ENV_NAME = 'WASMBOY_ALLOW_GENERATED_EDITS';
const SCRIPT_USAGE = `Usage: node scripts/guard-generated-artifacts-precommit.mjs [--json] [--help]\n\nOptions:\n  --json      Emit machine-readable JSON summary.\n  --help, -h  Show this usage message.\n`;

/**
 * @param {string[]} stagedPaths
 */
export function findBlockedArtifactPaths(stagedPaths) {
  if (!Array.isArray(stagedPaths)) {
    throw new TypeError('[guard:generated-artifacts] Expected stagedPaths to be an array.');
  }

  const blockedPathSet = new Set();

  for (let index = 0; index < stagedPaths.length; index += 1) {
    const stagedPath = stagedPaths[index];
    if (typeof stagedPath !== 'string') {
      throw new TypeError(`[guard:generated-artifacts] Expected stagedPaths[${String(index)}] to be a string path.`);
    }
    const normalizedPath = normalizeArtifactPath(stagedPath);
    if (shouldBlockStagedArtifactPath(normalizedPath)) {
      blockedPathSet.add(normalizedPath);
    }
  }

  return [...blockedPathSet].sort((left, right) => left.localeCompare(right));
}

/**
 * @param {string[]} stagedPaths
 * @param {{
 *   allowGeneratedEdits?: boolean;
 * }} [options]
 */
export function validateGeneratedArtifactStaging(stagedPaths, options = {}) {
  if (options === null || typeof options !== 'object') {
    throw new TypeError('[guard:generated-artifacts] Expected options to be an object.');
  }

  if (options.allowGeneratedEdits !== undefined && typeof options.allowGeneratedEdits !== 'boolean') {
    throw new TypeError('[guard:generated-artifacts] Expected options.allowGeneratedEdits to be a boolean when provided.');
  }

  const allowGeneratedEdits = options.allowGeneratedEdits ?? false;
  const blockedPaths = findBlockedArtifactPaths(stagedPaths);

  if (allowGeneratedEdits || blockedPaths.length === 0) {
    return { isValid: true, blockedPaths: [] };
  }

  return {
    isValid: false,
    blockedPaths,
  };
}

function readStagedPathsFromGit() {
  const result = spawnSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
    encoding: 'utf8',
    env: process.env,
  });

  if (result.error) {
    throw new Error(`Failed to inspect staged files: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    const details = stderr ? ` ${stderr}` : '';
    throw new Error(`git diff --cached failed (exit ${String(result.status)}).${details}`);
  }

  const stdout = result.stdout ?? '';
  return stdout
    .split(/\r?\n/u)
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

/**
 * @param {string[]} argv
 */
export function parseGeneratedArtifactGuardArgs(argv) {
  if (!Array.isArray(argv)) {
    throw new TypeError('Expected argv to be an array.');
  }

  let helpRequested = false;
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (typeof token !== 'string') {
      throw new TypeError(`Expected argv[${String(index)}] to be a string.`);
    }
    if (token === '--help' || token === '-h') {
      helpRequested = true;
    }
  }

  if (helpRequested) {
    return { jsonOutput: false, shouldPrintUsage: true };
  }

  let jsonOutput = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--json') {
      if (jsonOutput) {
        throw new Error('Duplicate --json flag received.');
      }
      jsonOutput = true;
      continue;
    }

    throw new Error(`Unknown argument "${token}". Supported flags: --json, --help.`);
  }

  return { jsonOutput, shouldPrintUsage: false };
}

/**
 * @param {{
 *   jsonOutput?: boolean;
 * }} [options]
 */
function runPrecommitGuard(options = {}) {
  const jsonOutput = options.jsonOutput ?? false;
  const allowGeneratedEdits = process.env[ALLOW_OVERRIDE_ENV_NAME] === '1';
  const stagedPaths = readStagedPathsFromGit();
  const validationResult = validateGeneratedArtifactStaging(stagedPaths, { allowGeneratedEdits });
  const timestampOverride = resolveArtifactSummaryTimestampOverride(process.env);
  const summary = buildGuardArtifactSummary({
    allowGeneratedEdits,
    isValid: validationResult.isValid,
    blockedPaths: validationResult.blockedPaths,
    stagedPathCount: stagedPaths.length,
    timestampMs: timestampOverride,
  });

  if (jsonOutput) {
    process.stdout.write(`${JSON.stringify(summary)}\n`);
    if (!validationResult.isValid) {
      process.exitCode = 1;
    }
    return;
  }

  if (validationResult.isValid) {
    if (allowGeneratedEdits) {
      process.stdout.write(`[guard:generated-artifacts] override enabled via ${ALLOW_OVERRIDE_ENV_NAME}=1.\n`);
    }
    return;
  }

  process.stderr.write('[guard:generated-artifacts] Staged generated artifact edits are blocked:\n');
  for (const blockedPath of validationResult.blockedPaths) {
    process.stderr.write(`[guard:generated-artifacts] - ${blockedPath}\n`);
  }
  process.stderr.write(
    `[guard:generated-artifacts] Remove staged generated artifacts (dist/build, integration .output files, non-golden accuracy/performance outputs), or set ${ALLOW_OVERRIDE_ENV_NAME}=1 for intentional generated-artifact commits.\n`,
  );
  process.exitCode = 1;
}

const currentFilePath = fileURLToPath(import.meta.url);
const invokedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : null;
const shouldRunAsScript = invokedFilePath === currentFilePath;

if (shouldRunAsScript) {
  try {
    const args = parseGeneratedArtifactGuardArgs(process.argv.slice(2));
    if (args.shouldPrintUsage) {
      process.stdout.write(SCRIPT_USAGE);
      process.exitCode = 0;
    } else {
      runPrecommitGuard({ jsonOutput: args.jsonOutput });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown generated-artifact guard error';
    process.stderr.write(`[guard:generated-artifacts] ${message}\n`);
    process.exitCode = 1;
  }
}
