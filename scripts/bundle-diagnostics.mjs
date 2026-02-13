import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { resolveStrictPositiveIntegerEnv } from './cli-timeout.mjs';

/**
 * Usage:
 * node scripts/bundle-diagnostics.mjs \
 *   --output artifacts/ci-diagnostics.tar.gz \
 *   --pattern 'ci-quality.log' \
 *   --pattern 'test/core/save-state/*.png'
 */

const DEFAULT_EMPTY_MESSAGE = 'No diagnostics files were produced for this run.';
const DEFAULT_TAR_TIMEOUT_MS = 120000;
const TAR_TIMEOUT_ENV_VARIABLE = 'BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS';
const KNOWN_ARGS = new Set(['--output', '--pattern', '--message', '--help', '-h']);
const USAGE_TEXT = `Usage:
node scripts/bundle-diagnostics.mjs \\
  --output artifacts/ci-diagnostics.tar.gz \\
  --pattern 'ci-quality.log' \\
  --pattern 'test/core/save-state/*.png' \\
  [--message 'No diagnostics files were produced for this run.']

Options:
  -h, --help   Show this help message

Environment:
  ${TAR_TIMEOUT_ENV_VARIABLE}=<ms>  tar timeout in milliseconds (default: ${DEFAULT_TAR_TIMEOUT_MS})`;

/**
 * @param {string[]} argv
 * @param {number} index
 * @param {string} flagName
 * @param {{allowDoubleDashValue: boolean}} options
 */
function readRequiredValue(argv, index, flagName, options) {
  const value = argv[index + 1];
  if (!value || KNOWN_ARGS.has(value)) {
    throw new Error(`Missing value for ${flagName} argument.`);
  }

  if (!options.allowDoubleDashValue && /^-[a-zA-Z]$/u.test(value)) {
    throw new Error(`Missing value for ${flagName} argument.`);
  }

  if (!options.allowDoubleDashValue && value.startsWith('--')) {
    throw new Error(`Missing value for ${flagName} argument.`);
  }

  return value;
}

function parseArgs(argv) {
  /** @type {{output: string; patterns: string[]; message: string; showHelp: boolean}} */
  const parsed = {
    output: '',
    patterns: [],
    message: DEFAULT_EMPTY_MESSAGE,
    showHelp: false,
  };
  let outputConfigured = false;
  let messageConfigured = false;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '--help' || token === '-h') {
      parsed.showHelp = true;
      continue;
    }

    if (token === '--output') {
      if (outputConfigured) {
        throw new Error('Duplicate --output argument provided.');
      }
      parsed.output = readRequiredValue(argv, i, '--output', { allowDoubleDashValue: false });
      outputConfigured = true;
      i += 1;
      continue;
    }

    if (token === '--pattern') {
      parsed.patterns.push(readRequiredValue(argv, i, '--pattern', { allowDoubleDashValue: false }));
      i += 1;
      continue;
    }

    if (token === '--message') {
      if (messageConfigured) {
        throw new Error('Duplicate --message argument provided.');
      }
      parsed.message = readRequiredValue(argv, i, '--message', { allowDoubleDashValue: true });
      messageConfigured = true;
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  if (parsed.showHelp && (outputConfigured || messageConfigured || parsed.patterns.length > 0)) {
    throw new Error('Help flag cannot be combined with other arguments.');
  }

  return parsed;
}

function assertRequiredConfig(output, patterns) {
  if (output.length === 0) {
    throw new Error('Missing required --output argument.');
  }

  if (patterns.length === 0) {
    throw new Error('Provide at least one --pattern argument.');
  }
}

