# Build Project

## Overview

Run the project build and fix any compilation errors. When fixing errors, follow the project's fixing workflow (`.cursor/rules/fixing-workflow.mdc`).

## Steps

1. **Run build** — Use the project's build command (e.g. `cargo build`, Tauri build, frontend `npm run build`). Read full output and capture every error.
2. **Create task list** — Catalog every error: file path, line, short description. Mark pending.
3. **Fix systematically** — One at a time; minimal fix; verify with scoped build if available. Mark done when error is gone.
4. **Do not re-run full build** until all items are resolved.
5. **Full confirmation** — Run full build again; exit code 0. Run lint/typecheck if defined.

## Checklist

- [ ] All build errors cataloged
- [ ] Each error fixed and verified
- [ ] Full build passes
- [ ] Lint/typecheck pass (if applicable)
