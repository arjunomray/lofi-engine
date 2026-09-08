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
  wobbleSpeed: number;
  wobbleOffset: number;
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

  // Cozy embers & dust particles
  private particles: Particle[] = [];
  private particleCount: number = 55;
  private timeTick: number = 0;
  private vinylRotation: number = 0;

  // Warm Lo-Fi Color Palette: Warm Amber, Honey, Apricot, Candlelight
  private readonly WARM_AMBER = 36;

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
        vx: (Math.random() - 0.5) * 0.0003,
        vy: -(Math.random() * 0.0006 + 0.0002), // Float gently upward like cozy fireplace embers
        size: Math.random() * 2.2 + 0.8,
        alpha: Math.random() * 0.45 + 0.15,
        hue: Math.random() * 16 + 28, // 28 (deep amber) to 44 (warm honey)
        wobbleSpeed: Math.random() * 2 + 1,
        wobbleOffset: Math.random() * Math.PI * 2
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

    this.timeTick += 0.015;

    // 1. Rich dark roasted coffee / mahogany gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#070503');      // Deep midnight ceiling
    bgGrad.addColorStop(0.48, '#130b06');   // Warm mahogany heart
    bgGrad.addColorStop(0.8, '#19100a');    // Warm wood floor
    bgGrad.addColorStop(1, '#090503');      // Bottom shadow
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Breathing fireplace / warm lamp hearth glow
    const lampGlow = ctx.createRadialGradient(
      width * 0.5, height * 0.58, 15,
      width * 0.5, height * 0.58, Math.max(width, height) * 0.72
    );
    const glowPulse = isPlaying 
      ? 0.16 + (data.bass * 0.16) + Math.sin(this.timeTick * 1.5) * 0.02
      : 0.08 + Math.sin(this.timeTick * 0.8) * 0.015;
    lampGlow.addColorStop(0, `hsla(${this.WARM_AMBER}, 95%, 45%, ${glowPulse})`);
    lampGlow.addColorStop(0.35, `hsla(${this.WARM_AMBER - 8}, 85%, 26%, ${glowPulse * 0.55})`);
    lampGlow.addColorStop(0.7, `rgba(45, 24, 12, ${glowPulse * 0.25})`);
    lampGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = lampGlow;
    ctx.fillRect(0, 0, width, height);

    // 3. Faint rotating vinyl record grooves etched into backdrop
    this.renderVinylBackdrop(ctx, width, height, isPlaying);

    // 4. Floating warm amber embers & dust motes
    this.renderEmbers(ctx, width, height, data.bass, isPlaying);

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
  // MODE 1: WARM INCANDESCENT "BARS AND WAVES"
  // =========================================================================
  private renderBarsAndWaves(
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    data: AudioVisualData,
    isPlaying: boolean
  ) {
    const barWidth = width / this.barCount;
    const padding = Math.max(2, barWidth * 0.22);
    const effectiveWidth = barWidth - padding;
    const baselineY = height * 0.68;
    const maxHeight = height * 0.45;

    const freq = data.frequency;
    const step = Math.floor((freq?.length || 256) / this.barCount);

    // Smooth interpolation (lerp) & Peak Caps
    for (let i = 0; i < this.barCount; i++) {
      let rawVal = isPlaying && freq ? (freq[i * step] || 0) / 255 : 0.02;
      rawVal = Math.pow(rawVal, 0.9) * 1.05;

      // Silky smooth lerp (0.26 speed)
      this.smoothBars[i] += (rawVal - this.smoothBars[i]) * 0.26;
      const val = this.smoothBars[i];

      // Peak Cap gravity physics
      if (val >= this.peakCaps[i]) {
        this.peakCaps[i] = val;
        this.peakDecay[i] = 0;
      } else {
        this.peakDecay[i] += 0.0011; // Gentle gravity
        this.peakCaps[i] = Math.max(0, this.peakCaps[i] - this.peakDecay[i]);
      }

      const barHeight = Math.max(3, val * maxHeight);
      const x = i * barWidth + (padding / 2);
      const y = baselineY - barHeight;

      // Warm Incandescent Tube Gradient:
      // Roasted Sienna -> Honey Amber -> Soft Apricot Candlelight
      const grad = ctx.createLinearGradient(0, baselineY, 0, y);
      grad.addColorStop(0, 'rgba(180, 83, 9, 0.85)');    // Warm base
      grad.addColorStop(0.55, 'rgba(245, 158, 11, 0.92)'); // Honey amber
      grad.addColorStop(1, 'rgba(254, 215, 170, 0.98)');   // Soft cream/peach top

      ctx.fillStyle = grad;
      ctx.beginPath();
      if ((ctx as any).roundRect) {
        (ctx as any).roundRect(x, y, effectiveWidth, barHeight, [4, 4, 0, 0]);
      } else {
        ctx.rect(x, y, effectiveWidth, barHeight);
      }
      ctx.fill();

      // Cozy reflection on the mahogany floor
      const refGrad = ctx.createLinearGradient(0, baselineY, 0, baselineY + barHeight * 0.35);
      refGrad.addColorStop(0, 'rgba(217, 119, 6, 0.25)');
      refGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = refGrad;
      ctx.fillRect(x, baselineY + 2, effectiveWidth, barHeight * 0.35);

      // Falling Peak Cap (warm candlelight tick)
      const peakY = baselineY - (this.peakCaps[i] * maxHeight);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(x, peakY - 3, effectiveWidth, 2);
    }

    // Oscilloscope Ribbon floating warmly across the bars
    this.renderWaveformRibbon(ctx, width, baselineY - (maxHeight * 0.34), data.waveform, isPlaying);
  }

  // =========================================================================
  // MODE 2: WARM GOLDEN OSCILLOSCOPE
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

    // Cozy Golden Thread (Warm amber blur passes)
    const passes = [
      { width: 14, alpha: 0.12, blur: 25, color: '#d97706' },
      { width: 5, alpha: 0.48, blur: 12, color: '#f59e0b' },
      { width: 2.2, alpha: 0.95, blur: 0, color: '#fef3c7' }
    ];

    for (const pass of passes) {
      ctx.save();
      ctx.lineWidth = pass.width;
      ctx.strokeStyle = pass.color;
      ctx.globalAlpha = pass.alpha;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = pass.blur;
      ctx.beginPath();

      const sliceWidth = width / (len - 1);
      for (let i = 0; i < len; i++) {
        const sample = isPlaying && wave ? wave[i] : 0;
        const x = i * sliceWidth;
        const amp = (height * 0.3) * (1 + data.bass * 0.5);
        const y = centerY + (sample * amp);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  // =========================================================================
  // MODE 3: RADIAL SUNSET VINYL (COZY ORB)
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
    const baseRadius = Math.min(width, height) * 0.18 * (1 + data.bass * 0.28);

    const freq = data.frequency;
    const count = 72;
    const step = Math.floor((freq?.length || 256) / count);

    // Warm Sunset Core Orb
    const radialGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, baseRadius * 1.5);
    radialGrad.addColorStop(0, `rgba(245, 158, 11, ${0.28 + data.bass * 0.35})`);
    radialGrad.addColorStop(0.7, 'rgba(180, 83, 9, 0.15)');
    radialGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = radialGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Radiating Warm Spikes
    ctx.save();
    ctx.lineWidth = 2.4;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const val = isPlaying && freq ? (freq[i * step] || 0) / 255 : 0.05;
      const spikeLen = Math.pow(val, 0.85) * (Math.min(width, height) * 0.25);

      const x1 = centerX + Math.cos(angle) * baseRadius;
      const y1 = centerY + Math.sin(angle) * baseRadius;
      const x2 = centerX + Math.cos(angle) * (baseRadius + spikeLen);
      const y2 = centerY + Math.sin(angle) * (baseRadius + spikeLen);

      ctx.strokeStyle = `hsla(${this.WARM_AMBER + (val * 15)}, 90%, 65%, ${0.45 + val * 0.55})`;
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
    ctx.strokeStyle = '#fef3c7'; // Creamy candlelight
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.beginPath();

    const len = Math.min(256, wave.length);
    const sliceWidth = width / (len - 1);

    for (let i = 0; i < len; i++) {
      const sample = wave[i];
      const x = i * sliceWidth;
      const y = baselineY + (sample * 44);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // =========================================================================
  // COZY AMBER EMBERS & DUST MOTES
  // =========================================================================
  private renderEmbers(
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    bass: number, 
    isPlaying: boolean
  ) {
    const pulseFactor = isPlaying ? 1 + (bass * 2.0) : 1;

    for (const p of this.particles) {
      // Float upward with subtle horizontal sway
      p.x += (p.vx + Math.sin(this.timeTick * p.wobbleSpeed + p.wobbleOffset) * 0.0003) * pulseFactor;
      p.y += p.vy * pulseFactor;

      // Wrap around seamlessly
      if (p.x < 0) p.x = 1;
      if (p.x > 1) p.x = 0;
      if (p.y < 0) p.y = 1;
      if (p.y > 1) p.y = 0;

      const px = p.x * width;
      const py = p.y * height;
      const pSize = p.size * (1 + bass * 0.5);

      ctx.fillStyle = `hsla(${p.hue}, 90%, 68%, ${p.alpha * (0.45 + bass * 0.55)})`;
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // =========================================================================
  // FAINT ROTATING VINYL RECORD BACKDROP
  // =========================================================================
  private renderVinylBackdrop(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    isPlaying: boolean
  ) {
    const cx = width * 0.5;
    const cy = height * 0.52;
    const maxRadius = Math.min(width, height) * 0.44;
    const minRadius = Math.min(width, height) * 0.12;

    this.vinylRotation += isPlaying ? 0.003 : 0.0008;

    ctx.save();

    // Subtle turntable platter edge
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.04)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Concentric vinyl grooves
    const grooveCount = 14;
    const grooveStep = (maxRadius - minRadius) / grooveCount;

    ctx.lineWidth = 1;
    for (let i = 0; i < grooveCount; i++) {
      const r = minRadius + i * grooveStep;
      // Alternate subtle opacities for realistic record texture
      const alpha = (i % 3 === 0) ? 0.035 : 0.018;
      ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Faint rotating specular sheen (reflection on vinyl grooves)
    ctx.translate(cx, cy);
    ctx.rotate(this.vinylRotation);

    for (let dir = 0; dir < 2; dir++) {
      const wedgeAngle = dir * Math.PI;
      const sheen = ctx.createRadialGradient(0, 0, minRadius, 0, 0, maxRadius);
      sheen.addColorStop(0, 'rgba(254, 215, 170, 0.025)');
      sheen.addColorStop(0.5, 'rgba(245, 158, 11, 0.015)');
      sheen.addColorStop(1, 'transparent');

      ctx.fillStyle = sheen;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, maxRadius, wedgeAngle - 0.28, wedgeAngle + 0.28);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}
