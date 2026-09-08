/**
 * Rhodes Electric Piano Synthesizer (2-Operator FM Synthesis)
 * 
 * Emulates the iconic Fender Rhodes tine sound:
 * - Carrier: Sine oscillator at the note pitch
 * - Modulator: Oscillator providing metallic chime harmonic with fast exponential decay
 * - Warm low-pass filter to replicate the speaker cabinet
 */
export class RhodesSynth {
  private ctx: AudioContext;
  public readonly outputNode: GainNode;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.outputNode = ctx.createGain();
    this.outputNode.gain.value = 0.55;
  }

  public playNote(midi: number, time: number, duration: number, velocity: number) {
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const vel = Math.max(0.05, Math.min(1.0, velocity));

    // 1. Carrier Oscillator (Fundamental Tone)
    const carrier = this.ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(freq, time);

    // 2. Modulator Oscillator (Tine Strike / Chime)
    const modulator = this.ctx.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(freq * 1.0, time); // 1:1 harmonic ratio for bell chime

    // Modulator Index / Gain Envelope
    const modGain = this.ctx.createGain();
    const modIndex = freq * (1.2 + vel * 1.5);
    modGain.gain.setValueAtTime(modIndex, time);
    modGain.gain.exponentialRampToValueAtTime(0.01, time + Math.min(0.4, duration * 0.5));

    // Connect Modulator -> Carrier frequency
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    // 3. Amplitude Envelope (ADSR)
    const ampGain = this.ctx.createGain();
    ampGain.gain.setValueAtTime(0.0001, time);
    // Soft attack (8ms)
    ampGain.gain.linearRampToValueAtTime(vel * 0.45, time + 0.008);
    // Gentle decay to warm sustain
    const sustainLevel = vel * 0.28;
    ampGain.gain.exponentialRampToValueAtTime(sustainLevel, time + Math.min(0.3, duration * 0.4));
    // Release
    ampGain.gain.setValueAtTime(sustainLevel, time + duration);
    ampGain.gain.exponentialRampToValueAtTime(0.0001, time + duration + 0.15);

    // 4. Warm Cabinet Filter
    const cabinetFilter = this.ctx.createBiquadFilter();
    cabinetFilter.type = 'lowpass';
    cabinetFilter.frequency.setValueAtTime(Math.min(3200, freq * 3.5), time);

    carrier.connect(ampGain);
    ampGain.connect(cabinetFilter);
    cabinetFilter.connect(this.outputNode);

    // Start & Stop
    carrier.start(time);
    modulator.start(time);
    carrier.stop(time + duration + 0.2);
    modulator.stop(time + duration + 0.2);
  }
}
