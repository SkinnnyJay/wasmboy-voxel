import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

function readPackageScripts() {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.scripts ?? {};
}

test('integration aggregate scripts route through headless cleanup wrappers', () => {
  const scripts = readPackageScripts();

  assert.match(
    scripts['test:integration'] ?? '',
    /test:integration:headless:clean/u,
    'test:integration should include the cleanup-wrapped headless command',
  );
  assert.match(
    scripts['test:integration:nobuild'] ?? '',
    /test:integration:headless:clean/u,
    'test:integration:nobuild should include the cleanup-wrapped headless command',
  );
  assert.match(
    scripts['test:integration:nobuild:ci'] ?? '',
    /test:integration:headless:clean:ci/u,
    'test:integration:nobuild:ci should include the CI cleanup-wrapped headless command',
  );
});

test('headless cleanup wrapper scripts run headless test then artifact cleanup', () => {
  const scripts = readPackageScripts();

  assert.equal(scripts['test:integration:headless:clean'], 'run-s test:integration:headless clean:artifacts:precommit');
  assert.equal(scripts['test:integration:headless:clean:ci'], 'run-s test:integration:headless:ci clean:artifacts:precommit');
});

test('artifact cleanup scripts expose default and dry-run variants', () => {
  const scripts = readPackageScripts();

  assert.equal(scripts['clean:artifacts:precommit'], 'node scripts/clean-accidental-build-artifacts.mjs');
  assert.equal(scripts['clean:artifacts:precommit:dry-run'], 'node scripts/clean-accidental-build-artifacts.mjs --dry-run');
});
