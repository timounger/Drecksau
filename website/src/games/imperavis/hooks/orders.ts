/**
 * What a right click means for the selected units: ships sail to water in a
 * small formation (a whole fleet together), lie at a kontor or harbour, or
 * attack an enemy ship or building at war; land units march over the land
 * of their island or attack an enemy unit, building or a ship near the
 * shore. Also the selection itself - single picks, Shift to add, boxes,
 * control groups and the next unit for Tab.
 *
 * @module
 * @remarks
 * Plain functions over the game, without React or the DOM. The orders are
 * the engine's own commands (`moveShip`, `fleetMove`, `shipAttack`, `march`,
 * `unitAttack`), so they stay deterministic and carry the player's id like
 * every other command. The selection and the groups are screen state only
 * and never saved; fleets are part of the game.
 */
import { hostile } from "@/games/imperavis/engine/combat";
import { HUMAN, ownerOf } from "@/games/imperavis/engine/players";
import { SHIP } from "@/games/imperavis/engine/ships-data";
import { berthOf, formationGoals } from "@/games/imperavis/engine/ships";
import { inBounds, isSea } from "@/games/imperavis/engine/terrain";
import {
  Terrain,
  type Command,
  type Game,
} from "@/games/imperavis/engine/types";
import { HUD } from "@/games/imperavis/i18n/hud-texts";
import { REFUSAL_TEXTS, TEXTS as T } from "@/games/imperavis/i18n/texts";
import type { Hit, OrderTarget, Pick } from "@/games/imperavis/render/view";

/** Clicking land this close to water sends ships to that water. */
const SHORE_REACH = 3;

/** Own units: ship ids and soldier ids. */
export type Units = {
  readonly ships: readonly number[];
  readonly soldiers: readonly number[];
};

/** The commands of a right click, or why it was refused. */
export type OrderPlan = {
  readonly commands: readonly Command[];
  /** Words for the player when nothing could be ordered, else null. */
  readonly refusal: string | null;
};

/**
 * The own units in a selection.
 *
 * @param game - the game
 * @param pick - the selection
 * @returns ships and soldiers of the human, still there
 */
export function unitsOf(game: Game, pick: Pick): Units {
  let ships: readonly number[] = [];
  let soldiers: readonly number[] = [];
  if (pick.type === "ship") {
    ships = [pick.id];
  } else if (pick.type === "units") {
    ships = pick.ships;
    soldiers = pick.soldiers;
  }
  return alive(game, { ships, soldiers });
}

/**
 * The own units of a list that still exist (ships afloat, soldiers alive).
 *
 * @param game - the game
 * @param units - the ids
 * @returns the ids still there
 */
export function alive(game: Game, units: Units): Units {
  return {
    ships: units.ships.filter((id) =>
      game.ships.some((ship) => ship.id === id && ship.owner === HUMAN),
    ),
    soldiers: units.soldiers.filter((id) =>
      game.soldiers.some(
        (soldier) => soldier.id === id && soldier.owner === HUMAN,
      ),
    ),
  };
}

/**
 * Turns units into a selection: one ship shows its window, several units
 * a group, none nothing.
 *
 * @param units - the ids
 * @returns the selection
 */
export function pickOf(units: Units): Pick {
  let pick: Pick;
  if (units.ships.length === 1 && units.soldiers.length === 0) {
    pick = { type: "ship", id: units.ships[0] };
  } else if (units.ships.length + units.soldiers.length > 0) {
    pick = { type: "units", ships: units.ships, soldiers: units.soldiers };
  } else {
    pick = { type: "none" };
  }
  return pick;
}

/**
 * The selection after a left click.
 *
 * @param game - the game
 * @param current - the selection before
 * @param hit - what was clicked
 * @param additive - Shift held: add own units to the selection, or take
 * them out again
 * @returns the new selection
 */
export function clickPick(
  game: Game,
  current: Pick,
  hit: Hit,
  additive: boolean,
): Pick {
  const own = ownUnit(game, hit);
  let pick: Pick;
  if (additive && own !== null) {
    const units = unitsOf(game, current);
    pick = pickOf({
      ships: toggle(units.ships, own.ships),
      soldiers: toggle(units.soldiers, own.soldiers),
    });
  } else if (additive) {
    pick = current;
  } else if (hit.type === "building" || hit.type === "ship") {
    pick = hit;
  } else {
    pick = own === null ? { type: "none" } : pickOf(own);
  }
  return pick;
}

/**
 * The selection after a selection box.
 *
 * @param game - the game
 * @param current - the selection before
 * @param found - own units in the box
 * @param additive - Shift held: add to the selection
 * @returns the new selection
 */
