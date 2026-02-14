/**
 * Capture baseline PPU snapshot JSON/checksums/timings for locally available ROMs.
 *
 * Output:
 * - test/baseline/snapshots/*.snapshot.json
 * - test/baseline/snapshots/summary.json
 *
 * Run:
 *   node --experimental-worker test/integration/capture-baseline-snapshots.js
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const WASMBOY_INITIALIZE_OPTIONS = {
  headless: true,
  gameboySpeed: 100.0,
  isGbcEnabled: true
};

const TEST_ROMS_ROOT = path.resolve(__dirname, '../performance/testroms');
const OUTPUT_ROOT = path.resolve(__dirname, '../baseline/snapshots');
const RUNTIME_CJS_PATH = path.join(os.tmpdir(), 'wasmboy-runtime-snapshot.cjs');

function loadWasmBoyRuntime() {
  const sourcePath = path.resolve(__dirname, '../../dist/wasmboy.wasm.cjs.js');
  fs.mkdirSync(path.dirname(RUNTIME_CJS_PATH), { recursive: true });
  fs.copyFileSync(sourcePath, RUNTIME_CJS_PATH);
  return require(RUNTIME_CJS_PATH).WasmBoy;
}

const WasmBoy = loadWasmBoyRuntime();

// Must match voxel-wrapper.ts constants.
const TILE_DATA_START = 0x8000;
const TILE_DATA_END_EXCLUSIVE = 0x9800;
const BG_TILEMAP_0_START = 0x9800;
const BG_TILEMAP_1_START = 0x9c00;
const TILEMAP_SIZE = 0x400;
const OAM_START = 0xfe00;
const OAM_END_EXCLUSIVE = 0xfea0;
const REG_LCDC = 0xff40;
const REG_SCY = 0xff42;
const REG_SCX = 0xff43;
const REG_WY = 0xff4a;
const REG_WX = 0xff4b;
const REG_BGP = 0xff47;
const REG_OBP0 = 0xff48;
const REG_OBP1 = 0xff49;
const LCDC_BG_TILEMAP_SELECT_BIT = 0x08;
const LCDC_WINDOW_TILEMAP_SELECT_BIT = 0x40;
const GAME_MEMORY_BASE_CONSTANT = 'DEBUG_GAMEBOY_MEMORY_LOCATION';
const PLAY_DURATION_MS = 250;

function listRomsRecursive(rootPath) {
  const files = [];

  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const lower = entry.name.toLowerCase();
        if (lower.endsWith('.gb') || lower.endsWith('.gbc')) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(rootPath);
  files.sort();
  return files;
}

function sha256Hex(data) {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

async function readGameMemorySection(base, start, endExclusive) {
  return WasmBoy._getWasmMemorySection(base + start, base + endExclusive);
}

async function readGameMemoryByte(base, address) {
  const data = await readGameMemorySection(base, address, address + 1);
  return data[0] ?? 0;
}

async function captureSnapshotForRom(romAbsolutePath) {
  const romBytes = new Uint8Array(fs.readFileSync(romAbsolutePath));

  await WasmBoy.reset(WASMBOY_INITIALIZE_OPTIONS);
  await WasmBoy.loadROM(romBytes);

  const executeStart = performance.now();
  await WasmBoy.play();
  await new Promise(resolve => setTimeout(resolve, PLAY_DURATION_MS));
  await WasmBoy.pause();
  const executeEnd = performance.now();

  const base = await WasmBoy._getWasmConstant(GAME_MEMORY_BASE_CONSTANT);
  if (typeof base !== 'number' || base <= 0) {
    throw new Error(`Could not resolve ${GAME_MEMORY_BASE_CONSTANT} for ${romAbsolutePath}`);
  }

  const snapshotStart = performance.now();
  const lcdc = await readGameMemoryByte(base, REG_LCDC);
  const bgMapStart = (lcdc & LCDC_BG_TILEMAP_SELECT_BIT) !== 0 ? BG_TILEMAP_1_START : BG_TILEMAP_0_START;
  const windowMapStart = (lcdc & LCDC_WINDOW_TILEMAP_SELECT_BIT) !== 0 ? BG_TILEMAP_1_START : BG_TILEMAP_0_START;

  const [tileData, bgTileMap, windowTileMap, oamData, scx, scy, wx, wy, bgp, obp0, obp1] = await Promise.all([
    readGameMemorySection(base, TILE_DATA_START, TILE_DATA_END_EXCLUSIVE),
    readGameMemorySection(base, bgMapStart, bgMapStart + TILEMAP_SIZE),
    readGameMemorySection(base, windowMapStart, windowMapStart + TILEMAP_SIZE),
    readGameMemorySection(base, OAM_START, OAM_END_EXCLUSIVE),
    readGameMemoryByte(base, REG_SCX),
    readGameMemoryByte(base, REG_SCY),
    readGameMemoryByte(base, REG_WX),
    readGameMemoryByte(base, REG_WY),
    readGameMemoryByte(base, REG_BGP),
    readGameMemoryByte(base, REG_OBP0),
    readGameMemoryByte(base, REG_OBP1)
  ]);
  const snapshotEnd = performance.now();

  const snapshot = {
    metadata: {
      rom: path.relative(process.cwd(), romAbsolutePath),
      playDurationMs: PLAY_DURATION_MS,
      capturedAtUtc: new Date().toISOString(),
      memoryBase: base,
      bgTileMapSource: `0x${bgMapStart.toString(16)}`,
      windowTileMapSource: `0x${windowMapStart.toString(16)}`,
      metrics: {
        executeFramesMs: Number((executeEnd - executeStart).toFixed(3)),
        snapshotReadMs: Number((snapshotEnd - snapshotStart).toFixed(3))
      }
    },
    registers: { scx, scy, wx, wy, lcdc, bgp, obp0, obp1 },
    tileData: Array.from(tileData),
    bgTileMap: Array.from(bgTileMap),
    windowTileMap: Array.from(windowTileMap),
    oamData: Array.from(oamData),
    checksums: {
      tileDataSha256: sha256Hex(Buffer.from(tileData)),
      bgTileMapSha256: sha256Hex(Buffer.from(bgTileMap)),
      windowTileMapSha256: sha256Hex(Buffer.from(windowTileMap)),
      oamDataSha256: sha256Hex(Buffer.from(oamData))
    }
  };

  return snapshot;
}

async function main() {
  const roms = listRomsRecursive(TEST_ROMS_ROOT);
  if (roms.length === 0) {
    throw new Error(`No ROM files found in ${TEST_ROMS_ROOT}`);
  }

  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
  await WasmBoy.config(WASMBOY_INITIALIZE_OPTIONS);

  const summary = [];
  for (const romPath of roms) {
    const snapshot = await captureSnapshotForRom(romPath);
    const romStem = path.basename(romPath, path.extname(romPath));
    const outFile = path.join(OUTPUT_ROOT, `${romStem}.snapshot.json`);
    fs.writeFileSync(outFile, JSON.stringify(snapshot, null, 2));

    summary.push({
      rom: snapshot.metadata.rom,
      outputFile: path.relative(process.cwd(), outFile),
      executeFramesMs: snapshot.metadata.metrics.executeFramesMs,
      snapshotReadMs: snapshot.metadata.metrics.snapshotReadMs,
      tileDataSha256: snapshot.checksums.tileDataSha256,
      oamDataSha256: snapshot.checksums.oamDataSha256
    });
  }

  const summaryPath = path.join(OUTPUT_ROOT, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({ generatedAtUtc: new Date().toISOString(), roms: summary }, null, 2));

  console.log(`Captured ${summary.length} baseline snapshots.`);
  console.log(`Summary: ${path.relative(process.cwd(), summaryPath)}`);
  process.exit(0);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
