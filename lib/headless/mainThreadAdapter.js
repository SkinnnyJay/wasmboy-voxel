/**
 * Main-thread worker adapter: runs lib-worker message handlers on the main thread
 * so WasmBoy can work with headless: true + mainThread: true (no Workers).
 */

import { WORKER_MESSAGE_TYPE } from '../worker/constants';
import { getSmartWorkerMessage } from '../worker/smartworker';
import {
  PPU_SNAPSHOT_TILE_LEN,
  PPU_SNAPSHOT_MAP_LEN,
  PPU_SNAPSHOT_OAM_LEN,
  PPU_SNAPSHOT_REG_OFF,
  PPU_SNAPSHOT_TOTAL,
  PPU_SNAPSHOT_OFFSET_TILE_START,
  PPU_SNAPSHOT_OFFSET_MAP0,
  PPU_SNAPSHOT_OFFSET_MAP1,
  PPU_SNAPSHOT_OFFSET_OAM,
  PPU_SNAPSHOT_REG_OFFSET_SCX,
  PPU_SNAPSHOT_REG_OFFSET_SCY,
  PPU_SNAPSHOT_REG_OFFSET_WX,
  PPU_SNAPSHOT_REG_OFFSET_WY,
  PPU_SNAPSHOT_REG_OFFSET_LCDC,
  PPU_SNAPSHOT_REG_OFFSET_BGP,
  PPU_SNAPSHOT_REG_OFFSET_OBP0,
  PPU_SNAPSHOT_REG_OFFSET_OBP1,
} from '../ppuSnapshotConstants';
import { getImageDataFromGraphicsFrameBuffer } from '../graphics/worker/imageData';

function getEventData(event) {
  if (event.data) return event.data;
  return event;
}

/**
 * Create a mock worker that handles lib-worker message types synchronously
 * using the given WASM instance and byte memory.
 * @param {{ instance: { exports: Record<string, unknown> }, byteMemory: Uint8Array }} wasm
 * @param {{ onFrame?: (imageData: Uint8ClampedArray) => void }} callbacks
 * @returns {{ worker: { postMessage: Function, postMessageIgnoreResponse: Function, addMessageListener: Function, removeMessageListener: Function }, libState: object }}
 */
