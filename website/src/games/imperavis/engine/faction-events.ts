/**
 * What happens to the foreign peoples and pirates now and then, with real
 * effects on their stocks, prices and fleets - famine, epidemic, a storm
 * in the harbour, a rich harvest, a ruler asking for help; the pirates
 * gathering for a great raid, a captain selling a treasure map, a demand
 * for protection money, a loot convoy, a sighting, a mutiny - and the
 * missions the factions offer the human.
 *
 * @module
 * @remarks
 * Every roll comes from the game's random state. Each event is also an
 * incident (`incidents.ts`), so it shows in the news and the event list.
 */
import { relationOf } from "./diplomacy";
import { eventOn, raidsOn } from "./disasters-data";
import { CAPTAINS } from "./factions-data";
import { shipOf } from "./faction-fleet";
import {
  alliedWith,
  cultureOf,
  demandOf,
  factionOpinion,
  FOODS,
  note,
  offerOf,
} from "./factions";
import { GOOD } from "./goods";
import { addIncident } from "./incidents";
import { offerFactionMission } from "./missions";
import { HUMAN, playerById } from "./players";
import { MAP_PRICE } from "./pirates";
import { nextRandom, randomInt, randomPick } from "./random";
import { roomFor } from "./ships";
import { SHIP } from "./ships-data";
import type { Faction, Game, GoodId, IncidentKind } from "./types";

/** The first mission of a faction comes this late, seconds... */
const FIRST_MISSION = 240;

/** ...the next ones this far apart. */
const MISSION_MIN = 300;
const MISSION_MAX = 600;

/** Factions take turns with their first offers, this far apart. */
const MISSION_STAGGER = 45;

/** The first event of a faction comes this late, seconds... */
const FIRST_EVENT = 420;

/** ...the next ones this far apart. */
const EVENT_MIN = 420;
const EVENT_MAX = 840;

/** Factions take turns with their first events, this far apart. */
const EVENT_STAGGER = 70;

/** How long the effects of the events last, seconds. */
const FAMINE_SECONDS = 300;
const EPIDEMIC_SECONDS = 300;
const STORM_SECONDS = 120;
const HARVEST_SECONDS = 300;
const GATHER_SECONDS = 180;
const DEMAND_SECONDS = 300;
const SIGHTED_SECONDS = 120;

/** A storm in the harbour ruins this share of the largest stocks... */
const STORM_LOSS = 0.2;

/** ...of this many goods. */
const STORM_GOODS = 3;

/** A mutiny halves every memory of the band. */
const MUTINY_KEEP = 0.5;

/** Units of a cargo mission per difficulty, and its pay over the price. */
const CARGO_STEP = 20;
const CARGO_PAY = 1.4;

/** Pirate ships to sink for a people's hunt, at most. */
const HUNT_MOST = 3;

/** A loot convoy takes at most this much along. */
const CONVOY_LOAD = 40;

/** A convoy needs at least this much loot worth in store. */
const CONVOY_WORTH = 1500;

/** Goods the pirates ask for in their tavern. */
const TAVERN_GOODS: readonly GoodId[] = [
  "cannons",
  "weapons",
  "tools",
  "wine",
  "beer",
];

/** The kinds of event of a people, and of a pirate band. */
const NATION_EVENTS: readonly IncidentKind[] = [
  "famine",
  "epidemic",
  "harbourStorm",
  "caravan",
  "aid",
];
const PIRATE_EVENTS: readonly IncidentKind[] = [
  "gathering",
  "treasure",
  "demand",
  "convoy",
  "sighted",
  "mutiny",
];

/**
 * One look of a faction at its missions and events.
 *
 * @param game - the game
 * @param faction - the faction
 */
export function stepFactionEvents(game: Game, faction: Faction): void {
  const index = game.factions.indexOf(faction);
  if (faction.nextMission === 0) {
    faction.nextMission = FIRST_MISSION + index * MISSION_STAGGER;
  }
  if (faction.nextEvent === 0) {
    faction.nextEvent = FIRST_EVENT + index * EVENT_STAGGER;
  }
  if (game.time >= faction.nextMission) {
    faction.nextMission = game.time + randomInt(game, MISSION_MIN, MISSION_MAX);
    offerMission(game, faction);
  }
  if (
    game.time >= faction.nextEvent &&
    eventOn(game.settings, "factionEvents")
  ) {
    faction.nextEvent = game.time + randomInt(game, EVENT_MIN, EVENT_MAX);
    happen(
      game,
      faction,
      randomPick(
        game,
        faction.kind === "pirates" ? PIRATE_EVENTS : NATION_EVENTS,
      ),
    );
  }
}

