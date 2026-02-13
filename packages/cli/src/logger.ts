export type LogLevel = 'info' | 'warn' | 'error';

export interface LogRecord {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

export function log(record: LogRecord): void {
  const payload = {
    timestamp: new Date().toISOString(),
    ...record,
  };
  const serialized = JSON.stringify(payload);
  if (record.level === 'error') {
    process.stderr.write(`${serialized}\n`);
    return;
  }
  process.stdout.write(`${serialized}\n`);
}
