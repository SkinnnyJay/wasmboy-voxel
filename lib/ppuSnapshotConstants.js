/**
 * PPU snapshot buffer layout. Must stay in sync with core/constants.ts
 * (GAMEBOY_INTERNAL_MEMORY = VIDEO_RAM). Used by worker GET_PPU_SNAPSHOT
 * and by debug parsePpuSnapshotBuffer.
 */
export const PPU_SNAPSHOT_TILE_LEN = 0x1800;
export const PPU_SNAPSHOT_MAP_LEN = 0x400;
export const PPU_SNAPSHOT_OAM_LEN = 0xa0;
export const PPU_SNAPSHOT_REG_OFF = 0x20a0;
export const PPU_SNAPSHOT_TOTAL = PPU_SNAPSHOT_REG_OFF + 8;

/** Offsets from GAMEBOY_INTERNAL_MEMORY_LOCATION (VIDEO_RAM) for worker snapshot copy. */
export const PPU_SNAPSHOT_OFFSET_TILE_START = 0;
export const PPU_SNAPSHOT_OFFSET_MAP0 = 0x1800;
export const PPU_SNAPSHOT_OFFSET_MAP1 = 0x1c00;
export const PPU_SNAPSHOT_OFFSET_OAM = 0x7e00;

/** Register offsets from same base (GB: 0xFF40, 0xFF42, etc. -> 0x7F40, 0x7F42, ...). */
export const PPU_SNAPSHOT_REG_OFFSET_SCX = 0x7f43;
export const PPU_SNAPSHOT_REG_OFFSET_SCY = 0x7f42;
export const PPU_SNAPSHOT_REG_OFFSET_WX = 0x7f4b;
export const PPU_SNAPSHOT_REG_OFFSET_WY = 0x7f4a;
export const PPU_SNAPSHOT_REG_OFFSET_LCDC = 0x7f40;
export const PPU_SNAPSHOT_REG_OFFSET_BGP = 0x7f47;
export const PPU_SNAPSHOT_REG_OFFSET_OBP0 = 0x7f48;
export const PPU_SNAPSHOT_REG_OFFSET_OBP1 = 0x7f49;
