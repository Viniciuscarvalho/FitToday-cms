/**
 * PT-BR name translations and aliases for the ~200 most common exercises.
 * Used by build-catalog.mjs to enrich the exercise catalog with Portuguese names.
 */

// ============================
// MAPEAMENTO DE NOMES PT-BR
// ============================

export const PT_BR_NAMES = {
  // === PEITO (Chest) ===
  barbell_bench_press: 'Supino Reto com Barra',
  incline_barbell_bench_press: 'Supino Inclinado com Barra',
  decline_barbell_bench_press: 'Supino Declinado com Barra',
  dumbbell_bench_press: 'Supino Reto com Halteres',
  incline_dumbbell_bench_press: 'Supino Inclinado com Halteres',
  decline_dumbbell_bench_press: 'Supino Declinado com Halteres',
  dumbbell_flyes: 'Crucifixo com Halteres',
  incline_dumbbell_flyes: 'Crucifixo Inclinado com Halteres',
  cable_crossover: 'Crossover no Cabo',
  cable_fly: 'Crucifixo no Cabo',
  push_ups: 'Flexão de Braços',
  wide_grip_push_ups: 'Flexão de Braços Aberta',
  diamond_push_ups: 'Flexão Diamante',
  chest_dips: 'Mergulho para Peito',
  machine_chest_press: 'Supino na Máquina',
  pec_deck: 'Peck Deck',
  svend_press: 'Svend Press',

  // === COSTAS (Back) ===
  pull_ups: 'Barra Fixa (Pegada Pronada)',
  chin_ups: 'Barra Fixa (Pegada Supinada)',
  lat_pulldown: 'Puxada na Polia Alta',
  wide_grip_lat_pulldown: 'Puxada Aberta na Polia',
  close_grip_lat_pulldown: 'Puxada Fechada na Polia',
  seated_cable_row: 'Remada Sentado no Cabo',
  barbell_row: 'Remada Curvada com Barra',
  bent_over_barbell_row: 'Remada Curvada com Barra',
  dumbbell_row: 'Remada Unilateral com Halter',
  one_arm_dumbbell_row: 'Remada Unilateral com Halter',
  t_bar_row: 'Remada Cavalinho',
  cable_row: 'Remada no Cabo',
  barbell_deadlift: 'Levantamento Terra',
  deadlift: 'Levantamento Terra',
  sumo_deadlift: 'Levantamento Terra Sumo',
  rack_pulls: 'Rack Pull',
  hyperextensions: 'Hiperextensão Lombar',
  back_extension: 'Extensão de Costas',
  straight_arm_pulldown: 'Pulldown com Braços Estendidos',
  face_pull: 'Face Pull',
  inverted_row: 'Remada Invertida',

  // === OMBROS (Shoulders) ===
  overhead_press: 'Desenvolvimento com Barra',
  military_press: 'Desenvolvimento Militar',
  barbell_shoulder_press: 'Desenvolvimento com Barra',
  dumbbell_shoulder_press: 'Desenvolvimento com Halteres',
  seated_dumbbell_press: 'Desenvolvimento Sentado com Halteres',
  arnold_press: 'Arnold Press',
  lateral_raise: 'Elevação Lateral',
  dumbbell_lateral_raise: 'Elevação Lateral com Halteres',
  cable_lateral_raise: 'Elevação Lateral no Cabo',
  front_raise: 'Elevação Frontal',
  dumbbell_front_raise: 'Elevação Frontal com Halteres',
  rear_delt_fly: 'Crucifixo Inverso',
  reverse_fly: 'Crucifixo Inverso',
  upright_row: 'Remada Alta',
  barbell_upright_row: 'Remada Alta com Barra',
  shrugs: 'Encolhimento de Ombros',
  barbell_shrug: 'Encolhimento com Barra',
  dumbbell_shrug: 'Encolhimento com Halteres',

  // === BÍCEPS (Biceps) ===
  barbell_curl: 'Rosca Direta com Barra',
  dumbbell_curl: 'Rosca Direta com Halteres',
  dumbbell_bicep_curl: 'Rosca Direta com Halteres',
  hammer_curl: 'Rosca Martelo',
  preacher_curl: 'Rosca Scott',
  concentration_curl: 'Rosca Concentrada',
  cable_curl: 'Rosca no Cabo',
  incline_dumbbell_curl: 'Rosca Inclinada com Halteres',
  ez_bar_curl: 'Rosca com Barra W',
  reverse_curl: 'Rosca Inversa',
  spider_curl: 'Rosca Spider',
  '21s': 'Rosca 21',

  // === TRÍCEPS (Triceps) ===
  tricep_pushdown: 'Tríceps na Polia',
  cable_tricep_pushdown: 'Tríceps Polia Alta',
  tricep_rope_pushdown: 'Tríceps Corda',
  skull_crushers: 'Tríceps Testa',
  lying_tricep_extension: 'Tríceps Testa Deitado',
  overhead_tricep_extension: 'Tríceps Francês',
  dumbbell_tricep_extension: 'Extensão de Tríceps com Halter',
  dips: 'Mergulho em Paralelas',
  bench_dips: 'Mergulho no Banco',
  close_grip_bench_press: 'Supino Fechado',
  diamond_push_up: 'Flexão Diamante',
  tricep_kickback: 'Tríceps Coice',

  // === QUADRÍCEPS (Quadriceps) ===
  barbell_squat: 'Agachamento Livre com Barra',
  back_squat: 'Agachamento com Barra',
  front_squat: 'Agachamento Frontal',
  goblet_squat: 'Agachamento Goblet',
  leg_press: 'Leg Press',
  leg_extension: 'Cadeira Extensora',
  hack_squat: 'Hack Squat',
  bulgarian_split_squat: 'Agachamento Búlgaro',
  lunges: 'Avanço (Lunge)',
  walking_lunges: 'Avanço Caminhando',
  reverse_lunges: 'Avanço Reverso',
  step_ups: 'Step Up',
  sissy_squat: 'Sissy Squat',
  wall_sit: 'Agachamento na Parede',
  pistol_squat: 'Agachamento Pistol',
  smith_machine_squat: 'Agachamento no Smith',

  // === POSTERIORES (Hamstrings) ===
  romanian_deadlift: 'Levantamento Terra Romeno',
  stiff_leg_deadlift: 'Stiff (Pernas Estendidas)',
  leg_curl: 'Mesa Flexora',
  lying_leg_curl: 'Mesa Flexora Deitado',
  seated_leg_curl: 'Mesa Flexora Sentado',
  good_morning: 'Good Morning',
  nordic_hamstring_curl: 'Nordic Curl',
  single_leg_deadlift: 'Stiff Unilateral',
  glute_ham_raise: 'Glute Ham Raise',
  kettlebell_swing: 'Kettlebell Swing',

  // === GLÚTEOS (Glutes) ===
  hip_thrust: 'Hip Thrust',
  barbell_hip_thrust: 'Hip Thrust com Barra',
  glute_bridge: 'Ponte de Glúteos',
  cable_kickback: 'Coice no Cabo',
  donkey_kick: 'Coice de Burro',
  fire_hydrant: 'Hidrante',
  sumo_squat: 'Agachamento Sumo',
  hip_abduction: 'Abdução de Quadril',
  cable_pull_through: 'Pull Through no Cabo',

  // === PANTURRILHAS (Calves) ===
  calf_raise: 'Elevação de Panturrilha',
  standing_calf_raise: 'Panturrilha em Pé',
  seated_calf_raise: 'Panturrilha Sentado',
  donkey_calf_raise: 'Panturrilha Donkey',
  single_leg_calf_raise: 'Panturrilha Unilateral',

  // === CORE / ABDÔMEN ===
  plank: 'Prancha',
  side_plank: 'Prancha Lateral',
  crunches: 'Abdominal Crunch',
  sit_ups: 'Abdominal Sit-Up',
  '3_4_sit_up': 'Abdominal 3/4',
  hanging_leg_raise: 'Elevação de Pernas Pendurado',
  leg_raise: 'Elevação de Pernas',
  lying_leg_raise: 'Elevação de Pernas Deitado',
  russian_twist: 'Torção Russa',
  bicycle_crunch: 'Abdominal Bicicleta',
  mountain_climbers: 'Alpinista (Mountain Climber)',
  ab_roller: 'Roda Abdominal',
  cable_crunch: 'Abdominal no Cabo',
  woodchop: 'Woodchop',
  dead_bug: 'Dead Bug',
  bird_dog: 'Bird Dog',
  pallof_press: 'Pallof Press',
  decline_crunch: 'Abdominal Declinado',
  reverse_crunch: 'Abdominal Reverso',
  v_up: 'V-Up',
  flutter_kicks: 'Tesoura',
  toe_touches: 'Toque nos Pés',

  // === ANTEBRAÇOS (Forearms) ===
  wrist_curl: 'Rosca de Punho',
  reverse_wrist_curl: 'Rosca de Punho Inversa',
  farmers_walk: 'Farmer Walk',

  // === CORPO INTEIRO (Full Body) ===
  burpees: 'Burpee',
  clean_and_press: 'Clean and Press',
  power_clean: 'Power Clean',
  snatch: 'Arranco (Snatch)',
  thruster: 'Thruster',
  turkish_get_up: 'Turkish Get Up',
  man_maker: 'Man Maker',

  // === CARDIO ===
  jumping_jacks: 'Polichinelo',
  jump_rope: 'Pular Corda',
  box_jump: 'Box Jump',
  high_knees: 'Joelhos Altos',
  butt_kicks: 'Chute no Glúteo',
  battle_ropes: 'Corda Naval',
  rowing_machine: 'Remo Ergométrico',
  assault_bike: 'Assault Bike',

  // === ALONGAMENTO (Stretching) ===
  standing_hamstring_stretch: 'Alongamento de Posterior em Pé',
  quad_stretch: 'Alongamento de Quadríceps',
  chest_stretch: 'Alongamento de Peito',
  shoulder_stretch: 'Alongamento de Ombros',
  cat_cow: 'Gato-Vaca',
  childs_pose: "Postura da Criança (Child's Pose)",
  downward_dog: 'Cachorro Olhando para Baixo',
  pigeon_pose: 'Postura do Pombo',
};

