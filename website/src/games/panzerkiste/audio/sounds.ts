/**
 * Plays Panzerkiste's sound effects in the browser.
 *
 * @module
 * @remarks
 * The files under `public/panzerkiste/sounds/` are empty placeholders for now;
 * dropping real audio in with the same names is all that is needed later. A
 * missing or unplayable file just stays silent - every play is wrapped so a
 * failure never disturbs the game.
 *
 * One-shot effects (a shot, a kill) start a fresh element each time so they can
 * overlap; the "own tank moving" hum is one looping element toggled on and off.
 * The browser only lets audio start after the player has interacted with the
 * page, which they always have (they tapped to start), so no unlock dance is
 * needed.
 */

/** A one-shot effect. */
export type OneShot =
  "shot" | "rocket" | "enemyDown" | "playerDown" | "roundStart";

/** The sub-path the site is served from, so the file URLs are right on Pages. */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** The file name of each sound, under the sounds folder. */
const FILES: Readonly<Record<OneShot | "move", string>> = {
  shot: "shot.mp3",
  rocket: "rocket.mp3",
  enemyDown: "enemy-down.mp3",
  playerDown: "player-down.mp3",
  roundStart: "round-start.mp3",
  move: "move.mp3",
};

/** The full URL of a sound file. */
function urlOf(file: string): string {
  return `${BASE_PATH}/panzerkiste/sounds/${file}`;
}

/** Plays the game's sound effects; every method is safe to call on the server. */
export type SoundPlayer = {
  /** Plays a one-shot effect once. */
  play(sound: OneShot): void;
  /** Turns the looping "own tank moving" hum on or off. */
  setMoving(on: boolean): void;
  /** Stops everything and releases the looping element. */
  dispose(): void;
};

/** A player that does nothing, for the server render. */
const SILENT: SoundPlayer = {
  play(): void {},
  setMoving(): void {},
  dispose(): void {},
};

/**
 * Creates a sound player bound to the browser's audio.
 *
 * @returns a player, or a silent stand-in when there is no Audio (server-side)
 */
export function createSoundPlayer(): SoundPlayer {
  if (typeof Audio === "undefined") {
    return SILENT;
  }

  const move = new Audio(urlOf(FILES.move));
  move.loop = true;
  let moving = false;

  return {
    play(sound: OneShot): void {
      const element = new Audio(urlOf(FILES[sound]));
      void element.play().catch(() => {
        // A missing or still-empty placeholder file: stay silent.
      });
    },
    setMoving(on: boolean): void {
      if (on !== moving) {
        moving = on;
        if (on) {
          void move.play().catch(() => {});
        } else {
          move.pause();
        }
      }
    },
    dispose(): void {
      move.pause();
      moving = false;
    },
  };
}
