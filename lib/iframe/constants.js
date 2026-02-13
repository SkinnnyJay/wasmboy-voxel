/**
 * Iframe <-> parent message protocol for emulator control and events.
 * Parent posts to iframe with emulator:* types; iframe posts to parent with iframe:* types.
 */
export const IFRAME_MESSAGE_TYPE = {
  /** From iframe to parent when a memory breakpoint fires. */
  BREAKPOINT: 'iframe:breakpoint',
  /** Parent -> iframe: set memory breakpoint. Payload: { address, access }. */
  SET_MEMORY_BREAKPOINT: 'emulator:setMemoryBreakpoint',
  /** Parent -> iframe: clear breakpoint by id. Payload: { id }. */
  CLEAR_MEMORY_BREAKPOINT: 'emulator:clearMemoryBreakpoint',
  /** Parent -> iframe: clear all breakpoints. */
  CLEAR_ALL_MEMORY_BREAKPOINTS: 'emulator:clearAllMemoryBreakpoints',
  /** From iframe to parent: response to a request. Payload: { messageId, response?, error? }. */
  RESPONSE: 'emulator:response',
  /** From iframe to parent when a plugin hook runs. Payload: { hook, payload }. */
  PLUGIN_HOOK: 'iframe:pluginHook',
  /** Parent -> iframe: get background map debug image. Response: { width, height, data } or null. */
  GET_BACKGROUND_MAP_IMAGE: 'emulator:getBackgroundMapImage',
  /** Parent -> iframe: get tile data debug image. Response: { width, height, data } or null. */
  GET_TILE_DATA_IMAGE: 'emulator:getTileDataImage',
  /** Parent -> iframe: get OAM sprites debug image. Response: { width, height, data } or null. */
  GET_OAM_SPRITES_IMAGE: 'emulator:getOamSpritesImage',
  /** Parent -> iframe: get CPU registers. Response: object or null. */
  GET_CPU_REGISTERS: 'emulator:getCPURegisters',
  /** Parent -> iframe: get timer state. Response: object or null. */
  GET_TIMER_STATE: 'emulator:getTimerState',
  /** Parent -> iframe: get LCD state. Response: object or null. */
  GET_LCD_STATE: 'emulator:getLCDState',
  /** Parent -> iframe: get per-scanline parameters. Response: array of [scx,scy,wx,wy] or null. */
  GET_SCANLINE_PARAMETERS: 'emulator:getScanlineParameters'
};
