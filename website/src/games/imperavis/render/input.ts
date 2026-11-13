/**
 * All input of the IMPERAVIS map in one place: the mouse buttons, touch,
 * the wheel, the keys and the screen edges. It tells a click from a drag,
 * keeps the UI and the browser out of the map's way and hands the view
 * plain gestures, camera wishes and shortcut actions.
 *
 * @module
 * @remarks
 * Every listener is added here and removed again in `dispose`, so no other
 * part of the game listens to the keys or the canvas. Shortcuts never fire
 * in form fields, in an open dialog or with a browser combination held
 * (Ctrl, Meta, Alt) - except Ctrl plus a digit, which stores a control
 * group.
 */
import type { CameraMotion } from "./camera";

/** Pixels a press may move and still be a click. */
const CLICK_SLOP = 6;

/** The mouse buttons by `PointerEvent.button`. */
const PRIMARY = 0;
const MIDDLE = 1;
const SECONDARY = 2;

/** The bit of each button in `PointerEvent.buttons`, by `button`. */
const BUTTON_BITS: Readonly<Record<number, number>> = {
  [PRIMARY]: 1,
  [SECONDARY]: 2,
  [MIDDLE]: 4,
};

/** Pixels in a line and a page of wheel travel (`deltaMode` 1 and 2). */
const WHEEL_LINE = 16;
const WHEEL_PAGE = 800;

/** `WheelEvent.deltaMode` of lines and of pages. */
const DELTA_LINE = 1;
const DELTA_PAGE = 2;

/** Pixels from the edge of the map where the screen edge moves the camera. */
const EDGE_ZONE = 18;

/** Highest control group. */
const GROUPS = 9;

/** Keys that move the camera, by `KeyboardEvent.code` (layout independent). */
const MOVE_KEYS = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyQ",
  "KeyE",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

/** Elements that take typed text. */
const FIELDS = new Set(["INPUT", "SELECT", "TEXTAREA"]);

/** Elements that use Space, Enter and Tab themselves. */
const CONTROLS = new Set(["BUTTON", "A", "SUMMARY", "INPUT", "SELECT"]);

/** Modifier keys held with a click or the wheel. */
export type Modifiers = {
  readonly shift: boolean;
  readonly ctrl: boolean;
};

/** A shortcut the game acts on. */
export type InputAction =
  /** Esc: cancel a tool, close a window, drop the selection or the menu. */
  | { readonly type: "escape" }
  /** Space: pause or go on. */
  | { readonly type: "pause" }
  /** Plus and minus: a speed up or down. */
  | { readonly type: "speed"; readonly step: number }
  /** R or Shift + wheel: turn the building being placed. */
  | { readonly type: "rotate"; readonly step: number }
  /** T: the road tool; Shift + T: the paving tool. */
  | { readonly type: "road"; readonly pave: boolean }
  /** X or Delete: the demolish tool. */
  | { readonly type: "demolish" }
  /** B: the build menu. */
  | { readonly type: "buildMenu" }
  /** Tab and Shift + Tab: the next or previous unit. */
  | { readonly type: "cycle"; readonly step: number }
  /** 1 to 9: a control group; with Ctrl it is stored. */
  | { readonly type: "group"; readonly slot: number; readonly save: boolean };

/** What the input tells the view. Coordinates are client pixels. */
export type InputHandlers = {
  /** The mouse rests on or moves over the map. */
  readonly hover: (x: number, y: number) => void;
  /** The mouse left the map: for the UI or out of the window. */
  readonly leave: () => void;
  /**
   * The primary button or a finger went down on the map.
   *
   * @returns true when the view takes a following drag itself (a road);
   * otherwise a finger's drag pans the map
   */
  readonly press: (x: number, y: number, touch: boolean) => boolean;
  /** A drag of the primary button past the click distance. */
  readonly drag: (x: number, y: number, startX: number, startY: number) => void;
  /** The primary button or the finger came up; `dragged` is false for a click. */
  readonly release: (
    x: number,
    y: number,
    dragged: boolean,
    modifiers: Modifiers,
    touch: boolean,
  ) => void;
  /** A drag ends without a result (a second finger, a lost pointer). */
  readonly cancelDrag: () => void;
  /** A right click without dragging. */
  readonly secondary: (x: number, y: number, modifiers: Modifiers) => void;
  /** Move the map by pixels (middle button, one finger). */
  readonly pan: (dx: number, dy: number) => void;
  /** Turn and tilt by pixels (right button). */
  readonly turn: (dx: number, dy: number) => void;
  /** Two fingers: zoom by a factor (above 1 is farther) and turn by radians. */
  readonly pinch: (factor: number, angle: number) => void;
  /** Wheel travel in pixels over the map, positive away from the screen. */
  readonly wheel: (
    delta: number,
    x: number,
    y: number,
    modifiers: Modifiers,
  ) => void;
  /** A shortcut. */
  readonly action: (action: InputAction) => void;
};

