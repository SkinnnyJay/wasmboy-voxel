import {
  CONTRACT_VERSION_V1,
  ContractRegistry,
  V1Schemas,
  validateContractPayload,
  validateRegistryPayload,
} from '@wasmboy/api';

const EMPTY_BYTE = 0;

function createPlaceholderSnapshot() {
  return {
    version: CONTRACT_VERSION_V1,
    registers: {
      scx: 0,
      scy: 0,
      wx: 0,
      wy: 0,
      lcdc: 0,
      bgp: 0,
      obp0: 0,
      obp1: 0,
    },
    tileData: Array.from({ length: 0x1800 }, () => EMPTY_BYTE),
    bgTileMap: Array.from({ length: 0x400 }, () => EMPTY_BYTE),
    windowTileMap: Array.from({ length: 0x400 }, () => EMPTY_BYTE),
    oamData: Array.from({ length: 0xa0 }, () => EMPTY_BYTE),
  };
}

export const contractsClient = {
  createPlaceholderSnapshotValidation() {
    return validateContractPayload(V1Schemas.PpuSnapshotSchema, createPlaceholderSnapshot());
  },
  validateSnapshotPayload(payload: unknown) {
    return validateRegistryPayload(CONTRACT_VERSION_V1, 'ppuSnapshot', payload);
  },
  getRegistrySummary() {
    const contracts = Object.keys(ContractRegistry[CONTRACT_VERSION_V1]);
    return {
      version: CONTRACT_VERSION_V1,
      contracts,
    };
  },
};
