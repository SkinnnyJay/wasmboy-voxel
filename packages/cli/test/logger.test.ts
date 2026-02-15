import { describe, expect, it, vi } from 'vitest';
import { log } from '../src/logger.js';

function toChunkText(chunk: unknown): string {
  if (typeof chunk === 'string') {
    return chunk;
  }
  if (chunk instanceof Uint8Array) {
    return Buffer.from(chunk).toString('utf8');
  }
  return String(chunk);
}

describe('logger', () => {
  it('writes info records as newline-terminated JSON to stdout', () => {
    const stdoutChunks: string[] = [];
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      stdoutChunks.push(toChunkText(chunk));
      return true;
    });
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    try {
      log({
        level: 'info',
        message: 'snapshot complete',
        context: {
          romPath: '/tmp/rom.gb',
          sizeBytes: 123,
        },
      });
    } finally {
      stdoutSpy.mockRestore();
      stderrSpy.mockRestore();
    }

    const serializedLine = stdoutChunks.join('');
    expect(serializedLine.endsWith('\n')).toBe(true);
    const parsed = JSON.parse(serializedLine.trim()) as {
      timestamp?: string;
      level?: string;
      message?: string;
      context?: { romPath?: string; sizeBytes?: number };
    };
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('snapshot complete');
    expect(parsed.context?.romPath).toBe('/tmp/rom.gb');
    expect(parsed.context?.sizeBytes).toBe(123);
    expect(typeof parsed.timestamp).toBe('string');
  });

  it('writes error records as newline-terminated JSON to stderr', () => {
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const stderrChunks: string[] = [];
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
      stderrChunks.push(toChunkText(chunk));
      return true;
    });

    try {
      log({
        level: 'error',
        message: 'failed to parse payload',
      });
    } finally {
      stdoutSpy.mockRestore();
      stderrSpy.mockRestore();
    }

    const serializedLine = stderrChunks.join('');
    expect(serializedLine.endsWith('\n')).toBe(true);
    const parsed = JSON.parse(serializedLine.trim()) as {
      timestamp?: string;
      level?: string;
      message?: string;
      context?: unknown;
    };
    expect(parsed.level).toBe('error');
    expect(parsed.message).toBe('failed to parse payload');
    expect(parsed.context).toBeUndefined();
    expect(typeof parsed.timestamp).toBe('string');
  });
});
