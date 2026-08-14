/**
 * The closing table: which camel won, and who backed it.
 *
 * @module
 * @remarks
 * The race is settled by the camels, the game by the money. Both are on this
 * panel and in that order, because the first explains the second: the purse
 * makes no sense until you know which animal came home.
 */
"use client";

import type { ReactElement } from "react";
import {
  CAMEL_INK,
  CAMEL_LABELS,
  leaders,
  standings,
  type CamelUpGame,
} from "@/games/camel-up/engine/state";
import { CAMEL_TEXTS as T } from "@/games/camel-up/i18n/texts";

/** Props of {@link CamelUpScores}. */
export type CamelUpScoresProps = {
  readonly game: CamelUpGame;
  /** Starts a fresh race, or null where the screen offers no such button. */
  readonly onNewGame: (() => void) | null;
};

/**
 * Renders the final standings.
 *
 * @param props - the finished race and the way into the next one
 * @returns the result element
 */
export function CamelUpScores({
  game,
  onNewGame,
}: CamelUpScoresProps): ReactElement {
  const order = standings(game.track);
  const winners = leaders(game);
  const ranked = game.players
    .map((player, seat) => ({ player, seat }))
    .sort((left, right) => right.player.coins - left.player.coins);

  return (
    <section
      data-testid="camel-scores"
      className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30"
    >
      <h2 className="text-lg font-bold">{T.gameOverTitle}</h2>
      <p className="flex flex-wrap items-center gap-2 text-sm">
        <Dot camel={order[0]} />
        {T.raceWinner(CAMEL_LABELS[order[0]])}
        <span className="text-zinc-400">·</span>
        <Dot camel={order[order.length - 1]} />
        {T.raceLoser(CAMEL_LABELS[order[order.length - 1]])}
      </p>
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
            <span className="min-w-0 flex-1 truncate">{entry.player.name}</span>
            <span className="w-16 text-right font-bold tabular-nums">
              {entry.player.coins} {T.coinsShort}
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

/** A camel's colour as a small square. */
function Dot({
  camel,
}: {
  readonly camel: keyof typeof CAMEL_INK;
}): ReactElement {
  return (
    <span
      aria-hidden
      className="h-4 w-4 shrink-0 rounded ring-1 ring-zinc-300"
      style={{ backgroundColor: CAMEL_INK[camel] }}
    />
  );
}
