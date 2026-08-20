/**
 * How the game came out.
 *
 * @module
 * @remarks
 * There is nothing to add up in Codenames - one side found its agents or
 * somebody shook hands with the assassin - so this says which of the two it was
 * and nothing else. The board underneath tells the rest of the story, because
 * once it is over the key is shown to everybody.
 */
"use client";

import type { ReactElement } from "react";
import {
  TEAM_NAMES,
  agentsFound,
  agentsTotal,
  other,
  type CodenamesGame,
} from "@/games/codenames/engine/state";
import { CN_TEXTS as T } from "@/games/codenames/i18n/texts";

/** Props of {@link CodenamesScores}. */
export type CodenamesScoresProps = {
  readonly game: CodenamesGame;
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
export function CodenamesScores({
  game,
  mySeat,
  onNewGame,
}: CodenamesScoresProps): ReactElement {
  const winner = game.winner;
  const mine = mySeat === null ? null : game.seats[mySeat].team;

  return (
    <section
      data-testid="cn-scores"
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-lg font-bold">{T.gameOverTitle}</h2>
      {winner !== null && (
        <>
          <p
            className={`text-sm font-semibold ${
              winner === "red"
                ? "text-rose-700 dark:text-rose-300"
                : "text-sky-700 dark:text-sky-300"
            }`}
          >
            {mine === null
              ? T.winner(TEAM_NAMES[winner])
              : winner === mine
                ? T.youWon
                : T.youLost}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {game.byAssassin
              ? T.wonByAssassin(TEAM_NAMES[other(winner)])
              : T.winner(TEAM_NAMES[winner])}
          </p>
        </>
      )}

      <ul className="flex flex-wrap gap-2 text-xs">
        {(["red", "blue"] as const).map((team) => (
          <li
            key={team}
            className={`rounded-lg px-2 py-1 font-semibold text-white ${
              team === "red" ? "bg-rose-500" : "bg-sky-600"
            }`}
          >
            {TEAM_NAMES[team]}: {agentsFound(game, team)}/
            {agentsTotal(game, team)}
          </li>
        ))}
      </ul>

      {onNewGame !== null && (
        <button
          type="button"
          data-testid="cn-again"
          onClick={onNewGame}
          className="cursor-pointer self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {T.playAgain}
        </button>
      )}
    </section>
  );
}
