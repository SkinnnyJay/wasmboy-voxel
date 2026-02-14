import { describe, expect, it } from 'vitest';
import {
  getFrameCaptureMarkName,
  getFrameRenderMarkName,
  getFrameRenderMeasureName,
  markFrameCaptured,
  markFrameRendered,
  measureFrameRenderLatency,
} from '../lib/performance-marks';

describe('performance marks', () => {
  it('records capture/render marks and measures render latency when performance API is available', () => {
    const originalPerformance = globalThis.performance;
    const markCalls: Array<{ name: string; options?: Record<string, unknown> }> = [];
    const measureCalls: Array<{ name: string; start: string; end: string }> = [];

    Object.defineProperty(globalThis, 'performance', {
      configurable: true,
      writable: true,
      value: {
        mark(name: string, options?: Record<string, unknown>) {
          markCalls.push({ name, options });
        },
        measure(name: string, start: string, end: string) {
          measureCalls.push({ name, start, end });
        },
      },
    });

    try {
      markFrameCaptured(12, 3456);
      markFrameRendered(12);
      const measured = measureFrameRenderLatency(12);

      expect(measured).toBe(true);
      expect(markCalls[0]?.name).toBe(getFrameCaptureMarkName(12));
      expect(markCalls[0]?.options?.detail).toEqual({
        frameId: 12,
        timestampMs: 3456,
      });
      expect(markCalls[1]?.name).toBe(getFrameRenderMarkName(12));
      expect(measureCalls[0]).toEqual({
        name: getFrameRenderMeasureName(12),
        start: getFrameCaptureMarkName(12),
        end: getFrameRenderMarkName(12),
      });
    } finally {
      Object.defineProperty(globalThis, 'performance', {
        configurable: true,
        writable: true,
        value: originalPerformance,
      });
    }
  });

  it('returns false when latency measurement throws', () => {
    const originalPerformance = globalThis.performance;

    Object.defineProperty(globalThis, 'performance', {
      configurable: true,
      writable: true,
      value: {
        mark() {},
        measure() {
          throw new Error('missing mark');
        },
      },
    });

    try {
      const measured = measureFrameRenderLatency(99);
      expect(measured).toBe(false);
    } finally {
      Object.defineProperty(globalThis, 'performance', {
        configurable: true,
        writable: true,
        value: originalPerformance,
      });
    }
  });
});
