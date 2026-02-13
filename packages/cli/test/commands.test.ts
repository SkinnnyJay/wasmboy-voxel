import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  compareCommand,
  contractCheckCommand,
  runCommand,
  snapshotCommand,
} from '../src/commands.js';

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'wasmboy-cli-test-'));
}

function writeJson(filePath: string, payload: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

describe('cli commands', () => {
  it('run command validates ROM input and logs metadata', () => {
    const dir = createTempDir();
    const romPath = path.join(dir, 'sample.gb');
    fs.writeFileSync(romPath, Buffer.from([1, 2, 3, 4]));
    expect(() => runCommand(romPath)).not.toThrow();
  });

  it('snapshot command writes JSON payload', () => {
    const dir = createTempDir();
    const romPath = path.join(dir, 'sample.gbc');
    const outPath = path.join(dir, 'snapshot.json');
    fs.writeFileSync(romPath, Buffer.from([9, 8, 7]));
    snapshotCommand(romPath, outPath);
    const parsed = JSON.parse(fs.readFileSync(outPath, 'utf8')) as { sha256?: string };
    expect(typeof parsed.sha256).toBe('string');
  });

  it('compare command handles matching summary files', () => {
    const dir = createTempDir();
    const baselinePath = path.join(dir, 'baseline.json');
    writeJson(baselinePath, {
      roms: [{ rom: 'foo.gb', tileDataSha256: 'abc', oamDataSha256: 'def' }],
    });
    expect(() => compareCommand(baselinePath, baselinePath)).not.toThrow();
  });

  it('compare command can run against repository baseline summary', () => {
    const baselinePath = path.resolve(process.cwd(), '../../test/baseline/snapshots/summary.json');
    expect(() => compareCommand(baselinePath, baselinePath)).not.toThrow();
  });

  it('contract-check validates payload file against selected contract', () => {
    const dir = createTempDir();
    const payloadPath = path.join(dir, 'registers.json');
    writeJson(payloadPath, {
      scx: 1,
      scy: 2,
      wx: 3,
      wy: 4,
      lcdc: 5,
      bgp: 6,
      obp0: 7,
      obp1: 8,
    });
    expect(() =>
      contractCheckCommand(['--contract', 'registers', '--file', payloadPath]),
    ).not.toThrow();
  });
});
