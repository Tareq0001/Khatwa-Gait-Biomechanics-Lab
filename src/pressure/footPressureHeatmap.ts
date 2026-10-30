import { PostureType } from '../calculator/biomechanicsCalculator';

export interface PressureMetrics {
  peakPressureKpa: number;
  contactAreaCm2: number;
  symmetryLeft: number;
  symmetryRight: number;
  grfPercentBw: number;
}

interface FootSensor {
  id: string;
  x: number; // 0 to 1 normalized to foot bounding box
  y: number; // 0 to 1 (0 = toe, 1 = heel)
  radius: number;
  baseWeight: number; // Sensitivity factor
}

export class FootPressureHeatmap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private copTrailLeft: { x: number; y: number; alpha: number }[] = [];
  private copTrailRight: { x: number; y: number; alpha: number }[] = [];

  // Anatomical sensors per foot (normalized coordinates)
  private leftSensors: FootSensor[] = [
    { id: 'heel_lat', x: 0.58, y: 0.88, radius: 28, baseWeight: 1.0 },
    { id: 'heel_med', x: 0.42, y: 0.88, radius: 26, baseWeight: 0.9 },
    { id: 'mid_lat', x: 0.62, y: 0.62, radius: 22, baseWeight: 0.7 },
    { id: 'mid_med', x: 0.35, y: 0.60, radius: 20, baseWeight: 0.3 }, // Arch area
    { id: 'meta_1', x: 0.32, y: 0.36, radius: 24, baseWeight: 1.1 }, // Ball / 1st meta
    { id: 'meta_2', x: 0.46, y: 0.34, radius: 22, baseWeight: 0.95 },
    { id: 'meta_5', x: 0.68, y: 0.38, radius: 22, baseWeight: 0.85 },
    { id: 'hallux', x: 0.32, y: 0.16, radius: 22, baseWeight: 1.25 }, // Big toe
    { id: 'toes_2_5', x: 0.55, y: 0.18, radius: 20, baseWeight: 0.6 }
  ];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;
    this.width = canvas.width;
    this.height = canvas.height;
    this.handleResize();
  }

  public handleResize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      this.ctx.scale(dpr, dpr);
    }
  }

  // Render both left & right foot heatmaps and CoP based on gait normalized progress (0.0 - 1.0)
  public render(
    gaitProgress: number,
    posture: PostureType,
    isAutoCorrected: boolean
  ): PressureMetrics {
    const w = this.canvas.getBoundingClientRect().width || this.width;
    const h = this.canvas.getBoundingClientRect().height || this.height;

    this.ctx.clearRect(0, 0, w, h);

    // Dark sleek cyber background
    const bgGrad = this.ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.7);
    bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.8)');
    bgGrad.addColorStop(1, 'rgba(2, 6, 23, 0.95)');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, w, h);

    // Grid crosshairs
    this.drawGrid(w, h);

    // Left foot is in stance from cycle 0.0 to 0.60
    // Right foot is in stance from cycle 0.50 to 1.10 (0.50 to 0.10 wrapped)
    const leftCycle = gaitProgress;
    const rightCycle = (gaitProgress + 0.5) % 1.0;

    const leftStancePhase = leftCycle < 0.62 ? leftCycle / 0.62 : -1;
    const rightStancePhase = rightCycle < 0.62 ? rightCycle / 0.62 : -1;

    const footW = w * 0.36;
    const footH = h * 0.82;
    const leftX = w * 0.08;
    const rightX = w * 0.56;
    const footY = h * 0.08;

    // Render Left Foot
    const leftMax = this.drawFoot(
      leftX,
      footY,
      footW,
      footH,
      false,
      leftStancePhase,
      posture,
      isAutoCorrected,
      this.copTrailLeft
    );

    // Render Right Foot
    const rightMax = this.drawFoot(
      rightX,
      footY,
      footW,
      footH,
      true,
      rightStancePhase,
      posture,
      isAutoCorrected,
      this.copTrailRight
    );

    // Calculate aggregated metrics
    const overallPeak = Math.max(leftMax.peak, rightMax.peak);
    const overallArea = Math.round(leftMax.area + rightMax.area);
    const totalLoad = leftMax.load + rightMax.load + 0.001;
    const symmetryLeft = Math.round((leftMax.load / totalLoad) * 100);
    const symmetryRight = 100 - symmetryLeft;

    let grf = 0;
    if (leftStancePhase >= 0 || rightStancePhase >= 0) {
      const activePhase = leftStancePhase >= 0 ? leftStancePhase : rightStancePhase;
      // GRF classic double-peak "M" curve
      if (activePhase < 0.2) grf = 80 + activePhase * 250;
      else if (activePhase < 0.5) grf = 115 - (activePhase - 0.2) * 80;
      else if (activePhase < 0.8) grf = 91 + (activePhase - 0.5) * 110;
      else grf = 124 - (activePhase - 0.8) * 550;
    }
    grf = Math.max(0, Math.min(135, Math.round(grf)));

    if (posture === 'heavy_heel' && !isAutoCorrected) {
      grf = Math.round(grf * 1.35);
    }

    return {
      peakPressureKpa: Math.round(overallPeak),
      contactAreaCm2: overallArea,
      symmetryLeft,
      symmetryRight,
      grfPercentBw: grf
    };
  }

  private drawGrid(w: number, h: number) {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    this.ctx.lineWidth = 1;
    const step = 30;
    for (let x = 0; x < w; x += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  // Draw single foot with anatomical outline, heat pressure blobs, and dynamic CoP
  private drawFoot(
    x: number,
    y: number,
    w: number,
    h: number,
    isRight: boolean,
    stanceProgress: number,
    posture: PostureType,
    isAutoCorrected: boolean,
    copTrail: { x: number; y: number; alpha: number }[]
  ): { peak: number; area: number; load: number } {
    this.ctx.save();

    // 1. Draw sleek anatomical foot silhouette contour
    this.drawFootSilhouette(x, y, w, h, isRight);

    let peakPressure = 0;
    let contactArea = 0;
    let totalLoad = 0;

    // In swing phase (progress < 0): foot is unloaded, show resting baseline
    const isGrounded = stanceProgress >= 0;

    // 2. Compute dynamic sensor pressure
    const activeSensors: { cx: number; cy: number; pressureKpa: number; radius: number }[] = [];

    let copX = 0;
    let copY = 0;
    let copWeightSum = 0;

    this.leftSensors.forEach(s => {
      // Mirror x for right foot
      const sx = isRight ? 1 - s.x : s.x;
      const sy = s.y;
      const cx = x + sx * w;
      const cy = y + sy * h;

      let pressure = 15; // Baseline resting pressure (treadmill contact sensation)

      if (isGrounded) {
        // Temporal wave along foot: 0.0 (heel) -> 0.4 (midfoot) -> 0.7 (forefoot) -> 1.0 (toes)
        // Stance roll progression
        let phaseMatch = 0;
        if (s.y > 0.75) {
          // Heel zone: peaks at 0.0 - 0.25 stance
          phaseMatch = Math.max(0, 1 - Math.abs(stanceProgress - 0.12) / 0.22);
        } else if (s.y > 0.5) {
          // Midfoot: peaks at 0.25 - 0.50 stance
          phaseMatch = Math.max(0, 1 - Math.abs(stanceProgress - 0.38) / 0.25);
        } else if (s.y > 0.25) {
          // Metatarsals: peaks at 0.50 - 0.80 stance
          phaseMatch = Math.max(0, 1 - Math.abs(stanceProgress - 0.65) / 0.25);
        } else {
          // Hallux / Toes: peaks at 0.75 - 0.98 stance (propulsion)
          phaseMatch = Math.max(0, 1 - Math.abs(stanceProgress - 0.88) / 0.2);
        }

        let faultMultiplier = 1.0;
        if (!isAutoCorrected) {
          if (posture === 'overpronation') {
            if (s.id === 'mid_med') faultMultiplier = 3.2; // Collapsed arch takes high pressure!
            if (s.id === 'meta_1') faultMultiplier = 1.6;
            if (s.id === 'mid_lat') faultMultiplier = 0.4;
          } else if (posture === 'supination') {
            if (s.id === 'mid_lat' || s.id === 'meta_5') faultMultiplier = 2.8; // Outer edge
            if (s.id === 'mid_med') faultMultiplier = 0.05; // High arch untouched
            if (s.id === 'heel_lat') faultMultiplier = 1.8;
          } else if (posture === 'heavy_heel') {
            if (s.y > 0.75) faultMultiplier = 2.4; // Exaggerated heel impact
            if (s.y < 0.3) faultMultiplier = 0.7;
          } else if (posture === 'text_neck') {
            if (s.y < 0.45) faultMultiplier = 1.35; // Shifted center of mass forward
          }
        }

        const calculated = phaseMatch * 580 * s.baseWeight * faultMultiplier;
        pressure = Math.max(15, calculated);
      }

      if (pressure > peakPressure) peakPressure = pressure;
      if (pressure > 60) contactArea += 16;
      totalLoad += pressure;

      if (pressure > 35) {
        copX += cx * pressure;
        copY += cy * pressure;
        copWeightSum += pressure;
      }

      activeSensors.push({ cx, cy, pressureKpa: pressure, radius: s.radius * (w / 160) });
    });

    // 3. Render Heatmap Blobs using multi-stop radial gradients
    this.ctx.globalCompositeOperation = 'screen';
    activeSensors.forEach(sensor => {
      this.drawHeatBlob(sensor.cx, sensor.cy, sensor.radius, sensor.pressureKpa);
    });
    this.ctx.globalCompositeOperation = 'source-over';

    // 4. Update and Draw CoP Trajectory (Center of Pressure Butterfly line)
    if (isGrounded && copWeightSum > 0) {
      const activeCopX = copX / copWeightSum;
      const activeCopY = copY / copWeightSum;

      copTrail.push({ x: activeCopX, y: activeCopY, alpha: 1.0 });
      if (copTrail.length > 28) copTrail.shift();
    } else {
      // Fade out trail when in swing
      copTrail.forEach(p => (p.alpha *= 0.88));
      if (copTrail.length > 0 && copTrail[0].alpha < 0.05) copTrail.shift();
    }

    this.drawCopTrail(copTrail);

    this.ctx.restore();

    return { peak: peakPressure, area: contactArea, load: totalLoad };
  }

  // Draw natural anatomical foot boundary
  private drawFootSilhouette(x: number, y: number, w: number, h: number, isRight: boolean) {
    this.ctx.save();
    this.ctx.translate(isRight ? x + w : x, y);
    if (isRight) this.ctx.scale(-1, 1);

    this.ctx.beginPath();
    // Anatomical left foot template path
    this.ctx.moveTo(w * 0.48, h * 0.98); // Posterior heel center
    this.ctx.bezierCurveTo(w * 0.35, h * 0.98, w * 0.28, h * 0.88, w * 0.30, h * 0.78); // Medial heel
    this.ctx.bezierCurveTo(w * 0.32, h * 0.68, w * 0.36, h * 0.60, w * 0.35, h * 0.50); // Medial longitudinal arch
    this.ctx.bezierCurveTo(w * 0.34, h * 0.42, w * 0.22, h * 0.36, w * 0.20, h * 0.28); // 1st Metatarsal head bulge
    this.ctx.bezierCurveTo(w * 0.18, h * 0.20, w * 0.20, h * 0.04, w * 0.32, h * 0.02); // Hallux (Big Toe)
    this.ctx.bezierCurveTo(w * 0.42, h * 0.02, w * 0.42, h * 0.12, w * 0.45, h * 0.14); // Toe web 1-2
    this.ctx.bezierCurveTo(w * 0.52, h * 0.05, w * 0.64, h * 0.08, w * 0.65, h * 0.16); // Middle toes arch
    this.ctx.bezierCurveTo(w * 0.78, h * 0.12, w * 0.88, h * 0.18, w * 0.86, h * 0.28); // Little toe
    this.ctx.bezierCurveTo(w * 0.84, h * 0.36, w * 0.78, h * 0.45, w * 0.76, h * 0.60); // Lateral midfoot border
    this.ctx.bezierCurveTo(w * 0.75, h * 0.75, w * 0.72, h * 0.88, w * 0.65, h * 0.96); // Lateral heel
    this.ctx.closePath();

    this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = 'rgba(6, 182, 212, 0.3)';
    this.ctx.shadowBlur = 8;
    this.ctx.stroke();

    // Subtle dark translucent fill
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    this.ctx.fill();

    this.ctx.restore();
  }

  // Draw a smooth biological thermal blob
  private drawHeatBlob(cx: number, cy: number, radius: number, pressureKpa: number) {
    if (pressureKpa <= 10) return;

    // Normalizing pressure to color ramp:
    // 0 - 150 kPa: Deep Blue to Cyan
    // 150 - 350 kPa: Cyan to Emerald Green
    // 350 - 550 kPa: Green to Amber Yellow
    // 550+ kPa: Crimson Orange to High Impact Red
    const norm = Math.min(1.0, pressureKpa / 750);
    const grad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * (0.8 + norm * 0.6));

    if (norm < 0.25) {
      // Cool blue
      grad.addColorStop(0, `rgba(6, 182, 212, ${0.4 + norm * 1.5})`);
      grad.addColorStop(0.6, 'rgba(14, 116, 144, 0.25)');
      grad.addColorStop(1, 'rgba(14, 116, 144, 0)');
    } else if (norm < 0.5) {
      // Bio-emerald
      grad.addColorStop(0, `rgba(16, 185, 129, ${0.6 + (norm - 0.25) * 1.2})`);
      grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.35)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    } else if (norm < 0.75) {
      // Solar yellow / amber
      grad.addColorStop(0, `rgba(245, 158, 11, ${0.75 + (norm - 0.5) * 0.9})`);
      grad.addColorStop(0.4, 'rgba(16, 185, 129, 0.45)');
      grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    } else {
      // High-impact crimson red & white-hot core
      grad.addColorStop(0, `rgba(255, 255, 255, 0.95)`);
      grad.addColorStop(0.25, `rgba(239, 68, 68, 0.9)`);
      grad.addColorStop(0.6, 'rgba(245, 158, 11, 0.5)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    }

    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius * (0.8 + norm * 0.6), 0, Math.PI * 2);
    this.ctx.fill();
  }

  // Draw dynamic Center of Pressure trajectory line
  private drawCopTrail(trail: { x: number; y: number; alpha: number }[]) {
    if (trail.length < 2) return;

    this.ctx.save();
    for (let i = 1; i < trail.length; i++) {
      const p1 = trail[i - 1];
      const p2 = trail[i];
      const avgAlpha = (p1.alpha + p2.alpha) / 2;

      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.strokeStyle = `rgba(56, 189, 248, ${avgAlpha * 0.85})`;
      this.ctx.lineWidth = 3;
      this.ctx.shadowColor = '#38bdf8';
      this.ctx.shadowBlur = 10;
      this.ctx.stroke();
    }

    // Current live CoP cursor
    const latest = trail[trail.length - 1];
    if (latest && latest.alpha > 0.2) {
      this.ctx.beginPath();
      this.ctx.arc(latest.x, latest.y, 6, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowColor = '#38bdf8';
      this.ctx.shadowBlur = 14;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(latest.x, latest.y, 11, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }
}
