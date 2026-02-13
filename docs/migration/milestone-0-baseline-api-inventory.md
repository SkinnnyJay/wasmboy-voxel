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

## 0.4 Worker entry points and message schemas

### Worker entry points

Configured in `lib/worker/instantiate.js`:

- **Lib worker**: `lib/wasmboy/worker/wasmboy.worker.js`
- **Graphics worker**: `lib/graphics/worker/graphics.worker.js`
- **Audio worker**: `lib/audio/worker/audio.worker.js`
- **Controller worker**: `lib/controller/worker/controller.worker.js`
- **Memory worker**: `lib/memory/worker/memory.worker.js`

Shared enums:
- `WORKER_MESSAGE_TYPE`
- `WORKER_ID`
- `MEMORY_TYPE`

All are defined in `lib/worker/constants.js`.

### Lib worker (`wasmboy.worker.js`) message schema

Inbound message types handled by lib worker:
- `CONNECT`
- `INSTANTIATE_WASM`
- `CONFIG`
- `RESET_AUDIO_QUEUE`
- `PLAY`
- `PAUSE`
- `CONTINUE_AFTER_BREAKPOINT`
- `RUN_WASM_EXPORT` (`{ export: string, parameters?: number[] }`)
- `GET_WASM_MEMORY_SECTION` (`{ start?: number, end?: number }`)
- `SET_WASM_MEMORY_SECTION` (`{ start?: number, data: Uint8Array | ArrayBuffer }`)
- `GET_WASM_CONSTANT` (`{ constant: string }`)
- `GET_PPU_SNAPSHOT`
- `FORCE_OUTPUT_FRAME`
- `SET_SPEED` (`{ speed: number }`)
- `IS_GBC`

Representative response payload shapes:
- `RUN_WASM_EXPORT` → `{ type: RUN_WASM_EXPORT, response: number }`
- `GET_WASM_MEMORY_SECTION` → `{ type: RUN_WASM_EXPORT, response: ArrayBuffer }`
- `SET_WASM_MEMORY_SECTION` → `{ type: SET_WASM_MEMORY_SECTION, response: boolean }`
- `GET_WASM_CONSTANT` success → `{ type: GET_WASM_CONSTANT, response: number }`
- `GET_WASM_CONSTANT` error → `{ type: GET_WASM_CONSTANT, error: true, code: string, constant: string }`
- `GET_PPU_SNAPSHOT` → `{ type: GET_PPU_SNAPSHOT, response: ArrayBuffer | null }`
- `IS_GBC` → `{ type: IS_GBC, response: boolean }`
- Breakpoint events emitted asynchronously: `{ type: BREAKPOINT, breakpoint: { id, address, access, firedAtMs } }`
- Crash event emitted asynchronously: `{ type: CRASHED }`

### Graphics worker message schema

Main-thread input:
- `CONNECT`
- `GET_CONSTANTS`

From lib worker port:
- `GET_CONSTANTS_DONE` (forwarded back)
- `UPDATED` (`graphicsFrameBuffer` transfer), converted and returned as:
  - `{ type: UPDATED, imageDataArrayBuffer: ArrayBuffer }`

### Audio worker message schema

Main-thread input:
- `CONNECT`
- `GET_CONSTANTS`
- `AUDIO_LATENCY`

From lib worker port:
- `GET_CONSTANTS_DONE` (forwarded back)
- `UPDATED` with audio transfer buffers (`audioBuffer`, optional `channel1Buffer`..`channel4Buffer`), converted and returned as:
  - `{ type: UPDATED, numberOfSamples, fps, allowFastSpeedStretching, audioBuffer?: { left, right }, channel1Buffer?: { left, right }, ... }`

### Controller worker message schema

Main-thread input:
- `CONNECT`
- `SET_JOYPAD_STATE`

Behavior:
- Forwards `SET_JOYPAD_STATE` to lib worker port unchanged.

### Memory worker message schema

Main-thread input:
- `CONNECT`
- `CLEAR_MEMORY`
- `GET_CONSTANTS`
- `GET_MEMORY` (`{ memoryTypes: MEMORY_TYPE[] }`)
- `SET_MEMORY` (`{ [MEMORY_TYPE.*]: ArrayBuffer }`)

From lib worker port to memory worker:
- `CLEAR_MEMORY_DONE`
- `GET_CONSTANTS_DONE`
- `SET_MEMORY_DONE`
- `GET_MEMORY`
- `UPDATED`

Memory worker response/forwarding behavior:
- Passes through all memory buffers as transferables.
- `CLEAR_MEMORY_DONE` includes `{ wasmByteMemory: ArrayBuffer }`.
- `GET_MEMORY` and `UPDATED` include memory buffers keyed by `MEMORY_TYPE`.

