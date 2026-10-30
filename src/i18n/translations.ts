export interface TranslationData {
  app_badge: string;
  app_title: string;
  app_subtitle: string;
  lead_architect: string;
  lead_architect_val: string;
  lang_toggle: string;
  theme_toggle: string;
  
  // Navigation & Tabs
  tab_3d_lab: string;
  tab_pressure: string;
  tab_calculator: string;
  tab_report: string;
  
  // 3D Controls
  cam_controls_title: string;
  cam_orbit: string;
  cam_side: string;
  cam_front: string;
  cam_top: string;
  cam_foot: string;
  
  // Walker State & Faults
  posture_mode_title: string;
  fault_optimal: string;
  fault_optimal_desc: string;
  fault_text_neck: string;
  fault_text_neck_desc: string;
  fault_overpronation: string;
  fault_overpronation_desc: string;
  fault_supination: string;
  fault_supination_desc: string;
  fault_heavy_heel: string;
  fault_heavy_heel_desc: string;
  
  auto_correct_btn: string;
  auto_correct_active: string;
  reset_vectors_btn: string;
  
  // Speed & Playback
  playback_title: string;
  speed_label: string;
  speed_stroll: string;
  speed_brisk: string;
  speed_power: string;
  play_pause_btn: string;
  step_prev_btn: string;
  step_next_btn: string;
  gait_scrubber_label: string;
  
  // 8 Phases
  phase_1_name: string;
  phase_1_desc: string;
  phase_2_name: string;
  phase_2_desc: string;
  phase_3_name: string;
  phase_3_desc: string;
  phase_4_name: string;
  phase_4_desc: string;
  phase_5_name: string;
  phase_5_desc: string;
  phase_6_name: string;
  phase_6_desc: string;
  phase_7_name: string;
  phase_7_desc: string;
  phase_8_name: string;
  phase_8_desc: string;
  
  // Vectors HUD
  hud_joint_torque: string;
  hud_alignment_status: string;
  hud_aligned: string;
  hud_misaligned: string;
  hud_axial_shock: string;
  hud_cadence_live: string;
  
  // Plantar Pressure Canvas
  pressure_title: string;
  pressure_subtitle: string;
  cop_curve_label: string;
  cop_curve_desc: string;
  left_foot_label: string;
  right_foot_label: string;
  peak_pressure: string;
  contact_area: string;
  symmetry_ratio: string;
  pressure_scale_low: string;
  pressure_scale_med: string;
  pressure_scale_high: string;
  
  // Audio Metronome
  audio_title: string;
  metronome_toggle: string;
  footsteps_toggle: string;
  bpm_label: string;
  bpm_unit: string;
  
  // Calculator
  calc_title: string;
  calc_subtitle: string;
  input_height: string;
  input_weight: string;
  input_cadence: string;
  input_distance: string;
  calc_result_stride_opt: string;
  calc_result_stride_act: string;
  calc_result_knee_force: string;
  calc_result_knee_reduction: string;
  calc_result_spinal_cushion: string;
  calc_result_calories: string;
  calc_result_health_score: string;
  calc_grade_optimal: string;
  calc_grade_warning: string;
  calc_grade_critical: string;
  
  // Report Dossier
  report_title: string;
  report_subtitle: string;
  generate_report_btn: string;
  print_report_btn: string;
  close_modal: string;
  rep_serial_num: string;
  rep_client_name: string;
  rep_client_default: string;
  rep_eval_date: string;
  rep_status_label: string;
  rep_biomech_summary: string;
  rep_prescribed_drills: string;
  drill_1_title: string;
  drill_1_desc: string;
  drill_2_title: string;
  drill_2_desc: string;
  drill_3_title: string;
  drill_3_desc: string;
  drill_4_title: string;
  drill_4_desc: string;
  rep_auth_signature: string;
  rep_auth_title: string;
  rep_barcode_label: string;
}

