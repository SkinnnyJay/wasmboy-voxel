# Joypad register initialization fix

Fixes the Game Boy joypad register (0xFF00) initialization bug that causes Tetris and other games to soft-reset on startup.

## Root cause

WasmBoy's `initializeVarious()` writes `0xCF` to 0xFF00 via `eightBitStoreIntoGBMemory()`, which bypasses the memory write trap. The Joypad class state (`joypadRegisterFlipped`, `isDpadType`, `isButtonType`) was never synchronized. With `joypadRegisterFlipped = 0`, `getJoypadState()` returned lower nibble `0x0` (all buttons pressed) when neither d-pad nor button type was selected. Tetris interprets that as soft-reset.

## Changes

1. **core/joypad/joypad.ts**: Initialize `joypadRegisterFlipped` to `0xFF` so power-on reads as all buttons released.
2. **core/joypad/joypad.ts**: In `getJoypadState()`, when neither d-pad nor button type is selected, set lower nibble to `0xF`: `joypadRegister = joypadRegister | 0x0f`.
3. **core/core.ts**: After each `eightBitStoreIntoGBMemory(0xff00, 0xcf)` in `initializeVarious()`, call `Joypad.updateJoypad(0xcf)` to sync internal state.

## References

- [Pan Docs joypad register](https://gbdev.io/pandocs/Joypad_Input.html)
- Upstream: https://github.com/torch2424/wasmboy
