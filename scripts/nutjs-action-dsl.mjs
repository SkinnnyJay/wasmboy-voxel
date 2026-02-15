/**
 * @param {number} delayMs
 */
function wait(delayMs) {
  return new Promise(resolve => {
    setTimeout(resolve, delayMs);
  });
}

/**
 * @param {unknown} actionStep
 * @param {number} index
 */
function normalizeActionStep(actionStep, index) {
  if (actionStep === null || typeof actionStep !== 'object') {
    throw new TypeError(`[nutjs:action-dsl] Expected actionSteps[${String(index)}] to be an object.`);
  }

  const name = actionStep.name;
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new TypeError(`[nutjs:action-dsl] Expected actionSteps[${String(index)}].name to be a non-empty string.`);
  }

  const retries = actionStep.retries ?? 0;
  if (!Number.isInteger(retries) || retries < 0) {
    throw new TypeError(`[nutjs:action-dsl] Expected actionSteps[${String(index)}].retries to be a non-negative integer when provided.`);
  }

  const retryDelayMs = actionStep.retryDelayMs ?? 0;
  if (!Number.isInteger(retryDelayMs) || retryDelayMs < 0) {
    throw new TypeError(
      `[nutjs:action-dsl] Expected actionSteps[${String(index)}].retryDelayMs to be a non-negative integer when provided.`,
    );
  }

  const waitBeforeMs = actionStep.waitBeforeMs ?? 0;
  if (!Number.isInteger(waitBeforeMs) || waitBeforeMs < 0) {
    throw new TypeError(
      `[nutjs:action-dsl] Expected actionSteps[${String(index)}].waitBeforeMs to be a non-negative integer when provided.`,
    );
  }

  return {
    name: name.trim(),
    retries,
    retryDelayMs,
    waitBeforeMs,
  };
}

/**
 * @param {unknown} value
 */
function formatError(value) {
  if (value instanceof Error) {
    return value.message;
  }
  try {
    return String(value);
  } catch {
    return '[unprintable]';
  }
}

/**
 * @param {{
 *   actionSteps: Array<{
 *     name: string;
 *     retries?: number;
 *     retryDelayMs?: number;
 *     waitBeforeMs?: number;
 *   }>;
 *   handlers: Record<string, () => Promise<unknown>>;
 * }} options
 */
export async function runNutjsActionPlan(options) {
  if (options === null || typeof options !== 'object') {
    throw new TypeError('[nutjs:action-dsl] Expected options to be an object.');
  }

  if (!Array.isArray(options.actionSteps)) {
    throw new TypeError('[nutjs:action-dsl] Expected options.actionSteps to be an array.');
  }

  if (options.handlers === null || typeof options.handlers !== 'object') {
    throw new TypeError('[nutjs:action-dsl] Expected options.handlers to be an object.');
  }

  const normalizedActionSteps = options.actionSteps.map((actionStep, index) => normalizeActionStep(actionStep, index));
  const results = {};
  const timeline = [];

  for (const actionStep of normalizedActionSteps) {
    const handler = options.handlers[actionStep.name];
    if (typeof handler !== 'function') {
      throw new Error(`[nutjs:action-dsl] Missing handler for action step "${actionStep.name}".`);
    }

    if (actionStep.waitBeforeMs > 0) {
      await wait(actionStep.waitBeforeMs);
    }

    let attempt = 0;
    let lastError = null;
    while (attempt <= actionStep.retries) {
      try {
        const actionResult = await handler();
        results[actionStep.name] = actionResult;
        timeline.push({
          name: actionStep.name,
          attempt: attempt + 1,
          status: 'passed',
        });
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        timeline.push({
          name: actionStep.name,
          attempt: attempt + 1,
          status: 'failed',
          error: formatError(error),
        });
        attempt += 1;
        if (attempt <= actionStep.retries && actionStep.retryDelayMs > 0) {
          await wait(actionStep.retryDelayMs);
        }
      }
    }

    if (lastError !== null) {
      throw new Error(
        `[nutjs:action-dsl] Action step "${actionStep.name}" failed after ${String(actionStep.retries + 1)} attempt(s): ${formatError(
          lastError,
        )}`,
      );
    }
  }

  return {
    results,
    timeline,
  };
}
