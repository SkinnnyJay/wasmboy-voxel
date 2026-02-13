import fs from 'node:fs';
import path from 'node:path';

const ROM_EXTENSIONS = new Set(['.gb', '.gbc']);

export function resolveInputPath(inputPath: string): string {
  return path.resolve(process.cwd(), inputPath);
}

export function assertRomPath(inputPath: string): string {
  const resolved = resolveInputPath(inputPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`ROM path does not exist: ${resolved}`);
  }
  const extension = path.extname(resolved).toLowerCase();
  if (!ROM_EXTENSIONS.has(extension)) {
    throw new Error(`Unsupported ROM extension "${extension}". Expected .gb or .gbc`);
  }
  return resolved;
}

export function assertFilePath(inputPath: string): string {
  const resolved = resolveInputPath(inputPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`File path does not exist: ${resolved}`);
  }
  return resolved;
}
