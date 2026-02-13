---
name: coverage-report
description: Generate test coverage report and identify low-coverage areas. Use to assess test health.
---

# Coverage Report

Generate a coverage report and analyze gaps.

## Process

1. Run `npm run test:coverage`
2. Verify the run completes successfully
3. Confirm coverage artifacts in `.generated/coverage/`
4. Summarize key metrics:
   - Overall lines/branches/functions/statements percentages
   - Flag files below 70% coverage threshold
   - Identify highest-risk uncovered code paths
5. Suggest specific tests to write for low-coverage areas

## Pass Criteria

- `npm run test:coverage` exits with code 0
- Coverage report generated
- Summary provided with actionable suggestions

## Fail Criteria

- Tests fail
- Coverage not generated
- Artifacts missing
