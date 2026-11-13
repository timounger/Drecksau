/**
 * Chance events with real effects: fires (a fire station puts them out),
 * plagues (a doctor keeps houses healthy), storms that damage ships at sea,
 * pirates who raid a kontor, and good or bad harvests.
 *
 * @module
 * @remarks
 * Every roll comes from the game's random state, so events happen the same
 * way after loading a game.
 */
import { BUILDING } from "./buildings-data";
import { removeBuilding } from "./buildings";
import { hitShip } from "./combat";
import { islandsOf, ownerOf, PIRATES } from "./players";
import { populationOf } from "./population";
import { nextRandom, randomPick, randomRange } from "./random";
import { SHIP } from "./ships-data";
import { berthOf, createShip, kontorOf, sailTo } from "./ships";
import { TICK } from "./time";
import type { Building, Game, Incident, IncidentKind } from "./types";

/** Seconds between two rolls for chance events. */
export const INCIDENT_EVERY = 60;

/** The first roll comes this late, seconds. */
export const FIRST_INCIDENT = 300;

/** A fire burns this long at most, seconds... */
export const FIRE_SECONDS = 45;

/** ...a fire station in reach puts it out after this long... */
export const EXTINGUISH_SECONDS = 6;

/** ...and it eats this share of the building's hit points per second. */
const FIRE_DAMAGE = 0.016;

/** Chance per roll and player of a fire, once they have enough buildings. */
const FIRE_CHANCE = 0.12;

/** Buildings a player needs before fires break out. */
const FIRE_FROM = 12;

/** A plague lasts this long, seconds. */
export const PLAGUE_SECONDS = 150;

/** Chance per roll and island of a plague... */
const PLAGUE_CHANCE = 0.04;

/** ...on islands with at least this many residents. */
const PLAGUE_FROM = 80;

/** A house without a doctor loses a resident every this many seconds. */
const PLAGUE_LOSS_EVERY = 10;

/** Chance per roll and island of a good harvest, and of a bad one. */
const HARVEST_CHANCE = 0.04;

/** How a good and a bad harvest change the fields. */
export const GOOD_HARVEST = 1.4;
export const BAD_HARVEST = 0.6;

/** A harvest event lasts this long, seconds. */
export const HARVEST_SECONDS = 240;

/** A storm takes between these shares of a ship's hit points. */
const STORM_LOW = 0.08;
const STORM_HIGH = 0.2;

/** A storm never sinks a ship; it leaves at least this share. */
const STORM_FLOOR = 0.1;

/** Pirates come no earlier than this, seconds. */
export const PIRATES_FROM = 1200;

/** Chance per roll of a pirate raid. */
const PIRATE_CHANCE = 0.08;

/** A raid lasts this long before the pirates give up, seconds. */
export const RAID_SECONDS = 420;

/** After this time two pirate ships come at once, seconds. */
const TWO_PIRATES = 3600;

/** Pirates appear this far in from the edge, tiles. */
const EDGE_IN = 2;

/** A pirate leaving vanishes this close to the edge, tiles. */
const GONE_RANGE = 4;

/** Seconds between two new courses of a pirate. */
const PIRATE_COURSE = 4;

/** Who "fires" when the weather hits a ship: nobody to blame. */
const NATURE = PIRATES - 1;

/** Ended events kept for the list. */
const KEEP_ENDED = 20;

/**
 * One step of chance events.
 *
 * @param game - the game
 */
export function stepIncidents(game: Game): void {
  burn(game);
  storm(game);
  plagueLosses(game);
  pirates(game);
  if (game.time >= game.nextIncident) {
    game.nextIncident = game.time + INCIDENT_EVERY;
    roll(game);
  }
}

/**
 * Sets a building on fire.
 *
 * @param game - the game
 * @param building - the building
 */
export function ignite(game: Game, building: Building): void {
  const owner = ownerOf(game, building);
  building.fire = FIRE_SECONDS;
  addIncident(
    game,
    "fire",
    owner,
    building.island,
    building.x,
    building.y,
    FIRE_SECONDS,
  );
}

