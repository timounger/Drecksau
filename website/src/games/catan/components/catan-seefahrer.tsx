/**
 * *Seefahrer*: the ships and the islands.
 *
 * @module
 * @remarks
 * Two things the board cannot say on its own: how many ships are still in the
 * box, and how many islands this seat has been first to settle. The third line
 * is the one rule that is easy to forget - a ship may be picked up and put down
 * again, but only one a turn, and never one built this turn.
 *
 * Building a ship and moving one both happen **on the board**, because both are
 * a place.
 */
"use client";

import type { ReactElement } from "react";
import {
  looseShips,
  sailing,
  SHIPS_EACH,
} from "@/games/catan/engine/seefahrer";
import { CATAN_TEXTS as T } from "@/games/catan/i18n/texts";
import type { CatanGame } from "@/games/catan/engine/state";

/**
 * The seafaring panel.
 *
 * @param props - the game, the seat looking, and the ship it has picked
 * @returns the panel, or null outside the scenario
 */
export function CatanSea({
  game,
  mySeat,
  sailingShip,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly sailingShip: number | null;
}): ReactElement | null {
  const player = game.players[mySeat];
  const loose = looseShips(game, mySeat);
  return !sailing(game) ? null : (
    <section
      className="flex flex-col gap-1 rounded-2xl border border-sky-300 bg-white p-3 text-xs dark:border-sky-800 dark:bg-zinc-900"
      data-testid="ct-sea"
    >
      <h2 className="text-sm font-semibold">{T.seaTitle}</h2>
      <span>{T.seaShips(player.shipsLeft)}</span>
      <span>{T.seaChips(player.islandChips)}</span>
      {game.phase === "trade" && (
        <span className="opacity-70">
          {game.shipMoved
            ? T.seaMoved
            : sailingShip !== null
              ? T.seaTo
              : loose.length > 0
                ? T.seaPick
                : T.seaHint}
        </span>
      )}
      {player.shipsLeft === SHIPS_EACH && game.phase === "trade" && (
        <span className="opacity-60">{T.seaHint}</span>
      )}
    </section>
  );
}
