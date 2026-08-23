/**
 * The end of a game.
 *
 * @module
 * @remarks
 * "Wer am Ende des Spiels nicht pleite ist, hat gewonnen" - so there is exactly
 * one winner and no score. What the table wants to see afterwards is not points
 * but the shape of the wreck: who owned what when it stopped, and how much of
 * it was on paper. So the list is by worth, and it says both numbers.
 */
"use client";

import type { ReactElement } from "react";
import {
  ownedBy,
  tokenFor,
  worthOf,
  type MonopolyGame,
} from "@/games/monopoly/engine/state";
import { MONOPOLY_TEXTS as T } from "@/games/monopoly/i18n/texts";

/** Props of {@link MonopolyScores}. */
export type MonopolyScoresProps = {
  readonly game: MonopolyGame;
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
export function MonopolyScores({
  game,
  mySeat,
  onNewGame,
}: MonopolyScoresProps): ReactElement {
  const mine = mySeat !== null && game.winners.includes(mySeat);
  const name = game.players[game.winners[0] ?? 0]?.name ?? "";

  return (
    <section
      data-testid="mo-over"
      className={`flex flex-col gap-3 rounded-2xl border-2 p-4 ${
        mine
          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
          : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
      }`}
    >
      <h2 className="text-xl font-black">{mine ? T.wonYou : T.won(name)}</h2>
      <ul className="flex flex-col gap-1 text-sm">
        {[...game.players.keys()]
          .sort((left, right) => worthOf(game, right) - worthOf(game, left))
          .map((seat) => (
            <li key={seat} className="flex flex-wrap items-center gap-2">
              <span
                aria-hidden
                className="flex h-6 w-6 items-center justify-center rounded-full text-[13px] ring-1 ring-black/30"
                style={{ background: tokenFor(game, seat).colour }}
              >
                {tokenFor(game, seat).emoji}
              </span>
              <span
                className={
                  game.winners.includes(seat)
                    ? "font-bold"
                    : "opacity-70 line-through"
                }
              >
                {game.players[seat].name}
              </span>
              <span className="ml-auto tabular-nums">
                {T.worth(worthOf(game, seat))}
              </span>
              <span className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                {T.cash(game.players[seat].cash)} {"\u{00B7}"}{" "}
                {ownedBy(game, seat).length} Grundstücke
              </span>
            </li>
          ))}
      </ul>
      {onNewGame !== null && (
        <div>
          <button
            type="button"
            data-testid="mo-again"
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
