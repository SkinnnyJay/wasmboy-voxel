import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { findConsoleUsageViolations, runLibraryConsoleUsageCheck } from './check-library-console-usage.mjs';

function createTempRepoRoot(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeFileSyncEnsuringParent(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, 'utf8');
}

test('findConsoleUsageViolations allows explicitly approved console lines', () => {
  const source = `
if (unknownEvent) {
  console.log(eventData);
}
`;
  const violations = findConsoleUsageViolations('lib/graphics/worker/graphics.worker.js', source);

  assert.deepEqual(violations, []);
});

test('findConsoleUsageViolations reports non-allowlisted console calls', () => {
  const source = `
export function unexpectedLog() {
  console.info('oops');
}
`;
  const violations = findConsoleUsageViolations('lib/runtime/new-module.js', source);

  assert.equal(violations.length, 1);
  assert.deepEqual(violations[0], {
    filePath: 'lib/runtime/new-module.js',
    lineNumber: 3,
    lineText: "console.info('oops');",
  });
});

test('findConsoleUsageViolations ignores comment-only console references and ignored third-party files', () => {
  const commentedSource = `
// console.log('commented');
/* console.warn('commented'); */
const value = 1;
`;
  const ignoredVendorSource = `
if (dbt != 0) console.log('debt left');
`;

  const commentedViolations = findConsoleUsageViolations('lib/runtime/commented.js', commentedSource);
  const vendorViolations = findConsoleUsageViolations('lib/3p/UZIP.js', ignoredVendorSource);

  assert.deepEqual(commentedViolations, []);
  assert.deepEqual(vendorViolations, []);
});

test('runLibraryConsoleUsageCheck reports violations for temporary repo roots', async () => {
  const repoRoot = createTempRepoRoot('lint-library-console-');
  writeFileSyncEnsuringParent(
    path.join(repoRoot, 'lib', 'runtime', 'unexpected.js'),
    `
export function log() {
  console.error('not allowed');
}
`,
  );
  writeFileSyncEnsuringParent(path.join(repoRoot, 'voxel-wrapper.ts'), 'export const noop = true;\n');

  const result = await runLibraryConsoleUsageCheck({ repoRoot });

  assert.equal(result.isValid, false);
  assert.equal(result.violations.length, 1);
  assert.deepEqual(result.violations[0], {
    filePath: 'lib/runtime/unexpected.js',
    lineNumber: 3,
    lineText: "console.error('not allowed');",
  });
});

test('runLibraryConsoleUsageCheck sorts violations with ordinal path ordering', async () => {
  const repoRoot = createTempRepoRoot('lint-library-console-ordering-');
  writeFileSyncEnsuringParent(
    path.join(repoRoot, 'lib', 'runtime', 'a.js'),
    `
export function lowerCasePathViolation() {
  console.error('lower');
}
`,
  );
  writeFileSyncEnsuringParent(
    path.join(repoRoot, 'lib', 'runtime', 'B.js'),
    `
export function upperCasePathViolation() {
  console.error('upper');
}
`,
  );
  writeFileSyncEnsuringParent(path.join(repoRoot, 'voxel-wrapper.ts'), 'export const noop = true;\n');

  const result = await runLibraryConsoleUsageCheck({ repoRoot });

  assert.equal(result.isValid, false);
  assert.equal(result.violations.length, 2);
  assert.deepEqual(
    result.violations.map(violation => violation.filePath),
    ['lib/runtime/B.js', 'lib/runtime/a.js'],
  );
});

test('runLibraryConsoleUsageCheck passes for current repository sources', async () => {
  const result = await runLibraryConsoleUsageCheck({ repoRoot: process.cwd() });

  assert.equal(result.isValid, true);
  assert.deepEqual(result.violations, []);
});
