/**
 * Short synthesised sounds: the door, an Advent gate, the toy machine, a
 * growling guitar riff, a drum fill, a spooky organ chord and the sleigh bells
 * - oscillators and filtered noise only, every tune made up for this game,
 * all of it quiet. Minigames bring their own recipes.
 *
 * @module
 */
import type { SoundId } from "@/games/weihnachtsmann/engine/types";

/** A tiny sound player. */
export type SoundPlayer = {
  /** Plays a sound, once audio is unlocked. */
  play(sound: SoundId): void;
  /** Plays a sound made up by the caller, such as a minigame's own. */
  playRecipe(recipe: Recipe): void;
  /** Unlocks audio - must be called from a click, key press or touch. */
  resume(): void;
};

/**
 * One tone: wave, start and end pitch in Hz, length and delay in seconds,
 * loudness relative to the others.
 */
export type Tone = readonly [
  OscillatorType,
  number,
  number,
  number,
  number,
  number,
];

/** A burst of noise: length and delay in seconds, filter pitch in Hz, loudness. */
export type Noise = readonly [number, number, number, number];

/** What one sound is made of. */
export type Recipe = {
  readonly tones?: readonly Tone[];
  readonly noise?: readonly Noise[];
  /** Run the tones through a growling distortion, like an amplifier. */
  readonly drive?: boolean;
};

/** Overall loudness - kept low, these are little touches. */
const MASTER_GAIN = 0.09;

/** Fade-out floor - an exponential ramp cannot reach zero. */
const SILENCE = 0.0001;

/** Steepness of the distortion curve and its number of points. */
const DRIVE = 18;
const CURVE_POINTS = 512;

/** Top of the low-pass behind the distortion, Hz. */
const DRIVE_TONE = 2400;

/** Loudness after the distortion, which itself pushes everything up. */
const DRIVE_LEVEL = 0.1;

/* eslint-disable @typescript-eslint/no-magic-numbers -- the recipes: pitches
   in Hz, times in seconds, loudness shares */
/** A power chord: root and fifth, as one distorted note. */
function power(root: number, length: number, delay: number): Tone[] {
  return [
    ["sawtooth", root, root, length, delay, 0.6],
    ["sawtooth", root * 1.5, root * 1.5, length, delay, 0.45],
    ["square", root / 2, root / 2, length, delay, 0.3],
  ];
}

/** Sleigh bells: quick bright jingles. */
function bells(count: number, from: number): Noise[] {
  return Array.from(
    { length: count },
    (_, k) => [0.07, from + k * 0.09, 7200, 0.5] as const,
  );
}

