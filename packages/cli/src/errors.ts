export type CliErrorCode = 'InvalidInput' | 'InvalidOperation' | 'OutOfBounds';

export class CliError extends Error {
  public readonly code: CliErrorCode;

  constructor(code: CliErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'CliError';
  }
}
