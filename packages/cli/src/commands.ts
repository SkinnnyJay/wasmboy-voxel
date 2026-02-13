import fs from 'node:fs';
import crypto from 'node:crypto';
import {
  CONTRACT_VERSION_V1,
  ContractRegistry,
  validateRegistryPayload,
} from '@wasmboy/api';
import { log } from './logger.js';
import { assertFilePath, assertRomPath, resolveInputPath } from './paths.js';

function readFileBuffer(filePath: string): Buffer {
  return fs.readFileSync(filePath);
}

function sha256Hex(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function printHelp(): void {
  const helpText = `
WasmBoy-Voxel CLI

Usage:
  wasmboy-voxel run <rom>
  wasmboy-voxel snapshot <rom> [--out <jsonPath>]
  wasmboy-voxel compare <baselineSummary> [--current <summaryPath>]
  wasmboy-voxel contract-check --contract <name> --file <jsonPath>

Examples:
  wasmboy-voxel run test/performance/testroms/tobutobugirl/tobutobugirl.gb
  wasmboy-voxel snapshot test/performance/testroms/back-to-color/back-to-color.gbc --out ./snapshot.json
  wasmboy-voxel compare test/baseline/snapshots/summary.json
  wasmboy-voxel contract-check --contract ppuSnapshot --file ./snapshot.json
`;
  process.stdout.write(helpText);
}

export function runCommand(romPath: string): void {
  const resolvedRom = assertRomPath(romPath);
  const romBuffer = readFileBuffer(resolvedRom);
  log({
    level: 'info',
    message: 'run command completed',
    context: {
      romPath: resolvedRom,
      sizeBytes: romBuffer.length,
      sha256: sha256Hex(romBuffer),
    },
  });
}

export function snapshotCommand(romPath: string, outputPath?: string): void {
  const resolvedRom = assertRomPath(romPath);
  const romBuffer = readFileBuffer(resolvedRom);

  const payload = {
    romPath: resolvedRom,
    capturedAtUtc: new Date().toISOString(),
    sizeBytes: romBuffer.length,
    sha256: sha256Hex(romBuffer),
  };

  const serialized = JSON.stringify(payload, null, 2);
  if (outputPath) {
    const resolvedOut = resolveInputPath(outputPath);
    fs.writeFileSync(resolvedOut, serialized);
    log({
      level: 'info',
      message: 'snapshot command wrote output',
      context: {
        outputPath: resolvedOut,
      },
    });
    return;
  }

  process.stdout.write(`${serialized}\n`);
}

interface SummaryFile {
  roms: Array<{ rom: string; tileDataSha256?: string; oamDataSha256?: string }>;
}

function readSummary(pathToSummary: string): SummaryFile {
  const raw = readFileBuffer(assertFilePath(pathToSummary)).toString('utf8');
  return JSON.parse(raw) as SummaryFile;
}

export function compareCommand(baselinePath: string, currentPath?: string): void {
  const baseline = readSummary(baselinePath);
  const current = readSummary(currentPath ?? baselinePath);

  const baselineMap = new Map<string, { tileDataSha256?: string; oamDataSha256?: string }>();
  baseline.roms.forEach((entry) => baselineMap.set(entry.rom, entry));

  const differences = current.roms
    .map((entry) => {
      const base = baselineMap.get(entry.rom);
      if (!base) return { rom: entry.rom, kind: 'missing-in-baseline' };
      if (base.tileDataSha256 !== entry.tileDataSha256 || base.oamDataSha256 !== entry.oamDataSha256) {
        return { rom: entry.rom, kind: 'checksum-diff' };
      }
      return null;
    })
    .filter((entry): entry is { rom: string; kind: string } => entry !== null);

  log({
    level: differences.length > 0 ? 'warn' : 'info',
    message: differences.length > 0 ? 'compare command detected differences' : 'compare command found no differences',
    context: {
      baselinePath: resolveInputPath(baselinePath),
      currentPath: resolveInputPath(currentPath ?? baselinePath),
      differences,
    },
  });
}

function parseFlagValue(args: string[], flag: string): string | null {
  const index = args.indexOf(flag);
  if (index < 0 || index >= args.length - 1) return null;
  return args[index + 1] ?? null;
}

export function contractCheckCommand(args: string[]): void {
  const contractName = parseFlagValue(args, '--contract');
  const filePath = parseFlagValue(args, '--file');

  if (!contractName || !filePath) {
    throw new Error('contract-check requires --contract and --file');
  }

  const schema = ContractRegistry[CONTRACT_VERSION_V1][contractName];
  if (!schema) {
    throw new Error(`Unknown contract name "${contractName}" for version ${CONTRACT_VERSION_V1}`);
  }

  const payload = JSON.parse(readFileBuffer(assertFilePath(filePath)).toString('utf8'));
  const result = validateRegistryPayload(CONTRACT_VERSION_V1, contractName, payload);
  if (!result.success) {
    throw new Error(`contract-check failed: ${result.errorMessage ?? 'unknown error'}`);
  }

  log({
    level: 'info',
    message: 'contract-check passed',
    context: {
      contractName,
      filePath: resolveInputPath(filePath),
    },
  });
}
