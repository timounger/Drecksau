/**
 * Wurfduell's sounds: a swish, a splat, a clang, an "au" and a little fanfare
 * - all synthesised, no recorded audio.
 *
 * @module
 * @remarks
 * Oscillators and a burst of filtered noise, the same way the other action
 * games of the collection make their noise. The browser only lets audio start
 * after a click or a key press, so {@link SoundPlayer.resume} is called from
 * the first one.
 */
import type { ImpactLook } from "@/games/wurfduell/engine/types";

/** Everything that makes a sound. */
export type SoundEvent =
  | ImpactLook
  | "throw"
  | "ouch"
  | "ko"
  | "win"
  | "turn"
  | "pick"
  | "ability"
  | "heal";

/** A tiny sound player. */
export type SoundPlayer = {
  /** Plays an event's sound, unless muted. */
  play(event: SoundEvent): void;
  /** Turns the sound off or on. */
  setMuted(muted: boolean): void;
  /** Unlocks audio - must be called from a click or key press. */
  resume(): void;
};

/** One tone: wave, start and end pitch in Hz, length in seconds, delay. */
type Tone = readonly [OscillatorType, number, number, number, number];

/** A burst of noise: length in seconds, filter pitch in Hz, delay. */
type Noise = readonly [number, number, number];

/** What one event sounds like. */
type Recipe = { readonly tones?: readonly Tone[]; readonly noise?: Noise };

/** Overall loudness. */
const MASTER_GAIN = 0.18;

/** Loudness of a noise burst relative to a tone. */
const NOISE_GAIN = 0.8;

/** Fade-out floor - an exponential ramp cannot reach zero. */
const SILENCE = 0.0001;

/* eslint-disable @typescript-eslint/no-magic-numbers -- the recipes: pitches
   in Hz and times in seconds, all made up for this game */
const RECIPES: Readonly<Record<SoundEvent, Recipe>> = {
  throw: { noise: [0.22, 1800, 0], tones: [["sine", 300, 700, 0.18, 0]] },
  splat: { noise: [0.22, 700, 0], tones: [["sine", 260, 70, 0.18, 0]] },
  shatter: {
    noise: [0.3, 3800, 0],
    tones: [
      ["triangle", 1800, 1400, 0.06, 0],
      ["triangle", 2400, 1900, 0.06, 0.05],
    ],
  },
  puff: { noise: [0.35, 1200, 0] },
  clang: {
    tones: [
      ["square", 980, 900, 0.25, 0],
      ["triangle", 1470, 1350, 0.3, 0],
    ],
  },
  thud: { noise: [0.15, 300, 0], tones: [["sine", 140, 50, 0.2, 0]] },
  ouch: {
    tones: [
      ["sawtooth", 520, 300, 0.12, 0.02],
      ["sawtooth", 360, 180, 0.2, 0.13],
    ],
  },
  ko: {
    tones: [
      ["triangle", 600, 500, 0.18, 0],
      ["triangle", 450, 340, 0.18, 0.2],
      ["triangle", 320, 110, 0.5, 0.4],
    ],
    noise: [0.4, 250, 0.4],
  },
  win: {
    tones: [
      ["square", 523, 523, 0.12, 0],
      ["square", 659, 659, 0.12, 0.13],
      ["square", 784, 784, 0.12, 0.26],
      ["square", 1047, 1047, 0.45, 0.39],
      ["triangle", 523, 523, 0.45, 0.39],
    ],
  },
  turn: {
    tones: [
      ["triangle", 880, 880, 0.06, 0],
      ["triangle", 1175, 1175, 0.09, 0.07],
    ],
  },
  pick: { tones: [["square", 990, 1320, 0.07, 0]] },
  ability: {
    tones: [
      ["triangle", 660, 990, 0.1, 0],
      ["triangle", 990, 1480, 0.14, 0.08],
    ],
    noise: [0.2, 2600, 0],
  },
  heal: {
    tones: [
      ["sine", 520, 780, 0.15, 0],
      ["sine", 780, 1040, 0.2, 0.12],
    ],
  },
};
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * Creates the sound player. Nothing plays until {@link SoundPlayer.resume}.
 *
 * @param muted - whether to start silent
 * @returns the player
 */
export function createSoundPlayer(muted: boolean): SoundPlayer {
  let ctx: AudioContext | null = null;
  let silent = muted;
  let noise: AudioBuffer | null = null;

  const resume = (): void => {
    if (ctx === null && typeof AudioContext !== "undefined") {
      ctx = new AudioContext();
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    void ctx?.resume();
  };

  const play = (event: SoundEvent): void => {
    const recipe = RECIPES[event];
    if (!silent && ctx !== null && ctx.state === "running") {
      const now = ctx.currentTime;
      for (const tone of recipe.tones ?? []) {
        playTone(ctx, tone, now);
      }
      if (recipe.noise !== undefined && noise !== null) {
        playNoise(ctx, noise, recipe.noise, now);
      }
    }
  };

  return {
    play,
    resume,
    setMuted: (value: boolean) => {
      silent = value;
    },
  };
}

/** One oscillator note with a quick fade. */
function playTone(ctx: AudioContext, tone: Tone, now: number): void {
  const [wave, from, to, length, delay] = tone;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(from, now + delay);
  osc.frequency.exponentialRampToValueAtTime(
    Math.max(1, to),
    now + delay + length,
  );
  gain.gain.setValueAtTime(MASTER_GAIN, now + delay);
  gain.gain.exponentialRampToValueAtTime(SILENCE, now + delay + length);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now + delay);
  osc.stop(now + delay + length);
}

/** A filtered burst of noise. */
function playNoise(
  ctx: AudioContext,
  buffer: AudioBuffer,
  noise: Noise,
  now: number,
): void {
  const [length, pitch, delay] = noise;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = pitch;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(MASTER_GAIN * NOISE_GAIN, now + delay);
  gain.gain.exponentialRampToValueAtTime(SILENCE, now + delay + length);
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(now + delay);
  source.stop(now + delay + length);
}
