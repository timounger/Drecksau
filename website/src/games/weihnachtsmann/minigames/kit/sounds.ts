/**
 * The sounds every minigame may use: catching, hitting, missing, a tick, the
 * count-down, winning and losing - short and quiet, made up for this game.
 *
 * @module
 * @remarks
 * A minigame plays them with `env.sound("pop")`. Sounds of its own are
 * {@link Recipe}s in its own folder, played with `env.sound(recipe)`.
 */
import type { Recipe } from "@/games/weihnachtsmann/audio/sounds";

/** The shared minigame sounds. */
export type MiniSoundId =
  | "click"
  | "tick"
  | "count"
  | "go"
  | "pop"
  | "coin"
  | "hit"
  | "splat"
  | "miss"
  | "bump"
  | "jump"
  | "whoosh"
  | "win"
  | "lose"
  | "fanfare"
  | "firework";

/* eslint-disable @typescript-eslint/no-magic-numbers -- the recipes: pitches
   in Hz, times in seconds, loudness shares */
/** Every shared sound. */
export const MINI_SOUNDS: Readonly<Record<MiniSoundId, Recipe>> = {
  click: { tones: [["square", 900, 700, 0.04, 0, 0.35]] },
  tick: { tones: [["sine", 1400, 1400, 0.05, 0, 0.4]] },
  count: { tones: [["triangle", 660, 660, 0.14, 0, 0.7]] },
  go: {
    tones: [
      ["triangle", 990, 990, 0.25, 0, 0.8],
      ["sine", 1320, 1320, 0.25, 0, 0.4],
    ],
  },
  pop: {
    tones: [["sine", 520, 1040, 0.08, 0, 0.8]],
    noise: [[0.04, 0, 2400, 0.3]],
  },
  coin: {
    tones: [
      ["square", 988, 988, 0.06, 0, 0.35],
      ["square", 1319, 1319, 0.16, 0.06, 0.35],
    ],
  },
  hit: {
    tones: [["triangle", 300, 120, 0.12, 0, 0.9]],
    noise: [[0.1, 0, 1200, 0.7]],
  },
  splat: {
    noise: [
      [0.16, 0, 900, 0.9],
      [0.08, 0.04, 3000, 0.4],
    ],
  },
  miss: {
    tones: [
      ["sawtooth", 220, 160, 0.16, 0, 0.35],
      ["sawtooth", 160, 110, 0.2, 0.12, 0.35],
    ],
  },
  bump: {
    tones: [["sine", 140, 60, 0.18, 0, 1]],
    noise: [[0.12, 0, 400, 0.6]],
  },
  jump: { tones: [["square", 300, 700, 0.12, 0, 0.3]] },
  whoosh: { noise: [[0.3, 0, 1800, 0.6]] },
  win: {
    tones: [
      ["triangle", 523, 523, 0.12, 0, 0.7],
      ["triangle", 659, 659, 0.12, 0.12, 0.7],
      ["triangle", 784, 784, 0.12, 0.24, 0.7],
      ["triangle", 1047, 1047, 0.4, 0.36, 0.8],
      ["sine", 1568, 1568, 0.4, 0.36, 0.3],
    ],
    noise: Array.from(
      { length: 6 },
      (_, k) => [0.07, 0.36 + k * 0.08, 7200, 0.4] as const,
    ),
  },
  lose: {
    tones: [
      ["triangle", 392, 392, 0.2, 0, 0.6],
      ["triangle", 370, 370, 0.2, 0.2, 0.6],
      ["triangle", 349, 349, 0.2, 0.4, 0.6],
      ["triangle", 330, 300, 0.5, 0.6, 0.6],
    ],
  },
  fanfare: {
    tones: [
      ["square", 523, 523, 0.14, 0, 0.3],
      ["square", 523, 523, 0.14, 0.16, 0.3],
      ["square", 523, 523, 0.14, 0.32, 0.3],
      ["square", 698, 698, 0.5, 0.48, 0.35],
      ["triangle", 880, 880, 0.5, 0.48, 0.5],
      ["triangle", 1047, 1047, 0.7, 1, 0.6],
      ["sine", 1397, 1397, 0.7, 1, 0.3],
    ],
  },
  firework: {
    tones: [["sine", 400, 1600, 0.35, 0, 0.25]],
    noise: [
      [0.35, 0.35, 700, 0.9],
      [0.5, 0.4, 5000, 0.4],
    ],
  },
};
/* eslint-enable @typescript-eslint/no-magic-numbers */
