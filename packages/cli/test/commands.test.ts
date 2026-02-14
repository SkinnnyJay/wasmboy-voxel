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
import { CliError } from '../src/errors.js';
import { executeCli } from '../src/index.js';

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

  it('throws InvalidInput for missing rom path', () => {
    expect(() => runCommand('/tmp/does-not-exist.gb')).toThrowError(CliError);
    try {
      runCommand('/tmp/does-not-exist.gb');
    } catch (error) {
      if (error instanceof CliError) {
        expect(error.code).toBe('InvalidInput');
      } else {
        throw error;
      }
    }
  });

  it('throws InvalidOperation for unknown CLI command', () => {
    expect(() => executeCli(['unknown-command'])).toThrowError(CliError);
    try {
      executeCli(['unknown-command']);
    } catch (error) {
      if (error instanceof CliError) {
        expect(error.code).toBe('InvalidOperation');
      } else {
        throw error;
      }
    }
  });

  it('throws OutOfBounds for invalid contract payload', () => {
    const dir = createTempDir();
    const payloadPath = path.join(dir, 'invalid-registers.json');
    writeJson(payloadPath, {
      scx: -1,
    });

    expect(() =>
      contractCheckCommand(['--contract', 'registers', '--file', payloadPath]),
    ).toThrowError(CliError);

    try {
      contractCheckCommand(['--contract', 'registers', '--file', payloadPath]);
    } catch (error) {
      if (error instanceof CliError) {
        expect(error.code).toBe('OutOfBounds');
      } else {
        throw error;
      }
    }
  });

  it('suggests closest snapshot option for unknown flags', () => {
    const dir = createTempDir();
    const romPath = path.join(dir, 'sample.gb');
    fs.writeFileSync(romPath, Buffer.from([1, 2, 3]));

    expect(() =>
      executeCli(['snapshot', romPath, '--ot', path.join(dir, 'out.json')]),
    ).toThrowError(CliError);

    try {
      executeCli(['snapshot', romPath, '--ot', path.join(dir, 'out.json')]);
    } catch (error) {
      if (error instanceof CliError) {
        expect(error.code).toBe('InvalidInput');
        expect(error.message).toContain('Unknown option "--ot"');
        expect(error.message).toContain('Did you mean "--out"?');
      } else {
        throw error;
      }
    }
  });

  it('suggests closest compare option for unknown flags', () => {
    const dir = createTempDir();
    const baselinePath = path.join(dir, 'baseline.json');
    writeJson(baselinePath, {
      roms: [{ rom: 'foo.gb', tileDataSha256: 'abc', oamDataSha256: 'def' }],
    });

    expect(() => executeCli(['compare', baselinePath, '--currnt', baselinePath])).toThrowError(
      CliError,
    );

    try {
      executeCli(['compare', baselinePath, '--currnt', baselinePath]);
    } catch (error) {
      if (error instanceof CliError) {
        expect(error.code).toBe('InvalidInput');
        expect(error.message).toContain('Unknown option "--currnt"');
        expect(error.message).toContain('Did you mean "--current"?');
      } else {
        throw error;
      }
    }
  });

  it('suggests closest contract-check option for unknown flags', () => {
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
      executeCli(['contract-check', '--contrct', 'registers', '--file', payloadPath]),
    ).toThrowError(CliError);

    try {
      executeCli(['contract-check', '--contrct', 'registers', '--file', payloadPath]);
    } catch (error) {
      if (error instanceof CliError) {
        expect(error.code).toBe('InvalidInput');
        expect(error.message).toContain('Unknown option "--contrct"');
        expect(error.message).toContain('Did you mean "--contract"?');
      } else {
        throw error;
      }
    }
  });

  it('enforces mutual exclusion between snapshot output aliases', () => {
    const dir = createTempDir();
    const romPath = path.join(dir, 'sample.gb');
    fs.writeFileSync(romPath, Buffer.from([1, 2, 3]));

    expect(() =>
      executeCli([
        'snapshot',
        romPath,
        '--out',
        path.join(dir, 'first.json'),
        '-o',
        path.join(dir, 'second.json'),
      ]),
    ).toThrowError(CliError);

    try {
      executeCli([
        'snapshot',
        romPath,
        '--out',
        path.join(dir, 'first.json'),
        '-o',
        path.join(dir, 'second.json'),
      ]);
    } catch (error) {
      if (error instanceof CliError) {
        expect(error.code).toBe('InvalidInput');
        expect(error.message).toContain(
          'snapshot command options --out, -o are mutually exclusive',
        );
      } else {
        throw error;
      }
    }
  });

  it('enforces mutual exclusion between compare current aliases', () => {
    const dir = createTempDir();
    const baselinePath = path.join(dir, 'baseline.json');
    writeJson(baselinePath, {
      roms: [{ rom: 'foo.gb', tileDataSha256: 'abc', oamDataSha256: 'def' }],
    });

    expect(() =>
      executeCli(['compare', baselinePath, '--current', baselinePath, '-c', baselinePath]),
    ).toThrowError(CliError);

    try {
      executeCli(['compare', baselinePath, '--current', baselinePath, '-c', baselinePath]);
    } catch (error) {
      if (error instanceof CliError) {
        expect(error.code).toBe('InvalidInput');
        expect(error.message).toContain(
          'compare command options --current, -c are mutually exclusive',
        );
      } else {
        throw error;
      }
    }
  });
});
