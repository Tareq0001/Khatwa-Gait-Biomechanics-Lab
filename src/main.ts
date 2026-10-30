import confetti from 'canvas-confetti';
import gsap from 'gsap';
import { GaitEngine, GAIT_PHASES } from './biomechanics/gaitEngine';
import { WalkerModel } from './biomechanics/walkerModel';
import { FootPressureHeatmap } from './pressure/footPressureHeatmap';
import { audioEngine } from './audio/audioEngine';
import { BiomechanicsCalculator, PostureType } from './calculator/biomechanicsCalculator';
import { translations, TranslationData } from './i18n/translations';

class KhatwaApp {
  private gaitEngine: GaitEngine;
  private walkerModel: WalkerModel;
  private pressureHeatmap: FootPressureHeatmap;

  private currentLang: 'ar' | 'en' = 'ar';
  private currentTheme: 'dark' | 'light' = 'dark';
  private currentTab = 'tab-3d';

  // Last footstep sound trigger state to avoid rapid repeated triggers
  private lastLeftHeelTrigger = false;
  private lastRightHeelTrigger = false;
  private lastLeftToeTrigger = false;
  private lastRightToeTrigger = false;

  private lastTime = 0;

  constructor() {
    this.gaitEngine = new GaitEngine();

    // 1. Initialize 3D Viewport
    const threeContainer = document.getElementById('threeContainer')!;
    this.walkerModel = new WalkerModel(threeContainer);

    // 2. Initialize Plantar Heatmap Canvas
    const canvas = document.getElementById('pressureCanvas') as HTMLCanvasElement;
    this.pressureHeatmap = new FootPressureHeatmap(canvas);

    // 3. Setup UI event bindings
    this.bindEvents();

    // 4. Run initial calculations & translations
    this.applyLanguage('ar');
    this.updateCalculator();

    // 5. Start RAF loop
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  // Bind all interactive controls
  private bindEvents() {
    // Nav Tabs
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        if (!targetTab) return;
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        const pane = document.getElementById(targetTab);
        if (pane) pane.classList.add('active');
        this.currentTab = targetTab;

        if (targetTab === 'tab-pressure') {
          setTimeout(() => this.pressureHeatmap.handleResize(), 50);
        }

        audioEngine.playUIFeedback(820);
      });
    });

    // Theme Toggle
    const themeBtn = document.getElementById('themeToggleBtn')!;
    themeBtn.addEventListener('click', () => {
      this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', this.currentTheme);
      audioEngine.playUIFeedback(900);
    });

    // Language Toggle
    const langBtn = document.getElementById('langToggleBtn')!;
    langBtn.addEventListener('click', () => {
      const nextLang = this.currentLang === 'ar' ? 'en' : 'ar';
      this.applyLanguage(nextLang);
      audioEngine.playUIFeedback(700);
    });

    // Audio Metronome Quick Button
    const metronomeBtn = document.getElementById('metronomeQuickBtn')!;
    metronomeBtn.addEventListener('click', () => {
      const isOn = audioEngine.toggleMetronome();
      metronomeBtn.style.color = isOn ? 'var(--emerald-primary)' : 'var(--text-main)';
      metronomeBtn.style.borderColor = isOn ? 'var(--emerald-primary)' : 'var(--border-subtle)';
      audioEngine.playUIFeedback(1000);
    });

    // Footstep Audio Quick Button
    const audioBtn = document.getElementById('audioQuickBtn')!;
    audioBtn.addEventListener('click', () => {
      const isOn = audioEngine.toggleFootsteps();
      audioBtn.style.color = isOn ? 'var(--cyan-primary)' : 'var(--text-dim)';
      audioBtn.innerHTML = isOn
        ? '<i class="fa-solid fa-volume-high"></i>'
        : '<i class="fa-solid fa-volume-xmark"></i>';
      audioEngine.playUIFeedback(650);
    });

    // Camera Presets
    const camButtons = document.querySelectorAll('.cam-btn');
    camButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const camMode = btn.getAttribute('data-cam') as 'orbit' | 'side' | 'front' | 'top' | 'foot';
        if (!camMode) return;
        camButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.walkerModel.setCameraPreset(camMode);
        audioEngine.playUIFeedback(850);
      });
    });

    // Play / Pause Simulation
    const playPauseBtn = document.getElementById('playPauseBtn')!;
    playPauseBtn.addEventListener('click', () => {
      const isPlaying = this.gaitEngine.togglePlay();
      playPauseBtn.innerHTML = isPlaying
        ? '<i class="fa-solid fa-pause"></i>'
        : '<i class="fa-solid fa-play"></i>';
      audioEngine.playUIFeedback(isPlaying ? 800 : 500);
    });

    // Gait Progress Scrubber
    const scrubber = document.getElementById('gaitScrubber') as HTMLInputElement;
    scrubber.addEventListener('input', () => {
      const val = parseFloat(scrubber.value);
      this.gaitEngine.setPlaying(false);
      playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      this.gaitEngine.setProgress(val);
    });

    // 8 Gait Phase Pills
    const phasePills = document.querySelectorAll('.phase-pill');
    phasePills.forEach(pill => {
      pill.addEventListener('click', () => {
        const idx = parseInt(pill.getAttribute('data-phase') || '0', 10);
        this.gaitEngine.jumpToPhase(idx);
        phasePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.updatePhaseLabels(this.gaitEngine.getCurrentPhase());
        audioEngine.playUIFeedback(920);
      });
    });

    // Posture Modes Switcher
    const postureCards = document.querySelectorAll('.posture-card-item');
    postureCards.forEach(card => {
      card.addEventListener('click', () => {
        const posture = card.getAttribute('data-posture') as PostureType;
        if (!posture) return;
        postureCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        // Turn off auto-correct when manually selecting a fault
        if (posture !== 'optimal' && this.gaitEngine.getIsAutoCorrected()) {
          this.toggleAutoCorrect(false);
        }

        this.gaitEngine.setPosture(posture);
        this.updateAlignmentStatus();
        this.updateCalculator();
        audioEngine.playUIFeedback(posture === 'optimal' ? 880 : 520);
      });
    });

    // Auto-Correct Posture Toggle
    const autoCorrectBtn = document.getElementById('autoCorrectToggleBtn')!;
    autoCorrectBtn.addEventListener('click', () => {
      const nextState = !this.gaitEngine.getIsAutoCorrected();
      this.toggleAutoCorrect(nextState);
    });

    // Speed Selector Buttons
    const speedButtons = document.querySelectorAll('.speed-pill-btn');
    speedButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const spd = parseFloat(btn.getAttribute('data-speed') || '5.0');
        speedButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.gaitEngine.setSpeedKmh(spd);

        // Update metronome cadence according to speed
        const bpm = Math.round(75 + spd * 7.5);
        audioEngine.setBpm(bpm);

        this.updateCalculator();
        audioEngine.playUIFeedback(780);
      });
    });

    // Calculator Range Inputs
    const calcInputs = ['calcHeight', 'calcWeight', 'calcCadence', 'calcDistance'];
    calcInputs.forEach(id => {
      const input = document.getElementById(id) as HTMLInputElement;
      input.addEventListener('input', () => this.updateCalculator());
    });

    // Open Report Modal Buttons
    const openReportBtn = document.getElementById('openReportBtn')!;
    const calcToReportBtn = document.getElementById('calcToReportBtn')!;
    const reportModal = document.getElementById('reportModal')!;
    const closeReportBtn = document.getElementById('closeReportBtn')!;
    const printReportBtn = document.getElementById('printReportBtn')!;

    const showReport = () => {
      this.populateReport();
      reportModal.classList.add('active');
      audioEngine.playUIFeedback(950);

      // Confetti celebration
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#10b981', '#38bdf8', '#f59e0b']
        });
      } catch {
        // Safe fallback
      }
    };

    openReportBtn.addEventListener('click', showReport);
    calcToReportBtn.addEventListener('click', showReport);

    closeReportBtn.addEventListener('click', () => {
      reportModal.classList.remove('active');
      audioEngine.playUIFeedback(500);
    });

    reportModal.addEventListener('click', (e) => {
      if (e.target === reportModal) {
        reportModal.classList.remove('active');
      }
    });

    printReportBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Smooth Auto-Correct GSAP transition
  private toggleAutoCorrect(enable: boolean) {
    const autoCorrectBtn = document.getElementById('autoCorrectToggleBtn')!;
    const btnText = document.getElementById('autoCorrectBtnText')!;
    const dict = translations[this.currentLang];

    this.gaitEngine.setAutoCorrect(enable);

    if (enable) {
      autoCorrectBtn.classList.add('active');
      btnText.innerText = dict.auto_correct_active;

      // Animate correction alpha to 1.0
      gsap.to(this.gaitEngine, {
        duration: 1.2,
        ease: 'power2.out',
        onUpdate: () => {
          this.gaitEngine.setCorrectionAlpha(this.gaitEngine.getCorrectionAlpha() + 0.05);
        }
      });
      audioEngine.playUIFeedback(1080);
    } else {
      autoCorrectBtn.classList.remove('active');
      btnText.innerText = dict.auto_correct_btn;
      this.gaitEngine.setCorrectionAlpha(0);
      audioEngine.playUIFeedback(600);
    }

    this.updateAlignmentStatus();
    this.updateCalculator();
  }

  // Update alignment status badge
  private updateAlignmentStatus() {
    const statusPill = document.getElementById('alignmentStatusPill')!;
    const statusText = document.getElementById('alignmentStatusText')!;
    const dict = translations[this.currentLang];

    const isGood = this.gaitEngine.getIsAutoCorrected() || this.gaitEngine.getPosture() === 'optimal';

    if (isGood) {
      statusPill.classList.remove('alert');
      statusText.innerText = dict.hud_aligned;
    } else {
      statusPill.classList.add('alert');
      statusText.innerText = dict.hud_misaligned;
    }
  }

  // Apply Language & Translations
  private applyLanguage(lang: 'ar' | 'en') {
    this.currentLang = lang;
    const dict = translations[lang];

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    const langText = document.getElementById('langText')!;
    langText.innerText = lang === 'ar' ? 'EN' : 'عربي';

    // Update all data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n') as keyof TranslationData;
      if (key && dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Update dynamic phase texts
    this.updatePhaseLabels(this.gaitEngine.getCurrentPhase());
    this.updateAlignmentStatus();
    this.updateCalculator();
  }

  // Update Phase names & descriptions
  private updatePhaseLabels(phase: typeof GAIT_PHASES[0]) {
    const dict = translations[this.currentLang];
    const nameEl = document.getElementById('currentPhaseName');
    const descEl = document.getElementById('currentPhaseDesc');

    if (nameEl) nameEl.innerText = dict[phase.nameKey as keyof TranslationData] || '';
    if (descEl) descEl.innerText = dict[phase.descKey as keyof TranslationData] || '';
  }

  // Recalculate kinematics, forces, and calories
  private updateCalculator() {
    const heightCm = parseFloat((document.getElementById('calcHeight') as HTMLInputElement)?.value || '175');
    const weightKg = parseFloat((document.getElementById('calcWeight') as HTMLInputElement)?.value || '75');
    const cadenceBpm = parseFloat((document.getElementById('calcCadence') as HTMLInputElement)?.value || '112');
    const distanceKm = parseFloat((document.getElementById('calcDistance') as HTMLInputElement)?.value || '5.0');

    // Update input display badges
    const valHeight = document.getElementById('valHeight');
    if (valHeight) valHeight.innerText = `${heightCm} cm`;

    const valWeight = document.getElementById('valWeight');
    if (valWeight) valWeight.innerText = `${weightKg} kg`;

    const valCadence = document.getElementById('valCadence');
    if (valCadence) valCadence.innerText = `${cadenceBpm} BPM`;

    const valDistance = document.getElementById('valDistance');
    if (valDistance) valDistance.innerText = `${distanceKm} km`;

    const posture = this.gaitEngine.getPosture();
    const isAutoCorrected = this.gaitEngine.getIsAutoCorrected();

    const res = BiomechanicsCalculator.calculate({
      heightCm,
      weightKg,
      cadenceBpm,
      distanceKm,
      posture,
      isAutoCorrected
    });

    const dict = translations[this.currentLang];

    // Results card
    const heroNum = document.getElementById('heroScoreNum');
    if (heroNum) heroNum.innerText = `${res.healthScore}`;

    const heroGrade = document.getElementById('heroScoreGrade');
    if (heroGrade) heroGrade.innerText = dict[res.gradeKey];

    const optStrideEl = document.getElementById('resOptimalStride');
    if (optStrideEl) optStrideEl.innerText = `${res.optimalStrideCm} cm`;

    const actStrideEl = document.getElementById('resActualStride');
    if (actStrideEl) actStrideEl.innerText = `${res.actualStrideCm} cm`;

    const strideRatioEl = document.getElementById('resStrideRatio');
    if (strideRatioEl) {
      strideRatioEl.innerText = this.currentLang === 'ar'
        ? `نسبة التطابق ${res.strideRatio}% من الطول المثالي`
        : `Stride consistency: ${res.strideRatio}% of ideal`;
    }

    const kneeForceEl = document.getElementById('resKneeForce');
    if (kneeForceEl) kneeForceEl.innerText = `${res.kneeForceKn} kN`;

    const kneeReductionEl = document.getElementById('resKneeReductionSub');
    if (kneeReductionEl) {
      kneeReductionEl.innerText = this.currentLang === 'ar'
        ? `تخفيض إجهاد بنسبة ${res.kneeReductionPercent}% (${res.kneeReductionKn} kN) بالمحاذاة`
        : `Joint load reduced by ${res.kneeReductionPercent}% (${res.kneeReductionKn} kN)`;
    }

    const spinalEl = document.getElementById('resSpinalCushion');
    if (spinalEl) spinalEl.innerText = `${res.spinalCushionPercent}%`;

    const calEl = document.getElementById('resCalories');
    if (calEl) calEl.innerText = `${res.caloricBurnKcal} kcal`;

    const durEl = document.getElementById('resDurationSub');
    if (durEl) {
      durEl.innerText = this.currentLang === 'ar'
        ? `في مدة تقديرية ${res.durationMinutes} دقيقة`
        : `Estimated walk time: ${res.durationMinutes} mins`;
    }

    const speedEl = document.getElementById('resSpeed');
    if (speedEl) speedEl.innerText = `${res.walkingSpeedKmh} km/h`;

    // Update Telemetry in Viewport Sidebar
    const teleKnee = document.getElementById('telemetryKneeTorque');
    if (teleKnee) teleKnee.innerText = `${res.kneeForceKn} kN`;

    const teleShock = document.getElementById('telemetryAxialShock');
    if (teleShock) {
      const shockMult = Math.round((res.kneeForceKn / ((weightKg * 9.8) / 1000)) * 10) / 10;
      teleShock.innerText = `${shockMult}× BW`;
    }

    const teleCad = document.getElementById('telemetryCadence');
    if (teleCad) teleCad.innerText = `${cadenceBpm} BPM`;

    const teleHealth = document.getElementById('telemetryHealthScore');
    if (teleHealth) {
      teleHealth.innerText = `${res.healthScore}%`;
      teleHealth.style.color = res.healthScore >= 85 ? 'var(--emerald-primary)' : 'var(--rose-alert)';
    }
  }

  // Populate dynamic data inside the Clinical Dossier Modal
  private populateReport() {
    const isGood = this.gaitEngine.getIsAutoCorrected() || this.gaitEngine.getPosture() === 'optimal';
    const posture = this.gaitEngine.getPosture();
    const date = new Date().toLocaleDateString(this.currentLang === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const dateEl = document.getElementById('repDateText');
    if (dateEl) dateEl.innerText = date;

    const serialEl = document.getElementById('repSerialCode');
    if (serialEl) serialEl.innerText = `KHATWA-GAIT-2026-X${Math.floor(1000 + Math.random() * 9000)}-BIO`;

    const scoreStatus = document.getElementById('repScoreStatus');
    const diagParagraph = document.getElementById('repDiagnosisParagraph');

    if (isGood) {
      if (scoreStatus) scoreStatus.innerText = this.currentLang === 'ar' ? '96 / 100 (ممتاز أوبتيمال)' : '96 / 100 (Optimal Grade)';
      if (diagParagraph) {
        diagParagraph.innerText = this.currentLang === 'ar'
          ? 'بناءً على المحاكاة ثلاثية الأبعاد وتحليل توزيع الضغط الأخمصي، أظهرت الدورة الحركية توافقاً فائقاً مع النمط الأوبتيمال. تمت ملاحظة مسار سلس لمركز الضغط (CoP) من الحافة الوحشية للكعب وصولاً لدفع إبهام القدم، مع كفاءة تخميد صدمات للركبة والعمود الفقري تصل إلى 92%.'
          : 'Based on 3D kinematic simulation and plantar pressure trajectory analysis, the gait cycle exhibits superior biomechanical harmony. Center of Pressure (CoP) progresses smoothly along the natural physiological path with 92% shock damping efficiency through the musculoskeletal chain.';
      }
    } else {
      if (scoreStatus) scoreStatus.innerText = this.currentLang === 'ar' ? '64 / 100 (انحراف كينماتيكي)' : '64 / 100 (Kinematic Deviation)';
      if (diagParagraph) {
        if (posture === 'text_neck') {
          diagParagraph.innerText = this.currentLang === 'ar'
            ? 'تم رصد إزاحة محورية أمامية للرأس بمقدار 35° متزامنة مع تحدب صدري وتراجع في طول الخطوة بنسبة 12%. هذا الخلل يضاعف الحمل الانضغاطي على الفقرات العنقية ويزيد من إجهاد عضلات شبه المنحرفة.'
            : 'Detected 35° forward head translation with thoracic kyphosis and a 12% reduction in optimal stride length, exerting quadrupled cervical compressive strain.';
        } else if (posture === 'overpronation') {
          diagParagraph.innerText = this.currentLang === 'ar'
            ? 'تم رصد انهيار في القوس الإنسي للقدم مع ميلان الكاحل للداخل (Eversion)، مما يولد عزوم التواء دورانية (Valgus Torque) على أربطة الركبة الداخلية، ويتركز الضغط الأخمصي بشكل مفرط على عظام المشط الأولى.'
            : 'Observed medial arch collapse and excessive subtalar eversion, generating inward valgus knee shear torque and focal peak pressure over the first metatarsal head.';
        } else if (posture === 'supination') {
          diagParagraph.innerText = this.currentLang === 'ar'
            ? 'تم رصد ارتكاز وحشي مفرط على الحافة الخارجية للقدم مع قوس قدم صلب غير مرن، مما يعطل آلية امتصاص الصدمات الطبيعية وينقل اهتزازات صدمية عالية لمفصل الكاحل والركبة.'
            : 'Observed lateral foot border overload with a rigid unyielding arch, impairing ground reaction shock absorption and elevating knee impact transmission.';
        } else if (posture === 'heavy_heel') {
          diagParagraph.innerText = this.currentLang === 'ar'
            ? 'تم رصد ضربة كعب قاسية مباشرة مع انغلاق مفصل الركبة عند زاوية 0° لحظة التلامس، ناقلة موجات صدمة اهتزازية مباشرة تصل إلى 3.8 أضعاف وزن الجسم للعمود الفقري ومفصل الورك.'
            : 'Observed severe heel strike with complete knee joint lockout (0° flexion) at initial contact, transmitting harsh unbuffered shock loads up to 3.8× body weight into the axial spine.';
        }
      }
    }
  }

  // Animation Loop
  private loop = (time: number) => {
    const delta = Math.min(0.1, (time - this.lastTime) / 1000);
    this.lastTime = time;

    // 1. Advance Gait Cycle progress
    const progress = this.gaitEngine.update(delta);

    // 2. Compute Joint Angles
    const angles = this.gaitEngine.computeJointAngles();

    // 3. Apply to 3D Walker Model
    this.walkerModel.applyKinematics(
      angles,
      this.gaitEngine.getPosture(),
      this.gaitEngine.getIsAutoCorrected(),
      this.gaitEngine.getSpeedKmh(),
      delta
    );

    // 4. Render 3D Scene
    this.walkerModel.render();

    // 5. Update Plantar Pressure Heatmap Canvas
    const pressureMetrics = this.pressureHeatmap.render(
      progress,
      this.gaitEngine.getPosture(),
      this.gaitEngine.getIsAutoCorrected()
    );

    // 6. Update Pressure HUD Numbers
    const pressPeak = document.getElementById('pressValPeak');
    if (pressPeak) pressPeak.innerText = `${pressureMetrics.peakPressureKpa} kPa`;

    const pressArea = document.getElementById('pressValArea');
    if (pressArea) pressArea.innerText = `${pressureMetrics.contactAreaCm2} cm²`;

    const pressSymm = document.getElementById('pressValSymmetry');
    if (pressSymm) pressSymm.innerText = `${pressureMetrics.symmetryLeft}% / ${pressureMetrics.symmetryRight}%`;

    const pressGRF = document.getElementById('pressValGRF');
    if (pressGRF) pressGRF.innerText = `${pressureMetrics.grfPercentBw}% BW`;

    // 7. Update Timeline scrubber and active phase pill
    const scrubber = document.getElementById('gaitScrubber') as HTMLInputElement;
    if (scrubber && this.gaitEngine.getIsPlaying()) {
      scrubber.value = progress.toString();
    }

    const pctText = document.getElementById('progressPctText');
    if (pctText) {
      pctText.innerText = `${Math.round(progress * 100)}%`;
    }

    const currentPhase = this.gaitEngine.getCurrentPhase();
    const phasePills = document.querySelectorAll('.phase-pill');
    phasePills.forEach((p, idx) => {
      if (idx === currentPhase.index) p.classList.add('active');
      else p.classList.remove('active');
    });
    this.updatePhaseLabels(currentPhase);

    // 8. Physical Footstep Audio Acoustic Engine trigger
    if (this.gaitEngine.getIsPlaying()) {
      // Left Heel strike happens at progress ~0.00
      if (progress < 0.05 && !this.lastLeftHeelTrigger) {
        audioEngine.playFootstepSound('heel', this.gaitEngine.getPosture() === 'heavy_heel' ? 1.6 : 1.0);
        this.lastLeftHeelTrigger = true;
      } else if (progress > 0.15) {
        this.lastLeftHeelTrigger = false;
      }

      // Left Toe push-off happens at progress ~0.55
      if (progress > 0.50 && progress < 0.58 && !this.lastLeftToeTrigger) {
        audioEngine.playFootstepSound('toe', 1.0);
        this.lastLeftToeTrigger = true;
      } else if (progress > 0.65 || progress < 0.45) {
        this.lastLeftToeTrigger = false;
      }

      // Right Heel strike happens at progress ~0.50
      if (progress > 0.48 && progress < 0.54 && !this.lastRightHeelTrigger) {
        audioEngine.playFootstepSound('heel', this.gaitEngine.getPosture() === 'heavy_heel' ? 1.6 : 1.0);
        this.lastRightHeelTrigger = true;
      } else if (progress > 0.65 || progress < 0.40) {
        this.lastRightHeelTrigger = false;
      }

      // Right Toe push-off happens at progress ~0.05
      if (progress > 0.04 && progress < 0.10 && !this.lastRightToeTrigger) {
        audioEngine.playFootstepSound('toe', 1.0);
        this.lastRightToeTrigger = true;
      } else if (progress > 0.18) {
        this.lastRightToeTrigger = false;
      }
    }

    requestAnimationFrame(this.loop);
  };
}

// Start Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  new KhatwaApp();
});