/** Every sound. */
const RECIPES: Readonly<Record<SoundId, Recipe>> = {
  door: {
    noise: [[0.12, 0, 700, 0.6]],
    tones: [
      ["triangle", 320, 210, 0.16, 0, 0.7],
      ["triangle", 240, 160, 0.12, 0.14, 0.5],
    ],
  },
  gate: {
    noise: [[0.14, 0, 900, 0.5], ...bells(4, 0.12)],
    tones: [
      ["triangle", 300, 220, 0.14, 0, 0.6],
      ["sine", 784, 784, 0.12, 0.1, 0.5],
      ["sine", 1047, 1047, 0.12, 0.2, 0.5],
      ["sine", 1319, 1319, 0.3, 0.3, 0.5],
    ],
  },
  toy: {
    noise: [[0.18, 0, 1600, 0.5]],
    tones: [
      ["triangle", 660, 660, 0.08, 0.05, 0.8],
      ["triangle", 880, 880, 0.08, 0.13, 0.8],
      ["triangle", 1320, 1320, 0.16, 0.21, 0.8],
      ["sine", 1760, 2640, 0.2, 0.3, 0.4],
    ],
  },
  riff: {
    drive: true,
    tones: [
      ...power(82.4, 0.14, 0),
      ...power(82.4, 0.1, 0.16),
      ...power(98, 0.14, 0.28),
      ...power(82.4, 0.1, 0.44),
      ...power(110, 0.14, 0.56),
      ...power(103.8, 0.12, 0.72),
      ...power(98, 0.4, 0.86),
    ],
  },
  drums: {
    tones: [
      ["sine", 150, 45, 0.16, 0, 1],
      ["sine", 150, 45, 0.16, 0.3, 1],
      ["sine", 150, 45, 0.16, 0.45, 1],
      ["triangle", 220, 140, 0.1, 0.6, 0.7],
      ["triangle", 180, 110, 0.1, 0.68, 0.7],
    ],
    noise: [
      [0.1, 0.15, 1900, 0.9],
      [0.1, 0.38, 1900, 0.9],
      [0.6, 0.78, 6500, 0.6],
    ],
  },
  organ: {
    tones: [
      ["sine", 146.8, 146.8, 1.3, 0, 0.5],
      ["triangle", 174.6, 174.6, 1.3, 0, 0.4],
      ["sine", 220, 220, 1.3, 0, 0.4],
      ["triangle", 293.7, 293.7, 1.3, 0, 0.3],
      ["sine", 73.4, 73.4, 1.4, 0, 0.5],
      ["sine", 277.2, 277.2, 0.9, 0.5, 0.25],
    ],
  },
  sleighStart: {
    noise: [...bells(10, 0), [0.6, 0, 500, 0.3]],
    tones: [
      ["sine", 300, 900, 0.7, 0.1, 0.5],
      ["triangle", 784, 784, 0.12, 0.2, 0.4],
      ["triangle", 988, 988, 0.12, 0.32, 0.4],
      ["triangle", 1175, 1175, 0.2, 0.44, 0.4],
    ],
  },
  sleighLand: {
    noise: [...bells(6, 0), [0.25, 0, 300, 0.6]],
    tones: [["triangle", 160, 90, 0.18, 0, 0.6]],
  },
};
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * Creates the sound player. Nothing plays until {@link SoundPlayer.resume}.
 *
 * @returns the player
 */
export function createSoundPlayer(): SoundPlayer {
  let ctx: AudioContext | null = null;
  let noise: AudioBuffer | null = null;
  let curve: Float32Array<ArrayBuffer> | null = null;

  const resume = (): void => {
    if (ctx === null && typeof AudioContext !== "undefined") {
      ctx = new AudioContext();
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
      curve = driveCurve();
    }
    void ctx?.resume();
  };

  const playRecipe = (recipe: Recipe): void => {
    if (ctx !== null && ctx.state === "running") {
      const now = ctx.currentTime;
      let out: AudioNode = ctx.destination;
      if (recipe.drive === true && curve !== null) {
        const shaper = ctx.createWaveShaper();
        shaper.curve = curve;
        const tone = ctx.createBiquadFilter();
        tone.type = "lowpass";
        tone.frequency.value = DRIVE_TONE;
        const level = ctx.createGain();
        level.gain.value = DRIVE_LEVEL;
        shaper.connect(tone).connect(level).connect(ctx.destination);
        out = shaper;
      }
      for (const part of recipe.tones ?? []) {
        playTone(ctx, out, part, now);
      }
      for (const part of recipe.noise ?? []) {
        if (noise !== null) {
          playNoise(ctx, noise, part, now);
        }
      }
    }
  };

  const play = (sound: SoundId): void => {
    playRecipe(RECIPES[sound]);
  };

  return { play, playRecipe, resume };
}

/** A soft-clipping curve: loud parts flatten out into a growl. */
function driveCurve(): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(CURVE_POINTS);
  for (let i = 0; i < CURVE_POINTS; i += 1) {
    const x = (i / (CURVE_POINTS - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * DRIVE);
  }
  return curve;
}

/** One oscillator note with a quick fade. */
function playTone(
  ctx: AudioContext,
  out: AudioNode,
  tone: Tone,
  now: number,
): void {
  const [wave, from, to, length, delay, loud] = tone;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(from, now + delay);
  osc.frequency.exponentialRampToValueAtTime(
    Math.max(1, to),
    now + delay + length,
  );
  gain.gain.setValueAtTime(MASTER_GAIN * loud, now + delay);
  gain.gain.exponentialRampToValueAtTime(SILENCE, now + delay + length);
  osc.connect(gain).connect(out);
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
  const [length, delay, pitch, loud] = noise;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = pitch;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(MASTER_GAIN * loud, now + delay);
  gain.gain.exponentialRampToValueAtTime(SILENCE, now + delay + length);
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(now + delay);
  source.stop(now + delay + length);
}
