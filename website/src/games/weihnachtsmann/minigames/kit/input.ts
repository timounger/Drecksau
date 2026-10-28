/**
 * Turning keys, gamepad, touch buttons and the pointer into the input a
 * minigame reads each step.
 *
 * @module
 */
import {
  STICK_DEADZONE,
  firstPad,
  type Controls,
} from "@/games/weihnachtsmann/components/input";
import type { MiniButton, MiniInput, MiniPoint } from "../types";

/** The key that leaves a minigame. */
export const LEAVE_KEY = "Escape";

/** Keys a minigame uses, so the page neither scrolls nor jumps on them. */
export const MINI_KEYS: ReadonlySet<string> = new Set([
  LEAVE_KEY,
  "Space",
  "Enter",
  "NumpadEnter",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Tab",
  "Backspace",
]);

/** Which keys stand for which button. */
const BUTTON_KEYS: Readonly<Record<MiniButton, readonly string[]>> = {
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  up: ["ArrowUp", "KeyW"],
  down: ["ArrowDown", "KeyS"],
  action: ["Space", "Enter", "NumpadEnter", "KeyF"],
  alt: ["KeyR", "ShiftLeft", "ShiftRight"],
};

/** Standard gamepad layout: which button index means what. */
const PAD_BUTTONS: Readonly<Record<MiniButton, number>> = {
  action: 0,
  alt: 1,
  up: 12,
  down: 13,
  left: 14,
  right: 15,
};

/** Standard gamepad Back / Select and Start buttons. */
const PAD_BACK = 8;
const PAD_START = 9;

/** The gamepad buttons that leave: Back / Select and Start. */
const PAD_LEAVE: readonly number[] = [PAD_BACK, PAD_START];

/** Every button, in a fixed order. */
const BUTTONS: readonly MiniButton[] = [
  "left",
  "right",
  "up",
  "down",
  "action",
  "alt",
];

/** The pointer and the touch buttons, kept by the screen between steps. */
export type PointerState = {
  /** Last place on the field, or null when unknown. */
  point: MiniPoint | null;
  down: boolean;
  /** Presses since the last step, on the field. */
  readonly taps: MiniPoint[];
  /** Touch buttons pressed since the last step. */
  readonly buttons: Set<MiniButton>;
  /** Touch "back" pressed since the last step. */
  leave: boolean;
  /** The axes of the last step, so pushing the pad counts as a press. */
  lastX: number;
  lastY: number;
};

/**
 * An empty pointer state.
 *
 * @returns nothing pressed, nowhere
 */
export function createPointerState(): PointerState {
  return {
    point: null,
    down: false,
    taps: [],
    buttons: new Set(),
    leave: false,
    lastX: 0,
    lastY: 0,
  };
}

/**
 * Reads the input for one minigame step; taps and presses are used up.
 *
 * @param controls - the keys, touch pad and gamepad memory of the screen
 * @param pointer - the pointer and touch buttons
 * @returns what the minigame sees
 */
export function readMiniInput(
  controls: Controls,
  pointer: PointerState,
): MiniInput {
  const keys = new Set(controls.held);
  const keysPressed = new Set(controls.tapped);
  controls.tapped.clear();
  const pad = firstPad();
  const padNow = new Set<number>();
  pad?.buttons.forEach((button, index) => {
    if (button.pressed) {
      padNow.add(index);
    }
  });
  const fresh = (index: number) =>
    padNow.has(index) && !controls.padPressed.has(index);
  controls.padPressed = padNow;
  const held = new Set<MiniButton>(pointer.buttons);
  if (controls.touch.action) {
    held.add("action");
  }
  if (controls.touch.alt) {
    held.add("alt");
  }
  const pressed = new Set<MiniButton>(pointer.buttons);
  for (const button of BUTTONS) {
    const codes = BUTTON_KEYS[button];
    if (
      codes.some((code) => keys.has(code)) ||
      padNow.has(PAD_BUTTONS[button])
    ) {
      held.add(button);
    }
    if (
      codes.some((code) => keysPressed.has(code)) ||
      fresh(PAD_BUTTONS[button])
    ) {
      pressed.add(button);
      held.add(button);
    }
  }
  if (pointer.leave || PAD_LEAVE.some(fresh)) {
    keysPressed.add(LEAVE_KEY);
  }
  const stickX = pad?.axes[0] ?? 0;
  const stickY = pad?.axes[1] ?? 0;
  const axisX =
    (held.has("right") ? 1 : 0) -
    (held.has("left") ? 1 : 0) +
    controls.touch.moveX +
    (Math.abs(stickX) > STICK_DEADZONE ? stickX : 0);
  const axisY =
    (held.has("down") ? 1 : 0) -
    (held.has("up") ? 1 : 0) +
    controls.touch.moveY +
    (Math.abs(stickY) > STICK_DEADZONE ? stickY : 0);
  const clampedX = Math.max(-1, Math.min(1, axisX));
  const clampedY = Math.max(-1, Math.min(1, axisY));
  // The touch pad and the stick count as held arrows, too, and pushing them
  // as a press.
  addAxis(held, pressed, clampedX, pointer.lastX, "left", "right");
  addAxis(held, pressed, clampedY, pointer.lastY, "up", "down");
  pointer.lastX = clampedX;
  pointer.lastY = clampedY;
  const input: MiniInput = {
    held,
    pressed,
    axisX: clampedX,
    axisY: clampedY,
    keys,
    keysPressed,
    pointer: pointer.point,
    pointerDown: pointer.down,
    taps: pointer.taps.splice(0),
  };
  pointer.buttons.clear();
  pointer.leave = false;
  return input;
}

/** Counts a pushed axis as a held arrow, and newly pushed as a press. */
function addAxis(
  held: Set<MiniButton>,
  pressed: Set<MiniButton>,
  axis: number,
  last: number,
  low: MiniButton,
  high: MiniButton,
): void {
  if (axis < -STICK_DEADZONE) {
    held.add(low);
    if (last >= -STICK_DEADZONE) {
      pressed.add(low);
    }
  }
  if (axis > STICK_DEADZONE) {
    held.add(high);
    if (last <= STICK_DEADZONE) {
      pressed.add(high);
    }
  }
}
