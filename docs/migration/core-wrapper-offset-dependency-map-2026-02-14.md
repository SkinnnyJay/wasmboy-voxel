# Core Constant ↔ Wrapper Offset Dependency Map (2026-02-14)

This document maps the **AssemblyScript core memory-layout constants** to the
offset math used by the TypeScript voxel wrapper (`voxel-wrapper.ts`).

Goal: make memory-layout compatibility requirements explicit whenever
`core/constants.ts` or snapshot read logic changes.

## Why this matters

The voxel wrapper reads emulator state through `_getWasmConstant` +
`_getWasmMemorySection`. It does not directly import `core/constants.ts`, so any
core memory-layout drift must be reflected in wrapper reads and tests.

If these contracts drift, snapshot reads can silently return wrong regions.

## Direct constant dependencies

| Core constant (`core/constants.ts`) | Wrapper usage (`voxel-wrapper.ts`)                    | Dependency type | Notes                                                                 |
| ----------------------------------- | ----------------------------------------------------- | --------------- | --------------------------------------------------------------------- |
| `DEBUG_GAMEBOY_MEMORY_LOCATION`     | `GAME_MEMORY_BASE_CONSTANT` (`_getWasmConstant(...)`) | Hard dependency | Base pointer for all Game Boy address-space reads (`0x8000..0xFFFF`). |
| `GBC_PALETTE_LOCATION`              | `fetchGbcPalettes()` (`_getWasmConstant(...)`)        | Hard dependency | Start of packed BG/OBJ palette bytes.                                 |
| `GBC_PALETTE_SIZE`                  | `fetchGbcPalettes()` (`_getWasmConstant(...)`)        | Hard dependency | Must be at least `128` bytes (`64` BG + `64` OBJ).                    |

## Derived Game Boy memory reads in wrapper

All ranges below are computed as:

`coreStart = DEBUG_GAMEBOY_MEMORY_LOCATION + gameBoyOffset`

| Wrapper symbol                             | Game Boy offset range          | Core location formula            | Purpose                 |
| ------------------------------------------ | ------------------------------ | -------------------------------- | ----------------------- |
| `TILE_DATA_START..TILE_DATA_END_EXCLUSIVE` | `0x8000..0x97FF`               | `base + 0x8000 .. base + 0x9800` | Tile pattern data.      |
| `BG_TILEMAP_0_START..+TILEMAP_SIZE`        | `0x9800..0x9BFF`               | `base + 0x9800 .. base + 0x9C00` | BG map 0.               |
| `BG_TILEMAP_1_START..+TILEMAP_SIZE`        | `0x9C00..0x9FFF`               | `base + 0x9C00 .. base + 0xA000` | BG/window map 1.        |
| `OAM_START..OAM_END_EXCLUSIVE`             | `0xFE00..0xFE9F`               | `base + 0xFE00 .. base + 0xFEA0` | Sprite attribute table. |
| `REG_LCDC`                                 | `0xFF40`                       | `base + 0xFF40`                  | Tilemap-selection bits. |
| `REG_SCY` / `REG_SCX`                      | `0xFF42` / `0xFF43`            | `base + register`                | Scroll registers.       |
| `REG_WY` / `REG_WX`                        | `0xFF4A` / `0xFF4B`            | `base + register`                | Window position.        |
| `REG_BGP` / `REG_OBP0` / `REG_OBP1`        | `0xFF47` / `0xFF48` / `0xFF49` | `base + register`                | DMG palettes.           |

## Existing safeguards tied to this dependency

- `supportsPpuSnapshot()` retries `_getWasmConstant(DEBUG_GAMEBOY_MEMORY_LOCATION)`.
- `resolveGameMemoryBase()` caches successful base lookups and returns `null` on
  failure.
- `getPpuSnapshot()` returns `null` (not throw) on constant/read failures.
- Integration tests cover readiness, unsupported internals, and partial read
  failures (`test/integration/voxel-wrapper-readiness-test.mjs`).

## Change checklist

When editing either `core/constants.ts` or wrapper snapshot memory reads:

1. Re-check this mapping table.
2. Confirm `_getWasmConstant` names still match exported core symbols.
3. Run wrapper readiness/fallback tests and core memory mapping tests.
4. If addresses or sizes changed intentionally, update this document and
   migration notes in the same commit.
