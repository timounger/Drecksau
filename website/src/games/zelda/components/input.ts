/**
 * The controls: keyboard, mouse, the on-screen buttons and a gamepad, folded
 * into the one {@link Input} the engine reads.
 *
 * @module
 */
import type {
  Input,
  PointerClick,
  ScreenPoint,
} from "@/games/zelda/engine/types";

/** What the touch buttons currently hold - written by the touch pad. */
export type TouchState = {
  moveX: number;
  moveY: number;
  a: boolean;
  b: boolean;
  r: boolean;
  start: boolean;
};

/**
 * The held-key code of a mouse button, so a click counts like a key.
 *
 * @param button - `MouseEvent.button`: 0 left, 2 right
 * @returns the code, as the key table lists it
 */
export function mouseCode(button: number): string {
  return `Mouse${String(button)}`;
}

/** The key that pauses the game and opens the save menu. */
export const PAUSE_KEY = "Escape";

/** Which key does what, by `KeyboardEvent.code` - or a mouse button. */
const KEYS = {
  up: ["ArrowUp", "KeyW"],
  down: ["ArrowDown", "KeyS"],
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  a: ["KeyJ", "Space", "Mouse0"],
  b: ["KeyK", "Mouse2"],
  r: ["KeyL", "ShiftLeft", "ShiftRight"],
  start: ["Enter", "KeyI"],
} as const;

/** Every key the game uses, so the page does not scroll on them. */
export const GAME_KEYS: ReadonlySet<string> = new Set(
  Object.values(KEYS).flat(),
);

/** A stick pushed less than this counts as centred. */
const STICK_DEADZONE = 0.25;

/* eslint-disable @typescript-eslint/no-magic-numbers -- button numbers of
   the standard gamepad layout. */
/** Standard gamepad layout: which button index does what. */
const PAD = {
  a: [0],
  b: [1, 2],
  r: [4, 5, 6, 7],
  start: [9, 8],
  up: 12,
  down: 13,
  left: 14,
  right: 15,
} as const;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * An empty touch state.
 *
 * @returns nothing pressed
 */
export function createTouchState(): TouchState {
  return { moveX: 0, moveY: 0, a: false, b: false, r: false, start: false };
}

/** Mouse clicks on the picture still waiting for the engine, and where the mouse is. */
export type PointerState = {
  /** Clicks in the order they happened; each step takes the oldest. */
  readonly clicks: PointerClick[];
  /** Where the mouse points on the picture, or null when it is elsewhere. */
  hover: ScreenPoint | null;
};

/**
 * An empty mouse state.
 *
 * @returns no clicks, the mouse nowhere
 */
export function createPointerState(): PointerState {
  return { clicks: [], hover: null };
}

/** The touch buttons' state behind a setter, owned by the game hook. */
export type TouchControls = {
  /** Changes what the buttons hold. */
  readonly set: (patch: Partial<TouchState>) => void;
  /** What they hold now. */
  readonly current: () => TouchState;
};

/**
 * Creates the touch buttons' state.
 *
 * @returns the setter and the reader
 */
export function createTouchControls(): TouchControls {
  const state = createTouchState();
  return {
    set: (patch) => {
      Object.assign(state, patch);
    },
    current: () => state,
  };
}

/**
 * Merges the keyboard, the mouse, the touch buttons and the first gamepad.
 *
 * @param keys - the codes of the keys held right now
 * @param touch - the touch buttons
 * @param pointer - the mouse; the oldest waiting click is taken out of it
 * @returns this step's input
 */
export function readInput(
  keys: ReadonlySet<string>,
  touch: TouchState,
  pointer: PointerState,
): Input {
  const held = (names: readonly string[]) =>
    names.some((name) => keys.has(name));
  const pad = firstPad();
  const button = (indices: readonly number[]) =>
    pad !== null &&
    indices.some((index) => pad.buttons[index]?.pressed === true);
  let moveX =
    (held(KEYS.right) ? 1 : 0) - (held(KEYS.left) ? 1 : 0) + touch.moveX;
  let moveY = (held(KEYS.down) ? 1 : 0) - (held(KEYS.up) ? 1 : 0) + touch.moveY;
  if (pad !== null) {
    const ax = pad.axes[0] ?? 0;
    const ay = pad.axes[1] ?? 0;
    moveX += Math.abs(ax) > STICK_DEADZONE ? ax : 0;
    moveY += Math.abs(ay) > STICK_DEADZONE ? ay : 0;
    moveX += (button([PAD.right]) ? 1 : 0) - (button([PAD.left]) ? 1 : 0);
    moveY += (button([PAD.down]) ? 1 : 0) - (button([PAD.up]) ? 1 : 0);
  }
  return {
    moveX: Math.max(-1, Math.min(1, moveX)),
    moveY: Math.max(-1, Math.min(1, moveY)),
    a: held(KEYS.a) || touch.a || button(PAD.a),
    b: held(KEYS.b) || touch.b || button(PAD.b),
    r: held(KEYS.r) || touch.r || button(PAD.r),
    start: held(KEYS.start) || touch.start || button(PAD.start),
    click: pointer.clicks.shift() ?? null,
    hover: pointer.hover,
  };
}

/**
 * Key and mouse button changes waiting for the simulation, so that every
 * press and every release is seen by at least one step.
 *
 * @remarks
 * Keys change between frames, steps read them once each. Without the queue
 * a button let go and pressed again before the next step looked held the
 * whole time - a fast clicker could charge the sword (and spin) by clicking.
 */
export type KeyQueue = {
  /** Changes in the order they happened. */
  readonly events: { readonly code: string; readonly down: boolean }[];
  /** The state each code ends up in once the queue is through. */
  readonly wanted: Map<string, boolean>;
};

/**
 * Creates an empty key queue.
 *
 * @returns nothing waiting
 */
export function createKeyQueue(): KeyQueue {
  return { events: [], wanted: new Map() };
}

/**
 * Queues a key or mouse button going down or up; repeats of the same state
 * are dropped.
 *
 * @param queue - the queue
 * @param code - the key code, or a mouse code
 * @param down - pressed or let go
 */
export function queueKey(queue: KeyQueue, code: string, down: boolean): void {
  if ((queue.wanted.get(code) ?? false) !== down) {
    queue.wanted.set(code, down);
    queue.events.push({ code, down });
  }
}

/**
 * Hands the next changes to the held keys before a step: in order, but each
 * code changes at most once per step, so a short tap or a short let-go
 * lasts at least one step.
 *
 * @param queue - the queue
 * @param keys - the codes held, as the steps see them; changed in place
 */
export function applyKeys(queue: KeyQueue, keys: Set<string>): void {
  const changed = new Set<string>();
  let blocked = false;
  while (queue.events.length > 0 && !blocked) {
    const next = queue.events[0];
    blocked = changed.has(next.code);
    if (!blocked) {
      queue.events.shift();
      changed.add(next.code);
      if (next.down) {
        keys.add(next.code);
      } else {
        keys.delete(next.code);
      }
    }
  }
}

/**
 * Lets go of everything at once, waiting or held.
 *
 * @param queue - the queue
 * @param keys - the codes held; emptied
 */
export function clearKeys(queue: KeyQueue, keys: Set<string>): void {
  queue.events.length = 0;
  queue.wanted.clear();
  keys.clear();
}

/** The first connected gamepad, if the browser offers any. */
function firstPad(): Gamepad | null {
  let found: Gamepad | null = null;
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.getGamepads === "function"
  ) {
    for (const pad of navigator.getGamepads()) {
      if (found === null && pad !== null && pad.connected) {
        found = pad;
      }
    }
  }
  return found;
}
