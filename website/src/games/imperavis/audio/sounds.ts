/**
 * The AudioManager: everything is synthesised with WebAudio - the surf of
 * the sea, rain, birds by day, a quiet tune, and the signals of building,
 * rising houses, ships, the trader and shortages. The surroundings follow
 * the camera: the murmur of a town, hammers on building sites, creaking
 * timber and bells in a harbour, drums and cannons in battle.
 *
 * @module
 * @remarks
 * No audio files. Every cue has a minimum gap, so twenty finished houses
 * make one chime. Audio starts only after a click or key press, so
 * {@link SoundPlayer.resume} is called from the first one.
 */
import type { GameEvent } from "@/games/imperavis/engine/types";

/** Everything that makes a sound. */
export type SoundId =
  | "placed"
  | "built"
  | "upgraded"
  | "unlocked"
  | "founded"
  | "ship"
  | "bell"
  | "coins"
  | "warn"
  | "alarm"
  | "denied"
  | "click"
  | "chirp"
  | "thunder"
  | "cannon"
  | "hammer"
  | "creak"
  | "drum";

/** What the surroundings sound like right now. */
export type Ambience = {
  /** 0 by day, 1 at night. */
  readonly night: number;
  /** 0 calm, 1 rain, 2 storm. */
  readonly rain: number;
  /** 0 to 1, how close the camera is (towns sound louder up close). */
  readonly closeness: number;
  /** 0 to 1, how much town lies around the camera. */
  readonly city: number;
  /** 0 to 1, how near a harbour with ships is. */
  readonly harbour: number;
  /** 0 to 1, how many building sites are near. */
  readonly building: number;
  /** 0 to 1, how much fighting there is near. */
  readonly battle: number;
  /**
   * Whether the game runs: while paused (also under the pause menu or in a
   * hidden tab) there is no rain, thunder, town, harbour, birds or tune,
   * and the sea is quieter.
   */
  readonly running: boolean;
};

