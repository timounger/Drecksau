/**
 * Frost Fortress's sounds - gunfire, cannon booms, lightning, explosions,
 * the wave horn and the little signals of building - all synthesised.
 *
 * @module
 * @remarks
 * Oscillators and filtered noise, like the other action games of the
 * collection. Every sound has a minimum gap, so twenty machine guns rattle
 * instead of drowning everything. Audio only starts after a click or a key,
 * so {@link SoundPlayer.resume} is called from the first one.
 */
import type { GameEvent } from "@/games/frost-fortress/engine/types";

/** Everything that makes a sound. */
export type SoundId =
  | "mg"
  | "rifle"
  | "sniper"
  | "cannon"
  | "zap"
  | "flame"
  | "explosion"
  | "big"
  | "mine"
  | "slam"
  | "placed"
  | "built"
  | "upgraded"
  | "wave"
  | "boss"
  | "clear"
  | "research"
  | "news"
  | "alarm"
  | "collect"
  | "denied"
  | "click"
  | "over";

/** A tiny sound player. */
export type SoundPlayer = {
  /** Plays the sounds of some game events. */
  play(events: readonly GameEvent[]): void;
  /** Plays one sound. */
  cue(id: SoundId): void;
  /** Turns the sound off or on. */
  setMuted(muted: boolean): void;
  /** Unlocks audio - must be called from a click or key press. */
  resume(): void;
};

/** One tone: wave, start and end pitch in Hz, length in seconds, delay. */
type Tone = readonly [OscillatorType, number, number, number, number];

/** A burst of noise: length in seconds, filter pitch in Hz, delay. */
type Noise = readonly [number, number, number];

/** What one sound is, how loud, and how often it may play. */
type Recipe = {
  readonly tones?: readonly Tone[];
  readonly noise?: Noise;
  readonly gain: number;
  /** Seconds between two plays at least. */
  readonly gap: number;
};

/** Overall loudness. */
const MASTER_GAIN = 0.16;

/** Seconds into the noise buffer a burst may start, so bursts differ. */
const NOISE_SPREAD = 0.5;

/** Fade-out floor - an exponential ramp cannot reach zero. */
const SILENCE = 0.0001;

/* eslint-disable @typescript-eslint/no-magic-numbers -- the recipes */
const RECIPES: Readonly<Record<SoundId, Recipe>> = {
  mg: { noise: [0.05, 2600, 0], gain: 0.35, gap: 0.07 },
  rifle: { noise: [0.06, 1800, 0], gain: 0.25, gap: 0.12 },
  sniper: {
    noise: [0.18, 3200, 0],
    tones: [["square", 900, 200, 0.12, 0]],
    gain: 0.5,
    gap: 0.2,
  },
  cannon: {
    noise: [0.35, 380, 0],
    tones: [["sine", 120, 40, 0.3, 0]],
    gain: 0.8,
    gap: 0.12,
  },
  zap: {
    tones: [
      ["sawtooth", 1400, 300, 0.12, 0],
      ["square", 2200, 800, 0.08, 0.03],
    ],
    gain: 0.35,
    gap: 0.1,
  },
  flame: { noise: [0.2, 900, 0], gain: 0.25, gap: 0.18 },
  explosion: {
    noise: [0.45, 500, 0],
    tones: [["sine", 90, 30, 0.4, 0]],
    gain: 0.8,
    gap: 0.08,
  },
  big: {
    noise: [0.8, 320, 0],
    tones: [["sine", 70, 25, 0.7, 0]],
    gain: 1,
    gap: 0.12,
  },
  mine: {
    noise: [0.6, 420, 0],
    tones: [["sine", 80, 30, 0.5, 0]],
    gain: 1,
    gap: 0.1,
  },
  slam: {
    noise: [0.9, 200, 0],
    tones: [["sine", 55, 25, 0.9, 0]],
    gain: 1,
    gap: 0.5,
  },
  placed: {
    tones: [["triangle", 320, 260, 0.08, 0]],
    noise: [0.08, 900, 0],
    gain: 0.5,
    gap: 0.05,
  },
  built: {
    tones: [
      ["triangle", 520, 520, 0.1, 0],
      ["triangle", 780, 780, 0.16, 0.09],
    ],
    gain: 0.5,
    gap: 0.2,
  },
  upgraded: {
    tones: [
      ["triangle", 520, 520, 0.1, 0],
      ["triangle", 660, 660, 0.1, 0.08],
      ["triangle", 880, 880, 0.2, 0.16],
    ],
    gain: 0.5,
    gap: 0.2,
  },
  wave: {
    tones: [
      ["sawtooth", 220, 220, 0.5, 0],
      ["sawtooth", 165, 165, 0.7, 0.5],
    ],
    gain: 0.4,
    gap: 1,
  },
  boss: {
    tones: [
      ["sawtooth", 110, 80, 0.9, 0],
      ["sawtooth", 82, 55, 1.2, 0.6],
    ],
    noise: [1.2, 160, 0.2],
    gain: 0.6,
    gap: 1,
  },
  clear: {
    tones: [
      ["triangle", 523, 523, 0.12, 0],
      ["triangle", 659, 659, 0.12, 0.12],
      ["triangle", 784, 784, 0.3, 0.24],
    ],
    gain: 0.5,
    gap: 1,
  },
  research: {
    tones: [
      ["sine", 880, 880, 0.12, 0],
      ["sine", 1175, 1175, 0.25, 0.1],
    ],
    gain: 0.45,
    gap: 0.5,
  },
  news: {
    tones: [
      ["sine", 660, 660, 0.1, 0],
      ["sine", 990, 990, 0.18, 0.1],
    ],
    gain: 0.35,
    gap: 0.5,
  },
  alarm: {
    tones: [
      ["square", 880, 660, 0.18, 0],
      ["square", 880, 660, 0.18, 0.22],
    ],
    gain: 0.3,
    gap: 3,
  },
  collect: { tones: [["triangle", 990, 1480, 0.12, 0]], gain: 0.4, gap: 0.08 },
  denied: { tones: [["square", 200, 160, 0.15, 0]], gain: 0.3, gap: 0.2 },
  click: { tones: [["triangle", 700, 700, 0.04, 0]], gain: 0.3, gap: 0.03 },
  over: {
    tones: [
      ["sawtooth", 330, 110, 1.6, 0],
      ["sine", 220, 80, 1.8, 0.2],
    ],
    gain: 0.6,
    gap: 2,
  },
};
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Which sound an event makes. */
const EVENT_SOUNDS: Partial<Record<GameEvent["type"], SoundId>> = {
  mg: "mg",
  rifle: "rifle",
  defenderShot: "rifle",
  heavyShot: "rifle",
  sniper: "sniper",
  cannon: "cannon",
  siegeFire: "cannon",
  chain: "zap",
  flame: "flame",
  explosion: "explosion",
  bigExplosion: "big",
  destroyed: "big",
  mine: "mine",
  slam: "slam",
  placed: "placed",
  built: "built",
  upgraded: "upgraded",
  waveStart: "wave",
  bossArrives: "boss",
  waveClear: "clear",
  researchDone: "research",
  eventNews: "news",
  hqHit: "alarm",
  collect: "collect",
  denied: "denied",
  gameOver: "over",
};

