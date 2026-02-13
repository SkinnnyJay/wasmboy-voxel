/**
 * Entry point for @libs/WasmBoy-Voxel.
 * Re-exports the voxel wrapper that extends the vendored WasmBoy fork with PPU snapshot and debug API.
 */

export type {
  DirectMemoryAccess,
  DirtyTileBitfield,
  GbcBgPalette,
  GbcObjPalette,
  JoypadTraceConfig,
  JoypadTraceEntry,
  VramBankState,
} from "./fork-api-spec";
export {
  WasmBoy,
  type WasmBoyApi,
  type WasmBoyConfig,
  type WasmBoyJoypadState,
  type WasmBoyPpuSnapshot,
  type WasmBoyVoxelApi,
} from "./voxel-wrapper";
