import fs from 'node:fs';

const TEMP_DIRECTORY_SET_SYMBOL = Symbol.for('wasmboy.scriptTests.tempDirectories');
const TEMP_DIRECTORY_INSTALL_SYMBOL = Symbol.for('wasmboy.scriptTests.tempDirectoryCleanupInstalled');
const TEMP_DIRECTORY_EXIT_HOOK_SYMBOL = Symbol.for('wasmboy.scriptTests.tempDirectoryExitHookInstalled');
const TEMP_DIRECTORY_ORIGINAL_MKDTEMP_SYNC_SYMBOL = Symbol.for('wasmboy.scriptTests.originalMkdtempSync');

function getTrackedTempDirectories() {
  const globalState = globalThis;
  if (!(TEMP_DIRECTORY_SET_SYMBOL in globalState)) {
    globalState[TEMP_DIRECTORY_SET_SYMBOL] = new Set();
  }
  return globalState[TEMP_DIRECTORY_SET_SYMBOL];
}

export function trackTempDirectory(tempDirectoryPath) {
  if (typeof tempDirectoryPath !== 'string' || tempDirectoryPath.length === 0) {
    return tempDirectoryPath;
  }
  getTrackedTempDirectories().add(tempDirectoryPath);
  return tempDirectoryPath;
}

export function cleanupTrackedTempDirectories(fsModule = fs) {
  const trackedTempDirectories = getTrackedTempDirectories();
  const tempDirectories = Array.from(trackedTempDirectories).sort((left, right) => right.length - left.length);
  tempDirectories.forEach(tempDirectoryPath => {
    try {
      fsModule.rmSync(tempDirectoryPath, { recursive: true, force: true });
    } catch {
      /* Ignore temp cleanup failures in tests. */
    } finally {
      trackedTempDirectories.delete(tempDirectoryPath);
    }
  });
}

export function installTempDirectoryCleanup(fsModule = fs) {
  const globalState = globalThis;
  if (!globalState[TEMP_DIRECTORY_INSTALL_SYMBOL]) {
    globalState[TEMP_DIRECTORY_ORIGINAL_MKDTEMP_SYNC_SYMBOL] = fsModule.mkdtempSync.bind(fsModule);
    fsModule.mkdtempSync = (...args) => trackTempDirectory(globalState[TEMP_DIRECTORY_ORIGINAL_MKDTEMP_SYNC_SYMBOL](...args));
    globalState[TEMP_DIRECTORY_INSTALL_SYMBOL] = true;
  }

  if (!globalState[TEMP_DIRECTORY_EXIT_HOOK_SYMBOL]) {
    process.on('exit', () => {
      cleanupTrackedTempDirectories(fsModule);
    });
    globalState[TEMP_DIRECTORY_EXIT_HOOK_SYMBOL] = true;
  }
}
