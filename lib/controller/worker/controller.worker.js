// Web worker for wasmboy lib
// Will be used for running wasm, and controlling child workers.

import { postMessage, onMessage } from '../../worker/workerapi';
import { getEventData } from '../../worker/util';
import { getSmartWorkerMessage } from '../../worker/smartworker';
import { WORKER_MESSAGE_TYPE } from '../../worker/constants';
import { hasWorkerMessageType } from '../../worker/message-schema';

// Worker port for the lib
let libWorkerPort;
const libMessageHandler = event => {};

const messageHandler = event => {
  // Handle our messages from the main thread
  const eventData = getEventData(event);
  if (!hasWorkerMessageType(eventData)) {
    return;
  }

  switch (eventData.message.type) {
    case WORKER_MESSAGE_TYPE.CONNECT: {
      // Set our lib port
      libWorkerPort = eventData.message.ports[0];
      onMessage(libMessageHandler, libWorkerPort);

      // Simply post back that we are ready
      postMessage(getSmartWorkerMessage(undefined, eventData.messageId));
      return;
    }

    case WORKER_MESSAGE_TYPE.SET_JOYPAD_STATE: {
      libWorkerPort.postMessage(getSmartWorkerMessage(eventData.message, eventData.messageId));
      return;
    }

    default: {
      //handle other messages from main
      console.log(eventData);
    }
  }
};

onMessage(messageHandler);