// ============================
// ALIASES PARA MATCHING
// ============================

export const ALIASES = {
  // Peito
  barbell_bench_press: [
    'supino reto', 'bench press', 'supino reto com barra',
    'supino plano', 'flat bench press', 'supino',
  ],
  incline_barbell_bench_press: [
    'supino inclinado', 'incline bench press', 'supino inclinado barra',
  ],
  decline_barbell_bench_press: [
    'supino declinado', 'decline bench press', 'supino declinado barra',
  ],
  dumbbell_bench_press: [
    'supino com halteres', 'supino halter', 'dumbbell press',
  ],
  dumbbell_flyes: [
    'crucifixo', 'fly', 'flyes', 'crucifixo reto',
  ],
  cable_crossover: [
    'crossover', 'cable cross', 'cruzamento de cabos',
  ],
  push_ups: [
    'flexão', 'push up', 'pushup', 'flexão de braço',
  ],

  // Costas
  barbell_squat: [
    'agachamento livre', 'agachamento com barra', 'back squat',
    'squat', 'agachamento',
  ],
  pull_ups: [
    'barra fixa', 'pullup', 'pull up', 'puxada na barra',
    'barra fixa pronada',
  ],
  chin_ups: [
    'barra supinada', 'chin up', 'chinup', 'barra fixa supinada',
  ],
  lat_pulldown: [
    'puxada alta', 'pulldown', 'puxada frente',
    'puxada na polia', 'puxada costas',
  ],
  seated_cable_row: [
    'remada sentado', 'cable row', 'remada no cabo sentado',
  ],
  barbell_row: [
    'remada curvada', 'barbell row', 'bent over row',
    'remada com barra',
  ],
  t_bar_row: [
    'remada cavalinho', 't-bar', 'tbar row',
  ],
  barbell_deadlift: [
    'levantamento terra', 'deadlift', 'terra',
    'levantamento terra convencional',
  ],

  // Ombros
  overhead_press: [
    'desenvolvimento', 'ohp', 'press militar',
    'desenvolvimento com barra',
  ],
  dumbbell_shoulder_press: [
    'desenvolvimento com halteres', 'shoulder press',
    'desenvolvimento halter',
  ],
  lateral_raise: [
    'elevação lateral', 'lateral', 'lateral raise',
  ],
  front_raise: [
    'elevação frontal', 'front raise', 'frontal',
  ],
  face_pull: [
    'face pull', 'facepull', 'puxada facial',
  ],
  shrugs: [
    'encolhimento', 'shrug', 'encolhimento de ombros',
  ],

  // Bíceps
  barbell_curl: [
    'rosca direta', 'rosca com barra', 'bicep curl barra',
  ],
  dumbbell_curl: [
    'rosca com halteres', 'rosca alternada', 'bicep curl',
  ],
  hammer_curl: [
    'rosca martelo', 'hammer', 'martelo',
  ],
  preacher_curl: [
    'rosca scott', 'scott curl', 'preacher',
  ],

  // Tríceps
  tricep_pushdown: [
    'tríceps polia', 'pushdown', 'triceps polia alta',
    'tríceps na polia',
  ],
  skull_crushers: [
    'tríceps testa', 'skull crusher', 'testa',
  ],
  dips: [
    'mergulho', 'paralelas', 'dip', 'mergulho em paralelas',
  ],

  // Pernas
  leg_press: [
    'leg press', 'prensa', 'prensa de pernas',
  ],
  leg_extension: [
    'cadeira extensora', 'extensora', 'leg extension',
  ],
  leg_curl: [
    'mesa flexora', 'flexora', 'leg curl',
  ],
  romanian_deadlift: [
    'terra romeno', 'rdl', 'romeno', 'stiff romeno',
  ],
  hip_thrust: [
    'hip thrust', 'elevação pélvica', 'thrust',
  ],
  bulgarian_split_squat: [
    'agachamento búlgaro', 'bulgaro', 'split squat',
  ],
  lunges: [
    'avanço', 'lunge', 'afundo', 'passada',
  ],
  front_squat: [
    'agachamento frontal', 'front squat', 'frontal',
  ],

  // Core
  plank: [
    'prancha', 'plank', 'prancha frontal',
  ],
  crunches: [
    'abdominal', 'crunch', 'abdominal crunch',
  ],
  hanging_leg_raise: [
    'elevação de pernas', 'leg raise pendurado', 'pernas pendurado',
  ],
  russian_twist: [
    'torção russa', 'russian twist', 'rotação russa',
  ],

  // Panturrilha
  calf_raise: [
    'panturrilha', 'elevação de panturrilha', 'calf raise',
  ],

  // Cardio
  burpees: [
    'burpee', 'burpees',
  ],
  jumping_jacks: [
    'polichinelo', 'jumping jack',
  ],
};

// ============================
// MAPEAMENTO DE CATEGORIAS
// ============================

export const MUSCLE_TO_CATEGORY = {
  chest: 'chest',
  pectoralis: 'chest',
  lats: 'back',
  'middle back': 'back',
  'lower back': 'back',
  traps: 'back',
  shoulders: 'shoulders',
  deltoids: 'shoulders',
  biceps: 'biceps',
  triceps: 'triceps',
  forearms: 'forearms',
  abdominals: 'core',
  obliques: 'core',
  quadriceps: 'quadriceps',
  hamstrings: 'hamstrings',
  glutes: 'glutes',
  calves: 'calves',
  adductors: 'quadriceps',
  abductors: 'glutes',
};
