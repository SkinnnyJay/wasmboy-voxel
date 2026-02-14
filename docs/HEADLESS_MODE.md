# Headless mode

## Overview

WasmBoy can run with `headless: true` so that no canvas or audio context is required. This is intended for Node test runners, CI, and environments where the full browser UI is not available.

## Config

```javascript
await WasmBoy.config({
  headless: true,
  isAudioEnabled: false,
  disablePauseOnHidden: true,
  updateGraphicsCallback: imageDataArray => {
    // Receives RGBA pixels (160×144×4 bytes) per frame when Workers are used
    processFrame(imageDataArray);
  },
});
```

- **headless**: When `true`, canvas and audio setup are skipped. You may pass no canvas to `config()` or `setCanvas()`.
- **updateGraphicsCallback**: Optional. When headless and the Worker path is used, each completed frame is delivered to this callback (same format as non-headless). Required if you need frame pixels in headless mode.
- **mainThread**: When `true` together with headless, the core runs on the main thread (no Workers). Use `WasmBoyHeadless` for the synchronous frame-step API.

## Limitations (Worker-based headless)

When `headless: true` and Workers are used (default):

- Workers are still created. In headless Chrome (e.g. Playwright/Puppeteer), Worker creation or messaging can fail; in that case `supportsPpuSnapshot()` may return `false` and `getPpuSnapshot()` may return `null`.
- For reliable headless in CI or headless Chrome, use the main-thread path: `mainThread: true` or the `WasmBoyHeadless` class.

## Main-thread headless and WasmBoyHeadless

For environments where Workers are unreliable or you need deterministic frame stepping:

- Use **WasmBoyHeadless** (see [lib/headless/WasmBoyHeadless.js](lib/headless/WasmBoyHeadless.js)) for a synchronous API: `loadROM()`, `stepFrame()` / `stepFrames(n)`, `getFrameBuffer()`, `getPpuSnapshot()`, `readMemory()` / `writeMemory()`, `setJoypadState()`, `saveState()` / `loadState()`.
- Or use the standard `WasmBoy` with `headless: true` and `mainThread: true` so the core runs on the main thread and snapshot/memory APIs avoid Worker round-trips. Run `npm run test:integration:headless:mainthread` to verify.

## Consumer integration (e.g. gameboy-remix)

- **This fork:** Headless is confirmed here: `npm run build` produces `dist/wasmboy.headless.esm.js` and `dist/wasmboy.headless.cjs.cjs`; `test:integration:headless:callback`, `test:integration:headless:class`, and `test:integration:headless:mainthread` pass.
- **Consumer app:** Point the dependency at this fork (e.g. `github:SkinnnyJay/wasmboy-voxel#master`), add headless types in the consumer if needed (e.g. `src/types/wasmboy.d.ts`), then run a fresh `npm install` (or clear git cache and update). To fully confirm headless from the consumer, add a small integration test that imports the headless bundle, loads a ROM, steps frames, and calls `getPpuSnapshot()` or `readMemory()`.

## See also

- [WORKER_PORT_API.md](WORKER_PORT_API.md) – worker message types and public API usage.
- [migration/troubleshooting-faq.md](migration/troubleshooting-faq.md) – `supportsPpuSnapshot()` false or snapshots null.
