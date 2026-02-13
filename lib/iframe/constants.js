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
  PLUGIN_HOOK: 'iframe:pluginHook'
};
