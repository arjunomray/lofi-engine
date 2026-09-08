/**
 * Analog Tape Wow & Flutter Emulator
 * 
 * Uses a modulated delay line:
 * - A base delay of ~10ms
 * - A low-frequency oscillator (LFO) subtly varies the delay time up and down
 * - By the Doppler effect, varying the delay time in real-time creates authentic
 *   pitch wobble (wow & flutter) identical to an old cassette deck or reel-to-reel.
 */
export class TapeEffects {
  public readonly inputNode: GainNode;
  public readonly outputNode: GainNode;
  private delayNode: DelayNode;
  private lfo: OscillatorNode;
  private lfoGain: GainNode;

  constructor(ctx: AudioContext, depth: number = 0.35, speedHz: number = 0.8) {
    this.inputNode = ctx.createGain();
    this.outputNode = ctx.createGain();

    // Base delay buffer (10ms)
    this.delayNode = ctx.createDelay(0.05);
    this.delayNode.delayTime.value = 0.01;

    // LFO to modulate delay
    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = speedHz;

    // Depth: scales LFO modulation (0 to ~0.0015 seconds variance)
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = depth * 0.0012;

    // Connect LFO -> LfoGain -> delayNode.delayTime (AudioParam modulation)
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.delayNode.delayTime);

    // Audio routing: Input -> DelayNode -> Output
    this.inputNode.connect(this.delayNode);
    this.delayNode.connect(this.outputNode);

    // Start LFO
    this.lfo.start();
  }

  public setDepth(depth: number, ctx: AudioContext) {
    // Range: 0 to 0.002s delay variance
    const targetGain = Math.max(0, Math.min(1, depth)) * 0.0018;
    this.lfoGain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.05);
  }

  public setSpeed(speedHz: number, ctx: AudioContext) {
    const targetFreq = Math.max(0.2, Math.min(3.0, speedHz));
    this.lfo.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.05);
  }

  public dispose() {
    try {
      this.lfo.stop();
      this.lfo.disconnect();
    } catch {}
  }
}