/** A small sound player. */
export type SoundPlayer = {
  /** Plays the sounds of some game events. */
  play(events: readonly GameEvent[]): void;
  /** Plays one sound. */
  cue(id: SoundId): void;
  /** Sets the loops and random sounds for the surroundings. */
  ambience(state: Ambience, dt: number): void;
  /** Turns the sound off or on. */
  setMuted(muted: boolean): void;
  /** Unlocks audio - must be called from a click or key press. */
  resume(): void;
  /** Stops everything. */
  dispose(): void;
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
const MASTER_GAIN = 0.18;

/** Fade-out floor - an exponential ramp cannot reach zero. */
const SILENCE = 0.0001;

/** Seconds into the noise buffer a burst may start, so bursts differ. */
const NOISE_SPREAD = 0.5;

/* eslint-disable @typescript-eslint/no-magic-numbers -- the recipes, loop levels and the tune */
/** How each sound is made. */
const RECIPES: Readonly<Record<SoundId, Recipe>> = {
  placed: {
    tones: [["triangle", 330, 260, 0.08, 0]],
    noise: [0.08, 900, 0],
    gain: 0.5,
    gap: 0.05,
  },
  built: {
    tones: [
      ["triangle", 520, 520, 0.1, 0],
      ["triangle", 780, 780, 0.16, 0.09],
    ],
    gain: 0.45,
    gap: 0.4,
  },
  upgraded: {
    tones: [
      ["triangle", 523, 523, 0.1, 0],
      ["triangle", 659, 659, 0.1, 0.09],
      ["triangle", 784, 784, 0.22, 0.18],
    ],
    gain: 0.5,
    gap: 0.6,
  },
  unlocked: {
    tones: [
      ["sine", 660, 660, 0.12, 0],
      ["sine", 880, 880, 0.12, 0.1],
      ["sine", 1320, 1320, 0.3, 0.2],
    ],
    gain: 0.4,
    gap: 0.6,
  },
  founded: {
    tones: [
      ["sawtooth", 392, 392, 0.2, 0],
      ["sawtooth", 523, 523, 0.2, 0.2],
      ["sawtooth", 659, 659, 0.5, 0.4],
    ],
    gain: 0.3,
    gap: 2,
  },
  ship: {
    tones: [
      ["sawtooth", 110, 104, 1.1, 0],
      ["sine", 220, 208, 1.1, 0],
    ],
    gain: 0.4,
    gap: 2,
  },
  bell: {
    tones: [
      ["sine", 1320, 1320, 0.6, 0],
      ["sine", 1980, 1980, 0.35, 0],
    ],
    gain: 0.25,
    gap: 1.5,
  },
  coins: {
    tones: [
      ["triangle", 1800, 2200, 0.06, 0],
      ["triangle", 2100, 2600, 0.06, 0.07],
      ["triangle", 1900, 2400, 0.08, 0.14],
    ],
    gain: 0.3,
    gap: 0.8,
  },
  warn: {
    tones: [
      ["square", 440, 392, 0.15, 0],
      ["square", 392, 349, 0.2, 0.17],
    ],
    gain: 0.2,
    gap: 4,
  },
  alarm: {
    tones: [
      ["square", 660, 440, 0.25, 0],
      ["square", 660, 440, 0.25, 0.3],
    ],
    gain: 0.25,
    gap: 6,
  },
  denied: { tones: [["square", 200, 160, 0.15, 0]], gain: 0.3, gap: 0.2 },
  click: { tones: [["triangle", 700, 700, 0.04, 0]], gain: 0.3, gap: 0.03 },
  chirp: {
    tones: [
      ["sine", 2600, 3400, 0.07, 0],
      ["sine", 3000, 3800, 0.06, 0.1],
    ],
    gain: 0.12,
    gap: 0.3,
  },
  thunder: {
    noise: [1.6, 180, 0],
    tones: [["sine", 60, 30, 1.2, 0]],
    gain: 0.9,
    gap: 3,
  },
  cannon: {
    tones: [["sine", 80, 35, 0.5, 0]],
    noise: [0.6, 300, 0],
    gain: 0.8,
    gap: 0.15,
  },
  hammer: {
    tones: [
      ["square", 900, 700, 0.05, 0],
      ["square", 880, 680, 0.05, 0.2],
    ],
    gain: 0.08,
    gap: 0.6,
  },
  creak: {
    tones: [["sawtooth", 140, 105, 0.6, 0]],
    gain: 0.04,
    gap: 2,
  },
  drum: {
    tones: [
      ["sine", 110, 50, 0.25, 0],
      ["sine", 110, 50, 0.25, 0.32],
      ["sine", 130, 60, 0.3, 0.64],
    ],
    gain: 0.45,
    gap: 1.4,
  },
};

/** Which sound an event makes. */
const EVENT_SOUNDS: Partial<Record<GameEvent["type"], SoundId>> = {
  placed: "placed",
  built: "built",
  upgraded: "upgraded",
  unlocked: "unlocked",
  founded: "founded",
  shipBuilt: "ship",
  docked: "bell",
  trader: "coins",
  shortage: "warn",
  debt: "alarm",
  shot: "cannon",
  sunk: "thunder",
  war: "drum",
  offer: "bell",
  researched: "unlocked",
  tutorial: "unlocked",
  levelUp: "built",
  captured: "alarm",
  plundered: "alarm",
};

/** Level of the town's murmur. */
const CITY_LEVEL = 0.12;

/** Pitch of the murmur, Hz. */
const CITY_PITCH = 700;

/** Chances per second of a hammer, a creak or a bell, and of drums. */
const HAMMER_CHANCE = 2.5;
const CREAK_CHANCE = 0.6;
const BELL_CHANCE = 0.08;
const DRUM_CHANCE = 0.5;

/** Notes of the tune (a pentatonic scale), Hz. */
const SCALE = [196, 220, 262, 294, 330, 392, 440, 523];

/** Seconds between notes of the tune. */
const BEAT = 0.55;

/** Level of the sea, rain and the tune. */
const SEA_LEVEL = 0.35;
const RAIN_LEVEL = 0.4;
const TUNE_LEVEL = 0.09;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Filter pitch of the sea and the rain, in Hz. */
const SEA_PITCH = 420;
const RAIN_PITCH = 3200;

/** How fast the surf swells, radians per second. */
const SWELL_SPEED = 0.7;

/** Seconds a loop level takes to settle. */
const SMOOTH = 0.6;

/** One half, for levels. */
const HALF = 0.5;

/** Chance per second of thunder in a storm and of a bird call. */
const THUNDER_CHANCE = 0.08;
const CHIRP_CHANCE = 0.5;

/** The surf never falls below this share of its level. */
const SWELL_BASE = 0.6;

/** Share of the sea's level while the game is paused. */
const PAUSED_SEA = 0.4;

/** The tune moves at most this many notes up or down. */
const MELODY_STEP = 2;

/**
 * Creates a sound player.
 *
 * @returns the player
 */
export function createSoundPlayer(): SoundPlayer {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let seaGain: GainNode | null = null;
  let rainGain: GainNode | null = null;
  let cityGain: GainNode | null = null;
  let muted = false;
  let clock = 0;
  let nextNote = 0;
  let noteIndex = 0;
  const last = new Map<SoundId, number>();

  const ensure = (): AudioContext | null => {
    // Only after the player touched the page; browsers refuse audio before.
    const allowed =
      typeof navigator === "undefined" ||
      navigator.userActivation === undefined ||
      navigator.userActivation.hasBeenActive;
    if (
      context === null &&
      allowed &&
      typeof window !== "undefined" &&
      "AudioContext" in window
    ) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = MASTER_GAIN;
      master.connect(context.destination);
      const length = context.sampleRate * 2;
      noise = context.createBuffer(1, length, context.sampleRate);
      const data = noise.getChannelData(0);
      for (let index = 0; index < length; index += 1) {
        data[index] = Math.random() * 2 - 1;
      }
      seaGain = loop(context, noise, master, "lowpass", SEA_PITCH);
      rainGain = loop(context, noise, master, "highpass", RAIN_PITCH);
      cityGain = loop(context, noise, master, "bandpass", CITY_PITCH);
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
        tone(audio, out, type, from, to, length, delay, recipe.gain);
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
    ambience(state, dt) {
      const audio = context;
      if (
        audio !== null &&
        audio.state === "running" &&
        seaGain !== null &&
        rainGain !== null &&
        master !== null
      ) {
        clock += dt;
        const now = audio.currentTime;
        // The surf swells and ebbs.
        const swell =
          SEA_LEVEL *
          (SWELL_BASE + (1 - SWELL_BASE) * Math.sin(clock * SWELL_SPEED)) *
          (1 - state.closeness * HALF) *
          (state.running ? 1 : PAUSED_SEA);
        seaGain.gain.setTargetAtTime(muted ? 0 : swell, now, SMOOTH);
        rainGain.gain.setTargetAtTime(
          muted || !state.running ? 0 : RAIN_LEVEL * state.rain * HALF,
          now,
          SMOOTH,
        );
        if (
          state.running &&
          state.rain > 1 &&
          Math.random() < dt * THUNDER_CHANCE
        ) {
          cue("thunder");
        }
        cityGain?.gain.setTargetAtTime(
          muted || !state.running ? 0 : CITY_LEVEL * state.city,
          now,
          SMOOTH,
        );
        if (
          state.running &&
          Math.random() < dt * HAMMER_CHANCE * state.building
        ) {
          cue("hammer");
        }
        if (
          state.running &&
          Math.random() < dt * CREAK_CHANCE * state.harbour
        ) {
          cue("creak");
        }
        if (state.running && Math.random() < dt * BELL_CHANCE * state.harbour) {
          cue("bell");
        }
        if (state.running && Math.random() < dt * DRUM_CHANCE * state.battle) {
          cue("drum");
        }
        if (
          state.running &&
          state.night < HALF &&
          Math.random() < dt * CHIRP_CHANCE * state.closeness
        ) {
          cue("chirp");
        }
        // A quiet tune: a slow walk over the scale, darker at night,
        // silent while drums beat.
        if (
          state.running &&
          !muted &&
          state.battle < HALF &&
          clock >= nextNote
        ) {
          nextNote = clock + BEAT * (Math.random() < HALF ? 1 : 2);
          noteIndex = Math.max(
            0,
            Math.min(
              SCALE.length - 1,
              noteIndex +
                Math.floor(Math.random() * (MELODY_STEP * 2 + 1)) -
                MELODY_STEP,
            ),
          );
          const pitch = SCALE[noteIndex] * (state.night > HALF ? HALF : 1);
          tone(
            audio,
            master,
            "triangle",
            pitch,
            pitch,
            BEAT * 2,
            0,
            TUNE_LEVEL,
          );
        }
      }
    },
    setMuted(value) {
      muted = value;
      if (value && seaGain !== null && rainGain !== null && context !== null) {
        seaGain.gain.setTargetAtTime(0, context.currentTime, SMOOTH);
        rainGain.gain.setTargetAtTime(0, context.currentTime, SMOOTH);
        cityGain?.gain.setTargetAtTime(0, context.currentTime, SMOOTH);
      }
    },
    resume() {
      const audio = muted ? null : ensure();
      if (audio !== null && audio.state === "suspended") {
        void audio.resume();
      }
    },
    dispose() {
      if (context !== null) {
        void context.close();
        context = null;
      }
    },
  };
}

/** A looping filtered noise with its own volume, starting silent. */
function loop(
  audio: AudioContext,
  buffer: AudioBuffer,
  out: AudioNode,
  type: BiquadFilterType,
  pitch: number,
): GainNode {
  const source = audio.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = audio.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = pitch;
  const gain = audio.createGain();
  gain.gain.value = 0;
  source.connect(filter).connect(gain).connect(out);
  source.start();
  return gain;
}

/** One gliding tone that fades out. */
function tone(
  audio: AudioContext,
  out: AudioNode,
  type: OscillatorType,
  from: number,
  to: number,
  length: number,
  delay: number,
  level: number,
): void {
  const now = audio.currentTime;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, now + delay);
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(1, to),
    now + delay + length,
  );
  gain.gain.setValueAtTime(level, now + delay);
  gain.gain.exponentialRampToValueAtTime(SILENCE, now + delay + length);
  oscillator.connect(gain).connect(out);
  oscillator.start(now + delay);
  oscillator.stop(now + delay + length + SILENCE);
}
