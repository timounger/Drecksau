/**
 * Touch controls for GTA on a phone: a drive stick on the left, aim and fire
 * on the right, and three buttons for the things a mouse has extra buttons for.
 *
 * @module
 * @remarks
 * Built the same way as Panzerkiste's - see ../../panzerkiste/components/
 * touch-controls. A thumb on the left half puts a stick down where it lands and
 * drives with it; a thumb on the right half looks and shoots. What a phone has
 * no room for is the rest of the mouse: getting in and out of a car, turning
 * the wheel to the next weapon and putting a charge down. Those are three round
 * buttons over the picture.
 *
 * The controller only listens and remembers; it never advances the game. The
 * hook samples it once per frame and folds the result into the same
 * {@link Input} the keyboard and mouse produce, so the engine never learns what
 * kind of device is playing it.
 *
 * Everything in here is in **view pixels** - the same coordinates the renderer
 * draws in - so a button is where it looks like it is, whatever the display.
 */
import { VIEW_HEIGHT, VIEW_WIDTH } from "@/games/gta/components/projection";
import type { Vec } from "@/games/gta/engine/types";

/** Largest thumb travel the drive stick reads, in view pixels. */
const STICK_REACH = 70;

/** How much of that travel around the middle counts as standing still. */
const STICK_DEAD = 0.22;

/** How far the knob of the stick is drawn, in view pixels. */
const KNOB = 26;

/** How thick the outlines of the widgets are. */
const OUTLINE = 3;

/** How big the round buttons are, in view pixels. */
const BUTTON_SIZE = 34;

/** What each button does when a thumb lands on it. */
export type TouchButton = "use" | "weapon" | "plant";

/** One button over the picture: what it does, where it is, what it says. */
export type ButtonView = {
  readonly kind: TouchButton;
  readonly x: number;
  readonly y: number;
  readonly label: string;
  /** Whether a thumb is on it right now. */
  readonly held: boolean;
};

/** The stick, as it is drawn: where it was pressed and where the thumb is. */
export type StickView = {
  readonly baseX: number;
  readonly baseY: number;
  readonly tipX: number;
  readonly tipY: number;
};

/** One frame of touch input, in the terms the hook needs. */
export type TouchSample = {
  /** True once the screen has been touched at all - nothing is drawn before. */
  readonly engaged: boolean;
  /** Where the stick is pushed, each part between -1 and 1. */
  readonly move: Vec;
  /** The last point looked at, in view pixels, or null while none was. */
  readonly aim: Vec | null;
  /** Whether the right thumb is down, which is the trigger. */
  readonly firing: boolean;
  /** The stick to draw, or null while nobody is holding it. */
  readonly stick: StickView | null;
  /** The three buttons, with what they say and whether they are pressed. */
  readonly buttons: readonly ButtonView[];
};

/** A live touch controller bound to one canvas. */
export type TouchControls = {
  /** What the fingers are doing this frame. */
  sample(): TouchSample;
  /** Whether the car button was pressed since the last frame, clearing it. */
  consumeUse(): boolean;
  /** How many notches of weapon change are waiting, clearing them. */
  consumeWheel(): number;
  /** Whether a charge was asked for, clearing it. */
  consumePlant(): boolean;
  /**
   * Whether the right thumb has touched down since the last frame, clearing it.
   *
   * @remarks
   * A tap can begin and end between two pictures. The held flag would miss it
   * altogether, so the touch down is remembered as well and spent once - one
   * tap, one shot.
   */
  consumeTap(): boolean;
  /** Takes the listeners off again. */
  dispose(): void;
};

/** How far the near button sits from the edge of the picture, in view pixels. */
const BUTTON_EDGE = 62;

/** And how far apart two of them are. */
const BUTTON_GAP = 84;

