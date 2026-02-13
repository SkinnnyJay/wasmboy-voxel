<script>
  import { onMount } from 'svelte';
  import {isStarted, isLoaded, isPlaying, romUrl, romName, saveState, setStatus} from '../stores.js';
  import {WasmBoy} from '../../../dist/wasmboy.wasm.esm.js';

  const IFRAME_BREAKPOINT = 'iframe:breakpoint';
  const EMULATOR_SET_MEMORY_BREAKPOINT = 'emulator:setMemoryBreakpoint';
  const EMULATOR_CLEAR_MEMORY_BREAKPOINT = 'emulator:clearMemoryBreakpoint';
  const EMULATOR_CLEAR_ALL_MEMORY_BREAKPOINTS = 'emulator:clearAllMemoryBreakpoints';
  const EMULATOR_RESPONSE = 'emulator:response';
  const EMULATOR_GET_BACKGROUND_MAP_IMAGE = 'emulator:getBackgroundMapImage';
  const EMULATOR_GET_TILE_DATA_IMAGE = 'emulator:getTileDataImage';
  const EMULATOR_GET_OAM_SPRITES_IMAGE = 'emulator:getOamSpritesImage';
  const EMULATOR_GET_CPU_REGISTERS = 'emulator:getCPURegisters';
  const EMULATOR_GET_TIMER_STATE = 'emulator:getTimerState';
  const EMULATOR_GET_LCD_STATE = 'emulator:getLCDState';
  const EMULATOR_GET_SCANLINE_PARAMETERS = 'emulator:getScanlineParameters';

  let mountResolve;
  let mountPromise = new Promise(resolve => {
    mountResolve = resolve;
  });
  onMount(() => {
    mountResolve();
    const handleMessage = (event) => {
      const d = event.data;
      if (!d || typeof d.type !== 'string' || !d.type.startsWith('emulator:')) return;
      const source = event.source || window.parent;
      const messageId = d.messageId;
      const reply = (response, error) => {
        if (messageId != null) {
          source.postMessage({ type: EMULATOR_RESPONSE, messageId, response, error }, '*');
        }
      };
      const replyImage = (result) => {
        if (messageId == null) return;
        if (result && result.data && result.data.buffer) {
          const response = { width: result.width, height: result.height, data: result.data.buffer };
          source.postMessage({ type: EMULATOR_RESPONSE, messageId, response }, '*', [response.data]);
        } else {
          source.postMessage({ type: EMULATOR_RESPONSE, messageId, response: null }, '*');
        }
      };
      if (d.type === EMULATOR_SET_MEMORY_BREAKPOINT && d.payload) {
        WasmBoy.setMemoryBreakpoint(d.payload).then(res => reply(res)).catch(err => reply(null, String(err && err.message)));
      } else if (d.type === EMULATOR_CLEAR_MEMORY_BREAKPOINT && d.payload && d.payload.id != null) {
        WasmBoy.clearMemoryBreakpoint(d.payload.id).then(() => reply()).catch(err => reply(null, String(err && err.message)));
      } else if (d.type === EMULATOR_CLEAR_ALL_MEMORY_BREAKPOINTS) {
        WasmBoy.clearAllMemoryBreakpoints().then(() => reply()).catch(err => reply(null, String(err && err.message)));
      } else if (d.type === EMULATOR_GET_CPU_REGISTERS) {
        WasmBoy.getCPURegisters().then(res => reply(res)).catch(err => reply(null, String(err && err.message)));
      } else if (d.type === EMULATOR_GET_TIMER_STATE) {
        WasmBoy.getTimerState().then(res => reply(res)).catch(err => reply(null, String(err && err.message)));
      } else if (d.type === EMULATOR_GET_LCD_STATE) {
        WasmBoy.getLCDState().then(res => reply(res)).catch(err => reply(null, String(err && err.message)));
      } else if (d.type === EMULATOR_GET_SCANLINE_PARAMETERS) {
        WasmBoy.getScanlineParameters().then(res => reply(res)).catch(err => reply(null, String(err && err.message)));
      } else if (d.type === EMULATOR_GET_BACKGROUND_MAP_IMAGE) {
        WasmBoy.getBackgroundMapImage().then(replyImage).catch(err => reply(null, String(err && err.message)));
      } else if (d.type === EMULATOR_GET_TILE_DATA_IMAGE) {
        WasmBoy.getTileDataImage().then(replyImage).catch(err => reply(null, String(err && err.message)));
      } else if (d.type === EMULATOR_GET_OAM_SPRITES_IMAGE) {
        WasmBoy.getOamSpritesImage().then(replyImage).catch(err => reply(null, String(err && err.message)));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  });

  let canvasStyle = 'display: none';

  const loadWasmBoy = async () => {
    await mountPromise;

    const wasmBoyCanvas = document.querySelector('.canvas-container > canvas');

    const inIframe = typeof window !== 'undefined' && window.parent !== window;
    const EmbedPlugin = {
      name: 'EmbedPlugin',
      saveState: saveStateObject => {
        if (wasmBoyCanvas) {
          saveStateObject.screenshotCanvasDataURL = wasmBoyCanvas.toDataURL();
        }
      },
      play: () => isPlaying.set(true),
      pause: () => {
        isPlaying.set(false);
        setStatus('Paused', -1);
      },
      graphics: (rgba) => {
        if (inIframe) {
          window.parent.postMessage({ type: 'iframe:pluginHook', hook: 'graphics', payload: { width: 160, height: 144 } }, '*');
        }
      },
      breakpoint: () => {
        if (inIframe) {
          window.parent.postMessage({ type: 'iframe:pluginHook', hook: 'breakpoint', payload: {} }, '*');
        }
      },
      canvas: (canvas, ctx, imageData) => {
        if (inIframe) {
          window.parent.postMessage({ type: 'iframe:pluginHook', hook: 'canvas', payload: { width: (canvas && canvas.width) || 0, height: (canvas && canvas.height) || 0 } }, '*');
        }
      }
    };

    await WasmBoy.config({
      isGbcEnabled: true,
      isGbcColorizationEnabled: true,
      isAudioEnabled: true,
      gameboyFrameRate: 60,
      maxNumberOfAutoSaveStates: 3,
      breakpointPause: false,
      breakpointCallback: (breakpoint) => {
        if (typeof window !== 'undefined' && window.parent !== window && breakpoint) {
          window.parent.postMessage({ type: IFRAME_BREAKPOINT, breakpoint }, '*');
        }
      }
    });

    await WasmBoy.setCanvas(wasmBoyCanvas);
    WasmBoy.addPlugin(EmbedPlugin);
    await WasmBoy.loadROM($romUrl);
    await WasmBoy.play();

    canvasStyle = 'display: block';
    isLoaded.set(true)
    isPlaying.set(true);
  }

  const wasmBoyPromise = loadWasmBoy().catch(error => {
    console.error(error);
    throw error;
  });

  isPlaying.subscribe(async (value) => {
    if(!WasmBoy.isPlaying() && value) {
      await WasmBoy.play();
    } else if (WasmBoy.isPlaying() && !value) {
      await WasmBoy.pause();
    }
  });

  saveState.subscribe(() => {
    if ($isStarted && $isLoaded) {
      WasmBoy.saveState().then(() => {
        WasmBoy.play();
        setStatus('State Saved!');
      }).catch(() => {
        setStatus('Error saving the state...')
      });
    }
  });
</script>

<div class="canvas-container" style={canvasStyle}>
  <canvas />
</div>

{#if $isLoaded === false}
<div class="status">
  {#await wasmBoyPromise}
    {#if $romName}
      <h2>Loading {$romName} ...</h2>
    {:else}
      <h2>Loading...</h2>
    {/if}
    <div class="donut"></div>
  {:catch error}
    <div class="error">
      {#if $romName}
        <h2>Error loading {$romName} ...</h2>
      {:else}
        <h3>Error!</h3>
      {/if}
      <h3>{error.message}</h3>
    </div>
  {/await}
</div>
{/if}

<style>
  .canvas-container {
    width: 100%;
    height: 100%;

    background-color: #000;
  }

  .canvas-container > canvas {
    width: 100%;
    height: 100%;
  }

  :global(.touchpad-visible.portrait) .canvas-container > canvas {
    width: 100%;
    height: 300px;
  }

  :global(.touchpad-visible.landscape) .canvas-container > canvas {
    width: 100%;
    height: calc(100% - 50px);
  }

  .status {
    width: 100%;
    height: 100%;

    text-align: center;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
</style>
