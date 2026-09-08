/**
 * Sidechain Compressor / Ducking Effect
 * 
 * In Lo-Fi hip hop, whenever the heavy kick drum strikes, the piano chords
 * and atmospheric pads are ducked (attenuated in volume) for 100–250ms.
 * This prevents low-end frequency clashing and gives the rhythm its signature
 * breathing, head-bobbing pulse.
 */
export class SidechainDucker {
  public readonly node: GainNode;
  private strength: number;

  constructor(ctx: AudioContext, initialStrength: number = 0.65) {
    this.node = ctx.createGain();
    this.node.gain.value = 1.0;
    this.strength = initialStrength;
  }

  public setStrength(strength: number) {
    this.strength = Math.max(0, Math.min(1.0, strength));
  }

  /**
   * Triggers a ducking envelope synchronized to a kick drum hit.
   * 
   * @param hitTime Web Audio timestamp when the kick triggers
   */
  public triggerDuck(hitTime: number) {
    const gainParam = this.node.gain;

    // Minimum gain level during the dip (e.g. at strength 0.7, dips down to 0.3)
    const duckedGain = Math.max(0.1, 1.0 - (this.strength * 0.75));

    // Cancel scheduled values to handle fast consecutive kicks cleanly
    gainParam.cancelScheduledValues(hitTime);

    // Instant/rapid attack (10ms)
    gainParam.setValueAtTime(gainParam.value, hitTime);
    gainParam.linearRampToValueAtTime(duckedGain, hitTime + 0.012);

    // Smooth exponential release back to 1.0 over ~180ms
    gainParam.setTargetAtTime(1.0, hitTime + 0.03, 0.09);
  }
}
