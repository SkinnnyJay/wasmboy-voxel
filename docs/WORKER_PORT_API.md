# Worker port and API support

## Overview

The WasmBoy-Voxel library runs the emulator core inside a Web Worker (lib worker). The main thread communicates with it via `postMessage` using the message types in `lib/worker/constants.js` (`WORKER_MESSAGE_TYPE`).

## Supported worker message types

All of the following are handled by the lib worker and are used by the public API:

- `CONNECT`, `INSTANTIATE_WASM`, `CONFIG`, `PLAY`, `PAUSE`, `CONTINUE_AFTER_BREAKPOINT`
- `RUN_WASM_EXPORT` – used by debug APIs (registers, timer, LCD, scanline, breakpoints, debug images)
- `GET_WASM_MEMORY_SECTION`, `SET_WASM_MEMORY_SECTION`, `GET_WASM_CONSTANT`
- `GET_PPU_SNAPSHOT`, `FORCE_OUTPUT_FRAME`, `SET_SPEED`, `IS_GBC`
- `SET_JOYPAD_STATE`, `RESET_AUDIO_QUEUE`, `GET_CONSTANTS`
- Memory types for sync: `GET_MEMORY`, `SET_MEMORY`, etc.

## Public APIs and worker usage

- **Debug state** (`getCPURegisters`, `getTimerState`, `getLCDState`, `getScanlineParameters`): implemented via `RUN_WASM_EXPORT` and `GET_WASM_CONSTANT` / `GET_WASM_MEMORY_SECTION`. Return `null` when the worker or WASM is not ready.
- **Debug images** (`getBackgroundMapImage`, `getTileDataImage`, `getOamSpritesImage`): same path; return `null` when unavailable.
- **Memory breakpoints** (`setMemoryBreakpoint`, `clearMemoryBreakpoint`, `clearAllMemoryBreakpoints`): implemented via `RUN_WASM_EXPORT` (setReadGbMemoryBreakpoint, etc.).
- **PPU snapshot** (`_getPpuSnapshotBuffer`): uses `GET_PPU_SNAPSHOT`; returns `null` when worker not ready.

When the worker is not initialized (e.g. before `config()`/`loadROM()` or when used from a context that has no worker), these methods return `null` or resolve to `null` instead of throwing. Timeouts on worker messages reject with an error object that includes `code: 'TIMEOUT'`.

## Unsupported usage

- Calling the public API from a different Web Worker (i.e. not the main thread) is not supported; the WasmBoy singleton and worker are created on the main thread.
- Iframe embed: the demo iframe runs the full WasmBoy bundle in the iframe document; the parent communicates via `postMessage` (see `lib/iframe/constants.js` and the iframe message handlers in `demo/iframe`).
