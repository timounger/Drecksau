/**
 * The controls of a drive: keyboard, on-screen buttons and the gear keys.
 *
 * @module
 * @remarks
 * Split out of the game loop because two loops need it - the solo game and the
 * online co-op - and because it is the one part of the input that is worth
 * testing on its own. Nothing here knows about the world: it turns keys and
 * taps into an {@link Input}, and what that input then does is the engine's
 * business.
 *
 * Two kinds of control live side by side. Held keys ("I am pressing the pedal")
 * are read afresh every frame. Pressed keys ("put third gear in") are edges:
 * they are remembered until the next frame reads them and are cleared by that
 * read, so one press is one gear change however long the key is held down.
 */
import { GEARS, REVERSE, type Input } from "@/games/rv-there-yet/engine/types";

/**
 * The keys.
 *
 * @remarks
 * `W` and `S` are always "the thing in front of you": the pedals in the cab,
 * the winch remote on foot. `A` and `D` are always your feet. The two never
 * apply at the same time, so no key does two jobs at once.
 */
const PEDAL_UP_KEYS = new Set(["w", "arrowup"]);
const PEDAL_DOWN_KEYS = new Set(["s", "arrowdown"]);
const WALK_RIGHT_KEYS = new Set(["d", "arrowright"]);
const WALK_LEFT_KEYS = new Set(["a", "arrowleft"]);
const SPRINT_KEYS = new Set(["shift"]);
const HOOK_KEYS = new Set([" ", "space"]);
const DOOR_KEYS = new Set(["e"]);
/**
 * Picking a thing up.
 *
 * @remarks
 * `F` because that is where a hand already is and where players already look
 * for it: in most games `E` uses a thing and `F` picks one up. Here `E` opens
 * the door, so `F` is the one left - and the one nobody has to be told.
 */
const TAKE_KEYS = new Set(["f"]);

/**
 * Which gear each key puts in.
 *
 * @remarks
 * Built from the gearbox itself rather than typed out, so a sixth gear would
 * come with its key already attached.
 */
const GEAR_KEYS: ReadonlyMap<string, number> = new Map(
  GEARS.map((entry, index) => [entry.label.toLowerCase(), index + REVERSE]),
);

/** The buttons a phone gets instead of a keyboard. */
export type TouchButton =
  "forward" | "back" | "wind" | "windOut" | "sprint" | "hook" | "take" | "door";

/** What a key listener needs from the window it listens on. */
export type KeyTarget = {
  addEventListener(type: string, handler: (event: Event) => void): void;
  removeEventListener(type: string, handler: (event: Event) => void): void;
};

/** Reading and holding the controls of one drive. */
export type Controls = {
  /**
   * The input for this frame, and the end of any presses it carries.
   *
   * @param inside - whether the player is in the cab: it decides what W and S
   * mean, since the pedals and the winch remote share them
   */
  readonly read: (inside: boolean) => Input;
  /** Presses or releases one of the on-screen buttons. */
  readonly press: (button: TouchButton, down: boolean) => void;
  /** Puts a gear in, as the gear buttons on screen do. */
  readonly shift: (gear: number) => void;
  /** Drops any pending press, for a loop that is not running. */
  readonly forget: () => void;
  /** Starts listening for keys, and returns the way to stop again. */
  readonly listen: (target: KeyTarget) => () => void;
};

/**
 * Builds a fresh set of controls with nothing pressed.
 *
 * @returns the controls
 */
export function createControls(): Controls {
  const held = new Set<string>();
  const touch = {
    forward: false,
    back: false,
    hook: false,
    wind: false,
    windOut: false,
    sprint: false,
  };
  let hookPending = false;
  let takePending = false;
  let doorPending = false;
  let shiftPending: number | null = null;

  const anyHeld = (keys: ReadonlySet<string>): boolean => {
    let found = false;
    for (const key of keys) {
      if (held.has(key)) {
        found = true;
      }
    }
    return found;
  };

  const forget = () => {
    hookPending = false;
    takePending = false;
    doorPending = false;
    shiftPending = null;
  };

  return {
    read: (inside: boolean): Input => {
      const ahead = inside ? PEDAL_UP_KEYS : WALK_RIGHT_KEYS;
      const behind = inside ? PEDAL_DOWN_KEYS : WALK_LEFT_KEYS;
      const forward = touch.forward || anyHeld(ahead);
      const back = touch.back || anyHeld(behind);
      const input: Input = {
        drive: Number(forward) - Number(back),
        // The remote only works in a hand, and hands are not on the wheel.
        wind: inside ? 0 : windOf(anyHeld, touch),
        hook: hookPending,
        take: takePending,
        work: touch.hook || anyHeld(HOOK_KEYS),
        door: doorPending,
        sprint: touch.sprint || anyHeld(SPRINT_KEYS),
        shift: shiftPending,
      };
      forget();
      return input;
    },
    press: (button, down) => {
      if (button === "hook") {
        // Both at once: a tap ties the rope, a long press hammers.
        touch.hook = down;
        if (down) {
          hookPending = true;
        }
      } else if (button === "take") {
        if (down) {
          takePending = true;
        }
      } else if (button === "door") {
        if (down) {
          doorPending = true;
        }
      } else {
        touch[button] = down;
      }
    },
    shift: (gear) => {
      shiftPending = gear;
    },
    forget,
    listen: (target) => {
      const onKeyDown = (event: Event) => {
        const key = (event as KeyboardEvent).key.toLowerCase();
        if (HOOK_KEYS.has(key)) {
          // Space scrolls the page otherwise, which on a canvas game is fatal.
          event.preventDefault();
          hookPending = true;
        }
        if (TAKE_KEYS.has(key)) {
          takePending = true;
        }
        if (DOOR_KEYS.has(key)) {
          doorPending = true;
        }
        const gear = GEAR_KEYS.get(key);
        if (gear !== undefined) {
          shiftPending = gear;
        }
        held.add(key);
      };
      const onKeyUp = (event: Event) => {
        held.delete((event as KeyboardEvent).key.toLowerCase());
      };
      // A window that loses focus never sends the key-up, so a pedal would
      // stay down for good: let go of everything instead.
      const onBlur = () => held.clear();
      target.addEventListener("keydown", onKeyDown);
      target.addEventListener("keyup", onKeyUp);
      target.addEventListener("blur", onBlur);
      return () => {
        target.removeEventListener("keydown", onKeyDown);
        target.removeEventListener("keyup", onKeyUp);
        target.removeEventListener("blur", onBlur);
      };
    },
  };
}

/**
 * Which way the remote is being worked: 1 reels in, -1 pays out, 0 nothing.
 *
 * @param anyHeld - whether any of a set of keys is down
 * @param touch - the on-screen buttons
 * @returns the direction the winch is being run in
 * @remarks
 * Reeling in wins when both are pressed - a rope that pays out when you meant
 * to pull is the more expensive mistake of the two.
 */
function windOf(
  anyHeld: (keys: ReadonlySet<string>) => boolean,
  touch: { readonly wind: boolean; readonly windOut: boolean },
): number {
  const inward = touch.wind || anyHeld(PEDAL_UP_KEYS);
  const outward = touch.windOut || anyHeld(PEDAL_DOWN_KEYS);
  if (inward) {
    return 1;
  }
  return outward ? -1 : 0;
}
