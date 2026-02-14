import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { runSubprocess } from './subprocess-test-harness.mjs';
import { runCoreWrapperMemoryLayoutCheck, validateCoreWrapperMemoryLayout } from './core-wrapper-memory-layout-check-lib.mjs';
import { parseCoreWrapperMemoryLayoutCheckArgs } from './core-wrapper-memory-layout-check.mjs';
import { UNPRINTABLE_VALUE } from './test-helpers.mjs';

const coreConstantsFileUrl = new URL('../core/constants.ts', import.meta.url);
const wrapperFileUrl = new URL('../voxel-wrapper.ts', import.meta.url);
const coreWrapperMemoryLayoutCheckScriptPath = path.resolve('scripts/core-wrapper-memory-layout-check.mjs');

async function readFixtureSources() {
  const [coreConstantsSource, wrapperSource] = await Promise.all([
    readFile(coreConstantsFileUrl, 'utf8'),
    readFile(wrapperFileUrl, 'utf8'),
  ]);
  return { coreConstantsSource, wrapperSource };
}

test('parseCoreWrapperMemoryLayoutCheckArgs supports path and help flags', () => {
  assert.deepEqual(parseCoreWrapperMemoryLayoutCheckArgs([]), {
    showHelp: false,
    coreConstantsPathOverride: '',
    wrapperPathOverride: '',
  });
  assert.deepEqual(parseCoreWrapperMemoryLayoutCheckArgs(['--core-constants-path', '/workspace/core/constants.ts']), {
    showHelp: false,
    coreConstantsPathOverride: '/workspace/core/constants.ts',
    wrapperPathOverride: '',
  });
  assert.deepEqual(parseCoreWrapperMemoryLayoutCheckArgs(['--core-constants-path=/workspace/core/constants.ts']), {
    showHelp: false,
    coreConstantsPathOverride: '/workspace/core/constants.ts',
    wrapperPathOverride: '',
  });
  assert.deepEqual(parseCoreWrapperMemoryLayoutCheckArgs(['--wrapper-path', '/workspace/voxel-wrapper.ts']), {
    showHelp: false,
    coreConstantsPathOverride: '',
    wrapperPathOverride: '/workspace/voxel-wrapper.ts',
  });
  assert.deepEqual(parseCoreWrapperMemoryLayoutCheckArgs(['--wrapper-path=/workspace/voxel-wrapper.ts']), {
    showHelp: false,
    coreConstantsPathOverride: '',
    wrapperPathOverride: '/workspace/voxel-wrapper.ts',
  });
  assert.deepEqual(parseCoreWrapperMemoryLayoutCheckArgs(['--help']), {
    showHelp: true,
    coreConstantsPathOverride: '',
    wrapperPathOverride: '',
  });
  assert.deepEqual(
    parseCoreWrapperMemoryLayoutCheckArgs([
      '--core-constants-path',
      '/workspace/core/constants.ts',
      '--help',
      '--wrapper-path',
      '/workspace/voxel-wrapper.ts',
    ]),
    {
      showHelp: true,
      coreConstantsPathOverride: '',
      wrapperPathOverride: '',
    },
  );
});

test('parseCoreWrapperMemoryLayoutCheckArgs rejects malformed and duplicate arguments', () => {
  assert.throws(() => parseCoreWrapperMemoryLayoutCheckArgs('--help'), /Expected argv to be an array\./u);
  assert.throws(() => parseCoreWrapperMemoryLayoutCheckArgs(['--help', 3]), /Expected argv\[1\] to be a string\./u);
  assert.throws(() => parseCoreWrapperMemoryLayoutCheckArgs(['--unknown']), /Unknown argument: --unknown/u);
  assert.throws(
    () =>
      parseCoreWrapperMemoryLayoutCheckArgs([
        '--core-constants-path',
        '/workspace/core/constants.ts',
        '--core-constants-path=/tmp/core/constants.ts',
      ]),
    /Duplicate --core-constants-path flag received\./u,
  );
  assert.throws(
    () => parseCoreWrapperMemoryLayoutCheckArgs(['--wrapper-path', '/workspace/voxel-wrapper.ts', '--wrapper-path=/tmp/voxel-wrapper.ts']),
    /Duplicate --wrapper-path flag received\./u,
  );
  assert.throws(
    () => parseCoreWrapperMemoryLayoutCheckArgs(['--core-constants-path']),
    /Missing value for --core-constants-path argument\./u,
  );
  assert.throws(() => parseCoreWrapperMemoryLayoutCheckArgs(['--wrapper-path']), /Missing value for --wrapper-path argument\./u);
  assert.throws(
    () => parseCoreWrapperMemoryLayoutCheckArgs(['--core-constants-path=']),
    /Missing value for --core-constants-path argument\./u,
  );
  assert.throws(() => parseCoreWrapperMemoryLayoutCheckArgs(['--wrapper-path=']), /Missing value for --wrapper-path argument\./u);
  assert.throws(
    () => parseCoreWrapperMemoryLayoutCheckArgs(['--core-constants-path==/workspace/core/constants.ts']),
    /Malformed inline value for --core-constants-path argument\./u,
  );
  assert.throws(
    () => parseCoreWrapperMemoryLayoutCheckArgs(['--wrapper-path==/workspace/voxel-wrapper.ts']),
    /Malformed inline value for --wrapper-path argument\./u,
  );
});

