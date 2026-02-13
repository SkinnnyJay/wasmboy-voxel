// https://github.com/torch2424/responsive-gamepad
import { ResponsiveGamepad } from 'responsive-gamepad';

import ResponsiveGamepadPluginGB from './gbplugin';

import { WORKER_MESSAGE_TYPE } from '../worker/constants';
import { getEventData } from '../worker/util';

class WasmBoyControllerService {
  constructor() {
    // Our wasm instance
    this.worker = undefined;
    this.isEnabled = false;

    // Bind Repsonsive Gamepad to this
    this.ResponsiveGamepad = ResponsiveGamepad;

    ResponsiveGamepad.addPlugin(ResponsiveGamepadPluginGB());

    this.keyboardState = {
      UP: false,
      RIGHT: false,
      DOWN: false,
      LEFT: false,
      A: false,
      B: false,
      SELECT: false,
      START: false
    };
    this.keyboardLatch = {
      UP: false,
      RIGHT: false,
      DOWN: false,
      LEFT: false,
      A: false,
      B: false,
      SELECT: false,
      START: false
    };
    this.keyboardEnabled = false;
    this.keyboardListenerAttached = false;
  }

  initialize() {
    if (!this.isEnabled) {
      this.enableDefaultJoypad();
    }

    this._initializeKeyboard();

    return Promise.resolve();
  }

  setWorker(worker) {
    this.worker = worker;
  }

  updateController() {
    if (!this.isEnabled) {
      return {};
    }

    // Create an abstracted controller state
    const controllerState = ResponsiveGamepad.getState();

    const mergedState = controllerState
      ? { ...controllerState }
      : {
          UP: false,
          RIGHT: false,
          DOWN: false,
          LEFT: false,
          A: false,
          B: false,
          SELECT: false,
          START: false
        };

    if (this.keyboardEnabled) {
      Object.keys(this.keyboardState).forEach(key => {
        if (this.keyboardState[key] || this.keyboardLatch[key]) {
          mergedState[key] = true;
        }
      });
    }

    // Set the new controller state on the instance
    this.setJoypadState(mergedState);

    if (this.keyboardEnabled) {
      Object.keys(this.keyboardLatch).forEach(key => {
        if (!this.keyboardState[key]) {
          this.keyboardLatch[key] = false;
        }
      });
    }

    return mergedState;
  }

  setJoypadState(controllerState) {
    const setJoypadStateParamsAsArray = [
      controllerState.UP ? 1 : 0,
      controllerState.RIGHT ? 1 : 0,
      controllerState.DOWN ? 1 : 0,
      controllerState.LEFT ? 1 : 0,
      controllerState.A ? 1 : 0,
      controllerState.B ? 1 : 0,
      controllerState.SELECT ? 1 : 0,
      controllerState.START ? 1 : 0
    ];

    this.worker.postMessageIgnoreResponse({
      type: WORKER_MESSAGE_TYPE.SET_JOYPAD_STATE,
      setJoypadStateParamsAsArray
    });
  }

  enableDefaultJoypad() {
    this.isEnabled = true;

    ResponsiveGamepad.enable();
  }

  disableDefaultJoypad() {
    this.isEnabled = false;

    ResponsiveGamepad.disable();
  }

  _initializeKeyboard() {
    if (this.keyboardListenerAttached || typeof window === 'undefined') {
      return;
    }

    const keyboardMapping = {
      ArrowUp: 'UP',
      ArrowRight: 'RIGHT',
      ArrowDown: 'DOWN',
      ArrowLeft: 'LEFT',
      KeyZ: 'A',
      KeyX: 'B',
      KeyA: 'A',
      KeyS: 'B',
      Enter: 'START',
      Space: 'START',
      ShiftLeft: 'SELECT',
      ShiftRight: 'SELECT'
    };

    const isEditableElement = element => {
      if (!element) {
        return false;
      }
      const tagName = element.tagName;
      return element.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
    };

    const handleKeyboard = (event, isPressed) => {
      if (isEditableElement(event.target)) {
        return;
      }
      const key = keyboardMapping[event.code];
      if (!key) {
        return;
      }
      this.keyboardEnabled = true;
      this.keyboardState[key] = isPressed;
      if (isPressed) {
        this.keyboardLatch[key] = true;
      }
      event.preventDefault();
    };

    window.addEventListener('keydown', event => handleKeyboard(event, true), true);
    window.addEventListener('keyup', event => handleKeyboard(event, false), true);
    this.keyboardListenerAttached = true;
  }
}

export const WasmBoyController = new WasmBoyControllerService();