export function boxPick(
  game: Game,
  current: Pick,
  found: Units,
  additive: boolean,
): Pick {
  const before = additive
    ? unitsOf(game, current)
    : { ships: [], soldiers: [] };
  const pick = pickOf({
    ships: union(before.ships, found.ships),
    soldiers: union(before.soldiers, found.soldiers),
  });
  return additive && pick.type === "none" ? current : pick;
}

/**
 * The next own unit for Tab: ships first, then soldiers on land, each by id.
 *
 * @param game - the game
 * @param current - the selection
 * @param step - 1 forward, -1 back
 * @returns the unit to select and where it is, or null when there is none
 */
export function nextUnit(
  game: Game,
  current: Pick,
  step: number,
): { pick: Pick; x: number; y: number } | null {
  const list = [
    ...game.ships
      .filter((ship) => ship.owner === HUMAN)
      .sort((a, b) => a.id - b.id)
      .map((ship) => ({
        pick: { type: "ship", id: ship.id } as Pick,
        id: ship.id,
        x: ship.x,
        y: ship.y,
      })),
    ...game.soldiers
      .filter((soldier) => soldier.owner === HUMAN && soldier.ship < 0)
      .sort((a, b) => a.id - b.id)
      .map((soldier) => ({
        pick: { type: "units", ships: [], soldiers: [soldier.id] } as Pick,
        id: soldier.id,
        x: soldier.x,
        y: soldier.y,
      })),
  ];
  const at = list.findIndex((entry) => samePick(entry.pick, current));
  const index =
    at < 0
      ? step > 0
        ? 0
        : list.length - 1
      : (at + step + list.length) % list.length;
  const entry = list[index];
  return entry === undefined
    ? null
    : { pick: entry.pick, x: entry.x, y: entry.y };
}

/**
 * The middle of some units, to look at them.
 *
 * @param game - the game
 * @param units - the ids
 * @returns the mean position in tiles, or null for none
 */
export function centreOf(
  game: Game,
  units: Units,
): { x: number; y: number } | null {
  const points = [
    ...game.ships.filter((ship) => units.ships.includes(ship.id)),
    ...game.soldiers.filter((soldier) => units.soldiers.includes(soldier.id)),
  ];
  return points.length === 0
    ? null
    : {
        x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
        y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
      };
}

/**
 * The commands of a right click for the selected own units.
 *
 * @param game - the game
 * @param units - the selected own units
 * @param target - where the click points and what lies there
 * @returns the commands, or why there are none
 */
export function planOrders(
  game: Game,
  units: Units,
  target: OrderTarget,
): OrderPlan {
  const world = game.world;
  const n = world.n;
  const tx = Math.min(n - 1, Math.max(0, Math.floor(target.x)));
  const ty = Math.min(n - 1, Math.max(0, Math.floor(target.y)));
  const onMap = inBounds(world, Math.floor(target.x), Math.floor(target.y));
  const sea = !onMap || isSea(world.terrain[ty * n + tx] as Terrain);
  const ships = game.ships.filter(
    (ship) => ship.owner === HUMAN && units.ships.includes(ship.id),
  );
  const soldiers = game.soldiers.filter(
    (soldier) =>
      soldier.owner === HUMAN &&
      soldier.ship < 0 &&
      units.soldiers.includes(soldier.id),
  );
  const hit = target.hit;
  const enemy =
    hit.type === "ship"
      ? (game.ships.find(
          (ship) => ship.id === hit.id && hostile(game, HUMAN, ship.owner),
        ) ?? null)
      : null;
  const building =
    hit.type === "building"
      ? (game.buildings.find((b) => b.id === hit.id) ?? null)
      : null;
  const foe =
    building !== null && hostile(game, HUMAN, ownerOf(game, building))
      ? building
      : null;
  const enemyUnit =
    hit.type === "soldier"
      ? (game.soldiers.find(
          (s) => s.id === hit.id && hostile(game, HUMAN, s.owner),
        ) ?? null)
      : null;
  const armed = ships.filter((ship) => SHIP[ship.kind].guns !== null);
  // Soldiers sent onto an own ship go aboard it.
  const ownShip =
    hit.type === "ship"
      ? (game.ships.find(
          (ship) => ship.id === hit.id && ship.owner === HUMAN,
        ) ?? null)
      : null;
  const ids = soldiers.map((soldier) => soldier.id);
  const commands: Command[] = [];
  let refusal: string | null = null;
  const march = () =>
    commands.push({ type: "march", soldiers: ids, x: tx, y: ty });
  const strike = (kind: "soldier" | "building" | "ship", id: number) => {
    if (soldiers.length > 0) {
      commands.push({
        type: "unitAttack",
        soldiers: ids,
        target: { kind, id },
      });
    }
  };
  if (ships.length + soldiers.length === 0) {
    refusal = null;
  } else if (enemy !== null || foe !== null || enemyUnit !== null) {
    // Attack: armed ships go after a ship or building, land units after
    // any of them; unarmed ships are left out.
    const id = enemy?.id ?? foe?.id ?? enemyUnit?.id ?? -1;
    if (enemyUnit === null) {
      armed.forEach((ship) =>
        commands.push({
          type: "shipAttack",
          ship: ship.id,
          target: id,
          building: foe !== null,
        }),
      );
    }
    strike(enemy !== null ? "ship" : foe !== null ? "building" : "soldier", id);
    refusal = commands.length === 0 ? HUD.noGuns : null;
  } else if (ownShip !== null && soldiers.length > 0) {
    commands.push({
      type: "embark",
      ship: ownShip.id,
      soldiers: soldiers.map((soldier) => soldier.id),
    });
  } else if (building !== null) {
    if (soldiers.length > 0) {
      march();
    }
    if (ships.length > 0 && berthOf(game, building) >= 0) {
      ships.forEach((ship) =>
        commands.push({
          type: "moveShip",
          ship: ship.id,
          x: building.x,
          y: building.y,
        }),
      );
    } else if (soldiers.length === 0) {
      refusal = T.hintSail(false);
    }
  } else if (sea) {
    const fleet = sameFleet(game, ships);
    if (fleet !== null) {
      commands.push({ type: "fleetMove", fleet, x: tx, y: ty });
    } else {
      shipFormation(game, ships, tx, ty).forEach((command) =>
        commands.push(command),
      );
    }
    refusal = ships.length === 0 ? REFUSAL_TEXTS.notWalkable : null;
  } else if (soldiers.length > 0) {
    march();
  } else if (nearWater(game, tx, ty)) {
    ships.forEach((ship) =>
      commands.push({ type: "moveShip", ship: ship.id, x: tx, y: ty }),
    );
  } else {
    refusal = T.hintSail(false);
  }
  return { commands, refusal };
}

