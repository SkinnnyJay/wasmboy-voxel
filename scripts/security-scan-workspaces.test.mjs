import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectWorkspaceSecurityScan,
  parseAuditJson,
  parseSecurityScanArgs,
  resolveSecurityScanTimeoutFromEnv,
} from './security-scan-workspaces.mjs';
import { UNPRINTABLE_VALUE } from './test-helpers.mjs';

test('parseAuditJson accepts empty output as empty object', () => {
  assert.deepEqual(parseAuditJson(''), {});
  assert.deepEqual(parseAuditJson('\n\n'), {});
});

test('parseAuditJson parses valid audit payloads', () => {
  const payload = JSON.stringify({
    metadata: {
      vulnerabilities: {
        info: 0,
        low: 1,
        moderate: 2,
        high: 3,
        critical: 4,
        total: 10,
      },
    },
  });

  const parsed = parseAuditJson(payload);

  assert.equal(parsed.metadata.vulnerabilities.total, 10);
});

test('parseAuditJson rejects invalid output values and malformed json', () => {
  assert.throws(() => parseAuditJson(42), /Invalid npm audit output: 42/u);
  assert.throws(() => parseAuditJson(UNPRINTABLE_VALUE), /Invalid npm audit output: \[unprintable\]/u);
  assert.throws(() => parseAuditJson('[]'), /Invalid npm audit JSON structure/u);
  assert.throws(() => parseAuditJson('{bad-json'), /JSON|Unexpected|invalid/u);
});

test('parseSecurityScanArgs supports fail and timeout flags', () => {
  assert.deepEqual(parseSecurityScanArgs([]), {
    showHelp: false,
    failOnVulnerabilities: false,
    timeoutMsOverride: '',
  });
  assert.deepEqual(parseSecurityScanArgs(['--fail-on-vulnerabilities']), {
    showHelp: false,
    failOnVulnerabilities: true,
    timeoutMsOverride: '',
  });
  assert.deepEqual(parseSecurityScanArgs(['--timeout-ms', '5000']), {
    showHelp: false,
    failOnVulnerabilities: false,
    timeoutMsOverride: '5000',
  });
  assert.deepEqual(parseSecurityScanArgs(['--timeout-ms=7000']), {
    showHelp: false,
    failOnVulnerabilities: false,
    timeoutMsOverride: '7000',
  });
  assert.deepEqual(parseSecurityScanArgs(['--help']), {
    showHelp: true,
    failOnVulnerabilities: false,
    timeoutMsOverride: '',
  });
  assert.deepEqual(parseSecurityScanArgs(['--fail-on-vulnerabilities', '--help', '--timeout-ms', '4000']), {
    showHelp: true,
    failOnVulnerabilities: false,
    timeoutMsOverride: '',
  });
});

test('parseSecurityScanArgs rejects malformed and duplicate arguments', () => {
  assert.throws(() => parseSecurityScanArgs('--help'), /Expected argv to be an array\./u);
  assert.throws(() => parseSecurityScanArgs(['--help', 3]), /Expected argv\[1\] to be a string\./u);
  assert.throws(() => parseSecurityScanArgs(['--unknown']), /Unknown argument: --unknown/u);
  assert.throws(
    () => parseSecurityScanArgs(['--fail-on-vulnerabilities', '--fail-on-vulnerabilities']),
    /Duplicate --fail-on-vulnerabilities flag received\./u,
  );
  assert.throws(() => parseSecurityScanArgs(['--timeout-ms', '5000', '--timeout-ms=6000']), /Duplicate --timeout-ms flag received\./u);
  assert.throws(() => parseSecurityScanArgs(['--timeout-ms']), /Missing value for --timeout-ms argument\./u);
  assert.throws(() => parseSecurityScanArgs(['--timeout-ms=']), /Missing value for --timeout-ms argument\./u);
  assert.throws(() => parseSecurityScanArgs(['--timeout-ms==5000']), /Malformed inline value for --timeout-ms argument\./u);
});

