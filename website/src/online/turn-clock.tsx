/**
 * The turn clock: how long the player on turn has left before the computer
 * steps in, and the pill that shows it.
 *
 * @module
 * @remarks
 * The host already plays for a seat that sits idle too long - see the auto-play
 * timer in `use-online-room`. This is only the other half of it: the clock the
 * players can see. A takeover that arrives without warning reads as a bug or a
 * lost connection, and the one thing it must never do is surprise anybody.
 *
 * The countdown is **shown, not enforced**. It restarts from the turn key, the
 * same one the host arms its timer from, so the two run together without a
 * second authority over when a turn expires. A client whose clock runs fast
 * simply shows nought for a moment; the move still happens when the host says
 * so.
 */
"use client";

import { useEffect, useState, type ReactElement } from "react";

/** How often the countdown is redrawn. */
const TICK_MS = 250;
/** Milliseconds in a second. */
const MS_PER_SECOND = 1000;
/** Below this the clock turns red. */
const LOW_TIME_MS = 5000;

/** German labels of the clock. */
const TEXTS = {
  title: "Danach übernimmt der Computer",
  over: "Computer übernimmt …",
} as const;

/** What {@link useTurnClock} needs to run. */
export type TurnClockInput = {
  /** The room's auto-play timeout in ms, or null when there is none. */
  readonly autoPlayMs: number | null;
  /**
   * The turn the clock belongs to - it restarts when this changes.
   *
   * @remarks
   * The turn, not the room version. A turn can be several moves, and keying on
   * the version would give a player a fresh thirty seconds every time they held
   * a die - which is exactly the dithering the clock exists to bound. Use
   * `turnKeyOf` so this and the host mean the same thing by "one turn".
   */
  readonly turn: string;
  /** False while nobody is on turn, so no clock is shown. */
  readonly running: boolean;
};

/**
 * Counts the turn down.
 *
 * @param input - the timeout, the turn it belongs to and whether one is running
 * @returns the milliseconds left, or null when no clock applies
 */
export function useTurnClock({
  autoPlayMs,
  turn,
  running,
}: TurnClockInput): number | null {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (autoPlayMs === null || autoPlayMs <= 0 || !running) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- nothing to count
      setRemainingMs(null);
      return;
    }
    const deadline = Date.now() + autoPlayMs;
    setRemainingMs(autoPlayMs);
    const timer = setInterval(() => {
      const left = deadline - Date.now();
      setRemainingMs(left > 0 ? left : 0);
      if (left <= 0) {
        clearInterval(timer);
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [autoPlayMs, turn, running]);

  return remainingMs;
}

/**
 * A small pill with the seconds left before the computer takes over.
 *
 * @param props - the milliseconds left, as counted by {@link useTurnClock}
 * @returns the pill, or nothing when no clock applies
 */
export function TurnClock({
  remainingMs,
}: {
  readonly remainingMs: number | null;
}): ReactElement | null {
  let pill: ReactElement | null = null;
  if (remainingMs !== null) {
    const seconds = Math.ceil(remainingMs / MS_PER_SECOND);
    const low = remainingMs <= LOW_TIME_MS;
    pill = (
      <span
        data-testid="turn-clock"
        title={TEXTS.title}
        className={`rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${
          low
            ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
        }`}
      >
        {seconds > 0 ? `\u{23F1}\u{FE0F} ${seconds}s` : TEXTS.over}
      </span>
    );
  }
  return pill;
}
