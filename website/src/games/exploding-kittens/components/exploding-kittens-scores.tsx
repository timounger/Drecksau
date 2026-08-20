/**
 * How the game came out.
 *
 * @module
 * @remarks
 * Not a scoreboard - nobody counts anything in this game. What there is, is an
 * order: who survived, and who went up in smoke in which order. The last one to
 * explode came closest, so the list reads from the winner downwards.
 */
"use client";

import type { ReactElement } from "react";
import { CARD_ICONS } from "@/games/exploding-kittens/engine/cards";
import {
  standings,
  survivor,
  type ExplodingKittensGame,
} from "@/games/exploding-kittens/engine/state";
import { EK_TEXTS as T } from "@/games/exploding-kittens/i18n/texts";

/** Props of {@link ExplodingKittensScores}. */
export type ExplodingKittensScoresProps = {
  readonly game: ExplodingKittensGame;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: number | null;
  /** Starts a fresh game, or null where the screen offers no such button. */
  readonly onNewGame: (() => void) | null;
};

/**
 * Renders the end of the game.
 *
 * @param props - the finished game and the way into the next one
 * @returns the result element
 */
export function ExplodingKittensScores({
  game,
  mySeat,
  onNewGame,
}: ExplodingKittensScoresProps): ReactElement {
  const won = survivor(game);
  const order = standings(game);

  return (
    <section
      data-testid="ek-scores"
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-lg font-bold">{T.gameOverTitle}</h2>
      <p className="text-sm font-medium">
        {won === null
          ? T.gameOverTitle
          : won === mySeat
            ? T.winnerYou
            : T.winner(game.players[won].name)}
      </p>

      <ol className="flex flex-col gap-1 text-sm">
        {order.map((seat, rank) => {
          const player = game.players[seat];
          const alive = player.place === null;
          return (
            <li
              key={player.name + seat}
              className={`flex items-baseline gap-2 rounded-lg px-2 py-1 ${
                alive
                  ? "bg-emerald-100 font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                  : "bg-zinc-50 dark:bg-zinc-800/60"
              }`}
            >
              <span className="w-6 tabular-nums">{T.place(rank + 1)}</span>
              <span className="min-w-0 flex-1 truncate">{player.name}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {alive ? T.alive : `${CARD_ICONS.kitten} ${T.dead}`}
              </span>
            </li>
          );
        })}
      </ol>

      {onNewGame !== null && (
        <button
          type="button"
          data-testid="ek-again"
          onClick={onNewGame}
          className="cursor-pointer self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {T.playAgain}
        </button>
      )}
    </section>
  );
}
