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
      // Going to switch the whole thing
      currentRomBank &= 0x00;
    }

    // Set the lower bytes
    currentRomBank |= romBankLowerBits;
    Memory.currentRomBank = currentRomBank;
    return;
  }

  // TODO: MBC5 High bits Rom bank, check if this works, not sure about the value
  let lowByte = splitLowByte(Memory.currentRomBank);
  let highByte = <i32>(value > 0);
  Memory.currentRomBank = concatenateBytes(highByte, lowByte);
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
      // TODO: MBC3 RTC Register Select
    }
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
  }
  // TODO: MBC3 Latch Clock Data
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
