import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const ARTIFACT_DIRECTORY = path.resolve('./temp/playwright');
const SCREENSHOT_PATH = path.join(ARTIFACT_DIRECTORY, 'headless-smoke.png');
const RESULT_PATH = path.join(ARTIFACT_DIRECTORY, 'headless-smoke-result.json');
const DIST_RUNTIME_PATH = path.resolve('./dist/wasmboy.wasm.iife.js');
const ROM_PATH = path.resolve('./test/performance/testroms/back-to-color/back-to-color.gbc');
const SNAPSHOT_TILE_LENGTH = 0x1800;

const CHROME_CANDIDATE_PATHS = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
];

async function resolveChromiumExecutablePath() {
  for (const candidatePath of CHROME_CANDIDATE_PATHS) {
    if (!candidatePath) {
      continue;
    }

    try {
      await fs.access(candidatePath);
      return candidatePath;
    } catch {
      // Candidate unavailable; continue searching.
    }
  }

  throw new Error('Unable to locate a Chromium executable. Set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to a valid browser binary.');
}

await fs.mkdir(ARTIFACT_DIRECTORY, { recursive: true });

const executablePath = await resolveChromiumExecutablePath();
const romBytes = await fs.readFile(ROM_PATH);

const browser = await chromium.launch({
  headless: true,
  executablePath,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const consoleErrors = [];
page.on('console', message => {
  if (message.type() === 'error') {
    consoleErrors.push(message.text());
  }
});

await page.goto('about:blank');
await page.addScriptTag({ path: DIST_RUNTIME_PATH });

const evaluationResult = await page.evaluate(
  async ({ romArray, expectedTileLength }) => {
    const runtimeGlobal = globalThis.WasmBoy;
    const runtimeApi =
      runtimeGlobal && typeof runtimeGlobal.config === 'function'
        ? runtimeGlobal
        : runtimeGlobal && runtimeGlobal.WasmBoy && typeof runtimeGlobal.WasmBoy.config === 'function'
        ? runtimeGlobal.WasmBoy
        : null;
    if (!runtimeApi) {
      return {
        ok: false,
        error: 'missing-wasmboy-global',
        availableGlobals: Object.keys(globalThis)
          .filter(key => key.toLowerCase().includes('wasmboy'))
          .slice(0, 10),
      };
    }

    await runtimeApi.config({
      headless: true,
      mainThread: true,
      gameboySpeed: 100.0,
      isGbcEnabled: true,
    });

    await runtimeApi.loadROM(new Uint8Array(romArray));
    for (let frame = 0; frame < 8; frame += 1) {
      await runtimeApi._runWasmExport('executeFrame', []);
    }

    const snapshotBuffer = await runtimeApi._getPpuSnapshotBuffer();
    const parsedSnapshot = snapshotBuffer ? runtimeApi._parsePpuSnapshotBuffer(snapshotBuffer) : null;
    const parsedTileLength = parsedSnapshot && parsedSnapshot.tileData ? parsedSnapshot.tileData.length : 0;

    await runtimeApi.pause();

    return {
      ok: parsedTileLength === expectedTileLength,
      parsedTileLength,
      hasSnapshotBuffer: Boolean(snapshotBuffer),
    };
  },
  {
    romArray: Array.from(romBytes),
    expectedTileLength: SNAPSHOT_TILE_LENGTH,
  },
);

await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
await browser.close();

await fs.writeFile(
  RESULT_PATH,
  JSON.stringify(
    {
      executablePath,
      consoleErrors,
      evaluationResult,
      artifactPaths: {
        screenshot: SCREENSHOT_PATH,
        result: RESULT_PATH,
      },
    },
    null,
    2,
  ),
  'utf8',
);

assert.equal(consoleErrors.length, 0, `Browser console contained errors: ${consoleErrors.join(' | ')}`);
assert.equal(evaluationResult.ok, true, 'Playwright headless smoke did not produce a valid snapshot tile payload.');
