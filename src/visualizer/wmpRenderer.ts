import { AudioVisualData } from '../audio/types.js';

export type VisualizerMode = 'bars_and_waves' | 'neon_scope' | 'radial_alchemy';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export class WMPVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mode: VisualizerMode = 'bars_and_waves';

  // WMP Peak Caps with gravity physics
  private peakCaps: number[] = [];
  private peakDecay: number[] = [];
  private barCount: number = 64;

  // Starfield particles
  private particles: Particle[] = [];
  private particleCount: number = 80;

  // Color theme
  private hueShift: number = 35; // Lo-Fi amber/gold/purple

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Failed to get 2D canvas context');
    this.ctx = context;

    this.initPeaks();
    this.initParticles();
  }

  private initPeaks() {
    this.peakCaps = new Array(this.barCount).fill(0);
    this.peakDecay = new Array(this.barCount).fill(0);
  }

  private initParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.0006,
        vy: (Math.random() - 0.5) * 0.0006,
        size: Math.random() * 2.5 + 0.8,
        alpha: Math.random() * 0.6 + 0.2
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

    // Slowly drift hue over time for hypnotic color breathing
    this.hueShift = (this.hueShift + 0.08) % 360;

    // 1. Fade background with motion blur / persistence of vision
    ctx.fillStyle = 'rgba(10, 12, 16, 0.25)';
    ctx.fillRect(0, 0, width, height);

    // 2. Render subtle reactive background particles
    this.renderParticles(ctx, width, height, data.bass, isPlaying);

    // 3. Render visualizer scene based on active mode
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
    const centerY = height * 0.62;
    const maxHeight = height * 0.45;

    const freq = data.frequency;
    const step = Math.floor((freq?.length || 256) / this.barCount);

    // Render Spectrum Bars
    for (let i = 0; i < this.barCount; i++) {
      let val = isPlaying && freq ? (freq[i * step] || 0) / 255 : 0.02;
      // Add a slight boost to highs
      val = Math.pow(val, 0.85);

      const barH = Math.max(4, val * maxHeight);
      const x = i * barWidth;
      const y = centerY - barH;

      // Peak Cap gravity physics
      if (val >= this.peakCaps[i]) {
        this.peakCaps[i] = val;
        this.peakDecay[i] = 0;
      } else {
        this.peakDecay[i] += 0.0015; // Gravity acceleration
        this.peakCaps[i] = Math.max(0, this.peakCaps[i] - this.peakDecay[i]);
      }

      const peakY = centerY - (this.peakCaps[i] * maxHeight);

      // Bar gradient (Warm Amber -> Neon Coral -> Lavender)
      const grad = ctx.createLinearGradient(0, centerY, 0, y);
      grad.addColorStop(0, `hsla(${this.hueShift}, 90%, 55%, 0.85)`);
      grad.addColorStop(0.5, `hsla(${this.hueShift + 35}, 85%, 60%, 0.9)`);
      grad.addColorStop(1, `hsla(${this.hueShift + 70}, 95%, 70%, 1.0)`);

      ctx.fillStyle = grad;
      ctx.fillRect(x + 1, y, barWidth - 2, barH);

      // Reflection underneath with fadeout
      ctx.fillStyle = `hsla(${this.hueShift}, 85%, 50%, 0.18)`;
      ctx.fillRect(x + 1, centerY + 2, barWidth - 2, barH * 0.4);

      // Falling Peak Cap (The classic WMP cap)
      ctx.fillStyle = `hsla(${this.hueShift + 60}, 100%, 85%, 0.95)`;
      ctx.fillRect(x + 1, peakY - 3, barWidth - 2, 2.5);
    }

    // Overlay Oscilloscope Ribbon
    this.renderWaveformOverlay(ctx, width, centerY - (maxHeight * 0.3), data.waveform, isPlaying);
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

    // Glowing Neon Waveform Ribbons (Multi-pass glow)
    const layers = [
      { width: 10, alpha: 0.15, blur: 25 },
      { width: 4, alpha: 0.5, blur: 12 },
      { width: 2, alpha: 0.95, blur: 0 }
    ];

    for (const layer of layers) {
      ctx.save();
      ctx.lineWidth = layer.width;
      ctx.strokeStyle = `hsla(${this.hueShift + 25}, 90%, 65%, ${layer.alpha})`;
      ctx.shadowColor = `hsla(${this.hueShift + 25}, 100%, 55%, 1.0)`;
      ctx.shadowBlur = layer.blur;
      ctx.beginPath();

      const sliceWidth = width / (len - 1);
      for (let i = 0; i < len; i++) {
        const sample = isPlaying && wave ? wave[i] : 0;
        const x = i * sliceWidth;
        // Amplify wave displacement with bass energy
        const amp = (height * 0.35) * (1 + data.bass * 0.6);
        const y = centerY + (sample * amp);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  // =========================================================================
  // MODE 3: RADIAL ALCHEMY (PULSING FREQUENCY ORB)
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
    const baseRadius = Math.min(width, height) * 0.18 * (1 + data.bass * 0.35);

    const freq = data.frequency;
    const count = 96;
    const step = Math.floor((freq?.length || 256) / count);

    // Radiant core glow
    const radialGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, baseRadius * 1.6);
    radialGrad.addColorStop(0, `hsla(${this.hueShift}, 90%, 60%, ${0.2 + data.bass * 0.4})`);
    radialGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = radialGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Radial frequency spikes
    ctx.save();
    ctx.lineWidth = 3;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const val = isPlaying && freq ? (freq[i * step] || 0) / 255 : 0.05;
      const spikeLen = Math.pow(val, 0.9) * (Math.min(width, height) * 0.28);

      const x1 = centerX + Math.cos(angle) * baseRadius;
      const y1 = centerY + Math.sin(angle) * baseRadius;
      const x2 = centerX + Math.cos(angle) * (baseRadius + spikeLen);
      const y2 = centerY + Math.sin(angle) * (baseRadius + spikeLen);

      ctx.strokeStyle = `hsla(${this.hueShift + (i / count) * 80}, 95%, 65%, ${0.5 + val * 0.5})`;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // =========================================================================
  // WAVEFORM OVERLAY
  // =========================================================================
  private renderWaveformOverlay(
    ctx: CanvasRenderingContext2D, 
    width: number, 
    baselineY: number, 
    wave: Float32Array, 
    isPlaying: boolean
  ) {
    if (!wave || !isPlaying) return;

    ctx.save();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = `hsla(${this.hueShift + 120}, 90%, 75%, 0.85)`;
    ctx.shadowColor = `hsla(${this.hueShift + 120}, 100%, 60%, 0.8)`;
    ctx.shadowBlur = 10;
    ctx.beginPath();

    const len = Math.min(256, wave.length);
    const sliceWidth = width / (len - 1);

    for (let i = 0; i < len; i++) {
      const sample = wave[i];
      const x = i * sliceWidth;
      const y = baselineY + (sample * 55);

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
    const pulseFactor = isPlaying ? 1 + (bass * 2.5) : 1;

    for (const p of this.particles) {
      p.x += p.vx * pulseFactor;
      p.y += p.vy * pulseFactor;

      if (p.x < 0) p.x = 1;
      if (p.x > 1) p.x = 0;
      if (p.y < 0) p.y = 1;
      if (p.y > 1) p.y = 0;

      const px = p.x * width;
      const py = p.y * height;
      const pSize = p.size * (1 + bass * 0.8);

      ctx.fillStyle = `hsla(${this.hueShift + 40}, 80%, 75%, ${p.alpha * (0.4 + bass * 0.6)})`;
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