export const translations: Record<'ar' | 'en', TranslationData> = {
  ar: {
    app_badge: "المختبر السيبراني للذكاء الاصطناعي والميكانيكا الحيوية",
    app_title: "خَـطْـوَة | مختبر الميكانيكا الحيوية وتصحيح المشي 3D",
    app_subtitle: "منصة فيزيائية تفاعلية ثلاثية الأبعاد لمحاكاة دورة المشي البشري وتحليل إجهادات المفاصل وتوزيع الضغط الأخمصي",
    lead_architect: "المبتكر وكبير مهندسي النظم",
    lead_architect_val: "أ. طارق ابوعشي",
    lang_toggle: "English",
    theme_toggle: "تغيير المظهر",
    
    tab_3d_lab: "مختبر المشي 3D",
    tab_pressure: "الضغط الأخمصي ومسار CoP",
    tab_calculator: "حاسبة الكينماتيكا والأثر",
    tab_report: "التقرير الإكلينيكي المعتمد",
    
    cam_controls_title: "زوايا الكاميرا التحليلية",
    cam_orbit: "منظور حر 360°",
    cam_side: "منظور جانبي (تحليل الزوايا)",
    cam_front: "منظور أمامي (محاذاة الركبتين)",
    cam_top: "منظور علوي (المسار المحوري)",
    cam_foot: "تكبير القدمين والارتكاز",
    
    posture_mode_title: "أنماط المشي والانحرافات القوامية",
    fault_optimal: "المشي السليم والمتزن",
    fault_optimal_desc: "محاذاة حيادية للعمود الفقري، زاوية هبوط متزنة 15°، وتوزيع ممتص للصدمات عبر كامل السلسلة الحركية.",
    fault_text_neck: "انحناء الرقبة وتحدب الظهر (Text Neck)",
    fault_text_neck_desc: "إزاحة الرأس للأمام بمقدار 35° تضاعف الحمل المحوري على الفقرات العنقية 4 أضعاف وتقلل طول الخطوة.",
    fault_overpronation: "تفلطح القدم وانحراف الكاحل (Overpronation)",
    fault_overpronation_desc: "انهيار القوس الإنسي وميلان الكاحل للداخل، مما يولد عزوم دوران إجهادية قوية على أربطة الركبة الداخلية.",
    fault_supination: "المشي على الحافة الخارجية (Supination)",
    fault_supination_desc: "ارتكاز مفرط على الحافة الوحشية للقدم مع ضعف امتصاص الصدمات وزيادة خطر التواء الكاحل وإجهاد وتر الرضفة.",
    fault_heavy_heel: "ضربة الكعب العنيفة المباشرة (Heavy Heel Strike)",
    fault_heavy_heel_desc: "انغلاق مفصل الركبة عند زاوية 0° لحظة التلامس، ناقلة قوى صدمة اهتزازية تصل إلى 3.8 أضعاف وزن الجسم للعمود الفقري.",
    
    auto_correct_btn: "تفعيل التصحيح الحيوي الذكي (Auto-Correct)",
    auto_correct_active: "تم التصحيح وتثبيت المحاذاة المثالية",
    reset_vectors_btn: "إعادة ضبط متجهات القوى",
    
    playback_title: "التحكم في ديناميكا المشي والسرعة",
    speed_label: "سرعة المشي المقاسة",
    speed_stroll: "نزهة هادئة (2.5 كم/س)",
    speed_brisk: "مشي نشط (5.0 كم/س)",
    speed_power: "مشي رياضي سريع (7.5 كم/س)",
    play_pause_btn: "تشغيل / إيقاف المحاكاة",
    step_prev_btn: "المرحلة السابقة",
    step_next_btn: "المرحلة التالية",
    gait_scrubber_label: "موضع دورة المشي (0% - 100%)",
    
    phase_1_name: "1. ضربة الكعب (Initial Contact)",
    phase_1_desc: "لحظة تلامس كعب القدم مع الأرض بزاوية عطف ظهري مثالية (25°)، امتصاص الصدمة الأولى.",
    phase_2_name: "2. استجابة التحميل (Loading Response)",
    phase_2_desc: "ملامسة كامل باطن القدم للأرض، عطف الركبة بمقدار 15° لامتصاص وزن الجسم وتثبيت الحوض.",
    phase_3_name: "3. منتصف الارتكاز (Midstance)",
    phase_3_desc: "الجسم فوق القدم المرتكزة مباشرة، انتقال مركز الثقل للأمام، أقصى ثبات لمفصل الركبة.",
    phase_4_name: "4. رفع الكعب (Terminal Stance)",
    phase_4_desc: "ارتفاع الكعب عن الأرض، انحناء مشط القدم، تخزين الطاقة المرنة في وتر أخيل.",
    phase_5_name: "5. دفع أصابع القدم (Pre-Swing / Toe-Off)",
    phase_5_desc: "الانفصال الأخير لإصبع القدم الكبير، توليد قوة الدفع القصوى لبدء التأرجح.",
    phase_6_name: "6. بداية التأرجح (Initial Swing)",
    phase_6_desc: "ارتفاع القدم في الهواء وتسارع الساق، ثني الركبة بمقدار 60° لضمان عدم ملامسة الأرض.",
    phase_7_name: "7. منتصف التأرجح (Mid-Swing)",
    phase_7_desc: "مرور الساق المتأرجحة بجوار الساق المرتكزة، محاذاة عظم القصبة عمودياً مع الجاذبية.",
    phase_8_name: "8. نهاية التأرجح (Terminal Swing)",
    phase_8_desc: "فرد الركبة وتهيؤ عضلات باطن الركبة والورك لفرملة الحركة والهبوط السلس لضربة الكعب التالية.",
    
    hud_joint_torque: "عزوم إجهاد المفاصل الحركية",
    hud_alignment_status: "حالة المحاذاة البيوميكانيكية",
    hud_aligned: "متطابق مع المعيار الأوبتيمال",
    hud_misaligned: "إجهاد التوائي غير متزن",
    hud_axial_shock: "الحمل الصدمي المحوري",
    hud_cadence_live: "معدل الخطو اللحظي",
    
    pressure_title: "خريطة توزيع الضغط الأخمصي ومسار مركز الضغط (CoP)",
    pressure_subtitle: "تحليل ديناميكي لحظي متزامن مع دوران القدم في كل مرحلة حركية بدقة قياس إكلينيكية",
    cop_curve_label: "مسار مركز الضغط الفراشة (CoP Gait Butterfly Line)",
    cop_curve_desc: "خط أزرق نيوني متدرج يوضح خط انتقال مركز ثقل القوى من منتصف الكعب الخارجي إلى إبهام القدم.",
    left_foot_label: "القدم اليسرى (Left Foot)",
    right_foot_label: "القدم اليمنى (Right Foot)",
    peak_pressure: "الضغط الأخمصي الأقصى",
    contact_area: "مساحة التلامس الفعالة",
    symmetry_ratio: "مؤشر التناظر الحركي (يمين / يسار)",
    pressure_scale_low: "منخفض (0-150 kPa)",
    pressure_scale_med: "متوسط (150-400 kPa)",
    pressure_scale_high: "إجهادي مرتفع (> 600 kPa)",
    
    audio_title: "البندول الإيقاعي والصوتيات التخليقية للخطوات",
    metronome_toggle: "بندول الإيقاع الصوتي (Cadence Metronome)",
    footsteps_toggle: "صوتيات الخطوات الفيزيائية (Footstep Acoustics)",
    bpm_label: "إيقاع الخطو المحدد",
    bpm_unit: "خطوة / دقيقة (BPM)",
    
    calc_title: "حاسبة الكينماتيكا الدقيقة وقوى الصدمات المفصلية",
    calc_subtitle: "احسب طول خطوتك البيولوجي المثالي، وخفض إجهاد الركبة، واستهلاك السعرات بناءً على قياساتك الفيزيولوجية",
    input_height: "الطول (سم)",
    input_weight: "الوزن (كجم)",
    input_cadence: "معدل الخطو (خطوة/دقيقة)",
    input_distance: "المسافة المقطوعة (كم)",
    calc_result_stride_opt: "طول الخطوة البيوميكانيكي المثالي",
    calc_result_stride_act: "الخطوة الفعلية الحالية",
    calc_result_knee_force: "حمل صدمة مفصل الركبة",
    calc_result_knee_reduction: "تخفيض الضغط المفصلي بالتصحيح",
    calc_result_spinal_cushion: "كفاءة التخميد للعمود الفقري",
    calc_result_calories: "السعرات الحرارية المحروقة",
    calc_result_health_score: "مؤشر الكفاءة البيوميكانيكية",
    calc_grade_optimal: "ممتاز - مشي بيوميكانيكي عالي الحماية للمفاصل",
    calc_grade_warning: "متوسط - يتطلب ضبط وضعية الهبوط ومحاذاة الرقبة",
    calc_grade_critical: "تحذيري - إجهادات مفصلية تستدعي التمارين التصحيحية",
    
    report_title: "ملف التقييم الإكلينيكي للمشية والبرنامج التصحيحي",
    report_subtitle: "تقرير رسمي معتمد يتضمن المؤشرات الحركية، ومخطط عيوب القوام، والتمارين العلاجية الموصى بها",
    generate_report_btn: "إصدار التقرير البيوميكانيكي الرسمي",
    print_report_btn: "طباعة التقرير الطبي المعتمد (PDF)",
    close_modal: "إغلاق التقرير",
    rep_serial_num: "الرقم التسلسلي البيومتري",
    rep_client_name: "اسم المفحوص / المتدرب",
    rep_client_default: "رياضي / مستخدم المنصة",
    rep_eval_date: "تاريخ الفحص والتحليل",
    rep_status_label: "التقييم الحركي النهائي",
    rep_biomech_summary: "التشخيص الكينماتيكي وقراءة المتجهات",
    rep_prescribed_drills: "البروتوكول الرياضي التأهيلي الموصى به",
    drill_1_title: "1. تمرين استطالة الساق والعطف الظهري (Ankle Dorsiflexion)",
    drill_1_desc: "3 مجموعات × 12 تكراراً لكل قدم لزيادة مرونة مفصل الكاحل ومنع ضربة الكعب القاسية وتفلطح القوس.",
    drill_2_title: "2. جسر تفعيل العضلة الألوية الوسطى (Gluteus Medius Bridge)",
    drill_2_desc: "3 مجموعات × 15 تكراراً لمنع ميلان الحوض والتواء الركبتين للداخل وحماية أربطة الرباط الصليبي.",
    drill_3_title: "3. تمرين ملاك الحائط وتصحيح الصدر (Wall Angels Drill)",
    drill_3_desc: "دقيقتان يومياً لاستعادة تقوس الفقرات الصدرية الطبيعي وإرجاع الرأس لمحاذاة مركز ثقل الجسم.",
    drill_4_title: "4. تمرين الثبات الحسي على قدم واحدة (Single-Leg Proprioception)",
    drill_4_desc: "60 ثانية لكل قدم لإعادة تدريب المستقبلات العصبية وضمان انتقال خط مركز الضغط (CoP) بسلاسة.",
    rep_auth_signature: "المبتكر ومصمم النظام البيوميكانيكي:",
    rep_auth_title: "أ. طارق ابوعشي — Lead Systems Architect & Biomechanical Computing Lead",
    rep_barcode_label: "رمز التشفير الرقمي المعتمد"
  },
  en: {
    app_badge: "Biomechanical AI & Cybernetic Gait Laboratory",
    app_title: "KHATWA | 3D Gait Biomechanics & Correct Walking Lab",
    app_subtitle: "Interactive 3D physics-driven mannequin simulator analyzing 8-phase human gait kinematics, joint stress vectors, and plantar pressure dynamics",
    lead_architect: "Creator & Chief Systems Architect",
    lead_architect_val: "Tareq Abuashi",
    lang_toggle: "العربية",
    theme_toggle: "Toggle Theme",
    
    tab_3d_lab: "3D Gait Simulator",
    tab_pressure: "Plantar Pressure & CoP",
    tab_calculator: "Kinematics & Impact",
    tab_report: "Certified Gait Dossier",
    
    cam_controls_title: "Analytical Camera Viewports",
    cam_orbit: "360° Free Orbit",
    cam_side: "Sagittal View (Angle Analysis)",
    cam_front: "Coronal View (Knee Alignment)",
    cam_top: "Transverse View (Axial Path)",
    cam_foot: "Macro Foot & Contact Zoom",
    
    posture_mode_title: "Gait Modes & Postural Deviations",
    fault_optimal: "Optimal Balanced Gait",
    fault_optimal_desc: "Neutral spine alignment, controlled 15° strike angle, and fluid kinetic shock absorption through the musculoskeletal chain.",
    fault_text_neck: "Text Neck & Forward Head Slouch",
    fault_text_neck_desc: "35° forward head translation quadruples cervical axial compression to ~27 kg and shortens effective stride.",
    fault_overpronation: "Overpronation & Valgus Knee Collapse",
    fault_overpronation_desc: "Medial longitudinal arch collapse causing excessive internal tibial rotation and high valgus torque on knee ligaments.",
    fault_supination: "Underpronation / Supination",
    fault_supination_desc: "Excessive lateral foot strike with rigid arch, deficient shock attenuation, and elevated risk of inversion sprains.",
    fault_heavy_heel: "Heavy Heel Strike & Knee Hyperextension",
    fault_heavy_heel_desc: "Rigid 0° knee lockout at ground contact transmitting up to 3.8× body weight shock waves straight to lumbar vertebrae.",
    
    auto_correct_btn: "Activate Intelligent Auto-Correction",
    auto_correct_active: "Biomechanical Precision Alignment Locked",
    reset_vectors_btn: "Reset Force Vectors",
    
    playback_title: "Gait Kinematics & Velocity Control",
    speed_label: "Calculated Walking Speed",
    speed_stroll: "Casual Stroll (2.5 km/h)",
    speed_brisk: "Brisk Pace (5.0 km/h)",
    speed_power: "Power Walk (7.5 km/h)",
    play_pause_btn: "Play / Pause Simulation",
    step_prev_btn: "Previous Phase",
    step_next_btn: "Next Phase",
    gait_scrubber_label: "Gait Cycle Timeline (0% - 100%)",
    
    phase_1_name: "1. Initial Contact (Heel Strike)",
    phase_1_desc: "Heel contacts the treadmill with 25° ankle dorsiflexion, initiating the shock absorption sequence.",
    phase_2_name: "2. Loading Response (Foot Flat)",
    phase_2_desc: "Plantar surface achieves full contact, 15° knee flexion cushions body mass and stabilizes the pelvis.",
    phase_3_name: "3. Midstance",
    phase_3_desc: "Body weight aligns vertically over stance limb; forward center of gravity roll with maximum knee stability.",
    phase_4_name: "4. Terminal Stance (Heel Off)",
    phase_4_desc: "Heel lifts from surface, metatarsophalangeal extension stretches and charges the Achilles elastic spring.",
    phase_5_name: "5. Pre-Swing (Toe Off)",
    phase_5_desc: "Terminal hallux propulsion generating peak kinetic impulse to launch the limb into swing phase.",
    phase_6_name: "6. Initial Swing",
    phase_6_desc: "Foot leaves treadmill, rapid forward thigh acceleration with 60° knee flexion for floor clearance.",
    phase_7_name: "7. Mid-Swing",
    phase_7_desc: "Swing limb passes contralateral stance limb, tibia aligns vertically perpendicular to the ground plane.",
    phase_8_name: "8. Terminal Swing",
    phase_8_desc: "Controlled knee extension and eccentric hamstring deceleration preparing for optimal heel contact.",
    
    hud_joint_torque: "Kinematic Joint Shear Torque",
    hud_alignment_status: "Biomechanical Alignment",
    hud_aligned: "Optimal Certified Alignment",
    hud_misaligned: "High Torsional Stress Detected",
    hud_axial_shock: "Axial Impact Load",
    hud_cadence_live: "Instantaneous Cadence",
    
    pressure_title: "Plantar Pressure Distribution & Center of Pressure (CoP)",
    pressure_subtitle: "Real-time clinical-grade dynamic pressure sensing synchronized with foot roll kinematics",
    cop_curve_label: "CoP Gait Butterfly Trajectory Line",
    cop_curve_desc: "Dynamic cyan gradient path mapping instantaneous center of ground reaction force from heel to hallux.",
    left_foot_label: "Left Foot",
    right_foot_label: "Right Foot",
    peak_pressure: "Peak Plantar Pressure",
    contact_area: "Active Contact Area",
    symmetry_ratio: "L/R Symmetry Index",
    pressure_scale_low: "Low (0-150 kPa)",
    pressure_scale_med: "Medium (150-400 kPa)",
    pressure_scale_high: "High Stress (> 600 kPa)",
    
    audio_title: "Acoustic Cadence Metronome & Physical Footstep Engine",
    metronome_toggle: "Synthesized Cadence Metronome",
    footsteps_toggle: "Physical Footstep Audio Acoustics",
    bpm_label: "Cadence Frequency",
    bpm_unit: "Steps / Min (BPM)",
    
    calc_title: "Precision Biomechanical Impact & Stride Calculator",
    calc_subtitle: "Calculate anthropometric optimal stride, knee load reduction, and caloric expenditure from personal biometric inputs",
    input_height: "Height (cm)",
    input_weight: "Weight (kg)",
    input_cadence: "Cadence (steps/min)",
    input_distance: "Distance Traveled (km)",
    calc_result_stride_opt: "Optimal Anthropometric Stride",
    calc_result_stride_act: "Current Cadence Stride",
    calc_result_knee_force: "Knee Peak Compressive Load",
    calc_result_knee_reduction: "Joint Stress Reduction via Posture",
    calc_result_spinal_cushion: "Spinal Damping Cushioning",
    calc_result_calories: "Active Caloric Expenditure",
    calc_result_health_score: "Biomechanical Health Index",
    calc_grade_optimal: "EXCELLENT - Superior Joint Protection & Kinetic Balance",
    calc_grade_warning: "MODERATE - Requires Head Alignment & Softer Heel Roll",
    calc_grade_critical: "ELEVATED RISK - Joint Torque Requires Corrective Drills",
    
    report_title: "Certified Clinical Gait Assessment & Exercise Prescription",
    report_subtitle: "Official biomechanical dossier detailing posture parameters, stress vector diagnosis, and customized therapeutic drills",
    generate_report_btn: "Generate Certified Gait Dossier",
    print_report_btn: "Print Clinical Report (PDF)",
    close_modal: "Close Dossier",
    rep_serial_num: "Biometric Dossier Serial",
    rep_client_name: "Client / Athlete Name",
    rep_client_default: "Athletic User / Evaluated Subject",
    rep_eval_date: "Evaluation Timestamp",
    rep_status_label: "Clinical Gait Evaluation",
    rep_biomech_summary: "Kinematic Diagnosis & Vector Analysis",
    rep_prescribed_drills: "Prescribed Biomechanical Corrective Drills",
    drill_1_title: "1. Ankle Dorsiflexion & Soleus Stretch",
    drill_1_desc: "3 sets × 12 reps per foot to expand ankle range, soften heel strike velocity, and restore arch spring dynamics.",
    drill_2_title: "2. Gluteus Medius Activation Bridge",
    drill_2_desc: "3 sets × 15 reps to stabilize pelvic tilt, eliminate valgus knee collapse, and protect ACL/MCL ligaments.",
    drill_3_title: "3. Wall Angels Thoracic Correction",
    drill_3_desc: "2 minutes daily to reverse kyphotic slouch, open anterior chest wall, and align cervical spine over center of gravity.",
    drill_4_title: "4. Single-Leg Proprioception Balance",
    drill_4_desc: "60 seconds per limb on unstable surface to calibrate neuromuscular mechanoreceptors and restore smooth CoP roll.",
    rep_auth_signature: "Lead Systems Architect & Biomechanical Designer:",
    rep_auth_title: "Tareq Abuashi — Lead Systems Architect & Biomechanical Computing Lead",
    rep_barcode_label: "Cryptographic Verification Hash"
  }
};
