---
name: test-suite
description: Run the full test suite and fix any failures. Use to verify all tests pass before committing.
---

# Run Test Suite

Execute the full test suite and fix any failures.

## Process

1. Run `npm test` to execute all Vitest tests
2. Review output for failures
3. Fix one test at a time:
   - Read the failing test and source code
   - Identify root cause
   - Apply minimal fix
   - Re-run that specific test to confirm
4. After all individual fixes, run `npm test` again for full confirmation
5. Run `npm run build` to ensure everything still compiles

## Pass Criteria

- All tests pass with 100% success rate
- `npm run build` completes after fixes

## Fail Criteria

- Tests fail to run
- Tests are not fixed
- Fixes introduce new failures
