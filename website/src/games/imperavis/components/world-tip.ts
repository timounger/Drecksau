/**
 * The words of the tooltip over a thing on the map: its name and a short
 * line on owner and state.
 *
 * @module
 */
import { BUILDING } from "@/games/imperavis/engine/buildings-data";
import { ownerOf, PIRATES, playerById } from "@/games/imperavis/engine/players";
import { SHIP } from "@/games/imperavis/engine/ships-data";
import { aboard } from "@/games/imperavis/engine/troops";
import { UNIT } from "@/games/imperavis/engine/units-data";
import type { Game } from "@/games/imperavis/engine/types";
import { HUD } from "@/games/imperavis/i18n/hud-texts";
import { UNIT_NAMES } from "@/games/imperavis/i18n/military-texts";
import {
  BUILDING_NAMES,
  SHIP_NAMES,
  TEXTS as T,
  TIER_NAMES,
} from "@/games/imperavis/i18n/texts";
import type { Hit } from "@/games/imperavis/render/view";

/** Percent of a share. */
const PERCENT = 100;

/**
 * The tooltip of a thing on the map, the first line as its heading.
 *
 * @param game - the game
 * @param hit - what the mouse rests on
 * @returns the text, or null when there is nothing (any more)
 */
export function worldTipText(game: Game, hit: Hit): string | null {
  let lines: string[] | null = null;
  if (hit.type === "building") {
    const building = game.buildings.find((b) => b.id === hit.id);
    if (building !== undefined) {
      const def = BUILDING[building.kind];
      lines = [
        building.house !== null
          ? `${BUILDING_NAMES.house} - ${TIER_NAMES[building.house.tier]}`
          : BUILDING_NAMES[building.kind],
        HUD.tipOwner(ownerName(game, ownerOf(game, building))),
        building.complete
          ? HUD.tipState(share(building.hp, def.hp))
          : HUD.tipBuilding(share(building.built, def.buildSeconds)),
      ];
    }
  } else if (hit.type === "ship") {
    const ship = game.ships.find((s) => s.id === hit.id);
    if (ship !== undefined) {
      const troops = aboard(game, ship);
      lines = [
        ship.name !== "" ? ship.name : SHIP_NAMES[ship.kind],
        `${SHIP_NAMES[ship.kind]} - ${HUD.tipOwner(ownerName(game, ship.owner))}`,
        HUD.tipState(share(ship.hp, SHIP[ship.kind].hp)),
        ...(troops > 0 ? [HUD.tipSoldiers(troops)] : []),
      ];
    }
  } else if (hit.type === "soldier") {
    const soldier = game.soldiers.find((s) => s.id === hit.id);
    if (soldier !== undefined) {
      lines = [
        UNIT_NAMES[soldier.kind],
        HUD.tipOwner(ownerName(game, soldier.owner)),
        HUD.tipState(share(soldier.hp, UNIT[soldier.kind].hp)),
      ];
    }
  }
  return lines === null ? null : lines.join("\n");
}

/** The name of a player, the pirates or nobody. */
function ownerName(game: Game, owner: number): string {
  return owner === PIRATES
    ? T.pirates
    : (playerById(game, owner)?.name ?? HUD.free);
}

/** A share as whole percent, at most 100. */
function share(value: number, whole: number): number {
  return Math.min(PERCENT, Math.round((value / Math.max(1, whole)) * PERCENT));
}
