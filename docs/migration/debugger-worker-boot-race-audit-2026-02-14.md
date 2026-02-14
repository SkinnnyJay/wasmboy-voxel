# Debugger Worker Boot Race Audit (2026-02-14)

## Scope

Audited debugger worker boot/load paths in:

- `apps/debugger/app/page.tsx`
- `apps/debugger/lib/worker-loader.ts`
- `apps/debugger/workers/debugger.worker.ts`
- `apps/debugger/lib/wasm-loader.ts`

## Current boot flow (observed)

1. UI effect (`HomePage`) calls `createDebuggerWorker(new URL(...))`.
2. UI immediately sets `workerState` to `"ready"` after constructor returns.
3. UI posts an immediate ping message to the worker.
4. Worker currently echoes payloads and does not perform WASM boot.

## Race-condition findings

### 1) Ready-state is optimistic (high risk once WASM boot is added)

- `workerState` flips to `"ready"` before any worker acknowledgement.
- If future worker boot includes async WASM compile/instantiate, UI may issue messages before worker boot completion.

### 2) No handshake / no boot barrier (high risk)

- There is no protocol-level `boot:start` / `boot:ready` / `boot:error`.
- Messages can arrive during undefined worker initialization phases once non-trivial boot logic is introduced.

### 3) No worker error-channel wiring in UI effect (medium risk)

- UI does not attach `worker.onerror` / `worker.onmessageerror`.
- Boot failures can be silent from the page-state perspective (`ready` may remain visible).

### 4) Strict-mode lifecycle overlap can transiently misreport state (medium risk)

- Cleanup sets `"terminated"` unconditionally.
- Under React strict-mode double-invoke semantics, stale cleanup from a previous effect run can briefly overwrite a newer boot state.

### 5) `fetchWasmAsset()` has no cancellation/attempt ownership (medium risk)

- `wasm-loader.ts` performs plain `fetch` without `AbortController`.
- If integrated into worker boot retries, overlapping requests may race and apply stale results.

### 6) No sequencing/correlation IDs on worker messages (low-to-medium risk)

- Current echo protocol cannot disambiguate responses from concurrent boot attempts.
- Debugger panels cannot safely gate data by boot generation.

## Recommended hardening sequence

1. Add explicit worker boot state machine + typed messages:
   - `debugger-worker:boot:start`
   - `debugger-worker:boot:ready`
   - `debugger-worker:boot:error`
2. Set UI `"ready"` only after `boot:ready` acknowledgment.
3. Register `onerror` and `onmessageerror` before first `postMessage`.
4. Add boot-attempt IDs and ignore stale responses.
5. Integrate `AbortController` in WASM fetch path for retries/unmount.
6. Queue/hold UI-originated commands until boot-ready.

## Audit conclusion

Current implementation is acceptable for the present echo-only worker, but it is **not race-safe** for upcoming real WASM initialization. The highest-value mitigation is introducing an explicit boot handshake and readiness gate before any debugger command traffic.
