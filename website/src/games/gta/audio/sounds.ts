/**
 * The game's own noises: a door shutting, an engine, a siren coming closer.
 *
 * @module
 * @remarks
 * **Fixed names, unlike the radio.** A station is any file in a folder - which
 * one plays does not matter - but an effect belongs to a moment: the door
 * closing is the door closing. So each one has a name here and a file called
 * after it under `public/gta/sounds/`, and adding one is two lines: a name in
 * {@link OneShot} or {@link LoopKind} and the file beside it. The folder's own
 * README says the same thing for whoever fills it.
 *
 * **Two sorts of noise, and they are built differently.** A one-shot gets a
 * fresh element every time so that two can overlap - a shot fired while the
 * last one is still ringing is two shots. A loop is one element per kind that
 * is turned up and down and **stopped the instant it reaches nothing**: an
 * engine is not an event, it is a state, and so are a siren, a rotor, a jet of
 * fire - and a machine gun, which is the one that had to be moved across. A
 * burst played as a string of one-shots goes on rattling after the trigger is
 * let go, because every element insists on finishing; a loop stops when one
 * stops firing, which is what a machine gun does.
 *
 * **This module knows nothing about the city.** What runs and how loud is
 * worked out in ./mix, out of the state, and handed here as numbers. That
 * keeps the part one can reason about free of audio elements, and this part
 * free of the game.
 *
 * A missing file is silence and nothing else: every play is wrapped.
 */
import { DEFAULT_VOLUME } from "@/games/gta/settings/sound-volume";

/** One noise, played once, named after the moment it belongs to. */
export type OneShot = "carEnter" | "hit" | "pistol" | "rocket" | "explosion";

/** The file each one lives in, under the sounds folder. */
const FILES: Readonly<Record<OneShot, string>> = {
  carEnter: "car-enter.mp3",
  hit: "hit.mp3",
  pistol: "pistol.mp3",
  rocket: "rocket-launcher.mp3",
  explosion: "explosion.mp3",
};

/** One noise that runs rather than happens. */
export type LoopKind =
  | "siren"
  | "engine"
  | "tankEngine"
  | "machineGun"
  | "flame"
  | "helicopter"
  | "airplane"
  | "boat"
  | "swimming";

/** And the file each of those lives in. */
const LOOPS: Readonly<Record<LoopKind, string>> = {
  siren: "police-siren.mp3",
  engine: "car-engine.mp3",
  tankEngine: "tank-engine.mp3",
  machineGun: "machine-gun.mp3",
  flame: "flamethrower.mp3",
  helicopter: "helicopter.mp3",
  airplane: "airplane.mp3",
  boat: "boat.mp3",
  swimming: "swimming.mp3",
};

/** Every loop there is, for walking through them. */
export const LOOP_KINDS: readonly LoopKind[] = [
  "siren",
  "engine",
  "tankEngine",
  "machineGun",
  "flame",
  "helicopter",
  "airplane",
  "boat",
  "swimming",
];

/**
 * How one loop is being sung this instant.
 *
 * @remarks
 * **Two numbers, because an engine is two things.** How loud it is says how
 * near it is, or how hard it is working; how fast it is played says how fast
 * the thing is going. A recording of an engine is an engine at one speed, and
 * the same recording sped up is that engine revving - which is what one
 * actually hears from a car pulling away.
 */
export type Sung = {
  /** Nought to one; nought pauses it. */
  readonly level: number;
  /** How fast to play it, one being as recorded. */
  readonly rate: number;
};

/** What every loop is doing, together. */
export type Mix = Readonly<Record<LoopKind, Sung>>;

/** A loop that is not running. */
export const OFF: Sung = { level: 0, rate: 1 };

/**
 * Who a sound is by, for the line the licence asks for.
 *
 * @remarks
 * **Only the ones that need it.** A CC0 sound asks for nothing and does not
 * belong on a credits list; a CC BY one has to be named where the game is
 * heard, not only in the repository - so its line lives here, in code, and the
 * page reads it. The folder's README carries the same table for whoever fills
 * the folder, and says to keep the two together.
 *
 * **From the moment the file is in the folder**, not from the moment the game
 * plays it: everything under `public/` is served with the site and can be
 * downloaded from it, which is the distributing the licence talks about. So a
 * sound that is lying there waiting to be wired up is credited here already.
 */
