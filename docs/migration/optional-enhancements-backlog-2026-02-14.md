# Optional enhancements backlog disposition (2026-02-14)

The following items are explicitly classified as **optional** enhancements
outside the required correctness/stability/release sign-off gates.

They are retained as future roadmap candidates and intentionally deferred to
avoid expanding scope past the mandatory migration hardening work.

## Deferred optional items

1. **Record/replay input sessions for deterministic debugging**
   - Candidate direction: add input timeline capture/replay API in headless and
     debugger tooling.
2. **Streaming snapshot export for time-series analysis**
   - Candidate direction: structured snapshot stream transport with bounded file
     sinks and chunked export.
3. **Dedicated AI debug console in the Next.js app**
   - Candidate direction: debugger-side panel that consumes read-only contract
     endpoints with explicit sandbox boundaries.

## Status

- Deferred (optional scope only)
- No blocking impact on Phase 11, build verification, CI gates, or sign-off
  criteria.
