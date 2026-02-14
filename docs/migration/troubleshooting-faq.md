# Troubleshooting FAQ

## Q: `supportsPpuSnapshot()` is false or snapshots are null

- Ensure ROM is loaded and emulator worker is ready.
- Keep null-safe handling; initialization can race.
- Confirm `DEBUG_GAMEBOY_MEMORY_LOCATION` is readable.

## Q: Integration tests fail loading `wasmboy.wasm.cjs.*`

- Use `test/load-wasmboy-runtime.cjs` helper.
- This handles `.cjs.js` runtime loading in ESM package contexts.

## Q: `stack:lint` fails on formatting

- Run:
  - `npm run stack:lint`
  - or package-local `npx prettier --write ...`

## Q: Next.js build warns about multiple lockfiles

- This is expected in the current multi-lockfile setup.
- Optional: configure `outputFileTracingRoot` if needed.

## Q: Legacy consumers still call `readMemory()`

- Supported for compatibility.
- Dev builds emit deprecation warnings; migrate to `getMemorySection()`.
