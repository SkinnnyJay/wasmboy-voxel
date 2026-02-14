/**
 * Parse a PPU snapshot buffer (no Worker dependency).
 * Used by debug.js and WasmBoyHeadless.
 */
import { PPU_SNAPSHOT_TILE_LEN, PPU_SNAPSHOT_MAP_LEN, PPU_SNAPSHOT_OAM_LEN, PPU_SNAPSHOT_REG_OFF } from './ppuSnapshotConstants';

export function parsePpuSnapshotBuffer(buffer) {
  if (!buffer || buffer.byteLength < PPU_SNAPSHOT_REG_OFF + 8) {
    return null;
  }
  const u8 = new Uint8Array(buffer);
  const tileData = u8.subarray(0, PPU_SNAPSHOT_TILE_LEN);
  const map0 = u8.subarray(PPU_SNAPSHOT_TILE_LEN, PPU_SNAPSHOT_TILE_LEN + PPU_SNAPSHOT_MAP_LEN);
  const map1 = u8.subarray(PPU_SNAPSHOT_TILE_LEN + PPU_SNAPSHOT_MAP_LEN, PPU_SNAPSHOT_TILE_LEN + PPU_SNAPSHOT_MAP_LEN * 2);
  const oamData = u8.subarray(
    PPU_SNAPSHOT_TILE_LEN + PPU_SNAPSHOT_MAP_LEN * 2,
    PPU_SNAPSHOT_TILE_LEN + PPU_SNAPSHOT_MAP_LEN * 2 + PPU_SNAPSHOT_OAM_LEN,
  );
  const lcdc = u8[PPU_SNAPSHOT_REG_OFF + 4];
  const r = PPU_SNAPSHOT_REG_OFF;
  return {
    registers: {
      scx: u8[r + 0],
      scy: u8[r + 1],
      wx: u8[r + 2],
      wy: u8[r + 3],
      lcdc,
      bgp: u8[r + 5],
      obp0: u8[r + 6],
      obp1: u8[r + 7],
    },
    tileData,
    bgTileMap: (lcdc & 0x08) !== 0 ? map1 : map0,
    windowTileMap: (lcdc & 0x40) !== 0 ? map1 : map0,
    oamData,
  };
}
