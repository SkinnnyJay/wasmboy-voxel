# Run Tests

## Overview

Execute the project test suite and fix any failures. Follow the project's fixing workflow (`.cursor/rules/fixing-workflow.mdc`).

## Steps

1. **Run test suite** — Use the project's test command (e.g. `swift test`, `xcodebuild test`, or `npm run test`). Read full output and capture every failing test.
2. **Create task list** — Catalog each failure: file, test name, short description. Mark pending.
3. **Fix systematically** — One at a time; minimal fix; verify with single-file or scoped test if available. Mark done when it passes.
4. **Do not re-run full suite** until every item is resolved.
5. **Full confirmation** — Run full test again; fix regressions. Run lint/typecheck if defined.

## Checklist

- [ ] All failures cataloged
- [ ] Each fixed and verified
- [ ] Full test passes
- [ ] Lint/typecheck pass (if applicable)