/** Burning buildings lose hit points; a fire station puts the fire out. */
function burn(game: Game): void {
  const n = game.world.n;
  for (const building of [...game.buildings]) {
    if (building.fire > 0) {
      const def = BUILDING[building.kind];
      const owner = ownerOf(game, building);
      const at =
        Math.floor(building.y + building.h / 2) * n +
        Math.floor(building.x + building.w / 2);
      const covered = game.coverage.fireStation?.[at] === 1;
      building.fire -= TICK;
      building.hp -= def.hp * FIRE_DAMAGE * TICK;
      building.hitAt = game.time;
      if (covered && FIRE_SECONDS - building.fire >= EXTINGUISH_SECONDS) {
        building.fire = 0;
        game.events.push({
          type: "fireOut",
          player: owner,
          kind: building.kind,
        });
      } else if (building.hp <= 0) {
        removeBuilding(game, building, false);
        game.events.push({
          type: "destroyed",
          player: owner,
          kind: building.kind,
          x: building.x,
          y: building.y,
        });
      }
    }
  }
}

/** A new storm damages every ship at sea once. */
function storm(game: Game): void {
  const raging = game.incidents.some(
    (incident) => incident.kind === "storm" && incident.until >= game.time,
  );
  if (game.weather === "storm" && !raging) {
    addIncident(game, "storm", -1, -1, 0, 0, game.weatherUntil - game.time);
    for (const ship of game.ships) {
      const def = SHIP[ship.kind];
      if (ship.docked < 0 && ship.owner !== PIRATES) {
        const loss = def.hp * randomRange(game, STORM_LOW, STORM_HIGH);
        const floor = def.hp * STORM_FLOOR;
        if (ship.hp - loss > floor) {
          hitShip(game, ship, loss / (1 - def.armour), NATURE);
        } else {
          ship.hp = Math.min(ship.hp, floor);
        }
      }
    }
  }
}

/** During a plague houses without a doctor lose residents. */
function plagueLosses(game: Game): void {
  const every = Math.round(PLAGUE_LOSS_EVERY / TICK);
  if (game.tick % every === 0) {
    const n = game.world.n;
    for (const building of game.buildings) {
      const island = game.islands[building.island];
      const house = building.house;
      const at =
        Math.floor(building.y + building.h / 2) * n +
        Math.floor(building.x + building.w / 2);
      if (
        house !== null &&
        island.plague > 0 &&
        game.coverage.doctor?.[at] !== 1 &&
        house.residents > 1
      ) {
        house.residents -= 1;
      }
    }
  }
}

/** Rolls the dice for fires, plagues, harvests and pirates. */
function roll(game: Game): void {
  for (const player of game.players) {
    const buildings = game.buildings.filter(
      (b) =>
        b.complete &&
        b.kind !== "kontor" &&
        b.fire <= 0 &&
        ownerOf(game, b) === player.id,
    );
    // Fires break out once a fire station could be built against them.
    const guarded = player.unlocked.includes("fireStation");
    if (
      guarded &&
      buildings.length >= FIRE_FROM &&
      nextRandom(game) < FIRE_CHANCE
    ) {
      ignite(game, randomPick(game, buildings));
    }
    for (const id of islandsOf(game, player.id)) {
      const island = game.islands[id];
      const people = game.buildings
        .filter((b) => b.island === id && b.house !== null)
        .reduce((sum, b) => sum + (b.house?.residents ?? 0), 0);
      const info = game.world.islands[id];
      if (
        people >= PLAGUE_FROM &&
        island.plague <= 0 &&
        nextRandom(game) < PLAGUE_CHANCE
      ) {
        island.plague = PLAGUE_SECONDS;
        addIncident(
          game,
          "plague",
          player.id,
          id,
          info.cx,
          info.cy,
          PLAGUE_SECONDS,
        );
      }
      const fields = game.buildings.some(
        (b) => b.island === id && BUILDING[b.kind].recipe?.seasonal === "crop",
      );
      const harvest = nextRandom(game);
      if (
        fields &&
        (island.harvest === null || island.harvest.until < game.time)
      ) {
        if (harvest < HARVEST_CHANCE) {
          island.harvest = {
            factor: GOOD_HARVEST,
            until: game.time + HARVEST_SECONDS,
          };
          addIncident(
            game,
            "goodHarvest",
            player.id,
            id,
            info.cx,
            info.cy,
            HARVEST_SECONDS,
          );
        } else if (harvest < HARVEST_CHANCE * 2) {
          island.harvest = {
            factor: BAD_HARVEST,
            until: game.time + HARVEST_SECONDS,
          };
          addIncident(
            game,
            "badHarvest",
            player.id,
            id,
            info.cx,
            info.cy,
            HARVEST_SECONDS,
          );
        }
      }
    }
  }
  const raiding = game.ships.some((ship) => ship.owner === PIRATES);
  if (
    !game.settings.peaceful &&
    !raiding &&
    game.time >= PIRATES_FROM &&
    nextRandom(game) < PIRATE_CHANCE
  ) {
    raid(game);
  }
}

