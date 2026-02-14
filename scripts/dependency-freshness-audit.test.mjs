import assert from 'node:assert/strict';
import test from 'node:test';
import { collectDependencyFreshness, parseOutdatedJson } from './dependency-freshness-audit.mjs';
import { UNPRINTABLE_VALUE } from './test-helpers.mjs';

test('parseOutdatedJson returns empty map for empty npm outdated output', () => {
  assert.deepEqual(parseOutdatedJson(''), {});
  assert.deepEqual(parseOutdatedJson('\n  \n'), {});
});

test('parseOutdatedJson parses valid npm outdated json payloads', () => {
  const payload = JSON.stringify({
    zod: { current: '4.1.0', wanted: '4.1.1', latest: '4.1.11', location: '/workspace/packages/api' },
  });

  const parsed = parseOutdatedJson(payload);

  assert.equal(typeof parsed, 'object');
  assert.equal(parsed.zod.latest, '4.1.11');
});

test('parseOutdatedJson rejects invalid payload types and malformed json', () => {
  assert.throws(() => parseOutdatedJson(42), /Invalid npm outdated output: 42/u);
  assert.throws(() => parseOutdatedJson(UNPRINTABLE_VALUE), /Invalid npm outdated output: \[unprintable\]/u);
  assert.throws(() => parseOutdatedJson('[]'), /Invalid npm outdated JSON structure/u);
  assert.throws(() => parseOutdatedJson('{this-is-not-json'), /JSON|Unexpected|invalid/u);
});

test('collectDependencyFreshness aggregates outdated counts by workspace using runner results', () => {
  const runOutdated = (_repoRoot, workspacePath) => {
    if (workspacePath === '.') {
      return { status: 0, stdout: '' };
    }
    if (workspacePath === 'packages/api') {
      return {
        status: 1,
        stdout: JSON.stringify({
          zod: { wanted: '4.1.1', latest: '4.1.11', location: '/workspace/packages/api' },
        }),
      };
    }
    if (workspacePath === 'packages/cli') {
      return {
        status: 1,
        stdout: JSON.stringify({
          vitest: { wanted: '4.0.1', latest: '4.0.18', location: '/workspace/packages/cli' },
          typescript: { wanted: '5.9.2', latest: '5.9.3', location: '/workspace/packages/cli' },
        }),
      };
    }
    return { status: 0, stdout: '' };
  };

  const report = collectDependencyFreshness({
    repoRoot: '/workspace',
    workspacePaths: ['.', 'packages/api', 'packages/cli', 'apps/debugger'],
    runOutdated,
  });

  assert.equal(report.workspaces.length, 4);
  assert.equal(report.totalOutdatedCount, 3);
  assert.equal(report.workspaces[0]?.workspacePath, '.');
  assert.equal(report.workspaces[0]?.outdatedCount, 0);
  assert.equal(report.workspaces[1]?.workspacePath, 'packages/api');
  assert.equal(report.workspaces[1]?.outdatedCount, 1);
  assert.equal(report.workspaces[2]?.workspacePath, 'packages/cli');
  assert.equal(report.workspaces[2]?.outdatedCount, 2);
});