/** The handle the view keeps. */
export type Input = {
  /** What keys and screen edges ask of the camera this frame. */
  motion(): CameraMotion;
  /** Where the mouse is over the map, or null when it is elsewhere. */
  pointer(): { readonly x: number; readonly y: number } | null;
  /**
   * Holds the map still while the pause menu covers it: only Esc counts.
   *
   * @param blocked - true while the menu is open
   */
  setBlocked(blocked: boolean): void;
  /**
   * Switches moving the camera at the screen edges.
   *
   * @param on - true to use the edges
   */
  setEdgeScroll(on: boolean): void;
  /** Removes every listener. */
  dispose(): void;
};

/** A button or finger held down on the map. */
type Press = {
  readonly id: number;
  readonly button: number;
  readonly startX: number;
  readonly startY: number;
  /** Where the last applied movement ended. */
  lastX: number;
  lastY: number;
  /** Past the click distance. */
  dragging: boolean;
  /** The view takes the drag (roads). */
  captured: boolean;
};

/** No camera movement. */
const STILL: CameraMotion = { right: 0, forward: 0, turn: 0 };

/**
 * Starts listening on a canvas and the window.
 *
 * @param canvas - the map
 * @param handlers - what to call
 * @returns the handle
 */
export function createInput(
  canvas: HTMLCanvasElement,
  handlers: InputHandlers,
): Input {
  const stage = canvas.parentElement ?? canvas;
  const held = new Set<string>();
  const touches = new Map<number, Press>();
  let mouse: Press | null = null;
  let pinch: { distance: number; angle: number } | null = null;
  /** More than one finger touched since the first went down. */
  let multi = false;
  let pointer: { x: number; y: number } | null = null;
  let blocked = false;
  let edgeScroll = true;

  const modifiers = (event: MouseEvent | KeyboardEvent): Modifiers => ({
    shift: event.shiftKey,
    ctrl: event.ctrlKey || event.metaKey,
  });

  // ---------------------------------------------------------------- mouse
  const stepMouse = (press: Press, event: PointerEvent) => {
    if (
      !press.dragging &&
      Math.hypot(event.clientX - press.startX, event.clientY - press.startY) >
        CLICK_SLOP
    ) {
      press.dragging = true;
    }
    if (press.dragging) {
      // The first step catches up the distance of the click slop.
      const dx = event.clientX - press.lastX;
      const dy = event.clientY - press.lastY;
      press.lastX = event.clientX;
      press.lastY = event.clientY;
      switch (press.button) {
        case PRIMARY:
          handlers.drag(
            event.clientX,
            event.clientY,
            press.startX,
            press.startY,
          );
          break;
        case MIDDLE:
          handlers.pan(dx, dy);
          break;
        default:
          handlers.turn(dx, dy);
      }
    }
  };

  const finishMouse = (press: Press, event: PointerEvent) => {
    mouse = null;
    if (canvas.hasPointerCapture(press.id)) {
      canvas.releasePointerCapture(press.id);
    }
    // Released over a panel: the map is no longer under the mouse.
    if (document.elementFromPoint(event.clientX, event.clientY) !== canvas) {
      pointer = null;
      handlers.leave();
    }
    if (press.button === PRIMARY) {
      handlers.release(
        event.clientX,
        event.clientY,
        press.dragging,
        modifiers(event),
        false,
      );
    } else if (press.button === SECONDARY && !press.dragging) {
      handlers.secondary(event.clientX, event.clientY, modifiers(event));
    }
  };

  // ---------------------------------------------------------------- touch
  const stepTouch = (press: Press, event: PointerEvent) => {
    const dx = event.clientX - press.lastX;
    const dy = event.clientY - press.lastY;
    press.lastX = event.clientX;
    press.lastY = event.clientY;
    if (touches.size >= 2 && pinch !== null) {
      const [a, b] = [...touches.values()];
      const distance = Math.hypot(a.lastX - b.lastX, a.lastY - b.lastY);
      const angle = Math.atan2(b.lastY - a.lastY, b.lastX - a.lastX);
      handlers.pinch(
        pinch.distance / Math.max(1, distance),
        angle - pinch.angle,
      );
      pinch = { distance, angle };
    } else {
      if (
        !press.dragging &&
        Math.hypot(event.clientX - press.startX, event.clientY - press.startY) >
          CLICK_SLOP
      ) {
        press.dragging = true;
      }
      if (press.dragging && press.captured && !multi) {
        handlers.drag(event.clientX, event.clientY, press.startX, press.startY);
      } else if (press.dragging) {
        handlers.pan(dx, dy);
      }
    }
  };

  // ---------------------------------------------------------------- pointer events
  const onPointerDown = (event: PointerEvent) => {
    const touch = event.pointerType !== "mouse";
    if (!blocked && touch) {
      canvas.setPointerCapture(event.pointerId);
      const press = newPress(event);
      touches.set(event.pointerId, press);
      if (touches.size === 1) {
        multi = false;
        press.captured = handlers.press(event.clientX, event.clientY, true);
      } else {
        multi = true;
        handlers.cancelDrag();
        const [a, b] = [...touches.values()];
        pinch = {
          distance: Math.hypot(a.lastX - b.lastX, a.lastY - b.lastY),
          angle: Math.atan2(b.lastY - a.lastY, b.lastX - a.lastX),
        };
      }
    } else if (!blocked && mouse === null && event.button <= SECONDARY) {
      // A second button pressed during a drag is ignored (no pointerdown
      // comes for it anyway).
      if (event.button === MIDDLE) {
        event.preventDefault();
      }
      canvas.setPointerCapture(event.pointerId);
      mouse = newPress(event);
      if (event.button === PRIMARY) {
        mouse.captured = handlers.press(event.clientX, event.clientY, false);
      }
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === "mouse") {
      const press = mouse;
      if (press !== null && press.id === event.pointerId) {
        // With several buttons held only the last release sends pointerup.
        if ((event.buttons & BUTTON_BITS[press.button]) === 0) {
          finishMouse(press, event);
        } else {
          stepMouse(press, event);
        }
      }
      pointer = inside(event) ? { x: event.clientX, y: event.clientY } : null;
      if (pointer === null) {
        handlers.leave();
      } else if (!blocked) {
        handlers.hover(event.clientX, event.clientY);
      }
    } else {
      const press = touches.get(event.pointerId);
      if (press !== undefined) {
        stepTouch(press, event);
      }
    }
  };

  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerType === "mouse") {
      const press = mouse;
      if (
        press !== null &&
        press.id === event.pointerId &&
        (event.buttons & BUTTON_BITS[press.button]) === 0
      ) {
        finishMouse(press, event);
      }
    } else {
      const press = touches.get(event.pointerId);
      touches.delete(event.pointerId);
      if (touches.size < 2) {
        pinch = null;
      }
      if (press !== undefined && touches.size === 0) {
        if (multi) {
          handlers.cancelDrag();
        } else {
          handlers.release(
            event.clientX,
            event.clientY,
            press.dragging,
            modifiers(event),
            true,
          );
        }
        multi = false;
      }
    }
  };

  const onPointerCancel = (event: PointerEvent) => {
    if (mouse !== null && mouse.id === event.pointerId) {
      mouse = null;
      handlers.cancelDrag();
    }
    touches.delete(event.pointerId);
    if (touches.size < 2) {
      pinch = null;
    }
    if (touches.size === 0 && event.pointerType !== "mouse") {
      handlers.cancelDrag();
      multi = false;
    }
  };

  const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && mouse === null) {
      pointer = null;
      handlers.leave();
    }
  };

  /** Whether a mouse event lies on the canvas (a captured drag may leave it). */
  const inside = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    return (
      event.clientX >= rect.left &&
      event.clientX < rect.right &&
      event.clientY >= rect.top &&
      event.clientY < rect.bottom
    );
  };

  // ---------------------------------------------------------------- wheel
  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    if (!blocked) {
      // Shift turns the wheel sideways in some browsers.
      const raw = event.deltaY !== 0 ? event.deltaY : event.deltaX;
      handlers.wheel(
        raw * wheelScale(event.deltaMode, canvas.clientHeight),
        event.clientX,
        event.clientY,
        modifiers(event),
      );
    }
  };

  /** Over the panels the wheel scrolls them - or nothing, never the page. */
  const onStageWheel = (event: WheelEvent) => {
    const target = event.target as HTMLElement | null;
    if (
      target !== canvas &&
      !scrollsWithin(target, stage, event.deltaX, event.deltaY)
    ) {
      event.preventDefault();
    }
  };

  const onContext = (event: Event) => event.preventDefault();

  /** No auto-scroll or paste on a middle click. */
  const onMouseDown = (event: MouseEvent) => {
    if (event.button === MIDDLE) {
      event.preventDefault();
    }
  };

  // ---------------------------------------------------------------- keys
  const onKeyDown = (event: KeyboardEvent) => {
    const active = document.activeElement;
    const free =
      !isField(event.target) &&
      !isField(active) &&
      document.querySelector("dialog[open]") === null;
    const combo = event.ctrlKey || event.metaKey || event.altKey;
    const digit = digitOf(event.code);
    if (!free) {
      // Typing or a dialog: the keys are not the game's.
    } else if (combo) {
      if (
        digit > 0 &&
        !event.altKey &&
        !blocked &&
        !isControl(active, canvas)
      ) {
        // Ctrl + digit would switch browser tabs.
        event.preventDefault();
        if (!event.repeat) {
          handlers.action({ type: "group", slot: digit, save: true });
        }
      }
    } else if (event.key === "Escape") {
      if (!event.repeat) {
        handlers.action({ type: "escape" });
      }
    } else if (!blocked && !isControl(active, canvas)) {
      gameKey(event, digit);
    }
  };

  /** A key while the game has the focus. */
  const gameKey = (event: KeyboardEvent, digit: number) => {
    const key = event.key.toLowerCase();
    let action: InputAction | null = null;
    if (MOVE_KEYS.has(event.code)) {
      held.add(event.code);
      if (event.code.startsWith("Arrow")) {
        event.preventDefault();
      }
    } else if (event.key === "Tab") {
      // The focus stays in the game.
      event.preventDefault();
      action = { type: "cycle", step: event.shiftKey ? -1 : 1 };
    } else if (event.code === "Space") {
      event.preventDefault();
      action = { type: "pause" };
    } else if (digit > 0) {
      action = { type: "group", slot: digit, save: false };
    } else if (key === "+" || key === "=" || event.code === "NumpadAdd") {
      action = { type: "speed", step: 1 };
    } else if (key === "-" || event.code === "NumpadSubtract") {
      action = { type: "speed", step: -1 };
    } else {
      action = letterAction(key, event.shiftKey);
    }
    if (action !== null && (!event.repeat || action.type === "cycle")) {
      handlers.action(action);
    }
  };

  const onKeyUp = (event: KeyboardEvent) => {
    held.delete(event.code);
  };

  const onBlur = () => {
    held.clear();
    pointer = null;
    handlers.leave();
  };

  const onVisibility = () => {
    if (document.hidden) {
      onBlur();
    }
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerCancel);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("auxclick", onMouseDown);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("contextmenu", onContext);
  stage.addEventListener("wheel", onStageWheel, { passive: false });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  document.addEventListener("visibilitychange", onVisibility);

  return {
    motion() {
      let motion = STILL;
      if (!blocked) {
        const has = (a: string, b: string) => held.has(a) || held.has(b);
        let right =
          (has("KeyD", "ArrowRight") ? 1 : 0) -
          (has("KeyA", "ArrowLeft") ? 1 : 0);
        let forward =
          (has("KeyW", "ArrowUp") ? 1 : 0) - (has("KeyS", "ArrowDown") ? 1 : 0);
        const edge = edgeMotion();
        right += edge.right;
        forward += edge.forward;
        // Diagonals are no faster than straight lines.
        const length = Math.max(1, Math.hypot(right, forward));
        motion = {
          right: right / length,
          forward: forward / length,
          turn: (held.has("KeyQ") ? 1 : 0) - (held.has("KeyE") ? 1 : 0),
        };
      }
      return motion;
    },
    pointer() {
      return pointer;
    },
    setBlocked(next) {
      blocked = next;
      if (next) {
        held.clear();
        mouse = null;
        handlers.cancelDrag();
      }
    },
    setEdgeScroll(on) {
      edgeScroll = on;
    },
    dispose() {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("auxclick", onMouseDown);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContext);
      stage.removeEventListener("wheel", onStageWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      held.clear();
      touches.clear();
      mouse = null;
    },
  };

  /**
   * The pull of the screen edges: only with the mouse over the map, no
   * button held, the window in focus and the setting on.
   */
  function edgeMotion(): { right: number; forward: number } {
    let right = 0;
    let forward = 0;
    if (
      edgeScroll &&
      pointer !== null &&
      mouse === null &&
      document.hasFocus() &&
      !document.hidden
    ) {
      const rect = canvas.getBoundingClientRect();
      const x = pointer.x - rect.left;
      const y = pointer.y - rect.top;
      right = edgePull(x, rect.width);
      forward = -edgePull(y, rect.height);
    }
    return { right, forward };
  }
}

