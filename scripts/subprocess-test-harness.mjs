import { spawnSync } from 'node:child_process';

export const DEFAULT_SUBPROCESS_TIMEOUT_MS = 30000;

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
 * @param {string} command
 * @param {string[]} args
 * @param {{
 *   cwd?: string;
 *   env?: Record<string, string | undefined>;
 *   timeoutMs?: number;
 *   description?: string;
 * }} [options]
 */
export function runSubprocess(command, args, options = {}) {
  if (!Array.isArray(args)) {
    throw new Error('Expected subprocess args to be an array.');
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_SUBPROCESS_TIMEOUT_MS;
  const description = options.description ?? `${command} ${args.join(' ')}`.trim();
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      ...(options.env ?? {}),
    },
    timeout: timeoutMs,
    killSignal: 'SIGTERM',
  });

  if (result.error) {
    if (result.error.code === 'ETIMEDOUT') {
      throw new Error(`[subprocess:test-harness] ${description} timed out after ${String(timeoutMs)}ms.`);
    }

    throw new Error(`[subprocess:test-harness] ${description} failed: ${formatErrorValue(result.error.message)}`);
  }

  return result;
}
