import fs from 'node:fs';
import path from 'node:path';

/**
 * @param {string} tempDirectory
 * @param {string} executableName
 * @param {string} body
 */
export function writeFakeExecutable(tempDirectory, executableName, body) {
  if (!executableName || path.basename(executableName) !== executableName) {
    throw new Error(`Invalid executable name: ${executableName}`);
  }

  const fakeBinDirectory = path.join(tempDirectory, 'fake-bin');
  fs.mkdirSync(fakeBinDirectory, { recursive: true });
  const executablePath = path.join(fakeBinDirectory, executableName);
  fs.writeFileSync(executablePath, body, { encoding: 'utf8' });
  fs.chmodSync(executablePath, 0o755);
  return fakeBinDirectory;
}
