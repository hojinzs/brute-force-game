export const SFX_PRESETS = {
  wrongAnswer: [1.2, , 570, , 0.06, 0.19, 1, 2.3, , , 281, 0.06, 0.06, , , 0.1, , 0.56, 0.01],
  invalidChar: [0.6, , 320, , 0.02, 0.08, 1, 1.2, , , -50, 0.01, , , , , 0.2, 0.01],
  topAttempt: [0.9, , 597, , 0.02, 0.28, , 3.4, , -146, , , 0.05, , , , , 0.76, 0.02, , -1395],
} as const;

export type SfxPresetKey = keyof typeof SFX_PRESETS;