/**
 * Lets an event of a faction happen now (also for tests and the debug door).
 *
 * @param game - the game
 * @param faction - the faction
 * @param kind - the event
 * @returns true when it could happen
 */
export function happen(
  game: Game,
  faction: Faction,
  kind: IncidentKind,
): boolean {
  const info = game.world.islands[faction.island];
  const effects = faction.effects;
  let seconds = 0;
  switch (kind) {
    case "famine":
      effects.famine = game.time + FAMINE_SECONDS;
      seconds = FAMINE_SECONDS;
      offerCargo(game, faction, randomPick(game, FOODS), 2);
      break;
    case "epidemic":
      effects.plague = game.time + EPIDEMIC_SECONDS;
      seconds = EPIDEMIC_SECONDS;
      break;
    case "harbourStorm":
      effects.storm = game.time + STORM_SECONDS;
      seconds = STORM_SECONDS;
      for (const good of (Object.keys(faction.stock) as GoodId[])
        .sort((a, b) => faction.stock[b] - faction.stock[a])
        .slice(0, STORM_GOODS)) {
        faction.stock[good] = Math.floor(
          faction.stock[good] * (1 - STORM_LOSS),
        );
      }
      break;
    case "caravan": {
      const goods = offerOf(faction);
      effects.boost = game.time + HARVEST_SECONDS;
      effects.boostGood = goods.length > 0 ? randomPick(game, goods) : null;
      seconds = HARVEST_SECONDS;
      break;
    }
    case "aid":
      seconds = offerHunt(game, faction) ? MISSION_MIN : 0;
      break;
    case "gathering":
      effects.gathering = game.time + GATHER_SECONDS;
      seconds = raidsOn(game.settings) ? GATHER_SECONDS : 0;
      if (!raidsOn(game.settings)) {
        effects.gathering = 0;
      }
      break;
    case "treasure":
      faction.market.push({
        good: "treasureMap",
        amount: 1,
        price: Math.round(MAP_PRICE / 2),
      });
      seconds = faction.marketUntil - game.time;
      break;
    case "demand":
      // Allies pay nothing.
      if (!game.settings.peaceful && !alliedWith(game, faction, HUMAN)) {
        faction.demand = { player: HUMAN, until: game.time + DEMAND_SECONDS };
        seconds = DEMAND_SECONDS;
      }
      break;
    case "convoy":
      seconds = sendConvoy(game, faction);
      break;
    case "sighted":
      seconds = sighting(game, faction);
      break;
    default:
      mutiny(game, faction);
      seconds = 1;
  }
  if (seconds > 0) {
    addIncident(
      game,
      kind,
      faction.id,
      faction.island,
      info.cx,
      info.cy,
      seconds,
    );
  }
  return seconds > 0;
}

/** Offers a mission of the faction to the human, if it has none waiting. */
function offerMission(game: Game, faction: Faction): void {
  const relation = relationOf(game, faction.id, HUMAN);
  const waiting = game.missions.some(
    (m) =>
      m.giver === faction.id && (m.state === "offered" || m.state === "active"),
  );
  const opinion = factionOpinion(game, faction, HUMAN);
  // The tavern deals with the pirates' enemies all the same.
  if (
    relation !== null &&
    (!relation.war || faction.kind === "pirates") &&
    !waiting &&
    playerById(game, HUMAN)?.alive === true &&
    opinion >= cultureOf(faction).tradeFloor
  ) {
    if (faction.kind === "pirates") {
      if (nextRandom(game) < 1 / 2) {
        offerCargo(game, faction, randomPick(game, TAVERN_GOODS), 1);
      } else {
        offerSink(game, faction);
      }
    } else if (nextRandom(game) < 1 / 2 || !offerHunt(game, faction)) {
      const goods = demandOf(faction);
      // What it lacks most.
      const good = [...goods].sort(
        (a, b) => faction.stock[a] - faction.stock[b],
      )[0];
      if (good !== undefined) {
        offerCargo(game, faction, good, 1);
      }
    }
  }
}

