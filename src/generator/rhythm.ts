import { PRNG } from './prng.js';

export class RhythmEngine {
  private prng: PRNG;
  private bpm: number;
  private secondsPerBeat: number;
  private secondsPer16th: number;

  constructor(prng: PRNG, bpm: number = 78) {
    this.prng = prng;
    this.bpm = bpm;
    this.secondsPerBeat = 60 / bpm;
    this.secondsPer16th = this.secondsPerBeat / 4;
  }

  public setBpm(bpm: number) {
    this.bpm = bpm;
    this.secondsPerBeat = 60 / bpm;
    this.secondsPer16th = this.secondsPerBeat / 4;
  }

  public getBpm(): number {
    return this.bpm;
  }

  public getSecondsPerBeat(): number {
    return this.secondsPerBeat;
  }

  public getSecondsPer16th(): number {
    return this.secondsPer16th;
  }

  /**
   * Calculates the exact timestamp in seconds for a specific 16th note step in a bar.
   * 
   * @param step16th 0 to 15 (representing the 16 sixteenth-notes in a 4/4 bar)
   * @param swingRatio typically 0.50 (straight) to 0.60 (medium swing) to 0.66 (triplet feel)
   * @param timingJitterMs random microtiming drift (+/- ms)
   */
  public getStepTime(
    barIndex: number, 
    step16th: number, 
    swingRatio: number = 0.58, 
    timingJitterMs: number = 8
  ): number {
    const barStartTime = barIndex * (4 * this.secondsPerBeat);
    const beatIndex = Math.floor(step16th / 4);
    const subBeat16th = step16th % 4; // 0, 1, 2, or 3

    let stepOffsetBeats = beatIndex;

    // Apply swing to off-beats (the 2nd and 4th sixteenth notes: steps 1 and 3)
    if (subBeat16th === 0) {
      stepOffsetBeats += 0;
    } else if (subBeat16th === 1) {
      // Swung 16th note
      stepOffsetBeats += swingRatio * 0.5;
    } else if (subBeat16th === 2) {
      // 8th note
      stepOffsetBeats += 0.5;
    } else if (subBeat16th === 3) {
      // Swung 16th note
      stepOffsetBeats += 0.5 + (swingRatio * 0.5);
    }

    let timeSeconds = barStartTime + (stepOffsetBeats * this.secondsPerBeat);

    // Apply humanized microtiming jitter (e.g. +/- 5-10ms)
    if (timingJitterMs > 0) {
      const jitterSeconds = this.prng.randFloat(-timingJitterMs, timingJitterMs) / 1000;
      timeSeconds += jitterSeconds;
    }

    return Math.max(0, timeSeconds);
  }

  /**
   * Applies the signature "J Dilla Lazy Snare" offset.
   * In classic Lo-Fi hip hop, snares on beats 2 and 4 are intentionally dragged
   * 15ms to 30ms behind the beat to create a laid-back, neck-snapping groove.
   */
  public applyLazySnareDelay(baseTime: number, delayMs: number = 22): number {
    const actualDelay = this.prng.randFloat(delayMs * 0.7, delayMs * 1.3) / 1000;
    return baseTime + actualDelay;
  }

  /**
   * Humanizes velocity with organic variation and ghost-note support.
   */
  public humanizeVelocity(baseVelocity: number, jitter: number = 0.08): number {
    const delta = this.prng.randFloat(-jitter, jitter);
    return Math.max(0.1, Math.min(1.0, baseVelocity + delta));
  }
}