/** Where the buttons sit, from the bottom right corner inwards. */
const BUTTONS: readonly {
  readonly kind: TouchButton;
  readonly x: number;
  readonly y: number;
  readonly label: string;
}[] = [
  {
    kind: "use",
    x: VIEW_WIDTH - BUTTON_EDGE,
    y: VIEW_HEIGHT - BUTTON_EDGE,
    label: "Auto",
  },
  {
    kind: "weapon",
    x: VIEW_WIDTH - BUTTON_EDGE,
    y: VIEW_HEIGHT - BUTTON_EDGE - BUTTON_GAP,
    label: "Waffe",
  },
  {
    kind: "plant",
    x: VIEW_WIDTH - BUTTON_EDGE - BUTTON_GAP,
    y: VIEW_HEIGHT - BUTTON_EDGE,
    label: "Zünder",
  },
];

/** The drive stick, while a thumb is on it. */
type Stick = {
  id: number;
  baseX: number;
  baseY: number;
  tipX: number;
  tipY: number;
};

/** The right-hand thumb: where it is looking. */
type Look = {
  id: number;
  at: Vec;
};

/** A thumb sitting on one of the buttons. */
type Press = {
  id: number;
  kind: TouchButton;
};

/**
 * Puts touch controls on a canvas.
 *
 * @param canvas - the canvas the game is drawn on
 * @returns the controller the hook samples once a frame
 */
export function createTouchControls(canvas: HTMLCanvasElement): TouchControls {
  let stick: Stick | null = null;
  let look: Look | null = null;
  let lastAim: Vec | null = null;
  let presses: Press[] = [];
  let engaged = false;
  let useWanted = false;
  let tapWanted = false;
  let wheelWanted = 0;
  let plantWanted = false;

  /** Where a touch is, in view pixels. */
  const spotOf = (touch: Touch): Vec => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((touch.clientX - rect.left) / rect.width) * VIEW_WIDTH,
      y: ((touch.clientY - rect.top) / rect.height) * VIEW_HEIGHT,
    };
  };

  const onStart = (event: TouchEvent) => {
    event.preventDefault();
    engaged = true;
    for (const touch of Array.from(event.changedTouches)) {
      const spot = spotOf(touch);
      const button = buttonAt(spot);
      if (button !== null) {
        presses = [...presses, { id: touch.identifier, kind: button }];
        press(button);
      } else if (spot.x <= VIEW_WIDTH / 2 && stick === null) {
        stick = {
          id: touch.identifier,
          baseX: spot.x,
          baseY: spot.y,
          tipX: spot.x,
          tipY: spot.y,
        };
      } else if (look === null) {
        look = { id: touch.identifier, at: spot };
        lastAim = spot;
        tapWanted = true;
      }
    }
  };

  const onMove = (event: TouchEvent) => {
    event.preventDefault();
    for (const touch of Array.from(event.changedTouches)) {
      const spot = spotOf(touch);
      if (stick !== null && touch.identifier === stick.id) {
        stick.tipX = spot.x;
        stick.tipY = spot.y;
      } else if (look !== null && touch.identifier === look.id) {
        look.at = spot;
        lastAim = spot;
      }
    }
  };

  const onEnd = (event: TouchEvent) => {
    for (const touch of Array.from(event.changedTouches)) {
      if (stick !== null && touch.identifier === stick.id) {
        stick = null;
      } else if (look !== null && touch.identifier === look.id) {
        look = null;
      }
      presses = presses.filter((each) => each.id !== touch.identifier);
    }
  };

  /** One press of a button is one thing wanted, however long it is held. */
  const press = (kind: TouchButton) => {
    if (kind === "use") {
      useWanted = true;
    } else if (kind === "weapon") {
      wheelWanted += 1;
    } else {
      plantWanted = true;
    }
  };

  canvas.addEventListener("touchstart", onStart, { passive: false });
  canvas.addEventListener("touchmove", onMove, { passive: false });
  canvas.addEventListener("touchend", onEnd);
  canvas.addEventListener("touchcancel", onEnd);

  return {
    sample(): TouchSample {
      return {
        engaged,
        move: stick === null ? { x: 0, y: 0 } : axisOf(stick),
        aim: lastAim,
        firing: look !== null,
        stick: stick === null ? null : viewOf(stick),
        buttons: BUTTONS.map((button) => ({
          ...button,
          held: presses.some((each) => each.kind === button.kind),
        })),
      };
    },
    consumeUse(): boolean {
      const had = useWanted;
      useWanted = false;
      return had;
    },
    consumeWheel(): number {
      const had = wheelWanted;
      wheelWanted = 0;
      return had;
    },
    consumePlant(): boolean {
      const had = plantWanted;
      plantWanted = false;
      return had;
    },
    consumeTap(): boolean {
      const had = tapWanted;
      tapWanted = false;
      return had;
    },
    dispose(): void {
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onEnd);
      canvas.removeEventListener("touchcancel", onEnd);
    },
  };
}

