import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { readRequiredArgumentValue, validateRequiredArgumentValue } from './cli-arg-values.mjs';
import { filterChangesetStatusOutput } from './changeset-status-ci-lib.mjs';
import { resolveStrictPositiveIntegerEnv, resolveTimeoutFromCliAndEnv } from './cli-timeout.mjs';
import { installTempDirectoryCleanup } from './temp-directory-cleanup.mjs';
import { writeFakeExecutable } from './test-fixtures.mjs';
import { UNPRINTABLE_VALUE } from './test-helpers.mjs';

installTempDirectoryCleanup(fs);

test('script helpers consistently format unprintable values in diagnostics', () => {
  assert.throws(
    () =>
      validateRequiredArgumentValue(UNPRINTABLE_VALUE, {
        flagName: '--timeout-ms',
        knownArgs: new Set(['--timeout-ms']),
        allowDoubleDashValue: false,
      }),
    /Invalid value type for --timeout-ms argument: \[unprintable\]/u,
  );

  assert.throws(
    () =>
      readRequiredArgumentValue(['--timeout-ms', '50'], 0, {
        flagName: UNPRINTABLE_VALUE,
        knownArgs: new Set(['--timeout-ms']),
      }),
    /Invalid flag name: \[unprintable\]/u,
  );

  assert.throws(
    () =>
      resolveStrictPositiveIntegerEnv({
        name: 'TEST_TIMEOUT',
        rawValue: UNPRINTABLE_VALUE,
        defaultValue: 120000,
      }),
    /Invalid TEST_TIMEOUT value: \[unprintable\]/u,
  );

  assert.throws(
    () =>
      resolveTimeoutFromCliAndEnv({
        defaultValue: UNPRINTABLE_VALUE,
        env: { name: 'TEST_TIMEOUT_ENV', rawValue: undefined },
        cli: { name: '--test-timeout', rawValue: undefined },
      }),
    /Invalid default value for TEST_TIMEOUT_ENV: \[unprintable\]/u,
  );

  assert.throws(() => filterChangesetStatusOutput(UNPRINTABLE_VALUE), /Invalid changeset status output: \[unprintable\]/u);

  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-format-error-value-contract-'));
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
