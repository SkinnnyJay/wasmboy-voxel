import {
  contractCheckCommand,
  compareCommand,
  printHelp,
  runCommand,
  snapshotCommand,
} from './commands.js';
import { CliError } from './errors.js';
import { log } from './logger.js';

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
    const outFlagIndex = rest.indexOf('--out');
    const outPath = outFlagIndex >= 0 ? rest[outFlagIndex + 1] : undefined;
    snapshotCommand(romPath, outPath);
    return;
  }

  if (command === 'compare') {
    const baselinePath = rest[0];
    if (!baselinePath) {
      throw new CliError('InvalidInput', 'compare command requires <baselineSummary>');
    }
    const currentFlagIndex = rest.indexOf('--current');
    const currentPath = currentFlagIndex >= 0 ? rest[currentFlagIndex + 1] : undefined;
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
