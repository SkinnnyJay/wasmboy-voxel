const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const getWasmBoyCorePath = path.resolve(process.cwd(), 'dist/core/getWasmBoyWasmCore.cjs.js');
const getWasmBoyCoreCjsPath = path.join(os.tmpdir(), 'getWasmBoyWasmCore.debug-bg-map.runtime.cjs');
fs.copyFileSync(getWasmBoyCorePath, getWasmBoyCoreCjsPath);
const getWasmBoyCore = require(getWasmBoyCoreCjsPath);

const TILE_MAP_BASE = 0x9800;
const TILE_DATA_BASE = 0x8000;
const VRAM_BANK_SIZE = 0x2000;
const RGB_COMPONENT_BIT_WIDTH = 5;
const RGB_COMPONENT_MASK = 0x1f;
const RGB_COMPONENT_MAX_8BIT = 0xff;
const RGB_COMPONENT_MAX_5BIT = 0x1f;
const RGB_COMPONENT_ROUNDING_BIAS = RGB_COMPONENT_MAX_5BIT >> 1;

function createDebugBackgroundRenderRom() {
  const rom = new Uint8Array(0x8000);
  let index = 0x100;

  rom[0x143] = 0x80; // CGB compatible cart flag

  rom[index++] = 0x3e; // LD A, n
  rom[index++] = 0x91; // LCDC: bg map 9800, tile data 8000, display on
  rom[index++] = 0xe0; // LDH (n), A
  rom[index++] = 0x40; // FF40

  rom[index++] = 0x18; // JR -2
  rom[index++] = 0xfe;
  return rom;
}

function getExportI32(value) {
  return typeof value === 'number' ? value : value.valueOf();
}

function readVramByte(wasmboy, wasmByteMemoryArray, gameboyAddress, bank) {
  if (bank === 0) {
    const wasmOffset = wasmboy.getWasmBoyOffsetFromGameBoyOffset(gameboyAddress);
    return wasmByteMemoryArray[wasmOffset];
  }

  const bank1Base = getExportI32(wasmboy.GAMEBOY_INTERNAL_MEMORY_LOCATION) + VRAM_BANK_SIZE;
  return wasmByteMemoryArray[bank1Base + (gameboyAddress - 0x8000)];
}

function writeVramByte(wasmboy, wasmByteMemoryArray, gameboyAddress, bank, value) {
  if (bank === 0) {
    const wasmOffset = wasmboy.getWasmBoyOffsetFromGameBoyOffset(gameboyAddress);
    wasmByteMemoryArray[wasmOffset] = value & 0xff;
    return;
  }

  const bank1Base = getExportI32(wasmboy.GAMEBOY_INTERNAL_MEMORY_LOCATION) + VRAM_BANK_SIZE;
  wasmByteMemoryArray[bank1Base + (gameboyAddress - 0x8000)] = value & 0xff;
}

function encodeGbcColor(red, green, blue) {
  return (red & 0x1f) | ((green & 0x1f) << 5) | ((blue & 0x1f) << 10);
}

function storeBackgroundPaletteColor(wasmboy, wasmByteMemoryArray, paletteId, colorId, red, green, blue) {
  const color = encodeGbcColor(red, green, blue);
  const paletteMemoryLocation = getExportI32(wasmboy.GBC_PALETTE_LOCATION);
  const paletteIndex = paletteId * 8 + colorId * 2;
  wasmByteMemoryArray[paletteMemoryLocation + paletteIndex] = color & 0xff;
  wasmByteMemoryArray[paletteMemoryLocation + paletteIndex + 1] = (color >> 8) & 0xff;
}

function getExpectedColorComponent(colorRgb, channel) {
  const channelShift = channel * RGB_COMPONENT_BIT_WIDTH;
  const channelValue = (colorRgb >> channelShift) & RGB_COMPONENT_MASK;
  return Math.floor((channelValue * RGB_COMPONENT_MAX_8BIT + RGB_COMPONENT_ROUNDING_BIAS) / RGB_COMPONENT_MAX_5BIT);
}

function getExpectedPixel(wasmboy, wasmByteMemoryArray, x, y) {
  const tileX = x >> 3;
  const tileY = y >> 3;
  const tileMapAddress = TILE_MAP_BASE + tileY * 32 + tileX;
  const tileId = readVramByte(wasmboy, wasmByteMemoryArray, tileMapAddress, 0);
  const mapAttributes = readVramByte(wasmboy, wasmByteMemoryArray, tileMapAddress, 1);
  const paletteId = mapAttributes & 0x07;
  const vramBank = (mapAttributes >> 3) & 0x01;
  const flipX = (mapAttributes & 0x20) !== 0;
  const flipY = (mapAttributes & 0x40) !== 0;

  const tileLineY = flipY ? 7 - (y & 0x07) : y & 0x07;
  const tileLineX = flipX ? x & 0x07 : 7 - (x & 0x07);
  const tileDataAddress = TILE_DATA_BASE + tileId * 16 + tileLineY * 2;
  const lineByteLow = readVramByte(wasmboy, wasmByteMemoryArray, tileDataAddress, vramBank);
  const lineByteHigh = readVramByte(wasmboy, wasmByteMemoryArray, tileDataAddress + 1, vramBank);

  let paletteColorId = 0;
  if ((lineByteHigh >> tileLineX) & 0x01) {
    paletteColorId = 2;
  }
  if ((lineByteLow >> tileLineX) & 0x01) {
    paletteColorId += 1;
  }

  const paletteMemoryLocation = getExportI32(wasmboy.GBC_PALETTE_LOCATION);
  const paletteIndex = paletteId * 8 + paletteColorId * 2;
  const paletteLow = wasmByteMemoryArray[paletteMemoryLocation + paletteIndex];
  const paletteHigh = wasmByteMemoryArray[paletteMemoryLocation + paletteIndex + 1];
  const colorRgb = paletteLow | (paletteHigh << 8);

  return [getExpectedColorComponent(colorRgb, 0), getExpectedColorComponent(colorRgb, 1), getExpectedColorComponent(colorRgb, 2)];
}

