/**
 * The game's own noises: a door shutting, a siren coming closer.
 *
 * @module
 * @remarks
 * **Fixed names, unlike the radio.** A station is any file in a folder - which
 * one plays does not matter - but an effect belongs to a moment: the door
 * closing is the door closing. So each one has a name here and a file called
 * after it under `public/gta/sounds/`, and adding one is two lines: a name in
 * {@link OneShot} and a file beside it in {@link FILES}. The folder's own
 * README says the same thing for whoever fills it.
 *
 * **Two sorts of noise, and they are built differently.** A one-shot gets a
 * fresh element every time so that two can overlap; the siren is one looping
 * element that is turned up and down, because there is only ever one siren in
 * earshot and it is a state rather than an event.
 *
 * A missing file is silence and nothing else: every play is wrapped.
 */
import { DEFAULT_VOLUME } from "@/games/gta/settings/sound-volume";

/** One noise, played once, named after the moment it belongs to. */
export type OneShot = "carEnter";

/** The file each one lives in, under the sounds folder. */
const FILES: Readonly<Record<OneShot, string>> = {
  carEnter: "car-enter.mp3",
};

/** The one noise that runs rather than happens. */
const SIREN = "police-siren.mp3";

/**
 * Who a sound is by, for the line the licence asks for.
 *
 * @remarks
 * **Only the ones that need it.** A CC0 sound asks for nothing and does not
 * belong on a credits list; a CC BY one has to be named where the game is
 * heard, not only in the repository - so its line lives here, in code, and the
 * page reads it. The folder's README carries the same table for whoever fills
 * the folder, and says to keep the two together.
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
];

/** The sub-path the site is served from, so the URLs are right on Pages. */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Plays the game's noises; every method is safe to call on the server. */
export type Sounds = {
  /** Plays one, over whatever else is playing. */
  play(sound: OneShot): void;
  /**
   * How loud the siren is, from nought (nobody near) to one (right behind).
   *
   * @param level - how close the nearest car on a call is
   */
  setSiren(level: number): void;
  /** How loud everything is, from nought to one. */
  setVolume(volume: number): void;
  /** Stops the siren and lets go of its element. */
  dispose(): void;
};

/** One that does nothing, for the server render. */
const SILENT: Sounds = {
  play(): void {},
  setSiren(): void {},
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
 * browser throws them away on its own once they have finished. The siren is
 * the exception and is made once, here, because starting a loop sixty times a
 * second is not a loop.
 */
export function createSounds(): Sounds {
  if (typeof window === "undefined") {
    return SILENT;
  }
  let level = DEFAULT_VOLUME;
  let near = 0;
  const siren = new Audio(`${BASE_PATH}/gta/sounds/${SIREN}`);
  siren.loop = true;
  siren.preload = "auto";
  siren.volume = 0;
  /** Puts the siren where it belongs: as loud as it is close, or not at all. */
  const tune = (): void => {
    const want = level * near;
    try {
      siren.volume = Math.max(0, Math.min(1, want));
      if (want <= 0) {
        if (!siren.paused) {
          siren.pause();
        }
      } else if (siren.paused) {
        void siren.play().catch(() => undefined);
      }
    } catch {
      // A siren that will not play is a quiet chase, not a broken game.
    }
  };
  return {
    play(sound: OneShot): void {
      if (level <= 0) {
        return;
      }
      try {
        const one = new Audio(`${BASE_PATH}/gta/sounds/${FILES[sound]}`);
        one.volume = level;
        void one.play().catch(() => undefined);
      } catch {
        // A missing or unplayable file is not worth a broken game.
      }
    },
    setSiren(next: number): void {
      near = Math.max(0, Math.min(1, next));
      tune();
    },
    setVolume(volume: number): void {
      level = Math.max(0, Math.min(1, volume));
      tune();
    },
    dispose(): void {
      try {
        siren.pause();
        siren.removeAttribute("src");
      } catch {
        // Tidying up, not work.
      }
    },
  };
}

/**
 * How loud a siren is at a given distance.
 *
 * @param gap - how far the nearest car on a call is, in city pixels
 * @returns nought to one
 * @remarks
 * **Distance is the whole information.** A siren one can hear getting louder
 * is the game saying "they have found you" without a word on the screen, and
 * one that fades says the opposite - so the curve matters more than the sound
 * does. Full inside a couple of car lengths, nothing at all a screen and a
 * half away, and squared in between: sound falls off faster than a straight
 * line, and a linear fade reads as a volume knob being turned rather than as
 * something coming closer.
 */
export function sirenAt(gap: number): number {
  if (gap <= SIREN_NEAR) {
    return 1;
  }
  if (gap >= SIREN_FAR) {
    return 0;
  }
  const part = (SIREN_FAR - gap) / (SIREN_FAR - SIREN_NEAR);
  return part * part;
}

/** Inside this it is as loud as it gets, in city pixels. */
const SIREN_NEAR = 180;

/** And past this it cannot be heard at all. */
const SIREN_FAR = 1500;
