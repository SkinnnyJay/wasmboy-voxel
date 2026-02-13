import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GET } from '../app/api/ai/debug/route';
import { contractsClient } from '../lib/contracts-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('debugger smoke', () => {
  it('contracts client returns registry summary', () => {
    const summary = contractsClient.getRegistrySummary();
    expect(summary.version).toBe('v1');
    expect(summary.contracts.length).toBeGreaterThan(0);
  });

  it('read-only AI debug endpoint returns JSON payload', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.readOnly).toBe(true);
  });

  it('key app routes and components exist', () => {
    const expectedPaths = [
      'app/page.tsx',
      'app/contracts/page.tsx',
      'app/error.tsx',
      'components/RomLoaderPanel.tsx',
      'components/EventLogPanel.tsx',
      'store/debugger-store.ts',
    ];

    expectedPaths.forEach((relativePath) => {
      const absolutePath = path.resolve(__dirname, '..', relativePath);
      expect(fs.existsSync(absolutePath)).toBe(true);
    });
  });
});
