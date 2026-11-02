/**
 * Short synthesised sounds: the door, an Advent gate, the toy machine, a
 * growling guitar riff, a drum fill, a spooky organ chord, the sleigh bells,
 * and for the abilities a wish chime, a magic shimmer, the telescope's
 * zoom and a thud; a jetski starting, its horn and the hum of its motor -
 * oscillators and filtered noise only, every tune made up for this game,
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
  /**
   * Sets the hum of a jetski's motor: 0 is silent, 1 full speed - pitch and
   * loudness follow. Call it every frame; 0 when nobody rides or the page
   * hides.
   */
  motor(level: number): void;
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
  wish: {
    noise: bells(3, 0.05),
    tones: [
      ["sine", 1047, 1047, 0.35, 0, 0.5],
      ["sine", 1319, 1319, 0.35, 0.12, 0.5],
      ["sine", 1568, 1568, 0.35, 0.24, 0.5],
      ["sine", 2093, 2093, 0.7, 0.36, 0.45],
      ["triangle", 523, 523, 0.9, 0, 0.25],
    ],
  },
  magic: {
    noise: [[0.5, 0, 5200, 0.25]],
    tones: [
      ["sine", 500, 1600, 0.6, 0, 0.45],
      ["triangle", 1175, 1175, 0.12, 0.3, 0.35],
      ["triangle", 1480, 1480, 0.12, 0.4, 0.35],
      ["triangle", 1760, 1760, 0.3, 0.5, 0.35],
    ],
  },
  spyglass: {
    noise: [[0.05, 0, 2400, 0.5]],
    tones: [
      ["triangle", 380, 760, 0.3, 0.02, 0.5],
      ["triangle", 760, 380, 0.25, 4.9, 0.4],
    ],
  },
  thud: {
    noise: [[0.22, 0, 260, 1]],
    tones: [
      ["sine", 130, 38, 0.3, 0, 1],
      ["triangle", 90, 50, 0.2, 0.02, 0.6],
    ],
  },
  // A bright little fanfare with bells: an achievement unlocked.
  achievement: {
    noise: bells(4, 0.36),
    tones: [
      ["square", 659, 659, 0.1, 0, 0.35],
      ["square", 784, 784, 0.1, 0.1, 0.35],
      ["square", 988, 988, 0.1, 0.2, 0.35],
      ["triangle", 1319, 1319, 0.45, 0.3, 0.5],
      ["triangle", 659, 659, 0.45, 0.3, 0.3],
      ["sine", 1976, 1976, 0.3, 0.42, 0.25],
    ],
  },
  // Metal giving way: a bang, a falling whine and a boing.
  crash: {
    noise: [
      [0.35, 0, 900, 1],
      [0.2, 0.25, 3200, 0.5],
    ],
    tones: [
      ["sawtooth", 220, 55, 0.5, 0, 0.5],
      ["square", 140, 70, 0.2, 0.05, 0.4],
      ["sine", 300, 900, 0.18, 0.5, 0.35],
      ["sine", 900, 400, 0.25, 0.68, 0.3],
    ],
  },
  // A few hammer clinks.
  repair: {
    noise: [
      [0.04, 0, 5000, 0.6],
      [0.04, 0.3, 5000, 0.6],
      [0.04, 0.6, 5000, 0.6],
      [0.04, 0.9, 5000, 0.6],
    ],
    tones: [
      ["triangle", 1800, 1700, 0.08, 0, 0.4],
      ["triangle", 2000, 1900, 0.08, 0.3, 0.4],
      ["triangle", 1800, 1700, 0.08, 0.6, 0.4],
      ["triangle", 2200, 2100, 0.1, 0.9, 0.4],
    ],
  },
  // The click of a lamp switch.
  lamp: {
    noise: [[0.03, 0, 3000, 0.7]],
    tones: [["square", 900, 600, 0.04, 0, 0.3]],
  },
  // A splash and a happy blip.
  splash: {
    noise: [[0.3, 0, 1400, 0.8]],
    tones: [
      ["sine", 400, 1200, 0.12, 0.02, 0.4],
      ["triangle", 988, 988, 0.1, 0.2, 0.4],
      ["triangle", 1319, 1319, 0.2, 0.3, 0.4],
    ],
  },
  // A bright chime: something picked up.
  collect: {
    tones: [
      ["sine", 1175, 1175, 0.12, 0, 0.5],
      ["sine", 1568, 1568, 0.12, 0.08, 0.5],
      ["sine", 2349, 2349, 0.3, 0.16, 0.45],
    ],
  },
  // Three crunchy bites.
  munch: {
    noise: [
      [0.06, 0, 900, 0.7],
      [0.06, 0.14, 1000, 0.6],
      [0.06, 0.28, 850, 0.6],
    ],
  },
  // Paper rustling.
  paper: {
    noise: [
      [0.05, 0, 5200, 0.5],
      [0.08, 0.06, 4200, 0.4],
    ],
  },
  // The oven's bell: done!
  ding: {
    tones: [
      ["sine", 1760, 1760, 0.5, 0, 0.5],
      ["sine", 2637, 2637, 0.4, 0, 0.2],
    ],
  },
  // A sleepy yawn sliding down.
  carousel: {
    // A little music box waltz, made up for the market.
    tones: [
      ["sine", 1047, 1047, 0.22, 0, 0.5],
      ["sine", 1319, 1319, 0.22, 0.25, 0.4],
      ["sine", 1568, 1568, 0.22, 0.5, 0.4],
      ["sine", 1397, 1397, 0.22, 0.75, 0.45],
      ["sine", 1175, 1175, 0.22, 1, 0.4],
      ["sine", 1319, 1319, 0.35, 1.25, 0.45],
      ["triangle", 262, 262, 0.2, 0, 0.3],
      ["triangle", 392, 392, 0.2, 0.5, 0.25],
      ["triangle", 349, 349, 0.2, 0.75, 0.25],
      ["triangle", 262, 262, 0.3, 1.25, 0.3],
    ],
  },
  throw: {
    noise: [[0.12, 0, 2400, 0.5]],
  },
  hit: {
    noise: [[0.1, 0, 900, 0.8]],
    tones: [["triangle", 220, 120, 0.1, 0, 0.5]],
  },
  chop: {
    noise: [
      [0.05, 0, 1800, 0.8],
      [0.05, 0.22, 1800, 0.8],
      [0.2, 0.44, 600, 0.6],
    ],
    tones: [
      ["square", 180, 140, 0.05, 0, 0.3],
      ["square", 180, 140, 0.05, 0.22, 0.3],
    ],
  },
  bell: {
    tones: [
      ["sine", 1760, 1760, 0.5, 0, 0.6],
      ["sine", 2637, 2637, 0.4, 0, 0.3],
      ["sine", 2093, 2093, 0.6, 0.12, 0.5],
      ["sine", 3136, 3136, 0.5, 0.12, 0.25],
    ],
  },
  iceBreak: {
    noise: [
      [0.3, 0, 5000, 0.9],
      [0.2, 0.08, 3000, 0.6],
    ],
    tones: [
      ["sine", 2400, 1200, 0.2, 0, 0.3],
      ["sine", 3200, 1800, 0.25, 0.1, 0.25],
    ],
  },
  owl: {
    tones: [
      ["sine", 392, 370, 0.25, 0, 0.6],
      ["sine", 392, 349, 0.4, 0.35, 0.6],
    ],
  },
  whoosh: {
    noise: [[0.5, 0, 1400, 0.6]],
    tones: [["sine", 300, 600, 0.4, 0, 0.2]],
  },
  snore: {
    tones: [["triangle", 330, 160, 0.6, 0, 0.4]],
    noise: [[0.4, 0.1, 500, 0.3]],
  },
  jetskiStart: {
    noise: [[0.35, 0, 300, 0.5]],
    tones: [
      ["sawtooth", 55, 90, 0.18, 0, 0.35],
      ["sawtooth", 70, 150, 0.35, 0.16, 0.35],
      ["square", 35, 60, 0.4, 0.1, 0.2],
    ],
  },
  horn: {
    tones: [
      ["square", 415, 415, 0.14, 0, 0.35],
      ["square", 523, 523, 0.14, 0, 0.25],
      ["square", 415, 415, 0.22, 0.2, 0.35],
      ["square", 523, 523, 0.22, 0.2, 0.25],
    ],
  },
};

