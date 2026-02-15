export interface WorkerMessageEnvelope {
  type: string;
  [key: string]: unknown;
}

export interface WorkerSmartMessage {
  message?: WorkerMessageEnvelope | null;
  messageId?: string | number | null;
  [key: string]: unknown;
}

export const WORKER_MESSAGE_SCHEMA_VERSION: 'v1';
export const INVALID_WORKER_MESSAGE_CODE: 'INVALID_MESSAGE_ENVELOPE';
export function hasWorkerMessageType(eventData: unknown): eventData is WorkerSmartMessage & { message: WorkerMessageEnvelope };
export function getWorkerMessageType(eventData: unknown): string;
export function buildInvalidWorkerEnvelopeError(
  messageType?: string,
): {
  type: string;
  error: true;
  code: typeof INVALID_WORKER_MESSAGE_CODE;
  schemaVersion: typeof WORKER_MESSAGE_SCHEMA_VERSION;
};