/** A mission to bring goods to the faction's harbour. */
function offerCargo(
  game: Game,
  faction: Faction,
  good: GoodId,
  urgency: number,
): void {
  const difficulty = randomInt(game, 1, HUNT_MOST);
  const amount = CARGO_STEP * difficulty;
  const gold = Math.round(amount * GOOD[good].value * CARGO_PAY * urgency);
  offerFactionMission(game, faction, "cargo", difficulty, {
    good,
    goal: amount,
    gold,
    target: -1,
  });
}

/** A people's mission to sink pirate ships. */
function offerHunt(game: Game, faction: Faction): boolean {
  const pirates = game.factions.some((f) => f.kind === "pirates");
  if (pirates && !game.settings.peaceful) {
    const difficulty = randomInt(game, 1, HUNT_MOST);
    offerFactionMission(game, faction, "hunt", difficulty, {
      good: null,
      goal: difficulty,
      gold: 0,
      target: -1,
    });
  }
  return pirates && !game.settings.peaceful;
}

/** The pirates' mission to sink one merchant of a rival or a people. */
function offerSink(game: Game, faction: Faction): void {
  const prey = game.ships.filter(
    (ship) =>
      SHIP[ship.kind].role === "trade" &&
      ship.docked < 0 &&
      ((ship.owner > HUMAN && playerById(game, ship.owner) !== null) ||
        game.factions.some((f) => f.id === ship.owner && f.kind === "nation")),
  );
  if (prey.length > 0 && !game.settings.peaceful) {
    const target = randomPick(game, prey);
    offerFactionMission(game, faction, "sink", 2, {
      good: null,
      goal: 1,
      gold: 0,
      target: target.id,
    });
  }
}

/** A loot convoy: an idle raider takes valuable loot to a fence at the edge. */
function sendConvoy(game: Game, faction: Faction): number {
  const entry = faction.fleet.find(
    (s) => s.role === "raider" && s.state === "idle",
  );
  const ship = entry === undefined ? null : shipOf(game, entry);
  const goods = (Object.keys(faction.stock) as GoodId[])
    .filter(
      (good) =>
        !cultureOf(faction).sells.includes(good) && faction.stock[good] >= 1,
    )
    .sort((a, b) => GOOD[b].value - GOOD[a].value);
  let worth = 0;
  for (const good of goods) {
    worth += faction.stock[good] * GOOD[good].value;
  }
  let seconds = 0;
  if (entry !== undefined && ship !== null && worth >= CONVOY_WORTH) {
    let load = CONVOY_LOAD;
    for (const good of goods) {
      const units = Math.floor(
        Math.min(load, faction.stock[good], roomFor(ship, good)),
      );
      if (units > 0) {
        faction.stock[good] -= units;
        ship.cargo[good] = (ship.cargo[good] ?? 0) + units;
        load -= units;
      }
    }
    const n = game.world.n;
    const home = game.world.islands[faction.island];
    entry.state = "trading";
    entry.since = game.time;
    entry.x = home.cx < n / 2 ? 2 : n - 1 - 2;
    entry.y = home.cy < n / 2 ? 2 : n - 1 - 2;
    seconds = MISSION_MIN;
  }
  return seconds;
}

/** A raider is sighted: the human sees the whole fleet for a while. */
function sighting(game: Game, faction: Faction): number {
  const out = faction.fleet.some(
    (s) => s.state !== "idle" && s.state !== "repairing",
  );
  if (out) {
    faction.intel[String(HUMAN)] = Math.max(
      faction.intel[String(HUMAN)] ?? 0,
      game.time + SIGHTED_SECONDS,
    );
  }
  return out ? SIGHTED_SECONDS : 0;
}

/**
 * A rival captain takes over: a new leader, every memory of the band
 * halved, protection void, the raiders called home; an alliance holds.
 */
function mutiny(game: Game, faction: Faction): void {
  const others = CAPTAINS.filter((name) => name !== faction.leader);
  faction.leader = randomPick(game, others.length > 0 ? others : CAPTAINS);
  for (const relation of game.diplomacy.relations) {
    if (relation.a === faction.id) {
      for (const memory of relation.memory) {
        memory.value *= MUTINY_KEEP;
      }
    }
  }
  faction.protection = [];
  faction.ceasefire = {};
  for (const entry of faction.fleet) {
    if (entry.state !== "idle" && entry.state !== "repairing") {
      entry.state = "returning";
      entry.target = -1;
      entry.x = 0;
    }
  }
  note(game, faction, "mutiny", -1, null, 0);
}
