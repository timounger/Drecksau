/**
 * The panel at the end of a call-out.
 *
 * @module
 * @remarks
 * Cooperative, so there is nothing to rank. What there is instead is why - and
 * the two ways to lose are two different mistakes.
 */
"use client";

import type { ReactElement } from "react";
import type { FlashPointGame } from "@/games/flash-point/engine/state";
import {
  FAILURE_TEXTS,
  FLASH_POINT_TEXTS as T,
} from "@/games/flash-point/i18n/texts";

/** Props of {@link FlashPointScores}. */
export type FlashPointScoresProps = {
  readonly game: FlashPointGame;
  /** Starts a fresh call-out, or null where the screen offers no such button. */
  readonly onNewGame: (() => void) | null;
};

/**
 * Renders the closing panel.
 *
 * @param props - the finished call-out and the way into the next one
 * @returns the result element
 */
export function FlashPointScores({
  game,
  onNewGame,
}: FlashPointScoresProps): ReactElement {
  const won = game.stage === "won";
  return (
    <section
      data-testid="fp-scores"
      className={`flex flex-col gap-3 rounded-2xl border p-4 ${
        won
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
          : "border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30"
      }`}
    >
      <h2 className="text-lg font-bold">{won ? T.won : T.lost}</h2>
      <p className="text-sm">
        {won
          ? T.wonLine
          : game.failure === null
            ? T.lost
            : FAILURE_TEXTS[game.failure]}
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        {T.rescued(game.rescued)} - {T.dead(game.dead)}
      </p>
      {onNewGame !== null && (
        <button
          type="button"
          data-testid="fp-again"
          onClick={onNewGame}
          className="cursor-pointer self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {T.playAgain}
        </button>
      )}
    </section>
  );
}
