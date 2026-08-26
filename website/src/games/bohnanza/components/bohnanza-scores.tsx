/**
 * How the game came out.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import { leaders, type BohnanzaGame } from "@/games/bohnanza/engine/state";
import { BZ_TEXTS as T } from "@/games/bohnanza/i18n/texts";

/** Props of {@link BohnanzaScores}. */
export type BohnanzaScoresProps = {
  readonly game: BohnanzaGame;
  /** Starts a fresh game, or null where the screen offers no such button. */
  readonly onNewGame: (() => void) | null;
};

/**
 * Renders the final standings.
 *
 * @param props - the finished game and the way into the next one
 * @returns the result element
 * @remarks
 * The tie-break gets a line of its own under the table. A player who has just
 * counted the same number of Taler as somebody else and lost anyway deserves to
 * be told why, and "wer im Uhrzeigersinn am weitesten von der Start-Karte
 * sitzt" is not a rule anybody remembers from the start of the evening.
 */
export function BohnanzaScores({
  game,
  onNewGame,
}: BohnanzaScoresProps): ReactElement {
  const won = leaders(game);
  const ranked = game.players
    .map((player, seat) => ({ player, seat }))
    .sort((left, right) => right.player.coins - left.player.coins);
  const tied = game.players.filter(
    (player) => player.coins === game.players[won[0]]?.coins,
  );

  return (
    <section
      data-testid="bohnanza-scores"
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-lg font-bold">{T.gameOverTitle}</h2>
      <p className="text-sm font-medium">
        {T.winner(game.players[won[0]]?.name ?? "")}
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
            <span className="min-w-0 flex-1 truncate">
              {row.player.name}
              {row.seat === game.starter ? ` (${T.starter})` : ""}
            </span>
            <span className="font-bold tabular-nums">
              {T.coins(row.player.coins)}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
        {T.finalNote}
      </p>
      {tied.length > 1 && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {T.tieNote}
        </p>
      )}
      {onNewGame !== null && (
        <button
          type="button"
          data-testid="bohnanza-again"
          onClick={onNewGame}
          className="cursor-pointer self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {T.playAgain}
        </button>
      )}
    </section>
  );
}
