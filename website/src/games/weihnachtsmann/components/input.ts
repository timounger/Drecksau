/**
 * The controls: keys held for walking, keys pressed for commands, the
 * gamepad and the touch buttons, turned into what the engine reads.
 *
 * @module
 */
import {
  ANIMAL_IDS,
  type Action,
  type Input,
} from "@/games/weihnachtsmann/engine/types";

/** Keys held for walking, by `KeyboardEvent.code`. */
const MOVE_KEYS = {
  up: ["ArrowUp", "KeyW"],
  down: ["ArrowDown", "KeyS"],
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
} as const;

/** Keys that use the ability. */
const ABILITY_KEYS: ReadonlySet<string> = new Set(["Space", "KeyF", "KeyT"]);

/** Keys that confirm in the animal choice. */
const CONFIRM_KEYS: ReadonlySet<string> = new Set([
  "Space",
  "KeyF",
  "Enter",
  "NumpadEnter",
]);

/** Keys that close the animal choice. */
const CLOSE_KEYS: ReadonlySet<string> = new Set(["Escape", "KeyT"]);

/** Every key the game uses, so the page does not scroll on them. */
export const GAME_KEYS: ReadonlySet<string> = new Set([
  ...Object.values(MOVE_KEYS).flat(),
  ...ABILITY_KEYS,
  "Tab",
  "KeyQ",
  "KeyE",
  "KeyR",
  "Enter",
]);

/** A stick pushed less than this counts as centred. */
export const STICK_DEADZONE = 0.25;

/** How many animals a row of the choice holds, for up and down. */
const MENU_ROW = 3;

/** Standard gamepad layout: which button index does what. */
const PAD = {
  ability: 0,
  talk: 1,
  back: 2,
  previous: 4,
  next: 5,
  up: 12,
  down: 13,
  left: 14,
  right: 15,
} as const;

/** How many steps a tap on the touch button "Hinein" pushes towards a door. */
export const NUDGE_STEPS = 10;

/** What the touch controls hold - written by the touch pad. */
export type TouchState = {
  /** The stick, each axis -1 to 1 (analog). */
  moveX: number;
  moveY: number;
  /** Whether the touch button "Aktion" is held, for a minigame. */
  action: boolean;
  /** Whether the touch button "Taste 2" is held, for a minigame. */
  alt: boolean;
};

/** A short push towards a door or gate, from the touch button "Hinein". */
export type Nudge = { x: number; y: number; steps: number };

/** The keys held and the gamepad buttons seen last step. */
export type Controls = {
  /** Codes held right now. */
  readonly held: Set<string>;
  /** Codes pressed since the last step - so a short tap still counts once. */
  readonly tapped: Set<string>;
  readonly touch: TouchState;
  /** A push towards a door still to come, from the touch button "Hinein". */
  readonly nudge: Nudge;
  /** Gamepad buttons pressed during the last step. */
  padPressed: ReadonlySet<number>;
};

/**
 * Empty controls.
 *
 * @returns nothing held
 */
export function createControls(): Controls {
  return {
    held: new Set(),
    tapped: new Set(),
    touch: { moveX: 0, moveY: 0, action: false, alt: false },
    nudge: { x: 0, y: 0, steps: 0 },
    padPressed: new Set(),
  };
}

/**
 * The command a key press means, if any.
 *
 * @param code - `KeyboardEvent.code`
 * @param shift - whether Shift is held, for Tab backwards
 * @param menuOpen - whether the animal choice is open
 * @returns the command, or null when the key only walks or does nothing
 */
export function keyAction(
  code: string,
  shift: boolean,
  menuOpen: boolean,
): Action | null {
  let action: Action | null = null;
  const digit = digitOf(code);
  if (menuOpen) {
    if (digit !== null && digit <= ANIMAL_IDS.length) {
      action = { kind: "menuPick", index: digit - 1 };
    } else if (CONFIRM_KEYS.has(code)) {
      action = { kind: "ability" };
    } else if (CLOSE_KEYS.has(code)) {
      action = { kind: "menuClose" };
    } else if (MOVE_KEYS.left.some((key) => key === code)) {
      action = { kind: "menuMove", delta: -1 };
    } else if (MOVE_KEYS.right.some((key) => key === code)) {
      action = { kind: "menuMove", delta: 1 };
    } else if (MOVE_KEYS.up.some((key) => key === code)) {
      action = { kind: "menuMove", delta: -MENU_ROW };
    } else if (MOVE_KEYS.down.some((key) => key === code)) {
      action = { kind: "menuMove", delta: MENU_ROW };
    }
  } else if (digit !== null) {
    action = { kind: "select", index: digit - 1 };
  } else if (code === "Tab") {
    action = { kind: "cycle", delta: shift ? -1 : 1 };
  } else if (code === "KeyQ") {
    action = { kind: "cycle", delta: -1 };
  } else if (code === "KeyE") {
    action = { kind: "cycle", delta: 1 };
  } else if (ABILITY_KEYS.has(code)) {
    action = { kind: "ability" };
  } else if (code === "KeyR") {
    action = { kind: "talk" };
  }
  return action;
}

