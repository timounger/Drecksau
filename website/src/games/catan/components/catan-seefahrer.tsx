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
  WONDERS,
  WONDER_KINDS,
  WONDER_STAGES,
  chipWorth,
  cloth,
  clothPoints,
  islandPay,
  tradesOf,
  wonderFree,
  wonderOpen,
  wonders,
  SHIPS_EACH,
  looseShips,
  sailing,
} from "@/games/catan/engine/seefahrer";
import { Button } from "@/games/catan/components/catan-actions";
import { CATAN_TEXTS as T } from "@/games/catan/i18n/texts";
import {
  covers,
  type CatanGame,
  type CatanMove,
} from "@/games/catan/engine/state";

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
  onMove,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly sailingShip: number | null;
  /** Left out where the panel only reports - then no stage can be built. */
  readonly onMove?: (move: CatanMove) => void;
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
      {wonders(game) && (
        <>
          <span>
            {game.wonders[mySeat] === null
              ? T.wonderNone
              : T.wonderMine(
                  WONDERS[game.wonders[mySeat].kind].name,
                  game.wonders[mySeat].stage,
                  WONDER_STAGES,
                )}
          </span>
          <span className="opacity-60">
            {T.wonderOpen(
              WONDER_KINDS.filter((which) => wonderFree(game, which))
                .map((which) => WONDERS[which].name)
                .join(", ") || "-",
            )}
          </span>
          <span className="opacity-60">{T.wonderHow}</span>
          {/* The stages are built here rather than on the board: a wonder
              stands beside a city, not on a crossing of its own, and what the
              rulebook asks for is a payment, not a place. */}
          {onMove !== undefined && game.phase === "trade" && (
            <span className="flex flex-wrap gap-1.5">
              {WONDER_KINDS.filter((which) =>
                game.wonders[mySeat] === null
                  ? wonderFree(game, which) && wonderOpen(game, mySeat, which)
                  : game.wonders[mySeat]?.kind === which &&
                    (game.wonders[mySeat]?.stage ?? 0) < WONDER_STAGES,
              ).map((which) => (
                <Button
                  key={which}
                  label={
                    game.wonders[mySeat] === null
                      ? T.wonderStart(WONDERS[which].name)
                      : T.wonderNext(
                          WONDERS[which].name,
                          (game.wonders[mySeat]?.stage ?? 0) + 1,
                        )
                  }
                  testId={`ct-wonder-${which}`}
                  off={!covers(player.hand, WONDERS[which].cost)}
                  onClick={() => onMove({ kind: "wonder", which })}
                />
              ))}
            </span>
          )}
        </>
      )}
      {cloth(game) && (
        <>
          <span>{T.seaCloth(player.bales, clothPoints(game, mySeat))}</span>
          <span>
            {T.seaVillages(
              tradesOf(game, mySeat).length,
              Object.values(game.villagesOf).filter((each) => each.bales > 0)
                .length,
            )}
          </span>
          <span className="opacity-60">{T.seaClothHow}</span>
        </>
      )}
      {islandPay(game) && (
        <span>{T.seaChips(player.islandChips, chipWorth(game))}</span>
      )}
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
