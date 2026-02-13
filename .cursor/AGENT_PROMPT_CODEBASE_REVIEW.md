# Agent Prompt: Codebase Structure and Quality Review

**Objective:** Review the codebase for structure, organization, and adherence to project standards. Identify issues and produce a **milestone and task report** (report only unless explicitly asked to implement).

**Scope:** All source (Rust/Tauri backend, TypeScript/React UI, provider/event code). Include tests only for structural/organizational issues.

## Standards to Enforce

### 1. File and Function Size

- Flag files over a reasonable limit (e.g. 500–800 lines). Flag functions/methods over ~50–80 lines. Suggest extraction for deeply nested logic.

### 2. Module and Folder Structure

- Backend: provider boundary (only CursorProvider knows cursor-agent); event normalization; session store. Clear separation by concern.
- Frontend: CodexMonitor patterns; events fed from backend reducer. Consistent naming (Rust: snake_case/PascalCase; TS: project convention).
- No circular dependencies; logical dependency direction.

### 3. Type Safety and Patterns

- **Rust:** Result/Option; avoid unwrap in library paths; no panic in hot paths.
- **TypeScript:** No `any`; explicit types at boundaries; use project logger/env when present.
- **Provider/events:** Normalized AgentEvents; NDJSON parsed only in CursorProvider.

### 4. Integration (cursor-agent)

- Headless flags (`--print`, `--output-format stream-json`); session resume; one process per workspace; validation at boundaries.

### 5. General Quality

- Meaningful comments; no magic numbers/strings where a constant is clearer. Early returns; single responsibility where practical.

## Process

1. **Discovery:** Walk the codebase; list files with line counts and long functions.
2. **Audit:** Record violations with file path and short description.
3. **Report:** One document: summary (counts, severity) and milestones with actionable tasks.

## Constraints

- Respect `.cursorrules`, CLAUDE.md, AGENT.md, `.cursor/rules/*`. Flag conflicts.
- Every task actionable (file/module/area + concrete change).

## Deliverable

One report (markdown) with summary and full milestone-and-task list. No refactor or file create/delete unless the user explicitly asks for implementation after the report.
