/**
 * Warm Mellow Sub-Bass Synthesizer
 * 
 * Provides warm low-end weight (40–120 Hz) without rumble:
 * - Sine wave fundamental for clean sub-bass
 * - Subdued triangle wave for subtle 2nd/3rd harmonics (audible on headphones/laptop speakers)
 * - Low-pass filter cutting off highs above 280 Hz
 */
export class BassSynth {
  private ctx: AudioContext;
  public readonly outputNode: GainNode;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.outputNode = ctx.createGain();
    this.outputNode.gain.value = 0.75;
  }

  public playNote(midi: number, time: number, duration: number, velocity: number) {
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const vel = Math.max(0.1, Math.min(1.0, velocity));

    // 1. Fundamental Sub-Bass (Sine)
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(freq, time);

    // 2. Harmonic Body (Triangle)
    const bodyOsc = this.ctx.createOscillator();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(freq, time);

    const bodyGain = this.ctx.createGain();
    bodyGain.gain.value = 0.25; // Keep triangle subtle
    bodyOsc.connect(bodyGain);

    // 3. Low-Pass Warmth Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, time);

    // 4. Amplitude Envelope
    const ampGain = this.ctx.createGain();
    ampGain.gain.setValueAtTime(0.0001, time);
    // Smooth 12ms attack (prevents clicks)
    ampGain.gain.linearRampToValueAtTime(vel * 0.6, time + 0.012);
    // Gentle sustain
    const sustain = vel * 0.48;
    ampGain.gain.linearRampToValueAtTime(sustain, time + 0.05);
    // Smooth release
    ampGain.gain.setValueAtTime(sustain, time + duration);
    ampGain.gain.exponentialRampToValueAtTime(0.0001, time + duration + 0.08);

    subOsc.connect(ampGain);
    bodyGain.connect(ampGain);
    ampGain.connect(filter);
    filter.connect(this.outputNode);

    subOsc.start(time);
    bodyOsc.start(time);
    subOsc.stop(time + duration + 0.1);
    bodyOsc.stop(time + duration + 0.1);
  }
}
