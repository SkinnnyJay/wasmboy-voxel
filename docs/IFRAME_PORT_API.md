# Iframe port API

## Overview

When the emulator runs inside an iframe (e.g. the demo iframe), the parent window communicates with it via `postMessage`. Message types are defined in `lib/iframe/constants.js` (`IFRAME_MESSAGE_TYPE`). The parent posts requests with `emulator:*` types; the iframe replies with `emulator:response` and may send unsolicited events with `iframe:*` types.

## Parent-to-iframe request types

All requests must include a `messageId` (string or number) so the parent can correlate the response. Optional `payload` is used where noted.

| Type | Payload | Description |
|------|---------|-------------|
| `emulator:setMemoryBreakpoint` | `{ address, access: 'read' \| 'write' }` | Set a memory breakpoint. Response: `{ id }`. |
| `emulator:clearMemoryBreakpoint` | `{ id }` | Clear breakpoint by id (`bp-read` or `bp-write`). |
| `emulator:clearAllMemoryBreakpoints` | — | Clear all breakpoints. |
| `emulator:getCPURegisters` | — | Get CPU registers and PC/SP/opcode. |
| `emulator:getTimerState` | — | Get timer state (div, tima, tma, tac, enabled). |
| `emulator:getLCDState` | — | Get LCD state (ly, lcdc, stat, scrollX/Y, windowX/Y). |
| `emulator:getScanlineParameters` | — | Get per-scanline [scx, scy, wx, wy] for 144 scanlines. |
| `emulator:getBackgroundMapImage` | — | Get background map debug image. |
| `emulator:getTileDataImage` | — | Get tile data debug image. |
| `emulator:getOamSpritesImage` | — | Get OAM sprites debug image. |

## Response format

The iframe always replies with a single message type: `emulator:response`.

- **Payload:** `{ messageId, response?, error? }`. The `messageId` matches the request. On success, `response` is set and `error` is omitted. On failure, `error` is a string and `response` may be null.

**State APIs** (`getCPURegisters`, `getTimerState`, `getLCDState`, `getScanlineParameters`): `response` is the object or array (e.g. `{ a, b, c, ... }`, `{ div, tima, ... }`, `{ ly, scrollX, ... }`, or an array of 144 `[scx, scy, wx, wy]` tuples).

**Image APIs** (`getBackgroundMapImage`, `getTileDataImage`, `getOamSpritesImage`): `response` is either `null` (unavailable) or `{ width, height, data }` where `data` is an `ArrayBuffer` (possibly transferred). Reconstruct `ImageData` in the parent with:

```js
if (response && response.data) {
  const imageData = new ImageData(
    new Uint8ClampedArray(response.data),
    response.width,
    response.height
  );
}
```

Sizes: background map 256×256, tile data 248×184, OAM sprites 64×80.

## Iframe-to-parent events (no response)

- **`iframe:breakpoint`** – A memory breakpoint fired. Payload: `{ breakpoint: { id, address, access, firedAtMs } }`.
- **`iframe:pluginHook`** – A plugin hook ran. Payload: `{ hook, payload }` (e.g. `graphics`, `breakpoint`, `canvas`).

## Example: parent requests CPU registers

```js
const iframe = document.querySelector('iframe');
const win = iframe.contentWindow;
const messageId = Date.now();

window.addEventListener('message', function onResponse(event) {
  if (event.data?.type !== 'emulator:response' || event.data.messageId !== messageId) return;
  window.removeEventListener('message', onResponse);
  if (event.data.error) {
    console.error(event.data.error);
    return;
  }
  console.log('CPU registers', event.data.response);
});

win.postMessage({ type: 'emulator:getCPURegisters', messageId }, '*');
```

## Promise-based client

For a promise-based API without managing `messageId` and listeners manually, use the parent-side client:

```js
import { createIframeEmulatorClient } from 'lib/iframe/client.js';

const iframe = document.querySelector('iframe');
const client = createIframeEmulatorClient(iframe.contentWindow);

const cpu = await client.getCPURegisters();
const timer = await client.getTimerState();
const lcd = await client.getLCDState();
const scanlines = await client.getScanlineParameters();
const bgImage = await client.getBackgroundMapImage();
const tileImage = await client.getTileDataImage();
const oamImage = await client.getOamSpritesImage();
```

The client uses a 10s default timeout; pass a third argument to override (e.g. `client.getCPURegisters(5000)`). On timeout, the promise rejects with an error whose `code` is `'TIMEOUT'`.
