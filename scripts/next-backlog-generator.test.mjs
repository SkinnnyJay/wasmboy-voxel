import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  createNextHundredBacklogMarkdown,
  generateNextBacklogFile,
  parseNextBacklogArgs,
  parseOpenDebtItems,
} from './next-backlog-generator.mjs';
import { UNPRINTABLE_VALUE } from './test-helpers.mjs';

const SAMPLE_DEBT_REGISTER = `
## Open debt items

| Debt ID | Area | Description | Severity | Owner Tag | Source | Status |
| --- | --- | --- | --- | --- | --- | --- |
| TD-001 | Core memory mapping | Example open debt item | S2 | \`@core-memory\` | sample | Open |
| TD-002 | Wrapper allocation pressure | Another open debt item | S3 | \`@wrapper-voxel\` | sample | Open |

## Closed debt items

| Debt ID | Area | Description | Severity at close | Owner Tag |
| --- | --- | --- | --- | --- |
| TD-C001 | Closed area | Closed item | S3 | \`@closed\` |
`;

const NEXT_BACKLOG_GENERATOR_SCRIPT_PATH = path.resolve('scripts/next-backlog-generator.mjs');

test('parseOpenDebtItems extracts only open debt table rows', () => {
  const parsed = parseOpenDebtItems(SAMPLE_DEBT_REGISTER);

  assert.equal(parsed.length, 2);
  assert.equal(parsed[0]?.debtId, 'TD-001');
  assert.equal(parsed[0]?.severity, 'S2');
  assert.equal(parsed[1]?.debtId, 'TD-002');
  assert.equal(parsed[1]?.ownerTag, '`@wrapper-voxel`');
});

test('parseOpenDebtItems rejects invalid markdown payloads', () => {
  assert.throws(() => parseOpenDebtItems(42), /Invalid debt register markdown: 42/u);
  assert.throws(() => parseOpenDebtItems(UNPRINTABLE_VALUE), /Invalid debt register markdown: \[unprintable\]/u);
});

test('parseNextBacklogArgs supports backlog size and start-task overrides', () => {
  assert.deepEqual(parseNextBacklogArgs([]), {
    showHelp: false,
    backlogSizeOverride: '',
    startTaskNumberOverride: '',
  });
  assert.deepEqual(parseNextBacklogArgs(['--backlog-size', '30']), {
    showHelp: false,
    backlogSizeOverride: '30',
    startTaskNumberOverride: '',
  });
  assert.deepEqual(parseNextBacklogArgs(['--backlog-size=40']), {
    showHelp: false,
    backlogSizeOverride: '40',
    startTaskNumberOverride: '',
  });
  assert.deepEqual(parseNextBacklogArgs(['--start-task-number', '201']), {
    showHelp: false,
    backlogSizeOverride: '',
    startTaskNumberOverride: '201',
  });
  assert.deepEqual(parseNextBacklogArgs(['--start-task-number=301']), {
    showHelp: false,
    backlogSizeOverride: '',
    startTaskNumberOverride: '301',
  });
  assert.deepEqual(parseNextBacklogArgs(['--help']), {
    showHelp: true,
    backlogSizeOverride: '',
    startTaskNumberOverride: '',
  });
  assert.deepEqual(parseNextBacklogArgs(['--backlog-size', '20', '--help', '--start-task-number', '900']), {
    showHelp: true,
    backlogSizeOverride: '',
    startTaskNumberOverride: '',
  });
});

test('parseNextBacklogArgs rejects malformed and duplicate arguments', () => {
  assert.throws(() => parseNextBacklogArgs('--help'), /Expected argv to be an array\./u);
  assert.throws(() => parseNextBacklogArgs(['--help', 3]), /Expected argv\[1\] to be a string\./u);
  assert.throws(() => parseNextBacklogArgs(['--unknown']), /Unknown argument: --unknown/u);
  assert.throws(() => parseNextBacklogArgs(['--backlog-size', '20', '--backlog-size=30']), /Duplicate --backlog-size flag received\./u);
  assert.throws(
    () => parseNextBacklogArgs(['--start-task-number', '200', '--start-task-number=300']),
    /Duplicate --start-task-number flag received\./u,
  );
  assert.throws(() => parseNextBacklogArgs(['--backlog-size']), /Missing value for --backlog-size argument\./u);
  assert.throws(() => parseNextBacklogArgs(['--start-task-number']), /Missing value for --start-task-number argument\./u);
  assert.throws(() => parseNextBacklogArgs(['--backlog-size=']), /Missing value for --backlog-size argument\./u);
  assert.throws(() => parseNextBacklogArgs(['--start-task-number=']), /Missing value for --start-task-number argument\./u);
  assert.throws(() => parseNextBacklogArgs(['--backlog-size==20']), /Malformed inline value for --backlog-size argument\./u);
  assert.throws(() => parseNextBacklogArgs(['--start-task-number==200']), /Malformed inline value for --start-task-number argument\./u);
});

