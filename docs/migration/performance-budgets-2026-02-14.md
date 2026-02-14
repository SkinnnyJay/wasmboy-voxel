# Performance Budgets (2026-02-14)

This baseline defines smoke-level budgets across key subsystem paths.

Budgets are intentionally conservative: they are regression tripwires, not
micro-optimization targets.

## Budget table

| Subsystem       | Path                                                                         | Budget                                                    | Enforcement                                                                                 |
| --------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Scripts tooling | CLI parser helpers (`scripts/cli-arg-values.mjs`, `scripts/cli-timeout.mjs`) | `20,000` iterations must complete in `< 2000ms`           | `scripts/parser-latency-smoke.test.mjs`                                                     |
| CLI package     | Startup help dispatch path (`executeCli --help`)                             | `2,000` dispatch loops must complete in `< 2000ms`        | `packages/cli/test/commands.test.ts`                                                        |
| Debugger app    | Frame capture/render instrumentation helpers                                 | `250` frame mark/measure loops must complete in `< 500ms` | `apps/debugger/test/performance-budget.test.ts`                                             |
| Core runtime    | Execute-loop throughput                                                      | `600` frames must sustain `>= 650 FPS`                    | `test/core/execute-loop-microbench.cjs` + `test/core/baseline/execute-loop-microbench.json` |

## Scope and interpretation

- These checks gate _large regressions_ only.
- Failing budget tests should trigger profiling/instrumentation before tuning.
- Budget updates require:
  1. before/after measurements,
  2. rationale in migration docs,
  3. synchronized threshold updates in the corresponding tests/config files.