test('collectWorkspaceSecurityScan aggregates workspace vulnerability totals', () => {
  const runAuditCalls = [];
  const runAudit = (_repoRoot, workspacePath) => {
    runAuditCalls.push(workspacePath);
    if (workspacePath === '.') {
      return {
        status: 0,
        stdout: JSON.stringify({
          metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 } },
        }),
      };
    }
    if (workspacePath === 'packages/api') {
      return {
        status: 1,
        stdout: JSON.stringify({
          metadata: { vulnerabilities: { info: 0, low: 0, moderate: 1, high: 0, critical: 0, total: 1 } },
        }),
      };
    }
    if (workspacePath === 'packages/cli') {
      return {
        status: 1,
        stdout: JSON.stringify({
          metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 2, critical: 0, total: 2 } },
        }),
      };
    }
    return {
      status: 0,
      stdout: JSON.stringify({
        metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 } },
      }),
    };
  };

  const report = collectWorkspaceSecurityScan({
    repoRoot: '/workspace',
    workspacePaths: ['.', 'packages/api', 'packages/cli', 'apps/debugger'],
    runAudit,
  });

  assert.equal(report.workspaces.length, 4);
  assert.equal(report.totalVulnerabilities, 3);
  assert.equal(report.workspaces[1]?.workspacePath, 'packages/api');
  assert.equal(report.workspaces[1]?.vulnerabilitySummary.total, 1);
  assert.equal(report.workspaces[2]?.workspacePath, 'packages/cli');
  assert.equal(report.workspaces[2]?.vulnerabilitySummary.high, 2);
  assert.deepEqual(runAuditCalls, ['.', 'packages/api', 'packages/cli', 'apps/debugger']);
});

test('collectWorkspaceSecurityScan falls back to vulnerabilities object size when metadata is absent', () => {
  const runAudit = () => ({
    status: 1,
    stdout: JSON.stringify({
      vulnerabilities: {
        lodash: { severity: 'high' },
        minimist: { severity: 'moderate' },
      },
    }),
  });

  const report = collectWorkspaceSecurityScan({
    repoRoot: '/workspace',
    workspacePaths: ['packages/api'],
    runAudit,
  });

  assert.equal(report.totalVulnerabilities, 2);
  assert.equal(report.workspaces[0]?.vulnerabilitySummary.total, 2);
  assert.equal(report.workspaces[0]?.vulnerabilitySummary.high, 0);
});

test('collectWorkspaceSecurityScan forwards configured timeout to workspace runner', () => {
  const observedTimeoutValues = [];

  const report = collectWorkspaceSecurityScan({
    repoRoot: '/workspace',
    workspacePaths: ['.', 'packages/api'],
    auditTimeoutMs: 6789,
    runAudit: (_repoRoot, _workspacePath, timeoutMs) => {
      observedTimeoutValues.push(timeoutMs);
      return {
        status: 0,
        stdout: JSON.stringify({
          metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 } },
        }),
      };
    },
  });

  assert.equal(report.totalVulnerabilities, 0);
  assert.deepEqual(observedTimeoutValues, [6789, 6789]);
});

test('resolveSecurityScanTimeoutFromEnv parses and validates environment overrides', () => {
  assert.equal(resolveSecurityScanTimeoutFromEnv({}), 120000);
  assert.equal(resolveSecurityScanTimeoutFromEnv({ SECURITY_SCAN_NPM_AUDIT_TIMEOUT_MS: ' 8000 ' }), 8000);
  assert.equal(resolveSecurityScanTimeoutFromEnv({}, '7000'), 7000);
  assert.equal(resolveSecurityScanTimeoutFromEnv({ SECURITY_SCAN_NPM_AUDIT_TIMEOUT_MS: '8000' }, '7000'), 7000);
  assert.throws(
    () => resolveSecurityScanTimeoutFromEnv({ SECURITY_SCAN_NPM_AUDIT_TIMEOUT_MS: '0' }),
    /Invalid SECURITY_SCAN_NPM_AUDIT_TIMEOUT_MS value: 0/u,
  );
  assert.throws(() => resolveSecurityScanTimeoutFromEnv({}, '0'), /Invalid --timeout-ms value: 0/u);
  assert.throws(
    () => resolveSecurityScanTimeoutFromEnv({ SECURITY_SCAN_NPM_AUDIT_TIMEOUT_MS: 'NaN' }),
    /Invalid SECURITY_SCAN_NPM_AUDIT_TIMEOUT_MS value: NaN/u,
  );
});
