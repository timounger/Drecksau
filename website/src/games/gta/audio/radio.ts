/**
 * The car radio: one song per car, and the same one when one gets back in.
 *
 * @module
 * @remarks
 * **The folder is the station list.** Nothing in here knows what a file is
 * called: the page reads `public/gta/radio/` when the site is built and hands
 * the addresses in, exactly the way the loading screen gets its pictures - see
 * `splashes()` in ../../../app/gta/page.tsx. Dropping an mp3 into that folder
 * is the whole of adding a station.
 *
 * One element, reused. A car radio is not a sound effect: there is only ever
 * one of it, it starts when a door shuts and it stops when the door opens
 * again. Every call is wrapped, so a missing file, a codec the browser will
 * not touch or an autoplay rule that has not been satisfied yet all end the
 * same way - quietly, with the game running.
 *
 * **And the car one was last in is remembered.** Getting out to open a gate
 * and back in again should not restart the afternoon: the same station picks
 * up where it stopped. Only the last car - a note per car in a city of two
 * hundred would be a memory of nothing anybody can hear.
 */

/** A radio, or the silence that stands in for one on the server. */
export type Radio = {
  /**
   * Somebody has got into a car: the radio comes on.
   *
   * @param car - which car, so that getting back into it is recognised
   * @param seed - a number from the game, so a new car is not a pattern
   * @param quiet - whether this one starts with the radio off
   */
  getIn(car: number, seed: number, quiet?: boolean): void;
  /** And out again: it stops, and where it stopped is remembered. */
  getOut(): void;
  /**
   * One step of the clock, for the slow start.
   *
   * @param dt - seconds since the last step
   */
  tick(dt: number): void;
  /**
   * Turns the dial by hand.
   *
   * @param step - how many stations along, forwards or back
   */
  turn(step: number): void;
  /** What is on, as it should be written under the word RADIO. */
  title(): string | null;
  /** How loud it is, from nought to one. */
  setVolume(volume: number): void;
  /** Stops it and lets go of the element. */
  dispose(): void;
};

import { DEFAULT_VOLUME } from "@/games/gta/settings/sound-volume";

/** How long after the door shuts the radio comes on, in seconds. */
const RADIO_DELAY = 1;

/** And how long it then takes to come up to volume. */
const RADIO_FADE = 1;

/** What the panel says while the dial is on the quiet position. */
export const RADIO_OFF = "Radio aus";

/** A radio that does nothing, for the server render and for an empty folder. */
const SILENT: Radio = {
  getIn(): void {},
  getOut(): void {},
  tick(): void {},
  turn(): void {},
  title(): string | null {
    return null;
  },
  setVolume(): void {},
  dispose(): void {},
};

/**
 * Builds a radio out of whatever is in the folder.
 *
 * @param stations - one URL per song, as the page found them
 * @returns something that plays them, or a silent stand-in
 * @remarks
 * **The dial has one more position than there are songs**, and that one is
 * silence. A car one wants to drive without music is a car one should be able
 * to drive without music, and switching the whole thing off in the settings to
 * get that is two rooms away from the steering wheel. It is never picked by
 * itself - one has to turn to it.
 *
 * **Never the same station twice in a row** in a *different* car, as long as
 * there are two: getting into the next car and hearing the song one just got
 * out of is the one thing a player would notice immediately. Getting back into
 * the *same* car is the opposite: the same song, where it was.
 */
