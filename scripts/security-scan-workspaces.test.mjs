import assert from 'node:assert/strict';
import test from 'node:test';
import { collectWorkspaceSecurityScan, parseAuditJson } from './security-scan-workspaces.mjs';
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

test('collectWorkspaceSecurityScan aggregates workspace vulnerability totals', () => {
  const runAudit = (_repoRoot, workspacePath) => {
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
