const expectedWorkspaceWarningPattern = /^Package "@wasmboy\/[^"]+" must depend on the current version of "@wasmboy\/api": "[^"]+" vs "file:/;

/**
 * @param {string} rawOutput
 */
export function filterChangesetStatusOutput(rawOutput) {
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
    suppressedWarnings: [...suppressedWarnings],
    passthroughOutput: passthroughLines.join('\n').trimEnd(),
  };
}
