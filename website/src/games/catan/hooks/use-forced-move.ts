/**
 * Plays the move that is the only move.
 *
 * @module
 * @remarks
 * A button whose only purpose is to be pressed is not a choice, it is a toll.
 * Most turns of Catan open with one - "Würfeln", with nothing else on offer -
 * and some end with another, when a player who took in nothing has no card to
 * build with, trade with, or even offer with. {@link forcedMove} says when that
 * is the case, and this presses the button.
 *
 * It waits a beat first, and the two beats are different lengths on purpose.
 * The roll goes quickly, because the interesting part is its result and the
 * sooner it is on screen the better. Ending a turn waits longer, so that the
 * result of your own roll does not vanish half a second after it appeared.
 *
 * Both screens use this, and each browser runs it for its own seat only - so
 * online it is the player's own client that sends the move, exactly as if they
 * had pressed the button themselves.
 */
"use client";

import { useEffect, useRef } from "react";
import { forcedMove } from "@/games/catan/engine/moves";
import type { CatanGame, CatanMove } from "@/games/catan/engine/state";

/** How long to wait before throwing the dice for somebody. */
const ROLL_PAUSE_MS = 500;

/** How long to wait before ending an empty turn for somebody. */
const END_PAUSE_MS = 1400;

/** How long each forced move waits. */
const PAUSES: Readonly<Record<string, number>> = {
  roll: ROLL_PAUSE_MS,
  endTurn: END_PAUSE_MS,
};

/**
 * Makes the one move a seat has, once it is the only one.
 *
 * @param game - the game as it stands, or `null` before one has arrived
 * @param seat - the seat this browser plays, or `null` for a watcher
 * @param onMove - where the move goes
 */
export function useForcedMove(
  game: CatanGame | null,
  seat: number | null,
  onMove: (move: CatanMove) => void,
): void {
  const kind =
    game === null || seat === null ? "" : (forcedMove(game, seat)?.kind ?? "");
  // Held in a ref so a screen that hands over a fresh callback on every render
  // cannot keep restarting the timer and starve the move it is waiting to make.
  const send = useRef(onMove);
  useEffect(() => {
    send.current = onMove;
  }, [onMove]);

  useEffect(() => {
    if (kind === "") {
      return;
    }
    const timer = setTimeout(() => {
      send.current({ kind } as CatanMove);
    }, PAUSES[kind] ?? ROLL_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [kind, game?.turn, game?.playedDev]);
}
