import path from 'node:path';
import { spawnSync } from 'node:child_process';

const RELEASE_TARGETS = [
  { packageName: '@wasmboy/api', packageDirectory: 'packages/api' },
  { packageName: '@wasmboy/cli', packageDirectory: 'packages/cli' },
];

function runNpmPublishDryRun(repoRoot, releaseTarget) {
  const targetDirectory = path.resolve(repoRoot, releaseTarget.packageDirectory);
  const commandArguments = ['publish', '--dry-run', '--access', 'public'];
  const command = `npm ${commandArguments.join(' ')}`;
  const result = spawnSync('npm', commandArguments, {
    cwd: targetDirectory,
    encoding: 'utf8',
    env: process.env,
  });

  if (result.error) {
    throw new Error(`Failed to execute "${command}" for ${releaseTarget.packageName}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const outputSegments = [];
    if (result.stdout?.trim()) {
      outputSegments.push(`stdout: ${result.stdout.trim()}`);
    }
    if (result.stderr?.trim()) {
      outputSegments.push(`stderr: ${result.stderr.trim()}`);
    }

    const outputDetails = outputSegments.length > 0 ? ` ${outputSegments.join(' ')}` : '';
    throw new Error(
      `"${command}" failed for ${releaseTarget.packageName} (exit ${String(result.status)}) in ${
        releaseTarget.packageDirectory
      }.${outputDetails}`,
    );
  }

  process.stdout.write(`[release-checklist] npm publish dry-run passed for ${releaseTarget.packageName}\n`);
}

function runReleaseChecklistDryRun() {
  const repoRoot = process.cwd();
  for (const releaseTarget of RELEASE_TARGETS) {
    runNpmPublishDryRun(repoRoot, releaseTarget);
  }
}

try {
  runReleaseChecklistDryRun();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown release checklist error';
  process.stderr.write(`[release-checklist] ${message}\n`);
  process.exitCode = 1;
}
