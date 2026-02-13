# Code Review

## Overview

Review current changes for quality, correctness, and project conventions. Report findings with severity and file:line references.

## Steps

1. **Inspect changes** — `git diff` to see all changes.
2. **Review against criteria** — Logic, null/optional handling, race conditions; project naming and style (see `.cursor/rules/code-style.mdc`); no type shortcuts or unjustified suppressions; input validation at boundaries; size limits (function/file).
3. **Report findings** — Severity: MUST FIX, SHOULD FIX, SUGGESTION. Include file:line for each.

## Checklist

- [ ] Logic and edge cases reviewed
- [ ] Naming and style match project conventions
- [ ] No inappropriate type shortcuts or disables
- [ ] Boundaries and size limits considered
