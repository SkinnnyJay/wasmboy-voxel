---
name: commit
description: Logically groups changed files into atomic commits with conventional format. Use when ready to commit staged work.
---

# Smart Commit

Group changed files into logical, atomic commits using the project's conventional commit format.

## Commit Format

```
<type>(<scope>): <summary>
```

- **Types**: feat, fix, chore, refactor, docs, test
- **Scope**: affected area (api, agent, emulator, vision, ui, etc.)
- **Summary**: present tense, imperative mood, under 72 chars

## Examples

```
feat(agent): add retry logic to decision loop
fix(api): handle null session in make-decision endpoint
chore(deps): bump next to 15.1
refactor(memory): extract storage interface from hybrid backend
docs(readme): update architecture diagram
test(e2e): add milestone validation spec
```

## Process

1. Run `git status` and `git diff --staged` to see all changes
2. Analyze changed files and group by logical change
3. Stage each group: `git add <files>`
4. Commit with proper format
5. Repeat for each logical group
6. Verify with `git log --oneline -5`

## Rules

- One logical change per commit
- Never commit `.env`, credentials, or secrets
- Run `npm run check && npm run typecheck` before committing
- Include Prisma migration IDs when schema changes are present
