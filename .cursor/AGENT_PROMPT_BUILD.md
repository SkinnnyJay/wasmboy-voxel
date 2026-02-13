# Agent Prompt: Build Pointer

Use this prompt when starting work on Pointer. Read **PLAN.md** and **scratchpad/ENG.md** as the source of truth for architecture and implementation order.

## Mission

Build **Pointer** (CodexMonitor fork powered by Cursor CLI):

- **Backend:** Tauri/Rust — CursorProvider spawns cursor-agent, reads NDJSON, maps to normalized AgentEvents; session store; event bus. One process per workspace; resume via `--resume <session_id>`.
- **UI:** TypeScript/React (CodexMonitor stack) — keep existing UI; feed it normalized events via reducer so workspace list, thread view, diff view, approvals work with Cursor.
- **Quality:** Strict typing (Rust + TS); no shortcuts. Run the project’s build/test/lint commands. Follow `.cursor/rules/fixing-workflow.mdc` when fixing failures.

## Where to Start

1. **Read PLAN.md and scratchpad/ENG.md** — Steps A–F, interfaces, inspiration (CloudCLI, PraisonAI).
2. **Step A first:** CursorProvider + NDJSON → AgentEvents; Pointer Session record; one prompt → streaming output in thread UI.
3. **Quality bar:** Run project build, test, lint; fix per fixing workflow.

## One-Liner

"Build Pointer from PLAN.md and scratchpad/ENG.md: CodexMonitor fork with Cursor CLI backend (Tauri/Rust + TS UI). Implement CursorProvider and event normalization first; run build/test/lint before finishing."