/** A fresh press at a pointer event. */
function newPress(event: PointerEvent): Press {
  return {
    id: event.pointerId,
    button: event.button,
    startX: event.clientX,
    startY: event.clientY,
    lastX: event.clientX,
    lastY: event.clientY,
    dragging: false,
    captured: false,
  };
}

/**
 * How hard an edge pulls at a position: -1 at the near edge, 1 at the far
 * edge, rising softly over the edge zone, 0 in between.
 */
function edgePull(position: number, size: number): number {
  let pull = 0;
  if (position < EDGE_ZONE) {
    pull = -(1 - Math.max(0, position) / EDGE_ZONE);
  } else if (position > size - EDGE_ZONE) {
    pull = 1 - Math.max(0, size - position) / EDGE_ZONE;
  }
  return pull;
}

/** Pixels per unit of wheel travel for a `deltaMode`. */
function wheelScale(mode: number, height: number): number {
  let scale = 1;
  if (mode === DELTA_LINE) {
    scale = WHEEL_LINE;
  } else if (mode === DELTA_PAGE) {
    scale = Math.max(WHEEL_PAGE, height);
  }
  return scale;
}

/**
 * Whether some element between a target and the stage can still scroll in
 * the direction of the wheel.
 */
function scrollsWithin(
  target: HTMLElement | null,
  stage: HTMLElement,
  dx: number,
  dy: number,
): boolean {
  let scrolls = false;
  for (
    let element = target;
    element !== null && element !== stage && !scrolls;
    element = element.parentElement
  ) {
    const style = getComputedStyle(element);
    const vertical =
      /(auto|scroll)/.test(style.overflowY) &&
      ((dy < 0 && element.scrollTop > 0) ||
        (dy > 0 &&
          element.scrollTop + element.clientHeight < element.scrollHeight - 1));
    const horizontal =
      /(auto|scroll)/.test(style.overflowX) &&
      ((dx < 0 && element.scrollLeft > 0) ||
        (dx > 0 &&
          element.scrollLeft + element.clientWidth < element.scrollWidth - 1));
    scrolls = vertical || horizontal;
  }
  return scrolls;
}

