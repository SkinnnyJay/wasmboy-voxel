const expectedWorkspaceWarningPattern = /^Package "@wasmboy\/[^"]+" must depend on the current version of "@wasmboy\/api": "[^"]+" vs "file:/;

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
 * @param {string} left
 * @param {string} right
 */
function compareByCodePoint(left, right) {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

/**
 * @param {string} rawOutput
 */
export function filterChangesetStatusOutput(rawOutput) {
  if (typeof rawOutput !== 'string') {
    throw new Error(`Invalid changeset status output: ${formatErrorValue(rawOutput)}`);
  }

  const outputLines = rawOutput.split(/\r?\n/);
  const suppressedWarnings = new Set();
  const passthroughLines = [];

  for (const line of outputLines) {
    const trimmedLine = line.trim();

    if (expectedWorkspaceWarningPattern.test(trimmedLine)) {
      suppressedWarnings.add(trimmedLine);
      continue;
    }

    passthroughLines.push(line);
  }

  return {
    suppressedWarnings: [...suppressedWarnings].sort(compareByCodePoint),
    passthroughOutput: passthroughLines.join('\n').trimEnd(),
  };
}
