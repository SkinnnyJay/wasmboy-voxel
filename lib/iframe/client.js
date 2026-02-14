/**
 * Parent-side client for the iframe emulator port.
 * Use when the emulator runs inside an iframe and the parent communicates via postMessage.
 * @see docs/IFRAME_PORT_API.md
 */

import { IFRAME_MESSAGE_TYPE } from './constants.js';

const DEFAULT_TIMEOUT_MS = 10000;

/**
 * @typedef {Object} CPURegistersResponse
 * @property {number} a
 * @property {number} b
 * @property {number} c
 * @property {number} d
 * @property {number} e
 * @property {number} f
 * @property {number} h
 * @property {number} l
 * @property {number} pc
 * @property {number} sp
 * @property {number} opcode
 */

/**
 * @typedef {Object} TimerStateResponse
 * @property {number} div
 * @property {number} tima
 * @property {number} tma
 * @property {number} tac
 * @property {boolean} enabled
 */

/**
 * @typedef {Object} LCDStateResponse
 * @property {number} ly
 * @property {number} lcdc
 * @property {number} stat
 * @property {number} scrollX
 * @property {number} scrollY
 * @property {number} windowX
 * @property {number} windowY
 */

/**
 * @param {Window} iframeContentWindow - contentWindow of the iframe running the emulator
 * @param {string} [targetOrigin='*'] - target origin for postMessage
 * @returns {{ request: (type: string, payload?: object, timeoutMs?: number) => Promise<unknown> }}
 */
export function createIframeEmulatorClient(iframeContentWindow, targetOrigin = '*') {
  let messageIdCounter = 0;

  /**
   * @param {string} type - IFRAME_MESSAGE_TYPE value (emulator:*)
   * @param {object} [payload] - optional payload
   * @param {number} [timeoutMs] - timeout in ms (default 10000)
   * @returns {Promise<unknown>}
   */
  function request(type, payload, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const messageId = `${Date.now()}-${++messageIdCounter}-${Math.random()
      .toString(36)
      .slice(2)}`;
    return new Promise((resolve, reject) => {
      const timeoutId =
        timeoutMs > 0
          ? setTimeout(() => {
              window.removeEventListener('message', listener);
              reject(
                Object.assign(new Error('iframe emulator request timed out'), {
                  code: 'TIMEOUT',
                  messageId,
                }),
              );
            }, timeoutMs)
          : null;

      function listener(event) {
        const d = event.data;
        if (!d || d.type !== IFRAME_MESSAGE_TYPE.RESPONSE || d.messageId !== messageId) return;
        window.removeEventListener('message', listener);
        if (timeoutId != null) clearTimeout(timeoutId);
        if (d.error != null) {
          reject(new Error(String(d.error)));
          return;
        }
        resolve(d.response);
      }

      window.addEventListener('message', listener);
      iframeContentWindow.postMessage(payload != null ? { type, messageId, payload } : { type, messageId }, targetOrigin);
    });
  }

  return {
    request,

    /**
     * @param {{ address: number, access: 'read'|'write' }} payload
     * @param {number} [timeoutMs]
     * @returns {Promise<{ id: string }>}
     */
    setMemoryBreakpoint(payload, timeoutMs) {
      return request(IFRAME_MESSAGE_TYPE.SET_MEMORY_BREAKPOINT, payload, timeoutMs);
    },

    /**
     * @param {{ id: string }} payload
     * @param {number} [timeoutMs]
     * @returns {Promise<void>}
     */
    clearMemoryBreakpoint(payload, timeoutMs) {
      return request(IFRAME_MESSAGE_TYPE.CLEAR_MEMORY_BREAKPOINT, payload, timeoutMs);
    },

    /**
     * @param {number} [timeoutMs]
     * @returns {Promise<void>}
     */
    clearAllMemoryBreakpoints(timeoutMs) {
      return request(IFRAME_MESSAGE_TYPE.CLEAR_ALL_MEMORY_BREAKPOINTS, undefined, timeoutMs);
    },

    /**
     * @param {number} [timeoutMs]
     * @returns {Promise<CPURegistersResponse|null>}
     */
    getCPURegisters(timeoutMs) {
      return request(IFRAME_MESSAGE_TYPE.GET_CPU_REGISTERS, undefined, timeoutMs);
    },

    /**
     * @param {number} [timeoutMs]
     * @returns {Promise<TimerStateResponse|null>}
     */
    getTimerState(timeoutMs) {
      return request(IFRAME_MESSAGE_TYPE.GET_TIMER_STATE, undefined, timeoutMs);
    },

    /**
     * @param {number} [timeoutMs]
     * @returns {Promise<LCDStateResponse|null>}
     */
    getLCDState(timeoutMs) {
      return request(IFRAME_MESSAGE_TYPE.GET_LCD_STATE, undefined, timeoutMs);
    },

    /**
     * @param {number} [timeoutMs]
     * @returns {Promise<Array<[number,number,number,number]>|null>}
     */
    getScanlineParameters(timeoutMs) {
      return request(IFRAME_MESSAGE_TYPE.GET_SCANLINE_PARAMETERS, undefined, timeoutMs);
    },

    /**
     * @param {number} [timeoutMs]
     * @returns {Promise<ImageData|null>}
     */
    async getBackgroundMapImage(timeoutMs) {
      const response = await request(IFRAME_MESSAGE_TYPE.GET_BACKGROUND_MAP_IMAGE, undefined, timeoutMs);
      return imageDataFromResponse(response);
    },

    /**
     * @param {number} [timeoutMs]
     * @returns {Promise<ImageData|null>}
     */
    async getTileDataImage(timeoutMs) {
      const response = await request(IFRAME_MESSAGE_TYPE.GET_TILE_DATA_IMAGE, undefined, timeoutMs);
      return imageDataFromResponse(response);
    },

    /**
     * @param {number} [timeoutMs]
     * @returns {Promise<ImageData|null>}
     */
    async getOamSpritesImage(timeoutMs) {
      const response = await request(IFRAME_MESSAGE_TYPE.GET_OAM_SPRITES_IMAGE, undefined, timeoutMs);
      return imageDataFromResponse(response);
    },
  };
}

/**
 * @param {{ width: number, height: number, data: ArrayBuffer } | null} response
 * @returns {ImageData|null}
 */
function imageDataFromResponse(response) {
  if (response == null || !response.data || typeof response.width !== 'number' || typeof response.height !== 'number') {
    return null;
  }
  if (typeof ImageData === 'undefined') {
    return null;
  }
  return new ImageData(new Uint8ClampedArray(response.data), response.width, response.height);
}
