import { runCoreMemoryOffsetContractCheck } from './core-memory-offset-contract-check-lib.mjs';

try {
  await runCoreMemoryOffsetContractCheck();
  process.stdout.write('[core:memory-offset:check] core offset mapping contract is valid.\n');
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown core memory offset contract error';
  process.stderr.write(`[core:memory-offset:check] ${message}\n`);
  process.exitCode = 1;
}