/** The motor's hum: lowest and highest pitch, Hz, and loudness at full speed. */
const MOTOR_LOW = 48;
const MOTOR_HIGH = 120;
const MOTOR_GAIN = 0.35;

/** Top of the low-pass that keeps the motor soft, Hz. */
const MOTOR_TONE = 700;

/** How quickly the motor's pitch and loudness follow, seconds. */
const MOTOR_EASE = 0.08;

/** A second voice a little off the first, for a rough motor. */
const MOTOR_DETUNE = 1.5;
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

  let hum: Motor | null = null;
  const motor = (level: number): void => {
    if (ctx !== null && ctx.state === "running") {
      if (hum === null && level > 0) {
        hum = startMotor(ctx);
      }
      if (hum !== null) {
        const now = ctx.currentTime;
        const pitch = MOTOR_LOW + (MOTOR_HIGH - MOTOR_LOW) * level;
        hum.low.frequency.setTargetAtTime(pitch, now, MOTOR_EASE);
        hum.rough.frequency.setTargetAtTime(
          pitch * MOTOR_DETUNE,
          now,
          MOTOR_EASE,
        );
        hum.gain.gain.setTargetAtTime(
          MASTER_GAIN * MOTOR_GAIN * level,
          now,
          MOTOR_EASE,
        );
      }
    }
  };

  return { play, playRecipe, resume, motor };
}

/** The motor's running oscillators and its volume. */
type Motor = {
  readonly low: OscillatorNode;
  readonly rough: OscillatorNode;
  readonly gain: GainNode;
};

/** Starts the motor's hum, silent until {@link SoundPlayer.motor} turns it up. */
function startMotor(ctx: AudioContext): Motor {
  const low = ctx.createOscillator();
  const rough = ctx.createOscillator();
  low.type = "sawtooth";
  rough.type = "square";
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = MOTOR_TONE;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  low.connect(tone);
  rough.connect(tone);
  tone.connect(gain).connect(ctx.destination);
  low.start();
  rough.start();
  return { low, rough, gain };
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
