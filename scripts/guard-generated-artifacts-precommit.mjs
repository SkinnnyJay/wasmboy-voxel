import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeArtifactPath, shouldBlockStagedArtifactPath } from './artifact-policy.mjs';
const ALLOW_OVERRIDE_ENV_NAME = 'WASMBOY_ALLOW_GENERATED_EDITS';
const SCRIPT_USAGE = `Usage: node scripts/guard-generated-artifacts-precommit.mjs [--help]\n\nOptions:\n  --help, -h  Show this usage message.\n`;

/**
 * @param {string[]} stagedPaths
 */
export function findBlockedArtifactPaths(stagedPaths) {
  const blockedPathSet = new Set();

  for (const stagedPath of stagedPaths) {
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
  for (const token of argv) {
    if (token === '--help' || token === '-h') {
      return { shouldPrintUsage: true };
    }

    throw new Error(`Unknown argument "${token}". Supported flags: --help.`);
  }

  return { shouldPrintUsage: false };
}

function runPrecommitGuard() {
  const allowGeneratedEdits = process.env[ALLOW_OVERRIDE_ENV_NAME] === '1';
  const stagedPaths = readStagedPathsFromGit();
  const validationResult = validateGeneratedArtifactStaging(stagedPaths, { allowGeneratedEdits });

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
      runPrecommitGuard();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown generated-artifact guard error';
    process.stderr.write(`[guard:generated-artifacts] ${message}\n`);
    process.exitCode = 1;
  }
}