/** Whether an element takes typed text. */
function isField(element: EventTarget | null): boolean {
  const node = element as HTMLElement | null;
  return (
    node !== null &&
    node !== undefined &&
    (FIELDS.has(node.tagName) || node.isContentEditable === true)
  );
}

/** Whether the focus lies on a control that uses the keys itself. */
function isControl(
  element: Element | null,
  canvas: HTMLCanvasElement,
): boolean {
  return (
    element !== null &&
    element !== canvas &&
    element !== document.body &&
    CONTROLS.has(element.tagName)
  );
}

/** The digit 1 to 9 of a key code (top row or number pad), or 0. */
function digitOf(code: string): number {
  const match = /^(?:Digit|Numpad)([1-9])$/.exec(code);
  const digit = match === null ? 0 : Number(match[1]);
  return digit <= GROUPS ? digit : 0;
}

/** The action of a letter key (Shift held or not), or null. */
function letterAction(key: string, shift: boolean): InputAction | null {
  let action: InputAction | null = null;
  switch (key) {
    case "r":
      action = { type: "rotate", step: 1 };
      break;
    case "t":
      action = { type: "road", pave: shift };
      break;
    case "x":
    case "delete":
      action = { type: "demolish" };
      break;
    case "b":
      action = { type: "buildMenu" };
      break;
    default:
      action = null;
  }
  return action;
}
