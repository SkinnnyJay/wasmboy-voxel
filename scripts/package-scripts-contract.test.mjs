import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

function readPackageScripts() {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.scripts ?? {};
}

function readPrecommitPrettierIgnore() {
  const ignorePath = path.resolve(process.cwd(), '.prettierignore.precommit');
  return fs.readFileSync(ignorePath, 'utf8');
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

test('artifact cleanup scripts expose default, dry-run, and json variants', () => {
  const scripts = readPackageScripts();

  assert.equal(scripts['clean:artifacts:precommit'], 'node scripts/clean-accidental-build-artifacts.mjs');
  assert.equal(scripts['clean:artifacts:precommit:dry-run'], 'node scripts/clean-accidental-build-artifacts.mjs --dry-run');
  assert.equal(scripts['clean:artifacts:precommit:json'], 'node scripts/clean-accidental-build-artifacts.mjs --dry-run --json');
});

test('generated artifact guard scripts expose default and json variants', () => {
  const scripts = readPackageScripts();

  assert.equal(scripts['guard:generated-artifacts:precommit'], 'node scripts/guard-generated-artifacts-precommit.mjs');
  assert.equal(scripts['guard:generated-artifacts:precommit:json'], 'node scripts/guard-generated-artifacts-precommit.mjs --json');
});

test('precommit formatter excludes migration workspace packages and apps', () => {
  const scripts = readPackageScripts();
  assert.equal(
    scripts['precommit:format'],
    'pretty-quick --staged --ignore-path .prettierignore.precommit',
    'precommit formatter should route through dedicated ignore file to avoid workspace formatting drift',
  );

  const ignoreContents = readPrecommitPrettierIgnore();
  assert.match(ignoreContents, /^apps\/\*\*$/mu, '.prettierignore.precommit should exclude apps/**');
  assert.match(ignoreContents, /^packages\/\*\*$/mu, '.prettierignore.precommit should exclude packages/**');
});
