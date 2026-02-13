import { contractCheckCommand, compareCommand, printHelp, runCommand, snapshotCommand } from './commands.js';
import { log } from './logger.js';

function main(argv: string[]): void {
  const [command, ...rest] = argv;

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === 'run') {
    const romPath = rest[0];
    if (!romPath) throw new Error('run command requires <rom>');
    runCommand(romPath);
    return;
  }

  if (command === 'snapshot') {
    const romPath = rest[0];
    if (!romPath) throw new Error('snapshot command requires <rom>');
    const outFlagIndex = rest.indexOf('--out');
    const outPath = outFlagIndex >= 0 ? rest[outFlagIndex + 1] : undefined;
    snapshotCommand(romPath, outPath);
    return;
  }

  if (command === 'compare') {
    const baselinePath = rest[0];
    if (!baselinePath) throw new Error('compare command requires <baselineSummary>');
    const currentFlagIndex = rest.indexOf('--current');
    const currentPath = currentFlagIndex >= 0 ? rest[currentFlagIndex + 1] : undefined;
    compareCommand(baselinePath, currentPath);
    return;
  }

  if (command === 'contract-check') {
    contractCheckCommand(rest);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

try {
  main(process.argv.slice(2));
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown CLI error';
  log({
    level: 'error',
    message: 'CLI command failed',
    context: { error: message },
  });
  process.exit(1);
}
