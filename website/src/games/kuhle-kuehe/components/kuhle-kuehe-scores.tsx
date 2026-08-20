/**
 * The final standings.
 *
 * @module
 * @remarks
 * Shows where the points came from rather than only the total, because the
 * scoring is the argument at the end of this game: a short pure-bred cow beats
 * a long crossed one, and the table only believes that once it sees the two
 * numbers side by side.
 */
"use client";

import type { ReactElement } from "react";
import {
  AWARD_POINTS,
  awardPoints,
  cowPoints,
  isPure,
  leaders,
  scoreOf,
  type KuhleKueheGame,
} from "@/games/kuhle-kuehe/engine/state";
import { KUHLE_TEXTS as T } from "@/games/kuhle-kuehe/i18n/texts";

/** Props of {@link KuhleKueheScores}. */
export type KuhleKueheScoresProps = {
  readonly game: KuhleKueheGame;
  /** Starts a fresh game, or null where the screen offers no such button. */
  readonly onNewGame: (() => void) | null;
};

/**
 * Renders the final standings.
 *
 * @param props - the finished game and the way into the next one
 * @returns the result element
 */
export function KuhleKueheScores({
  game,
  onNewGame,
}: KuhleKueheScoresProps): ReactElement {
  const won = leaders(game);
  const ranked = game.players
    .map((player, seat) => ({ player, seat, score: scoreOf(game, seat) }))
    .sort((left, right) => right.score - left.score);

  return (
    <section
      data-testid="kuhle-scores"
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-lg font-bold">{T.gameOverTitle}</h2>
      <p className="text-sm font-medium">
        {won.length === 1
          ? T.winner(game.players[won[0]].name)
          : T.winners(won.map((seat) => game.players[seat].name).join(", "))}
      </p>

      <table className="w-full text-left text-sm">
        <tbody>
          {ranked.map((row) => {
            const pure = row.player.herd
              .filter(isPure)
              .reduce((sum, cow) => sum + cowPoints(cow), 0);
            const mixed = row.player.herd
              .filter((cow) => !isPure(cow))
              .reduce((sum, cow) => sum + cowPoints(cow), 0);
            return (
              <tr
                key={row.player.name + row.seat}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
              >
                <td className="py-1 pr-2 font-medium">{row.player.name}</td>
                <td className="py-1 pr-2 text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                  {pure} {T.pure} · {mixed} {T.mixed} ·{" "}
                  {row.player.calves.length} {T.calves} ·{" "}
                  {awardPoints(game.awards, row.seat)} Ausz.
                </td>
                <td className="py-1 text-right font-bold tabular-nums">
                  {row.score}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
        {T.awardFirst} {AWARD_POINTS.firstCow} · {T.awardBiggest}{" "}
        {AWARD_POINTS.biggestHerd} · {T.awardLongest} {AWARD_POINTS.longestCow}
      </p>

      {onNewGame !== null && (
        <button
          type="button"
          data-testid="kuhle-again"
          onClick={onNewGame}
          className="cursor-pointer self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {T.playAgain}
        </button>
      )}
    </section>
  );
}
