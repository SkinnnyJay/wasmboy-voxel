// Load/Read functionality for memory
import { checkReadTraps } from './readTraps';
import { getWasmBoyOffsetFromGameBoyOffset } from './memoryMap';
import { concatenateBytes } from '../helpers/index';
import { Breakpoints } from '../debug/breakpoints';

export function eightBitLoadFromGBMemory(gameboyOffset: i32): i32 {
  const wasmBoyOffset = getWasmBoyOffsetFromGameBoyOffset(gameboyOffset);
  if (wasmBoyOffset < 0) {
    return 0xff;
  }
  return <i32>load<u8>(wasmBoyOffset);
}

export function eightBitLoadFromGBMemoryWithTraps(offset: i32): i32 {
  if (offset === Breakpoints.readGbMemory) {
    Breakpoints.lastBreakpointAddress = offset;
    Breakpoints.lastBreakpointAccess = 0; // read
    Breakpoints.reachedBreakpoint = true;
  }

  let readTrapResult = checkReadTraps(offset);
  return readTrapResult === -1 ? eightBitLoadFromGBMemory(offset) : <u8>readTrapResult;
}

// TODO: Rename this to sixteenBitLoadFromGBMemoryWithTraps
// Inlined because closure compiler inlines
export function sixteenBitLoadFromGBMemory(offset: i32): i32 {
  // Get our low byte
  let lowByteReadTrapResult = checkReadTraps(offset);
  let lowByte = lowByteReadTrapResult === -1 ? eightBitLoadFromGBMemory(offset) : lowByteReadTrapResult;

  // Get the next offset for the second byte
  let nextOffset = offset + 1;

  // Get our high byte
  let highByteReadTrapResult = checkReadTraps(nextOffset);
  let highByte = highByteReadTrapResult === -1 ? eightBitLoadFromGBMemory(nextOffset) : highByteReadTrapResult;

  // Concatenate the bytes and return
  return concatenateBytes(highByte, lowByte);
}

export function loadBooleanDirectlyFromWasmMemory(offset: i32): boolean {
  return <i32>load<u8>(offset) > 0;
}
