/**
 * Procedural Vinyl Crackle, Dust & Ambient Hiss Generator
 * 
 * Synthesizes vintage turntable surface noise directly in browser memory:
 * - Filtered pink noise for continuous turntable background roar/hiss
 * - Random Poisson-distributed impulses for dust clicks and vinyl pops
 * - Loops indefinitely with dedicated volume control (0 external downloads needed)
 */
export class VinylNoise {
  public readonly outputNode: GainNode;
  private sourceNode: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode;
  private isRunning: boolean = false;

  constructor(ctx: AudioContext, initialVolume: number = 0.25) {
    this.outputNode = ctx.createGain();
    this.outputNode.gain.value = initialVolume;

    // Filter noise to sound like a vintage turntable needle
    this.filterNode = ctx.createBiquadFilter();
    this.filterNode.type = 'bandpass';
    this.filterNode.frequency.value = 1800; // Warm midrange surface noise
    this.filterNode.Q.value = 0.8;

    this.filterNode.connect(this.outputNode);
  }

  public start(ctx: AudioContext) {
    if (this.isRunning) return;

    // Generate a 4-second looping buffer of authentic vinyl dust & crackle
    const sampleRate = ctx.sampleRate;
    const bufferLength = sampleRate * 4; // 4 seconds
    const noiseBuffer = ctx.createBuffer(1, bufferLength, sampleRate);
    const data = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0;

    for (let i = 0; i < bufferLength; i++) {
      // 1. Pink noise generator (Paul Kellet's algorithm) for warm hum
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      let pink = (b0 + b1 + b2 + white * 0.5362) * 0.04;

      // 2. Vinyl pops & clicks: 0.08% chance of sharp dust pop
      if (Math.random() < 0.0008) {
        // High-amplitude rapid impulse with decay
        const pop = (Math.random() * 2 - 1) * (0.3 + Math.random() * 0.4);
        pink += pop;
      }

      data[i] = pink;
    }

    this.sourceNode = ctx.createBufferSource();
    this.sourceNode.buffer = noiseBuffer;
    this.sourceNode.loop = true;
    this.sourceNode.connect(this.filterNode);
    this.sourceNode.start();
    this.isRunning = true;
  }

  public setVolume(volume: number, ctx: AudioContext) {
    this.outputNode.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), ctx.currentTime, 0.03);
  }

  public stop() {
    if (!this.isRunning || !this.sourceNode) return;
    try {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
    } catch {}
    this.isRunning = false;
  }
}
