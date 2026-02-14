import { readFile } from 'node:fs/promises';

const REQUIRED_CORE_CONSTANTS = ['DEBUG_GAMEBOY_MEMORY_LOCATION', 'GBC_PALETTE_LOCATION', 'GBC_PALETTE_SIZE'];

const REQUIRED_WRAPPER_NUMERIC_CONSTANTS = {
  TILE_DATA_START: 0x8000,
  TILE_DATA_END_EXCLUSIVE: 0x9800,
  BG_TILEMAP_0_START: 0x9800,
  BG_TILEMAP_1_START: 0x9c00,
  TILEMAP_SIZE: 0x400,
  OAM_START: 0xfe00,
  OAM_END_EXCLUSIVE: 0xfea0,
  REG_LCDC: 0xff40,
  REG_SCY: 0xff42,
  REG_SCX: 0xff43,
  REG_WY: 0xff4a,
  REG_WX: 0xff4b,
  REG_BGP: 0xff47,
  REG_OBP0: 0xff48,
  REG_OBP1: 0xff49,
};

const REQUIRED_WRAPPER_CONSTANT_LOOKUPS = ['GBC_PALETTE_LOCATION', 'GBC_PALETTE_SIZE'];
const REQUIRED_GAME_MEMORY_BASE_CONSTANT = 'DEBUG_GAMEBOY_MEMORY_LOCATION';

/**
 * @param {unknown} value
 */
function formatErrorValue(value) {
  try {
    return String(value);
  } catch {
    return '[unprintable]';
  }
}

/**
 * @param {string} source
 */
function parseCoreConstants(source) {
  const exportedConstants = new Set();
  const exportRegex = /export const ([A-Z0-9_]+)\s*:\s*i32\s*=/gu;
  let match = exportRegex.exec(source);

  while (match) {
    const constantName = match[1];
    if (constantName) {
      exportedConstants.add(constantName);
    }
    match = exportRegex.exec(source);
  }

  return exportedConstants;
}

/**
 * @param {string} source
 * @param {string} constantName
 */
function parseWrapperNumericConstant(source, constantName) {
  const expression = String.raw`const ${constantName}\s*=\s*(0x[0-9a-fA-F]+|\d+);`;
  const constantRegex = new RegExp(expression, 'u');
  const match = source.match(constantRegex);

  if (!match || !match[1]) {
    return null;
  }

  const rawValue = match[1];
  if (rawValue.toLowerCase().startsWith('0x')) {
    return Number.parseInt(rawValue.slice(2), 16);
  }
  return Number.parseInt(rawValue, 10);
}

/**
 * @param {string} coreConstantsSource
 * @param {string} wrapperSource
 */
export function validateCoreWrapperMemoryLayout(coreConstantsSource, wrapperSource) {
  if (typeof coreConstantsSource !== 'string') {
    throw new Error(`Invalid core constants source: ${formatErrorValue(coreConstantsSource)}`);
  }
  if (typeof wrapperSource !== 'string') {
    throw new Error(`Invalid wrapper source: ${formatErrorValue(wrapperSource)}`);
  }

  const errors = [];
  const coreConstants = parseCoreConstants(coreConstantsSource);

  for (const requiredConstant of REQUIRED_CORE_CONSTANTS) {
    if (!coreConstants.has(requiredConstant)) {
      errors.push(`Missing core constant export: ${requiredConstant}`);
    }
  }

  const baseConstantMatch = wrapperSource.match(/const GAME_MEMORY_BASE_CONSTANT\s*=\s*'([^']+)';/u);
  if (!baseConstantMatch || !baseConstantMatch[1]) {
    errors.push('Missing GAME_MEMORY_BASE_CONSTANT declaration in voxel-wrapper.ts.');
  } else if (baseConstantMatch[1] !== REQUIRED_GAME_MEMORY_BASE_CONSTANT) {
    errors.push(`GAME_MEMORY_BASE_CONSTANT must equal "${REQUIRED_GAME_MEMORY_BASE_CONSTANT}" (received "${baseConstantMatch[1]}").`);
  }

  for (const [constantName, expectedValue] of Object.entries(REQUIRED_WRAPPER_NUMERIC_CONSTANTS)) {
    const actualValue = parseWrapperNumericConstant(wrapperSource, constantName);
    if (actualValue === null) {
      errors.push(`Missing wrapper numeric constant: ${constantName}`);
      continue;
    }
    if (actualValue !== expectedValue) {
      errors.push(`Wrapper constant ${constantName} must equal 0x${expectedValue.toString(16)} (received 0x${actualValue.toString(16)}).`);
    }
  }

  for (const constantName of REQUIRED_WRAPPER_CONSTANT_LOOKUPS) {
    const lookupRegex = new RegExp(String.raw`_getWasmConstant\('${constantName}'\)`, 'u');
    if (!lookupRegex.test(wrapperSource)) {
      errors.push(`Missing wrapper _getWasmConstant lookup for ${constantName}.`);
    }
  }

  if (!/api\._getWasmMemorySection\(\s*gameMemoryBase \+ start,\s*gameMemoryBase \+ endExclusive\s*\)/u.test(wrapperSource)) {
    errors.push('readGameMemorySection must add gameMemoryBase to both start and endExclusive offsets.');
  }

  if (!/internal\._getWasmMemorySection\(\s*base \+ start,\s*base \+ endExclusive\s*\)/u.test(wrapperSource)) {
    errors.push('readMemory must add resolved base offset to both start and endExclusive values.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * @param {URL} fileUrl
 */
async function readUtf8File(fileUrl) {
  return readFile(fileUrl, 'utf8');
}

/**
 * @param {{
 *   coreConstantsFileUrl?: URL;
 *   wrapperFileUrl?: URL;
 * }} [overrides]
 */
export async function runCoreWrapperMemoryLayoutCheck(overrides = {}) {
  const coreConstantsFileUrl = overrides.coreConstantsFileUrl ?? new URL('../core/constants.ts', import.meta.url);
  const wrapperFileUrl = overrides.wrapperFileUrl ?? new URL('../voxel-wrapper.ts', import.meta.url);

  const [coreConstantsSource, wrapperSource] = await Promise.all([readUtf8File(coreConstantsFileUrl), readUtf8File(wrapperFileUrl)]);

  return validateCoreWrapperMemoryLayout(coreConstantsSource, wrapperSource);
}
