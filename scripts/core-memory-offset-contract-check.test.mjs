import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { installTempDirectoryCleanup } from './temp-directory-cleanup.mjs';
import {
  loadCoreFromDist,
  runCoreMemoryOffsetContractCheck,
  validateGameBoyOffsetResolver,
} from './core-memory-offset-contract-check-lib.mjs';
import { parseCoreMemoryOffsetCheckArgs } from './core-memory-offset-contract-check.mjs';

const coreMemoryOffsetCheckScriptPath = path.resolve('scripts/core-memory-offset-contract-check.mjs');
installTempDirectoryCleanup(fs);

test('parseCoreMemoryOffsetCheckArgs supports repo-root and help flags', () => {
  assert.deepEqual(parseCoreMemoryOffsetCheckArgs([]), {
    showHelp: false,
    repoRootOverride: '',
  });
  assert.deepEqual(parseCoreMemoryOffsetCheckArgs(['--repo-root', '/workspace']), {
    showHelp: false,
    repoRootOverride: '/workspace',
  });
  assert.deepEqual(parseCoreMemoryOffsetCheckArgs(['--repo-root=/workspace']), {
    showHelp: false,
    repoRootOverride: '/workspace',
  });
  assert.deepEqual(parseCoreMemoryOffsetCheckArgs(['--help']), {
    showHelp: true,
    repoRootOverride: '',
  });
  assert.deepEqual(parseCoreMemoryOffsetCheckArgs(['--repo-root', '/workspace', '--help']), {
    showHelp: true,
    repoRootOverride: '',
  });
});

test('parseCoreMemoryOffsetCheckArgs rejects malformed and duplicate arguments', () => {
  assert.throws(() => parseCoreMemoryOffsetCheckArgs('--help'), /Expected argv to be an array\./u);
  assert.throws(() => parseCoreMemoryOffsetCheckArgs(['--help', 3]), /Expected argv\[1\] to be a string\./u);
  assert.throws(() => parseCoreMemoryOffsetCheckArgs(['--unknown']), /Unknown argument: --unknown/u);
  assert.throws(
    () => parseCoreMemoryOffsetCheckArgs(['--repo-root', '/workspace', '--repo-root=/tmp/repo']),
    /Duplicate --repo-root flag received\./u,
  );
  assert.throws(() => parseCoreMemoryOffsetCheckArgs(['--repo-root']), /Missing value for --repo-root argument\./u);
  assert.throws(() => parseCoreMemoryOffsetCheckArgs(['--repo-root=']), /Missing value for --repo-root argument\./u);
  assert.throws(() => parseCoreMemoryOffsetCheckArgs(['--repo-root==/workspace']), /Malformed inline value for --repo-root argument\./u);
});

test('core-memory-offset-contract-check script prints usage for --help', () => {
  const result = spawnSync(process.execPath, [coreMemoryOffsetCheckScriptPath, '--help'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/u);
  assert.match(result.stdout, /--repo-root/u);
  assert.equal(result.stderr, '');
});

test('validateGameBoyOffsetResolver accepts sentinel and boundary mappings', () => {
  const resolver = offset => {
    if (offset < 0 || offset > 0xffff) {
      return -1;
    }
    return offset;
  };

  assert.doesNotThrow(() => validateGameBoyOffsetResolver(resolver));
});

test('validateGameBoyOffsetResolver rejects missing resolver function', () => {
  assert.throws(() => validateGameBoyOffsetResolver(undefined), /Core export getWasmBoyOffsetFromGameBoyOffset is unavailable/u);
});

test('validateGameBoyOffsetResolver rejects invalid sentinel behavior', () => {
  const resolver = () => 0;
  assert.throws(() => validateGameBoyOffsetResolver(resolver), /Expected invalid Game Boy offset -1 to map to sentinel -1/u);
});

test('validateGameBoyOffsetResolver rejects negative valid boundary mappings', () => {
  const resolver = offset => (offset < 0 || offset > 0xffff ? -1 : -5);
  assert.throws(() => validateGameBoyOffsetResolver(resolver), /Expected valid Game Boy offset 0x0 to map to a non-negative integer/u);
});

test('runCoreMemoryOffsetContractCheck validates loaded core exports', async () => {
  const loadCore = async () => ({
    instance: {
      exports: {
        getWasmBoyOffsetFromGameBoyOffset(offset) {
          if (offset < 0 || offset > 0xffff) {
            return -1;
          }
          return offset;
        },
      },
    },
  });

  await assert.doesNotReject(() => runCoreMemoryOffsetContractCheck({ loadCore }));
});

test('runCoreMemoryOffsetContractCheck rejects invalid loader responses', async () => {
  await assert.rejects(() => runCoreMemoryOffsetContractCheck({ loadCore: async () => null }), /Core loader returned an invalid value/u);
  await assert.rejects(
    () => runCoreMemoryOffsetContractCheck({ loadCore: async () => ({}) }),
    /Core loader did not return a valid wasm instance/u,
  );
  await assert.rejects(
    () => runCoreMemoryOffsetContractCheck({ loadCore: async () => ({ instance: {} }) }),
    /Core wasm instance exports are unavailable/u,
  );
});

test('loadCoreFromDist removes temporary copied dist directory after loading', async () => {
  const fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'core-memory-offset-dist-fixture-'));
  const fixtureDistPath = path.join(fixtureDirectory, 'getWasmBoyWasmCore.cjs.js');
  fs.writeFileSync(
    fixtureDistPath,
    `module.exports = function getWasmBoyWasmCore() {
  return {
    instance: {
      exports: {
        getWasmBoyOffsetFromGameBoyOffset(offset) {
          if (offset < 0 || offset > 0xffff) {
            return -1;
          }
          return offset;
        },
      },
    },
  };
};
`,
    'utf8',
  );

  const tempPrefix = 'core-memory-offset-contract-';
  const listContractTempDirectories = () =>
    fs
      .readdirSync(os.tmpdir(), { withFileTypes: true })
      .filter(entry => entry.isDirectory() && entry.name.startsWith(tempPrefix))
      .map(entry => entry.name)
      .sort();

  const beforeDirectories = listContractTempDirectories();
  const loadedCore = await loadCoreFromDist(fixtureDistPath);
  const afterDirectories = listContractTempDirectories();

  assert.equal(typeof loadedCore, 'object');
  assert.equal(typeof loadedCore.instance.exports.getWasmBoyOffsetFromGameBoyOffset, 'function');
  assert.deepEqual(afterDirectories, beforeDirectories);
});
