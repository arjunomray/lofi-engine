import { AudioVisualData } from '../audio/types.js';

export type VisualizerMode = 'vintage_vinyl' | 'cassette_tape' | 'analog_scope';

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

interface NeedleRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export class WMPVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mode: VisualizerMode = 'vintage_vinyl';

  // Smooth smoothed values for silky 60fps motion
  private smoothedBass: number = 0;
  private smoothedMids: number = 0;
  private smoothedTreble: number = 0;

  // VU Meter needle physics (spring-damped)
  private vuL: number = 0;
  private vuR: number = 0;
  private vuVelocityL: number = 0;
  private vuVelocityR: number = 0;

  // Rotations & timelines
  private timeTick: number = 0;
  private vinylAngle: number = 0;
  private cassetteReelAngle: number = 0;
  private needleRipples: NeedleRipple[] = [];

  // Synthwave neon dust & starlight particles
  private particles: Particle[] = [];
  private particleCount: number = 55;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Failed to get 2D canvas context');
    this.ctx = context;

    this.initParticles();
  }

  private initParticles() {
    this.particles = [];
    const hues = [185, 330, 270, 40]; // Cyan, Magenta, Purple, Sun Gold
    for (let i = 0; i < this.particleCount; i++) {
      const hue = hues[i % hues.length];
      this.particles.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.0003,
        vy: -(Math.random() * 0.0006 + 0.0002), // Float upward into the night
        size: Math.random() * 2.2 + 0.8,
        alpha: Math.random() * 0.45 + 0.15,
        hue,
        wobbleSpeed: Math.random() * 2.0 + 0.8,
        wobbleOffset: Math.random() * Math.PI * 2
      });
    }
  }

  public setMode(mode: VisualizerMode) {
    this.mode = mode;
  }

  public cycleMode(): VisualizerMode {
    const modes: VisualizerMode[] = ['vintage_vinyl', 'cassette_tape', 'analog_scope'];
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
  public render(data: AudioVisualData, isPlaying: boolean, seedText: string = 'lofi-vibe') {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const ctx = this.ctx;

    this.timeTick += 0.015;

    // Smooth audio reactivity values
    const targetBass = isPlaying ? data.bass : 0;
    const targetMids = isPlaying ? data.mids : 0;
    const targetTreble = isPlaying ? data.treble : 0;

    this.smoothedBass += (targetBass - this.smoothedBass) * 0.12;
    this.smoothedMids += (targetMids - this.smoothedMids) * 0.15;
    this.smoothedTreble += (targetTreble - this.smoothedTreble) * 0.18;

    // 1. Synthwave atmospheric background
    this.renderSynthwaveBackground(ctx, width, height, this.smoothedBass, isPlaying);

    // 2. Floating neon particles & starlight
    this.renderEmbers(ctx, width, height, this.smoothedBass, isPlaying);

    // 3. Render Active Mode
    switch (this.mode) {
      case 'vintage_vinyl':
        this.renderVintageVinyl(ctx, width, height, data, isPlaying, seedText);
        break;
      case 'cassette_tape':
        this.renderCassetteTape(ctx, width, height, data, isPlaying, seedText);
        break;
      case 'analog_scope':
        this.renderAnalogScope(ctx, width, height, data, isPlaying);
        break;
    }
  }

  // =========================================================================
  // SYNTHWAVE ATMOSPHERIC BACKGROUND
  // =========================================================================
  private renderSynthwaveBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bass: number,
    isPlaying: boolean
  ) {
    // Midnight obsidian to deep retro purple vertical gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#05020a');
    bgGrad.addColorStop(0.45, '#0e051a');
    bgGrad.addColorStop(0.78, '#18072d');
    bgGrad.addColorStop(1, '#080210');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Ambient Synthwave Sunset / Horizon Glow
    const glowPulse = isPlaying
      ? 0.15 + (bass * 0.18) + Math.sin(this.timeTick * 1.5) * 0.02
      : 0.08 + Math.sin(this.timeTick * 0.8) * 0.015;

    // Center Hot Magenta Horizon Glow
    const horizonGlow = ctx.createRadialGradient(
      width * 0.5, height * 0.55, 10,
      width * 0.5, height * 0.55, Math.max(width, height) * 0.65
    );
    horizonGlow.addColorStop(0, `rgba(255, 0, 127, ${glowPulse * 0.9})`);
    horizonGlow.addColorStop(0.4, `rgba(139, 92, 246, ${glowPulse * 0.6})`);
    horizonGlow.addColorStop(0.8, `rgba(0, 240, 255, ${glowPulse * 0.15})`);
    horizonGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = horizonGlow;
    ctx.fillRect(0, 0, width, height);
  }

  // =========================================================================
  // MODE 1: SYNTHWAVE VINYL TURNTABLE
  // =========================================================================
  private renderVintageVinyl(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: AudioVisualData,
    isPlaying: boolean,
    seedText: string
  ) {
    const cx = width * 0.5;
    const cy = height * 0.5;
    const R = Math.min(width * 0.44, height * 0.40, 310);
    if (R <= 30) return;

    this.vinylAngle += isPlaying ? 0.016 : 0.001;

    // A. Turntable Platter Base with Neon Cyan / Magenta Halo
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R + 14, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0414';
    ctx.shadowColor = 'rgba(0, 240, 255, 0.4)';
    ctx.shadowBlur = 30;
    ctx.fill();

    // Platter Outer Rim (Glowing Neon Cyan)
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // B. The Obsidian Vinyl Record Disc
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = '#07050d'; // Deep obsidian black
    ctx.fill();

    // Outer beveled edge
    const rimGrad = ctx.createRadialGradient(cx, cy, R - 6, cx, cy, R);
    rimGrad.addColorStop(0, '#07050d');
    rimGrad.addColorStop(0.5, '#1e1136');
    rimGrad.addColorStop(1, '#040208');
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.arc(cx, cy, R - 6, 0, Math.PI * 2, true);
    ctx.fill();

    // C. Micro-Grooves with subtle neon reflections
    const labelR = R * 0.35;
    const grooveWidth = R - labelR - 12;

    ctx.lineWidth = 1;
    for (let i = 0; i < 28; i++) {
      const frac = i / 28;
      const r = labelR + 10 + frac * grooveWidth;
      const isGap = (i % 6 === 0);
      const alpha = isGap ? 0.09 : 0.03 + (Math.sin(i * 3.7) * 0.015);

      ctx.strokeStyle = (i % 2 === 0) 
        ? `rgba(0, 240, 255, ${alpha})` 
        : `rgba(255, 0, 127, ${alpha})`;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // D. Dual Neon Specular Light Sheen (Magenta & Cyan light wings)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.vinylAngle);

    const sheenAmp = isPlaying ? 0.06 + (this.smoothedBass * 0.05) : 0.035;
    for (let dir = 0; dir < 2; dir++) {
      const angle = dir * Math.PI;
      const sheenGrad = ctx.createRadialGradient(0, 0, labelR, 0, 0, R);
      sheenGrad.addColorStop(0, `rgba(255, 0, 127, ${sheenAmp * 1.6})`);
      sheenGrad.addColorStop(0.45, `rgba(0, 240, 255, ${sheenAmp * 1.3})`);
      sheenGrad.addColorStop(0.85, `rgba(139, 92, 246, ${sheenAmp * 0.7})`);
      sheenGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = sheenGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, angle - 0.35, angle + 0.35);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // E. Center Synthwave Sun Paper Label (Rotates with record!)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.vinylAngle);

    // Label Disc Background
    ctx.beginPath();
    ctx.arc(0, 0, labelR, 0, Math.PI * 2);
    const labelGrad = ctx.createLinearGradient(0, -labelR, 0, labelR);
    labelGrad.addColorStop(0, '#ff007f'); // Hot Neon Pink
    labelGrad.addColorStop(0.48, '#f97316'); // Retro Sun Orange
    labelGrad.addColorStop(0.52, '#8b5cf6'); // Violet Horizon
    labelGrad.addColorStop(1, '#0b0416'); // Midnight Violet
    ctx.fillStyle = labelGrad;
    ctx.shadowColor = 'rgba(255, 0, 127, 0.5)';
    ctx.shadowBlur = 12;
    ctx.fill();

    // Retro Sun Horizontal Grid Slices (Iconic Synthwave Sun)
    ctx.fillStyle = '#0b0416';
    const sunStripes = 4;
    for (let s = 1; s <= sunStripes; s++) {
      const stripeY = -labelR * 0.5 + (s * (labelR * 0.1));
      const stripeH = s * 1.5;
      ctx.fillRect(-labelR * 0.8, stripeY, labelR * 1.6, stripeH);
    }

    // Outer Label Neon Ring
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, labelR - 4, 0, Math.PI * 2);
    ctx.stroke();

    // Label Typography
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Top Header
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.max(8, labelR * 0.11)}px 'JetBrains Mono', monospace`;
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText('SIDE A • 33 ⅓ RPM', 0, -labelR * 0.65);

    // Track Title (Clean seed name)
    const cleanTitle = seedText.toUpperCase().slice(0, 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${Math.max(10, labelR * 0.17)}px 'Outfit', sans-serif`;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.fillText(cleanTitle, 0, labelR * 0.12);

    // Subtitle
    ctx.fillStyle = '#00f0ff';
    ctx.font = `600 ${Math.max(7, labelR * 0.09)}px 'JetBrains Mono', monospace`;
    ctx.shadowBlur = 0;
    ctx.fillText('SYNTHWAVE LO-FI', 0, labelR * 0.42);
    ctx.fillText('RETRO STEREO', 0, labelR * 0.65);

    // Center Spindle Hole (Neon Cyan rim + dark hole)
    const spindleR = labelR * 0.16;
    ctx.beginPath();
    ctx.arc(0, 0, spindleR + 2, 0, Math.PI * 2);
    ctx.fillStyle = '#00f0ff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, spindleR, 0, Math.PI * 2);
    ctx.fillStyle = '#06020c';
    ctx.fill();

    ctx.restore();

    // F. Chrome Tonearm & Glowing Neon Stylus
    const armPivotX = cx + R * 0.96;
    const armPivotY = cy - R * 0.88;
    const needleX = cx + R * 0.58;
    const needleY = cy - R * 0.12;

    // Spawn soundwave ripples at needle
    if (isPlaying && (data.bass > 0.4 || data.mids > 0.5)) {
      if (Math.random() < 0.3) {
        this.needleRipples.push({
          x: needleX,
          y: needleY,
          radius: 4,
          maxRadius: R * 0.46,
          alpha: 0.6,
          color: Math.random() < 0.5 ? '#00f0ff' : '#ff007f'
        });
      }
    }

    // Render soundwave ripples
    ctx.save();
    for (let i = this.needleRipples.length - 1; i >= 0; i--) {
      const rip = this.needleRipples[i];
      rip.radius += 1.8;
      rip.alpha *= 0.94;

      ctx.strokeStyle = rip.color;
      ctx.globalAlpha = rip.alpha;
      ctx.shadowColor = rip.color;
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
      ctx.stroke();

      if (rip.alpha < 0.02 || rip.radius > rip.maxRadius) {
        this.needleRipples.splice(i, 1);
      }
    }
    ctx.restore();

    // Draw Tonearm Pivot Base
    ctx.save();
    ctx.beginPath();
    ctx.arc(armPivotX, armPivotY, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#180a2b';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Tonearm Wand (Chrome tube)
    ctx.beginPath();
    ctx.moveTo(armPivotX, armPivotY);
    ctx.bezierCurveTo(
      armPivotX - 25, armPivotY + 45,
      needleX + 45, needleY - 65,
      needleX, needleY
    );
    ctx.strokeStyle = '#e0e7ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 3.2;
    ctx.stroke();

    // Cartridge Headshell
    ctx.save();
    ctx.translate(needleX, needleY);
    ctx.rotate(0.35);
    ctx.fillStyle = '#0f051c';
    ctx.fillRect(-6, -14, 12, 18);
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-6, -14, 12, 18);

    // Glowing Stylus Needle Light
    const needleGlow = isPlaying ? 0.7 + (this.smoothedTreble * 0.3) : 0.25;
    ctx.beginPath();
    ctx.arc(0, 4, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 240, 255, ${needleGlow})`;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // =========================================================================
  // MODE 2: SYNTHWAVE CASSETTE TAPE & NEON ANALOG VU METERS
  // =========================================================================
  private renderCassetteTape(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: AudioVisualData,
    isPlaying: boolean,
    seedText: string
  ) {
    const cx = width * 0.5;
    const cy = height * 0.44;
    const W = Math.min(width * 0.72, height * 1.15, 520);
    const H = W * 0.62;
    const x = cx - W * 0.5;
    const y = cy - H * 0.5;
    if (W <= 60) return;

    this.cassetteReelAngle += isPlaying ? 0.024 : 0.002;

    // A. Cassette Body Shell (Deep Translucent Obsidian Purple)
    ctx.save();
    this.roundRect(ctx, x, y, W, H, 14);
    ctx.fillStyle = '#10061e';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 35;
    ctx.fill();

    // Neon Cyan / Magenta Beveled Border
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Chrome Screws (4 corners)
    const screwOffsets = [
      [x + 14, y + 14],
      [x + W - 14, y + 14],
      [x + 14, y + H - 14],
      [x + W - 14, y + H - 14]
    ];
    ctx.fillStyle = '#221138';
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1;
    for (const [sx, sy] of screwOffsets) {
      ctx.beginPath();
      ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx - 3, sy);
      ctx.lineTo(sx + 3, sy);
      ctx.stroke();
    }

    // B. Synthwave Cassette Label
    const labelW = W * 0.88;
    const labelH = H * 0.72;
    const lx = cx - labelW * 0.5;
    const ly = y + H * 0.08;

    this.roundRect(ctx, lx, ly, labelW, labelH, 8);
    ctx.fillStyle = '#170b2c'; // Deep violet card
    ctx.fill();

    // Synthwave Dual Racing Stripes across top
    ctx.fillStyle = '#ff007f'; // Hot Pink
    ctx.fillRect(lx, ly + 6, labelW, 4);
    ctx.fillStyle = '#00f0ff'; // Neon Cyan
    ctx.fillRect(lx, ly + 12, labelW, 2);

    // Label Text
    ctx.fillStyle = '#c084fc';
    ctx.font = `700 ${Math.max(8, W * 0.024)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'left';
    ctx.fillText('TYPE II • CrO₂ / 70µs', lx + 12, ly + 28);
    ctx.textAlign = 'right';
    ctx.fillText('SYNTH • [B]', lx + labelW - 12, ly + 28);

    // Hot Neon Pink Side Badge [A]
    ctx.fillStyle = '#ff007f';
    this.roundRect(ctx, lx + 12, ly + 36, 22, 22, 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 13px 'Outfit', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('A', lx + 23, ly + 52);

    // Center Title (Glowing Cyan Seed Name)
    const cleanTitle = seedText.toLowerCase().slice(0, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.max(12, W * 0.04)}px 'JetBrains Mono', monospace`;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.textAlign = 'center';
    ctx.fillText(cleanTitle, cx, ly + 46);

    ctx.fillStyle = '#00f0ff';
    ctx.font = `500 ${Math.max(8, W * 0.022)}px 'Outfit', sans-serif`;
    ctx.shadowBlur = 0;
    ctx.fillText('SYNTHWAVE RETRO BEATS • UNQUANTIZED', cx, ly + 62);

    // C. Center Acrylic Tape Window
    const winW = W * 0.58;
    const winH = H * 0.38;
    const wx = cx - winW * 0.5;
    const wy = cy - winH * 0.5 + (H * 0.06);

    this.roundRect(ctx, wx, wy, winW, winH, 6);
    ctx.fillStyle = '#06020c';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Scale Marks
    ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
    ctx.font = `600 8px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('100', cx - winW * 0.28, wy + 12);
    ctx.fillText('50', cx, wy + 12);
    ctx.fillText('0', cx + winW * 0.28, wy + 12);

    // Two Tape Reels with Cog Teeth
    const reelR = winH * 0.42;
    const leftReelX = cx - winW * 0.28;
    const rightReelX = cx + winW * 0.28;
    const reelY = wy + winH * 0.54;

    // Dark magnetic tape pack
    ctx.beginPath();
    ctx.arc(leftReelX, reelY, reelR * 1.08, 0, Math.PI * 2);
    ctx.fillStyle = '#1e0c38';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(rightReelX, reelY, reelR * 0.85, 0, Math.PI * 2);
    ctx.fillStyle = '#1e0c38';
    ctx.fill();

    // Draw the two spinning Neon Cyan Cog Hubs
    this.renderReelHub(ctx, leftReelX, reelY, reelR * 0.58, this.cassetteReelAngle);
    this.renderReelHub(ctx, rightReelX, reelY, reelR * 0.58, this.cassetteReelAngle);

    // Tape strip connecting reels
    ctx.fillStyle = '#140824';
    ctx.fillRect(leftReelX, reelY + reelR * 0.75, rightReelX - leftReelX, 5);

    ctx.restore();

    // D. Dual Neon Analog VU Meters
    const meterY = cy + H * 0.56;
    const meterW = Math.min(W * 0.42, 175);
    const meterH = meterW * 0.58;

    this.renderAnalogVUMeter(ctx, cx - meterW - 12, meterY, meterW, meterH, 'CH-L', data, isPlaying, true);
    this.renderAnalogVUMeter(ctx, cx + 12, meterY, meterW, meterH, 'CH-R', data, isPlaying, false);
  }

  /**
   * Helper: Render 6-tooth Cassette Cog Hub in Neon Cyan
   */
  private renderReelHub(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, angle: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Hub circle
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 6 Cog Teeth
    ctx.fillStyle = '#06020c';
    for (let i = 0; i < 6; i++) {
      const toothAngle = (i / 6) * Math.PI * 2;
      ctx.save();
      ctx.rotate(toothAngle);
      ctx.fillRect(-2.5, -r, 5, r * 0.38);
      ctx.restore();
    }

    // Center hole
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = '#06020c';
    ctx.fill();

    ctx.restore();
  }

  /**
   * Helper: Render Neon Backlit Analog VU Meter
   */
  private renderAnalogVUMeter(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    data: AudioVisualData,
    isPlaying: boolean,
    isLeft: boolean
  ) {
    ctx.save();

    // Meter Housing
    this.roundRect(ctx, x, y, w, h, 6);
    ctx.fillStyle = '#0c0418';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Backlit Neon Purple / Cyan Faceplate
    const faceGrad = ctx.createRadialGradient(x + w * 0.5, y + h * 0.8, 5, x + w * 0.5, y + h * 0.5, w * 0.7);
    faceGrad.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
    faceGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.18)');
    faceGrad.addColorStop(1, 'rgba(12, 4, 24, 0.92)');
    ctx.fillStyle = faceGrad;
    this.roundRect(ctx, x + 4, y + 4, w - 8, h - 8, 4);
    ctx.fill();

    // Scale Arc
    const pivotX = x + w * 0.5;
    const pivotY = y + h * 0.95;
    const arcR = h * 0.72;

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, arcR, Math.PI * 1.22, Math.PI * 1.78);
    ctx.stroke();

    // Scale Ticks & dB Labels
    ctx.fillStyle = '#e2d9f3';
    ctx.font = `600 7px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('-20', x + w * 0.22, y + h * 0.42);
    ctx.fillText('0', x + w * 0.65, y + h * 0.38);

    // +3 dB in Hot Neon Pink
    ctx.fillStyle = '#ff007f';
    ctx.fillText('+3', x + w * 0.82, y + h * 0.42);

    // Meter Label
    ctx.fillStyle = '#00f0ff';
    ctx.font = `600 8px 'JetBrains Mono', monospace`;
    ctx.fillText(`VU • ${label}`, x + w * 0.5, y + h * 0.78);

    // Spring physics needle calculation
    const audioTarget = isPlaying
      ? Math.min(1.0, (isLeft ? data.bass * 1.1 + data.mids * 0.4 : data.bass * 0.9 + data.treble * 0.6))
      : 0;

    if (isLeft) {
      const force = (audioTarget - this.vuL) * 0.35;
      this.vuVelocityL = (this.vuVelocityL + force) * 0.72;
      this.vuL += this.vuVelocityL;
      this.vuL = Math.max(0, Math.min(1.15, this.vuL));
    } else {
      const force = (audioTarget - this.vuR) * 0.35;
      this.vuVelocityR = (this.vuVelocityR + force) * 0.72;
      this.vuR += this.vuVelocityR;
      this.vuR = Math.max(0, Math.min(1.15, this.vuR));
    }

    const currentVU = isLeft ? this.vuL : this.vuR;
    const minAngle = -Math.PI * 0.22;
    const maxAngle = Math.PI * 0.20;
    const needleAngle = minAngle + currentVU * (maxAngle - minAngle);

    // Hot Neon Pink Needle
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(needleAngle);

    ctx.beginPath();
    ctx.moveTo(-1.2, 0);
    ctx.lineTo(0, -arcR * 1.05);
    ctx.lineTo(1.2, 0);
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 6;
    ctx.fill();

    // Pivot screw
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#00f0ff';
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }

  // =========================================================================
  // MODE 3: SYNTHWAVE CYBER CRT OSCILLOSCOPE
  // =========================================================================
  private renderAnalogScope(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: AudioVisualData,
    isPlaying: boolean
  ) {
    const cx = width * 0.5;
    const cy = height * 0.48;
    const scopeW = Math.min(width * 0.82, 680);
    const scopeH = Math.min(height * 0.58, scopeW * 0.62);
    const sx = cx - scopeW * 0.5;
    const sy = cy - scopeH * 0.5;

    // Curved CRT Tube Housing
    ctx.save();
    this.roundRect(ctx, sx, sy, scopeW, scopeH, 20);
    ctx.fillStyle = '#07020e';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 30;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Etched Neon Grid (8x6 grid)
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    const cols = 8;
    const rows = 6;
    for (let c = 1; c < cols; c++) {
      const gx = sx + (c / cols) * scopeW;
      ctx.beginPath();
      ctx.moveTo(gx, sy + 6);
      ctx.lineTo(gx, sy + scopeH - 6);
      ctx.stroke();
    }
    for (let r = 1; r < rows; r++) {
      const gy = sy + (r / rows) * scopeH;
      ctx.beginPath();
      ctx.moveTo(sx + 6, gy);
      ctx.lineTo(sx + scopeW - 6, gy);
      ctx.stroke();
    }

    // Silky Smooth Spline Waveform
    const wave = data.waveform;
    const len = wave?.length || 256;
    const amp = (scopeH * 0.32) * (1 + this.smoothedBass * 0.45);

    // Multi-pass Synthwave Glow (Hot Pink outer bloom + Cyan core)
    const passes = [
      { width: 14, alpha: 0.15, color: '#ff007f', blur: 26 },
      { width: 5, alpha: 0.55, color: '#00f0ff', blur: 14 },
      { width: 2.2, alpha: 0.98, color: '#ffffff', blur: 0 }
    ];

    for (const pass of passes) {
      ctx.save();
      ctx.lineWidth = pass.width;
      ctx.strokeStyle = pass.color;
      ctx.globalAlpha = pass.alpha;
      ctx.shadowColor = pass.color;
      ctx.shadowBlur = pass.blur;
      ctx.beginPath();

      const step = Math.max(1, Math.floor(len / 64));
      let first = true;

      for (let i = 0; i < len; i += step) {
        const sample = isPlaying && wave ? wave[i] : 0;
        const wx = sx + 12 + (i / len) * (scopeW - 24);
        const wy = cy + sample * amp;

        if (first) {
          ctx.moveTo(wx, wy);
          first = false;
        } else {
          ctx.lineTo(wx, wy);
        }
      }

      ctx.stroke();
      ctx.restore();
    }

    // Vintage CRT tube glass reflection
    const shineGrad = ctx.createLinearGradient(sx, sy, sx + scopeW, sy + scopeH);
    shineGrad.addColorStop(0, 'rgba(0, 240, 255, 0.06)');
    shineGrad.addColorStop(0.3, 'transparent');
    shineGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = shineGrad;
    this.roundRect(ctx, sx, sy, scopeW, scopeH, 20);
    ctx.fill();

    ctx.restore();
  }

  // =========================================================================
  // SYNTHWAVE PARTICLES & STARLIGHT
  // =========================================================================
  private renderEmbers(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bass: number,
    isPlaying: boolean
  ) {
    const pulseFactor = isPlaying ? 1 + (bass * 1.8) : 1;

    for (const p of this.particles) {
      p.x += (p.vx + Math.sin(this.timeTick * p.wobbleSpeed + p.wobbleOffset) * 0.00025) * pulseFactor;
      p.y += p.vy * pulseFactor;

      if (p.x < 0) p.x = 1;
      if (p.x > 1) p.x = 0;
      if (p.y < 0) p.y = 1;
      if (p.y > 1) p.y = 0;

      const px = p.x * width;
      const py = p.y * height;
      const pSize = p.size * (1 + bass * 0.4);

      ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${p.alpha * (0.4 + bass * 0.5)})`;
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Utility: Draw smooth rounded rectangles
   */
  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
