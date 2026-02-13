# Type Check

## Overview

Run the project's type checking (e.g. `swift build`, Xcode build, or `npm run typecheck`) and fix errors. Follow the fixing workflow.

## Steps

1. **Run typecheck** — Use project command. Capture every error.
2. **Task list** — Catalog errors; mark pending.
3. **Fix systematically** — One at a time; minimal fix; no shortcuts (e.g. no `any` or force casts). Verify; mark done.
4. **Full confirmation** — Typecheck exits 0; run lint if defined.

## Checklist

- [ ] All errors cataloged
- [ ] Each fixed without type shortcuts
- [ ] Full typecheck passes
- [ ] Lint passes (if applicable)
