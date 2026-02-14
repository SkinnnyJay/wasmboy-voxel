import fs from 'node:fs';
import path from 'node:path';
import { CliError } from './errors.js';

const ROM_EXTENSIONS = new Set(['.gb', '.gbc']);

function stripWrappingQuotes(inputPath: string): string {
  if (inputPath.length < 2) {
    return inputPath;
  }

  const firstCharacter = inputPath[0];
  const lastCharacter = inputPath[inputPath.length - 1];
  const isWrappedWithDoubleQuotes = firstCharacter === '"' && lastCharacter === '"';
  const isWrappedWithSingleQuotes = firstCharacter === "'" && lastCharacter === "'";
  if (!isWrappedWithDoubleQuotes && !isWrappedWithSingleQuotes) {
    return inputPath;
  }

  return inputPath.slice(1, -1);
}

export function resolveInputPath(inputPath: string): string {
  const unquotedPath = stripWrappingQuotes(inputPath);
  const normalizedSeparators = unquotedPath.replace(/\\/g, '/');
  return path.resolve(process.cwd(), normalizedSeparators);
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
