# .claude/ Directory

Configuration for Claude-based assistants when working in this repository.

**Project:** **WasmBoy-Voxel** — a WasmBoy fork with PPU snapshot APIs for voxel
rendering. AssemblyScript core, JS wrapper + workers, TS voxel wrapper.
See `README.md`, `CLAUDE.md`, and `AGENTS.md` at the repo root.

## Directory Structure

```
.claude/
├── README.md
├── settings.local.json   # Local permissions and MCP (gitignored)
├── mcp.json
├── agents/               # Agent definitions
├── rules/                # Optional rules
└── skills/               # Skill definitions (SKILL.md per skill)
```

## Skills

Relevant skills tend to be about AssemblyScript/WASM, JavaScript build tooling,
testing, and performance. Ignore skills that assume unrelated stacks.

## Integration with CLAUDE.md

`CLAUDE.md` provides project context and guardrails. Skills add task-specific
behavior. Read `CLAUDE.md` first, then use skills that match the task.
