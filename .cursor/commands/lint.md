# Lint

## Overview

Fix linting and formatting using the project's lint/format commands. Follow the fixing workflow when resolving issues.

## Steps

1. **Run lint** — Use project command (e.g. SwiftLint, `npm run check`, etc.). Read full output.
2. **Auto-fix** — If the project has lint --fix or format:write, run it first.
3. **Task list** — Catalog remaining issues; fix one at a time; verify per file.
4. **Full confirmation** — Run full lint again; run typecheck if defined.

## Checklist

- [ ] Auto-fix applied (if available)
- [ ] All remaining issues cataloged and fixed
- [ ] Full lint passes
- [ ] Typecheck passes (if applicable)