/**
 * Reads the held controls for one step, and the commands of gamepad buttons
 * pressed since the last.
 *
 * @param controls - keys, touch and the gamepad memory; taps are used up
 * @param menuOpen - whether the animal choice is open
 * @returns the held input and new commands
 */
export function readControls(
  controls: Controls,
  menuOpen: boolean,
): { readonly input: Input; readonly actions: readonly Action[] } {
  const keys = new Set([...controls.held, ...controls.tapped]);
  controls.tapped.clear();
  const held = (names: readonly string[]) =>
    names.some((name) => keys.has(name));
  let moveX =
    (held(MOVE_KEYS.right) ? 1 : 0) -
    (held(MOVE_KEYS.left) ? 1 : 0) +
    controls.touch.moveX;
  let moveY =
    (held(MOVE_KEYS.down) ? 1 : 0) -
    (held(MOVE_KEYS.up) ? 1 : 0) +
    controls.touch.moveY;
  if (controls.nudge.steps > 0) {
    controls.nudge.steps -= 1;
    moveX += controls.nudge.x;
    moveY += controls.nudge.y;
  }
  const actions: Action[] = [];
  const pad = firstPad();
  const pressed = new Set<number>();
  if (pad !== null) {
    pad.buttons.forEach((button, index) => {
      if (button.pressed) {
        pressed.add(index);
      }
    });
    const ax = pad.axes[0] ?? 0;
    const ay = pad.axes[1] ?? 0;
    moveX += Math.abs(ax) > STICK_DEADZONE ? ax : 0;
    moveY += Math.abs(ay) > STICK_DEADZONE ? ay : 0;
    moveX += (pressed.has(PAD.right) ? 1 : 0) - (pressed.has(PAD.left) ? 1 : 0);
    moveY += (pressed.has(PAD.down) ? 1 : 0) - (pressed.has(PAD.up) ? 1 : 0);
    const fresh = (index: number) =>
      pressed.has(index) && !controls.padPressed.has(index);
    actions.push(...padActions(fresh, menuOpen));
  }
  controls.padPressed = pressed;
  return {
    input: {
      moveX: Math.max(-1, Math.min(1, moveX)),
      moveY: Math.max(-1, Math.min(1, moveY)),
    },
    actions,
  };
}

/**
 * The first connected gamepad, if the browser offers any.
 *
 * @returns the pad, or null
 */
export function firstPad(): Gamepad | null {
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

/** The commands of freshly pressed gamepad buttons. */
function padActions(
  fresh: (index: number) => boolean,
  menuOpen: boolean,
): Action[] {
  const actions: Action[] = [];
  if (fresh(PAD.ability)) {
    actions.push({ kind: "ability" });
  }
  if (menuOpen) {
    if (fresh(PAD.talk) || fresh(PAD.back)) {
      actions.push({ kind: "menuClose" });
    }
    if (fresh(PAD.left)) {
      actions.push({ kind: "menuMove", delta: -1 });
    }
    if (fresh(PAD.right)) {
      actions.push({ kind: "menuMove", delta: 1 });
    }
  } else {
    if (fresh(PAD.talk)) {
      actions.push({ kind: "talk" });
    }
    if (fresh(PAD.previous)) {
      actions.push({ kind: "cycle", delta: -1 });
    }
    if (fresh(PAD.next)) {
      actions.push({ kind: "cycle", delta: 1 });
    }
  }
  return actions;
}

/** The number 1 to 9 a digit key stands for, or null. */
function digitOf(code: string): number | null {
  const match = /^(?:Digit|Numpad)([1-9])$/.exec(code);
  return match === null ? null : Number(match[1]);
}
