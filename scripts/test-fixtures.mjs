import fs from 'node:fs';
import path from 'node:path';

/**
 * @param {unknown} value
 */
function formatErrorValue(value) {
  try {
    return String(value);
  } catch {
    return '[unprintable]';
  }
}

/**
 * @param {string} executableName
 */
function isWindowsReservedExecutableName(executableName) {
  return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/iu.test(executableName);
}

/**
 * @param {string} tempDirectory
 * @param {string} executableName
 * @param {string} body
 */
export function writeFakeExecutable(tempDirectory, executableName, body) {
  if (typeof tempDirectory !== 'string' || tempDirectory.trim().length === 0 || tempDirectory.includes('\0')) {
    throw new Error(`Invalid temp directory: ${formatErrorValue(tempDirectory)}`);
  }

  if (typeof executableName !== 'string') {
    throw new Error(`Invalid executable name: ${formatErrorValue(executableName)}`);
  }

  if (typeof body !== 'string' || body.trim().length === 0 || body.includes('\0')) {
    throw new Error(`Invalid executable body for ${formatErrorValue(executableName)}`);
  }

  if (
    !executableName ||
    Buffer.byteLength(executableName, 'utf8') > 255 ||
    isWindowsReservedExecutableName(executableName) ||
    executableName.includes('\0') ||
    /\s/u.test(executableName) ||
    executableName === '.' ||
    executableName === '..' ||
    /[\\/]/u.test(executableName) ||
    path.basename(executableName) !== executableName
  ) {
    throw new Error(`Invalid executable name: ${formatErrorValue(executableName)}`);
  }

  const fakeBinDirectory = path.join(tempDirectory, 'fake-bin');
  fs.mkdirSync(fakeBinDirectory, { recursive: true });
  const executablePath = path.join(fakeBinDirectory, executableName);
  fs.writeFileSync(executablePath, body, { encoding: 'utf8' });
  fs.chmodSync(executablePath, 0o755);
  return fakeBinDirectory;
}
