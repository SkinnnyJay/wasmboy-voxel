// Build our public lib api
import { WasmBoyLib } from './wasmboy/wasmboy';
import { WasmBoyPlugins } from './plugins/plugins';
import { WasmBoyAudio } from './audio/audio';
import { WasmBoyController } from './controller/controller';
import { WasmBoyMemory } from './memory/memory';
import {
  runNumberOfFrames,
  runWasmExport,
  getWasmMemorySection,
  setWasmMemorySection,
  getWasmConstant,
  getPpuSnapshotBuffer,
  parsePpuSnapshotBuffer,
  getStepsAsString,
  getCyclesAsString,
  setMemoryBreakpoint,
  clearMemoryBreakpoint,
  clearAllMemoryBreakpoints,
  getBackgroundMapImage,
  getTileDataImage,
  getOamSpritesImage,
  getCPURegisters,
  getTimerState,
  getLCDState,
  getScanlineParameters
} from './debug/debug';

// Get our package.json
import packageJson from '../package.json';

// Debugging properties prepended with _

// export an object that public exposes parts of the singleton
// Need to bind to preserve this
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Function/bind
export const WasmBoy = {
  config: WasmBoyLib.config.bind(WasmBoyLib),
  getCoreType: WasmBoyLib.getCoreType.bind(WasmBoyLib),
  getConfig: WasmBoyLib.getConfig.bind(WasmBoyLib),
  setCanvas: WasmBoyLib.setCanvas.bind(WasmBoyLib),
  getCanvas: WasmBoyLib.getCanvas.bind(WasmBoyLib),
  addBootROM: WasmBoyLib.addBootROM.bind(WasmBoyLib),
  getBootROMs: WasmBoyLib.getBootROMs.bind(WasmBoyLib),
  loadROM: WasmBoyLib.loadROM.bind(WasmBoyLib),
  play: WasmBoyLib.play.bind(WasmBoyLib),
  pause: WasmBoyLib.pause.bind(WasmBoyLib),
  reset: WasmBoyLib.reset.bind(WasmBoyLib),
  addPlugin: WasmBoyPlugins.addPlugin.bind(WasmBoyPlugins),
  isPlaying: () => {
    return !WasmBoyLib.paused;
  },
  isPaused: () => {
    return WasmBoyLib.paused;
  },
  isReady: () => {
    return WasmBoyLib.ready;
  },
  whenReady: WasmBoyLib.whenReady.bind(WasmBoyLib),
  whenPlaying: WasmBoyLib.whenPlaying.bind(WasmBoyLib),
  whenPaused: WasmBoyLib.whenPaused.bind(WasmBoyLib),
  isLoadedAndStarted: () => {
    return WasmBoyLib.loadedAndStarted;
  },
  getVersion: () => {
    return packageJson.version;
  },
  getSavedMemory: WasmBoyLib.getSavedMemory.bind(WasmBoyLib),
  saveLoadedCartridge: WasmBoyLib.saveLoadedCartridge.bind(WasmBoyLib),
  deleteSavedCartridge: WasmBoyLib.deleteSavedCartridge.bind(WasmBoyLib),
  saveState: WasmBoyLib.saveState.bind(WasmBoyLib),
  getSaveStates: WasmBoyLib.getSaveStates.bind(WasmBoyLib),
  loadState: WasmBoyLib.loadState.bind(WasmBoyLib),
  deleteState: WasmBoyLib.deleteState.bind(WasmBoyLib),
  getFPS: WasmBoyLib.getFPS.bind(WasmBoyLib),
  setSpeed: WasmBoyLib.setSpeed.bind(WasmBoyLib),
  isGBC: WasmBoyLib.isGBC.bind(WasmBoyLib),
  ResponsiveGamepad: WasmBoyController.ResponsiveGamepad,
  enableDefaultJoypad: WasmBoyController.enableDefaultJoypad.bind(WasmBoyController),
  disableDefaultJoypad: WasmBoyController.disableDefaultJoypad.bind(WasmBoyController),
  setJoypadState: WasmBoyController.setJoypadState.bind(WasmBoyController),
  resumeAudioContext: WasmBoyAudio.resumeAudioContext.bind(WasmBoyAudio),
  _getAudioChannels: WasmBoyAudio.getAudioChannels.bind(WasmBoyAudio),
  _getCartridgeInfo: WasmBoyMemory.getCartridgeInfo.bind(WasmBoyMemory),
  _getCartridgeRam: WasmBoyMemory.getCartridgeRam.bind(WasmBoyMemory),
  getWRAM: WasmBoyMemory.getWRAM.bind(WasmBoyMemory),
  setWRAM: WasmBoyMemory.setWRAM.bind(WasmBoyMemory),
  getWorkRAM: WasmBoyMemory.getWorkRAM.bind(WasmBoyMemory),
  setWorkRAM: WasmBoyMemory.setWorkRAM.bind(WasmBoyMemory),
  writeRAM: WasmBoyMemory.writeRAM.bind(WasmBoyMemory),
  getFullMemory: WasmBoyMemory.getFullMemory.bind(WasmBoyMemory),
  readMemory: WasmBoyMemory.readMemory.bind(WasmBoyMemory),
  _runNumberOfFrames: runNumberOfFrames,
  _runWasmExport: runWasmExport,
  _getWasmMemorySection: getWasmMemorySection,
  _setWasmMemorySection: setWasmMemorySection,
  setWasmMemorySection: setWasmMemorySection,
  _getWasmConstant: getWasmConstant,
  _getPpuSnapshotBuffer: getPpuSnapshotBuffer,
  _parsePpuSnapshotBuffer: parsePpuSnapshotBuffer,
  _getStepsAsString: getStepsAsString,
  _getCyclesAsString: getCyclesAsString,
  setMemoryBreakpoint,
  clearMemoryBreakpoint,
  clearAllMemoryBreakpoints,
  getBackgroundMapImage,
  getTileDataImage,
  getOamSpritesImage,
  getCPURegisters,
  getTimerState,
  getLCDState,
  getScanlineParameters
};
