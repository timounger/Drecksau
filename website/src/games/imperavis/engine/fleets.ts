/**
 * Fleets: named groups of a player's ships that sail together in formation
 * at the pace of the slowest, and the war orders of single ships - attack,
 * patrol and escort - as commands with the player's id.
 *
 * @module
 * @remarks
 * A fleet only remembers its ships; moving it gives every ship its own place
 * of the formation around the goal and the fleet's id, so that
 * {@link stepShips} keeps them to the slowest. The orders are carried out in
 * the combat rounds ({@link stepShipOrders}): an attacker chases its target
 * until it is gone, a patrol sails to and fro and goes after enemies near
 * it, an escort keeps close to its charge and fights off whoever comes for
 * it. Everything is saved with the game.
 */
import { SHIP } from "./ships-data";
import { formationGoals, sailTo } from "./ships";
import type { Fleet, Game, Ship } from "./types";

/** Longest fleet name kept. */
const NAME_LENGTH = 30;

/** Ships one fleet holds at most. */
export const FLEET_SIZE = 12;

/**
 * Forms a fleet from ships of a player's; a ship leaves any fleet it was in.
 *
 * @param game - the game
 * @param player - whose ships
 * @param name - the fleet's name
 * @param ids - the ships
 * @returns null when formed, else why not
 */
export function createFleet(
  game: Game,
  player: number,
  name: string,
  ids: readonly number[],
): string | null {
  const ships = game.ships.filter(
    (ship) => ship.owner === player && ids.includes(ship.id),
  );
  let reason: string | null = null;
  if (ships.length === 0) {
    reason = "missing";
  } else if (ships.length > FLEET_SIZE) {
    reason = "fleetFull";
  } else {
    const chosen = ships.map((ship) => ship.id);
    for (const fleet of game.fleets) {
      fleet.ships = fleet.ships.filter((id) => !chosen.includes(id));
    }
    game.fleets = game.fleets.filter((fleet) => fleet.ships.length > 0);
    game.fleets.push({
      id: game.nextId,
      owner: player,
      name: name.slice(0, NAME_LENGTH),
      ships: chosen,
    });
    game.nextId += 1;
  }
  return reason;
}

/**
 * Breaks a fleet of the player's up; its ships stay where they are.
 *
 * @param game - the game
 * @param player - whose fleet
 * @param id - the fleet
 * @returns null when done, else why not
 */
export function disbandFleet(
  game: Game,
  player: number,
  id: number,
): string | null {
  const fleet = fleetOf(game, player, id);
  if (fleet !== null) {
    game.fleets = game.fleets.filter((other) => other !== fleet);
  }
  return fleet === null ? "missing" : null;
}

/**
 * Sends a fleet to a water tile in formation, at the pace of its slowest.
 *
 * @param game - the game
 * @param player - whose fleet
 * @param id - the fleet
 * @param x - the goal, tile column
 * @param y - the goal, tile row
 * @returns null when at least one ship is under way, else why not
 */
export function moveFleet(
  game: Game,
  player: number,
  id: number,
  x: number,
  y: number,
): string | null {
  const fleet = fleetOf(game, player, id);
  const ships = fleet === null ? [] : fleetShips(game, fleet);
  const n = game.world.n;
  const gx = Math.min(n - 1, Math.max(0, Math.floor(x)));
  const gy = Math.min(n - 1, Math.max(0, Math.floor(y)));
  const goals = formationGoals(game, ships.length, gx, gy);
  let moving = 0;
  ships.forEach((ship, k) => {
    const goal = goals[k];
    ship.order = { type: "move", x: goal.x, y: goal.y, fleet: id };
    if (sailTo(game, ship, goal.y * n + goal.x)) {
      moving += 1;
    } else {
      ship.order = { type: "idle" };
    }
  });
  return fleet === null ? "missing" : moving === 0 ? "noPath" : null;
}

/**
 * The ships of a fleet still afloat, in order.
 *
 * @param game - the game
 * @param fleet - the fleet
 * @returns its ships
 */
export function fleetShips(game: Game, fleet: Fleet): Ship[] {
  return fleet.ships
    .map((id) => game.ships.find((ship) => ship.id === id))
    .filter((ship): ship is Ship => ship !== undefined);
}

/**
 * The fleet a ship sails in, or null.
 *
 * @param game - the game
 * @param ship - the ship
 * @returns its fleet or null
 */
export function fleetOfShip(game: Game, ship: Ship): Fleet | null {
  return game.fleets.find((fleet) => fleet.ships.includes(ship.id)) ?? null;
}

/**
 * Drops sunk ships from their fleets and fleets with no ship left.
 *
 * @param game - the game
 */
export function pruneFleets(game: Game): void {
  if (game.fleets.length > 0) {
    for (const fleet of game.fleets) {
      fleet.ships = fleet.ships.filter((id) =>
        game.ships.some((ship) => ship.id === id && ship.owner === fleet.owner),
      );
    }
    game.fleets = game.fleets.filter((fleet) => fleet.ships.length > 0);
  }
}

/**
 * The armed ship of a player's with this id, or null.
 *
 * @param game - the game
 * @param player - whose ship
 * @param id - the ship
 * @returns the ship or null
 */
export function warShipOf(game: Game, player: number, id: number): Ship | null {
  return (
    game.ships.find(
      (ship) =>
        ship.id === id &&
        ship.owner === player &&
        SHIP[ship.kind].guns !== null,
    ) ?? null
  );
}

/** A fleet of the player's by id, or null. */
function fleetOf(game: Game, player: number, id: number): Fleet | null {
  return (
    game.fleets.find((fleet) => fleet.id === id && fleet.owner === player) ??
    null
  );
}