/** Which button is under a point, if any. */
function buttonAt(spot: Vec): TouchButton | null {
  const hit = BUTTONS.find(
    (button) => Math.hypot(button.x - spot.x, button.y - spot.y) <= BUTTON_SIZE,
  );
  return hit === undefined ? null : hit.kind;
}

/** How far the stick is pushed, with a dead middle and a limit of one. */
function axisOf(stick: Stick): Vec {
  const dx = stick.tipX - stick.baseX;
  const dy = stick.tipY - stick.baseY;
  const away = Math.hypot(dx, dy);
  let axis: Vec = { x: 0, y: 0 };
  if (away > STICK_REACH * STICK_DEAD) {
    const reach = Math.min(away, STICK_REACH);
    axis = {
      x: (dx / away) * (reach / STICK_REACH),
      y: (dy / away) * (reach / STICK_REACH),
    };
  }
  return axis;
}

/** The stick as it is drawn, with the knob kept inside its ring. */
function viewOf(stick: Stick): StickView {
  const dx = stick.tipX - stick.baseX;
  const dy = stick.tipY - stick.baseY;
  const away = Math.hypot(dx, dy);
  const reach = Math.min(away, STICK_REACH);
  const scale = away === 0 ? 0 : reach / away;
  return {
    baseX: stick.baseX,
    baseY: stick.baseY,
    tipX: stick.baseX + dx * scale,
    tipY: stick.baseY + dy * scale,
  };
}

/** The faint white of the widgets. */
const LIGHT = "rgba(255, 255, 255, 0.32)";

/** The stronger white of the knob and the labels. */
const STRONG = "rgba(255, 255, 255, 0.6)";

/**
 * Draws the stick and the buttons over the finished picture.
 *
 * @param ctx - the canvas context, with the frame already on it
 * @param sample - what the fingers are doing
 * @remarks
 * Nothing at all until the screen has been touched once, so that a game played
 * with a keyboard never grows thumb furniture. After that the buttons stay
 * put - a button that comes and goes with the weapon in hand is a button one
 * has to look for.
 */
export function drawTouchControls(
  ctx: CanvasRenderingContext2D,
  sample: TouchSample,
): void {
  if (sample.engaged) {
    const stick = sample.stick;
    if (stick !== null) {
      ctx.save();
      ctx.lineWidth = OUTLINE;
      ctx.strokeStyle = LIGHT;
      ctx.beginPath();
      ctx.arc(stick.baseX, stick.baseY, STICK_REACH, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = STRONG;
      ctx.beginPath();
      ctx.arc(stick.tipX, stick.tipY, KNOB, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    for (const button of sample.buttons) {
      drawButton(ctx, button);
    }
  }
}

/** One round button with its word in it. */
function drawButton(ctx: CanvasRenderingContext2D, button: ButtonView): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(button.x, button.y, BUTTON_SIZE, 0, Math.PI * 2);
  ctx.fillStyle = button.held
    ? "rgba(250, 204, 21, 0.5)"
    : "rgba(0, 0, 0, 0.4)";
  ctx.fill();
  ctx.lineWidth = OUTLINE;
  ctx.strokeStyle = button.held ? "rgba(250, 204, 21, 0.9)" : LIGHT;
  ctx.stroke();
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 15px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(button.label, button.x, button.y);
  ctx.restore();
}
