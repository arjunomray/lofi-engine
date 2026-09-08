/**
 * Mellow Lead / Vibraphone Synthesizer
 * 
 * Plays smooth, sparse top-line jazz and chime melody riffs:
 * - Sine/Triangle oscillator with gentle vibrato LFO (5 Hz)
 * - Soft 15ms attack and warm lowpass filter
 */
export class LeadSynth {
  private ctx: AudioContext;
  public readonly outputNode: GainNode;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.outputNode = ctx.createGain();
    this.outputNode.gain.value = 0.45;
  }

  public playNote(midi: number, time: number, duration: number, velocity: number) {
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const vel = Math.max(0.05, Math.min(1.0, velocity));

    // 1. Main Tone (Triangle)
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    // 2. Subtle Vibrato (LFO)
    const vibrato = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();
    vibrato.type = 'sine';
    vibrato.frequency.setValueAtTime(5.2, time); // 5.2 Hz gentle vibrato
    vibratoGain.gain.setValueAtTime(freq * 0.015, time); // Subtle depth

    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    // 3. Amplitude Envelope
    const ampGain = this.ctx.createGain();
    ampGain.gain.setValueAtTime(0.0001, time);
    // Soft 15ms attack
    ampGain.gain.linearRampToValueAtTime(vel * 0.55, time + 0.015);
    // Gentle decay
    ampGain.gain.exponentialRampToValueAtTime(vel * 0.35, time + Math.min(0.2, duration * 0.5));
    // Release
    ampGain.gain.setValueAtTime(vel * 0.35, time + duration);
    ampGain.gain.exponentialRampToValueAtTime(0.0001, time + duration + 0.12);

    // 4. Lowpass Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, time);

    osc.connect(ampGain);
    ampGain.connect(filter);
    filter.connect(this.outputNode);

    vibrato.start(time);
    osc.start(time);
    vibrato.stop(time + duration + 0.15);
    osc.stop(time + duration + 0.15);
  }
}
