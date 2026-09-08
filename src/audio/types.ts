export type PlaybackState = 'stopped' | 'playing' | 'paused';

export interface LoFiDSPParams {
  masterVolume: number;       // 0.0 to 1.0
  filterCutoff: number;       // 800 to 12000 Hz (warmth)
  filterResonance: number;    // 0.5 to 4.0 (Q)
  tapeWobbleDepth: number;    // 0.0 to 1.0 (pitch flutter amount)
  tapeWobbleSpeed: number;    // 0.3 to 2.5 Hz (LFO speed)
  vinylVolume: number;        // 0.0 to 1.0 (crackle / needle noise level)
  sidechainStrength: number;  // 0.0 to 1.0 (ducking intensity behind kick)
}

export const DEFAULT_DSP_PARAMS: LoFiDSPParams = {
  masterVolume: 0.8,
  filterCutoff: 4500,         // Lo-Fi sweet spot: cuts high-frequency digital harshness
  filterResonance: 1.2,
  tapeWobbleDepth: 0.35,      // Gentle vintage cassette warble
  tapeWobbleSpeed: 0.8,       // Slow wow modulation
  vinylVolume: 0.25,          // Cozy needle hiss and pops
  sidechainStrength: 0.65     // Noticeable rhythmic breathing pump
};

export interface AudioVisualData {
  bass: number;               // 0.0 to 1.0 (sub & kick energy, 20 - 150 Hz)
  mids: number;               // 0.0 to 1.0 (chords & melody, 250 - 2500 Hz)
  highs: number;              // 0.0 to 1.0 (hats, vinyl crackle, 4000 - 16000 Hz)
  waveform: Float32Array;     // Time-domain oscilloscope wave
  frequency: Uint8Array;      // FFT spectrum bins
  treble: number
}