test('core-wrapper-memory-layout-check script prints usage for --help', () => {
  const result = runSubprocess(process.execPath, [coreWrapperMemoryLayoutCheckScriptPath, '--help'], {
    cwd: process.cwd(),
    description: 'core-wrapper-memory-layout-check help',
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/u);
  assert.match(result.stdout, /--core-constants-path/u);
  assert.match(result.stdout, /--wrapper-path/u);
  assert.equal(result.stderr, '');
});

test('runCoreWrapperMemoryLayoutCheck passes for repository sources', async () => {
  const result = await runCoreWrapperMemoryLayoutCheck();

  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, []);
});

test('validateCoreWrapperMemoryLayout reports missing required core constants', async () => {
  const { coreConstantsSource, wrapperSource } = await readFixtureSources();
  const mutatedCoreSource = coreConstantsSource.replace('export const GBC_PALETTE_SIZE: i32 = 0x000080;', '');

  const result = validateCoreWrapperMemoryLayout(mutatedCoreSource, wrapperSource);

  assert.equal(result.isValid, false);
  assert.match(result.errors.join('\n'), /Missing core constant export: GBC_PALETTE_SIZE/u);
});

test('validateCoreWrapperMemoryLayout reports incorrect GAME_MEMORY_BASE_CONSTANT wiring', async () => {
  const { coreConstantsSource, wrapperSource } = await readFixtureSources();
  const mutatedWrapperSource = wrapperSource.replace(
    "const GAME_MEMORY_BASE_CONSTANT = 'DEBUG_GAMEBOY_MEMORY_LOCATION';",
    "const GAME_MEMORY_BASE_CONSTANT = 'GAMEBOY_INTERNAL_MEMORY_LOCATION';",
  );

  const result = validateCoreWrapperMemoryLayout(coreConstantsSource, mutatedWrapperSource);

  assert.equal(result.isValid, false);
  assert.match(result.errors.join('\n'), /GAME_MEMORY_BASE_CONSTANT must equal "DEBUG_GAMEBOY_MEMORY_LOCATION"/u);
});

test('validateCoreWrapperMemoryLayout reports wrapper offset drift', async () => {
  const { coreConstantsSource, wrapperSource } = await readFixtureSources();
  const mutatedWrapperSource = wrapperSource.replace('const REG_SCX = 0xff43;', 'const REG_SCX = 0xff44;');

  const result = validateCoreWrapperMemoryLayout(coreConstantsSource, mutatedWrapperSource);

  assert.equal(result.isValid, false);
  assert.match(result.errors.join('\n'), /Wrapper constant REG_SCX must equal 0xff43 \(received 0xff44\)/u);
});

test('validateCoreWrapperMemoryLayout reports missing palette constant lookups', async () => {
  const { coreConstantsSource, wrapperSource } = await readFixtureSources();
  const mutatedWrapperSource = wrapperSource.replace("'GBC_PALETTE_SIZE'", "'GBC_PALETTE_BYTES'");

  const result = validateCoreWrapperMemoryLayout(coreConstantsSource, mutatedWrapperSource);

  assert.equal(result.isValid, false);
  assert.match(result.errors.join('\n'), /Missing wrapper _getWasmConstant lookup for GBC_PALETTE_SIZE/u);
});

test('validateCoreWrapperMemoryLayout rejects non-string input sources', () => {
  assert.throws(() => validateCoreWrapperMemoryLayout(42, ''), /Invalid core constants source: 42/u);
  assert.throws(() => validateCoreWrapperMemoryLayout('', null), /Invalid wrapper source: null/u);
  assert.throws(() => validateCoreWrapperMemoryLayout(UNPRINTABLE_VALUE, ''), /Invalid core constants source: \[unprintable\]/u);
});
