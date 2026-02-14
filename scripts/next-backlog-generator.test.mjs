import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { generateNextBacklogFile, parseOpenDebtItems, createNextHundredBacklogMarkdown } from './next-backlog-generator.mjs';
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
