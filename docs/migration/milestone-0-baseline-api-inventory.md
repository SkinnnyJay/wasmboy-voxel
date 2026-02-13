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

## 0.5 Snapshot field-to-memory mapping

### Primary snapshot source (`voxel-wrapper.ts` fallback path)

`getPpuSnapshot()` resolves a dynamic game-memory base using:
- `_getWasmConstant("DEBUG_GAMEBOY_MEMORY_LOCATION")`

Then reads these sections via `_getWasmMemorySection(base + start, base + end)`:

| Snapshot field | Source address range (GB memory map) | Notes |
|---|---:|---|
| `tileData` | `0x8000..0x97FF` | `TILE_DATA_START` to `TILE_DATA_END_EXCLUSIVE` |
| `bgTileMap` | `0x9800..0x9BFF` or `0x9C00..0x9FFF` | Selected by LCDC bit `0x08` |
| `windowTileMap` | `0x9800..0x9BFF` or `0x9C00..0x9FFF` | Selected by LCDC bit `0x40` |
| `oamData` | `0xFE00..0xFE9F` | OAM sprite attribute table |
| `registers.lcdc` | `0xFF40` | Also drives map select logic |
| `registers.scy` | `0xFF42` | Scroll Y |
| `registers.scx` | `0xFF43` | Scroll X |
| `registers.wy` | `0xFF4A` | Window Y |
| `registers.wx` | `0xFF4B` | Window X |
| `registers.bgp` | `0xFF47` | DMG BG palette |
| `registers.obp0` | `0xFF48` | DMG OBJ palette 0 |
| `registers.obp1` | `0xFF49` | DMG OBJ palette 1 |

### Batched snapshot source (`lib` worker fast path)

The lib worker `GET_PPU_SNAPSHOT` builds a packed buffer using:
- base: `GAMEBOY_INTERNAL_MEMORY_LOCATION`
- constants from `lib/ppuSnapshotConstants.js`

Packed layout:
- tile data (`PPU_SNAPSHOT_TILE_LEN = 0x1800`)
- map0 (`PPU_SNAPSHOT_MAP_LEN = 0x400`)
- map1 (`PPU_SNAPSHOT_MAP_LEN = 0x400`)
- oam (`PPU_SNAPSHOT_OAM_LEN = 0xA0`)
- registers at offset `PPU_SNAPSHOT_REG_OFF = 0x20A0` (8 bytes: `scx, scy, wx, wy, lcdc, bgp, obp0, obp1`)

`parsePpuSnapshotBuffer()` then:
- selects `bgTileMap` from map0/map1 using LCDC bit `0x08`
- selects `windowTileMap` from map0/map1 using LCDC bit `0x40`

### Related palette and debug constants

From `core/constants.ts` and wrapper usage:
- `GBC_PALETTE_LOCATION`, `GBC_PALETTE_SIZE` are used by `getGbcBgPalettes()` / `getGbcObjPalettes()`.
- `SCANLINE_DEBUG_BUFFER_LOCATION` is used by `getScanlineParameters()`.

## 0.6 Current null/undefined behavior baseline

### `voxel-wrapper.ts` (`WasmBoyVoxelApi`) behavior

| API | Null/undefined behavior |
|---|---|
| `supportsPpuSnapshot()` | Returns `false` if snapshot internals are missing or if retry window fails. |
| `getPpuSnapshot()` | Returns `null` when internals are unavailable or memory base cannot be resolved. |
| `getPpuSnapshotLayers()` | Returns `null` if full snapshot is `null`. |
| `getLastSnapshotDurationMs()` | Returns `null` until first successful snapshot. |
| `readMemory()` | Returns `null` when internals are unavailable, base cannot resolve, or worker read throws. |
| `getGbcBgPalettes()` / `getGbcObjPalettes()` | Return `null` if internals missing, constants invalid, or read fails. |
| `getDirectMemoryAccess().getView()` | Returns `null` in current stub implementation. |

### `lib/debug/debug.js` baseline behavior

| API | Null/undefined behavior |
|---|---|
| `runWasmExport()` | Returns `undefined` if worker is unavailable. |
| `getWasmMemorySection()` | Returns `undefined` if worker is unavailable. |
| `setWasmMemorySection()` | Returns `false` when worker is unavailable or payload invalid. |
| `getWasmConstant()` | Returns `undefined` when worker unavailable or worker responds with `error`. |
| `getPpuSnapshotBuffer()` | Returns `null` if worker unavailable or wrong response type. |
| `parsePpuSnapshotBuffer()` | Returns `null` if buffer is missing/too short. |
| `getBackgroundMapImage()` / `getTileDataImage()` / `getOamSpritesImage()` | Return `null` when worker unavailable, image unsupported, or rendering/read fails. |
| `getCPURegisters()` / `getTimerState()` / `getLCDState()` / `getScanlineParameters()` | Return `null` if worker unavailable or runtime error occurs. |

