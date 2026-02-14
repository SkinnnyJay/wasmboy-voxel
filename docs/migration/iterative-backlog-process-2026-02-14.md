# Iterative Backlog Process (Next 100 Improvements)

This process defines how to continuously generate and execute the next
100-item hardening backlog after each completion cycle.

## Objective

Maintain a rolling, prioritized, test-backed improvement backlog without losing
traceability between:

- discovered risks,
- implemented fixes,
- validation evidence,
- and documentation updates.

## Cadence

- **Weekly:** triage + reprioritize backlog.
- **Per merge window:** refresh candidate pool from CI/test/debt/docs signals.
- **Per completed item:** commit + push + update plan/completion docs.

## Source streams for candidate generation

1. CI signals (failed/cancelled workflows, flaky warnings, artifact logs)
2. Regression suites (new failures, slowdowns, budget drift)
3. Security and dependency scans
4. Technical debt register open items
5. Audit docs and migration notes
6. Contributor pain points (DX friction, repeated local setup issues)

## Backlog item schema

Each candidate must include:

- `id`: stable identifier (`taskNNN`)
- `title`: concise action
- `subsystem`: core/wrapper/api/cli/debugger/automation/docs
- `risk`: correctness | reliability | performance | security | DX
- `impact`: 1–5
- `effort`: 1–5
- `confidence`: 1–5 (expected implementation confidence)
- `validation`: exact commands/tests/evidence required
- `ownerTag`: subsystem owner tag (team-level)
- `status`: pending | in_progress | completed | cancelled

## Prioritization model

Use weighted score:

`priorityScore = (impact * 2) + confidence - effort + riskBonus`

Where:

- `riskBonus = 2` for security/correctness,
- `riskBonus = 1` for reliability/perf,
- `riskBonus = 0` for DX/docs.

Tie-breakers:

1. lower effort first,
2. broader subsystem leverage second,
3. existing failing-signal linkage third.

## Execution protocol for each item

1. Define explicit success state.
2. Implement minimal correct change.
3. Run required tests/evidence commands.
4. Commit and push immediately.
5. Update:
   - `PLAN.md` execution log,
   - migration completion summary,
   - debt register (if debt changed).

## Completion gate for one 100-item cycle

A cycle is complete only when:

- all 100 items are marked completed/cancelled with rationale,
- validation evidence exists for all non-doc items,
- debt register is updated,
- weekly checklist passes,
- a new “next 100” draft backlog is generated from current signals.

## Bootstrapping the next 100

At cycle close:

1. Export open debt items (`technical-debt-register`).
2. Pull latest CI/nightly failures and flaky markers.
3. Pull latest dependency freshness + security scan outputs.
4. Produce a new backlog draft using the item schema above.
5. Rank by priority score, then freeze initial ordering for execution.
