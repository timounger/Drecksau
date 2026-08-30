/**
 * The final standings, on both screens.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import type { ArschlochGame } from "@/games/arschloch/engine/state";
import { ARSCHLOCH_TEXTS as T } from "@/games/arschloch/i18n/texts";

/**
 * Renders who won and how everybody stood at the end.
 *
 * @param props - the finished game, and what a rematch does
 * @returns the standings element
 */
export function ArschlochScores({
  game,
  onNewGame,
}: {
  readonly game: ArschlochGame;
  /** What the rematch button does, or null when this reader may not deal. */
  readonly onNewGame: (() => void) | null;
}): ReactElement {
  const names = game.winners.map((seat) => game.players[seat].name).join(", ");
  const standing = game.players
    .map((player, seat) => ({ player, seat }))
    .sort((left, right) => right.player.score - left.player.score);
  return (
    <div
      data-testid="ar-result"
      className="flex flex-col gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/30"
    >
      <p className="font-semibold">
        {game.winners.length === 1 ? T.wonBy(names) : T.drawBetween(names)}
      </p>
      <ul className="flex flex-col gap-0.5">
        {standing.map(({ player, seat }) => (
          <li key={seat} className="flex justify-between tabular-nums">
            <span>
              {player.name}
              {player.title === null ? "" : ` - ${T.titleOf(player.title)}`}
            </span>
            <span className="font-semibold">{player.score}</span>
          </li>
        ))}
      </ul>
      {onNewGame !== null && (
        <button
          type="button"
          onClick={onNewGame}
          data-testid="ar-again"
          className="w-fit cursor-pointer rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {T.newGame}
        </button>
      )}
    </div>
  );
}
