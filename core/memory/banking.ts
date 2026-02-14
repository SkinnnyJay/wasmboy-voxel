// Function to handle rom/rambanking
import { Memory } from './memory';
import { concatenateBytes, checkBitOnByte, splitLowByte } from '../helpers/index';

function updateRamBankingEnabledState(value: i32): void {
  let romEnableByte = value & 0x0f;
  if (romEnableByte === 0x00) {
    Memory.isRamBankingEnabled = false;
  } else if (romEnableByte === 0x0a) {
    Memory.isRamBankingEnabled = true;
  }
}

function updateRomBankLowBits(offset: i32, value: i32, isMBC1: bool, isMBC2: bool): void {
  let isMBC5 = Memory.isMBC5;
  if (!isMBC5 || offset <= 0x2fff) {
    let currentRomBank = Memory.currentRomBank;
    if (isMBC2) {
      currentRomBank = value & 0x0f;
    }

    // Set the number of bottom bytes from the MBC type
    let romBankLowerBits = value;
    if (isMBC1) {
      // Only want the bottom 5
      romBankLowerBits = romBankLowerBits & 0x1f;
      currentRomBank &= 0xe0;
    } else if (Memory.isMBC3) {
      // Only Want the bottom 7
      romBankLowerBits = romBankLowerBits & 0x7f;
      currentRomBank &= 0x80;
    } else if (isMBC5) {
      // Keep high ROM bank bit (set by 0x3000-0x3FFF), update lower 8 bits.
      currentRomBank &= 0x100;
    }

    // Set the lower bytes
    currentRomBank |= romBankLowerBits;
    Memory.currentRomBank = currentRomBank;
    return;
  }

  // MBC5 high ROM bank bit (bit 8).
  let lowByte = splitLowByte(Memory.currentRomBank);
  let highByte = value & 0x01;
  Memory.currentRomBank = concatenateBytes(highByte, lowByte) & 0x1ff;
}

function updateRamBankOrMbc1UpperRomBits(value: i32, isMBC1: bool, isMBC2: bool): void {
  // ROM / RAM Banking, MBC2 doesn't do this
  if (isMBC2) {
    return;
  }

  if (isMBC1 && Memory.isMBC1RomModeEnabled) {
    // Do an upper bit rom bank for MBC 1
    // Remove upper bits of currentRomBank
    let currentRomBank = Memory.currentRomBank & 0x1f;
    let romBankHigherBits = value & 0xe0;

    currentRomBank |= romBankHigherBits;
    Memory.currentRomBank = currentRomBank;
    return;
  }

  if (Memory.isMBC3) {
    if (value >= 0x08 && value <= 0x0c) {
      Memory.mbc3RtcRegisterSelect = value;
      return;
    }
    Memory.mbc3RtcRegisterSelect = -1;
  }

  let ramBankBits: i32 = value;

  if (!Memory.isMBC5) {
    // Get the bottom 2 bits
    ramBankBits &= 0x03;
  } else {
    // Get the bottom nibble
    ramBankBits &= 0x0f;
  }

  // Set our ram bank
  Memory.currentRamBank = ramBankBits;
}

function updateMbc1RomMode(value: i32, isMBC1: bool, isMBC2: bool): void {
  if (isMBC2) {
    return;
  }

  if (isMBC1) {
    Memory.isMBC1RomModeEnabled = checkBitOnByte(0, <u8>value);
    return;
  }

  if (Memory.isMBC3) {
    let latchWriteValue = value & 0x01;
    if (Memory.mbc3RtcLastLatchWrite === 0 && latchWriteValue === 1) {
      Memory.mbc3RtcLatchedSeconds = Memory.mbc3RtcSeconds;
      Memory.mbc3RtcLatchedMinutes = Memory.mbc3RtcMinutes;
      Memory.mbc3RtcLatchedHours = Memory.mbc3RtcHours;
      Memory.mbc3RtcLatchedDayLow = Memory.mbc3RtcDayLow;
      Memory.mbc3RtcLatchedDayHigh = Memory.mbc3RtcDayHigh;
      Memory.mbc3RtcIsLatched = true;
    }
    Memory.mbc3RtcLastLatchWrite = latchWriteValue;
  }
}

export function readMbc3RtcRegister(): i32 {
  let selectedRegister = Memory.mbc3RtcRegisterSelect;
  if (selectedRegister < 0x08 || selectedRegister > 0x0c) {
    return 0xff;
  }

  let isLatched = Memory.mbc3RtcIsLatched;
  switch (selectedRegister) {
    case 0x08:
      return isLatched ? Memory.mbc3RtcLatchedSeconds : Memory.mbc3RtcSeconds;
    case 0x09:
      return isLatched ? Memory.mbc3RtcLatchedMinutes : Memory.mbc3RtcMinutes;
    case 0x0a:
      return isLatched ? Memory.mbc3RtcLatchedHours : Memory.mbc3RtcHours;
    case 0x0b:
      return isLatched ? Memory.mbc3RtcLatchedDayLow : Memory.mbc3RtcDayLow;
    default:
      return isLatched ? Memory.mbc3RtcLatchedDayHigh : Memory.mbc3RtcDayHigh;
  }
}

export function writeMbc3RtcRegister(value: i32): void {
  let selectedRegister = Memory.mbc3RtcRegisterSelect;
  if (selectedRegister < 0x08 || selectedRegister > 0x0c) {
    return;
  }

  switch (selectedRegister) {
    case 0x08:
      Memory.mbc3RtcSeconds = value & 0x3f;
      break;
    case 0x09:
      Memory.mbc3RtcMinutes = value & 0x3f;
      break;
    case 0x0a:
      Memory.mbc3RtcHours = value & 0x1f;
      break;
    case 0x0b:
      Memory.mbc3RtcDayLow = value & 0xff;
      break;
    default:
      Memory.mbc3RtcDayHigh = value & 0xc1;
      break;
  }
}

// Inlined because closure compiler inlines
export function handleBanking(offset: i32, value: i32): void {
  // Is rom Only does not bank
  if (Memory.isRomOnly) {
    return;
  }

  let isMBC1 = Memory.isMBC1;
  let isMBC2 = Memory.isMBC2;

  // Enable Ram Banking
  if (offset <= 0x1fff) {
    if (isMBC2 && !checkBitOnByte(4, <u8>value)) {
      // Do Nothing
      return;
    }
    updateRamBankingEnabledState(value);
    return;
  }

  if (offset <= 0x3fff) {
    updateRomBankLowBits(offset, value, isMBC1, isMBC2);
    return;
  }

  if (offset <= 0x5fff) {
    updateRamBankOrMbc1UpperRomBits(value, isMBC1, isMBC2);
    return;
  }

  if (offset <= 0x7fff) {
    updateMbc1RomMode(value, isMBC1, isMBC2);
  }
}

// Inlined because closure compiler inlines
export function getRomBankAddress(gameboyOffset: i32): i32 {
  let currentRomBank: u32 = Memory.currentRomBank;
  if (!Memory.isMBC5 && currentRomBank === 0) {
    currentRomBank = 1;
  }

  // Adjust our gameboy offset relative to zero for the gameboy memory map
  return <i32>(0x4000 * currentRomBank + (gameboyOffset - Memory.switchableCartridgeRomLocation));
}

// Inlined because closure compiler inlines
export function getRamBankAddress(gameboyOffset: i32): i32 {
  // Adjust our gameboy offset relative to zero for the gameboy memory map
  return <i32>(0x2000 * Memory.currentRamBank + (gameboyOffset - Memory.cartridgeRamLocation));
}
