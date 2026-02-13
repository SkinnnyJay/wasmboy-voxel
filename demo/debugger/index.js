import { h, render, Component } from 'preact';

import { WasmBoy } from './wasmboy';

import devtoolsDetect from 'devtools-detect';

import phosphorWidgets from '@phosphor/widgets';

import packageJson from '../../package.json';

import './index.css';

import WidgetManager from './widgetManager';

import menus from './menus';

import { Pubx } from 'pubx';
import { PUBX_KEYS, PUBX_INITIALIZE } from './pubx.config';

import Overlay from './components/overlay/overlay';
import Mobile from './components/mobile/mobile';

// Setup from:
// https://github.com/phosphorjs/phosphor/blob/master/examples/example-dockpanel/src/index.ts

// Create our dockPanel
const dockPanel = new phosphorWidgets.DockPanel();
dockPanel.id = 'dock';

// Create our top menu bar
let menuBar = new phosphorWidgets.MenuBar();
menus.forEach(menu => {
  menuBar.addMenu(menu);
});
menuBar.id = 'menuBar';

phosphorWidgets.BoxPanel.setStretch(dockPanel, 1);

let main = new phosphorWidgets.BoxPanel({ direction: 'left-to-right', spacing: 0 });
main.id = 'main';
main.addWidget(dockPanel);

// Initialize Pubx for State Management
PUBX_INITIALIZE();

// Set up our Widget Manager
const widgetManager = new WidgetManager(dockPanel);
Pubx.publish(PUBX_KEYS.WIDGET, {
  widgetManager
});

// Bind phosphor to DOM
const phosphorContainer = document.getElementById('phosphor-container');
phosphorWidgets.Widget.attach(menuBar, phosphorContainer);
phosphorWidgets.Widget.attach(main, phosphorContainer);

// Bind Preact Overlay to DOM
const overlayContainer = document.getElementById('overlay-container');
render(<Overlay />, overlayContainer);

// Bind the Mobile UI to DOM
const mobileContainer = document.getElementById('mobile-container');
render(<Mobile />, mobileContainer);
Pubx.get(PUBX_KEYS.MOBILE).update();

// Show a nice welcome message
setTimeout(() => {
  Pubx.get(PUBX_KEYS.NOTIFICATION).showNotification('Welcome to the WasmBoy Debugger/Demo!');
}, 100);

// Add some hotkeys
let quickSpeed = false;
WasmBoy.ResponsiveGamepad.onInputsChange(
  [
    WasmBoy.ResponsiveGamepad.RESPONSIVE_GAMEPAD_INPUTS.LEFT_TRIGGER,
    WasmBoy.ResponsiveGamepad.RESPONSIVE_GAMEPAD_INPUTS.RIGHT_TRIGGER,
    WasmBoy.ResponsiveGamepad.RESPONSIVE_GAMEPAD_INPUTS.SPECIAL
  ],
  state => {
    // Quick Speed
    if (!quickSpeed && state.LEFT_TRIGGER) {
      WasmBoy.setSpeed(3.0);
      quickSpeed = true;
      Pubx.get(PUBX_KEYS.NOTIFICATION).showNotification('Quick Speed Hotkey! ⚡');
    } else if (quickSpeed && !state.LEFT_TRIGGER) {
      WasmBoy.setSpeed(1.0);
      quickSpeed = false;
    }

    // Play / Pause
    if (WasmBoy.isPlaying() && state.SPECIAL) {
      WasmBoy.pause();
      Pubx.get(PUBX_KEYS.NOTIFICATION).showNotification('Play/Pause Hotkey! ⏯️');
    } else if (!WasmBoy.isPlaying() && state.SPECIAL) {
      WasmBoy.play();
      Pubx.get(PUBX_KEYS.NOTIFICATION).showNotification('Play/Pause Hotkey! ⏯️');
    }
  }
);

// Keyboard fallback for joypad input (useful when ResponsiveGamepad fails)
const keyboardJoypadState = {
  UP: false,
  RIGHT: false,
  DOWN: false,
  LEFT: false,
  A: false,
  B: false,
  SELECT: false,
  START: false
};

const keyboardJoypadMapping = {
  ArrowUp: 'UP',
  ArrowRight: 'RIGHT',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  KeyZ: 'A',
  KeyX: 'B',
  KeyA: 'A',
  KeyS: 'B',
  Enter: 'START',
  ShiftLeft: 'SELECT',
  ShiftRight: 'SELECT'
};

let keyboardInputEnabled = false;

const isEditableElement = element => {
  if (!element) {
    return false;
  }

  const tagName = element.tagName;
  return element.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
};

const handleKeyboardJoypad = (event, isPressed) => {
  if (isEditableElement(event.target)) {
    return;
  }

  const joypadKey = keyboardJoypadMapping[event.code];
  if (!joypadKey) {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/7312289d-742a-4f37-8218-6c6fb94f8cc7', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId: 'pre-fix',
        hypothesisId: 'H4',
        location: 'demo/debugger/index.js:152',
        message: 'keyboard event ignored (no mapping)',
        data: { code: event.code },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion
    return;
  }

  if (!keyboardInputEnabled) {
    keyboardInputEnabled = true;
    WasmBoy.disableDefaultJoypad();
    Pubx.get(PUBX_KEYS.NOTIFICATION).showNotification('Keyboard input enabled (Arrow keys / Z / X / Enter / Shift)');
  }

  if (keyboardJoypadState[joypadKey] !== isPressed) {
    keyboardJoypadState[joypadKey] = isPressed;
    WasmBoy.setJoypadState({
      ...keyboardJoypadState
    });
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/7312289d-742a-4f37-8218-6c6fb94f8cc7', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId: 'pre-fix',
        hypothesisId: 'H4',
        location: 'demo/debugger/index.js:176',
        message: 'keyboard joypad state sent',
        data: { joypadKey, isPressed, keyboardJoypadState },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion
  }

  event.preventDefault();
};

window.addEventListener('keydown', event => handleKeyboardJoypad(event, true));
window.addEventListener('keyup', event => handleKeyboardJoypad(event, false));

// Add all of our layout events
let layoutChangeThrottle = undefined;

// devtools change for mobile
// uses devtools-detect
window.addEventListener('devtoolschange', e => {
  Pubx.get(PUBX_KEYS.MOBILE).update(e.detail.open);
  main.update();
});

window.addEventListener('resize', () => {
  if (layoutChangeThrottle) {
    return;
  }

  layoutChangeThrottle = setTimeout(() => {
    Pubx.get(PUBX_KEYS.MOBILE).update();
    main.update();
    layoutChangeThrottle = undefined;
  }, 500);
});

window.addEventListener('orientationchange', () => {
  if (layoutChangeThrottle) {
    return;
  }

  layoutChangeThrottle = setTimeout(() => {
    Pubx.get(PUBX_KEYS.MOBILE).update();
    main.update();
    layoutChangeThrottle = undefined;
  }, 500);
});
