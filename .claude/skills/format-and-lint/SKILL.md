---
name: format-and-lint
description: Fix all linting and formatting issues across the project. Use when preparing code for commit or CI.
---

# Format & Lint

Resolve all linting and formatting issues across the project.

## Process

1. Run `npm run lint` to identify all issues
2. Run `npm run lint --fix` to auto-fix what can be resolved automatically
3. Read remaining lint errors using the `read_lints` tool
4. For each file with errors:
   - Read the file to understand context
   - Fix manually: type the response instead of using `any`, fix import order, resolve type issues
   - Re-check with `read_lints` to verify
5. Repeat until no errors remain
6. Run `npm run lint` one final time to confirm zero errors

## Rules

- Never use `any` to bypass type errors -- type the value properly
- Never add `eslint-disable` comments if there's a better fix
- Don't add unnecessary comments -- make them count
- Ensure Prettier formatting: single quotes, trailing commas, 2-space indent

## Pass Criteria

- `npm run lint` exits with code 0
- `npm run lint:biome` exits with code 0
- All files conform to formatting rules

## Fail Criteria

- Lint errors remain
- Unsafe fixes introduced
