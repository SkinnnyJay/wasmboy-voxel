import {
  assertKnownCommandOptions,
  contractCheckCommand,
  compareCommand,
  printHelp,
  runCommand,
  snapshotCommand,
} from './commands.js';
import { CliError } from './errors.js';
import { log } from './logger.js';

const SNAPSHOT_OUTPUT_FLAGS = ['--out', '-o'] as const;
const COMPARE_CURRENT_FLAGS = ['--current', '-c'] as const;

function assertMutuallyExclusiveFlags(
  commandName: string,
  args: string[],
  mutuallyExclusiveFlags: readonly string[],
): void {
  const presentFlags = mutuallyExclusiveFlags.filter(flag => args.includes(flag));
  if (presentFlags.length <= 1) {
    return;
  }

  throw new CliError(
    'InvalidInput',
    `${commandName} command options ${presentFlags.join(', ')} are mutually exclusive`,
  );
}

function readFirstFlagValue(args: string[], flags: readonly string[]): string | undefined {
  for (const flag of flags) {
    const flagIndex = args.indexOf(flag);
    if (flagIndex < 0) {
      continue;
    }
    return args[flagIndex + 1];
  }

  return undefined;
}

export function executeCli(argv: string[]): void {
  const [command, ...rest] = argv;

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === 'run') {
    const romPath = rest[0];
    if (!romPath) throw new CliError('InvalidInput', 'run command requires <rom>');
    runCommand(romPath);
    return;
  }

  if (command === 'snapshot') {
    const romPath = rest[0];
    if (!romPath) throw new CliError('InvalidInput', 'snapshot command requires <rom>');
    const commandArgs = rest.slice(1);
    assertKnownCommandOptions('snapshot', commandArgs, SNAPSHOT_OUTPUT_FLAGS);
    assertMutuallyExclusiveFlags('snapshot', commandArgs, SNAPSHOT_OUTPUT_FLAGS);
    const outPath = readFirstFlagValue(commandArgs, SNAPSHOT_OUTPUT_FLAGS);
    snapshotCommand(romPath, outPath);
    return;
  }

  if (command === 'compare') {
    const baselinePath = rest[0];
    if (!baselinePath) {
      throw new CliError('InvalidInput', 'compare command requires <baselineSummary>');
    }
    const commandArgs = rest.slice(1);
    assertKnownCommandOptions('compare', commandArgs, COMPARE_CURRENT_FLAGS);
    assertMutuallyExclusiveFlags('compare', commandArgs, COMPARE_CURRENT_FLAGS);
    const currentPath = readFirstFlagValue(commandArgs, COMPARE_CURRENT_FLAGS);
    compareCommand(baselinePath, currentPath);
    return;
  }

  if (command === 'contract-check') {
    contractCheckCommand(rest);
    return;
  }

  throw new CliError('InvalidOperation', `Unknown command: ${command}`);
}

function isEntrypoint(): boolean {
  const argvPath = process.argv[1];
  if (!argvPath) return false;
  const normalizedPath = argvPath.replace(/\\/g, '/');
  return (
    normalizedPath.endsWith('/packages/cli/dist/index.js') ||
    normalizedPath.endsWith('/packages/cli/dist/index.cjs') ||
    normalizedPath.endsWith('/packages/cli/src/index.ts') ||
    normalizedPath.endsWith('/packages/cli/src/index.js')
  );
}

if (isEntrypoint()) {
  try {
    executeCli(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown CLI error';
    const code = error instanceof CliError ? error.code : 'InvalidOperation';
    log({
      level: 'error',
      message: 'CLI command failed',
      context: { code, error: message },
    });
    process.exit(1);
  }
}
