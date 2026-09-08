/**
 * Warm Analog Low-Pass Filter
 * Eliminates high-end digital harshness and gives that muffled vintage radio/cassette tone.
 */
export class LoFiFilter {
  public readonly node: BiquadFilterNode;

  constructor(ctx: AudioContext, initialCutoff: number = 4500, initialQ: number = 1.2) {
    this.node = ctx.createBiquadFilter();
    this.node.type = 'lowpass';
    this.node.frequency.value = initialCutoff;
    this.node.Q.value = initialQ;
  }

  public setCutoff(frequencyHz: number, ctx: AudioContext) {
    // Smooth ramp over 20ms to prevent clicks or popping artifacts
    this.node.frequency.setTargetAtTime(frequencyHz, ctx.currentTime, 0.02);
  }

  public setResonance(q: number, ctx: AudioContext) {
    this.node.Q.setTargetAtTime(q, ctx.currentTime, 0.02);
  }
}
