const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const getWasmBoyCorePath = path.resolve(process.cwd(), 'dist/core/getWasmBoyWasmCore.cjs.js');
const getWasmBoyCoreCjsPath = path.join(os.tmpdir(), 'getWasmBoyWasmCore.palette-conversion.runtime.cjs');
fs.copyFileSync(getWasmBoyCorePath, getWasmBoyCoreCjsPath);
const getWasmBoyCore = require(getWasmBoyCoreCjsPath);

const COLOR_COMPONENT_BIT_WIDTH = 5;
const COLOR_COMPONENT_MAX_5BIT = 0x1f;
const COLOR_COMPONENT_MAX_8BIT = 0xff;
const COLOR_COMPONENT_ROUNDING_BIAS = COLOR_COMPONENT_MAX_5BIT >> 1;

function encodeRgbComponent(channel, value) {
  return value << (channel * COLOR_COMPONENT_BIT_WIDTH);
}

function getExpectedRoundedComponent(value) {
  return Math.floor((value * COLOR_COMPONENT_MAX_8BIT + COLOR_COMPONENT_ROUNDING_BIAS) / COLOR_COMPONENT_MAX_5BIT);
}

describe('GBC palette component conversion', function() {
  it('maps max 5-bit palette channels to full 8-bit white', async function() {
    const wasmboyCore = await getWasmBoyCore();
    const wasmboy = wasmboyCore.instance.exports;

    const maxRgbColor = 0x7fff;
    assert.strictEqual(wasmboy.getColorComponentFromRgb(0, maxRgbColor), 255, 'expected red max to map to 255');
    assert.strictEqual(wasmboy.getColorComponentFromRgb(1, maxRgbColor), 255, 'expected green max to map to 255');
    assert.strictEqual(wasmboy.getColorComponentFromRgb(2, maxRgbColor), 255, 'expected blue max to map to 255');
  });

  it('uses consistent rounded scaling for each 5-bit channel value', async function() {
    const wasmboyCore = await getWasmBoyCore();
    const wasmboy = wasmboyCore.instance.exports;

    for (let channel = 0; channel < 3; channel += 1) {
      for (let component = 0; component <= COLOR_COMPONENT_MAX_5BIT; component += 1) {
        const encodedColor = encodeRgbComponent(channel, component);
        const actual = wasmboy.getColorComponentFromRgb(channel, encodedColor);
        const expected = getExpectedRoundedComponent(component);
        assert.strictEqual(
          actual,
          expected,
          `expected channel ${channel} component ${component} to map to ${expected}, got ${actual}`,
        );
      }
    }
  });
});
