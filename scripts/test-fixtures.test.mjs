import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { writeFakeExecutable } from './test-fixtures.mjs';

const UNPRINTABLE_VALUE = {
  toString() {
    throw new Error('cannot stringify');
  },
};

test('writeFakeExecutable creates runnable command in fake-bin directory', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-'));
  const fakeBinDirectory = writeFakeExecutable(
    tempDirectory,
    'fixture-cmd',
    `#!/usr/bin/env bash
echo 'fixture command executed'
`,
  );

  const result = spawnSync('fixture-cmd', [], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fakeBinDirectory}:${process.env.PATH ?? ''}`,
    },
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /fixture command executed/u);
});

test('writeFakeExecutable rejects non-string temp directories', () => {
  assert.throws(
    () =>
      writeFakeExecutable(
        42,
        'fixture-cmd',
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid temp directory: 42/u,
  );
});

test('writeFakeExecutable rejects bigint temp directories', () => {
  assert.throws(
    () =>
      writeFakeExecutable(
        42n,
        'fixture-cmd',
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid temp directory: 42/u,
  );
});

test('writeFakeExecutable rejects undefined temp directories', () => {
  assert.throws(
    () =>
      writeFakeExecutable(
        undefined,
        'fixture-cmd',
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid temp directory: undefined/u,
  );
});

test('writeFakeExecutable rejects null temp directories', () => {
  assert.throws(
    () =>
      writeFakeExecutable(
        null,
        'fixture-cmd',
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid temp directory: null/u,
  );
});

test('writeFakeExecutable rejects symbol temp directories', () => {
  assert.throws(
    () =>
      writeFakeExecutable(
        Symbol('tmp'),
        'fixture-cmd',
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid temp directory: Symbol\(tmp\)/u,
  );
});

test('writeFakeExecutable safely formats unprintable temp directories', () => {
  assert.throws(
    () =>
      writeFakeExecutable(
        UNPRINTABLE_VALUE,
        'fixture-cmd',
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid temp directory: \[unprintable\]/u,
  );
});

test('writeFakeExecutable rejects empty temp directories', () => {
  assert.throws(
    () =>
      writeFakeExecutable(
        '   ',
        'fixture-cmd',
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid temp directory:\s+/u,
  );
});

test('writeFakeExecutable rejects temp directories containing null bytes', () => {
  assert.throws(
    () =>
      writeFakeExecutable(
        'bad\0temp',
        'fixture-cmd',
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid temp directory:/u,
  );
});

test('writeFakeExecutable rejects empty executable names', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-empty-name-'));

  assert.throws(
    () =>
      writeFakeExecutable(
        tempDirectory,
        '',
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid executable name:/u,
  );
});

test('writeFakeExecutable rejects whitespace-only executable names', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-whitespace-name-'));

  assert.throws(
    () =>
      writeFakeExecutable(
        tempDirectory,
        '   ',
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid executable name:/u,
  );
});

test('writeFakeExecutable rejects executable names with path segments', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-path-name-'));

  assert.throws(
    () =>
      writeFakeExecutable(
        tempDirectory,
        '../fixture-cmd',
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid executable name: \.\.\/fixture-cmd/u,
  );
});

test('writeFakeExecutable rejects executable names with backslash path separators', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-backslash-path-name-'));

  assert.throws(
    () =>
      writeFakeExecutable(
        tempDirectory,
        '..\\fixture-cmd',
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid executable name: \.\.\\fixture-cmd/u,
  );
});

test('writeFakeExecutable rejects dot-segment executable names', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-dot-segment-name-'));

  assert.throws(
    () =>
      writeFakeExecutable(
        tempDirectory,
        '.',
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid executable name: \./u,
  );

  assert.throws(
    () =>
      writeFakeExecutable(
        tempDirectory,
        '..',
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid executable name: \.\./u,
  );
});

test('writeFakeExecutable rejects executable names containing spaces', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-space-name-'));

  assert.throws(
    () =>
      writeFakeExecutable(
        tempDirectory,
        'fixture cmd',
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid executable name: fixture cmd/u,
  );
});

test('writeFakeExecutable rejects excessively long executable names', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-long-name-'));
  const longExecutableName = 'x'.repeat(256);

  assert.throws(
    () =>
      writeFakeExecutable(
        tempDirectory,
        longExecutableName,
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid executable name:/u,
  );
});

test('writeFakeExecutable rejects non-string executable names', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-non-string-name-'));

  assert.throws(
    () =>
      writeFakeExecutable(
        tempDirectory,
        42,
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid executable name: 42/u,
  );
});

test('writeFakeExecutable rejects bigint executable names', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-bigint-name-'));

  assert.throws(
    () =>
      writeFakeExecutable(
        tempDirectory,
        42n,
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid executable name: 42/u,
  );
});

test('writeFakeExecutable rejects undefined executable names', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-undefined-name-'));

  assert.throws(
    () =>
      writeFakeExecutable(
        tempDirectory,
        undefined,
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid executable name: undefined/u,
  );
});

test('writeFakeExecutable rejects null executable names', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-null-name-'));

  assert.throws(
    () =>
      writeFakeExecutable(
        tempDirectory,
        null,
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid executable name: null/u,
  );
});

test('writeFakeExecutable rejects symbol executable names', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-symbol-name-'));

  assert.throws(
    () =>
      writeFakeExecutable(
        tempDirectory,
        Symbol('fixture-cmd'),
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid executable name: Symbol\(fixture-cmd\)/u,
  );
});

test('writeFakeExecutable safely formats unprintable executable names', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-unprintable-name-'));

  assert.throws(
    () =>
      writeFakeExecutable(
        tempDirectory,
        UNPRINTABLE_VALUE,
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid executable name: \[unprintable\]/u,
  );
});

test('writeFakeExecutable rejects executable names containing null bytes', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-null-byte-name-'));

  assert.throws(
    () =>
      writeFakeExecutable(
        tempDirectory,
        'fixture\0cmd',
        `#!/usr/bin/env bash
echo 'should not run'
`,
      ),
    /Invalid executable name:/u,
  );
});

test('writeFakeExecutable rejects empty executable bodies', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-empty-body-'));

  assert.throws(() => writeFakeExecutable(tempDirectory, 'fixture-cmd', ''), /Invalid executable body for fixture-cmd/u);
});

test('writeFakeExecutable rejects whitespace-only executable bodies', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-whitespace-body-'));

  assert.throws(() => writeFakeExecutable(tempDirectory, 'fixture-cmd', '   \n\t  '), /Invalid executable body for fixture-cmd/u);
});

test('writeFakeExecutable rejects non-string executable bodies', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-non-string-body-'));

  assert.throws(() => writeFakeExecutable(tempDirectory, 'fixture-cmd', 42), /Invalid executable body for fixture-cmd/u);
});

test('writeFakeExecutable rejects bigint executable bodies', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-bigint-body-'));

  assert.throws(() => writeFakeExecutable(tempDirectory, 'fixture-cmd', 42n), /Invalid executable body for fixture-cmd/u);
});

test('writeFakeExecutable rejects undefined executable bodies', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-undefined-body-'));

  assert.throws(() => writeFakeExecutable(tempDirectory, 'fixture-cmd', undefined), /Invalid executable body for fixture-cmd/u);
});

test('writeFakeExecutable rejects null executable bodies', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-null-body-'));

  assert.throws(() => writeFakeExecutable(tempDirectory, 'fixture-cmd', null), /Invalid executable body for fixture-cmd/u);
});

test('writeFakeExecutable rejects symbol executable bodies', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-symbol-body-'));

  assert.throws(
    () => writeFakeExecutable(tempDirectory, 'fixture-cmd', Symbol('fixture-body')),
    /Invalid executable body for fixture-cmd/u,
  );
});

test('writeFakeExecutable safely formats unprintable executable bodies', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-unprintable-body-'));

  assert.throws(() => writeFakeExecutable(tempDirectory, 'fixture-cmd', UNPRINTABLE_VALUE), /Invalid executable body for fixture-cmd/u);
});

test('writeFakeExecutable rejects executable bodies containing null bytes', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-test-fixture-null-byte-body-'));

  assert.throws(
    () => writeFakeExecutable(tempDirectory, 'fixture-cmd', '#!/usr/bin/env bash\0\necho "x"\n'),
    /Invalid executable body for fixture-cmd/u,
  );
});
