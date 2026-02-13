const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert');

const BASELINE_DIR = path.join(__dirname, '../baseline/snapshots');
const SUMMARY_PATH = path.join(BASELINE_DIR, 'summary.json');

function sha256HexFromNumberArray(input) {
  const bytes = Buffer.from(input);
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

describe('baseline snapshot regression', () => {
  it('should keep summary and snapshot files in sync', () => {
    assert(fs.existsSync(SUMMARY_PATH), 'summary.json should exist');
    const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf8'));
    assert(Array.isArray(summary.roms), 'summary.roms should be an array');
    assert(summary.roms.length > 0, 'summary.roms should not be empty');

    summary.roms.forEach((entry) => {
      const snapshotPath = path.resolve(process.cwd(), entry.outputFile);
      assert(fs.existsSync(snapshotPath), `snapshot file should exist: ${snapshotPath}`);
      const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

      assert(Array.isArray(snapshot.tileData), 'snapshot.tileData should be an array');
      assert(Array.isArray(snapshot.oamData), 'snapshot.oamData should be an array');
      assert(snapshot.registers && typeof snapshot.registers === 'object', 'snapshot.registers should exist');

      const computedTileHash = sha256HexFromNumberArray(snapshot.tileData);
      const computedOamHash = sha256HexFromNumberArray(snapshot.oamData);

      assert.strictEqual(
        computedTileHash,
        entry.tileDataSha256,
        `tile checksum mismatch for ${entry.rom}`,
      );
      assert.strictEqual(
        computedOamHash,
        entry.oamDataSha256,
        `oam checksum mismatch for ${entry.rom}`,
      );
    });
  });
});
