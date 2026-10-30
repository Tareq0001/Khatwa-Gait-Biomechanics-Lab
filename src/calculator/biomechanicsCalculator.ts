export type PostureType = 'optimal' | 'text_neck' | 'overpronation' | 'supination' | 'heavy_heel';

export interface CalculationInput {
  heightCm: number;
  weightKg: number;
  cadenceBpm: number;
  distanceKm: number;
  posture: PostureType;
  isAutoCorrected: boolean;
}

export interface CalculationResult {
  optimalStrideCm: number;
  actualStrideCm: number;
  strideRatio: number;
  kneeForceKn: number;
  kneeReductionKn: number;
  kneeReductionPercent: number;
  spinalCushionPercent: number;
  caloricBurnKcal: number;
  walkingSpeedKmh: number;
  durationMinutes: number;
  healthScore: number;
  gradeKey: 'calc_grade_optimal' | 'calc_grade_warning' | 'calc_grade_critical';
}

export class BiomechanicsCalculator {
  public static calculate(input: CalculationInput): CalculationResult {
    const { heightCm, weightKg, cadenceBpm, distanceKm, posture, isAutoCorrected } = input;

    // 1. Optimal anthropometric stride length (Winter / Drillis & Contini biomechanical model)
    const optimalStrideCm = Math.round(heightCm * 0.415 * 10) / 10;

    // 2. Posture adjustment factor on actual stride length
    let strideFactor = 1.0;
    let kneeLoadMultiplier = 2.2; // Multiple of body weight (BW)
    let spinalCushion = 92; // % damping efficiency
    let baseHealthScore = 96;

    if (!isAutoCorrected) {
      switch (posture) {
        case 'text_neck':
          strideFactor = 0.88; // Shortened shuffling stride
          kneeLoadMultiplier = 2.6;
          spinalCushion = 42;
          baseHealthScore = 72;
          break;
        case 'overpronation':
          strideFactor = 0.94;
          kneeLoadMultiplier = 3.15;
          spinalCushion = 65;
          baseHealthScore = 67;
          break;
        case 'supination':
          strideFactor = 0.93;
          kneeLoadMultiplier = 3.35;
          spinalCushion = 58;
          baseHealthScore = 64;
          break;
        case 'heavy_heel':
          strideFactor = 1.08; // Overstride with abrupt brake lock
          kneeLoadMultiplier = 3.85;
          spinalCushion = 48;
          baseHealthScore = 52;
          break;
        case 'optimal':
        default:
          strideFactor = 1.0;
          kneeLoadMultiplier = 2.2;
          spinalCushion = 92;
          baseHealthScore = 96;
          break;
      }
    } else {
      // Auto-corrected state
      strideFactor = 1.0;
      kneeLoadMultiplier = 2.2;
      spinalCushion = 92;
      baseHealthScore = 95;
    }

    const actualStrideCm = Math.round(optimalStrideCm * strideFactor * 10) / 10;
    const strideRatio = Math.round((actualStrideCm / optimalStrideCm) * 100);

    // 3. Knee Joint Compressive Force
    // F_knee = BW (kg) * 9.81 (m/s^2) * multiplier / 1000 => kN
    const bodyWeightN = weightKg * 9.80665;
    const kneeForceKn = Math.round(((bodyWeightN * kneeLoadMultiplier) / 1000) * 100) / 100;
    const optimalKneeForceKn = ((bodyWeightN * 2.2) / 1000);
    const kneeReductionKn = Math.max(0, Math.round((kneeForceKn - optimalKneeForceKn) * 100) / 100);
    const kneeReductionPercent = Math.max(0, Math.round(((kneeForceKn - optimalKneeForceKn) / kneeForceKn) * 100));

    // 4. Walking Speed & Duration
    // Speed (m/min) = actualStride (m) * cadence (steps/min)
    const speedMPerMin = (actualStrideCm / 100) * cadenceBpm;
    const walkingSpeedKmh = Math.round(((speedMPerMin * 60) / 1000) * 10) / 10;
    const safeSpeed = Math.max(1.0, walkingSpeedKmh);
    const durationHours = distanceKm / safeSpeed;
    const durationMinutes = Math.round(durationHours * 60);

    // 5. MET-based Caloric Expenditure
    // MET: ~2.8 at 3.0 km/h, ~3.8 at 4.8 km/h, ~5.0 at 6.0 km/h, ~6.5 at 7.5 km/h
    let met = 3.5;
    if (walkingSpeedKmh < 3.5) met = 2.8;
    else if (walkingSpeedKmh < 5.0) met = 3.8;
    else if (walkingSpeedKmh < 6.5) met = 4.8;
    else met = 6.2;

    // Calories = MET * Weight(kg) * Time(hours)
    const caloricBurnKcal = Math.round(met * weightKg * durationHours);

    // 6. Cadence Penalty on Health Score
    // Ideal cadence: 100 - 120 steps/min
    let cadencePenalty = 0;
    if (cadenceBpm < 90) cadencePenalty = Math.round((90 - cadenceBpm) * 0.4);
    else if (cadenceBpm > 135) cadencePenalty = Math.round((cadenceBpm - 135) * 0.35);

    const finalHealthScore = Math.max(20, Math.min(100, baseHealthScore - cadencePenalty));

    let gradeKey: 'calc_grade_optimal' | 'calc_grade_warning' | 'calc_grade_critical' = 'calc_grade_optimal';
    if (finalHealthScore < 65) {
      gradeKey = 'calc_grade_critical';
    } else if (finalHealthScore < 85) {
      gradeKey = 'calc_grade_warning';
    }

    return {
      optimalStrideCm,
      actualStrideCm,
      strideRatio,
      kneeForceKn,
      kneeReductionKn,
      kneeReductionPercent,
      spinalCushionPercent: spinalCushion,
      caloricBurnKcal,
      walkingSpeedKmh,
      durationMinutes,
      healthScore: finalHealthScore,
      gradeKey
    };
  }
}
