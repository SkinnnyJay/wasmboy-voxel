# lib/ TypeScript migration — intentional `unknown` and narrowing notes (2026-02-14)

During Phase 11 incremental migration, several declaration surfaces intentionally
use `unknown` instead of premature structural typing.

These are tracked here so follow-up typing can be done deliberately (not by
unsafe assertions).

## Why `unknown` is used in current declarations

The migrated TypeScript entrypoints (`lib/index.ts`, `lib/headless/index.ts`,
worker wrappers) currently bridge to large legacy JS modules whose return
payloads are dynamic and version-sensitive.

For these APIs, `unknown` is currently preferred over:

- `any` (too permissive, bypasses narrowing),
- guessed object shapes (risking incorrect contracts),
- unsafe type assertions.

## Current intentional `unknown` usage buckets

## 1) Legacy debug/introspection payloads

Files:

- `lib/debug/debug.d.ts`
- `lib/index.d.ts`

Examples:

- `getCPURegisters(): unknown`
- `getTimerState(): unknown`
- `getLCDState(): unknown`
- `_parsePpuSnapshotBuffer(buffer): unknown`

Reason:

- Existing JS debug payloads are used across tools/tests with partial or
  environment-dependent fields.
- These should be replaced with explicit contract types once shared schemas are
  finalized for all debug payload variants.

## 2) Plugin/controller extension points

Files:

- `lib/plugins/plugins.d.ts`
- `lib/controller/controller.d.ts`
- `lib/index.d.ts`

Examples:

- `addPlugin(plugin: unknown)`
- `ResponsiveGamepad: unknown`
- `setJoypadState(state: unknown)` in legacy controller declaration surface

Reason:

- Third-party plugin/controller integrations are extension surfaces with minimal
  validated shape guarantees today.
- Follow-up work should introduce explicit plugin/controller interfaces and
  compatibility adapters.

## 3) Save-state / persistence payloads

Files:

- `lib/wasmboy/wasmboy.d.ts`
- `lib/index.d.ts`

Examples:

- `saveState(): Promise<unknown>`
- `getSaveStates(): Promise<unknown[]>`
- `saveLoadedCartridge(...): Promise<unknown>`

Reason:

- Persisted payload shape is currently shared with legacy JS save/load code and
  IndexedDB adapters.
- A typed schema pass should define durable save-state contracts before
  replacing these `unknown` placeholders.

## 4) Worker envelope guard input surface

Files:

- `lib/worker/message-schema.d.ts`

Examples:

- `hasWorkerMessageType(eventData: unknown): ...`
- `getWorkerMessageType(eventData: unknown): string`

Reason:

- Worker event data is external/untrusted at message boundaries.
- `unknown` is correct here; runtime guards intentionally narrow before use.

## Planned narrowing strategy

1. Replace debug payload `unknown` with shared contract types (`packages/api`)
   for registers/timers/LCD/state exports.
2. Define plugin/controller public interfaces and normalize extension hooks.
3. Introduce explicit save-state contract interfaces and runtime validators.
4. Keep message-boundary inputs as `unknown` where external data enters the
   system; narrow via guard helpers.
