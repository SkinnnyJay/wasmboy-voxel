export interface WasmBoyAudioLike {
  resumeAudioContext(): void;
  getAudioChannels(): unknown;
}

export const WasmBoyAudio: WasmBoyAudioLike;
