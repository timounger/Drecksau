/**
 * The one door into the simulation: every action of every player - the
 * human and the AI alike - is a plain command object with the player's id,
 * applied between two steps. Commands can be recorded, sent over a network
 * or replayed, which keeps the game ready for multiplayer.
 *
 * @module
 */
import {
  demolishAt,
  levelUp,
  placeBuilding,
  relocateBuilding,
  repairNow,
  setPriority,
} from "./buildings";
import { orderAttack, orderEscort, orderPatrol } from "./combat";
import { buildingAt } from "./derived";
import { answerOffer, propose } from "./diplomacy";
import { createFleet, disbandFleet, moveFleet } from "./fleets";
import { isGoodId } from "./goods";
import { acceptMission, declineMission, deliver } from "./missions";
import { ownerOf, playerById } from "./players";
import { chooseResearch } from "./research";
import { layRoad, paveRoad } from "./roads";
import { berthOf, cancelShip, orderShip, sailTo, transfer } from "./ships";
import { inBounds, isSea } from "./terrain";
import { assignShip, copyStop, createRoute } from "./trade-routes";
import { endTutorial, noteCommand } from "./tutorial";
import {
  cancelTraining,
  embark,
  landTroops,
  marchSoldiers,
  pauseTraining,
  setFormation,
  trainUnits,
  unitAttack,
  unitHold,
  unitPatrol,
  unitRetreat,
} from "./troops";
import {
  Terrain,
  type CommandResult,
  type Game,
  type PlayerCommand,
  type Ship,
} from "./types";

/** Clicking land this close to water sends a ship to that water. */
const SHORE_REACH = 3;

/** Longest route name kept. */
const NAME_LENGTH = 40;

/**
 * Applies a command.
 *
 * @param game - the game
 * @param command - what a player wants, with the player's id
 * @returns ok, or the reason it was refused
 */
export function applyCommand(
  game: Game,
  command: PlayerCommand,
): CommandResult {
  const player = command.player;
  const owner = playerById(game, player);
  let reason: string | null = null;
  if (owner === null || !owner.alive) {
    reason = "missing";
  } else {
    switch (command.type) {
      case "build":
        reason = placeBuilding(
          game,
          player,
          command.kind,
          command.x,
          command.y,
          command.rot,
        );
        break;
      case "road":
        reason = layRoad(game, player, command.tiles) < 0 ? "gold" : null;
        break;
      case "pave":
        reason = paveRoad(game, player, command.tiles) < 0 ? "pave" : null;
        break;
      case "demolish":
        reason = demolishAt(game, player, command.x, command.y);
        break;
      case "relocate":
        reason = relocateBuilding(
          game,
          player,
          command.id,
          command.x,
          command.y,
          command.rot,
        );
        break;
      case "pause":
        reason = setPaused(game, player, command.id, command.paused);
        break;
      case "levelUp":
        reason = levelUp(game, player, command.id);
        break;
      case "repair":
        reason = repairNow(game, player, command.id);
        break;
      case "priority":
        reason = setPriority(game, player, command.id, command.priority);
        break;
      case "tax":
        owner.taxLevel = command.level;
        break;
      case "moveShip":
        reason = moveShip(game, player, command.ship, command.x, command.y);
        break;
      case "transfer": {
        const ship = playerShip(game, player, command.ship);
        reason =
          ship === null || ship.docked < 0 || !isGoodId(command.good)
            ? "notDocked"
            : transfer(game, ship, command.good, command.amount) === 0
              ? "nothing"
              : null;
        break;
      }
      case "buildShip":
        reason = orderShip(game, player, command.yard, command.kind);
        break;
      case "cancelShip":
        reason = cancelShip(game, player, command.yard, command.index);
        break;
      case "shipAttack":
        reason = orderAttack(
          game,
          player,
          command.ship,
          command.target,
          command.building,
        );
        break;
      case "shipPatrol":
        reason = orderPatrol(game, player, command.ship, command.x, command.y);
        break;
      case "shipEscort":
        reason = orderEscort(game, player, command.ship, command.escort);
        break;
      case "fleetCreate":
        reason = createFleet(game, player, command.name, command.ships);
        break;
      case "fleetDisband":
        reason = disbandFleet(game, player, command.fleet);
        break;
      case "fleetMove":
        reason = moveFleet(game, player, command.fleet, command.x, command.y);
        break;
      case "order":
        reason = setOrder(game, command);
        break;
      case "routeCreate":
        reason = command.stops.every(
          (stop) => game.islands[stop.island]?.owner === player,
        )
          ? null
          : "notOwned";
        if (reason === null) {
          createRoute(
            game,
            player,
            command.name.slice(0, NAME_LENGTH),
            command.stops,
          );
        }
        break;
      case "routeUpdate":
        reason = updateRoute(game, command);
        break;
      case "routeDelete":
        reason = deleteRoute(game, player, command.route);
        break;
      case "assign": {
        const ship = playerShip(game, player, command.ship);
        const exists =
          command.route === null ||
          game.routes.some(
            (route) => route.id === command.route && route.owner === player,
          );
        if (ship === null || !exists) {
          reason = "missing";
        } else {
          assignShip(game, ship, command.route);
        }
        break;
      }
      case "diplomacy": {
        const other = playerById(game, command.to);
        if (other === null || other.ai === null || other.id === player) {
          reason = "missing";
        } else {
          const verdict = propose(
            game,
            player,
            command.to,
            command.action,
            command.island,
          );
          reason = verdict.accepted ? null : `dip:${verdict.answer}`;
        }
        break;
      }
      case "answer": {
        const offer = game.diplomacy.offers.find((o) => o.id === command.offer);
        reason =
          offer === undefined || offer.to !== player
            ? "missing"
            : answerOffer(game, command.offer, command.accept, command.island);
        break;
      }
      case "research":
        reason = chooseResearch(owner, command.research);
        break;
      case "train":
        reason = trainUnits(
          game,
          player,
          command.barracks,
          command.unit,
          command.count,
        );
        break;
      case "cancelTraining":
        reason = cancelTraining(game, player, command.barracks, command.index);
        break;
      case "pauseTraining":
        reason = pauseTraining(game, player, command.barracks, command.paused);
        break;
      case "unitAttack":
        reason = unitAttack(game, player, command.soldiers, command.target);
        break;
      case "unitPatrol":
        reason = unitPatrol(
          game,
          player,
          command.soldiers,
          command.x,
          command.y,
        );
        break;
      case "unitHold":
        reason = unitHold(game, player, command.soldiers);
        break;
      case "unitRetreat":
        reason = unitRetreat(game, player, command.soldiers);
        break;
      case "formation":
        reason = setFormation(
          game,
          player,
          command.soldiers,
          command.formation,
        );
        break;
      case "embark":
        reason = embark(game, player, command.ship, command.soldiers ?? null);
        break;
      case "land":
        reason = landTroops(game, player, command.ship, command.island);
        break;
      case "march":
        reason = marchSoldiers(
          game,
          player,
          command.soldiers,
          command.x,
          command.y,
        );
        break;
      case "missionAccept":
        reason = acceptMission(game, player, command.mission);
        break;
      case "missionDecline":
        reason = declineMission(game, player, command.mission);
        break;
      case "missionDeliver":
        reason = deliver(game, player, command.mission, command.island);
        break;
      case "tutorialEnd":
        reason = endTutorial(game, player);
        break;
      default:
        reason = "unknown";
    }
  }
  if (reason === null) {
    noteCommand(game, command);
  }
  return reason === null ? { ok: true } : { ok: false, reason };
}

