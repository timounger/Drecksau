/**
 * How the game came out.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import {
  TARGET_SCORE,
  leaders,
  type Flip7Game,
} from "@/games/flip-7/engine/state";
import { F7_TEXTS as T } from "@/games/flip-7/i18n/texts";

/** Props of {@link Flip7Scores}. */
export type Flip7ScoresProps = {
  readonly game: Flip7Game;
  /** Starts a fresh game, or null where the screen offers no such button. */
  readonly onNewGame: (() => void) | null;
};

/**
 * Renders the final standings.
 *
 * @param props - the finished game and the way into the next one
 * @returns the result element
 */
export function Flip7Scores({
  game,
  onNewGame,
}: Flip7ScoresProps): ReactElement {
  const won = leaders(game);
  const ranked = game.players
    .map((player, seat) => ({ player, seat }))
    .sort((left, right) => right.player.score - left.player.score);

  return (
    <section
      data-testid="flip7-scores"
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-lg font-bold">{T.gameOverTitle}</h2>
      <p className="text-sm font-medium">
        {won.length === 1
          ? T.winner(game.players[won[0]].name)
          : T.winners(won.map((seat) => game.players[seat].name).join(", "))}
      </p>
      <ol className="flex flex-col gap-1 text-sm">
        {ranked.map((row, rank) => (
          <li
            key={row.player.name + row.seat}
            className={`flex items-baseline gap-2 rounded-lg px-2 py-1 ${
              won.includes(row.seat)
                ? "bg-emerald-100 font-semibold text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"
                : "bg-zinc-50 dark:bg-zinc-800/60"
            }`}
          >
            <span className="w-6 tabular-nums">{rank + 1}.</span>
            <span className="min-w-0 flex-1 truncate">{row.player.name}</span>
            <span className="font-bold tabular-nums">{row.player.score}</span>
          </li>
        ))}
      </ol>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
        {T.target(TARGET_SCORE)}
      </p>
      {onNewGame !== null && (
        <button
          type="button"
          data-testid="flip7-again"
          onClick={onNewGame}
          className="cursor-pointer self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {T.playAgain}
        </button>
      )}
    </section>
  );
}
