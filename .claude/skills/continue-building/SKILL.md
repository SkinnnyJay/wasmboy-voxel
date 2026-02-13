---
name: continue-building
description: Resume work on the current task. Reads scratchpad and plan context, picks up where you left off.
---

# Continue Building

Resume work on the RetroLLM Arena project from where you left off.

## Startup Sequence

1. **Read context**: Check `scratchpad/plan.md` and any active `scratchpad/*.md` files for current task status
2. **Check git state**: Run `git status` and `git log --oneline -5` to see recent work
3. **Identify next task**: Find the highest-priority incomplete item marked `[ ]`
4. **Resume**: Pick up implementation from the last checkpoint

## Operating Principles

- Strict TypeScript: no implicit `any`, explicit types on public APIs
- Validate external data with Zod schemas at system boundaries
- Favor pure functions and small modules
- API routes: Next.js App Router handlers with Zod validation; use `@/lib/logger` and `@/lib/env`

## Quality Gates (before marking done)

- `npm run typecheck` -- zero errors
- `npm run check` -- zero errors
- `npm test` -- all tests pass
- `npm run build` -- compiles cleanly

## Workflow

1. Implement the next task with clean, strongly-typed code
2. Add/update tests for changed behavior
3. Verify all quality gates pass
4. Update scratchpad with progress: mark `[X]` for completed items
5. Pick the next task and continue

## Stop Criteria

Stop and ask for guidance if:
- Type errors, failing tests, or build errors you can't resolve
- Architectural decisions that need user input
- Missing requirements or unclear scope
