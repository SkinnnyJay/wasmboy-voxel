# Milestone 0 Baseline: Public API Inventory

This document captures the current public API surface before migration work.
It is used as the baseline for compatibility checks.

## 0.1 `index.ts` public exports

### Re-exported types from `fork-api-spec.ts`
- `DirectMemoryAccess`
- `DirtyTileBitfield`
- `GbcBgPalette`
- `GbcObjPalette`
- `JoypadTraceConfig`
- `JoypadTraceEntry`
- `VramBankState`

### Re-exported values/types from `voxel-wrapper.ts`
- value: `WasmBoy`
- type: `WasmBoyApi`
- type: `WasmBoyConfig`
- type: `GetPpuSnapshotLayersOptions`
- type: `PpuSnapshotLayer`
- type: `SnapshotErrorEventHandler`
- type: `SnapshotEventHandler`
- type: `WasmBoyJoypadState`
- type: `WasmBoyPpuSnapshot`
- type: `WasmBoyVoxelApi`

## 0.2 `voxel-wrapper.ts` public exports

### Public types/interfaces
- type: `WasmBoyConfig`
- type: `WasmBoyJoypadState`
- interface: `WasmBoyPpuSnapshot`
- type: `PpuSnapshotLayer`
- interface: `GetPpuSnapshotLayersOptions`
- type: `SnapshotEventHandler`
- type: `SnapshotErrorEventHandler`
- interface: `WasmBoyVoxelApi`
- type: `WasmBoyApi`

### Public value exports
- const: `WasmBoy` (typed as `WasmBoyVoxelApi`)

## 0.3 `lib/` entry-point public API (`lib/index.js`)

`lib/index.js` exports a singleton object `WasmBoy` with the following keys:

### Core lifecycle/config
- `config`
- `getCoreType`
- `getConfig`
- `setCanvas`
- `getCanvas`
- `loadROM`
- `play`
- `pause`
- `reset`
- `isPlaying`
- `isPaused`
- `isReady`
- `whenReady`
- `whenPlaying`
- `whenPaused`
- `isLoadedAndStarted`
- `getVersion`
- `setSpeed`
- `getFPS`
- `isGBC`

### Boot ROM / persistence
- `addBootROM`
- `getBootROMs`
- `getSavedMemory`
- `saveLoadedCartridge`
- `deleteSavedCartridge`
- `saveState`
- `getSaveStates`
- `loadState`
- `deleteState`

### Plugins / input / audio
- `addPlugin`
- `ResponsiveGamepad`
- `enableDefaultJoypad`
- `disableDefaultJoypad`
- `setJoypadState`
- `resumeAudioContext`

### Memory APIs (public)
- `getWRAM`
- `setWRAM`
- `getWorkRAM`
- `setWorkRAM`
- `writeRAM`
- `getFullMemory`
- `readMemory`

### Debug/private-prefixed APIs
- `_getAudioChannels`
- `_getCartridgeInfo`
- `_getCartridgeRam`
- `_runNumberOfFrames`
- `_runWasmExport`
- `_getWasmMemorySection`
- `_setWasmMemorySection`
- `setWasmMemorySection`
- `_getWasmConstant`
- `_getPpuSnapshotBuffer`
- `_parsePpuSnapshotBuffer`
- `_getStepsAsString`
- `_getCyclesAsString`

### Debug visualization/state APIs
- `setMemoryBreakpoint`
- `clearMemoryBreakpoint`
- `clearAllMemoryBreakpoints`
- `getBackgroundMapImage`
- `getTileDataImage`
- `getOamSpritesImage`
- `getCPURegisters`
- `getTimerState`
- `getLCDState`
- `getScanlineParameters`

