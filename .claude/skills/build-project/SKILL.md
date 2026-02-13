---
name: build-project
description: Run the Next.js production build and fix any compilation errors. Use when verifying the project compiles cleanly.
---

# Build Project

Run the production build and resolve any errors.

## Process

1. Run `npm run build`
2. If errors occur:
   - Read each error carefully
   - Fix TypeScript type errors (never use `any` as a shortcut)
   - Fix import/module resolution issues
   - Re-run build after each fix
3. Verify build completes with exit code 0

## Pass Criteria

- `npm run build` completes successfully
- `.next/` directory is generated with compiled output
- No TypeScript errors or warnings

## Fail Criteria

- Build fails or emits TypeScript errors
- Unsafe fixes introduced (e.g., `any` types, eslint-disable comments)
