const FRAME_CAPTURE_MARK_PREFIX = 'wasmboy-debugger-frame-capture';
const FRAME_RENDER_MARK_PREFIX = 'wasmboy-debugger-frame-render';
const FRAME_RENDER_MEASURE_PREFIX = 'wasmboy-debugger-frame-latency';

function hasPerformanceMarkApi(): boolean {
  return (
    typeof globalThis.performance !== 'undefined' &&
    typeof globalThis.performance.mark === 'function' &&
    typeof globalThis.performance.measure === 'function'
  );
}

export function getFrameCaptureMarkName(frameId: number): string {
  return `${FRAME_CAPTURE_MARK_PREFIX}-${frameId}`;
}

export function getFrameRenderMarkName(frameId: number): string {
  return `${FRAME_RENDER_MARK_PREFIX}-${frameId}`;
}

export function getFrameRenderMeasureName(frameId: number): string {
  return `${FRAME_RENDER_MEASURE_PREFIX}-${frameId}`;
}

export function markFrameCaptured(frameId: number, timestampMs: number): void {
  if (!hasPerformanceMarkApi()) {
    return;
  }

  globalThis.performance.mark(getFrameCaptureMarkName(frameId), {
    detail: {
      frameId,
      timestampMs,
    },
  });
}

export function markFrameRendered(frameId: number): void {
  if (!hasPerformanceMarkApi()) {
    return;
  }

  globalThis.performance.mark(getFrameRenderMarkName(frameId));
}

export function measureFrameRenderLatency(frameId: number): boolean {
  if (!hasPerformanceMarkApi()) {
    return false;
  }

  try {
    globalThis.performance.measure(
      getFrameRenderMeasureName(frameId),
      getFrameCaptureMarkName(frameId),
      getFrameRenderMarkName(frameId),
    );
    return true;
  } catch {
    return false;
  }
}
