import path from 'node:path';
import { access, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { normalizeArtifactPath, shouldRemoveGeneratedFile } from './artifact-policy.mjs';

const DIRECTORY_CLEAN_TARGETS = ['build', path.join('apps', 'debugger', '.next')];
const GENERATED_FILE_SCAN_ROOTS = [
  path.join('test', 'accuracy', 'testroms'),
  path.join('test', 'performance', 'testroms'),
  path.join('test', 'integration'),
];
const SCRIPT_USAGE = `Usage: node scripts/clean-accidental-build-artifacts.mjs [--dry-run] [--json]\n\nOptions:\n  --dry-run  Print cleanup candidates without deleting files.\n  --json     Emit machine-readable JSON summary.\n  --help     Show this usage message.\n`;

/**
 * @param {string} absolutePath
 */
async function pathExists(absolutePath) {
  try {
    await access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} absoluteRoot
 * @returns {Promise<string[]>}
 */
async function listFilesRecursively(absoluteRoot) {
  if (!(await pathExists(absoluteRoot))) {
    return [];
  }

  const filePaths = [];
  const entries = await readdir(absoluteRoot, { withFileTypes: true });

  for (const entry of entries) {
    const absoluteEntryPath = path.join(absoluteRoot, entry.name);
    if (entry.isDirectory()) {
      const nestedFiles = await listFilesRecursively(absoluteEntryPath);
      filePaths.push(...nestedFiles);
      continue;
    }

    if (entry.isFile()) {
      filePaths.push(absoluteEntryPath);
    }
  }

  return filePaths;
}

/**
 * @param {{
 *   repoRoot?: string;
 *   dryRun?: boolean;
 * }} [options]
 */
export async function cleanAccidentalBuildArtifacts(options = {}) {
  const repoRoot = options.repoRoot ?? process.cwd();
  const dryRun = options.dryRun ?? false;
  const deletedDirectories = [];
  const deletedFiles = [];

  for (const targetDirectory of DIRECTORY_CLEAN_TARGETS) {
    const absoluteTargetDirectory = path.resolve(repoRoot, targetDirectory);
    if (!(await pathExists(absoluteTargetDirectory))) {
      continue;
    }

    if (!dryRun) {
      await rm(absoluteTargetDirectory, { recursive: true, force: true });
    }
    deletedDirectories.push(targetDirectory);
  }

  for (const scanRoot of GENERATED_FILE_SCAN_ROOTS) {
    const absoluteScanRoot = path.resolve(repoRoot, scanRoot);
    const candidateFiles = await listFilesRecursively(absoluteScanRoot);

    for (const absoluteCandidateFile of candidateFiles) {
      const relativeCandidateFile = path.relative(repoRoot, absoluteCandidateFile);
      if (!shouldRemoveGeneratedFile(relativeCandidateFile)) {
        continue;
      }

      if (!dryRun) {
        await rm(absoluteCandidateFile, { force: true });
      }
      deletedFiles.push(normalizeArtifactPath(relativeCandidateFile));
    }
  }

  return {
    deletedDirectories: deletedDirectories.sort((left, right) => (left === right ? 0 : left < right ? -1 : 1)),
    deletedFiles: deletedFiles.sort((left, right) => (left === right ? 0 : left < right ? -1 : 1)),
  };
}

/**
 * @param {string[]} argv
 */
export function parseCleanArtifactsArgs(argv) {
  if (!Array.isArray(argv)) {
    throw new TypeError('Expected argv to be an array.');
  }

  let dryRun = false;
  let jsonOutput = false;
  let helpRequested = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (typeof token !== 'string') {
      throw new TypeError(`Expected argv[${String(index)}] to be a string.`);
    }

    if (token === '--dry-run') {
      if (dryRun) {
        throw new Error('Duplicate --dry-run flag received.');
      }
      dryRun = true;
      continue;
    }

    if (token === '--json') {
      if (jsonOutput) {
        throw new Error('Duplicate --json flag received.');
      }
      jsonOutput = true;
      continue;
    }

    if (token === '--help' || token === '-h') {
      if (helpRequested) {
        throw new Error('Duplicate help flag received.');
      }
      helpRequested = true;
      continue;
    }

    throw new Error(`Unknown argument "${token}". Supported flags: --dry-run, --json, --help.`);
  }

  if (helpRequested) {
    return { dryRun: false, jsonOutput: false, shouldPrintUsage: true };
  }

  return { dryRun, jsonOutput, shouldPrintUsage: false };
}

const currentFilePath = fileURLToPath(import.meta.url);
const invokedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : null;
const shouldRunAsScript = invokedFilePath === currentFilePath;

if (shouldRunAsScript) {
  try {
    const args = parseCleanArtifactsArgs(process.argv.slice(2));

    if (args.shouldPrintUsage) {
      process.stdout.write(SCRIPT_USAGE);
      process.exitCode = 0;
    } else {
      const result = await cleanAccidentalBuildArtifacts({ dryRun: args.dryRun });
      const removedCount = result.deletedDirectories.length + result.deletedFiles.length;
      const summaryVerb = args.dryRun ? 'would remove' : 'removed';
      const summary = {
        mode: args.dryRun ? 'dry-run' : 'apply',
        timestampMs: Date.now(),
        removedCount,
        deletedDirectories: result.deletedDirectories,
        deletedFiles: result.deletedFiles,
      };

      if (args.jsonOutput) {
        process.stdout.write(`${JSON.stringify(summary)}\n`);
      } else {
        process.stdout.write(`[clean:artifacts] ${summaryVerb} ${removedCount} accidental build artifact target(s).\n`);

        if (result.deletedDirectories.length > 0) {
          process.stdout.write(
            `[clean:artifacts] ${args.dryRun ? 'candidate' : 'removed'} directories: ${result.deletedDirectories.join(', ')}\n`,
          );
        }

        if (result.deletedFiles.length > 0) {
          process.stdout.write(`[clean:artifacts] ${args.dryRun ? 'candidate' : 'removed'} files: ${result.deletedFiles.join(', ')}\n`);
        }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown accidental artifact cleanup error';
    process.stderr.write(`[clean:artifacts] ${message}\n`);
    process.exitCode = 1;
  }
}
