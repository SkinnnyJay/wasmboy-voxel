export interface WasmBoyControllerLike {
  ResponsiveGamepad: unknown;
  enableDefaultJoypad(): void;
  disableDefaultJoypad(): void;
  setJoypadState(state: unknown): void;
}

export const WasmBoyController: WasmBoyControllerLike;
