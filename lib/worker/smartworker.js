// Smarter workers.
// Workers with ids, pub sub, etc...
// https://medium.com/dailyjs/threads-in-node-10-5-0-a-practical-intro-3b85a0a3c953

/*ROLLUP_REPLACE_NODE
const { Worker } = require('worker_threads');
ROLLUP_REPLACE_NODE*/

import { getEventData, readBase64String, getWorkerScriptString, isInBrowser } from './util';

// Generate ids. Use a counter to help against possible collisions.
let idCounter = 0;
const generateId = () => {
  const randomId = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(2, 10);
  idCounter++;
  const id = `${randomId}-${idCounter}`;
  if (idCounter > 100000) {
    idCounter = 0;
  }
  return id;
};

export function getSmartWorkerMessage(message, messageId, workerId) {
  if (!messageId) {
    messageId = generateId();
  }
  return {
    workerId,
    messageId,
    message
  };
}

export class SmartWorker {
  constructor(workerUrl, id) {
    this.id = generateId();
    if (id) {
      this.id = id;
    }
    this.messageListeners = [];

    /*ROLLUP_REPLACE_PROD_BROWSER
    
    // Can't load base63 data string directly because safari
    // https://stackoverflow.com/questions/10343913/how-to-create-a-web-worker-from-a-string

    let workerJs = atob(workerUrl.split(',')[1]);
    let blob;
    try {
      blob = new Blob([workerJs], {type: 'application/javascript'});
    } catch (e) {
      // Legacy
      window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
      blob = new BlobBuilder();
      blob.append(workerJs);
      blob = blob.getBlob();
    }
    this.worker = new Worker(URL.createObjectURL(blob));


    this.worker.onmessage = this._onMessageHandler.bind(this);
    
    ROLLUP_REPLACE_PROD_BROWSER*/

    /*ROLLUP_REPLACE_DEV_BROWSER

    this.worker = new Worker(workerUrl);
    this.worker.onmessage = this._onMessageHandler.bind(this);

    ROLLUP_REPLACE_DEV_BROWSER*/

    /*ROLLUP_REPLACE_NODE

    const workerAsString = getWorkerScriptString(workerUrl);
    this.worker = new Worker(workerAsString, {
      eval: true
    });
    this.worker.on('message', this._onMessageHandler.bind(this))

    ROLLUP_REPLACE_NODE*/
  }

  postMessageIgnoreResponse(message, transfer) {
    const messageObject = getSmartWorkerMessage(message, undefined, this.id);
    this.worker.postMessage(messageObject, transfer);
  }

  postMessage(message, transfer, timeout) {
    if (timeout === undefined || timeout === null) {
      timeout = isInBrowser ? 1000 : 30000;
    }

    const messageObject = getSmartWorkerMessage(message, undefined, this.id);
    const messageId = messageObject.messageId;

    const messageIdListener = new Promise((resolve, reject) => {
      let messageDroppedTimeout;
      const listenerId = this.addMessageListener((responseMessage, messageListener) => {
        const eventData = getEventData(responseMessage);
        if (eventData.messageId === messageId) {
          clearTimeout(messageDroppedTimeout);
          messageDroppedTimeout = undefined;
          this.removeMessageListener(messageListener.id);
          resolve(eventData);
        }
      });

      messageDroppedTimeout = setTimeout(() => {
        console.warn('Message dropped', message);
        this.removeMessageListener(listenerId);
        reject();
      }, timeout);
    });

    this.worker.postMessage(messageObject, transfer);

    return messageIdListener;
  }

  addMessageListener(callback) {
    const id = generateId();
    this.messageListeners.push({
      id,
      callback: callback
    });
    return id;
  }

  removeMessageListener(id) {
    let messageListenerIndex;
    this.messageListeners.some((messageListener, index) => {
      if (messageListener.id === id) {
        messageListenerIndex = index;
        return true;
      }

      return false;
    });

    if (messageListenerIndex !== undefined) {
      this.messageListeners.splice(messageListenerIndex, 1);
    }
  }

  _onMessageHandler(message) {
    this.messageListeners.forEach(messageListener => {
      messageListener.callback(message, messageListener);
    });
  }
}
