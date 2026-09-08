import { AudioVisualData } from '../audio/types.js';

export type VisualizerMode = 'car_backseat' | 'vintage_vinyl' | 'cassette_tape' | 'analog_scope';

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

interface Raindrop {
  x: number;
  y: number;
  length: number;
  alpha: number;
  speed: number;
}

export class WMPVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mode: VisualizerMode = 'car_backseat';

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

  // Synthwave moving 3D grid and starfield
  private gridOffset: number = 0;
  private stars: { x: number; y: number; size: number; alpha: number; twinkleSpeed: number }[] = [];

  // Car on Street Highway & Audio Details
  private roadOffset: number = 0;
  private carEqPeaks: number[] = new Array(24).fill(0);
  private nitroSparks: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string }[] = [];
  private raindrops: Raindrop[] = [];

  // Synthwave neon dust & starlight particles
  private particles: Particle[] = [];
  private particleCount: number = 55;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Failed to get 2D canvas context');
    this.ctx = context;

    this.initParticles();
    this.initStars();
    this.initRaindrops();
  }

  private initRaindrops() {
    this.raindrops = [];
    for (let i = 0; i < 28; i++) {
      this.raindrops.push({
        x: Math.random() * 0.7 + 0.15,
        y: Math.random() * 0.6 + 0.1,
        length: Math.random() * 8 + 4,
        alpha: Math.random() * 0.4 + 0.15,
        speed: Math.random() * 0.0004 + 0.0002
      });
    }
  }

  private initStars() {
    this.stars = [];
    for (let i = 0; i < 75; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random() * 0.55, // In the upper sky above horizon
        size: Math.random() * 1.8 + 0.6,
        alpha: Math.random() * 0.65 + 0.25,
        twinkleSpeed: Math.random() * 2.5 + 1.0
      });
    }
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
    const modes: VisualizerMode[] = ['car_backseat', 'vintage_vinyl', 'cassette_tape', 'analog_scope'];
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
      case 'car_backseat':
        this.renderCarBackseat(ctx, width, height, data, isPlaying, seedText);
        break;
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
  // ANIMATED SYNTHWAVE HORIZON: MOUNTAINS, RETRO SUN & MOVING 3D GRID
  // =========================================================================
  private renderSynthwaveBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bass: number,
    isPlaying: boolean
  ) {
    const horizonY = height * 0.58;
    const sunX = width * 0.5;
    const sunRadius = Math.min(width * 0.22, height * 0.30, 160);
    const sunY = horizonY - sunRadius * 0.15;

    // 1. Sky Gradient (Deep Obsidian to Cosmic Violet)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#040108');
    skyGrad.addColorStop(0.5, '#0d0418');
    skyGrad.addColorStop(0.85, '#1a0730');
    skyGrad.addColorStop(1, '#2d0c4e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, horizonY);

    // 2. Twinkling Distant Stars in the Sky
    ctx.save();
    for (const star of this.stars) {
      const sx = star.x * width;
      const sy = star.y * horizonY;
      const twinkle = Math.sin(this.timeTick * star.twinkleSpeed) * 0.25 + 0.75;
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = star.alpha * twinkle;
      ctx.fillRect(sx, sy, star.size, star.size);
    }
    ctx.restore();

    // 3. Synthwave Solar Corona Glow
    const coronaGlow = ctx.createRadialGradient(
      sunX, sunY, sunRadius * 0.2,
      sunX, sunY, sunRadius * 2.5
    );
    const pulse = isPlaying ? 0.28 + (bass * 0.25) : 0.16;
    coronaGlow.addColorStop(0, `rgba(255, 0, 127, ${pulse * 1.2})`);
    coronaGlow.addColorStop(0.35, `rgba(255, 85, 0, ${pulse * 0.8})`);
    coronaGlow.addColorStop(0.7, `rgba(139, 92, 246, ${pulse * 0.3})`);
    coronaGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = coronaGlow;
    ctx.fillRect(sunX - sunRadius * 2.5, sunY - sunRadius * 2.5, sunRadius * 5, sunRadius * 5);

    // 4. The Giant Retro Synthwave Sun with Horizontal Blinds
    ctx.save();
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.clip();

    // Sun vertical gradient (Hot Yellow -> Neon Orange -> Hot Pink)
    const sunGrad = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
    sunGrad.addColorStop(0, '#fffb00');
    sunGrad.addColorStop(0.38, '#ff5500');
    sunGrad.addColorStop(1, '#ff007f');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(sunX - sunRadius, sunY - sunRadius, sunRadius * 2, sunRadius * 2);

    // Horizontal Sun Blinds (Cuts get thicker towards horizon)
    ctx.fillStyle = '#06020c';
    const numStripes = 7;
    for (let i = 0; i < numStripes; i++) {
      const frac = i / (numStripes - 1);
      const sy = (sunY - sunRadius * 0.15) + frac * (sunRadius * 1.15);
      const sh = 2.0 + Math.pow(frac, 1.8) * 9.5;
      ctx.fillRect(sunX - sunRadius * 1.2, sy, sunRadius * 2.4, sh);
    }
    ctx.restore();

    // 5. Synthwave Low-Poly Mountains (Flanking the Sun)
    this.renderMountains(ctx, width, horizonY, bass);

    // 6. 3D Perspective Ground Plane Moving Towards the Horizon
    this.renderMovingGroundGrid(ctx, width, height, horizonY, sunX, bass, isPlaying);
  }

  /**
   * Helper: Render Synthwave Low-Poly Mountains Flanking the Sun
   */
  private renderMountains(
    ctx: CanvasRenderingContext2D,
    width: number,
    horizonY: number,
    bass: number
  ) {
    const maxMountainH = horizonY * 0.42;

    // A. Back Mountain Range (Dark Violet silhouette with Hot Magenta Neon Ridge)
    const backPeaks = [
      [0.0, 0.05], [0.07, 0.28], [0.15, 0.14], [0.24, 0.38], [0.35, 0.20], [0.44, 0.04],
      // Valley opening for sun
      [0.46, 0.0], [0.54, 0.0],
      // Right peaks
      [0.56, 0.04], [0.65, 0.22], [0.76, 0.40], [0.86, 0.16], [0.93, 0.26], [1.0, 0.06]
    ];

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    for (const [px, py] of backPeaks) {
      ctx.lineTo(px * width, horizonY - py * maxMountainH);
    }
    ctx.lineTo(width, horizonY);
    ctx.closePath();
    ctx.fillStyle = '#0e041c';
    ctx.fill();

    // Neon Magenta Ridge Line
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 8 + (bass * 8);
    ctx.stroke();
    ctx.restore();

    // B. Foreground Mountain Peaks (Obsidian Silhouette with Neon Cyan Ridge)
    const frontPeaks = [
      [0.0, 0.02], [0.05, 0.16], [0.11, 0.08], [0.18, 0.26], [0.28, 0.12], [0.40, 0.02],
      // Valley opening
      [0.43, 0.0], [0.57, 0.0],
      // Right peaks
      [0.60, 0.02], [0.71, 0.18], [0.81, 0.29], [0.90, 0.10], [0.96, 0.20], [1.0, 0.04]
    ];

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    for (const [px, py] of frontPeaks) {
      ctx.lineTo(px * width, horizonY - py * maxMountainH);
    }
    ctx.lineTo(width, horizonY);
    ctx.closePath();
    ctx.fillStyle = '#07020e';
    ctx.fill();

    // Neon Cyan Ridge Line
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.0;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10 + (bass * 10);
    ctx.stroke();

    // Low-poly facet accent ribs
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    for (let i = 1; i < frontPeaks.length - 1; i += 2) {
      const [px, py] = frontPeaks[i];
      if (py > 0.05) {
        ctx.beginPath();
        ctx.moveTo(px * width, horizonY - py * maxMountainH);
        ctx.lineTo((px + 0.03) * width, horizonY);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /**
   * Helper: Render 3D Perspective Ground Plane Moving Forward
   */
  private renderMovingGroundGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    horizonY: number,
    vanishingX: number,
    bass: number,
    isPlaying: boolean
  ) {
    const groundH = height - horizonY;
    if (groundH <= 5) return;

    // Ground reflective floor
    const floorGrad = ctx.createLinearGradient(0, horizonY, 0, height);
    floorGrad.addColorStop(0, '#06020c');
    floorGrad.addColorStop(0.5, '#0e041c');
    floorGrad.addColorStop(1, '#15062a');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, horizonY, width, groundH);

    // Perspective Longitudinal Lines (Rays fanning from horizon)
    const rays = 20;
    ctx.save();
    for (let i = -rays / 2; i <= rays / 2; i++) {
      const bottomX = vanishingX + (i * (width * 0.115));
      const rayGrad = ctx.createLinearGradient(vanishingX, horizonY, bottomX, height);
      rayGrad.addColorStop(0, 'rgba(0, 240, 255, 0.0)');
      rayGrad.addColorStop(0.3, 'rgba(0, 240, 255, 0.18)');
      rayGrad.addColorStop(1, 'rgba(0, 240, 255, 0.55)');
      ctx.strokeStyle = rayGrad;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(vanishingX, horizonY);
      ctx.lineTo(bottomX, height);
      ctx.stroke();
    }
    ctx.restore();

    // Perspective Transverse Lines Moving Forward Toward Viewer
    const speed = isPlaying ? 0.007 + (bass * 0.012) : 0.0028;
    this.gridOffset = (this.gridOffset + speed) % 1;

    const lineCount = 18;
    ctx.save();
    for (let k = 0; k < lineCount; k++) {
      const t = (k + this.gridOffset) / lineCount;
      const py = horizonY + Math.pow(t, 2.7) * groundH;
      const alpha = Math.pow(t, 1.2) * (0.65 + bass * 0.35);

      const color = (k % 2 === 0) ? '#ff007f' : '#00f0ff';
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6 + (t * 8);
      ctx.lineWidth = 1.0 + t * 1.8;

      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();
    }
    ctx.restore();

    // Horizon Neon Fog / Mist Line
    ctx.save();
    const fogGrad = ctx.createLinearGradient(0, horizonY - 12, 0, horizonY + 22);
    fogGrad.addColorStop(0, 'transparent');
    fogGrad.addColorStop(0.5, 'rgba(255, 0, 127, 0.35)');
    fogGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, horizonY - 12, width, 34);
    ctx.restore();
  }

  // =========================================================================
  // MODE 0: CAR ON STREET CRUISING (RETRO SYNTHWAVE CHASE VIEW)
  // Back window displays live audio details: spectrum, waveform, telemetry
  // =========================================================================
  private renderCarBackseat(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: AudioVisualData,
    isPlaying: boolean,
    seedText: string
  ) {
    this.renderCarOnStreet(ctx, width, height, data, isPlaying, seedText);
  }

  private renderCarOnStreet(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: AudioVisualData,
    isPlaying: boolean,
    seedText: string
  ) {
    const horizonY = height * 0.58;
    const cx = width * 0.5;

    // Calm, smooth lo-fi cruising speed (no jerky accelerations)
    const roadSpeed = isPlaying ? 0.007 + (this.smoothedBass * 0.004) : 0.003;
    this.roadOffset = (this.roadOffset + roadSpeed) % 1;

    // Rock-steady car stance: centered on road, smooth subtle suspension breathing float
    const carFloat = Math.sin(this.timeTick * 1.5) * 0.75;
    const carW = Math.max(340, Math.min(width * 0.46, 480));
    const carH = carW * 0.44;
    const carBaseY = Math.min(height * 0.83, height - 70) + carFloat;
    const carTopY = carBaseY - carH;

    // 1. Clean Highway Street (Smooth road ribbon with neon shoulders and single dashed divider)
    this.renderStreetRoad(ctx, width, height, horizonY, cx);

    // 2. Sleek Widebody Supercar (Grounded, stable, beautiful rear profile)
    this.renderCarExterior(ctx, cx, carBaseY, carTopY, carW, carH, data, isPlaying, seedText);
  }

  /**
   * Helper: Render Highway Street (Clean, smooth perspective road ribbon)
   */
  private renderStreetRoad(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    horizonY: number,
    cx: number
  ) {
    const roadTopW = width * 0.12;
    const roadBottomW = width * 0.92;

    ctx.save();

    // 1. Clean Asphalt Surface
    ctx.beginPath();
    ctx.moveTo(cx - roadTopW * 0.5, horizonY);
    ctx.lineTo(cx + roadTopW * 0.5, horizonY);
    ctx.lineTo(cx + roadBottomW * 0.5, height);
    ctx.lineTo(cx - roadBottomW * 0.5, height);
    ctx.closePath();

    const roadGrad = ctx.createLinearGradient(0, horizonY, 0, height);
    roadGrad.addColorStop(0, '#070210');
    roadGrad.addColorStop(0.5, '#0f041e');
    roadGrad.addColorStop(1, '#160628');
    ctx.fillStyle = roadGrad;
    ctx.fill();

    // 2. Neon Road Shoulders (Left: Hot Magenta, Right: Cyan)
    ctx.lineWidth = 2.0;

    // Left Shoulder
    ctx.strokeStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(cx - roadTopW * 0.5, horizonY);
    ctx.lineTo(cx - roadBottomW * 0.5, height);
    ctx.stroke();

    // Right Shoulder
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(cx + roadTopW * 0.5, horizonY);
    ctx.lineTo(cx + roadBottomW * 0.5, height);
    ctx.stroke();

    // 3. Single Smooth Dashed Center Line (Flows calmly forward)
    const stripeCount = 9;
    ctx.fillStyle = '#ffb703';
    ctx.shadowColor = '#ffb703';
    ctx.shadowBlur = 6;

    for (let i = 0; i < stripeCount; i++) {
      const t = (i + this.roadOffset) / stripeCount;
      const stripeY = horizonY + Math.pow(t, 2.6) * (height - horizonY);
      const stripeH = 4 + Math.pow(t, 2.2) * 32;
      const stripeW = 2 + t * 5;

      ctx.fillRect(cx - stripeW * 0.5, stripeY, stripeW, stripeH);
    }

    ctx.restore();
  }

  /**
   * Helper: Render Sleek Widebody Supercar (Stable, high-aesthetic rear view)
   */
  private renderCarExterior(
    ctx: CanvasRenderingContext2D,
    carX: number,
    carBaseY: number,
    carTopY: number,
    carW: number,
    carH: number,
    data: AudioVisualData,
    isPlaying: boolean,
    seedText: string
  ) {
    ctx.save();

    // 1. Smooth Neon Underglow on Asphalt
    const underglowW = carW * 0.88;
    const underglowH = carH * 0.30;
    const underglowGrad = ctx.createRadialGradient(
      carX, carBaseY + 4, 15,
      carX, carBaseY + 4, underglowW * 0.5
    );
    const underglowPulse = isPlaying ? 0.35 + (this.smoothedBass * 0.35) : 0.22;
    underglowGrad.addColorStop(0, `rgba(255, 0, 127, ${underglowPulse})`);
    underglowGrad.addColorStop(0.5, `rgba(0, 240, 255, ${underglowPulse * 0.6})`);
    underglowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = underglowGrad;
    ctx.fillRect(carX - underglowW * 0.5, carBaseY - 12, underglowW, underglowH);

    // 2. Wide Low-Profile Rear Sports Tires & Contact Shadows
    const tireW = carW * 0.13;
    const tireH = carH * 0.26;
    const tireY = carBaseY - tireH * 0.88;
    const leftTireX = carX - carW * 0.44;
    const rightTireX = carX + carW * 0.31;

    // Ground shadows
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#000000';
    this.roundRect(ctx, leftTireX - 2, carBaseY - 4, tireW + 4, 8, 4);
    ctx.fill();
    this.roundRect(ctx, rightTireX - 2, carBaseY - 4, tireW + 4, 8, 4);
    ctx.fill();

    // Left Tire Body
    this.roundRect(ctx, leftTireX, tireY, tireW, tireH, 5);
    ctx.fillStyle = '#06020b';
    ctx.fill();
    ctx.strokeStyle = '#1a092e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Right Tire Body
    this.roundRect(ctx, rightTireX, tireY, tireW, tireH, 5);
    ctx.fillStyle = '#06020b';
    ctx.fill();
    ctx.strokeStyle = '#1a092e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3. Lower Rear Bumper & Diffuser
    const diffuserW = carW * 0.62;
    const diffuserH = carH * 0.20;
    const diffuserY = carBaseY - diffuserH;
    const diffuserX = carX - diffuserW * 0.5;

    this.roundRect(ctx, diffuserX, diffuserY, diffuserW, diffuserH, 6);
    ctx.fillStyle = '#080312';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Diffuser Vertical Aerodynamic Fins
    const finCount = 4;
    const finStep = (diffuserW * 0.6) / (finCount - 1);
    const finStartX = carX - (diffuserW * 0.3);
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 4;
    ctx.lineWidth = 1.2;
    for (let f = 0; f < finCount; f++) {
      const fx = finStartX + f * finStep;
      ctx.beginPath();
      ctx.moveTo(fx, diffuserY + 3);
      ctx.lineTo(fx, carBaseY - 2);
      ctx.stroke();
    }

    // 4. Twin Dual Sports Exhaust Tips (Clean metallic rims with warm interior glow)
    const renderExhaust = (px: number) => {
      const ey = carBaseY - carH * 0.08;
      const exRadius = carW * 0.024;

      // Outer chrome rim
      ctx.beginPath();
      ctx.arc(px, ey, exRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#05010a';
      ctx.fill();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 4;
      ctx.stroke();

      // Inner heat glow (pulses with bass)
      const heatPulse = isPlaying ? 0.35 + (this.smoothedBass * 0.5) : 0.15;
      ctx.beginPath();
      ctx.arc(px, ey, exRadius * 0.65, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 0, 127, ${heatPulse})`;
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 6;
      ctx.fill();
    };

    renderExhaust(carX - carW * 0.38);
    renderExhaust(carX - carW * 0.33);
    renderExhaust(carX + carW * 0.33);
    renderExhaust(carX + carW * 0.38);

    // 5. Main Sculpted Body Shell & Wheel Arches
    const bodyTopY = carTopY + carH * 0.44;
    const bodyH = carBaseY - bodyTopY;
    const bodyW = carW * 0.88;

    ctx.save();
    this.roundRect(ctx, carX - bodyW * 0.5, bodyTopY, bodyW, bodyH, 14);
    const bodyGrad = ctx.createLinearGradient(carX, bodyTopY, carX, carBaseY);
    bodyGrad.addColorStop(0, '#100524');
    bodyGrad.addColorStop(0.5, '#180735');
    bodyGrad.addColorStop(1, '#0c031a');
    ctx.fillStyle = bodyGrad;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 20;
    ctx.fill();

    // Body perimeter neon highlight
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1.4;
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();

    // 6. Illuminated Inset License Plate
    const plateW = carW * 0.24;
    const plateH = bodyH * 0.32;
    const plateY = bodyTopY + bodyH * 0.40;
    const plateX = carX - plateW * 0.5;

    this.roundRect(ctx, plateX, plateY, plateW, plateH, 4);
    ctx.fillStyle = '#040108';
    ctx.fill();
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 1.2;
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 5;
    ctx.stroke();

    ctx.fillStyle = '#ffb703';
    ctx.shadowColor = '#ffb703';
    ctx.shadowBlur = 4;
    ctx.font = `700 ${Math.max(8, plateW * 0.16)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LO-FI // 808', carX, plateY + plateH * 0.5);

    // 7. Full-Width Laser Taillight Blade
    const tailY = bodyTopY + 8;
    const tailH = Math.max(7, carH * 0.08);
    const tailW = bodyW - 14;
    const tailX = carX - tailW * 0.5;

    // Housing
    this.roundRect(ctx, tailX, tailY, tailW, tailH, 4);
    ctx.fillStyle = '#07010e';
    ctx.fill();

    // Glowing Neon Bar
    const lightBarH = tailH * 0.65;
    const lightBarY = tailY + (tailH - lightBarH) * 0.5;
    const lightBarW = tailW - 4;
    const lightBarX = tailX + 2;

    const tailGlow = isPlaying ? 8 + (this.smoothedBass * 12) : 6;
    ctx.save();
    this.roundRect(ctx, lightBarX, lightBarY, lightBarW, lightBarH, 3);
    const tailGrad = ctx.createLinearGradient(tailX, 0, tailX + tailW, 0);
    tailGrad.addColorStop(0, '#ff9900');
    tailGrad.addColorStop(0.08, '#ff0055');
    tailGrad.addColorStop(0.5, '#ff007f');
    tailGrad.addColorStop(0.92, '#ff0055');
    tailGrad.addColorStop(1, '#ff9900');
    ctx.fillStyle = tailGrad;
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = tailGlow;
    ctx.fill();
    ctx.restore();

    // 8. Integrated Ducktail Spoiler Lip
    const spoilerY = bodyTopY - 2;
    const spoilerW = carW * 0.82;
    ctx.strokeStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(carX - spoilerW * 0.5, spoilerY + 4);
    ctx.lineTo(carX - spoilerW * 0.4, spoilerY);
    ctx.lineTo(carX + spoilerW * 0.4, spoilerY);
    ctx.lineTo(carX + spoilerW * 0.5, spoilerY + 4);
    ctx.stroke();

    // 9. Fastback Cabin C-Pillars & Roof
    const roofW = carW * 0.54;
    const roofTopY = carTopY + carH * 0.05;
    const shoulderW = carW * 0.74;
    const shoulderY = bodyTopY;

    ctx.beginPath();
    ctx.moveTo(carX - roofW * 0.5, roofTopY);
    ctx.lineTo(carX + roofW * 0.5, roofTopY);
    ctx.lineTo(carX + shoulderW * 0.5, shoulderY);
    ctx.lineTo(carX - shoulderW * 0.5, shoulderY);
    ctx.closePath();

    const cabinGrad = ctx.createLinearGradient(carX, roofTopY, carX, shoulderY);
    cabinGrad.addColorStop(0, '#0d041c');
    cabinGrad.addColorStop(0.5, '#15062c');
    cabinGrad.addColorStop(1, '#0e041e');
    ctx.fillStyle = cabinGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 10. THE CAR'S BACK WINDOW SHOWING AUDIO DETAILS
    this.renderCarBackWindow(ctx, carX, carTopY, carW, carH, data, isPlaying, seedText);

    ctx.restore();
  }

  /**
   * Helper: The Car's Back Window Displaying Live Audio Details (Spectrum, Waveform, Telemetry)
   */
  private renderCarBackWindow(
    ctx: CanvasRenderingContext2D,
    carX: number,
    carTopY: number,
    carW: number,
    carH: number,
    data: AudioVisualData,
    isPlaying: boolean,
    seedText: string
  ) {
    const winTopY = carTopY + carH * 0.08;
    const winBottomY = carTopY + carH * 0.45;
    const winH = winBottomY - winTopY;
    const winTopW = carW * 0.48;
    const winBottomW = carW * 0.64;

    ctx.save();

    // 1. Back Window Glass Contour (Fastback Trapezoid)
    ctx.beginPath();
    ctx.moveTo(carX - winTopW * 0.5, winTopY);
    ctx.lineTo(carX + winTopW * 0.5, winTopY);
    ctx.lineTo(carX + winBottomW * 0.5, winBottomY);
    ctx.lineTo(carX - winBottomW * 0.5, winBottomY);
    ctx.closePath();

    // Dark Tinted Polarized Glass Background
    const glassGrad = ctx.createLinearGradient(carX, winTopY, carX, winBottomY);
    glassGrad.addColorStop(0, 'rgba(7, 2, 18, 0.96)');
    glassGrad.addColorStop(0.5, 'rgba(14, 4, 28, 0.94)');
    glassGrad.addColorStop(1, 'rgba(5, 1, 14, 0.98)');
    ctx.fillStyle = glassGrad;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 12;
    ctx.fill();

    // Glowing Neon Glass Bezel
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.6;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.stroke();

    // Clip to Back Window Glass Surface so all audio details stay neatly inside the window
    ctx.clip();

    // 2. Horizontal Defroster Wire Lines
    ctx.strokeStyle = 'rgba(255, 0, 127, 0.16)';
    ctx.lineWidth = 1.0;
    ctx.shadowBlur = 0;
    const wireCount = 3;
    for (let w = 1; w <= wireCount; w++) {
      const wy = winTopY + (w / (wireCount + 1)) * winH;
      ctx.beginPath();
      ctx.moveTo(carX - winBottomW * 0.5, wy);
      ctx.lineTo(carX + winBottomW * 0.5, wy);
      ctx.stroke();
    }

    // 3. Audio Details Header: Seed Title & Live Indicator
    const cleanSeed = seedText.toUpperCase().slice(0, 15);
    const headerY = winTopY + 11;

    // Pulse Live / Paused Dot
    const dotX = carX - winTopW * 0.40;
    ctx.beginPath();
    ctx.arc(dotX, headerY, 2.5, 0, Math.PI * 2);
    if (isPlaying) {
      ctx.fillStyle = '#00ffaa';
      ctx.shadowColor = '#00ffaa';
      ctx.shadowBlur = 5;
    } else {
      ctx.fillStyle = '#ffb703';
      ctx.shadowColor = '#ffb703';
      ctx.shadowBlur = 4;
    }
    ctx.fill();

    // Status & Seed Text
    ctx.font = `700 ${Math.max(7.5, winTopW * 0.052)}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 5;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(isPlaying ? 'LIVE AUDIO' : 'PAUSED', dotX + 7, headerY);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 4;
    ctx.fillText(`♫ ${cleanSeed}`, carX + winTopW * 0.42, headerY);

    // 4. Live Audio Spectrum Equalizer (FFT Frequency Columns)
    const eqAreaY = winTopY + 20;
    const eqAreaH = winH * 0.44;
    const numBars = 18;
    const eqW = winBottomW * 0.82;
    const barSpacing = eqW / numBars;
    const barW = Math.max(2, barSpacing - 2.5);
    const eqStartX = carX - eqW * 0.5;

    for (let b = 0; b < numBars; b++) {
      const binIdx = Math.floor(Math.pow(b / numBars, 1.5) * 110);
      let rawVal = 0.05;
      if (isPlaying && data.frequency && data.frequency.length > binIdx) {
        rawVal = Math.max(0.05, data.frequency[binIdx] / 255);
      }
      if (b < 4 && isPlaying) {
        rawVal = Math.min(1.0, rawVal * 1.2 + this.smoothedBass * 0.22);
      }

      // Update peak hold
      if (rawVal >= (this.carEqPeaks[b] || 0)) {
        this.carEqPeaks[b] = rawVal;
      } else {
        this.carEqPeaks[b] = Math.max(0.04, (this.carEqPeaks[b] || 0) - 0.018);
      }

      const barH = rawVal * eqAreaH;
      const bx = eqStartX + b * barSpacing;
      const by = eqAreaY + eqAreaH - barH;

      // Vertical Bar Gradient (Cyan -> Gold -> Hot Magenta)
      const barGrad = ctx.createLinearGradient(bx, eqAreaY + eqAreaH, bx, by);
      barGrad.addColorStop(0, '#00f0ff');
      barGrad.addColorStop(0.5, '#ffb703');
      barGrad.addColorStop(1, '#ff007f');

      ctx.fillStyle = barGrad;
      ctx.shadowColor = (rawVal > 0.6) ? '#ff007f' : '#00f0ff';
      ctx.shadowBlur = 3;
      ctx.fillRect(bx, by, barW, barH);

      // Peak Hold Cap
      const peakY = eqAreaY + eqAreaH - (this.carEqPeaks[b] * eqAreaH);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 3;
      ctx.fillRect(bx, Math.max(eqAreaY, peakY - 1.5), barW, 1.5);
    }

    // 5. Live Oscilloscope Waveform Line
    if (data.waveform && data.waveform.length > 0) {
      const waveMidY = eqAreaY + eqAreaH + 8;
      const waveW = winBottomW * 0.82;
      const waveStartX = carX - waveW * 0.5;
      const waveStep = data.waveform.length / 45;

      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < 45; i++) {
        const sampleIdx = Math.floor(i * waveStep);
        const amp = isPlaying ? (data.waveform[sampleIdx] || 0) : 0;
        const wx = waveStartX + (i / 44) * waveW;
        const wy = waveMidY + amp * 7;
        if (i === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.strokeStyle = 'rgba(0, 255, 200, 0.75)';
      ctx.lineWidth = 1.2;
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#00ffc8';
      ctx.shadowBlur = 3;
      ctx.stroke();
      ctx.restore();
    }

    // 6. Audio Telemetry Readouts (Bottom of back window)
    const telemY = winBottomY - 7;
    const bassPct = (this.smoothedBass * 100).toFixed(0);
    const midsPct = (this.smoothedMids * 100).toFixed(0);
    const trebPct = (this.smoothedTreble * 100).toFixed(0);

    ctx.font = `600 ${Math.max(6.5, winBottomW * 0.040)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#a78bfa';
    ctx.shadowColor = '#a78bfa';
    ctx.shadowBlur = 3;
    ctx.fillText(`BASS ${bassPct}%  •  MIDS ${midsPct}%  •  HI ${trebPct}%  •  ~76 BPM [FM STEREO]`, carX, telemY);

    ctx.restore();
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
