import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectDependencyFreshness,
  formatFreshnessReport,
  parseDependencyFreshnessArgs,
  parseOutdatedJson,
  resolveDependencyFreshnessTimeoutFromEnv,
} from './dependency-freshness-audit.mjs';
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

test('parseDependencyFreshnessArgs supports fail and timeout flags', () => {
  assert.deepEqual(parseDependencyFreshnessArgs([]), {
    showHelp: false,
    shouldFailOnOutdated: false,
    timeoutMsOverride: '',
  });
  assert.deepEqual(parseDependencyFreshnessArgs(['--fail-on-outdated']), {
    showHelp: false,
    shouldFailOnOutdated: true,
    timeoutMsOverride: '',
  });
  assert.deepEqual(parseDependencyFreshnessArgs(['--timeout-ms', '5000']), {
    showHelp: false,
    shouldFailOnOutdated: false,
    timeoutMsOverride: '5000',
  });
  assert.deepEqual(parseDependencyFreshnessArgs(['--timeout-ms=7000']), {
    showHelp: false,
    shouldFailOnOutdated: false,
    timeoutMsOverride: '7000',
  });
  assert.deepEqual(parseDependencyFreshnessArgs(['--help']), {
    showHelp: true,
    shouldFailOnOutdated: false,
    timeoutMsOverride: '',
  });
  assert.deepEqual(parseDependencyFreshnessArgs(['--fail-on-outdated', '--help', '--timeout-ms', '2000']), {
    showHelp: true,
    shouldFailOnOutdated: false,
    timeoutMsOverride: '',
  });
});

test('parseDependencyFreshnessArgs rejects malformed and duplicate arguments', () => {
  assert.throws(() => parseDependencyFreshnessArgs('--help'), /Expected argv to be an array\./u);
  assert.throws(() => parseDependencyFreshnessArgs(['--help', 3]), /Expected argv\[1\] to be a string\./u);
  assert.throws(() => parseDependencyFreshnessArgs(['--unknown']), /Unknown argument: --unknown/u);
  assert.throws(
    () => parseDependencyFreshnessArgs(['--fail-on-outdated', '--fail-on-outdated']),
    /Duplicate --fail-on-outdated flag received\./u,
  );
  assert.throws(
    () => parseDependencyFreshnessArgs(['--timeout-ms', '5000', '--timeout-ms=6000']),
    /Duplicate --timeout-ms flag received\./u,
  );
  assert.throws(() => parseDependencyFreshnessArgs(['--timeout-ms']), /Missing value for --timeout-ms argument\./u);
  assert.throws(() => parseDependencyFreshnessArgs(['--timeout-ms=']), /Missing value for --timeout-ms argument\./u);
  assert.throws(() => parseDependencyFreshnessArgs(['--timeout-ms==5000']), /Malformed inline value for --timeout-ms argument\./u);
});

test('collectDependencyFreshness aggregates outdated counts by workspace using runner results', () => {
  const runOutdatedCalls = [];
  const runOutdated = (_repoRoot, workspacePath) => {
    runOutdatedCalls.push(workspacePath);
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
  assert.deepEqual(runOutdatedCalls, ['.', 'packages/api', 'packages/cli', 'apps/debugger']);
});

test('formatFreshnessReport sorts package entries deterministically', () => {
  const formatted = formatFreshnessReport({
    generatedAtIso: '2026-02-14T00:00:00.000Z',
    totalOutdatedCount: 2,
    workspaces: [
      {
        workspacePath: 'packages/cli',
        outdatedCount: 2,
        outdatedPackages: {
          zod: { wanted: '4.1.0', latest: '4.1.11', location: '/workspace/packages/cli' },
          '@types/node': { wanted: '22.0.0', latest: '25.0.0', location: '/workspace/packages/cli' },
        },
      },
    ],
  });

  assert.match(
    formatted,
    /\[dependency:freshness\]\s+- @types\/node wanted=22\.0\.0 latest=25\.0\.0 location=\/workspace\/packages\/cli\n\[dependency:freshness\]\s+- zod wanted=4\.1\.0 latest=4\.1\.11 location=\/workspace\/packages\/cli/u,
  );
});

test('collectDependencyFreshness forwards configured timeout to workspace runner', () => {
  const observedTimeoutValues = [];

  const report = collectDependencyFreshness({
    repoRoot: '/workspace',
    workspacePaths: ['.', 'packages/api'],
    outdatedTimeoutMs: 4321,
    runOutdated: (_repoRoot, _workspacePath, timeoutMs) => {
      observedTimeoutValues.push(timeoutMs);
      return { status: 0, stdout: '' };
    },
  });

  assert.equal(report.totalOutdatedCount, 0);
  assert.deepEqual(observedTimeoutValues, [4321, 4321]);
});

test('resolveDependencyFreshnessTimeoutFromEnv parses and validates environment overrides', () => {
  assert.equal(resolveDependencyFreshnessTimeoutFromEnv({}), 120000);
  assert.equal(resolveDependencyFreshnessTimeoutFromEnv({ DEPENDENCY_FRESHNESS_NPM_TIMEOUT_MS: ' 9000 ' }), 9000);
  assert.equal(resolveDependencyFreshnessTimeoutFromEnv({}, '7000'), 7000);
  assert.equal(resolveDependencyFreshnessTimeoutFromEnv({ DEPENDENCY_FRESHNESS_NPM_TIMEOUT_MS: '9000' }, '7000'), 7000);
  assert.throws(
    () => resolveDependencyFreshnessTimeoutFromEnv({ DEPENDENCY_FRESHNESS_NPM_TIMEOUT_MS: '0' }),
    /Invalid DEPENDENCY_FRESHNESS_NPM_TIMEOUT_MS value: 0/u,
  );
  assert.throws(() => resolveDependencyFreshnessTimeoutFromEnv({}, '0'), /Invalid --timeout-ms value: 0/u);
  assert.throws(
    () => resolveDependencyFreshnessTimeoutFromEnv({ DEPENDENCY_FRESHNESS_NPM_TIMEOUT_MS: 'not-a-number' }),
    /Invalid DEPENDENCY_FRESHNESS_NPM_TIMEOUT_MS value: not-a-number/u,
  );
});