export type SoundCredit = {
  /** The file it belongs to, for the reader of this list. */
  readonly file: string;
  readonly title: string;
  readonly author: string;
  /** Where it came from. */
  readonly url: string;
  /** Which licence, spelled the way the licence spells itself. */
  readonly licence: string;
  /** And what was done to it, because CC BY asks that this be said. */
  readonly edited: string | null;
};

/** The sounds that have to be credited. */
export const SOUND_CREDITS: readonly SoundCredit[] = [
  {
    file: "car-enter.mp3",
    title: "Car Door Open/Close (exterior perspective)",
    author: "iainmccurdy",
    url: "https://freesound.org/people/iainmccurdy/sounds/643122/",
    licence: "CC BY 4.0",
    edited: "in MP3 umgewandelt, geschnitten, komprimiert",
  },
  {
    file: "police-siren.mp3",
    title: "VEHSirn_Police Car Siren.Synthesized.Dry 2_EM.wav",
    author: "newlocknew",
    url: "https://freesound.org/people/newlocknew/sounds/692525/",
    licence: "CC BY 4.0",
    edited: "in MP3 umgewandelt, komprimiert",
  },
  {
    file: "car-engine.mp3",
    title: "Motorcycle Engine_50Km/h.wav",
    author: "Cmart94",
    url: "https://freesound.org/people/Cmart94/sounds/518178/",
    licence: "CC BY 4.0",
    edited: "in MP3 umgewandelt, komprimiert",
  },
  {
    file: "tank-engine.mp3",
    title: "Tank Engine Loop.flac",
    author: "qubodup",
    url: "https://freesound.org/people/qubodup/sounds/200303/",
    licence: "CC BY 4.0",
    edited: "in MP3 umgewandelt, komprimiert",
  },
  {
    file: "machine-gun.mp3",
    title: "Assault Rifle Shooting.wav",
    author: "18hiltc",
    url: "https://freesound.org/people/18hiltc/sounds/237273/",
    licence: "CC BY 4.0",
    edited: "in MP3 umgewandelt, geschnitten, komprimiert",
  },
  {
    file: "rocket-launcher.mp3",
    title:
      "custom_starwars_the_clonewars_inspired_rocket_launcher_firing_sounds",
    author: "Artninja",
    url: "https://freesound.org/people/Artninja/sounds/849766/",
    licence: "CC BY 4.0",
    edited: "in MP3 umgewandelt, geschnitten, komprimiert",
  },
  {
    // The one that is not simply CC BY: non-commercial only, which this game
    // is - no advertising, nothing sold. Worth knowing before that ever
    // changes, and the reason the licence is spelled out in full here.
    file: "helicopter.mp3",
    title: "helicopterRaw_30sec.wav",
    author: "lorenzosu",
    url: "https://freesound.org/people/lorenzosu/sounds/49483/",
    licence: "CC BY-NC 4.0",
    edited: "in MP3 umgewandelt, geschnitten, komprimiert",
  },
  {
    // The second one that is non-commercial only - see the helicopter above.
    file: "swimming.mp3",
    title: "05913 swimming loop.wav",
    author: "Robinhood76",
    url: "https://freesound.org/people/Robinhood76/sounds/317067/",
    licence: "CC BY-NC 4.0",
    edited: "in MP3 umgewandelt, komprimiert",
  },
  {
    file: "boat.mp3",
    title: "LS_34803-2_FR_ShipCruising.wav",
    author: "kevp888",
    url: "https://freesound.org/people/kevp888/sounds/647414/",
    licence: "CC BY 4.0",
    edited: "in MP3 umgewandelt, geschnitten, komprimiert",
  },
];

/** The sub-path the site is served from, so the URLs are right on Pages. */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Plays the game's noises; every method is safe to call on the server. */
export type Sounds = {
  /**
   * Plays one, over whatever else is playing.
   *
   * @param sound - which noise
   * @param gain - how loud, from nought to one, for what happens far away
   */
  play(sound: OneShot, gain?: number): void;
  /**
   * Puts every loop where the mixer says it should be.
   *
   * @param mix - one level and rate per loop, from ./mix
   */
  setLoops(mix: Mix): void;
  /** Everything off, at once. */
  hush(): void;
  /** How loud everything is, from nought to one. */
  setVolume(volume: number): void;
  /** Stops everything and lets go of the elements. */
  dispose(): void;
};

