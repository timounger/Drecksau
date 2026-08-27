/**
 * The end of a game.
 *
 * @module
 * @remarks
 * This is the one screen where the hidden cards come out. All game long the
 * standings show what is on the table, because a Siegpunkt card is meant to be
 * a surprise - "du deckst sie erst auf, wenn du mindestens 10 Punkte erreicht
 * hast". Once somebody has, the final table counts everything, and the row
 * spells out where each player's points came from, so the surprise is at least
 * explained.
 */
"use client";

import type { ReactElement } from "react";
import { COLOUR_INK } from "@/games/catan/engine/setup";
import {
  TILE_POINTS,
  hiddenPoints,
  pointsOf,
  type CatanGame,
} from "@/games/catan/engine/state";
import { CATAN_TEXTS as T } from "@/games/catan/i18n/texts";

/** Props of {@link CatanScores}. */
export type CatanScoresProps = {
  readonly game: CatanGame;
  readonly mySeat: number | null;
  /** Deals again, or null for somebody who is not the one dealing. */
  readonly onNewGame: (() => void) | null;
};

/** Where one player's points came from. */
function breakdown(game: CatanGame, seat: number): string {
  const towns = game.towns.filter(
    (t) => t !== null && t.owner === seat && !t.city,
  ).length;
  const cities = game.towns.filter(
    (t) => t !== null && t.owner === seat && t.city,
  ).length;
  const parts: string[] = [];
  if (towns > 0) {
    parts.push(`${towns} Siedlungen`);
  }
  if (cities > 0) {
    parts.push(`${cities} Städte`);
  }
  if (game.longest === seat) {
    parts.push(`${T.routeTile} (${TILE_POINTS})`);
  }
  if (game.army === seat) {
    parts.push(`${T.armyTile} (${TILE_POINTS})`);
  }
  if (game.harbourTile === seat) {
    parts.push(`${T.harbourTile} (${TILE_POINTS})`);
  }
  const hidden = hiddenPoints(game.players[seat]);
  if (hidden > 0) {
    parts.push(`${hidden} Siegpunktkarten`);
  }
  return parts.join(", ");
}

/**
 * Renders the closing screen.
 *
 * @param props - the finished game and the way to start another
 * @returns the screen element
 */
export function CatanScores({
  game,
  mySeat,
  onNewGame,
}: CatanScoresProps): ReactElement {
  const winner = game.winner;
  const mine = winner !== null && winner === mySeat;

  return (
    <section
      data-testid="ct-over"
      className={`flex flex-col gap-3 rounded-2xl border-2 p-4 ${
        mine
          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
          : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
      }`}
    >
      <h2 className="text-xl font-black">
        {mine ? T.youWon : T.won(game.players[winner ?? 0].name)}
      </h2>
      <h3 className="text-sm font-semibold opacity-70">{T.finalPoints}</h3>
      <ul className="flex flex-col gap-1 text-sm">
        {[...game.players.keys()]
          .sort((left, right) => pointsOf(game, right) - pointsOf(game, left))
          .map((seat) => (
            <li key={seat} className="flex flex-wrap items-center gap-2">
              <span
                aria-hidden
                className="h-3 w-3 shrink-0 rounded-full border border-black/30"
                style={{ background: COLOUR_INK[game.players[seat].colour] }}
              />
              <span className={seat === winner ? "font-bold" : "opacity-70"}>
                {game.players[seat].name}
              </span>
              <span className="text-xs opacity-60">
                {breakdown(game, seat)}
              </span>
              <span className="ml-auto tabular-nums">
                {T.points(pointsOf(game, seat))}
              </span>
            </li>
          ))}
      </ul>
      {onNewGame !== null && (
        <div>
          <button
            type="button"
            data-testid="ct-again"
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