export function createRadio(stations: readonly string[]): Radio {
  if (typeof window === "undefined" || stations.length === 0) {
    return SILENT;
  }
  const sound = new Audio();
  sound.loop = true;
  sound.preload = "none";
  sound.volume = DEFAULT_VOLUME;
  /** The dial: nought to `stations.length`, the last one being silence. */
  let dial = stations.length;
  /** Which car one is sitting in, or null on the pavement. */
  let inCar: number | null = null;
  /** The car one was last in, and what its radio was doing. */
  let memory: {
    readonly car: number;
    readonly dial: number;
    readonly at: number;
  } | null = null;
  /** How loud it is allowed to be, from the knob over the picture. */
  let level = DEFAULT_VOLUME;
  /**
   * The slow start: seconds still to wait, then how far the fade has got.
   *
   * @remarks
   * **A radio does not come on with the door.** One shuts it, sits down, and
   * a second later there is music - quietly at first, because whatever it was
   * set to is not what one wants in the ear at the moment of sitting down.
   * Turning the dial by hand is the opposite and comes on at once: that is a
   * decision, not an arrival.
   */
  let waiting = 0;
  let fade = 1;
  /** What to start playing once the wait is over. */
  let pending: { readonly at: number; readonly from: number } | null = null;
  /** Puts one of them on, from a given second, at whatever the fade says. */
  const tune = (at: number, from: number): void => {
    dial = at;
    const url = stations[at];
    try {
      sound.pause();
      if (url === undefined) {
        // The quiet position: nothing loaded, nothing playing.
        return;
      }
      if (sound.src !== new URL(url, window.location.href).href) {
        sound.src = url;
      }
      sound.currentTime = from;
      sound.volume = Math.max(0, Math.min(1, level * fade));
      // A promise that nobody waits for: if the browser says no - because
      // the page has not been touched yet - the game carries on in silence.
      void sound.play().catch(() => undefined);
    } catch {
      // An unplayable file is not worth a broken game.
    }
  };
  /** Lines one up to start a second from now, coming up out of nothing. */
  const later = (at: number, from: number): void => {
    dial = at;
    pending = stations[at] === undefined ? null : { at, from };
    waiting = RADIO_DELAY;
    fade = 0;
    try {
      sound.pause();
    } catch {
      // Nothing playing is nothing to stop.
    }
  };
  return {
    getIn(car: number, seed: number, quiet = false): void {
      inCar = car;
      const known = memory;
      if (quiet && (known === null || known.car !== car)) {
        // **A patrol car has the radio off**, and that is not a rule about
        // cars but about what it is like to sit in one: the radio in there is
        // the control room. Turn it on by hand if you want music - and then
        // it is remembered like any other car.
        later(stations.length, 0);
        return;
      }
      if (known !== null && known.car === car) {
        // **The same car as before**: the same station, from the second it
        // stopped at. Getting out to open a gate is not a reason to start the
        // afternoon again.
        later(known.dial, known.at);
        return;
      }
      later(pickOne(stations.length, dial, seed), 0);
    },
    getOut(): void {
      try {
        // The note is taken off the element itself, at the moment the door
        // opens: whatever it says is where the song actually got to.
        if (inCar !== null) {
          // Whatever was pending never got to play, so what it would have
          // played is what this car remembers.
          memory = {
            car: inCar,
            dial,
            at: pending === null ? sound.currentTime : pending.from,
          };
        }
        inCar = null;
        pending = null;
        waiting = 0;
        fade = 1;
        sound.pause();
      } catch {
        // Nothing to do about it and nothing to say.
      }
    },
    turn(step: number): void {
      // **Round in a circle, like a dial**, with the quiet position as one of
      // the stops: one notch past the last song is silence, one more is the
      // first song again. By hand it comes on at once - one has just turned
      // the dial, and a dial that takes two seconds to answer is broken.
      const stops = stations.length + 1;
      pending = null;
      waiting = 0;
      fade = 1;
      tune((((dial + step) % stops) + stops) % stops, 0);
    },
    tick(dt: number): void {
      const start = pending;
      if (start !== null) {
        waiting -= dt;
        if (waiting <= 0) {
          pending = null;
          tune(start.at, start.from);
        }
        return;
      }
      if (fade < 1) {
        fade = Math.min(1, fade + dt / RADIO_FADE);
        sound.volume = Math.max(0, Math.min(1, level * fade));
      }
    },
    title(): string | null {
      return stations[dial] === undefined ? RADIO_OFF : nameOf(stations[dial]);
    },
    setVolume(volume: number): void {
      level = Math.max(0, Math.min(1, volume));
      sound.volume = Math.max(0, Math.min(1, level * fade));
    },
    dispose(): void {
      try {
        sound.pause();
        sound.removeAttribute("src");
      } catch {
        // Same again: this is tidying up, not work.
      }
    },
  };
}

/**
 * The name of a song, read off its own file name.
 *
 * @param url - where the file lives
 * @returns something worth writing under the word RADIO
 * @remarks
 * **The file name is the title**, because nothing else is: an mp3 that somebody
 * dropped into a folder has no other name, and asking for one would mean a
 * list to keep up to date. So: the last part of the address, without the
 * extension, with the web's `%20`s turned back into spaces, underscores and
 * dashes read as spaces, and a leading track number thrown away - `04_-_Bad
 * Company.mp3` becomes `Bad Company`.
 */
export function nameOf(url: string): string {
  const file = url.split("/").pop() ?? url;
  let name = file;
  try {
    name = decodeURIComponent(file);
  } catch {
    // A name that is not valid escaping is a name: leave it as it is.
  }
  return (
    name
      .replace(/\.[^.]+$/u, "")
      .replace(/[_]+/gu, " ")
      .replace(/^\s*\d+\s*[-.)]?\s*/u, "")
      .replace(/\s*-\s*/gu, " - ")
      .replace(/\s+/gu, " ")
      .trim() || "Sender"
  );
}

/**
 * The artist and the song, for the credit the licence asks for.
 *
 * @param url - where the file lives
 * @returns the two halves of `Artist - Title`, or the whole as the title
 * @remarks
 * **A name written `Artist - Titel.mp3` is a credit.** That is the way the
 * Free Music Archive hands the files out and the way this folder is meant to
 * be filled, so the page can name both without anybody keeping a list. A file
 * without a dash is all title and no artist, which is still better than
 * nothing.
 */
export function creditOf(url: string): {
  readonly artist: string | null;
  readonly title: string;
} {
  const whole = nameOf(url);
  const cut = whole.indexOf(" - ");
  return cut <= 0
    ? { artist: null, title: whole }
    : {
        artist: whole.slice(0, cut).trim(),
        title: whole.slice(cut + " - ".length).trim(),
      };
}

/**
 * Which station to put on in a car one has not been in.
 *
 * @param count - how many songs there are
 * @param last - the dial position it was on, which may be the quiet one
 * @param seed - a number out of the game
 * @returns the station to play
 * @remarks
 * Never the quiet position: that one is reached by turning to it, never by
 * getting into a car. A car that came with the radio off would look like a
 * car with a broken radio.
 */
function pickOne(count: number, last: number, seed: number): number {
  if (count === 1) {
    return 0;
  }
  if (last < 0 || last >= count) {
    // Nothing was on, so every song is fair game.
    return Math.abs(Math.floor(seed)) % count;
  }
  // Out of the ones that are not the last: pick in that shorter list and then
  // step over the gap, which is a shuffle without a list to keep.
  const room = count - 1;
  const at = Math.abs(Math.floor(seed)) % room;
  return at >= last ? at + 1 : at;
}
