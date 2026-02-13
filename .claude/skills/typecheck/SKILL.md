---
name: typecheck
description: Run TypeScript type checking and fix all type errors. Use to verify type safety before committing.
---

# Type Check

Run TypeScript type checking and resolve all errors.

## Process

1. Run `npm run typecheck` (or `npx tsc --noEmit`)
2. Read and interpret each type error
3. Fix with minimal, correct changes:
   - Add proper type annotations
   - Fix type mismatches
   - Never use `any` as a shortcut
4. Re-run until clean

## Pass Criteria

- `npm run typecheck` exits with code 0, zero diagnostics

## Fail Criteria

- Type errors remain
- Unsafe fixes introduced (e.g., `any`, `@ts-ignore`)
