import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { cleanupTrackedTempDirectories, installTempDirectoryCleanup, trackTempDirectory } from './temp-directory-cleanup.mjs';

test('installTempDirectoryCleanup tracks mkdtempSync directories and cleans them deterministically', () => {
  installTempDirectoryCleanup(fs);
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-temp-cleanup-install-'));
  const nestedFile = path.join(tempDirectory, 'nested', 'file.txt');
  fs.mkdirSync(path.dirname(nestedFile), { recursive: true });
  fs.writeFileSync(nestedFile, 'fixture', 'utf8');

  assert.equal(fs.existsSync(tempDirectory), true);
  cleanupTrackedTempDirectories(fs);
  assert.equal(fs.existsSync(tempDirectory), false);
});

test('trackTempDirectory registers explicit temp paths for cleanup', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-temp-cleanup-track-'));
  const tempFile = path.join(tempDirectory, 'fixture.txt');
  fs.writeFileSync(tempFile, 'fixture', 'utf8');

  trackTempDirectory(tempDirectory);
  assert.equal(fs.existsSync(tempDirectory), true);
  cleanupTrackedTempDirectories(fs);
  assert.equal(fs.existsSync(tempDirectory), false);
});
