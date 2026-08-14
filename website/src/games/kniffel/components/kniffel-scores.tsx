/**
 * The closing table.
 *
 * @module
 * @remarks
 * Alone this is not a ranking but a record: one sheet, one number, and the
 * question of whether it was better than last time. So the panel says the
 * total plainly rather than declaring a winner over an empty field.
 */
"use client";

import type { ReactElement } from "react";
import {
  leaders,
  sheetTotal,
  type KniffelGame,
} from "@/games/kniffel/engine/state";
import { KNIFFEL_TEXTS as T } from "@/games/kniffel/i18n/texts";

/** Props of {@link KniffelScores}. */
export type KniffelScoresProps = {
  readonly game: KniffelGame;
  /** Starts a fresh game, or null where the screen offers no such button. */
  readonly onNewGame: (() => void) | null;
};

/**
 * Renders the final standings.
 *
 * @param props - the finished game and the way into the next one
 * @returns the result element
 */
export function KniffelScores({
  game,
  onNewGame,
}: KniffelScoresProps): ReactElement {
  const winners = leaders(game);
  const ranked = game.players
    .map((player, seat) => ({ player, seat, score: sheetTotal(player.sheet) }))
    .sort((left, right) => right.score - left.score);

  return (
    <section
      data-testid="kniffel-scores"
      className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30"
    >
      <h2 className="text-lg font-bold">{T.gameOverTitle}</h2>
      <p className="text-sm font-medium">
        {game.players.length === 1
          ? T.soloResult(sheetTotal(game.players[0].sheet))
          : winners.length === 1
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
              {entry.score}
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
