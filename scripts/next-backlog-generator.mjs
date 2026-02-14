import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DEFAULT_BACKLOG_SIZE = 100;
const DEFAULT_START_TASK_NUMBER = 101;
const DEFAULT_DEBT_REGISTER_PATH = 'docs/migration/technical-debt-register-2026-02-14.md';
const DEFAULT_OUTPUT_DIRECTORY = 'docs/migration';

/**
 * @param {unknown} value
 */
function formatUnknown(value) {
  try {
    return String(value);
  } catch {
    return '[unprintable]';
  }
}

/**
 * @param {string} markdown
 */
export function parseOpenDebtItems(markdown) {
  if (typeof markdown !== 'string') {
    throw new Error(`Invalid debt register markdown: ${formatUnknown(markdown)}`);
  }

  const debtItems = [];
  const lines = markdown.split(/\r?\n/u);

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith('| TD-')) {
      continue;
    }

    const cells = trimmedLine.split('|').map(cell => cell.trim());
    if (cells.length < 9) {
      continue;
    }

    const debtId = cells[1] ?? '';
    const area = cells[2] ?? '';
    const description = cells[3] ?? '';
    const severity = cells[4] ?? '';
    const ownerTag = cells[5] ?? '';
    const status = cells[7] ?? '';

    if (!debtId.startsWith('TD-')) {
      continue;
    }

    if (status !== 'Open') {
      continue;
    }

    debtItems.push({
      debtId,
      area,
      description,
      severity,
      ownerTag,
    });
  }

  return debtItems;
}

/**
 * @param {string} severity
 */
function mapSeverityToRisk(severity) {
  if (severity === 'S1' || severity === 'S2') {
    return 'correctness';
  }
  if (severity === 'S3') {
    return 'reliability';
  }
  return 'DX';
}

/**
 * @param {string} severity
 */
function mapSeverityToImpact(severity) {
  if (severity === 'S1') return 5;
  if (severity === 'S2') return 4;
  if (severity === 'S3') return 3;
  return 2;
}

/**
 * @param {{
 *   debtItems: Array<{ debtId: string; area: string; description: string; severity: string; ownerTag: string }>;
 *   generatedAtIso: string;
 *   backlogSize?: number;
 *   startTaskNumber?: number;
 * }} options
 */
export function createNextHundredBacklogMarkdown(options) {
  const backlogSize = options.backlogSize ?? DEFAULT_BACKLOG_SIZE;
  const startTaskNumber = options.startTaskNumber ?? DEFAULT_START_TASK_NUMBER;
  const generatedAtIso = options.generatedAtIso;

  if (!Array.isArray(options.debtItems)) {
    throw new Error('Invalid debt items list.');
  }
  if (typeof generatedAtIso !== 'string') {
    throw new Error(`Invalid generatedAtIso: ${formatUnknown(generatedAtIso)}`);
  }

  const rows = [];

  for (let index = 0; index < backlogSize; index += 1) {
    const taskNumber = startTaskNumber + index;
    const taskId = `task${String(taskNumber).padStart(3, '0')}`;
    const debtItem = options.debtItems[index];

    if (debtItem) {
      rows.push(
        `| ${taskId} | Address debt ${debtItem.debtId}: ${debtItem.area} | ${debtItem.area
          .toLowerCase()
          .replaceAll(/\s+/gu, '-')} | ${mapSeverityToRisk(debtItem.severity)} | ${String(
          mapSeverityToImpact(debtItem.severity),
        )} | 3 | 4 | ${debtItem.ownerTag || '`@unassigned`'} | follow debt-specific validation + targeted regression runs | pending |`,
      );
      continue;
    }

    rows.push(
      `| ${taskId} | Backlog discovery candidate #${String(
        index + 1,
      )} | cross-cutting | reliability | 2 | 2 | 2 | \`@triage\` | define validation command at implementation time | pending |`,
    );
  }

  return [
    `# Next 100 Backlog Draft (${generatedAtIso})`,
    '',
    `Generated from open debt register items in \`${DEFAULT_DEBT_REGISTER_PATH}\`.`,
    '',
    '| id | title | subsystem | risk | impact (1-5) | effort (1-5) | confidence (1-5) | ownerTag | validation | status |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n');
}

/**
 * @param {{
 *   repoRoot?: string;
 *   now?: Date;
 * }} [options]
 */
export async function generateNextBacklogFile(options = {}) {
  const repoRoot = options.repoRoot ?? process.cwd();
  const now = options.now ?? new Date();
  const isoDate = now.toISOString().slice(0, 10);
  const outputFileName = `next-100-backlog-draft-${isoDate}.md`;
  const debtRegisterPath = path.resolve(repoRoot, DEFAULT_DEBT_REGISTER_PATH);
  const outputPath = path.resolve(repoRoot, DEFAULT_OUTPUT_DIRECTORY, outputFileName);

  const debtRegisterMarkdown = await readFile(debtRegisterPath, 'utf8');
  const debtItems = parseOpenDebtItems(debtRegisterMarkdown);
  const backlogMarkdown = createNextHundredBacklogMarkdown({
    debtItems,
    generatedAtIso: now.toISOString(),
  });

  await writeFile(outputPath, backlogMarkdown, 'utf8');
  return {
    outputPath,
    openDebtItems: debtItems.length,
  };
}

const currentFilePath = fileURLToPath(import.meta.url);
const invokedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : null;
const shouldRunAsScript = invokedFilePath === currentFilePath;

if (shouldRunAsScript) {
  try {
    const result = await generateNextBacklogFile();
    process.stdout.write(
      `[backlog:next100] generated ${path.basename(result.outputPath)} from ${String(result.openDebtItems)} open debt item(s).\n`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown next-backlog generation error';
    process.stderr.write(`[backlog:next100] ${message}\n`);
    process.exitCode = 1;
  }
}