function collectFiles(patterns, outputPath) {
  const filesByResolvedPath = new Map();
  const resolvedOutputPath = path.resolve(outputPath);

  function toArchivePath(filePath, resolvedFilePath) {
    const normalizedInputPath = path.normalize(filePath);

    if (path.isAbsolute(normalizedInputPath)) {
      const relativeToCwd = path.relative(process.cwd(), resolvedFilePath);
      if (relativeToCwd.length > 0 && !relativeToCwd.startsWith('..') && !path.isAbsolute(relativeToCwd)) {
        return path.normalize(relativeToCwd);
      }
    }

    return normalizedInputPath;
  }

  function pickPreferredArchivePath(existingPath, candidatePath) {
    if (!existingPath) {
      return candidatePath;
    }

    const existingIsAbsolute = path.isAbsolute(existingPath);
    const candidateIsAbsolute = path.isAbsolute(candidatePath);

    if (existingIsAbsolute !== candidateIsAbsolute) {
      return existingIsAbsolute ? candidatePath : existingPath;
    }

    if (candidatePath.length !== existingPath.length) {
      return candidatePath.length < existingPath.length ? candidatePath : existingPath;
    }

    return candidatePath.localeCompare(existingPath) < 0 ? candidatePath : existingPath;
  }

  for (const pattern of patterns) {
    const matches = fs.globSync(pattern, { withFileTypes: false });
    for (const file of matches) {
      const resolvedFilePath = path.resolve(file);
      if (resolvedFilePath === resolvedOutputPath) {
        continue;
      }

      if (fs.existsSync(resolvedFilePath) && fs.statSync(resolvedFilePath).isFile()) {
        const candidateArchivePath = toArchivePath(file, resolvedFilePath);
        const existingArchivePath = filesByResolvedPath.get(resolvedFilePath);
        filesByResolvedPath.set(resolvedFilePath, pickPreferredArchivePath(existingArchivePath, candidateArchivePath));
      }
    }
  }

  return [...filesByResolvedPath.values()].sort((left, right) => left.localeCompare(right));
}

function createPlaceholderFile(outputPath, message) {
  const outputDirectory = path.dirname(outputPath);
  const outputName = path.basename(outputPath).replace(/\.tar\.gz$/u, '');
  const placeholderPath = path.join(outputDirectory, `${outputName}.txt`);
  fs.writeFileSync(placeholderPath, `${message}\n`, 'utf8');
  return placeholderPath;
}

function createArchive(outputPath, files, timeoutMs) {
  const archiveResult = spawnSync('tar', ['-czf', outputPath, '--', ...files], {
    stdio: 'inherit',
    timeout: timeoutMs,
    killSignal: 'SIGTERM',
  });

  if (archiveResult.error) {
    if (archiveResult.error.code === 'ETIMEDOUT') {
      throw new Error(`tar timed out after ${timeoutMs}ms`);
    }

    throw archiveResult.error;
  }

  if (archiveResult.status !== 0) {
    throw new Error(`tar exited with status ${archiveResult.status ?? 'unknown'}`);
  }
}

function toErrorMessage(error) {
  return error instanceof Error ? error.message : 'Unexpected diagnostics bundling error.';
}

function failWithUsage(message) {
  console.error(`[bundle-diagnostics] ${message}`);
  console.error(USAGE_TEXT);
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    failWithUsage(toErrorMessage(error));
    process.exit(1);
  }

  if (args.showHelp) {
    console.log(USAGE_TEXT);
    return;
  }

  let tarTimeoutMs = DEFAULT_TAR_TIMEOUT_MS;
  try {
    assertRequiredConfig(args.output, args.patterns);
    tarTimeoutMs = resolveStrictPositiveIntegerEnv({
      name: TAR_TIMEOUT_ENV_VARIABLE,
      rawValue: process.env[TAR_TIMEOUT_ENV_VARIABLE],
      defaultValue: DEFAULT_TAR_TIMEOUT_MS,
    });
  } catch (error) {
    failWithUsage(toErrorMessage(error));
    process.exit(1);
  }

  let placeholderFile = null;
  try {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });

    const matchedFiles = collectFiles(args.patterns, args.output);
    placeholderFile = matchedFiles.length > 0 ? null : createPlaceholderFile(args.output, args.message);
    const filesToArchive = matchedFiles.length > 0 ? matchedFiles : [placeholderFile];

    createArchive(args.output, filesToArchive, tarTimeoutMs);
  } catch (error) {
    console.error(`[bundle-diagnostics] ${toErrorMessage(error)}`);
    process.exit(1);
  } finally {
    if (placeholderFile && fs.existsSync(placeholderFile)) {
      fs.unlinkSync(placeholderFile);
    }
  }
}

main();
