import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { writeFakeExecutable } from './test-fixtures.mjs';

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
