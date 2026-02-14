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
 * }} [options]
 */
export async function cleanAccidentalBuildArtifacts(options = {}) {
  const repoRoot = options.repoRoot ?? process.cwd();
  const deletedDirectories = [];
  const deletedFiles = [];

  for (const targetDirectory of DIRECTORY_CLEAN_TARGETS) {
    const absoluteTargetDirectory = path.resolve(repoRoot, targetDirectory);
    if (!(await pathExists(absoluteTargetDirectory))) {
      continue;
    }

    await rm(absoluteTargetDirectory, { recursive: true, force: true });
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

      await rm(absoluteCandidateFile, { force: true });
      deletedFiles.push(normalizeArtifactPath(relativeCandidateFile));
    }
  }

  return {
    deletedDirectories: deletedDirectories.sort((left, right) => (left === right ? 0 : left < right ? -1 : 1)),
    deletedFiles: deletedFiles.sort((left, right) => (left === right ? 0 : left < right ? -1 : 1)),
  };
}

const currentFilePath = fileURLToPath(import.meta.url);
const invokedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : null;
const shouldRunAsScript = invokedFilePath === currentFilePath;

if (shouldRunAsScript) {
  try {
    const result = await cleanAccidentalBuildArtifacts();
    const removedCount = result.deletedDirectories.length + result.deletedFiles.length;

    process.stdout.write(`[clean:artifacts] removed ${removedCount} accidental build artifact target(s).\n`);

    if (result.deletedDirectories.length > 0) {
      process.stdout.write(`[clean:artifacts] removed directories: ${result.deletedDirectories.join(', ')}\n`);
    }

    if (result.deletedFiles.length > 0) {
      process.stdout.write(`[clean:artifacts] removed files: ${result.deletedFiles.join(', ')}\n`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown accidental artifact cleanup error';
    process.stderr.write(`[clean:artifacts] ${message}\n`);
    process.exitCode = 1;
  }
}
