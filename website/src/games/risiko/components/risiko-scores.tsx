/**
 * The end of a game.
 *
 * @module
 * @remarks
 * Two ways to end and they read differently, so they say different things: the
 * target reached is somebody winning, and the truce card is the game being
 * stopped and counted. The rulebook allows a **draw** on the second - "haben
 * beide Spieler gewonnen" - so more than one name can stand here, and it is
 * written as a shared win rather than as nobody winning.
 */
"use client";

import type { ReactElement } from "react";
import { armyOf } from "@/games/risiko/engine/armies";
import {
  countHeld,
  unitsOf,
  type RisikoGame,
} from "@/games/risiko/engine/state";
import { RISIKO_TEXTS as T } from "@/games/risiko/i18n/texts";

/** Props of {@link RisikoScores}. */
export type RisikoScoresProps = {
  readonly game: RisikoGame;
  readonly mySeat: number | null;
  /** Deals again, or null for somebody who is not the one dealing. */
  readonly onNewGame: (() => void) | null;
};

/**
 * Renders the closing screen.
 *
 * @param props - the finished game and the way to start another
 * @returns the screen element
 */
export function RisikoScores({
  game,
  mySeat,
  onNewGame,
}: RisikoScoresProps): ReactElement {
  const names = game.winners
    .map((seat) => game.players[seat].name)
    .join(" und ");
  const byTruce = game.log.some((line) => line.includes("Waffenstillstand"));
  const mine = mySeat !== null && game.winners.includes(mySeat);

  return (
    <section
      data-testid="rk-over"
      className={`flex flex-col gap-3 rounded-2xl border-2 p-4 ${
        mine
          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
          : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
      }`}
    >
      {/* "Du gewinnt!" is what naming the seat gets you. Whoever won, if it
          was the reader, the screen says so without conjugating a pronoun. */}
      <h2 className="text-xl font-black">
        {mine && game.winners.length === 1
          ? T.wonYou
          : game.winners.length > 1
            ? T.wonMany(names)
            : T.won(names)}
      </h2>
      {byTruce && (
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{T.wonTruce}</p>
      )}
      <ul className="flex flex-col gap-1 text-sm">
        {[...game.players.keys()]
          .sort((left, right) => countHeld(game, right) - countHeld(game, left))
          .map((seat) => (
            <li key={seat} className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-3 w-3 shrink-0 rounded-full border border-black/30"
                style={{ background: armyOf(seat).colour }}
              />
              <span
                className={
                  game.winners.includes(seat) ? "font-bold" : "opacity-70"
                }
              >
                {game.players[seat].name}
              </span>
              <span className="ml-auto tabular-nums">
                {T.held(countHeld(game, seat))}
              </span>
              <span className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                {T.unitsOnBoard(unitsOf(game, seat))}
              </span>
            </li>
          ))}
      </ul>
      {onNewGame !== null && (
        <div>
          <button
            type="button"
            data-testid="rk-again"
            onClick={onNewGame}
            className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {T.playAgain}
          </button>
        </div>
      )}
    </section>
  );
}