/** Pirates sail in against the island of a well-off player. */
function raid(game: Game): void {
  const targets = game.islands.filter(
    (island) => island.owner >= 0 && kontorOf(game, island.id) !== null,
  );
  if (targets.length > 0) {
    // Richer players draw pirates more: pick by people, from a random start.
    const weights = targets.map(
      (island) => 1 + populationOf(game, island.owner),
    );
    let pick = nextRandom(game) * weights.reduce((a, b) => a + b, 0);
    let target = targets[0];
    targets.forEach((island, index) => {
      if (pick >= 0) {
        target = island;
      }
      pick -= weights[index];
    });
    const info = game.world.islands[target.id];
    const n = game.world.n;
    const x = info.cx < n / 2 ? EDGE_IN : n - 1 - EDGE_IN;
    const y = info.cy < n / 2 ? EDGE_IN : n - 1 - EDGE_IN;
    const count = game.time >= TWO_PIRATES ? 2 : 1;
    for (let i = 0; i < count; i += 1) {
      createShip(game, PIRATES, "pirate", x + i * 2, y);
    }
    addIncident(game, "pirates", target.owner, target.id, x, y, RAID_SECONDS);
  }
}

/** Pirates head for their target's kontor, then home over the edge. */
function pirates(game: Game): void {
  const raid = game.incidents.find((incident) => incident.kind === "pirates");
  const course = Math.round(PIRATE_COURSE / TICK);
  const n = game.world.n;
  for (const ship of [...game.ships]) {
    if (ship.owner === PIRATES && game.tick % course === ship.id % course) {
      const active = raid !== undefined && raid.until > game.time;
      const kontor = active ? kontorOf(game, raid.island) : null;
      if (kontor !== null) {
        if (ship.path.length === 0) {
          sailTo(game, ship, berthOf(game, kontor));
        }
      } else {
        const x = ship.x < n / 2 ? EDGE_IN : n - 1 - EDGE_IN;
        const y = ship.y < n / 2 ? EDGE_IN : n - 1 - EDGE_IN;
        if (Math.hypot(ship.x - x, ship.y - y) < GONE_RANGE) {
          game.ships = game.ships.filter((other) => other.id !== ship.id);
        } else if (ship.path.length === 0) {
          sailTo(game, ship, y * n + x);
        }
      }
    }
  }
}

/** Records an event for the list and tells the screen. */
function addIncident(
  game: Game,
  kind: IncidentKind,
  owner: number,
  island: number,
  x: number,
  y: number,
  seconds: number,
): void {
  const incident: Incident = {
    id: game.nextId,
    kind,
    owner,
    island,
    at: game.time,
    until: game.time + seconds,
    x,
    y,
  };
  game.nextId += 1;
  game.incidents.push(incident);
  game.events.push({ type: "incident", kind, player: owner, island, x, y });
  const ended = game.incidents.filter((i) => i.until < game.time);
  if (ended.length > KEEP_ENDED) {
    game.incidents = game.incidents.filter((i) => i !== ended[0]);
  }
}
