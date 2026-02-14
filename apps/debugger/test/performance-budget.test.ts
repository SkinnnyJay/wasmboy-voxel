import { describe, expect, it } from 'vitest';
import {
  markFrameCaptured,
  markFrameRendered,
  measureFrameRenderLatency,
} from '../lib/performance-marks';

const DEBUGGER_PERF_SMOKE_ITERATIONS = 250;
const DEBUGGER_PERF_SMOKE_BUDGET_MS = 500;

describe('debugger performance budget smoke', () => {
  it('keeps frame mark/render latency instrumentation within budget', () => {
    if (
      typeof globalThis.performance === 'undefined' ||
      typeof globalThis.performance.mark !== 'function' ||
      typeof globalThis.performance.measure !== 'function' ||
      typeof globalThis.performance.now !== 'function'
    ) {
      return;
    }

    const startTimeMs = globalThis.performance.now();
    let allMeasurementsSucceeded = true;

    for (let frameId = 0; frameId < DEBUGGER_PERF_SMOKE_ITERATIONS; frameId += 1) {
      markFrameCaptured(frameId, startTimeMs + frameId);
      markFrameRendered(frameId);
      allMeasurementsSucceeded = measureFrameRenderLatency(frameId) && allMeasurementsSucceeded;
    }

    const elapsedMs = globalThis.performance.now() - startTimeMs;
    expect(allMeasurementsSucceeded).toBe(true);
    expect(elapsedMs).toBeLessThan(DEBUGGER_PERF_SMOKE_BUDGET_MS);
  });
});
