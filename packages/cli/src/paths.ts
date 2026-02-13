import fs from 'node:fs';
import path from 'node:path';
import { CliError } from './errors.js';

const ROM_EXTENSIONS = new Set(['.gb', '.gbc']);

export function resolveInputPath(inputPath: string): string {
  return path.resolve(process.cwd(), inputPath);
}

export function assertRomPath(inputPath: string): string {
  const resolved = resolveInputPath(inputPath);
  if (!fs.existsSync(resolved)) {
    throw new CliError('InvalidInput', `ROM path does not exist: ${resolved}`);
  }
  const extension = path.extname(resolved).toLowerCase();
  if (!ROM_EXTENSIONS.has(extension)) {
    throw new CliError(
      'InvalidInput',
      `Unsupported ROM extension "${extension}". Expected .gb or .gbc`,
    );
  }
  return resolved;
}

export function assertFilePath(inputPath: string): string {
  const resolved = resolveInputPath(inputPath);
  if (!fs.existsSync(resolved)) {
    throw new CliError('InvalidInput', `File path does not exist: ${resolved}`);
  }
  return resolved;
}
