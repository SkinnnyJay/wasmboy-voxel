const DEFAULT_NUTJS_ACTION_TIMEOUT_MS = 10000;

/**
 * @param {number} timeoutMs
 */
function validateTimeout(timeoutMs) {
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError('[nutjs:resource-cleanup] Expected timeoutMs to be a positive integer when provided.');
  }
}

/**
 * @param {() => Promise<unknown>} action
 * @param {number} timeoutMs
 */
async function runWithTimeout(action, timeoutMs) {
  let timeoutHandle = null;
  try {
    return await Promise.race([
      action(),
      new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
          const timeoutError = new Error(`[nutjs:resource-cleanup] action timed out after ${String(timeoutMs)}ms.`);
          timeoutError.name = 'NutjsTimeoutError';
          reject(timeoutError);
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle !== null) {
      clearTimeout(timeoutHandle);
    }
  }
}

/**
 * @param {{
 *   action: (session: unknown) => Promise<unknown>;
 *   createSession?: () => Promise<unknown>;
 *   timeoutMs?: number;
 * }} options
 */
export async function runNutjsWithResourceCleanup(options) {
  if (options === null || typeof options !== 'object') {
    throw new TypeError('[nutjs:resource-cleanup] Expected options to be an object.');
  }

  if (typeof options.action !== 'function') {
    throw new TypeError('[nutjs:resource-cleanup] Expected options.action to be a function.');
  }

  if (options.createSession !== undefined && typeof options.createSession !== 'function') {
    throw new TypeError('[nutjs:resource-cleanup] Expected options.createSession to be a function when provided.');
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_NUTJS_ACTION_TIMEOUT_MS;
  validateTimeout(timeoutMs);

  const createSession = options.createSession ?? (async () => ({}));
  const session = await createSession();
  const disposer =
    session !== null && typeof session === 'object' && typeof session.dispose === 'function' ? session.dispose.bind(session) : null;
  let actionResult;

  try {
    actionResult = await runWithTimeout(() => options.action(session), timeoutMs);
  } finally {
    if (disposer) {
      await disposer();
    }
  }

  return {
    actionResult,
    timeoutMs,
  };
}
