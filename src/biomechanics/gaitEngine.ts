import { PostureType } from '../calculator/biomechanicsCalculator';

export interface PhaseInfo {
  index: number;
  startPct: number;
  endPct: number;
  nameKey: string;
  descKey: string;
}

export const GAIT_PHASES: PhaseInfo[] = [
  { index: 0, startPct: 0.0, endPct: 0.02, nameKey: 'phase_1_name', descKey: 'phase_1_desc' },
  { index: 1, startPct: 0.02, endPct: 0.12, nameKey: 'phase_2_name', descKey: 'phase_2_desc' },
  { index: 2, startPct: 0.12, endPct: 0.31, nameKey: 'phase_3_name', descKey: 'phase_3_desc' },
  { index: 3, startPct: 0.31, endPct: 0.50, nameKey: 'phase_4_name', descKey: 'phase_4_desc' },
  { index: 4, startPct: 0.50, endPct: 0.62, nameKey: 'phase_5_name', descKey: 'phase_5_desc' },
  { index: 5, startPct: 0.62, endPct: 0.75, nameKey: 'phase_6_name', descKey: 'phase_6_desc' },
  { index: 6, startPct: 0.75, endPct: 0.87, nameKey: 'phase_7_name', descKey: 'phase_7_desc' },
  { index: 7, startPct: 0.87, endPct: 1.00, nameKey: 'phase_8_name', descKey: 'phase_8_desc' }
];

export interface JointAngles {
  // Hip angles (pitch = flexion/ext, roll = adduction/abduction, yaw = rotation)
  leftHipPitch: number;
  leftHipRoll: number;
  leftHipYaw: number;
  rightHipPitch: number;
  rightHipRoll: number;
  rightHipYaw: number;

  // Knee flexion
  leftKneePitch: number;
  leftKneeRoll: number; // Valgus / varus
  rightKneePitch: number;
  rightKneeRoll: number;

  // Ankle (pitch = dorsi/plantar, roll = inversion/eversion)
  leftAnklePitch: number;
  leftAnkleRoll: number;
  rightAnklePitch: number;
  rightAnkleRoll: number;

  // Foot toes bend
  leftToesPitch: number;
  rightToesPitch: number;

  // Pelvis kinematics
  pelvisY: number; // Vertical bounce (sinusoidal)
  pelvisRoll: number; // Trendelenburg pelvic drop
  pelvisYaw: number; // Axial pelvic rotation
  pelvisPitch: number; // Anterior/posterior tilt

  // Upper body kinematics
  spinePitch: number;
  spineYaw: number;
  neckPitch: number;
  headPitch: number;

  // Arms (contralateral balance)
  leftShoulderPitch: number;
  rightShoulderPitch: number;
  leftElbowPitch: number;
  rightElbowPitch: number;
}

export class GaitEngine {
  private progress = 0.0; // 0.0 to 1.0
  private isPlaying = true;
  private speedKmh = 5.0; // default brisk walk
  private posture: PostureType = 'optimal';
  private isAutoCorrected = false;

  // Correction interpolation factor (0.0 = full fault, 1.0 = optimal aligned)
  private correctionAlpha = 0.0;

  constructor() {}

  public update(deltaSeconds: number): number {
    if (this.isPlaying) {
      // Cadence calculation based on speed:
      // ~2.5 km/h -> ~90 steps/min -> 45 strides/min -> stride freq = 0.75 Hz
      // ~5.0 km/h -> ~112 steps/min -> 56 strides/min -> stride freq = 0.93 Hz
      // ~7.5 km/h -> ~132 steps/min -> 66 strides/min -> stride freq = 1.10 Hz
      const strideFreqHz = 0.55 + (this.speedKmh / 7.5) * 0.55;
      this.progress = (this.progress + deltaSeconds * strideFreqHz) % 1.0;
    }
    return this.progress;
  }

  public getProgress(): number {
    return this.progress;
  }

  public setProgress(p: number) {
    this.progress = Math.max(0, Math.min(1.0, p));
  }

