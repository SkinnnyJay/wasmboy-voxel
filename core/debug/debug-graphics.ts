// Functions to debug graphical output
import { BACKGROUND_MAP_LOCATION, TILE_DATA_LOCATION, OAM_TILES_LOCATION } from '../constants';
import {
  Graphics,
  Lcd,
  getTileDataAddress,
  drawPixelsFromLineOfTile,
  getMonochromeColorFromPalette,
  getColorizedGbHexColorFromPalette,
  getRedFromHexColor,
  getGreenFromHexColor,
  getBlueFromHexColor,
  getRgbColorFromPalette,
  getColorComponentFromRgb,
  loadFromVramBank,
} from '../graphics/index';
import { Cpu } from '../cpu/index';
import { eightBitLoadFromGBMemory, Memory } from '../memory/index';
import { checkBitOnByte } from '../helpers/index';

// Some Simple internal getters
export function getLY(): i32 {
  return Graphics.scanlineRegister;
}

export function getScrollX(): i32 {
  return Graphics.scrollX;
}

export function getScrollY(): i32 {
  return Graphics.scrollY;
}

export function getWindowX(): i32 {
  return Graphics.windowX;
}

export function getWindowY(): i32 {
  return Graphics.windowY;
}

export function drawBackgroundMapToWasmMemory(showColor: i32): void {
  // Get our selected tile data memory location
  let tileDataMemoryLocation = Graphics.memoryLocationTileDataSelectZeroStart;
  if (Lcd.bgWindowTileDataSelect) {
    tileDataMemoryLocation = Graphics.memoryLocationTileDataSelectOneStart;
  }

  let tileMapMemoryLocation = Graphics.memoryLocationTileMapSelectZeroStart;
  if (Lcd.bgTileMapDisplaySelect) {
    tileMapMemoryLocation = Graphics.memoryLocationTileMapSelectOneStart;
  }

  let shouldRenderColor = Cpu.GBCEnabled && showColor > 0;
  for (let tileMapY: i32 = 0; tileMapY < 32; tileMapY++) {
    for (let tileMapX: i32 = 0; tileMapX < 32; tileMapX++) {
      let tileMapAddress = tileMapMemoryLocation + tileMapY * 32 + tileMapX;
      let tileIdFromTileMap = loadFromVramBank(tileMapAddress, 0);

      let bgMapAttributes = -1;
      let vramBankId = 0;
      if (shouldRenderColor) {
        bgMapAttributes = loadFromVramBank(tileMapAddress, 1);
        vramBankId = checkBitOnByte(3, bgMapAttributes) ? 1 : 0;
      }

      let outputX = tileMapX << 3;
      let outputY = tileMapY << 3;
      for (let tileLineY: i32 = 0; tileLineY < 8; tileLineY++) {
        let drawTileLineY = tileLineY;
        if (shouldRenderColor && checkBitOnByte(6, bgMapAttributes)) {
          drawTileLineY = 7 - drawTileLineY;
        }

        drawPixelsFromLineOfTile(
          tileIdFromTileMap,
          tileDataMemoryLocation,
          vramBankId,
          0,
          7,
          drawTileLineY,
          outputX,
          outputY + tileLineY,
          256,
          BACKGROUND_MAP_LOCATION,
          false,
          Graphics.memoryLocationBackgroundPalette,
          bgMapAttributes,
          -1,
        );
      }
    }
  }
}

