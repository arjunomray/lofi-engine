/**
 * Warm Muted Lo-Fi Lead / Felt Tone
 * 
 * Redesigned to remove harsh 8-bit / arcade "ping" artifacts:
 * - Pure sine oscillator with subtle breath harmonic (no harsh triangle waves)
 * - Soft 40ms attack (eliminates sharp digital ping transients)
 * - Warm low-pass filter (~1100 Hz) for a cozy, organic jazz tone
 * - Very slow, gentle drift (0.6 Hz) instead of rapid chiptune vibrato
 */
export class LeadSynth {
  private ctx: AudioContext;
  public readonly outputNode: GainNode;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.outputNode = ctx.createGain();
    this.outputNode.gain.value = 0.32; // Gentle, sits comfortably behind the chords
  }

  public playNote(midi: number, time: number, duration: number, velocity: number) {
    // Keep melody strictly in warm octave 3/4 (MIDI 50 - 68) to prevent video game pings
    let pitch = midi;
    while (pitch > 69) pitch -= 12;

    const freq = 440 * Math.pow(2, (pitch - 69) / 12);
    const vel = Math.max(0.05, Math.min(1.0, velocity));

    // 1. Fundamental Pure Sine (Warm & Mellow)
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    // 2. Subtle 2nd harmonic for organic body (very soft)
    const harmonicOsc = this.ctx.createOscillator();
    harmonicOsc.type = 'sine';
    harmonicOsc.frequency.setValueAtTime(freq * 2, time);
    const harmonicGain = this.ctx.createGain();
    harmonicGain.gain.value = 0.12;
    harmonicOsc.connect(harmonicGain);

    // 3. Very Slow, Subtle Tape Drift (0.6 Hz) - NOT chiptune vibrato
    const driftLfo = this.ctx.createOscillator();
    const driftGain = this.ctx.createGain();
    driftLfo.type = 'sine';
    driftLfo.frequency.setValueAtTime(0.6, time); // Slow tape wow
    driftGain.gain.setValueAtTime(freq * 0.004, time); // Extremely subtle

    driftLfo.connect(driftGain);
    driftGain.connect(osc.frequency);

    // 4. Amplitude Envelope: Soft attack (35ms) to eliminate any "ping" click
    const ampGain = this.ctx.createGain();
    ampGain.gain.setValueAtTime(0.0001, time);
    ampGain.gain.linearRampToValueAtTime(vel * 0.4, time + 0.038);
    // Smooth gentle sustain & release
    const sustain = vel * 0.25;
    ampGain.gain.exponentialRampToValueAtTime(sustain, time + Math.min(0.25, duration * 0.5));
    ampGain.gain.setValueAtTime(sustain, time + duration);
    ampGain.gain.exponentialRampToValueAtTime(0.0001, time + duration + 0.18);

    // 5. Steep Lo-Fi Warmth Filter (cuts all harsh highs above 1100 Hz)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, time);

    osc.connect(ampGain);
    harmonicGain.connect(ampGain);
    ampGain.connect(filter);
    filter.connect(this.outputNode);

    driftLfo.start(time);
    osc.start(time);
    harmonicOsc.start(time);

    driftLfo.stop(time + duration + 0.2);
    osc.stop(time + duration + 0.2);
    harmonicOsc.stop(time + duration + 0.2);
  }
}
