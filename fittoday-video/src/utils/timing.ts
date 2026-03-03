export const FPS = 30;

// Duracao de cada video em frames
export const VIDEO_DURATIONS = {
  "01-Intro": 1350,       // 45s
  "02-Dashboard": 1500,   // 50s
  "03-Treinos": 1800,     // 60s
  "04-Alunos": 1500,      // 50s
  "05-Mensagens": 1200,   // 40s
  "06-Analytics": 1500,   // 50s
  "07-Financeiro": 1500,  // 50s
  "08-Configuracoes": 1350, // 45s
  "09-Outro": 1200,       // 40s
} as const;

// Duracao total (com transicoes de 30 frames entre cada)
export const MASTER_DURATION = Object.values(VIDEO_DURATIONS).reduce(
  (acc, d) => acc + d,
  0
); // 12900 frames = 7min 10s

// Helpers
export const secondsToFrames = (s: number) => Math.round(s * FPS);
export const framesToSeconds = (f: number) => f / FPS;

// Duracao padrao de transicoes
export const TRANSITION_FRAMES = 20;
export const FADE_FRAMES = 15;
export const SCENE_GAP = 30; // 1 segundo entre cenas

// Timing de anotacoes (padrao por cena)
export const ANNOTATION_TIMING = {
  enterDelay: 30,    // aparece 1s apos a cena
  holdDuration: 60,  // fica visivel por 2s
  exitDuration: 15,  // fade out em 0.5s
};
