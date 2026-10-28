/**
 * The on-screen controls for phones: an analog stick to walk, buttons for
 * the ability, using or talking and the next character - in a minigame
 * "Aktion", "Taste 2" and "Zurück" - and "Hinein" at a door or gate.
 *
 * @module
 * @remarks
 * Plain pointer events with pointer capture, so steering with one thumb and
 * pressing a button with the other works at the same time. The stick floats:
 * it starts wherever the thumb lands in its area and follows a thumb that
 * slides past its rim, so turning round never needs a long way back.
 */
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent,
  type ReactElement,
} from "react";
import type { Action, Dir } from "@/games/weihnachtsmann/engine/types";
import type { Hud } from "@/games/weihnachtsmann/hooks/use-weihnachtsmann-game";
import { WM_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import type { TouchState } from "./input";

/** How far the thumb may move from where it landed, CSS px. */
const STICK_RADIUS = 40;

/** A thumb closer than this share of the radius steers nowhere. */
const STICK_DEADZONE = 0.15;

/** Arrow shown on the button "Hinein" for each way through. */
const ENTRY_ARROWS: Readonly<Record<Dir, string>> = {
  up: "▲",
  down: "▼",
  left: "◀",
  right: "▶",
};

/** What a touch button does: a command on press, and maybe a held key. */
type ButtonSpec = {
  readonly label: string;
  readonly press: Action;
  /** The minigame key held while the finger stays on the button. */
  readonly hold?: "action" | "alt";
  readonly testId: string;
};

/**
 * Renders the stick: a round area the thumb steers in.
 *
 * @param props - how to tell the game where the stick points, and the
 *   classes that size and place the area
 * @returns the stick area
 */
export function TouchStick({
  setTouch,
  className,
  side = false,
  below = false,
}: {
  readonly setTouch: (patch: Partial<TouchState>) => void;
  readonly className: string;
  /** Whether it stands beside the picture, its width taken from the picture's. */
  readonly side?: boolean;
  /** Whether it stands under the picture, its height taken from the picture's. */
  readonly below?: boolean;
}): ReactElement {
  const zone = useRef<HTMLDivElement>(null);
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const finger = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });

  /** Puts the ring and the knob where they belong; null centres both. */
  const place = useCallback(
    (ring: { x: number; y: number } | null, dx: number, dy: number) => {
      const area = zone.current;
      if (area !== null && base.current !== null && knob.current !== null) {
        const x = ring?.x ?? area.clientWidth / 2;
        const y = ring?.y ?? area.clientHeight / 2;
        base.current.style.transform = `translate(${String(x)}px, ${String(y)}px)`;
        base.current.style.opacity = ring === null ? "0.55" : "1";
        knob.current.style.transform = `translate(${String(x + dx)}px, ${String(y + dy)}px)`;
      }
    },
    [],
  );

  useEffect(() => {
    // The idle ring sits in the middle of the area, whatever size it gets.
    const area = zone.current;
    const watch = new ResizeObserver(() => {
      if (finger.current === null) {
        place(null, 0, 0);
      }
    });
    if (area !== null) {
      watch.observe(area);
    }
    return () => {
      watch.disconnect();
    };
  }, [place]);

  const steer = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const box = zone.current?.getBoundingClientRect();
      if (box !== undefined && finger.current === event.pointerId) {
        const x = event.clientX - box.left;
        const y = event.clientY - box.top;
        let dx = x - origin.current.x;
        let dy = y - origin.current.y;
        const far = Math.hypot(dx, dy);
        if (far > STICK_RADIUS) {
          // Past the rim the ring is dragged along behind the thumb.
          origin.current.x = x - (dx / far) * STICK_RADIUS;
          origin.current.y = y - (dy / far) * STICK_RADIUS;
          dx = x - origin.current.x;
          dy = y - origin.current.y;
        }
        place(origin.current, dx, dy);
        setTouch(stickValue(dx, dy));
      }
    },
    [place, setTouch],
  );

  const press = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const box = zone.current?.getBoundingClientRect();
      if (finger.current === null && box !== undefined) {
        event.preventDefault();
        finger.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        origin.current = {
          x: event.clientX - box.left,
          y: event.clientY - box.top,
        };
        place(origin.current, 0, 0);
      }
    },
    [place],
  );

  const release = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (finger.current === event.pointerId) {
        finger.current = null;
        setTouch({ moveX: 0, moveY: 0 });
        place(null, 0, 0);
      }
    },
    [place, setTouch],
  );

  return (
    <div
      ref={zone}
      data-testid="wm-stick"
      data-wm-side={side ? "" : undefined}
      data-wm-below={below ? "" : undefined}
      onPointerDown={press}
      onPointerMove={steer}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      className={`relative touch-none overflow-hidden select-none ${className}`}
    >
      <span className="pointer-events-none absolute inset-x-0 bottom-1 text-center text-[10px] font-semibold tracking-wide text-zinc-500 uppercase">
        {WM_TEXTS.touchStick}
      </span>
      <div
        ref={base}
        className="pointer-events-none absolute top-0 left-0 -mt-12 -ml-12 h-24 w-24 rounded-full border-2 border-zinc-500 bg-zinc-800/80 opacity-55"
      />
      <div
        ref={knob}
        className="pointer-events-none absolute top-0 left-0 -mt-6 -ml-6 h-12 w-12 rounded-full bg-zinc-300 shadow-[0_2px_0_#3f3f46]"
      />
    </div>
  );
}

