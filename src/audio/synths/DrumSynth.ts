import { GM_DRUMS } from '../../generator/types.js';

/**
 * Procedural Lo-Fi Drum Synthesizer
 * 
 * Synthesizes vintage, pillowy hip-hop drum hits natively in the Web Audio API:
 * - Kick: Pitch-dropped sine sweep with soft thump
 * - Snare / Rimshot: Organic blend of filtered noise and body resonator
 * - Hi-Hats & Shaker: Bandpassed metallic noise bursts
 */
export class DrumSynth {
  private ctx: AudioContext;
  public readonly outputNode: GainNode;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.outputNode = ctx.createGain();
    this.outputNode.gain.value = 0.85;
  }

  public playDrum(midi: number, time: number, velocity: number) {
    const vel = Math.max(0.05, Math.min(1.0, velocity));

    switch (midi) {
      case GM_DRUMS.BASS_DRUM:
        this.playKick(time, vel);
        break;
      case GM_DRUMS.ACOUSTIC_SNARE:
        this.playSnare(time, vel);
        break;
      case GM_DRUMS.RIMSHOT:
        this.playRimshot(time, vel);
        break;
      case GM_DRUMS.HAND_CLAP:
        this.playClap(time, vel);
        break;
      case GM_DRUMS.CLOSED_HIHAT:
      case GM_DRUMS.PEDAL_HIHAT:
        this.playClosedHat(time, vel);
        break;
      case GM_DRUMS.OPEN_HIHAT:
        this.playOpenHat(time, vel);
        break;
      case GM_DRUMS.MARACAS:
      case GM_DRUMS.CABASA:
      case GM_DRUMS.TAMBOURINE:
        this.playShaker(time, vel);
        break;
      default:
        this.playClosedHat(time, vel);
        break;
    }
  }

  // --- 1. LO-FI WARM KICK ---
  private playKick(time: number, vel: number) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pitch Envelope: 130 Hz down to 42 Hz (pillowy, not sharp EDM)
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.055);

    // Amplitude Envelope
    gain.gain.setValueAtTime(vel * 0.95, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    // Warm Low-Pass to remove high-frequency click
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, time);

    osc.connect(gain);
    gain.connect(filter);
    filter.connect(this.outputNode);

    osc.start(time);
    osc.stop(time + 0.28);
  }

  // --- 2. DUSTY SNARE ---
  private playSnare(time: number, vel: number) {
    // A. Tone Body (Mid-range resonance ~185 Hz)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(185, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);

    oscGain.gain.setValueAtTime(vel * 0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.outputNode);
    osc.start(time);
    osc.stop(time + 0.14);

    // B. Noise Snare Wires (Filtered white noise)
    const noiseNode = this.createNoiseNode();
    const noiseGain = this.ctx.createGain();
    const noiseFilter = this.ctx.createBiquadFilter();

    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1800, time);
    noiseFilter.Q.setValueAtTime(1.2, time);

    noiseGain.gain.setValueAtTime(vel * 0.65, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.outputNode);

    noiseNode.start(time);
    noiseNode.stop(time + 0.2);
  }

  // --- 3. WOODEN CROSS-STICK RIMSHOT ---
  private playRimshot(time: number, vel: number) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(820, time);
    osc.frequency.exponentialRampToValueAtTime(380, time + 0.03);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, time);
    filter.Q.setValueAtTime(3.5, time); // Hollow wood resonance

    gain.gain.setValueAtTime(vel * 0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(gain);
    gain.connect(filter);
    filter.connect(this.outputNode);

    osc.start(time);
    osc.stop(time + 0.09);
  }

  // --- 4. CLAP ---
  private playClap(time: number, vel: number) {
    // 3 rapid mini-bursts (flams)
    for (let i = 0; i < 3; i++) {
      const burstTime = time + (i * 0.011);
      const noise = this.createNoiseNode();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, burstTime);

      const burstVol = i === 2 ? vel * 0.7 : vel * 0.3;
      gain.gain.setValueAtTime(burstVol, burstTime);
      gain.gain.exponentialRampToValueAtTime(0.001, burstTime + (i === 2 ? 0.15 : 0.02));

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.outputNode);

      noise.start(burstTime);
      noise.stop(burstTime + 0.18);
    }
  }

  // --- 5. CLOSED HI-HAT ---
  private playClosedHat(time: number, vel: number) {
    const noise = this.createNoiseNode();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Highpass to eliminate mud
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    gain.gain.setValueAtTime(vel * 0.45, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.055);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.outputNode);

    noise.start(time);
    noise.stop(time + 0.07);
  }

  // --- 6. OPEN HI-HAT ---
  private playOpenHat(time: number, vel: number) {
    const noise = this.createNoiseNode();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6000, time);

    gain.gain.setValueAtTime(vel * 0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.outputNode);

    noise.start(time);
    noise.stop(time + 0.35);
  }

  // --- 7. SHAKER ---
  private playShaker(time: number, vel: number) {
    const noise = this.createNoiseNode();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(5200, time);
    filter.Q.setValueAtTime(2.0, time);

    // Soft 8ms attack
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(vel * 0.35, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.outputNode);

    noise.start(time);
    noise.stop(time + 0.07);
  }

  private createNoiseNode(): AudioBufferSourceNode {
    const bufferSize = this.ctx.sampleRate * 0.5; // 0.5s buffer
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    return noise;
  }
}
