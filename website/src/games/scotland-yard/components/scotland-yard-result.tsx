/**
 * The end of a chase: who won, how, and where Mister X really was.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import type { ScotlandYardGame } from "@/games/scotland-yard/engine/state";
import { SCOTLAND_YARD_TEXTS as T } from "@/games/scotland-yard/i18n/texts";

/**
 * Renders the result box.
 *
 * @param props - the finished game, and the way to start another (null for a
 *   guest online, who waits for the host)
 * @returns the box
 */
export function ScotlandYardResult({
  game,
  onNewGame,
}: {
  readonly game: ScotlandYardGame;
  readonly onNewGame: (() => void) | null;
}): ReactElement {
  const catcher =
    game.caughtBy === null ? "" : (game.detectives[game.caughtBy]?.name ?? "");
  const won = game.winner === "misterX";
  return (
    <section
      data-testid="sy-result"
      className={`flex flex-col gap-2 rounded-2xl border p-4 ${
        won
          ? "border-zinc-400 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900"
          : "border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/40"
      }`}
    >
      <h2 className="text-lg font-bold">
        {T.winner(game.winner ?? "misterX", game.misterX.name)}
      </h2>
      {game.endReason !== null && (
        <p className="text-sm">
          {T.end(game.endReason, game.misterX.name, catcher)}
        </p>
      )}
      {game.misterX.position !== null && (
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {T.wasAt(game.misterX.name, game.misterX.position)}
        </p>
      )}
      {onNewGame !== null && (
        <button
          type="button"
          onClick={onNewGame}
          className="cursor-pointer self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {T.newGame}
        </button>
      )}
    </section>
  );
}
