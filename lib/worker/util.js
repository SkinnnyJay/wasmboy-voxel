export function getEventData(event) {
  if (event.data) {
    return event.data;
  }

  return event;
}

export const isInBrowser = typeof self !== 'undefined';

// Function to read a base64 string as a buffer
export function readBase64String(base64String) {
  if (isInBrowser) {
    return base64String;
  } else {
    return readBase64Buffer(base64String).toString('utf8');
  }
}

export function readBase64Buffer(base64String) {
  return Buffer.from(base64String.split(',')[1], 'base64');
}

// In Node: return worker script string from a data URL (base64) or a file path (relative to dist when workerUrl starts with worker/)
export function getWorkerScriptString(workerUrl) {
  if (isInBrowser) {
    return workerUrl;
  }
  if (workerUrl.indexOf(',') >= 0) {
    return readBase64String(workerUrl);
  }
  const path = require('path');
  const fs = require('fs');
  const resolved = workerUrl.indexOf('worker/') === 0 ? path.join(process.cwd(), 'dist', workerUrl) : path.resolve(workerUrl);
  return fs.readFileSync(resolved, 'utf8');
}
