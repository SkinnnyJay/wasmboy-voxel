// Functions here are depedent on WasmBoyMemory state.
// Thus me bound using .bind() on functions

import { WasmBoyPlugins } from '../plugins/plugins';

// WasmBoy Modules
import { WasmBoyGraphics } from '../graphics/graphics';
import { WasmBoyAudio } from '../audio/audio';
import { WasmBoyController } from '../controller/controller';
import { WasmBoyMemory } from '../memory/memory';

// Fetch our rom
import { fetchROMAsByteArray } from './fetchrom';

// Get our worker message types
import { WORKER_MESSAGE_TYPE } from '../worker/constants';

// Function to initialize the workers / set up wasm module
// Getting started with wasm
// http://webassembly.org/getting-started/js-api/
async function initialize() {
  if (this.initialized) {
    return;
  }

  this.ready = false;
  this.loadedAndStarted = false;

  // Instantiate our workers
  await this._instantiateWorkers();

  // Now tell the wasm module to instantiate wasm
  const response = await this.worker.postMessage({
    type: WORKER_MESSAGE_TYPE.INSTANTIATE_WASM,
  });

  this.coreType = response.message.type;

  if (!this.options.mainThread) {
    // Set up Memory (uses memory worker; skip when main-thread)
    await WasmBoyMemory.initialize(this.options.headless, this.options.maxNumberOfAutoSaveStates, this.options.saveStateCallback);
    await WasmBoyMemory.clearMemory();
  }

  this.initialized = true;
}

// Finish request for wasm module, and fetch game
// NOTE: **Should bind the wasmboy this here**
export function loadROMToWasmBoy(ROM, fetchHeaders) {
  const loadROMAndConfigTask = async () => {
    const fetchROMObject = await fetchROMAsByteArray(ROM, fetchHeaders);
    const romBytes = fetchROMObject.ROM instanceof Uint8Array ? fetchROMObject.ROM : new Uint8Array(fetchROMObject.ROM);

    if (this.options.mainThread && this.wasmInstance && this.wasmByteMemory) {
      const cartRomLoc = this.wasmInstance.exports.CARTRIDGE_ROM_LOCATION.valueOf();
      const maxRom = Math.min(romBytes.length, 0x200000);
      this.wasmByteMemory.set(romBytes.subarray(0, maxRom), cartRomLoc);
      this.loadedROM = ROM;
      await this.worker.postMessage({
        type: WORKER_MESSAGE_TYPE.CONFIG,
        config: [
          0, // Boot ROM not loaded in main-thread path
          this.options.isGbcEnabled ? 1 : 0,
          this.options.audioBatchProcessing ? 1 : 0,
          this.options.graphicsBatchProcessing ? 1 : 0,
          this.options.timersBatchProcessing ? 1 : 0,
          this.options.graphicsDisableScanlineRendering ? 1 : 0,
          this.options.audioAccumulateSamples ? 1 : 0,
          this.options.tileRendering ? 1 : 0,
          this.options.tileCaching ? 1 : 0,
          this.options.enableAudioDebugging ? 1 : 0,
        ],
        options: {
          gameboyFrameRate: this.options.gameboyFrameRate,
          headless: this.options.headless,
          isAudioEnabled: this.options.isAudioEnabled,
          isGbcColorizationEnabled: this.options.isGbcColorizationEnabled,
          gbcColorizationPalette: this.options.gbcColorizationPalette,
          enableAudioDebugging: this.options.enableAudioDebugging,
          frameSkip: this.options.frameSkip,
          syncMemoryEveryFrame: this.options.syncMemoryEveryFrame !== false,
        },
      });
      return;
    }

    if (!this.options.headless && WasmBoyMemory.getLoadedCartridgeMemoryState().RAM) {
      await WasmBoyMemory.saveCartridgeRam();
    }

    await WasmBoyMemory.loadCartridgeRom(fetchROMObject.ROM, fetchROMObject.name);

    if (this.options.enableBootROMIfAvailable) {
      const cartridgeInfo = await WasmBoyMemory.getCartridgeInfo();
      if (cartridgeInfo.CGBFlag) {
        await WasmBoyMemory.loadBootROMIfAvailable(WasmBoyMemory.SUPPORTED_BOOT_ROM_TYPES.GBC);
      } else {
        await WasmBoyMemory.loadBootROMIfAvailable(WasmBoyMemory.SUPPORTED_BOOT_ROM_TYPES.GB);
      }
    }

    this.loadedROM = ROM;

    await this.worker.postMessage({
      type: WORKER_MESSAGE_TYPE.CONFIG,
      config: [
        WasmBoyMemory.loadedCartridgeMemoryState.BOOT ? 1 : 0,
        this.options.isGbcEnabled ? 1 : 0,
        this.options.audioBatchProcessing ? 1 : 0,
        this.options.graphicsBatchProcessing ? 1 : 0,
        this.options.timersBatchProcessing ? 1 : 0,
        this.options.graphicsDisableScanlineRendering ? 1 : 0,
        this.options.audioAccumulateSamples ? 1 : 0,
        this.options.tileRendering ? 1 : 0,
        this.options.tileCaching ? 1 : 0,
        this.options.enableAudioDebugging ? 1 : 0,
      ],
      options: {
        gameboyFrameRate: this.options.gameboyFrameRate,
        headless: this.options.headless,
        isAudioEnabled: this.options.isAudioEnabled,
        isGbcColorizationEnabled: this.options.isGbcColorizationEnabled,
        gbcColorizationPalette: this.options.gbcColorizationPalette,
        enableAudioDebugging: this.options.enableAudioDebugging,
        frameSkip: this.options.frameSkip,
        syncMemoryEveryFrame: this.options.syncMemoryEveryFrame !== false,
      },
    });
  };

  const loadROMTask = async () => {
    // Pause wasmBoy
    await this.pause();

    await initialize.bind(this)();

    // Check if we are running headless
    if (this.options.headless) {
      await loadROMAndConfigTask();

      // Register graphics callback and trigger GET_CONSTANTS so lib worker gets frame location/size
      await WasmBoyGraphics.initialize(null, this.options.updateGraphicsCallback);

      this.ready = true;
      if (this.options.onReady) {
        this.options.onReady();
      }
      WasmBoyPlugins.runHook({
        key: 'ready',
      });
    } else {
      // Finally intialize all of our services
      // Initialize our services
      // Except memory, which would already be initialized
      await Promise.all([
        WasmBoyGraphics.initialize(this.canvasElement, this.options.updateGraphicsCallback),
        WasmBoyAudio.initialize(this.options.updateAudioCallback),
        WasmBoyController.initialize(),
      ]);

      await loadROMAndConfigTask();

      // Load the game's cartridge ram
      await WasmBoyMemory.loadCartridgeRam();

      this.ready = true;
      if (this.options.onReady) {
        this.options.onReady();
      }
      WasmBoyPlugins.runHook({
        key: 'ready',
      });
    }
  };

  return loadROMTask();
}