test('createNextHundredBacklogMarkdown seeds backlog rows from debt items then pads remaining rows', () => {
  const markdown = createNextHundredBacklogMarkdown({
    debtItems: [
      {
        debtId: 'TD-001',
        area: 'Core memory mapping',
        description: 'Example',
        severity: 'S2',
        ownerTag: '`@core-memory`',
      },
    ],
    generatedAtIso: '2026-02-14T00:00:00.000Z',
    backlogSize: 3,
    startTaskNumber: 101,
  });

  assert.match(markdown, /\| task101 \| Address debt TD-001: Core memory mapping \|/u);
  assert.match(markdown, /\| task102 \| Backlog discovery candidate #2 \|/u);
  assert.match(markdown, /\| task103 \| Backlog discovery candidate #3 \|/u);
});

test('createNextHundredBacklogMarkdown validates required parameters', () => {
  assert.throws(() => createNextHundredBacklogMarkdown(null), /Invalid backlog generation options/u);
  assert.throws(
    () =>
      createNextHundredBacklogMarkdown({
        debtItems: null,
        generatedAtIso: '2026-02-14T00:00:00.000Z',
      }),
    /Invalid debt items list/u,
  );
  assert.throws(
    () =>
      createNextHundredBacklogMarkdown({
        debtItems: [],
        generatedAtIso: 42,
      }),
    /Invalid generatedAtIso: 42/u,
  );
  assert.throws(
    () =>
      createNextHundredBacklogMarkdown({
        debtItems: [],
        generatedAtIso: '2026-02-14T00:00:00.000Z',
        backlogSize: 0,
      }),
    /Invalid backlogSize: 0/u,
  );
  assert.throws(
    () =>
      createNextHundredBacklogMarkdown({
        debtItems: [],
        generatedAtIso: '2026-02-14T00:00:00.000Z',
        backlogSize: 1.5,
      }),
    /Invalid backlogSize: 1\.5/u,
  );
  assert.throws(
    () =>
      createNextHundredBacklogMarkdown({
        debtItems: [],
        generatedAtIso: '2026-02-14T00:00:00.000Z',
        startTaskNumber: 0,
      }),
    /Invalid startTaskNumber: 0/u,
  );
  assert.throws(
    () =>
      createNextHundredBacklogMarkdown({
        debtItems: [],
        generatedAtIso: '2026-02-14T00:00:00.000Z',
        startTaskNumber: 101.1,
      }),
    /Invalid startTaskNumber: 101\.1/u,
  );
});

test('generateNextBacklogFile writes a dated backlog draft file', async () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'next-backlog-generator-'));
  const debtRegisterPath = path.join(repoRoot, 'docs', 'migration', 'technical-debt-register-2026-02-14.md');
  fs.mkdirSync(path.dirname(debtRegisterPath), { recursive: true });
  fs.writeFileSync(debtRegisterPath, SAMPLE_DEBT_REGISTER, 'utf8');

  const now = new Date('2026-02-14T03:00:00.000Z');
  const result = await generateNextBacklogFile({ repoRoot, now });

  assert.equal(result.openDebtItems, 2);
  assert.match(result.outputPath, /next-100-backlog-draft-2026-02-14\.md$/u);

  const generatedMarkdown = fs.readFileSync(result.outputPath, 'utf8');
  assert.match(generatedMarkdown, /\| task101 \| Address debt TD-001: Core memory mapping \|/u);
  assert.match(generatedMarkdown, /\| task200 \|/u);
});

test('generateNextBacklogFile honors backlog size and start-task overrides', async () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'next-backlog-generator-overrides-'));
  const debtRegisterPath = path.join(repoRoot, 'docs', 'migration', 'technical-debt-register-2026-02-14.md');
  fs.mkdirSync(path.dirname(debtRegisterPath), { recursive: true });
  fs.writeFileSync(debtRegisterPath, SAMPLE_DEBT_REGISTER, 'utf8');

  const result = await generateNextBacklogFile({
    repoRoot,
    now: new Date('2026-02-14T03:00:00.000Z'),
    backlogSize: 2,
    startTaskNumber: 301,
  });

  assert.equal(result.openDebtItems, 2);
  const generatedMarkdown = fs.readFileSync(result.outputPath, 'utf8');
  assert.match(generatedMarkdown, /\| task301 \|/u);
  assert.match(generatedMarkdown, /\| task302 \|/u);
  assert.doesNotMatch(generatedMarkdown, /\| task303 \|/u);
});

test('next backlog generator script prints usage for --help', () => {
  const result = spawnSync(process.execPath, [NEXT_BACKLOG_GENERATOR_SCRIPT_PATH, '--help'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/u);
  assert.match(result.stdout, /--backlog-size/u);
  assert.match(result.stdout, /--start-task-number/u);
  assert.equal(result.stderr, '');
});
