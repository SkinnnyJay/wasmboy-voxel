import { spawnSync } from 'node:child_process';

/**
 * @param {string} [platform]
 */
export function resolveTimeoutKillSignal(platform = process.platform) {
  return platform === 'win32' ? 'SIGKILL' : 'SIGTERM';
}

/**
 * @param {number | undefined} pid
 * @param {{
 *   platform?: string;
 *   spawn?: (command: string, args: string[], options: Record<string, unknown>) => { status?: number; error?: Error };
 * }} [options]
 */
export function attemptWindowsTimeoutTerminationFallback(pid, options = {}) {
  const platform = options.platform ?? process.platform;
  if (platform !== 'win32') {
    return false;
  }

  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }

  const spawn = options.spawn ?? spawnSync;
  const fallbackResult = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
    stdio: 'ignore',
  });
  return !fallbackResult.error && fallbackResult.status === 0;
}
