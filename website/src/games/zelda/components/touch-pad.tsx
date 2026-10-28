/**
 * The on-screen Game Boy controls for phones: a direction pad and the A, B, R
 * and Start buttons, every finger tracked on its own.
 *
 * @module
 * @remarks
 * Plain pointer events with pointer capture: each button keeps the finger that
 * pressed it until that finger lifts, wherever it wanders, so holding A for a
 * spin attack while steering with the other thumb works as on the handheld.
 */
"use client";

import {
  useCallback,
  useRef,
  type PointerEvent,
  type ReactElement,
} from "react";
import type { TouchState } from "./input";

/** A finger closer than this to the pad's middle steers nowhere (0 to 1). */
const PAD_DEADZONE = 0.22;

/** The pad snaps to eight directions. */
const EIGHTHS_PER_TURN = 8;

/** One eighth of a turn, in radians. */
const EIGHTH = (Math.PI * 2) / EIGHTHS_PER_TURN;

/** The buttons, besides the pad. */
type ButtonKey = "a" | "b" | "r" | "start";

/**
 * Renders the controls.
 *
 * @param props - how to tell the game what the buttons hold
 * @returns the control panel
 */
export function TouchPad({
  setTouch,
}: {
  readonly setTouch: (patch: Partial<TouchState>) => void;
}): ReactElement {
  return (
    <div className="game-controls flex w-full touch-none items-center justify-between gap-4 px-2 py-3 select-none pointer-fine:hidden">
      <DirectionPad setTouch={setTouch} />
      <div className="flex flex-col items-end gap-3">
        <div className="flex gap-2">
          <PadButton
            setTouch={setTouch}
            which="start"
            label="Start"
            className="h-8 w-16 rounded-full text-[11px]"
          />
          <PadButton
            setTouch={setTouch}
            which="r"
            label="R"
            className="h-8 w-16 rounded-full text-sm"
          />
        </div>
        <div className="flex items-end gap-4">
          <PadButton
            setTouch={setTouch}
            which="b"
            label="B"
            className="mb-[-14px] h-16 w-16 rounded-full text-xl"
          />
          <PadButton
            setTouch={setTouch}
            which="a"
            label="A"
            className="mb-6 h-16 w-16 rounded-full text-xl"
          />
        </div>
      </div>
    </div>
  );
}

/** The cross-shaped direction pad, read from where the finger is. */
function DirectionPad({
  setTouch,
}: {
  readonly setTouch: (patch: Partial<TouchState>) => void;
}): ReactElement {
  const pad = useRef<HTMLDivElement>(null);
  const finger = useRef<number | null>(null);

  const steer = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const box = pad.current?.getBoundingClientRect();
      if (box !== undefined && finger.current === event.pointerId) {
        const dx =
          (event.clientX - (box.left + box.width / 2)) / (box.width / 2);
        const dy =
          (event.clientY - (box.top + box.height / 2)) / (box.height / 2);
        const direction = padDirection(dx, dy);
        setTouch({ moveX: direction.x, moveY: direction.y });
      }
    },
    [setTouch],
  );

  const press = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      finger.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      steer(event);
    },
    [steer],
  );

  const release = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (finger.current === event.pointerId) {
        finger.current = null;
        setTouch({ moveX: 0, moveY: 0 });
      }
    },
    [setTouch],
  );

  return (
    <div
      ref={pad}
      data-testid="zelda-dpad"
      onPointerDown={press}
      onPointerMove={steer}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      className="relative h-36 w-36 shrink-0 touch-none"
    >
      <div className="absolute top-1/2 left-0 h-12 w-full -translate-y-1/2 rounded-md bg-zinc-800 shadow-inner" />
      <div className="absolute top-0 left-1/2 h-full w-12 -translate-x-1/2 rounded-md bg-zinc-800 shadow-inner" />
      <div className="absolute top-1/2 left-1/2 h-6 w-6 -translate-1/2 rounded-full bg-zinc-700" />
    </div>
  );
}

/** One round or pill-shaped button. */
function PadButton({
  setTouch,
  which,
  label,
  className,
}: {
  readonly setTouch: (patch: Partial<TouchState>) => void;
  readonly which: ButtonKey;
  readonly label: string;
  readonly className: string;
}): ReactElement {
  const down = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setTouch({ [which]: true });
    },
    [setTouch, which],
  );
  const up = useCallback(() => {
    setTouch({ [which]: false });
  }, [setTouch, which]);
  return (
    <button
      type="button"
      data-testid={`zelda-btn-${which}`}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
      onLostPointerCapture={up}
      onContextMenu={(event) => event.preventDefault()}
      className={`flex touch-none items-center justify-center bg-indigo-400 font-bold text-white shadow-[0_3px_0_#3730a3] active:translate-y-0.5 active:bg-indigo-500 ${className}`}
    >
      {label}
    </button>
  );
}

/**
 * Which way a finger on the pad steers.
 *
 * @param dx - finger offset from the middle, -1 to 1
 * @param dy - finger offset from the middle, -1 to 1
 * @returns the stick direction, each axis -1, 0 or 1
 */
function padDirection(dx: number, dy: number): { x: number; y: number } {
  let result = { x: 0, y: 0 };
  if (Math.hypot(dx, dy) > PAD_DEADZONE) {
    const a = Math.round(Math.atan2(dy, dx) / EIGHTH) * EIGHTH;
    result = { x: Math.round(Math.cos(a)), y: Math.round(Math.sin(a)) };
  }
  return result;
}
