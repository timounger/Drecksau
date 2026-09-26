/**
 * The music over the loading screen: one song while the city is laid out.
 *
 * @module
 * @remarks
 * **The folder is the record shelf**, exactly as with the radio next door and
 * the splash pictures behind it: nothing in here knows what a file is called.
 * The page reads `public/gta/loading/` when the site is built and hands the
 * addresses in - see `tunes()` in ../../../app/gta/page.tsx. Dropping an mp3
 * into that folder is the whole of adding one, and which one plays is a throw
 * of the dice per build, like the picture it plays over.
 *
 * **It begins and ends with the bar.** This is not a station one tunes: it
 * starts when the first slice of work goes up and it is gone when there is a
 * city to look at. It starts at its volume and is faded out, which is not the
 * radio's manners and is on purpose - see {@link createTune}.
 *
 * **A page that has not been touched will not play it**, and that is a browser
 * rule rather than a bug: a fresh load straight into `/gta` is silent, while
 * coming through the collection or pressing "Neues Spiel" counts as a touch
 * and plays. Every call is wrapped, so that case and a missing file end the
 * same way - quietly, with the game running.
 */
import { DEFAULT_VOLUME } from "@/games/gta/settings/sound-volume";

/** The loading song, or the silence that stands in for one on the server. */
export type Tune = {
  /** A city is being laid out: a song starts. */
  start(): void;
  /** There is a street to look at: it fades away. */
  stop(): void;
  /** How loud it is allowed to be, from nought to one. */
  setVolume(volume: number): void;
  /** Stops it and lets go of the element. */
  dispose(): void;
};

/** How long the song takes to fade away at the end, in seconds. */
const TUNE_FADE = 0.8;

/** How often that fade is stepped, in milliseconds. */
const STEP_MS = 50;

/** Seconds, in milliseconds. */
const MS_PER_SECOND = 1000;

/** One that does nothing, for the server render and for an empty folder. */
const SILENT: Tune = {
  start(): void {},
  stop(): void {},
  setVolume(): void {},
  dispose(): void {},
};

/**
 * Builds the loading-screen music out of whatever is in the folder.
 *
 * @param tracks - one URL per song, as the page found them
 * @returns something that plays one of them, or a silent stand-in
 * @remarks
 * **It comes on at its volume, with no fade in.** The radio takes a second to
 * come up and that is right for a radio - one has just sat down in a car and
 * the afternoon is long. Here the whole scene is over in about that time: the
 * bar, measured in the browser, goes from nought to done in a second and a
 * bit. A fade tried first and measured came out at eight per cent of the knob
 * at the moment the fade *out* began: the song was there and nobody could hear
 * it. Twice as fast a fade was no better, because the fade cannot run while
 * the city is being laid out - see below. A song that simply starts when the
 * picture appears reads as intentional; one that is inaudible reads as broken.
 *
 * **Going away is the other way round.** The cut to the street is the moment
 * one is waiting for, and a song that stops dead on it sounds like a fault. By
 * then the city is built and the main thread is free, so a fade there actually
 * runs - measured, it goes 0,44 → 0,34 → 0,23 → 0,13 → 0,06 → still.
 *
 * **Its own clock, not the game's.** Everything else that fades in this game -
 * the radio, the siren - is stepped by the animation loop, which is the right
 * place for anything happening in the city. This happens either side of it, so
 * a plain interval does it, and it only runs while something is fading.
 */
export function createTune(tracks: readonly string[]): Tune {
  if (typeof window === "undefined" || tracks.length === 0) {
    return SILENT;
  }
  const sound = new Audio();
  sound.loop = true;
  sound.preload = "none";
  sound.volume = 0;
  /** How loud the knob allows, and how much of that is left at the moment. */
  let level = DEFAULT_VOLUME;
  let fade = 0;
  let timer = 0;
  /** Puts the two numbers on the element, which is the only place they show. */
  const apply = (): void => {
    try {
      sound.volume = Math.max(0, Math.min(1, level * fade));
    } catch {
      // A volume that will not be set is not worth a broken loading screen.
    }
  };
  const drop = (): void => {
    if (timer !== 0) {
      window.clearInterval(timer);
      timer = 0;
    }
  };
  /** Silence, now: the end of the fade and the answer to a muted folder. */
  const hush = (): void => {
    drop();
    fade = 0;
    apply();
    try {
      sound.pause();
    } catch {
      // Nothing playing is nothing to stop.
    }
  };
  return {
    start(): void {
      // One of them, drawn fresh: the same song over every build would be the
      // loading screen's signature tune, and this folder is meant to grow.
      const url = tracks[Math.floor(Math.random() * tracks.length)];
      if (url === undefined) {
        return;
      }
      drop();
      fade = 1;
      try {
        if (sound.src !== new URL(url, window.location.href).href) {
          sound.src = url;
        }
        sound.currentTime = 0;
        apply();
        // A promise nobody waits for: a browser that says no - because the
        // page has not been touched yet - leaves the bar moving in silence.
        void sound.play().catch(() => undefined);
      } catch {
        // An unplayable file is not worth a broken loading screen.
      }
    },
    stop(): void {
      if (fade <= 0) {
        hush();
        return;
      }
      drop();
      timer = window.setInterval(() => {
        fade = Math.max(0, fade - STEP_MS / (TUNE_FADE * MS_PER_SECOND));
        apply();
        if (fade <= 0) {
          hush();
        }
      }, STEP_MS);
    },
    setVolume(volume: number): void {
      level = Math.max(0, Math.min(1, volume));
      apply();
    },
    dispose(): void {
      drop();
      try {
        sound.pause();
        sound.removeAttribute("src");
      } catch {
        // Tidying up, not work.
      }
    },
  };
}
