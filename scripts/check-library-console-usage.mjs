import path from 'node:path';
import { access, readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const CONSOLE_CALL_PATTERN = /\bconsole\.(debug|error|info|log|warn)\s*\(/u;

const ALLOWED_CONSOLE_LINES = new Map([
  ['lib/graphics/worker/graphics.worker.js', new Set(['console.log(eventData);'])],
  ['lib/audio/worker/audio.worker.js', new Set(['console.log(eventData);'])],
  ['lib/memory/worker/memory.worker.js', new Set(['console.log(eventData);'])],
  ['lib/controller/worker/controller.worker.js', new Set(['console.log(eventData);'])],
  ['lib/worker/workerapi.js', new Set(["console.error('workerapi: No callback was provided to onMessage!');"])],
  [
    'lib/plugins/plugins.js',
    new Set([
      "console.error(`There was an error running the '${hookConfig.key}' hook, on the ${plugin.name} plugin.`);",
      'console.error(e);',
    ]),
  ],
  [
    'lib/wasmboy/onmessage.js',
    new Set([
      "console.log('Wasmboy Crashed!');",
      'console.log(`Program Counter: 0x${programCounter.toString(16)}`);',
      'console.log(`Opcode: 0x${opcode[0].toString(16)}`);',
    ]),
  ],
  ['voxel-wrapper.ts', new Set(['console.warn(`[WasmBoy-Voxel deprecation] ${message}`);'])],
]);

const IGNORED_DIRECTORY_PREFIXES = ['lib/3p/'];

/**
 * @param {string} left
 * @param {string} right
 */
function compareOrdinalStrings(left, right) {
  if (left === right) {
    return 0;
  }
  return left < right ? -1 : 1;
}

/**
 * @param {string} relativePath
 */
function normalizePath(relativePath) {
  return relativePath.replaceAll('\\', '/').replace(/^\.?\//u, '');
}

/**
 * @param {string} line
 */
function isCommentLine(line) {
  const trimmed = line.trimStart();
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('*/') ||
    trimmed.startsWith('// biome-ignore')
  );
}

/**
 * @param {string} normalizedPath
 */
function shouldIgnoreFile(normalizedPath) {
  return IGNORED_DIRECTORY_PREFIXES.some(prefix => normalizedPath.startsWith(prefix));
}

/**
 * @param {string} normalizedPath
 * @param {string} source
 */
export function findConsoleUsageViolations(normalizedPath, source) {
  if (typeof source !== 'string') {
    throw new Error(`Invalid file source for ${normalizedPath}`);
  }

  if (shouldIgnoreFile(normalizedPath)) {
    return [];
  }

  const allowedLines = ALLOWED_CONSOLE_LINES.get(normalizedPath);
  const sourceLines = source.split(/\r?\n/u);
  const violations = [];

  for (let index = 0; index < sourceLines.length; index += 1) {
    const line = sourceLines[index];
    if (!line) continue;
    if (isCommentLine(line)) continue;
    if (!CONSOLE_CALL_PATTERN.test(line)) continue;

    const trimmedLine = line.trim();
    if (allowedLines?.has(trimmedLine)) {
      continue;
    }

    violations.push({
      filePath: normalizedPath,
      lineNumber: index + 1,
      lineText: trimmedLine,
    });
  }

  return violations;
}

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

  const files = [];
  const entries = await readdir(absoluteRoot, { withFileTypes: true });

  for (const entry of entries) {
    const absoluteEntryPath = path.join(absoluteRoot, entry.name);
    if (entry.isDirectory()) {
      const nestedFiles = await listFilesRecursively(absoluteEntryPath);
      files.push(...nestedFiles);
      continue;
    }

    if (entry.isFile()) {
      files.push(absoluteEntryPath);
    }
  }

  return files;
}

/**
 * @param {{
 *   repoRoot?: string;
 * }} [options]
 */
export async function runLibraryConsoleUsageCheck(options = {}) {
  const repoRoot = options.repoRoot ?? process.cwd();
  const libRoot = path.resolve(repoRoot, 'lib');
  const libFiles = await listFilesRecursively(libRoot);
  const targetFiles = libFiles.filter(filePath => filePath.endsWith('.js'));

  targetFiles.push(path.resolve(repoRoot, 'voxel-wrapper.ts'));

  const violations = [];

  for (const absoluteFilePath of targetFiles) {
    if (!(await pathExists(absoluteFilePath))) {
      continue;
    }

    const relativePath = normalizePath(path.relative(repoRoot, absoluteFilePath));
    const fileSource = await readFile(absoluteFilePath, 'utf8');
    const fileViolations = findConsoleUsageViolations(relativePath, fileSource);
    violations.push(...fileViolations);
  }

  violations.sort((left, right) => {
    if (left.filePath !== right.filePath) {
      return compareOrdinalStrings(left.filePath, right.filePath);
    }
    if (left.lineNumber !== right.lineNumber) {
      return left.lineNumber - right.lineNumber;
    }
    return compareOrdinalStrings(left.lineText, right.lineText);
  });

  return {
    isValid: violations.length === 0,
    violations,
  };
}

const currentFilePath = fileURLToPath(import.meta.url);
const invokedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : null;
const shouldRunAsScript = invokedFilePath === currentFilePath;

if (shouldRunAsScript) {
  try {
    const result = await runLibraryConsoleUsageCheck();
    if (!result.isValid) {
      process.stderr.write('[lint:library:console] Unexpected console usage detected:\n');
      for (const violation of result.violations) {
        process.stderr.write(`[lint:library:console] - ${violation.filePath}:${String(violation.lineNumber)} ${violation.lineText}\n`);
      }
      process.exitCode = 1;
    } else {
      process.stdout.write('[lint:library:console] No unexpected console usage found.\n');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown console lint error';
    process.stderr.write(`[lint:library:console] ${message}\n`);
    process.exitCode = 1;
  }
}