export function drawTileDataToWasmMemory(): void {
  for (let tileDataMapGridY: i32 = 0; tileDataMapGridY < 0x17; tileDataMapGridY++) {
    for (let tileDataMapGridX: i32 = 0; tileDataMapGridX < 0x1f; tileDataMapGridX++) {
      // Get Our VramBankID
      let vramBankId: i32 = 0;
      if (tileDataMapGridX > 0x0f) {
        vramBankId = 1;
      }

      // Get our tile ID
      let tileId: i32 = tileDataMapGridY;
      if (tileDataMapGridY > 0x0f) {
        tileId -= 0x0f;
      }
      tileId = tileId << 4;
      if (tileDataMapGridX > 0x0f) {
        tileId = tileId + (tileDataMapGridX - 0x0f);
      } else {
        tileId = tileId + tileDataMapGridX;
      }

      // Finally get our tile Data location
      let tileDataMemoryLocation: i32 = Graphics.memoryLocationTileDataSelectOneStart;
      if (tileDataMapGridY > 0x0f) {
        tileDataMemoryLocation = Graphics.memoryLocationTileDataSelectZeroStart;
      }

      // Let's see if we have C O L O R
      // Set the map and sprite attributes to -1
      // Meaning, we will draw monochrome
      let paletteLocation: i32 = Graphics.memoryLocationBackgroundPalette;
      let bgMapAttributes: i32 = -1;
      let spriteAttributes: i32 = -1;

      // Let's see if the tile is being used by a sprite
      for (let spriteRow: i32 = 0; spriteRow < 8; spriteRow++) {
        for (let spriteColumn: i32 = 0; spriteColumn < 5; spriteColumn++) {
          let spriteIndex = spriteColumn * 8 + spriteRow;

          // Sprites occupy 4 bytes in the sprite attribute table
          let spriteTableIndex: i32 = spriteIndex * 4;
          let spriteTileId: i32 = eightBitLoadFromGBMemory(Graphics.memoryLocationSpriteAttributesTable + spriteTableIndex + 2);

          if (tileId === spriteTileId) {
            let currentSpriteAttributes: i32 = eightBitLoadFromGBMemory(
              Graphics.memoryLocationSpriteAttributesTable + spriteTableIndex + 3,
            );

            let spriteVramBankId: i32 = 0;
            if (Cpu.GBCEnabled && checkBitOnByte(3, currentSpriteAttributes)) {
              spriteVramBankId = 1;
            }

            if (spriteVramBankId === vramBankId) {
              spriteAttributes = currentSpriteAttributes;
              spriteRow = 8;
              spriteColumn = 5;

              // Set our paletteLocation
              paletteLocation = Graphics.memoryLocationSpritePaletteOne;
              if (checkBitOnByte(4, spriteAttributes)) {
                paletteLocation = Graphics.memoryLocationSpritePaletteTwo;
              }
            }
          }
        }
      }

      // If we didn't find a sprite,
      // Let's see if the tile is on the bg tile map
      // If so, use that bg map for attributes
      if (Cpu.GBCEnabled && spriteAttributes < 0) {
        let tileMapMemoryLocation = Graphics.memoryLocationTileMapSelectZeroStart;
        if (Lcd.bgTileMapDisplaySelect) {
          tileMapMemoryLocation = Graphics.memoryLocationTileMapSelectOneStart;
        }
        // Loop through the tileMap, and find if we have our current ID
        let foundTileMapAddress: i32 = -1;
        for (let x: i32 = 0; x < 32; x++) {
          for (let y: i32 = 0; y < 32; y++) {
            let tileMapAddress: i32 = tileMapMemoryLocation + y * 32 + x;
            let tileIdFromTileMap: i32 = loadFromVramBank(tileMapAddress, 0);

            // Check if we found our tileId
            if (tileId === tileIdFromTileMap) {
              foundTileMapAddress = tileMapAddress;
              x = 32;
              y = 32;
            }
          }
        }

        if (foundTileMapAddress >= 0) {
          bgMapAttributes = loadFromVramBank(foundTileMapAddress, 1);
        }
      }

      // Draw each Y line of the tile
      for (let tileLineY: i32 = 0; tileLineY < 8; tileLineY++) {
        drawPixelsFromLineOfTile(
          tileId, // tileId
          tileDataMemoryLocation, // Graphics.memoryLocationTileDataSelect
          vramBankId, // Vram Bank
          0, // Tile Line X Start
          7, // Tile Line X End
          tileLineY, // Tile Line Y
          tileDataMapGridX * 8, // Output line X
          tileDataMapGridY * 8 + tileLineY, // Output line Y
          0x1f * 8, // Output Width
          TILE_DATA_LOCATION, // Wasm Memory Start
          false, // shouldRepresentMonochromeColorByColorId
          paletteLocation, // paletteLocation
          bgMapAttributes, // bgMapAttributes
          spriteAttributes, // spriteAttributes
        );
      }
    }
  }
}

