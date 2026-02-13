# Run E2E Tests

## Overview

Execute the project's end-to-end tests (if any) and fix failures. Follow the fixing workflow (`.cursor/rules/fixing-workflow.mdc`).

## Steps

1. **Run E2E suite** — Use the project's E2E command (e.g. UI tests, Playwright, or project-defined script). Capture all failures.
2. **Task list** — Catalog each failing spec; fix one at a time; verify with single-spec run if available.
3. **Full confirmation** — Re-run full E2E; fix regressions. Run lint/typecheck if defined.

## Checklist

- [ ] All E2E failures cataloged
- [ ] Each fixed and verified
- [ ] Full E2E passes
- [ ] Lint/typecheck pass (if applicable)