/**
 * Renders the buttons: on the map ability, use or talk, next character; in a
 * minigame action, a second key and back.
 *
 * @param props - what the screen shows, how to send commands and held keys
 * @returns the buttons
 */
export function TouchButtons({
  hud,
  dispatch,
  setTouch,
  side = false,
}: {
  readonly hud: Hud;
  readonly dispatch: (action: Action) => void;
  readonly setTouch: (patch: Partial<TouchState>) => void;
  /** Whether they stand beside the picture (a column) rather than under it. */
  readonly side?: boolean;
}): ReactElement {
  const inGate = hud.inGate !== null;
  const specs: readonly ButtonSpec[] = inGate
    ? [
        {
          label: WM_TEXTS.touchAction,
          press: { kind: "ability" },
          hold: "action",
          testId: "wm-touch-a",
        },
        {
          label: WM_TEXTS.touchAlt,
          press: { kind: "talk" },
          hold: "alt",
          testId: "wm-touch-b",
        },
        {
          label: WM_TEXTS.touchLeave,
          press: { kind: "cycle", delta: 1 },
          testId: "wm-touch-c",
        },
      ]
    : [
        {
          label: WM_TEXTS.touchAbility,
          press: { kind: "ability" },
          testId: "wm-touch-a",
        },
        {
          label: hud.canUse ? WM_TEXTS.touchUse : WM_TEXTS.touchTalk,
          press: { kind: "talk" },
          testId: "wm-touch-b",
        },
        {
          label: WM_TEXTS.touchNext,
          press: { kind: "cycle", delta: 1 },
          testId: "wm-touch-c",
        },
      ];
  const [big, ...small] = specs;
  return (
    <div
      data-wm-side={side ? "" : undefined}
      className={`flex touch-none flex-col justify-center gap-2 select-none ${
        side ? "order-3 w-32 shrink-0 px-1" : "min-w-0 flex-1 px-2"
      }`}
    >
      <PadButton
        spec={big}
        dispatch={dispatch}
        setTouch={setTouch}
        className="h-16 text-base"
      />
      <div className={`flex gap-2 ${side ? "flex-col" : ""}`}>
        {small.map((spec) => (
          <PadButton
            key={spec.testId}
            spec={spec}
            dispatch={dispatch}
            setTouch={setTouch}
            className={`h-12 text-sm ${side ? "w-full" : "flex-1"}`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Renders the button "Hinein" over the foot of the picture while the
 * character stands in a doorway or before a gate.
 *
 * @param props - which way leads through, and how to go
 * @returns the button
 */
export function EnterButton({
  entry,
  onEnter,
}: {
  readonly entry: Dir;
  readonly onEnter: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      data-testid="wm-touch-enter"
      onPointerDown={(event) => {
        event.preventDefault();
        onEnter();
      }}
      onContextMenu={(event) => {
        event.preventDefault();
      }}
      className="absolute bottom-2 left-1/2 z-20 flex h-12 min-w-28 -translate-x-1/2 touch-none items-center justify-center gap-2 rounded-full border-2 border-amber-200 bg-amber-500/90 px-5 text-base font-bold text-amber-950 shadow-[0_3px_0_#78350f] select-none active:translate-y-0.5"
    >
      <span aria-hidden="true">{ENTRY_ARROWS[entry]}</span>
      {WM_TEXTS.touchEnter}
    </button>
  );
}

/** One button that fires on touch and may be held. */
function PadButton({
  spec,
  dispatch,
  setTouch,
  className,
}: {
  readonly spec: ButtonSpec;
  readonly dispatch: (action: Action) => void;
  readonly setTouch: (patch: Partial<TouchState>) => void;
  readonly className: string;
}): ReactElement {
  const hold = (down: boolean) => {
    if (spec.hold === "action") {
      setTouch({ action: down });
    } else if (spec.hold === "alt") {
      setTouch({ alt: down });
    }
  };
  const release = () => {
    hold(false);
  };
  return (
    <button
      type="button"
      data-testid={spec.testId}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        dispatch(spec.press);
        hold(true);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(event) => {
        event.preventDefault();
      }}
      className={`flex touch-none items-center justify-center rounded-full bg-red-600 px-2 font-bold text-white shadow-[0_3px_0_#7f1d1d] select-none active:translate-y-0.5 active:bg-red-700 ${className}`}
    >
      {spec.label}
    </button>
  );
}

/**
 * Where a thumb pushes the stick.
 *
 * @param dx - thumb offset from the ring's middle, CSS px
 * @param dy - thumb offset from the ring's middle, CSS px
 * @returns the stick, each axis -1 to 1, nothing inside the dead zone
 */
function stickValue(
  dx: number,
  dy: number,
): Pick<TouchState, "moveX" | "moveY"> {
  const far = Math.hypot(dx, dy) / STICK_RADIUS;
  let result = { moveX: 0, moveY: 0 };
  if (far > STICK_DEADZONE) {
    const strength = Math.min(1, (far - STICK_DEADZONE) / (1 - STICK_DEADZONE));
    const angle = Math.atan2(dy, dx);
    result = {
      moveX: Math.cos(angle) * strength,
      moveY: Math.sin(angle) * strength,
    };
  }
  return result;
}