  public togglePlay(): boolean {
    this.isPlaying = !this.isPlaying;
    return this.isPlaying;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public setPlaying(play: boolean) {
    this.isPlaying = play;
  }

  public setSpeedKmh(speed: number) {
    this.speedKmh = Math.max(1.5, Math.min(8.0, speed));
  }

  public getSpeedKmh(): number {
    return this.speedKmh;
  }

  public setPosture(posture: PostureType) {
    this.posture = posture;
  }

  public getPosture(): PostureType {
    return this.posture;
  }

  public setAutoCorrect(active: boolean) {
    this.isAutoCorrected = active;
  }

  public getIsAutoCorrected(): boolean {
    return this.isAutoCorrected;
  }

  public setCorrectionAlpha(alpha: number) {
    this.correctionAlpha = Math.max(0, Math.min(1, alpha));
  }

  public getCorrectionAlpha(): number {
    return this.correctionAlpha;
  }

  public getCurrentPhase(): PhaseInfo {
    for (const ph of GAIT_PHASES) {
      if (this.progress >= ph.startPct && this.progress < ph.endPct) {
        return ph;
      }
    }
    return GAIT_PHASES[0];
  }

  public jumpToPhase(index: number) {
    const clamped = Math.max(0, Math.min(GAIT_PHASES.length - 1, index));
    this.progress = GAIT_PHASES[clamped].startPct;
  }

  // Pure Kinematics Calculation based on clinical biomechanical gait curves
  public computeJointAngles(): JointAngles {
    const t = this.progress; // 0.0 - 1.0
    const twoPi = Math.PI * 2;

    // Left and right are shifted by half a cycle (0.5)
    const tLeft = t;
    const tRight = (t + 0.5) % 1.0;

    // 1. Base Pelvic kinematics
    // Vertical translation (sinusoidal bounce, lowest at heel strike, highest at midstance)
    const pelvisY = Math.sin(t * twoPi * 2 - Math.PI / 2) * 0.035;
    // Pelvic list / drop (Trendelenburg drop toward swing side ~ 4 degrees)
    const pelvisRoll = Math.sin(t * twoPi) * 0.055;
    // Pelvic axial rotation (reaches forward ~ 5 degrees at terminal swing)
    const pelvisYaw = Math.sin(t * twoPi) * 0.085;
    let pelvisPitch = -0.02; // slight anterior tilt

    // 2. Leg kinematics calculation function
    const computeLimb = (cycleTime: number) => {
      // Cycle starts at Initial Contact (0.0)
      // Stance: 0.0 to 0.60
      // Swing: 0.60 to 1.00
      let hipPitch = 0;
      let hipRoll = 0;
      let hipYaw = 0;
      let kneePitch = 0;
      let kneeRoll = 0;
      let anklePitch = 0;
      let ankleRoll = 0;
      let toesPitch = 0;

      if (cycleTime < 0.60) {
        // STANCE PHASE (0.0 to 0.60)
        const st = cycleTime / 0.60; // normalized stance (0 to 1)

        // Hip extends from +25 deg flexion down to -10 deg hyperextension
        hipPitch = 0.42 - st * 0.62;

        // Knee: 0.0 (heel strike ~5 deg) -> 0.15 (loading response ~18 deg) -> 0.5 (straightens ~5 deg) -> 1.0 (pre-swing flexion ~35 deg)
        if (st < 0.25) {
          kneePitch = 0.08 + Math.sin((st / 0.25) * Math.PI) * 0.24;
        } else if (st < 0.75) {
          kneePitch = 0.08 + Math.sin(((st - 0.25) / 0.5) * Math.PI) * 0.06;
        } else {
          kneePitch = 0.08 + Math.pow((st - 0.75) / 0.25, 2) * 0.55;
        }

        // Ankle: Heel strike (+5 deg dorsi) -> loading (plantar -10 deg) -> midstance/terminal (dorsi +12 deg) -> toe-off (plantar -20 deg)
        if (st < 0.15) {
          anklePitch = 0.12 - (st / 0.15) * 0.30;
        } else if (st < 0.75) {
          anklePitch = -0.18 + ((st - 0.15) / 0.6) * 0.42;
        } else {
          anklePitch = 0.24 - ((st - 0.75) / 0.25) * 0.60;
          toesPitch = ((st - 0.75) / 0.25) * 0.55; // Metatarsophalangeal extension
        }
      } else {
        // SWING PHASE (0.60 to 1.00)
        const sw = (cycleTime - 0.60) / 0.40; // normalized swing (0 to 1)

        // Hip flexes forward from -10 deg up to +25 deg
        hipPitch = -0.20 + Math.sin(sw * Math.PI * 0.5) * 0.62;

        // Knee flexes to peak ~60 deg at mid-swing then extends forward
        if (sw < 0.5) {
          kneePitch = 0.63 + Math.sin((sw / 0.5) * (Math.PI * 0.5)) * 0.45;
        } else {
          kneePitch = 1.08 - ((sw - 0.5) / 0.5) * 1.0;
        }

        // Ankle dorsiflexes to clear ground (+5 deg) then readies for strike
        anklePitch = -0.36 + Math.sin(sw * Math.PI) * 0.48;
        toesPitch = 0;
      }

      return { hipPitch, hipRoll, hipYaw, kneePitch, kneeRoll, anklePitch, ankleRoll, toesPitch };
    };

    const left = computeLimb(tLeft);
    const right = computeLimb(tRight);

    // 3. Posture Fault Biomechanical Kinematic Offsets
    let spinePitch = -0.04;
    let spineYaw = -pelvisYaw * 0.75; // Counter-rotation of trunk
    let neckPitch = 0.03;
    let headPitch = 0.02;

    const fault = this.posture;
    const rawAlpha = this.isAutoCorrected ? this.correctionAlpha : 0.0;
    const faultFactor = 1.0 - rawAlpha; // 1.0 = 100% fault, 0.0 = 100% corrected

    if (faultFactor > 0.001) {
      if (fault === 'text_neck') {
        // Forward head posture (+38 degrees neck tilt, thoracic kyphosis, posterior pelvic shift)
        neckPitch += 0.55 * faultFactor;
        headPitch += 0.25 * faultFactor;
        spinePitch += 0.32 * faultFactor;
        pelvisPitch += 0.12 * faultFactor;
        // Reduced arm swing amplitude
      } else if (fault === 'overpronation') {
        // Medial knee collapse (valgus tilt inward) + ankle eversion
        if (tLeft < 0.60) {
          left.kneeRoll -= 0.18 * faultFactor; // Inward valgus
          left.ankleRoll += 0.22 * faultFactor; // Eversion
          left.hipRoll += 0.08 * faultFactor;
        }
        if (tRight < 0.60) {
          right.kneeRoll += 0.18 * faultFactor;
          right.ankleRoll -= 0.22 * faultFactor;
          right.hipRoll -= 0.08 * faultFactor;
        }
      } else if (fault === 'supination') {
        // Lateral knee bow (varus tilt outward) + ankle inversion
        if (tLeft < 0.60) {
          left.kneeRoll += 0.16 * faultFactor; // Varus
          left.ankleRoll -= 0.20 * faultFactor; // Inversion
        }
        if (tRight < 0.60) {
          right.kneeRoll -= 0.16 * faultFactor;
          right.ankleRoll += 0.20 * faultFactor;
        }
      } else if (fault === 'heavy_heel') {
        // Heavy heel strike: Knee hyperextension/lockout at initial contact (kneePitch -> 0)
        // Exaggerated ankle dorsiflexion
        if (tLeft < 0.15) {
          left.kneePitch = Math.max(0.01, left.kneePitch - 0.20 * faultFactor);
          left.anklePitch += 0.24 * faultFactor;
        }
        if (tRight < 0.15) {
          right.kneePitch = Math.max(0.01, right.kneePitch - 0.20 * faultFactor);
          right.anklePitch += 0.24 * faultFactor;
        }
      }
    }

    // 4. Arms contralateral swing (opposite to legs)
    const armSwingAmplitude = 0.42 * (this.speedKmh / 5.0);
    const leftShoulderPitch = -Math.sin(t * twoPi) * armSwingAmplitude;
    const rightShoulderPitch = Math.sin(t * twoPi) * armSwingAmplitude;
    const leftElbowPitch = 0.35 + Math.max(0, -leftShoulderPitch * 0.45);
    const rightElbowPitch = 0.35 + Math.max(0, -rightShoulderPitch * 0.45);

    return {
      leftHipPitch: left.hipPitch,
      leftHipRoll: left.hipRoll,
      leftHipYaw: left.hipYaw,
      rightHipPitch: right.hipPitch,
      rightHipRoll: right.hipRoll,
      rightHipYaw: right.hipYaw,

      leftKneePitch: left.kneePitch,
      leftKneeRoll: left.kneeRoll,
      rightKneePitch: right.kneePitch,
      rightKneeRoll: right.kneeRoll,

      leftAnklePitch: left.anklePitch,
      leftAnkleRoll: left.ankleRoll,
      rightAnklePitch: right.anklePitch,
      rightAnkleRoll: right.ankleRoll,

      leftToesPitch: left.toesPitch,
      rightToesPitch: right.toesPitch,

      pelvisY,
      pelvisRoll,
      pelvisYaw,
      pelvisPitch,

      spinePitch,
      spineYaw,
      neckPitch,
      headPitch,

      leftShoulderPitch,
      rightShoulderPitch,
      leftElbowPitch,
      rightElbowPitch
    };
  }
}
