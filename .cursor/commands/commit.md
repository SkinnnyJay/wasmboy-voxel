# Commit Changes

## Overview

Group changed files into logical, atomic commits using conventional commit format. Ensure project quality gates pass before committing.

## Steps

1. **Review changes** — `git status` and `git diff --staged`
2. **Plan commits** — Group into logical, atomic commits. Format: `<type>(<scope>): <summary>` (feat, fix, chore, refactor, docs, test). Present tense, imperative, under 72 chars.
3. **Quality gate** — Run the project's check/lint and typecheck (or build) before committing.
4. **Commit** — Stage each group and commit separately.
5. **Never commit** secrets, credentials, or `.env`.

## Checklist

- [ ] Changes reviewed
- [ ] Commits atomic and logically grouped
- [ ] Message format: `<type>(<scope>): <summary>`
- [ ] Project lint/typecheck (or build) pass
- [ ] No secrets in commit
