export type LogLevel = 'info' | 'warn' | 'error';

export interface LogRecord {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

function serializeLogRecord(record: LogRecord): string {
  const timestamp = new Date().toISOString();
  if (record.context === undefined) {
    return JSON.stringify({
      timestamp,
      level: record.level,
      message: record.message,
    });
  }

  return JSON.stringify({
    timestamp,
    level: record.level,
    message: record.message,
    context: record.context,
  });
}

export function log(record: LogRecord): void {
  const serialized = serializeLogRecord(record);
  const stream = record.level === 'error' ? process.stderr : process.stdout;
  stream.write(serialized);
  stream.write('\n');
}
