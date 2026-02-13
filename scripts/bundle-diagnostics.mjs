import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

/**
 * Usage:
 * node scripts/bundle-diagnostics.mjs \
 *   --output artifacts/ci-diagnostics.tar.gz \
 *   --pattern 'ci-quality.log' \
 *   --pattern 'test/core/save-state/*.png'
 */

const DEFAULT_EMPTY_MESSAGE = 'No diagnostics files were produced for this run.';

function readRequiredValue(argv, index, flagName) {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${flagName} argument.`);
  }

  return value;
}

function parseArgs(argv) {
  /** @type {{output: string; patterns: string[]; message: string}} */
  const parsed = {
    output: '',
    patterns: [],
    message: DEFAULT_EMPTY_MESSAGE,
  };
  let outputConfigured = false;
  let messageConfigured = false;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '--output') {
      if (outputConfigured) {
        throw new Error('Duplicate --output argument provided.');
      }
      parsed.output = readRequiredValue(argv, i, '--output');
      outputConfigured = true;
      i += 1;
      continue;
    }

    if (token === '--pattern') {
      parsed.patterns.push(readRequiredValue(argv, i, '--pattern'));
      i += 1;
      continue;
    }

    if (token === '--message') {
      if (messageConfigured) {
        throw new Error('Duplicate --message argument provided.');
      }
      parsed.message = readRequiredValue(argv, i, '--message');
      messageConfigured = true;
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
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

function collectFiles(patterns) {
  const filesByResolvedPath = new Map();

  for (const pattern of patterns) {
    const matches = fs.globSync(pattern, { withFileTypes: false });
    for (const file of matches) {
      const resolvedFilePath = path.resolve(file);
      if (fs.existsSync(resolvedFilePath) && fs.statSync(resolvedFilePath).isFile()) {
        const normalizedArchivePath = path.normalize(file);
        filesByResolvedPath.set(resolvedFilePath, normalizedArchivePath);
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

function createArchive(outputPath, files) {
  const archiveResult = spawnSync('tar', ['-czf', outputPath, '--', ...files], {
    stdio: 'inherit',
  });

  if (archiveResult.error) {
    throw archiveResult.error;
  }

  if (archiveResult.status !== 0) {
    throw new Error(`tar exited with status ${archiveResult.status ?? 'unknown'}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  assertRequiredConfig(args.output, args.patterns);

  fs.mkdirSync(path.dirname(args.output), { recursive: true });

  const matchedFiles = collectFiles(args.patterns);
  const placeholderFile = matchedFiles.length > 0 ? null : createPlaceholderFile(args.output, args.message);
  const filesToArchive = matchedFiles.length > 0 ? matchedFiles : [placeholderFile];

  try {
    createArchive(args.output, filesToArchive);
  } finally {
    if (placeholderFile && fs.existsSync(placeholderFile)) {
      fs.unlinkSync(placeholderFile);
    }
  }
}

main();
