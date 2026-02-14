// Handles rendering graphics using the HTML5 Canvas

import { WasmBoyPlugins } from '../plugins/plugins';

import { GAMEBOY_CAMERA_WIDTH, GAMEBOY_CAMERA_HEIGHT } from './constants';

import { WORKER_MESSAGE_TYPE } from '../worker/constants';
import { getEventData } from '../worker/util';

// Performance tips with canvas:
// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas

class WasmBoyGraphicsService {
  constructor() {
    this.worker = undefined;
    this.updateGraphicsCallback = undefined;

    this.frameQueue = undefined;
    this.frameQueueRenderPromise = undefined;

    this.canvasElement = undefined;
    this.canvasContext = undefined;
    this.canvasImageData = undefined;
    this.imageDataArray = undefined;
    this.imageDataArrayChanged = false;
  }

  initialize(canvasElement, updateGraphicsCallback) {
    this.updateGraphicsCallback = updateGraphicsCallback;

    // Reset our frame queue and render promises
    this.frameQueue = [];

    const initializeTask = async () => {
      const headless = !canvasElement;

      if (headless) {
        this.canvasElement = undefined;
        this.canvasContext = undefined;
        this.canvasImageData = undefined;
      } else {
        // Prepare our canvas
        this.canvasElement = canvasElement;
        this.canvasContext = this.canvasElement.getContext('2d');
        this.canvasElement.width = GAMEBOY_CAMERA_WIDTH;
        this.canvasElement.height = GAMEBOY_CAMERA_HEIGHT;
        this.canvasImageData = this.canvasContext.createImageData(this.canvasElement.width, this.canvasElement.height);

        // Add some css for smooth 8-bit canvas scaling
        // https://stackoverflow.com/questions/7615009/disable-interpolation-when-scaling-a-canvas
        // https://caniuse.com/#feat=css-crisp-edges
        this.canvasElement.style = `
        image-rendering: optimizeSpeed;
        image-rendering: -moz-crisp-edges;
        image-rendering: -webkit-optimize-contrast;
        image-rendering: -o-crisp-edges;
        image-rendering: pixelated;
        -ms-interpolation-mode: nearest-neighbor;
      `;

        // Fill the canvas with a blank screen
        this.canvasContext.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

        WasmBoyPlugins.runHook({
          key: 'canvas',
          params: [this.canvasElement, this.canvasContext, this.canvasImageData],
          callback: response => {
            if (!response) {
              return;
            }

            if (response.canvasElement) {
              this.canvasElement = response.canvasElement;
            }

            if (response.canvasContext) {
              this.canvasContext = response.canvasContext;
            }

            if (response.canvasImageData) {
              this.canvasImageData = response.canvasImageData;
            }
          },
        });
      }

      // Set frame constants on the lib worker (required for headless frame transfer)
      if (this.worker) {
        await this.worker.postMessage({
          type: WORKER_MESSAGE_TYPE.GET_CONSTANTS,
        });
      }
    };

    return initializeTask();
  }

  // Function to set our worker
  setWorker(worker) {
    this.worker = worker;
    this.worker.addMessageListener(event => {
      const eventData = getEventData(event);

      switch (eventData.message.type) {
        case WORKER_MESSAGE_TYPE.UPDATED: {
          const buf = eventData.message.imageDataArrayBuffer;
          if (this.imageDataArray && this.imageDataArray.byteLength === buf.byteLength) {
            this.imageDataArray.set(new Uint8ClampedArray(buf));
          } else {
            this.imageDataArray = new Uint8ClampedArray(buf);
          }
          this.imageDataArrayChanged = true;
          // Headless: no canvas, deliver frame to callback immediately
          if (!this.canvasElement && this.updateGraphicsCallback && this.imageDataArray) {
            this.updateGraphicsCallback(this.imageDataArray.slice(0));
          }
          return;
        }
      }
    });
  }

  // Function to render a frame
  // Will add the frame to the frame queue to be rendered
  // Returns the promise from this.drawFrameQueue
  // Which resolves once all frames are rendered
  renderFrame() {
    // Check if we have new graphics to show
    if (!this.imageDataArrayChanged) {
      return;
    }
    this.imageDataArrayChanged = false;

    // Headless: no canvas, only invoke callback and return
    if (!this.canvasElement || !this.canvasContext) {
      if (this.updateGraphicsCallback && this.imageDataArray) {
        this.updateGraphicsCallback(this.imageDataArray);
      }
      return;
    }

    // Check for a callback for accessing image data
    if (this.updateGraphicsCallback) {
      this.updateGraphicsCallback(this.imageDataArray);
    }

    // Set the imageDataArray to our plugins
    WasmBoyPlugins.runHook({
      key: 'graphics',
      params: [this.imageDataArray],
      callback: response => {
        if (response) {
          this.imageDataArray = response;
        }
      },
    });

    // Add our new imageData
    this.canvasImageData.data.set(this.imageDataArray);

    this.canvasContext.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    this.canvasContext.putImageData(this.canvasImageData, 0, 0);
  }
}

export const WasmBoyGraphics = new WasmBoyGraphicsService();
