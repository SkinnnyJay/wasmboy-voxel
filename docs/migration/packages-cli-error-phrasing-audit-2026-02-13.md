# `@wasmboy/cli` Error-Phrasing Audit (2026-02-13)

## Scope

Audited command-parser and path-validation error text in:

- `packages/cli/src/index.ts`
- `packages/cli/src/commands.ts`
- `packages/cli/src/paths.ts`

## Current error-message inventory

| Source                                    | Error code         | Current message template                                         |
| ----------------------------------------- | ------------------ | ---------------------------------------------------------------- |
| `executeCli(run)`                         | `InvalidInput`     | `run command requires <rom>`                                     |
| `executeCli(snapshot)`                    | `InvalidInput`     | `snapshot command requires <rom>`                                |
| `executeCli(compare)`                     | `InvalidInput`     | `compare command requires <baselineSummary>`                     |
| `executeCli(unknown)`                     | `InvalidOperation` | `Unknown command: ${command}`                                    |
| `contractCheckCommand` (missing flags)    | `InvalidInput`     | `contract-check requires --contract and --file`                  |
| `contractCheckCommand` (unknown contract) | `InvalidInput`     | `Unknown contract name "${contractName}" for version v1`         |
| `contractCheckCommand` (schema failure)   | `OutOfBounds`      | `contract-check failed: ${errorMessage}`                         |
| `assertRomPath` (missing file)            | `InvalidInput`     | `ROM path does not exist: ${resolved}`                           |
| `assertRomPath` (extension)               | `InvalidInput`     | `Unsupported ROM extension "${extension}". Expected .gb or .gbc` |
| `assertFilePath` (missing file)           | `InvalidInput`     | `File path does not exist: ${resolved}`                          |

## Inconsistencies found

1. **Prefix style differs**  
   Some messages start with command names (`run command requires ...`), others start with generic nouns (`Unknown command: ...`, `File path does not exist: ...`).

2. **Subject wording differs for similar failures**  
   Missing-path failures use both `ROM path` and `File path`; this is technically correct but makes filtering/log aggregation less uniform.

3. **Error-shape semantics overlap**  
   `contract-check` validation failures use `OutOfBounds` regardless of whether failure is a bounds issue vs any schema mismatch, while parser-level failures use `InvalidInput`.

4. **Punctuation/casing are mixed**  
   Templates alternate between sentence fragments and sentence-style text (`Unknown ...`, `contract-check failed: ...`, `... requires ...`).

## Recommended normalization policy

Adopt a consistent structure:

- **Parser failures:** `<command>: <reason>`  
  Example: `snapshot: missing required argument <rom>`
- **Path failures:** `<command>: path not found: <resolvedPath>`  
  Include path type in context payload instead of message text when possible.
- **Schema failures:** `contract-check: payload failed <contractName> validation: <reason>`
- **Unknown command:** `cli: unknown command "<command>"` with suggestion hook support for future typo help.

## Follow-up candidates

- Align all parser/path messages to the shared pattern above.
- Add regression tests that assert canonical message prefixes per command.
- Consider splitting `OutOfBounds` into a schema-validation specific code (or map all contract-check validation failures to `InvalidInput` for consistency).
