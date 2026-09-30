/**
 * Die Tastatur, übersetzt in das, was das Boot tun soll.
 *
 * @module
 * @remarks
 * Nothing in here knows about the world; it collects what is held down and
 * hands out an {@link Input} when the loop asks for one. Held rather than
 * pressed, all four of them: a submarine has no buttons, it has a throttle and
 * a pair of dive planes, and you are either pushing them or you are not.
 *
 * Zeiger und Daumen wohnen nebenan ({@link ./touch-controls}) und werden in der
 * Schleife dazugemischt - die Engine erfährt nie, was gedrückt wurde. Gezielt
 * wird dort, hier nicht: Eine Tastatur hat keinen Ort, auf den sie deuten kann,
 * also schießt sie geradeaus.
 */
import type { Input } from "@/games/uboot/engine/types";

/** The keys, lower case - the letters and the arrows do the same thing. */
const UP_KEYS = new Set(["w", "arrowup"]);
const DOWN_KEYS = new Set(["s", "arrowdown"]);
const BACK_KEYS = new Set(["a", "arrowleft"]);
const FORWARD_KEYS = new Set(["d", "arrowright"]);
/**
 * And the trigger.
 *
 * @remarks
 * The space bar, which is where shooting has lived since before any of this,
 * and the one key a hand on WASD can reach without letting go of anything.
 */
const FIRE_KEYS = new Set([" ", "space", "spacebar"]);

/**
 * Und der Ablegehebel für die Seeminen.
 *
 * @remarks
 * Eigentlich liegt die Seemine auf der rechten Maustaste. Wer aber ohnehin die
 * Finger auf WASD hat, greift mit demselben Finger nach oben, statt die Hand zu
 * wechseln - das Q liegt direkt über dem A.
 */
const DROP_KEYS = new Set(["q"]);

/** Keys the page must not act on itself while the game has them. */
const SWALLOWED = new Set([
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  " ",
]);

/** What the loop uses to find out what the player wants. */
export type Controls = {
  /** Starts listening, and gives back the way to stop. */
  readonly listen: (target: Window) => () => void;
  /** What is being asked for right now. */
  readonly read: () => Input;
  /** Lets go of everything - for when the dive is over. */
  readonly forget: () => void;
};

/**
 * Makes a fresh set of controls.
 *
 * @returns the controls, listening to nothing yet
 */
export function createControls(): Controls {
  const held = new Set<string>();

  const down = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    held.add(key);
    if (SWALLOWED.has(key)) {
      event.preventDefault();
    }
  };
  const up = (event: KeyboardEvent) => {
    held.delete(event.key.toLowerCase());
  };
  // A window that loses focus never sees the key come back up, and a boat
  // stuck at full ahead while you alt-tab is a boat you come back to in
  // pieces.
  const blur = () => {
    held.clear();
  };

  return {
    listen: (target: Window) => {
      target.addEventListener("keydown", down);
      target.addEventListener("keyup", up);
      target.addEventListener("blur", blur);
      return () => {
        target.removeEventListener("keydown", down);
        target.removeEventListener("keyup", up);
        target.removeEventListener("blur", blur);
      };
    },
    read: () => ({
      up: any(held, UP_KEYS),
      down: any(held, DOWN_KEYS),
      back: any(held, BACK_KEYS),
      forward: any(held, FORWARD_KEYS),
      fire: any(held, FIRE_KEYS),
      drop: any(held, DROP_KEYS),
      aim: null,
    }),
    forget: blur,
  };
}

/** Whether any of those keys is held. */
function any(held: ReadonlySet<string>, keys: ReadonlySet<string>): boolean {
  let found = false;
  for (const key of keys) {
    if (held.has(key)) {
      found = true;
      break;
    }
  }
  return found;
}
