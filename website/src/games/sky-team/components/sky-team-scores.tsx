/**
 * The panel at the end of a landing.
 *
 * @module
 * @remarks
 * Cooperative, so there is nothing to compare and nobody to rank. What there
 * is instead is **why** - and that is worth a whole sentence, because the six
 * ways to lose are six different mistakes and a player told only "verloren"
 * learns nothing about which one they made.
 */
"use client";

import type { ReactElement } from "react";
import type { SkyTeamGame } from "@/games/sky-team/engine/state";
import {
  FAILURE_TEXTS,
  SKY_TEAM_TEXTS as T,
} from "@/games/sky-team/i18n/texts";

/** Props of {@link SkyTeamScores}. */
export type SkyTeamScoresProps = {
  readonly game: SkyTeamGame;
  /** Starts a fresh landing, or null where the screen offers no such button. */
  readonly onNewGame: (() => void) | null;
};

/**
 * Renders the closing panel.
 *
 * @param props - the finished landing and the way into the next one
 * @returns the result element
 */
export function SkyTeamScores({
  game,
  onNewGame,
}: SkyTeamScoresProps): ReactElement {
  const won = game.stage === "won";
  return (
    <section
      data-testid="sky-scores"
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
      {onNewGame !== null && (
        <button
          type="button"
          data-testid="sky-again"
          onClick={onNewGame}
          className="cursor-pointer self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {T.playAgain}
        </button>
      )}
    </section>
  );
}
