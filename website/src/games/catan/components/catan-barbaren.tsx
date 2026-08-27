/**
 * *Der Barbarenüberfall*: what a player has to keep an eye on.
 *
 * @module
 * @remarks
 * Four things the board cannot say on its own: how many barbarians are still
 * waiting beside it, how many knights this seat still has in reserve, how many
 * prisoners it has taken, and which card is on the table right now. Everything
 * else in this scenario happens **on** the board, so this panel stays a
 * scoreboard rather than a set of buttons.
 */
"use client";

import type { ReactElement } from "react";
import {
  RAID_CARD_NAMES,
  conquered,
  knightsLeft,
  raiding,
} from "@/games/catan/engine/barbaren";
import { CATAN_TEXTS as T } from "@/games/catan/i18n/texts";
import type { CatanGame } from "@/games/catan/engine/state";

/**
 * The barbarian panel.
 *
 * @param props - the game and the seat looking
 * @returns the panel, or null outside the scenario
 */
export function CatanRaid({
  game,
  mySeat,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
}): ReactElement | null {
  const fallen = game.fort.coast.filter((hex) => conquered(game, hex)).length;
  return !raiding(game) ? null : (
    <section
      className="flex flex-col gap-1 rounded-2xl border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900"
      data-testid="ct-raid"
    >
      <h2 className="text-sm font-semibold">{T.raidTitle}</h2>
      <span>{T.raidLeft(game.barbariansLeft)}</span>
      <span>{T.knightsHeld(knightsLeft(game, mySeat))}</span>
      <span>{T.prisonersHeld(game.players[mySeat].prisoners)}</span>
      {fallen > 0 && (
        <span className="font-semibold text-rose-700 dark:text-rose-400">
          {T.coastLost(fallen)}
        </span>
      )}
      {game.raidCard !== null && (
        <span className="font-semibold">
          {T.raidCard(RAID_CARD_NAMES[game.raidCard])}
        </span>
      )}
    </section>
  );
}
