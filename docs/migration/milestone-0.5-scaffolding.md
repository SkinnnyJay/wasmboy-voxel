# Milestone 0.5 Scaffolding Decisions

## Workspace tool decision

Decision: **pnpm workspaces**.

Why:

- Native workspace filtering for staged migration (`packages/*`, `apps/*`).
- Minimal adoption overhead in this repository.
- Compatible with incremental package introduction without requiring immediate turbo pipeline wiring.

## Added scaffolding

- `pnpm-workspace.yaml` — workspace package globs.
- `tsconfig.base.json` — strict shared TypeScript defaults for new packages/apps.
- `tsconfig.json` — root project references entry point.
- `.eslintrc.cjs` — root lint baseline with TypeScript and React overrides.
- `.prettierrc` update — new-package formatting override.
- `.editorconfig` — consistent whitespace/newline behavior.
- `.nvmrc` — pinned Node runtime for contributors/CI.
- `package.json` scripts:
  - `stack:dev`
  - `stack:build`
  - `stack:test`
  - `stack:typecheck`
  - `stack:lint`
  - `changeset`, `changeset:version`, `changeset:publish`
- `.changeset/config.json` — release workflow baseline config.
