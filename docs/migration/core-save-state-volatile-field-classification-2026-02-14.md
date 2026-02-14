# Core Save-State Volatile Field Classification (2026-02-14)

This note documents volatile byte positions in `WASMBOY_STATE` observed across
deterministic save/load replay cycles.

## Context

`test/core/serialization-determinism-test.cjs` validates byte-stable restoration
for:

- cartridge RAM
- Game Boy internal memory
- palette memory

`WASMBOY_STATE` previously had no explicit classification and was omitted from
strict byte-equality assertions.

## Observed volatile indices

Across repeated baseline → restore cycles, the following
`WASMBOY_STATE` byte offsets were observed to vary while all other state bytes
remained deterministic:

`54, 350, 351, 397, 400, 401, 450, 451, 500, 501, 502, 503`

## Enforcement

The serialization determinism test now enforces:

- all non-volatile `WASMBOY_STATE` indices must match exactly across save/load;
- only the volatile indices listed above may differ.

If new differing indices appear, the test fails and requires explicit
re-classification and rationale update in this document.
