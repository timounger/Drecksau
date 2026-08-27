/**
 * *Entdecker & Piraten*: the fleet and what it costs.
 *
 * @module
 * @remarks
 * The board shows where the ships are; what it cannot show is how many are
 * still in the box, and what the four pieces of this expansion cost - which are
 * not the printed prices and so cannot be guessed.
 *
 * Everything that happens **somewhere** happens on the board: building a ship,
 * placing an explorer, growing a settlement into a Hafensiedlung, sailing,
 * loading and going ashore are all a place, and all a tap.
 */
"use client";

import type { ReactElement } from "react";
import {
  MISSION_STEPS,
  camping,
  finding,
  missionPoints,
} from "@/games/catan/engine/entdecker";
import { CATAN_TEXTS as T } from "@/games/catan/i18n/texts";
import type { CatanGame } from "@/games/catan/engine/state";

/**
 * The fleet panel.
 *
 * @param props - the game and the seat looking
 * @returns the panel, or null outside this expansion
 */
export function CatanFind({
  game,
  mySeat,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
}): ReactElement | null {
  const player = game.players[mySeat];
  const afloat = game.boats.filter((boat) => boat.owner === mySeat).length;
  return !finding(game) ? null : (
    <section
      className="flex flex-col gap-1 rounded-2xl border border-amber-300 bg-white p-3 text-xs dark:border-amber-800 dark:bg-zinc-900"
      data-testid="ct-find"
    >
      <h2 className="text-sm font-semibold">{T.findTitle}</h2>
      <span>{T.findGold(player.gold)}</span>
      <span>
        {T.findFleet(player.boatsLeft, player.scoutsLeft, player.portsLeft)}
      </span>
      <span className={afloat === 0 ? "opacity-60" : undefined}>
        {afloat === 0 ? T.findNoBoat : T.findAfloat(afloat)}
      </span>
      <span className="opacity-60">{T.findBuild}</span>
      {camping(game) && (
        <>
          <h2 className="mt-1 text-sm font-semibold">{T.campTitle}</h2>
          <span>{T.campUnits(player.unitsLeft)}</span>
          <span>
            {T.campTaken(
              Object.values(game.camps).filter((camp) => camp.taken).length,
              Object.keys(game.camps).length,
            )}
          </span>
          <span>
            {T.campMission(
              Math.min(game.mission[mySeat] ?? 0, MISSION_STEPS.length - 1),
              missionPoints(game, mySeat),
            )}
          </span>
          <span className="opacity-60">{T.campCost}</span>
        </>
      )}
    </section>
  );
}
