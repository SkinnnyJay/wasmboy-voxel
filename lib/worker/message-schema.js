export const WORKER_MESSAGE_SCHEMA_VERSION = 'v1';
export const INVALID_WORKER_MESSAGE_CODE = 'INVALID_MESSAGE_ENVELOPE';

export const hasWorkerMessageType = eventData => {
  if (!eventData || typeof eventData !== 'object') {
    return false;
  }

  if (!eventData.message || typeof eventData.message !== 'object') {
    return false;
  }

  return typeof eventData.message.type === 'string' && eventData.message.type.length > 0;
};

export const getWorkerMessageType = eventData => {
  if (!hasWorkerMessageType(eventData)) {
    return '';
  }

  return eventData.message.type;
};

export const buildInvalidWorkerEnvelopeError = messageType => {
  return {
    type: messageType || '',
    error: true,
    code: INVALID_WORKER_MESSAGE_CODE,
    schemaVersion: WORKER_MESSAGE_SCHEMA_VERSION,
  };
};