export function drawOamToWasmMemory(): void {
  // Draw all 40 sprites
  // Going to be like BGB and do 8 x 5 sprites
  for (let spriteRow: i32 = 0; spriteRow < 8; spriteRow++) {
    for (let spriteColumn: i32 = 0; spriteColumn < 5; spriteColumn++) {
      let spriteIndex = spriteColumn * 8 + spriteRow;

      // Sprites occupy 4 bytes in the sprite attribute table
      let spriteTableIndex: i32 = spriteIndex * 4;

      // Y positon is offset by 16, X position is offset by 8

      let spriteYPosition: i32 = eightBitLoadFromGBMemory(Graphics.memoryLocationSpriteAttributesTable + spriteTableIndex);
      let spriteXPosition: i32 = eightBitLoadFromGBMemory(Graphics.memoryLocationSpriteAttributesTable + spriteTableIndex + 1);
      let spriteTileId: i32 = eightBitLoadFromGBMemory(Graphics.memoryLocationSpriteAttributesTable + spriteTableIndex + 2);

      let tilesToDraw: i32 = 1;
      if (Lcd.tallSpriteSize) {
        // @binji says in 8x16 mode, even tileId always drawn first
        // This will fix shantae sprites which always uses odd numbered indexes

        // TODO: Do the actual Pandocs thing:
        // "In 8x16 mode, the lower bit of the tile number is ignored. Ie. the upper 8x8 tile is "NN AND FEh", and the lower 8x8 tile is "NN OR 01h"."
        // So just knock off the last bit? :)
        if (spriteTileId % 2 === 1) {
          spriteTileId -= 1;
        }

        tilesToDraw += 1;
      }

      // Get our sprite attributes since we know we shall be drawing the tile
      let spriteAttributes: i32 = eightBitLoadFromGBMemory(Graphics.memoryLocationSpriteAttributesTable + spriteTableIndex + 3);

      // Check if we should flip the sprite on the x or y axis
      let flipSpriteY: boolean = checkBitOnByte(6, spriteAttributes);
      let flipSpriteX: boolean = checkBitOnByte(5, spriteAttributes);

      // Find which VRAM Bank to load from
      let vramBankId: i32 = 0;
      if (Cpu.GBCEnabled && checkBitOnByte(3, spriteAttributes)) {
        vramBankId = 1;
      }

      // Find which monochrome palette we should use
      let paletteLocation: i32 = Graphics.memoryLocationSpritePaletteOne;
      if (checkBitOnByte(4, spriteAttributes)) {
        paletteLocation = Graphics.memoryLocationSpritePaletteTwo;
      }

      // Start Drawing our tiles
      for (let i: i32 = 0; i < tilesToDraw; i++) {
        // Draw each Y line of the tile
        for (let tileLineY: i32 = 0; tileLineY < 8; tileLineY++) {
          drawPixelsFromLineOfTile(
            spriteTileId + i, // tileId
            Graphics.memoryLocationTileDataSelectOneStart, // Graphics.memoryLocationTileDataSelect
            vramBankId, // VRAM Bank
            0, // Tile Line X Start
            7, // Tile Line X End
            tileLineY, // Tile Line Y
            spriteRow * 8, // Output line X
            spriteColumn * 16 + tileLineY + i * 8, // Output line Y
            8 * 8, // Output Width
            OAM_TILES_LOCATION, // Wasm Memory Start
            false, // shouldRepresentMonochromeColorByColorId
            paletteLocation, // paletteLocation
            -1, // bgMapAttributes
            spriteAttributes, // spriteAttributes
          );
        }
      }
    }
  }
}
