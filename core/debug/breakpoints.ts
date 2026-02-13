// Breakpoints for memory / cpu
export class Breakpoints {
  static programCounter: i32 = -1;
  static readGbMemory: i32 = -1;
  static writeGbMemory: i32 = -1;
  static reachedBreakpoint: boolean = false;
  /** Last address that triggered a breakpoint (read or write). */
  static lastBreakpointAddress: i32 = -1;
  /** 0 = read, 1 = write. */
  static lastBreakpointAccess: i32 = 0;
}

export function breakpoint(): void {
  Breakpoints.reachedBreakpoint = true;
}

export function setProgramCounterBreakpoint(breakpoint: i32): void {
  Breakpoints.programCounter = breakpoint;
}

export function resetProgramCounterBreakpoint(): void {
  Breakpoints.programCounter = -1;
}

export function setReadGbMemoryBreakpoint(breakpoint: i32): void {
  Breakpoints.readGbMemory = breakpoint;
}

export function resetReadGbMemoryBreakpoint(): void {
  Breakpoints.readGbMemory = -1;
}

export function setWriteGbMemoryBreakpoint(breakpoint: i32): void {
  Breakpoints.writeGbMemory = breakpoint;
}

export function resetWriteGbMemoryBreakpoint(): void {
  Breakpoints.writeGbMemory = -1;
}

export function getLastBreakpointAddress(): i32 {
  return Breakpoints.lastBreakpointAddress;
}

export function getLastBreakpointAccess(): i32 {
  return Breakpoints.lastBreakpointAccess;
}
