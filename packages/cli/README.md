# @wasmboy/cli

Command-line tooling for migration-time validation and regression workflows.

## Commands

- `wasmboy-voxel run <rom|->`
- `wasmboy-voxel snapshot <rom|-> [--out <jsonPath> | -o <jsonPath>]`
- `wasmboy-voxel compare <baselineSummary> [--current <summaryPath> | -c <summaryPath>]`
- `wasmboy-voxel contract-check --contract <name> --file <jsonPath>`

## Examples

```bash
wasmboy-voxel run test/performance/testroms/tobutobugirl/tobutobugirl.gb
cat ./roms/tobutobugirl.gb | wasmboy-voxel run -
wasmboy-voxel snapshot test/performance/testroms/back-to-color/back-to-color.gbc --out ./snapshot.json
cat ./roms/back-to-color.gbc | wasmboy-voxel snapshot - --out ./snapshot.json
wasmboy-voxel compare test/baseline/snapshots/summary.json
wasmboy-voxel contract-check --contract registers --file ./registers.json
```

## Exit codes

The CLI exits with:

- `0` on successful command completion.
- `1` when command execution fails.

Failure output is emitted as JSON on stderr:

```json
{
  "timestamp": "2026-02-13T12:34:56.789Z",
  "level": "error",
  "message": "CLI command failed",
  "context": {
    "code": "InvalidInput",
    "error": "snapshot command requires <rom>"
  }
}
```

`context.code` currently maps to:

- `InvalidInput` — missing/invalid args, unknown options, unknown contract names, missing paths.
- `InvalidOperation` — unexpected runtime failures (filesystem read/write failures, execution issues).
- `OutOfBounds` — payload/schema validation failures in `contract-check`.

## Troubleshooting

- **`InvalidInput` with `... requires <...>`**  
  Verify required positional args/flags are present and correctly ordered.
- **`Unknown option "...". Did you mean "...?"`**  
  Fix option typos and use command-specific flags (`--out`/`-o`, `--current`/`-c`).
- **`read failed` / `write failed` with `EACCES`**  
  Check file permissions, ownership, and parent-directory writability.
- **`contract-check failed: ...`**  
  Validate payload shape against `@wasmboy/api` schemas before invoking CLI checks.
- **Windows-style paths / quoted args**  
  Backslash and quoted path inputs are accepted; if a path still fails, verify it resolves from
  the current working directory.