/** Ships sent to places around a water tile, each to its own. */
function shipFormation(
  game: Game,
  ships: readonly { readonly id: number }[],
  x: number,
  y: number,
): Command[] {
  const goals = formationGoals(game, ships.length, x, y);
  return ships.map((ship, k) => ({
    type: "moveShip",
    ship: ship.id,
    x: goals[k].x,
    y: goals[k].y,
  }));
}

/** The fleet all the ships belong to (and only they), or null. */
function sameFleet(
  game: Game,
  ships: readonly { readonly id: number }[],
): number | null {
  const fleet = game.fleets.find(
    (f) =>
      f.owner === HUMAN &&
      ships.length > 1 &&
      ships.every((ship) => f.ships.includes(ship.id)),
  );
  return fleet?.id ?? null;
}

/** Whether there is water close to a land tile, for a ship to go to. */
function nearWater(game: Game, x: number, y: number): boolean {
  const world = game.world;
  const n = world.n;
  let found = false;
  for (let dy = -SHORE_REACH; dy <= SHORE_REACH && !found; dy += 1) {
    for (let dx = -SHORE_REACH; dx <= SHORE_REACH && !found; dx += 1) {
      found =
        inBounds(world, x + dx, y + dy) &&
        isSea(world.terrain[(y + dy) * n + x + dx] as Terrain);
    }
  }
  return found;
}

/** The own unit a hit names, or null. */
function ownUnit(game: Game, hit: Hit): Units | null {
  let units: Units | null = null;
  if (
    hit.type === "ship" &&
    game.ships.some((ship) => ship.id === hit.id && ship.owner === HUMAN)
  ) {
    units = { ships: [hit.id], soldiers: [] };
  } else if (
    hit.type === "soldier" &&
    game.soldiers.some((s) => s.id === hit.id && s.owner === HUMAN)
  ) {
    units = { ships: [], soldiers: [hit.id] };
  }
  return units;
}

/** A list with the ids added, or taken out where all were in already. */
function toggle(list: readonly number[], ids: readonly number[]): number[] {
  const all = ids.length > 0 && ids.every((id) => list.includes(id));
  return all ? list.filter((id) => !ids.includes(id)) : union(list, ids);
}

/** Two lists of ids as one, without doubles, in order. */
function union(a: readonly number[], b: readonly number[]): number[] {
  return [...a, ...b.filter((id) => !a.includes(id))];
}

/** Whether two selections are the same. */
function samePick(a: Pick, b: Pick): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * The ships of a fleet of the human, as a selection.
 *
 * @param game - the game
 * @param fleet - the fleet id
 * @returns its ships
 */
export function fleetUnits(game: Game, fleet: number): Units {
  const found = game.fleets.find((f) => f.id === fleet && f.owner === HUMAN);
  return alive(game, { ships: found?.ships ?? [], soldiers: [] });
}
