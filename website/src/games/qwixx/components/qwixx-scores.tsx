/**
 * The closing table.
 *
 * @module
 * @remarks
 * The reason the game ended is on it, because there are two of them and they
 * feel completely different: two rows shut is the game running its course, a
 * fourth penalty is somebody having a bad evening.
 */
"use client";

import type { ReactElement } from "react";
import {
  PENALTIES_TO_END,
  leaders,
  lockCount,
  sheetScore,
  type QwixxGame,
} from "@/games/qwixx/engine/state";
import { QWIXX_TEXTS as T } from "@/games/qwixx/i18n/texts";

/** Props of {@link QwixxScores}. */
export type QwixxScoresProps = {
  readonly game: QwixxGame;
  /** Starts a fresh game, or null where the screen offers no such button. */
  readonly onNewGame: (() => void) | null;
};

/**
 * Renders the final standings.
 *
 * @param props - the finished game and the way into the next one
 * @returns the result element
 */
export function QwixxScores({
  game,
  onNewGame,
}: QwixxScoresProps): ReactElement {
  const winners = leaders(game);
  const broke = game.players.find(
    (player) => player.sheet.penalties >= PENALTIES_TO_END,
  );
  const ranked = game.players
    .map((player, seat) => ({
      player,
      seat,
      score: sheetScore(player.sheet, game.locked),
    }))
    .sort((left, right) => right.score - left.score);

  return (
    <section
      data-testid="qwixx-scores"
      className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30"
    >
      <h2 className="text-lg font-bold">{T.gameOverTitle}</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        {lockCount(game.locked) >= 2
          ? T.endedByLocks
          : broke === undefined
            ? ""
            : T.endedByPenalties(broke.name)}
      </p>
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
            <span className="w-16 text-right font-bold tabular-nums">
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
