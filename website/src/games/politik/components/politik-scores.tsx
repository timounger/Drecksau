/**
 * The closing table: who ended up with how much.
 *
 * @module
 * @remarks
 * Victory points decide it, so they come first and the seats stand beside them
 * as the thing that produced them. A shared lead is named as a shared lead
 * rather than silently resolved by seat order - the rules have no tie-break,
 * and inventing one on the results screen would be the worst place for it.
 */
"use client";

import type { ReactElement } from "react";
import {
  PARTY_INK,
  leaders,
  type PolitikGame,
} from "@/games/politik/engine/state";
import { POLITIK_TEXTS as T } from "@/games/politik/i18n/texts";

/** Props of {@link PolitikScores}. */
export type PolitikScoresProps = {
  readonly game: PolitikGame;
  /** Starts a fresh game, or null where the screen offers no such button. */
  readonly onNewGame: (() => void) | null;
};

/**
 * Renders the final standings.
 *
 * @param props - the finished game and the way into the next one
 * @returns the result element
 */
export function PolitikScores({
  game,
  onNewGame,
}: PolitikScoresProps): ReactElement {
  const winners = leaders(game);
  const ranked = game.players
    .map((player, seat) => ({ player, seat }))
    .sort((left, right) => right.player.points - left.player.points);

  return (
    <section
      data-testid="politik-scores"
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
            <span
              aria-hidden
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: PARTY_INK[entry.player.color] }}
            />
            <span className="min-w-0 flex-1 truncate">{entry.player.name}</span>
            <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
              {entry.player.seats} {T.seats}
            </span>
            <span className="w-16 text-right font-bold tabular-nums">
              {entry.player.points} {T.pointsShort}
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