/** One that does nothing, for the server render. */
const SILENT: Sounds = {
  play(): void {},
  setLoops(): void {},
  hush(): void {},
  setVolume(): void {},
  dispose(): void {},
};

/**
 * Builds the noise-maker.
 *
 * @returns something that plays the effects, or a silent stand-in
 * @remarks
 * **A fresh element per shot**, which is what makes them overlap - one shared
 * element would cut a door off to play the next one. They are short and the
 * browser throws them away on its own once they have finished. The loops are
 * the exception and are made once, here, because starting a loop sixty times a
 * second is not a loop.
 */
export function createSounds(): Sounds {
  if (typeof window === "undefined") {
    return SILENT;
  }
  let level = DEFAULT_VOLUME;
  /** One element per loop, made once and then only turned up and down. */
  const running = new Map<LoopKind, HTMLAudioElement>();
  /** What each was last told to do, so it is only touched on a change. */
  const singing = new Map<LoopKind, Sung>();
  for (const kind of LOOP_KINDS) {
    const one = new Audio(`${BASE_PATH}/gta/sounds/${LOOPS[kind]}`);
    one.loop = true;
    one.preload = "auto";
    one.volume = 0;
    running.set(kind, one);
  }
  /**
   * The one-shots that are still ringing.
   *
   * @remarks
   * **Only so that they can be cut off.** A door or a shot is over in a second
   * and nobody waits for it - which is why each gets its own element and none
   * of them is kept anywhere. Starting a new game is the exception: what is
   * still hanging in the air belongs to the city that has just been thrown
   * away. They take themselves off this list when they finish.
   */
  const going = new Set<HTMLAudioElement>();
  /** Puts one loop where it belongs, or stops it if it belongs nowhere. */
  const tune = (kind: LoopKind, sung: Sung): void => {
    const one = running.get(kind);
    if (one === undefined) {
      return;
    }
    const want = Math.max(0, Math.min(1, level * sung.level));
    try {
      one.volume = want;
      one.playbackRate = Math.max(RATE_LEAST, Math.min(RATE_MOST, sung.rate));
      if (want <= 0) {
        if (!one.paused) {
          one.pause();
        }
      } else if (one.paused) {
        void one.play().catch(() => undefined);
      }
    } catch {
      // A loop that will not play is a quiet chase, not a broken game.
    }
  };
  /** Everything off: every loop down, and whatever else is still ringing. */
  const hush = (): void => {
    singing.clear();
    for (const kind of LOOP_KINDS) {
      tune(kind, OFF);
    }
    for (const one of going) {
      try {
        one.pause();
      } catch {
        // A noise that will not stop is not worth a broken game.
      }
    }
    going.clear();
  };
  return {
    play(sound: OneShot, gain = 1): void {
      const want = level * Math.max(0, Math.min(1, gain));
      if (want <= 0) {
        return;
      }
      try {
        const one = new Audio(`${BASE_PATH}/gta/sounds/${FILES[sound]}`);
        one.volume = want;
        going.add(one);
        one.addEventListener("ended", () => going.delete(one));
        void one.play().catch(() => undefined);
      } catch {
        // A missing or unplayable file is not worth a broken game.
      }
    },
    setLoops(mix: Mix): void {
      for (const kind of LOOP_KINDS) {
        const sung = mix[kind];
        const before = singing.get(kind);
        // **Only on a change.** Writing the same volume sixty times a second
        // is sixty writes into the audio pipeline for nothing.
        if (
          before !== undefined &&
          before.level === sung.level &&
          before.rate === sung.rate
        ) {
          continue;
        }
        singing.set(kind, sung);
        tune(kind, sung);
      }
    },
    hush,
    setVolume(volume: number): void {
      level = Math.max(0, Math.min(1, volume));
      for (const kind of LOOP_KINDS) {
        tune(kind, singing.get(kind) ?? OFF);
      }
    },
    dispose(): void {
      hush();
      for (const one of running.values()) {
        try {
          one.removeAttribute("src");
        } catch {
          // Tidying up, not work.
        }
      }
      running.clear();
    },
  };
}

/** How far down the pitch of a loop may be bent. */
const RATE_LEAST = 0.5;

/** And how far up. */
const RATE_MOST = 2;
