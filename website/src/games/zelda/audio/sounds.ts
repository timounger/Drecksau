/**
 * Little synthesised blips for sword swings, hits, rupees, chests, doors,
 * the find jingle and the rest - no recorded audio, just oscillators and a
 * burst of noise. Every melody is made up for this game.
 *
 * @module
 */
import type { GameEvent } from "@/games/zelda/engine/types";

/** A tiny sound player. */
export type SoundPlayer = {
  /** Plays what belongs to an event, unless muted. */
  play(event: GameEvent): void;
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
const MASTER_GAIN = 0.16;

/** Loudness of a noise burst relative to a tone. */
const NOISE_GAIN = 0.7;

/** Fade-out floor - an exponential ramp cannot reach zero. */
const SILENCE = 0.0001;

/* eslint-disable @typescript-eslint/no-magic-numbers -- the sound recipes:
   pitches in Hz and times in seconds. */
const RECIPES: Partial<Record<GameEvent, Recipe>> = {
  swing: { noise: [0.09, 2600, 0], tones: [["triangle", 900, 300, 0.08, 0]] },
  spin: { noise: [0.3, 1800, 0], tones: [["sawtooth", 300, 1200, 0.3, 0]] },
  charged: {
    tones: [
      ["square", 1200, 1200, 0.05, 0],
      ["square", 1600, 1600, 0.06, 0.06],
    ],
  },
  hit: { tones: [["square", 320, 90, 0.1, 0]], noise: [0.05, 900, 0] },
  kill: { tones: [["square", 500, 60, 0.18, 0]], noise: [0.16, 600, 0.02] },
  hurt: { tones: [["sawtooth", 260, 80, 0.2, 0]] },
  rupee: {
    tones: [
      ["square", 1320, 1320, 0.05, 0],
      ["square", 1760, 1760, 0.08, 0.05],
    ],
  },
  heart: {
    tones: [
      ["triangle", 660, 660, 0.06, 0],
      ["triangle", 880, 880, 0.06, 0.06],
      ["triangle", 1100, 1100, 0.1, 0.12],
    ],
  },
  item: {
    tones: [
      ["square", 880, 880, 0.06, 0],
      ["square", 1175, 1175, 0.08, 0.06],
    ],
  },
  bombPlace: { tones: [["triangle", 220, 180, 0.08, 0]] },
  explode: { noise: [0.55, 400, 0], tones: [["sine", 120, 30, 0.5, 0]] },
  arrow: { noise: [0.12, 3800, 0], tones: [["sine", 1400, 700, 0.12, 0]] },
  boomerang: {
    tones: [
      ["triangle", 500, 900, 0.12, 0],
      ["triangle", 900, 500, 0.12, 0.12],
    ],
  },
  cut: { noise: [0.1, 3200, 0] },
  block: {
    tones: [
      ["square", 1800, 1500, 0.07, 0],
      ["triangle", 2400, 2000, 0.1, 0.02],
    ],
  },
  container: {
    tones: [
      ["square", 523, 523, 0.12, 0],
      ["square", 659, 659, 0.12, 0.12],
      ["square", 784, 784, 0.12, 0.24],
      ["square", 1047, 1047, 0.3, 0.36],
    ],
  },
  menu: { tones: [["square", 990, 990, 0.04, 0]] },
  text: { tones: [["square", 1400, 1400, 0.025, 0]] },
  die: {
    tones: [
      ["triangle", 600, 500, 0.2, 0],
      ["triangle", 450, 350, 0.2, 0.22],
      ["triangle", 300, 120, 0.5, 0.44],
    ],
  },
  roll: { noise: [0.14, 900, 0] },
  dash: { noise: [0.2, 700, 0], tones: [["sawtooth", 180, 360, 0.18, 0]] },
  hop: { tones: [["square", 400, 900, 0.12, 0]] },
  splash: { noise: [0.3, 1400, 0], tones: [["sine", 500, 150, 0.25, 0]] },
  land: { noise: [0.1, 600, 0], tones: [["triangle", 140, 90, 0.08, 0]] },
  stroke: { noise: [0.12, 1100, 0], tones: [["sine", 320, 220, 0.1, 0]] },
  hookshot: {
    noise: [0.08, 4200, 0],
    tones: [["square", 1300, 1100, 0.1, 0]],
  },
  dig: { noise: [0.12, 500, 0], tones: [["triangle", 160, 110, 0.1, 0]] },
  fire: { noise: [0.25, 1600, 0], tones: [["sawtooth", 220, 110, 0.2, 0]] },
  drink: {
    tones: [
      ["sine", 500, 700, 0.1, 0],
      ["sine", 600, 800, 0.1, 0.12],
      ["triangle", 880, 1320, 0.2, 0.24],
    ],
  },
  save: {
    tones: [
      ["square", 784, 784, 0.08, 0],
      ["square", 988, 988, 0.08, 0.08],
      ["square", 1175, 1175, 0.16, 0.16],
    ],
  },
  secret: {
    tones: [
      ["square", 784, 784, 0.1, 0],
      ["square", 740, 740, 0.1, 0.1],
      ["square", 622, 622, 0.1, 0.2],
      ["square", 440, 440, 0.1, 0.3],
      ["square", 415, 415, 0.1, 0.4],
      ["square", 659, 659, 0.1, 0.5],
      ["square", 831, 831, 0.1, 0.6],
      ["square", 1047, 1047, 0.25, 0.7],
    ],
  },
  type: { tones: [["square", 1700, 1700, 0.012, 0]] },
  fanfare: {
    tones: [
      ["square", 392, 392, 0.1, 0],
      ["square", 523, 523, 0.1, 0.1],
      ["square", 659, 659, 0.1, 0.2],
      ["square", 784, 784, 0.12, 0.3],
      ["square", 1047, 1047, 0.5, 0.44],
      ["triangle", 523, 523, 0.5, 0.44],
    ],
  },
  smallItem: {
    tones: [
      ["square", 784, 784, 0.07, 0],
      ["square", 1175, 1175, 0.07, 0.08],
      ["square", 1568, 1568, 0.16, 0.16],
    ],
  },
  key: {
    tones: [
      ["square", 1319, 1319, 0.05, 0],
      ["square", 1568, 1568, 0.08, 0.05],
    ],
  },
  chest: { noise: [0.25, 500, 0], tones: [["triangle", 180, 320, 0.25, 0]] },
  door: { noise: [0.2, 600, 0], tones: [["square", 220, 110, 0.18, 0]] },
  shutter: { noise: [0.3, 1500, 0], tones: [["sawtooth", 320, 140, 0.28, 0]] },
  switch: {
    tones: [
      ["square", 600, 600, 0.04, 0],
      ["square", 900, 900, 0.08, 0.05],
    ],
  },
  torch: { noise: [0.35, 900, 0], tones: [["sine", 200, 520, 0.3, 0]] },
  push: { noise: [0.3, 250, 0] },
  shrink: {
    tones: [
      ["triangle", 1600, 400, 0.6, 0],
      ["sine", 2400, 1200, 0.3, 0.1],
    ],
  },
  grow: {
    tones: [
      ["triangle", 400, 1600, 0.6, 0],
      ["sine", 1200, 2400, 0.3, 0.2],
    ],
  },
  bossHit: { tones: [["square", 220, 60, 0.22, 0]], noise: [0.12, 700, 0] },
  bossDie: {
    noise: [1.1, 300, 0],
    tones: [
      ["sine", 160, 30, 1.0, 0],
      ["square", 392, 392, 0.15, 0.9],
      ["square", 523, 523, 0.15, 1.05],
      ["square", 784, 784, 0.4, 1.2],
    ],
  },
  slam: { noise: [0.45, 200, 0], tones: [["sine", 90, 28, 0.45, 0]] },
  buy: {
    tones: [
      ["square", 1047, 1047, 0.05, 0],
      ["square", 1319, 1319, 0.05, 0.06],
      ["square", 1760, 1760, 0.1, 0.12],
    ],
  },
  error: {
    tones: [
      ["square", 180, 180, 0.12, 0],
      ["square", 160, 160, 0.16, 0.14],
    ],
  },
  lift: { tones: [["triangle", 160, 280, 0.14, 0]] },
  throw: { noise: [0.16, 1500, 0], tones: [["triangle", 400, 200, 0.12, 0]] },
  stairs: {
    tones: [
      ["triangle", 660, 660, 0.06, 0],
      ["triangle", 550, 550, 0.06, 0.08],
      ["triangle", 440, 440, 0.06, 0.16],
      ["triangle", 330, 330, 0.1, 0.24],
    ],
  },
  victory: {
    tones: [
      ["square", 523, 523, 0.15, 0],
      ["square", 523, 523, 0.15, 0.16],
      ["square", 523, 523, 0.15, 0.32],
      ["square", 698, 698, 0.5, 0.48],
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

  const play = (event: GameEvent): void => {
    const recipe = RECIPES[event];
    if (
      !silent &&
      ctx !== null &&
      recipe !== undefined &&
      ctx.state === "running"
    ) {
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