/**
 * Creates a sound player.
 *
 * @returns the player
 */
export function createSoundPlayer(): SoundPlayer {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let muted = false;
  const last = new Map<SoundId, number>();

  const ensure = (): AudioContext | null => {
    if (
      context === null &&
      typeof window !== "undefined" &&
      "AudioContext" in window
    ) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = MASTER_GAIN;
      master.connect(context.destination);
      const length = context.sampleRate;
      noise = context.createBuffer(1, length, context.sampleRate);
      const data = noise.getChannelData(0);
      for (let index = 0; index < length; index += 1) {
        data[index] = Math.random() * 2 - 1;
      }
    }
    return context;
  };

  const cue = (id: SoundId): void => {
    const audio = muted ? null : ensure();
    const recipe = RECIPES[id];
    const now = audio?.currentTime ?? 0;
    const ready = now - (last.get(id) ?? -Infinity) >= recipe.gap;
    if (
      audio !== null &&
      master !== null &&
      audio.state === "running" &&
      ready
    ) {
      last.set(id, now);
      const out = master;
      for (const [type, from, to, length, delay] of recipe.tones ?? []) {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(from, now + delay);
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(1, to),
          now + delay + length,
        );
        gain.gain.setValueAtTime(recipe.gain, now + delay);
        gain.gain.exponentialRampToValueAtTime(SILENCE, now + delay + length);
        oscillator.connect(gain).connect(out);
        oscillator.start(now + delay);
        oscillator.stop(now + delay + length + SILENCE);
      }
      if (recipe.noise !== undefined && noise !== null) {
        const [length, pitch, delay] = recipe.noise;
        const source = audio.createBufferSource();
        const filter = audio.createBiquadFilter();
        const gain = audio.createGain();
        source.buffer = noise;
        filter.type = "lowpass";
        filter.frequency.value = pitch;
        gain.gain.setValueAtTime(recipe.gain, now + delay);
        gain.gain.exponentialRampToValueAtTime(SILENCE, now + delay + length);
        source.connect(filter).connect(gain).connect(out);
        source.start(now + delay, Math.random() * NOISE_SPREAD);
        source.stop(now + delay + length);
      }
    }
  };

  return {
    play(events) {
      for (const event of events) {
        const id = EVENT_SOUNDS[event.type];
        if (id !== undefined) {
          cue(id);
        }
      }
    },
    cue,
    setMuted(value) {
      muted = value;
    },
    resume() {
      const audio = muted ? null : ensure();
      if (audio !== null && audio.state === "suspended") {
        void audio.resume();
      }
    },
  };
}
