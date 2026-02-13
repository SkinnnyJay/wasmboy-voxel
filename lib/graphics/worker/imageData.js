import { GAMEBOY_CAMERA_WIDTH, GAMEBOY_CAMERA_HEIGHT } from '../constants';

const RGBA_SIZE = GAMEBOY_CAMERA_HEIGHT * GAMEBOY_CAMERA_WIDTH * 4;
let reusedRgbaBuffer = null;

export function getImageDataFromGraphicsFrameBuffer(wasmByteMemory) {
  if (!reusedRgbaBuffer || reusedRgbaBuffer.length !== RGBA_SIZE) {
    reusedRgbaBuffer = new Uint8ClampedArray(RGBA_SIZE);
  }
  const imageDataArray = reusedRgbaBuffer;

  for (let y = 0; y < GAMEBOY_CAMERA_HEIGHT; ++y) {
    let stride1 = y * (GAMEBOY_CAMERA_WIDTH * 3);
    let stride2 = y * (GAMEBOY_CAMERA_WIDTH * 4);
    for (let x = 0; x < GAMEBOY_CAMERA_WIDTH; ++x) {
      const pixelStart = stride1 + x * 3;
      const imageDataIndex = stride2 + (x << 2);
      imageDataArray[imageDataIndex + 0] = wasmByteMemory[pixelStart + 0];
      imageDataArray[imageDataIndex + 1] = wasmByteMemory[pixelStart + 1];
      imageDataArray[imageDataIndex + 2] = wasmByteMemory[pixelStart + 2];
      imageDataArray[imageDataIndex + 3] = 255;
    }
  }
  return imageDataArray.slice(0);
}
