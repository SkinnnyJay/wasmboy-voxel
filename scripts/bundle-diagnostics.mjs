import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { resolveStrictPositiveIntegerEnv } from './cli-timeout.mjs';
import { readRequiredArgumentValue, validateRequiredArgumentValue } from './cli-arg-values.mjs';

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
const CLI_TIMEOUT_FLAG = '--tar-timeout-ms';
const HELP_SHORT_FLAG = '-h';
const HELP_LONG_FLAG = '--help';
const OUTPUT_FLAG = '--output';
const PATTERN_FLAG = '--pattern';
const MESSAGE_FLAG = '--message';
const HELP_ARGS = new Set([HELP_LONG_FLAG, HELP_SHORT_FLAG]);
const KNOWN_ARGS = new Set([OUTPUT_FLAG, PATTERN_FLAG, MESSAGE_FLAG, CLI_TIMEOUT_FLAG, HELP_LONG_FLAG, HELP_SHORT_FLAG]);
const USAGE_TEXT = `Usage:
node scripts/bundle-diagnostics.mjs \\
  --output artifacts/ci-diagnostics.tar.gz \\
  --pattern 'ci-quality.log' \\
  --pattern 'test/core/save-state/*.png' \\
  [--message 'No diagnostics files were produced for this run.'] \\
  [--tar-timeout-ms 120000]

Options:
  -h, --help                      Show this help message
  --tar-timeout-ms <ms>           Override tar timeout in milliseconds for this invocation
  --tar-timeout-ms=<ms>           Inline tar timeout override variant

Environment:
  ${TAR_TIMEOUT_ENV_VARIABLE}=<ms>  tar timeout in milliseconds (default: ${DEFAULT_TAR_TIMEOUT_MS})`;

function parseArgs(argv) {
  /** @type {{output: string; patterns: string[]; message: string; showHelp: boolean; tarTimeoutMsOverride: string}} */
  const parsed = {
    output: '',
    patterns: [],
    message: DEFAULT_EMPTY_MESSAGE,
    showHelp: false,
    tarTimeoutMsOverride: '',
  };
  let outputConfigured = false;
  let messageConfigured = false;
  let helpConfigured = false;
  let timeoutConfigured = false;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === HELP_LONG_FLAG || token === HELP_SHORT_FLAG) {
      if (helpConfigured) {
        throw new Error('Duplicate help flag provided.');
      }
      parsed.showHelp = true;
      helpConfigured = true;
      continue;
    }

    if (token.startsWith(`${OUTPUT_FLAG}=`)) {
      if (outputConfigured) {
        throw new Error(`Duplicate ${OUTPUT_FLAG} argument provided.`);
      }
      const value = token.slice(`${OUTPUT_FLAG}=`.length);
      validateRequiredArgumentValue(value, {
        flagName: OUTPUT_FLAG,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      });
      parsed.output = value;
      outputConfigured = true;
      continue;
    }

    if (token.startsWith(`${PATTERN_FLAG}=`)) {
      const value = token.slice(`${PATTERN_FLAG}=`.length);
      validateRequiredArgumentValue(value, {
        flagName: PATTERN_FLAG,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      });
      parsed.patterns.push(value);
      continue;
    }

    if (token.startsWith(`${MESSAGE_FLAG}=`)) {
      if (messageConfigured) {
        throw new Error(`Duplicate ${MESSAGE_FLAG} argument provided.`);
      }
      const value = token.slice(`${MESSAGE_FLAG}=`.length);
      validateRequiredArgumentValue(value, {
        flagName: MESSAGE_FLAG,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
        allowedKnownValues: HELP_ARGS,
      });
      parsed.message = value;
      messageConfigured = true;
      continue;
    }

    if (token.startsWith(`${CLI_TIMEOUT_FLAG}=`)) {
      if (timeoutConfigured) {
        throw new Error(`Duplicate ${CLI_TIMEOUT_FLAG} argument provided.`);
      }
      const value = token.slice(`${CLI_TIMEOUT_FLAG}=`.length);
      validateRequiredArgumentValue(value, {
        flagName: CLI_TIMEOUT_FLAG,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      });
      parsed.tarTimeoutMsOverride = value;
      timeoutConfigured = true;
      continue;
    }

    if (token === OUTPUT_FLAG) {
      if (outputConfigured) {
        throw new Error(`Duplicate ${OUTPUT_FLAG} argument provided.`);
      }
      parsed.output = readRequiredArgumentValue(argv, i, {
        flagName: OUTPUT_FLAG,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
      });
      outputConfigured = true;
      i += 1;
      continue;
    }

    if (token === PATTERN_FLAG) {
      parsed.patterns.push(
        readRequiredArgumentValue(argv, i, {
          flagName: PATTERN_FLAG,
          knownArgs: KNOWN_ARGS,
          allowDoubleDashValue: false,
        }),
      );
      i += 1;
      continue;
    }

    if (token === MESSAGE_FLAG) {
      if (messageConfigured) {
        throw new Error(`Duplicate ${MESSAGE_FLAG} argument provided.`);
      }
      parsed.message = readRequiredArgumentValue(argv, i, {
        flagName: MESSAGE_FLAG,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: true,
        allowWhitespaceOnly: true,
        allowedKnownValues: HELP_ARGS,
      });
      messageConfigured = true;
      i += 1;
      continue;
    }

    if (token === CLI_TIMEOUT_FLAG) {
      if (timeoutConfigured) {
        throw new Error(`Duplicate ${CLI_TIMEOUT_FLAG} argument provided.`);
      }
      parsed.tarTimeoutMsOverride = readRequiredArgumentValue(argv, i, {
        flagName: CLI_TIMEOUT_FLAG,
        knownArgs: KNOWN_ARGS,
        allowDoubleDashValue: false,
        allowWhitespaceOnly: true,
      });
      timeoutConfigured = true;
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  if (parsed.showHelp && (outputConfigured || messageConfigured || timeoutConfigured || parsed.patterns.length > 0)) {
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
    const envTarTimeoutMs = resolveStrictPositiveIntegerEnv({
      name: TAR_TIMEOUT_ENV_VARIABLE,
      rawValue: process.env[TAR_TIMEOUT_ENV_VARIABLE],
      defaultValue: DEFAULT_TAR_TIMEOUT_MS,
    });
    tarTimeoutMs = resolveStrictPositiveIntegerEnv({
      name: CLI_TIMEOUT_FLAG,
      rawValue: args.tarTimeoutMsOverride,
      defaultValue: envTarTimeoutMs,
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
