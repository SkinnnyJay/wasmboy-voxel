// Functions here are depedent on WasmBoyMemory state.
// Thus me bound using .bind() on functions

// Imports
// requestAnimationFrame() for headless mode
import raf from 'raf';

// WasmBoy Modules
import { WasmBoyGraphics } from '../graphics/graphics';
import { WasmBoyController } from '../controller/controller';

// Function to render our emulator output
export function render() {
  // Don't run if paused
  if (this.paused) {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/7312289d-742a-4f37-8218-6c6fb94f8cc7', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId: 'pre-fix',
        hypothesisId: 'H1',
        location: 'lib/wasmboy/render.js:16',
        message: 'render skipped (paused)',
        data: { paused: this.paused },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion
    return true;
  }

  // Check if we have frameskip
  let shouldSkipRenderingFrame = false;
  if (this.frameSkip && this.frameSkip > 0) {
    this.frameSkipCounter++;

    if (this.frameSkipCounter < this.frameSkip) {
      shouldSkipRenderingFrame = true;
    } else {
      this.frameSkipCounter = 0;
    }
  }

  // Render the display
  if (!shouldSkipRenderingFrame) {
    WasmBoyGraphics.renderFrame();
  }

  // Update our controller
  WasmBoyController.updateController();
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/7312289d-742a-4f37-8218-6c6fb94f8cc7', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      runId: 'pre-fix',
      hypothesisId: 'H1',
      location: 'lib/wasmboy/render.js:38',
      message: 'controller updated during render',
      data: {},
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion

  this.renderId = raf(() => {
    render.call(this);
  });
}
