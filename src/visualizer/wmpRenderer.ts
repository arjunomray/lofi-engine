import { AudioVisualData } from '../audio/types.js';

export type VisualizerMode = 'bars_and_waves' | 'neon_scope' | 'radial_alchemy';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  hue: number;
}

export class WMPVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mode: VisualizerMode = 'bars_and_waves';

  // Smooth smoothed values for silky 60fps motion
  private smoothBars: number[] = [];
  private peakCaps: number[] = [];
  private peakDecay: number[] = [];
  private barCount: number = 48; // Optimal count for wide display

  // Particles
  private particles: Particle[] = [];
  private particleCount: number = 60;

  // Aesthetic color palette (Warm Lo-Fi Amber -> Rose -> Violet)
  private hueBase: number = 38; // Amber

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Failed to get 2D canvas context');
    this.ctx = context;

    this.smoothBars = new Array(this.barCount).fill(0);
    this.peakCaps = new Array(this.barCount).fill(0);
    this.peakDecay = new Array(this.barCount).fill(0);

    this.initParticles();
  }

  private initParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.0004,
        vy: (Math.random() - 0.5) * 0.0004,
        size: Math.random() * 2.0 + 0.6,
        alpha: Math.random() * 0.5 + 0.15,
        hue: Math.random() * 40 + 25
      });
    }
  }

  public setMode(mode: VisualizerMode) {
    this.mode = mode;
  }

  public cycleMode(): VisualizerMode {
    const modes: VisualizerMode[] = ['bars_and_waves', 'neon_scope', 'radial_alchemy'];
    const nextIdx = (modes.indexOf(this.mode) + 1) % modes.length;
    this.mode = modes[nextIdx];
    return this.mode;
  }

  public getMode(): VisualizerMode {
    return this.mode;
  }

  /**
   * Main 60 FPS Render Loop
   */
  public render(data: AudioVisualData, isPlaying: boolean) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const ctx = this.ctx;

    // Slow ambient color breathing
    this.hueBase = (this.hueBase + 0.05) % 360;

    // 1. Clear with deep rich obsidian gradient
    ctx.fillStyle = '#07080c';
    ctx.fillRect(0, 0, width, height);

    // 2. Ambient radial room glow
    const centerGrad = ctx.createRadialGradient(
      width / 2, height * 0.55, 10,
      width / 2, height * 0.55, Math.max(width, height) * 0.6
    );
    const glowAlpha = isPlaying ? 0.08 + (data.bass * 0.12) : 0.04;
    centerGrad.addColorStop(0, `hsla(${this.hueBase}, 85%, 45%, ${glowAlpha})`);
    centerGrad.addColorStop(0.6, `hsla(${this.hueBase + 30}, 80%, 25%, ${glowAlpha * 0.4})`);
    centerGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = centerGrad;
    ctx.fillRect(0, 0, width, height);

    // 3. Floating Dust & Star Particles
    this.renderParticles(ctx, width, height, data.bass, isPlaying);

    // 4. Render Active Visualizer Mode
    switch (this.mode) {
      case 'bars_and_waves':
        this.renderBarsAndWaves(ctx, width, height, data, isPlaying);
        break;
      case 'neon_scope':
        this.renderNeonScope(ctx, width, height, data, isPlaying);
        break;
      case 'radial_alchemy':
        this.renderRadialAlchemy(ctx, width, height, data, isPlaying);
        break;
    }
  }

  // =========================================================================
  // MODE 1: CLASSIC WINDOWS MEDIA PLAYER "BARS AND WAVES"
  // =========================================================================
  private renderBarsAndWaves(
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    data: AudioVisualData,
    isPlaying: boolean
  ) {
    const barWidth = width / this.barCount;
    const padding = Math.max(2, barWidth * 0.2);
    const effectiveWidth = barWidth - padding;
    const baselineY = height * 0.68;
    const maxHeight = height * 0.46;

    const freq = data.frequency;
    const step = Math.floor((freq?.length || 256) / this.barCount);

    // Smooth interpolation (lerp) & Peak Caps
    for (let i = 0; i < this.barCount; i++) {
      let rawVal = isPlaying && freq ? (freq[i * step] || 0) / 255 : 0.02;
      // Frequency weighting: slight boost for aesthetic visual balance
      rawVal = Math.pow(rawVal, 0.9) * 1.1;

      // Smooth lerp (0.28 speed for silky fluid feel)
      this.smoothBars[i] += (rawVal - this.smoothBars[i]) * 0.28;
      const val = this.smoothBars[i];

      // Peak Cap gravity physics
      if (val >= this.peakCaps[i]) {
        this.peakCaps[i] = val;
        this.peakDecay[i] = 0;
      } else {
        this.peakDecay[i] += 0.0012; // Gravity
        this.peakCaps[i] = Math.max(0, this.peakCaps[i] - this.peakDecay[i]);
      }

      const barHeight = Math.max(3, val * maxHeight);
      const x = i * barWidth + (padding / 2);
      const y = baselineY - barHeight;

      // Glowing Bar Gradient (Warm Amber -> Golden Apricot -> Soft Lavender)
      const grad = ctx.createLinearGradient(0, baselineY, 0, y);
      grad.addColorStop(0, `hsla(${this.hueBase}, 90%, 50%, 0.85)`);
      grad.addColorStop(0.5, `hsla(${this.hueBase + 25}, 85%, 58%, 0.92)`);
      grad.addColorStop(1, `hsla(${this.hueBase + 55}, 95%, 72%, 0.98)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      if ((ctx as any).roundRect) {
        (ctx as any).roundRect(x, y, effectiveWidth, barHeight, [4, 4, 0, 0]);
      } else {
        ctx.rect(x, y, effectiveWidth, barHeight);
      }
      ctx.fill();

      // Mirror reflection underneath (classic media player floor)
      const refGrad = ctx.createLinearGradient(0, baselineY, 0, baselineY + barHeight * 0.35);
      refGrad.addColorStop(0, `hsla(${this.hueBase}, 85%, 50%, 0.25)`);
      refGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = refGrad;
      ctx.fillRect(x, baselineY + 2, effectiveWidth, barHeight * 0.35);

      // Falling Peak Cap (floating horizontal tick)
      const peakY = baselineY - (this.peakCaps[i] * maxHeight);
      ctx.fillStyle = `hsla(${this.hueBase + 45}, 100%, 82%, 0.9)`;
      ctx.fillRect(x, peakY - 3, effectiveWidth, 2);
    }

    // Oscilloscope Ribbon floating across the bars
    this.renderWaveformRibbon(ctx, width, baselineY - (maxHeight * 0.35), data.waveform, isPlaying);
  }

  // =========================================================================
  // MODE 2: NEON OSCILLOSCOPE SCOPE
  // =========================================================================
  private renderNeonScope(
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    data: AudioVisualData,
    isPlaying: boolean
  ) {
    const centerY = height * 0.5;
    const wave = data.waveform;
    const len = wave?.length || 256;

    // Glowing Neon Passes (Wide blur glow + sharp center line)
    const passes = [
      { width: 12, alpha: 0.12, blur: 28 },
      { width: 5, alpha: 0.45, blur: 14 },
      { width: 2.2, alpha: 0.95, blur: 0 }
    ];

    for (const pass of passes) {
      ctx.save();
      ctx.lineWidth = pass.width;
      ctx.strokeStyle = `hsla(${this.hueBase + 20}, 95%, 65%, ${pass.alpha})`;
      ctx.shadowColor = `hsla(${this.hueBase + 20}, 100%, 55%, 1.0)`;
      ctx.shadowBlur = pass.blur;
      ctx.beginPath();

      const sliceWidth = width / (len - 1);
      for (let i = 0; i < len; i++) {
        const sample = isPlaying && wave ? wave[i] : 0;
        const x = i * sliceWidth;
        // Audio reactive scale
        const amp = (height * 0.32) * (1 + data.bass * 0.5);
        const y = centerY + (sample * amp);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  // =========================================================================
  // MODE 3: RADIAL ALCHEMY (STARBURST ORB)
  // =========================================================================
  private renderRadialAlchemy(
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    data: AudioVisualData,
    isPlaying: boolean
  ) {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.18 * (1 + data.bass * 0.3);

    const freq = data.frequency;
    const count = 72;
    const step = Math.floor((freq?.length || 256) / count);

    // Inner glowing orb
    const radialGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, baseRadius * 1.5);
    radialGrad.addColorStop(0, `hsla(${this.hueBase}, 95%, 65%, ${0.25 + data.bass * 0.35})`);
    radialGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = radialGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Radiating spikes
    ctx.save();
    ctx.lineWidth = 2.5;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const val = isPlaying && freq ? (freq[i * step] || 0) / 255 : 0.05;
      const spikeLen = Math.pow(val, 0.85) * (Math.min(width, height) * 0.26);

      const x1 = centerX + Math.cos(angle) * baseRadius;
      const y1 = centerY + Math.sin(angle) * baseRadius;
      const x2 = centerX + Math.cos(angle) * (baseRadius + spikeLen);
      const y2 = centerY + Math.sin(angle) * (baseRadius + spikeLen);

      ctx.strokeStyle = `hsla(${this.hueBase + (i / count) * 60}, 95%, 68%, ${0.4 + val * 0.6})`;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // =========================================================================
  // SILKY WAVEFORM RIBBON
  // =========================================================================
  private renderWaveformRibbon(
    ctx: CanvasRenderingContext2D, 
    width: number, 
    baselineY: number, 
    wave: Float32Array, 
    isPlaying: boolean
  ) {
    if (!wave || !isPlaying) return;

    ctx.save();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = `hsla(${this.hueBase + 85}, 95%, 75%, 0.85)`;
    ctx.shadowColor = `hsla(${this.hueBase + 85}, 100%, 65%, 0.8)`;
    ctx.shadowBlur = 12;
    ctx.beginPath();

    const len = Math.min(256, wave.length);
    const sliceWidth = width / (len - 1);

    for (let i = 0; i < len; i++) {
      const sample = wave[i];
      const x = i * sliceWidth;
      const y = baselineY + (sample * 48);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // =========================================================================
  // DUST PARTICLES
  // =========================================================================
  private renderParticles(
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    bass: number, 
    isPlaying: boolean
  ) {
    const pulseFactor = isPlaying ? 1 + (bass * 2.2) : 1;

    for (const p of this.particles) {
      p.x += p.vx * pulseFactor;
      p.y += p.vy * pulseFactor;

      if (p.x < 0) p.x = 1;
      if (p.x > 1) p.x = 0;
      if (p.y < 0) p.y = 1;
      if (p.y > 1) p.y = 0;

      const px = p.x * width;
      const py = p.y * height;
      const pSize = p.size * (1 + bass * 0.6);

      ctx.fillStyle = `hsla(${p.hue}, 85%, 70%, ${p.alpha * (0.4 + bass * 0.6)})`;
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
