/**
 * How the round came out.
 *
 * @module
 * @remarks
 * Not a scoreboard - there are no points in this game and there is no winner
 * either. What there is, is an order: who got out first, and who was left
 * holding the cards. So that is what this shows, with the last line being the
 * only one anybody will remember.
 */
"use client";

import type { ReactElement } from "react";
import {
  cardsLeft,
  jammerlappen,
  standings,
  type JammerlappenGame,
} from "@/games/jammerlappen/engine/state";
import { JAMMER_TEXTS as T } from "@/games/jammerlappen/i18n/texts";

/** Props of {@link JammerlappenScores}. */
export type JammerlappenScoresProps = {
  readonly game: JammerlappenGame;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: number | null;
  /** Starts a fresh round, or null where the screen offers no such button. */
  readonly onNewGame: (() => void) | null;
};

/**
 * Renders the end of the round.
 *
 * @param props - the finished game and the way into the next one
 * @returns the result element
 */
export function JammerlappenScores({
  game,
  mySeat,
  onNewGame,
}: JammerlappenScoresProps): ReactElement {
  const loser = jammerlappen(game);
  const order = standings(game);

  return (
    <section
      data-testid="jammer-scores"
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-lg font-bold">{T.gameOverTitle}</h2>
      <p className="text-sm font-medium">
        {loser === null
          ? T.gameOverTitle
          : loser === mySeat
            ? T.loserYou
            : T.loser(game.players[loser].name)}
      </p>

      <ol className="flex flex-col gap-1 text-sm">
        {order.map((seat, rank) => {
          const player = game.players[seat];
          const isLoser = seat === loser;
          return (
            <li
              key={player.name + seat}
              className={`flex items-baseline gap-2 rounded-lg px-2 py-1 ${
                isLoser
                  ? "bg-rose-100 font-semibold text-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
                  : "bg-zinc-50 dark:bg-zinc-800/60"
              }`}
            >
              <span className="w-6 tabular-nums">{T.place(rank + 1)}</span>
              <span className="min-w-0 flex-1 truncate">{player.name}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {isLoser ? T.cardsLeft(cardsLeft(player)) : T.out}
              </span>
            </li>
          );
        })}
      </ol>

      {onNewGame !== null && (
        <button
          type="button"
          data-testid="jammer-again"
          onClick={onNewGame}
          className="cursor-pointer self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {T.playAgain}
        </button>
      )}
    </section>
  );
}