describe('Debug background map rendering', function() {
  it('renders CGB background map correctly using tile-batched drawing path', async function() {
    this.timeout(30000);

    const wasmboyCore = await getWasmBoyCore();
    const wasmboy = wasmboyCore.instance.exports;
    const wasmByteMemoryArray = new Uint8Array(wasmboy.memory.buffer);

    wasmByteMemoryArray.set(createDebugBackgroundRenderRom(), wasmboy.CARTRIDGE_ROM_LOCATION);
    wasmboy.config(
      0, // enableBootRom
      1, // useGbcWhenAvailable
      0, // audioBatchProcessing
      0, // graphicsBatchProcessing
      0, // timersBatchProcessing
      0, // graphicsDisableScanlineRendering
      0, // audioAccumulateSamples
      0, // tileRendering
      0, // tileCaching
      0, // enableAudioDebugging
    );

    for (let step = 0; step < 12; step += 1) {
      wasmboy.executeStep();
    }

    for (let paletteId = 0; paletteId < 8; paletteId += 1) {
      for (let colorId = 0; colorId < 4; colorId += 1) {
        const red = (paletteId * 5 + colorId * 3) & 0x1f;
        const green = (paletteId * 7 + colorId * 5 + 1) & 0x1f;
        const blue = (paletteId * 11 + colorId * 2 + 2) & 0x1f;
        storeBackgroundPaletteColor(wasmboy, wasmByteMemoryArray, paletteId, colorId, red, green, blue);
      }
    }

    for (let tileId = 0; tileId < 4; tileId += 1) {
      for (let row = 0; row < 8; row += 1) {
        const lowByteBank0 = (0x1d * (row + tileId + 1)) & 0xff;
        const highByteBank0 = (0xb3 * (row + tileId + 2)) & 0xff;
        writeVramByte(wasmboy, wasmByteMemoryArray, TILE_DATA_BASE + tileId * 16 + row * 2, 0, lowByteBank0);
        writeVramByte(wasmboy, wasmByteMemoryArray, TILE_DATA_BASE + tileId * 16 + row * 2 + 1, 0, highByteBank0);

        const lowByteBank1 = (0x47 * (row + tileId + 3)) & 0xff;
        const highByteBank1 = (0x95 * (row + tileId + 4)) & 0xff;
        writeVramByte(wasmboy, wasmByteMemoryArray, TILE_DATA_BASE + tileId * 16 + row * 2, 1, lowByteBank1);
        writeVramByte(wasmboy, wasmByteMemoryArray, TILE_DATA_BASE + tileId * 16 + row * 2 + 1, 1, highByteBank1);
      }
    }

    writeVramByte(wasmboy, wasmByteMemoryArray, TILE_MAP_BASE + 0, 0, 0x00);
    writeVramByte(wasmboy, wasmByteMemoryArray, TILE_MAP_BASE + 1, 0, 0x01);
    writeVramByte(wasmboy, wasmByteMemoryArray, TILE_MAP_BASE + 32, 0, 0x02);
    writeVramByte(wasmboy, wasmByteMemoryArray, TILE_MAP_BASE + 33, 0, 0x03);

    writeVramByte(wasmboy, wasmByteMemoryArray, TILE_MAP_BASE + 0, 1, 0x01);
    writeVramByte(wasmboy, wasmByteMemoryArray, TILE_MAP_BASE + 1, 1, 0x2a);
    writeVramByte(wasmboy, wasmByteMemoryArray, TILE_MAP_BASE + 32, 1, 0x43);
    writeVramByte(wasmboy, wasmByteMemoryArray, TILE_MAP_BASE + 33, 1, 0x6c);

    wasmboy.drawBackgroundMapToWasmMemory(1);

    const outputBase = getExportI32(wasmboy.BACKGROUND_MAP_LOCATION);
    for (let y = 0; y < 16; y += 1) {
      for (let x = 0; x < 16; x += 1) {
        const expectedPixel = getExpectedPixel(wasmboy, wasmByteMemoryArray, x, y);
        const outputPixelOffset = outputBase + (y * 256 + x) * 3;
        const actualPixel = [
          wasmByteMemoryArray[outputPixelOffset],
          wasmByteMemoryArray[outputPixelOffset + 1],
          wasmByteMemoryArray[outputPixelOffset + 2],
        ];
        assert.deepStrictEqual(actualPixel, expectedPixel, `unexpected pixel at (${x}, ${y})`);
      }
    }
  });
});