/** A ship of a player's, by id. */
function playerShip(game: Game, player: number, id: number): Ship | null {
  return (
    game.ships.find((ship) => ship.id === id && ship.owner === player) ?? null
  );
}

/** Pauses or resumes a building of the player's. */
function setPaused(
  game: Game,
  player: number,
  id: number,
  paused: boolean,
): string | null {
  const building = game.buildings.find(
    (b) => b.id === id && ownerOf(game, b) === player,
  );
  if (building !== undefined) {
    building.paused = paused;
  }
  return building === undefined ? "missing" : null;
}

/** Sends a ship somewhere by hand; it leaves any route. */
function moveShip(
  game: Game,
  player: number,
  id: number,
  x: number,
  y: number,
): string | null {
  const ship = playerShip(game, player, id);
  const n = game.world.n;
  let reason: string | null = null;
  const target = shipTarget(
    game,
    Math.min(n - 1, Math.max(0, x)),
    Math.min(n - 1, Math.max(0, y)),
  );
  if (ship === null) {
    reason = "missing";
  } else if (target < 0) {
    reason = "noPath";
  } else {
    ship.order = { type: "move", x, y };
    const ok = sailTo(game, ship, target);
    reason = ok ? null : "noPath";
    if (!ok) {
      ship.order = { type: "idle" };
    }
  }
  return reason;
}

/**
 * The sea tile a ship should head for when the player points at a tile: the
 * berth of a coastal building, the nearest water to a coast, or the water
 * itself.
 */
function shipTarget(game: Game, x: number, y: number): number {
  const world = game.world;
  const n = world.n;
  const building = buildingAt(game, x, y);
  let target = -1;
  if (building !== null) {
    target = berthOf(game, building);
  } else if (isSea(world.terrain[y * n + x] as Terrain)) {
    target = y * n + x;
  } else {
    let best = Infinity;
    for (let dy = -SHORE_REACH; dy <= SHORE_REACH; dy += 1) {
      for (let dx = -SHORE_REACH; dx <= SHORE_REACH; dx += 1) {
        const tx = x + dx;
        const ty = y + dy;
        const distance = Math.hypot(dx, dy);
        if (
          inBounds(world, tx, ty) &&
          isSea(world.terrain[ty * n + tx] as Terrain) &&
          distance < best
        ) {
          best = distance;
          target = ty * n + tx;
        }
      }
    }
  }
  return target;
}

/** Sets or clears a trade order at a kontor of the player's. */
function setOrder(
  game: Game,
  command: Extract<PlayerCommand, { type: "order" }>,
): string | null {
  const state = game.islands[command.island];
  let reason: string | null = null;
  if (
    state === undefined ||
    state.owner !== command.player ||
    !isGoodId(command.good)
  ) {
    reason = "missing";
  } else if (command.order === null) {
    delete state.orders[command.good];
  } else {
    state.orders[command.good] = { ...command.order };
  }
  return reason;
}

/** Changes the stops and the state of a route of the player's. */
function updateRoute(
  game: Game,
  command: Extract<PlayerCommand, { type: "routeUpdate" }>,
): string | null {
  const route = game.routes.find(
    (r) => r.id === command.route && r.owner === command.player,
  );
  if (route !== undefined) {
    route.stops = command.stops.map(copyStop);
    route.active = command.active;
  }
  return route === undefined ? "missing" : null;
}

/** Deletes a route of the player's; its ships stop. */
function deleteRoute(game: Game, player: number, id: number): string | null {
  const route = game.routes.find((r) => r.id === id && r.owner === player);
  if (route !== undefined) {
    game.routes = game.routes.filter((r) => r !== route);
    for (const ship of game.ships) {
      if (ship.order.type === "route" && ship.order.route === id) {
        assignShip(game, ship, null);
      }
    }
  }
  return route === undefined ? "missing" : null;
}