export function createMainThreadWorker(wasm, callbacks = {}) {
  const { instance, byteMemory } = wasm;
  const ex = instance.exports;
  const libState = {
    wasmInstance: instance,
    wasmByteMemory: byteMemory,
    options: undefined,
    paused: true,
    frameLocation: ex.FRAME_LOCATION ? ex.FRAME_LOCATION.valueOf() : 0,
    frameSize: ex.FRAME_SIZE ? ex.FRAME_SIZE.valueOf() : 0,
  };

  const messageListeners = [];
  let resolvePending = null;
  let pendingMessageId = null;

  function postMessageSync(msg) {
    const eventData = getEventData(msg);
    const messageId = eventData.messageId;
    const type = eventData.message && eventData.message.type;
    let response = { messageId, message: {} };

    switch (type) {
      case WORKER_MESSAGE_TYPE.INSTANTIATE_WASM: {
        response.message = { type: 'wasm' };
        break;
      }
      case WORKER_MESSAGE_TYPE.CONFIG: {
        const config = eventData.message.config;
        const options = eventData.message.options;
        if (config && config.length >= 2) {
          ex.config.apply(null, config);
        }
        libState.options = options;
        break;
      }
      case WORKER_MESSAGE_TYPE.RESET_AUDIO_QUEUE: {
        if (typeof ex.clearAudioBuffer === 'function') ex.clearAudioBuffer();
        break;
      }
      case WORKER_MESSAGE_TYPE.PLAY: {
        libState.paused = false;
        break;
      }
      case WORKER_MESSAGE_TYPE.PAUSE: {
        libState.paused = true;
        break;
      }
      case WORKER_MESSAGE_TYPE.GET_WASM_CONSTANT: {
        const name = eventData.message.constant;
        try {
          if (ex[name] !== undefined) {
            response.message = { type: WORKER_MESSAGE_TYPE.GET_WASM_CONSTANT, response: ex[name].valueOf() };
          } else {
            response.message = {
              type: WORKER_MESSAGE_TYPE.GET_WASM_CONSTANT,
              error: true,
              code: 'CONSTANT_NOT_FOUND',
              constant: name,
            };
          }
        } catch (e) {
          response.message = {
            type: WORKER_MESSAGE_TYPE.GET_WASM_CONSTANT,
            error: true,
            code: 'CONSTANT_READ_ERROR',
            constant: name,
          };
        }
        break;
      }
      case WORKER_MESSAGE_TYPE.GET_WASM_MEMORY_SECTION: {
        let start = eventData.message.start || 0;
        let end = byteMemory.length;
        if (eventData.message.end != null) end = eventData.message.end;
        const slice = byteMemory.slice(start, end).buffer;
        response.message = { type: WORKER_MESSAGE_TYPE.RUN_WASM_EXPORT, response: slice };
        break;
      }
      case WORKER_MESSAGE_TYPE.SET_WASM_MEMORY_SECTION: {
        const start = typeof eventData.message.start === 'number' ? eventData.message.start : 0;
        const payload = eventData.message.data;
        const bytes = payload instanceof Uint8Array ? payload : new Uint8Array(payload || []);
        if (bytes.length) byteMemory.set(bytes, start);
        response.message = { type: WORKER_MESSAGE_TYPE.SET_WASM_MEMORY_SECTION, response: true };
        break;
      }
      case WORKER_MESSAGE_TYPE.RUN_WASM_EXPORT: {
        const exportKey = eventData.message.export;
        const parameters = eventData.message.parameters || [];
        try {
          const result = parameters.length ? ex[exportKey].apply(null, parameters) : ex[exportKey]();
          response.message = { type: WORKER_MESSAGE_TYPE.RUN_WASM_EXPORT, response: result };
        } catch (e) {
          response.message = { type: WORKER_MESSAGE_TYPE.RUN_WASM_EXPORT, response: undefined };
        }
        break;
      }
      case WORKER_MESSAGE_TYPE.GET_PPU_SNAPSHOT: {
        const base = ex.GAMEBOY_INTERNAL_MEMORY_LOCATION.valueOf();
        const out = new Uint8Array(PPU_SNAPSHOT_TOTAL);
        const tileStart = base + PPU_SNAPSHOT_OFFSET_TILE_START;
        const map0Start = base + PPU_SNAPSHOT_OFFSET_MAP0;
        const map1Start = base + PPU_SNAPSHOT_OFFSET_MAP1;
        const oamStart = base + PPU_SNAPSHOT_OFFSET_OAM;
        for (let i = 0; i < PPU_SNAPSHOT_TILE_LEN; i++) out[i] = byteMemory[tileStart + i];
        for (let i = 0; i < PPU_SNAPSHOT_MAP_LEN; i++) out[PPU_SNAPSHOT_TILE_LEN + i] = byteMemory[map0Start + i];
        for (let i = 0; i < PPU_SNAPSHOT_MAP_LEN; i++) out[PPU_SNAPSHOT_TILE_LEN + PPU_SNAPSHOT_MAP_LEN + i] = byteMemory[map1Start + i];
        for (let i = 0; i < PPU_SNAPSHOT_OAM_LEN; i++) out[PPU_SNAPSHOT_TILE_LEN + PPU_SNAPSHOT_MAP_LEN * 2 + i] = byteMemory[oamStart + i];
        out[PPU_SNAPSHOT_REG_OFF + 0] = byteMemory[base + PPU_SNAPSHOT_REG_OFFSET_SCX];
        out[PPU_SNAPSHOT_REG_OFF + 1] = byteMemory[base + PPU_SNAPSHOT_REG_OFFSET_SCY];
        out[PPU_SNAPSHOT_REG_OFF + 2] = byteMemory[base + PPU_SNAPSHOT_REG_OFFSET_WX];
        out[PPU_SNAPSHOT_REG_OFF + 3] = byteMemory[base + PPU_SNAPSHOT_REG_OFFSET_WY];
        out[PPU_SNAPSHOT_REG_OFF + 4] = byteMemory[base + PPU_SNAPSHOT_REG_OFFSET_LCDC];
        out[PPU_SNAPSHOT_REG_OFF + 5] = byteMemory[base + PPU_SNAPSHOT_REG_OFFSET_BGP];
        out[PPU_SNAPSHOT_REG_OFF + 6] = byteMemory[base + PPU_SNAPSHOT_REG_OFFSET_OBP0];
        out[PPU_SNAPSHOT_REG_OFF + 7] = byteMemory[base + PPU_SNAPSHOT_REG_OFFSET_OBP1];
        response.message = { type: WORKER_MESSAGE_TYPE.GET_PPU_SNAPSHOT, response: out.buffer };
        break;
      }
      case WORKER_MESSAGE_TYPE.FORCE_OUTPUT_FRAME: {
        if (callbacks.onFrame && libState.frameSize) {
          const frameSlice = byteMemory.slice(libState.frameLocation, libState.frameLocation + libState.frameSize);
          const imageData = getImageDataFromGraphicsFrameBuffer(frameSlice);
          if (imageData) callbacks.onFrame(imageData);
        }
        break;
      }
      case WORKER_MESSAGE_TYPE.SET_SPEED: {
        libState.speed = eventData.message.speed;
        if (typeof ex.clearAudioBuffer === 'function') ex.clearAudioBuffer();
        break;
      }
      case WORKER_MESSAGE_TYPE.IS_GBC: {
        const isGbc = typeof ex.isGBC === 'function' ? ex.isGBC() > 0 : false;
        response.message = { type: WORKER_MESSAGE_TYPE.IS_GBC, response: isGbc };
        break;
      }
      case WORKER_MESSAGE_TYPE.CONTINUE_AFTER_BREAKPOINT: {
        break;
      }
      default: {
        response.message = {
          error: true,
          code: 'UNSUPPORTED_MESSAGE_TYPE',
          messageType: type,
        };
      }
    }

    if (pendingMessageId === messageId && resolvePending) {
      resolvePending(response);
      resolvePending = null;
      pendingMessageId = null;
    }
  }

  const worker = {
    postMessage(msg, _transfer, _timeout) {
      const messageObject = msg && msg.messageId ? msg : getSmartWorkerMessage(msg);
      pendingMessageId = messageObject.messageId;
      return new Promise(resolve => {
        resolvePending = resolve;
        postMessageSync(messageObject);
      });
    },
    postMessageIgnoreResponse(message) {
      const messageObject = getSmartWorkerMessage(message);
      postMessageSync(messageObject);
    },
    addMessageListener(callback) {
      const id = Math.random()
        .toString(36)
        .slice(2);
      messageListeners.push({ id, callback, messageId: null });
      return id;
    },
    removeMessageListener() {},
  };

  return { worker, libState };
}
