import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { cleanAccidentalBuildArtifacts } from './clean-accidental-build-artifacts.mjs';

function createTempRepoRoot(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeFileSyncEnsuringParent(filePath, contents = 'fixture') {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, 'utf8');
}

test('cleanAccidentalBuildArtifacts removes build and debugger .next directories', async () => {
  const repoRoot = createTempRepoRoot('clean-artifacts-directories-');
  const buildFile = path.join(repoRoot, 'build', 'index.html');
  const debuggerFile = path.join(repoRoot, 'apps', 'debugger', '.next', 'build-manifest.json');
  writeFileSyncEnsuringParent(buildFile);
  writeFileSyncEnsuringParent(debuggerFile);

  const result = await cleanAccidentalBuildArtifacts({ repoRoot });

  assert.equal(fs.existsSync(path.join(repoRoot, 'build')), false);
  assert.equal(fs.existsSync(path.join(repoRoot, 'apps', 'debugger', '.next')), false);
  assert.deepEqual(result.deletedDirectories, ['apps/debugger/.next', 'build']);
});

test('cleanAccidentalBuildArtifacts removes generated accuracy files and keeps golden baselines', async () => {
  const repoRoot = createTempRepoRoot('clean-artifacts-accuracy-');
  const generatedOutputPath = path.join(repoRoot, 'test', 'accuracy', 'testroms', 'suite', 'frame.output');
  const generatedPngPath = path.join(repoRoot, 'test', 'accuracy', 'testroms', 'suite', 'frame.png');
  const goldenOutputPath = path.join(repoRoot, 'test', 'accuracy', 'testroms', 'suite', 'frame.golden.output');
  const goldenPngPath = path.join(repoRoot, 'test', 'accuracy', 'testroms', 'suite', 'frame.golden.png');
  writeFileSyncEnsuringParent(generatedOutputPath);
  writeFileSyncEnsuringParent(generatedPngPath);
  writeFileSyncEnsuringParent(goldenOutputPath);
  writeFileSyncEnsuringParent(goldenPngPath);

  const result = await cleanAccidentalBuildArtifacts({ repoRoot });

  assert.equal(fs.existsSync(generatedOutputPath), false);
  assert.equal(fs.existsSync(generatedPngPath), false);
  assert.equal(fs.existsSync(goldenOutputPath), true);
  assert.equal(fs.existsSync(goldenPngPath), true);
  assert.deepEqual(result.deletedFiles, ['test/accuracy/testroms/suite/frame.output', 'test/accuracy/testroms/suite/frame.png']);
});

test('cleanAccidentalBuildArtifacts removes generated performance PNGs except baseline noPerformanceOptions outputs', async () => {
  const repoRoot = createTempRepoRoot('clean-artifacts-performance-');
  const generatedPerfPngPath = path.join(repoRoot, 'test', 'performance', 'testroms', 'suite', 'frame.png');
  const baselinePerfPngPath = path.join(repoRoot, 'test', 'performance', 'testroms', 'suite', 'frame.noPerformanceOptions.png');
  writeFileSyncEnsuringParent(generatedPerfPngPath);
  writeFileSyncEnsuringParent(baselinePerfPngPath);

  const result = await cleanAccidentalBuildArtifacts({ repoRoot });

  assert.equal(fs.existsSync(generatedPerfPngPath), false);
  assert.equal(fs.existsSync(baselinePerfPngPath), true);
  assert.deepEqual(result.deletedFiles, ['test/performance/testroms/suite/frame.png']);
});

test('cleanAccidentalBuildArtifacts returns empty lists when no accidental artifacts exist', async () => {
  const repoRoot = createTempRepoRoot('clean-artifacts-empty-');
  const keepFilePath = path.join(repoRoot, 'test', 'accuracy', 'testroms', 'suite', 'keep.golden.png');
  writeFileSyncEnsuringParent(keepFilePath);

  const result = await cleanAccidentalBuildArtifacts({ repoRoot });

  assert.deepEqual(result.deletedDirectories, []);
  assert.deepEqual(result.deletedFiles, []);
  assert.equal(fs.existsSync(keepFilePath), true);
});

test('cleanAccidentalBuildArtifacts removes integration output files and keeps golden screenshots', async () => {
  const repoRoot = createTempRepoRoot('clean-artifacts-integration-');
  const generatedOutputPng = path.join(repoRoot, 'test', 'integration', 'headless-simple.golden.output.png');
  const generatedOutputLog = path.join(repoRoot, 'test', 'integration', 'headless-simple.output');
  const goldenScreenshot = path.join(repoRoot, 'test', 'integration', 'headless-simple.golden.png');
  writeFileSyncEnsuringParent(generatedOutputPng);
  writeFileSyncEnsuringParent(generatedOutputLog);
  writeFileSyncEnsuringParent(goldenScreenshot);

  const result = await cleanAccidentalBuildArtifacts({ repoRoot });

  assert.equal(fs.existsSync(generatedOutputPng), false);
  assert.equal(fs.existsSync(generatedOutputLog), false);
  assert.equal(fs.existsSync(goldenScreenshot), true);
  assert.deepEqual(result.deletedFiles, ['test/integration/headless-simple.golden.output.png', 'test/integration/headless-simple.output']);
});
