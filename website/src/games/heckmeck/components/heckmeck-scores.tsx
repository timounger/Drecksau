/**
 * The closing table.
 *
 * @module
 * @remarks
 * Worms, not tiles. A pile of six thin tiles loses to three fat ones, and the
 * only number that ever mattered is the one at the end of the row.
 */
"use client";

import type { ReactElement } from "react";
import {
  leaders,
  wormCount,
  type HeckmeckGame,
} from "@/games/heckmeck/engine/state";
import { HECKMECK_TEXTS as T } from "@/games/heckmeck/i18n/texts";

/** Props of {@link HeckmeckScores}. */
export type HeckmeckScoresProps = {
  readonly game: HeckmeckGame;
  /** Starts a fresh game, or null where the screen offers no such button. */
  readonly onNewGame: (() => void) | null;
};

/**
 * Renders the final standings.
 *
 * @param props - the finished game and the way into the next one
 * @returns the result element
 */
export function HeckmeckScores({
  game,
  onNewGame,
}: HeckmeckScoresProps): ReactElement {
  const winners = leaders(game);
  const ranked = game.players
    .map((player, seat) => ({ player, seat, score: wormCount(player) }))
    .sort((left, right) => right.score - left.score);

  return (
    <section
      data-testid="heckmeck-scores"
      className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30"
    >
      <h2 className="text-lg font-bold">{T.gameOverTitle}</h2>
      <p className="text-sm font-medium">
        {winners.length === 1
          ? T.winner(game.players[winners[0]].name)
          : T.winnerShared(
              winners.map((seat) => game.players[seat].name).join(", "),
            )}
      </p>
      <ol className="flex flex-col gap-1">
        {ranked.map((entry) => (
          <li
            key={entry.seat}
            className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-1.5 text-sm dark:bg-zinc-900/60"
          >
            <span className="min-w-0 flex-1 truncate">{entry.player.name}</span>
            <span className="w-24 text-right font-bold tabular-nums">
              {entry.score} {T.worms}
            </span>
          </li>
        ))}
      </ol>
      {onNewGame !== null && (
        <button
          type="button"
          onClick={onNewGame}
          className="cursor-pointer self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {T.playAgain}
        </button>
      )}
    </section>
  );
}
