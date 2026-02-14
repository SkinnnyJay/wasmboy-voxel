import { runCoreWrapperMemoryLayoutCheck } from './core-wrapper-memory-layout-check-lib.mjs';

try {
  const result = await runCoreWrapperMemoryLayoutCheck();

  if (!result.isValid) {
    process.stderr.write('[memory-layout:check] core/constants.ts and voxel-wrapper.ts are out of sync.\n');
    for (const error of result.errors) {
      process.stderr.write(`[memory-layout:check] - ${error}\n`);
    }
    process.exitCode = 1;
  } else {
    process.stdout.write('[memory-layout:check] core/constants.ts and voxel-wrapper.ts are compatible.\n');
  }
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown memory-layout check error';
  process.stderr.write(`[memory-layout:check] ${message}\n`);
  process.exitCode = 1;
}
