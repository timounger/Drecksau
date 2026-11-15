/**
 * The pirate bands: raiders that lie in wait on the trade lanes, weigh up
 * a merchant and its escort, give chase, fight, board and carry the loot
 * home; repairs, new ships from the band's gold, revenge for sunk ships,
 * protection money, bought news of the fleet, the black market and the
 * treasures its maps lead to.
 *
 * @module
 * @remarks
 * Raiders are ships like any other and fight under the usual combat rules;
 * here only their minds live (patrolling, searching, chasing, attacking,
 * looting, returning, repairing). A merchant that is shot at flees towards
 * the nearest friendly harbour and calls the war ships of its owner close
 * by. The pirates hold back: no raids in the first minutes, a pause after
 * each raid, a longer one per victim, never in a peaceful game, never on a
 * player who pays protection or is their ally.
 *
 * Every band is at war with every player from the start; there is no
 * ceasefire and no peace by proposal. Protection money only keeps the
 * raiders away while it is paid. An alliance becomes possible once a
 * player has sunk enough ships of other enemies or taken a rival's kontor
 * (the deeds each band counts); allied pirates leave the player alone and
 * turn on its enemies, and an attack on them breaks it again.
 */
import { raidsOn } from "./disasters-data";
import { difficultyOf } from "./difficulty-data";
import { BUILDING } from "./buildings-data";
import { seaNear, strengthOf } from "./combat";
import { relationOf, remember } from "./diplomacy";
import { earn, spend } from "./economy";
import { PIRATE_CLASSES } from "./factions-data";
import { atHome, launch, sailHome, shipOf, unload } from "./faction-fleet";
import {
  alliedWith,
  cultureOf,
  factionById,
  factionHostile,
  factionOpinion,
  feel,
  inHarbour,
  isPirates,
  note,
  priceAt,
  protectedFrom,
} from "./factions";
import { GOOD } from "./goods";
import { PIRATES_FROM } from "./incidents";
import { playerById } from "./players";
import { populationOf } from "./population";
import { nextRandom, randomInt, randomPick, randomRange } from "./random";
import {
  berthOf,
  COURSE_SLACK,
  kontorOf,
  roomFor,
  sailTo,
  searchAllowed,
  steerTo,
} from "./ships";
import { SHIP } from "./ships-data";
import { inBounds, isSea } from "./terrain";
import {
  Terrain,
  type Faction,
  type FactionAction,
  type PirateDeeds,
  type FactionShip,
  type Game,
  type GoodId,
  type Player,
  type Ship,
  type ShipKind,
} from "./types";

/** At most this many raiders are out at once... */
const MOST_RAIDERS = 3;

/** ...one more every this many seconds after the first raids. */
const RAIDERS_GROW = 1800;

/** Seconds between two raids of the band. */
export const RAID_GAP = 120;

/** Seconds before the same owner is raided again. */
export const RAID_COOLDOWN = 360;

/** A raider gives up and turns home after this long, seconds. */
const RAID_SECONDS = 420;

/** Seconds a raider searches one stretch of sea. */
const SEARCH_SECONDS = 50;

/** A raider sees merchants this far, tiles. */
export const SIGHT = 16;

/** A chase is given up beyond this distance, tiles. */
const LOSE_RANGE = 26;

/** Armed ships this close to a merchant count as its escort, tiles. */
export const ESCORT_RANGE = 8;

/** Merchants of the same owner this close sail as a convoy, tiles. */
export const CONVOY_RANGE = 6;

/** Raiders this close together attack as one, tiles. */
const PACK_RANGE = 10;

/** The pirates attack only when this many times stronger than the escort. */
export const ATTACK_RATIO = 1.3;

/** Each further merchant of a convoy counts like this much escort. */
const CONVOY_WEIGHT = 12;

/** How large a convoy each kind of raider still dares to attack. */
const CONVOY_LIMIT: Partial<Record<ShipKind, number>> = {
  pirateBoat: 1,
  corvette: 2,
  pirateFrigate: 4,
  pirateWarship: 8,
};

/** An unarmed ship below this share of its hit points strikes its flag. */
export const STRUCK_SHARE = 0.35;

/** A raider closes in to this share of its guns' reach. */
const CLOSE_SHARE = 0.7;

/** A chaser keeps its course while it ends within this share of the distance. */
const CHASE_SLACK_SHARE = 0.25;

/** A raider boards from this close, tiles. */
const BOARD_RANGE = 2.2;

/** Share of each good of the cargo the pirates take. */
export const LOOT_SHARE = 0.5;

/** A raider below this share of its hit points breaks off and runs home. */
const RETREAT_SHARE = 0.4;

/** A raider is mended up to this share before it sails again. */
const READY_SHARE = 0.95;

/** A merchant runs this far from its attacker when no harbour is nearer, tiles. */
const FLEE_DISTANCE = 14;

/** A fleeing merchant keeps its course while it ends within this share of it. */
const FLEE_SLACK_SHARE = 0.5;

/** Idle war ships this close to an attacked merchant come to help, tiles. */
const CALL_RANGE = 20;

/** Water searched around a point of a patrol, tiles. */
const WATER_REACH = 5;

/** Raiders lie in wait this far off the ship they watch, tiles. */
const LURK_OFF = 8;

/** Gold the band keeps when it builds a ship. */
const BUILD_RESERVE = 500;

/** Waters this close to a people's island are too well guarded, tiles. */
const GUARDED_WATERS = 28;

/** Seconds between two new pirate ships. */
const BUILD_GAP = 300;

/** Strength of the strongest enemy that makes the band build frigates... */
const FRIGATE_FROM = 30;

/** ...and its great war ship. */
const WARSHIP_FROM = 120;

/** Most pirate ships of a band. */
const MOST_SHIPS = 6;

/** Protection: base gold, gold per resident, the most, rounding. */
const PROTECTION_BASE = 1000;
const PROTECTION_PER_RESIDENT = 2;
const PROTECTION_MOST = 4000;
const PROTECTION_ROUND = 50;

/** Seconds between two payments, and how long an agreement runs. */
export const PROTECTION_EVERY = 600;
export const PROTECTION_SECONDS = 1800;

/** Below this opinion the pirates take no money: they want blood. */
const PROTECTION_FLOOR = -80;

/** Memory of a payment, of the first payment and of one missed. */
const PAID_MEMORY = 2;
const SIGNED_MEMORY = 6;
const MISSED_MEMORY = -10;
const ENDED_MEMORY = -4;

/** News of the whole fleet: its price and how long it holds. */
export const INTEL_GOLD = 500;
export const INTEL_SECONDS = 600;

/** The black market changes every this many seconds... */
export const MARKET_EVERY = 300;

/** ...is closed with this chance... */
const MARKET_CLOSED = 0.25;

/** ...offers up to this many lots of what lies in store... */
const MARKET_LOTS = 3;

/** ...of at least this many units each, and at most half of the store. */
const MARKET_LEAST = 10;
const MARKET_MOST = 40;

/** ...at this share of the usual price... */
const MARKET_SHARE = 0.9;

/** ...and a treasure map with this chance, for this much gold. */
const MAP_CHANCE = 0.5;
export const MAP_PRICE = 600;

/** A treasure holds between these sums. */
const TREASURE_LOW = 1500;
const TREASURE_HIGH = 4500;

/** A ship with the map finds the treasure this close, tiles. */
export const TREASURE_REACH = 3;

/** Tries to find a place for a treasure. */
const TREASURE_TRIES = 60;

/** A treasure lies this far off any coast at least, tiles. */
const TREASURE_OFFSHORE = 3;

/** Share of a sunk pirate's cargo the victor's nearby ship takes back. */
const RECAPTURE_SHARE = 0.6;

/** The victor's ship must be this close to take it, tiles. */
const RECAPTURE_RANGE = 8;

/** Memory a sunk pirate ship leaves with the pirates and with the peoples. */
const SUNK_PIRATES = -8;
const SUNK_NATIONS = 4;

/** Memory a raid leaves between the band and its victim. */
const RAID_MEMORY = -4;

/** Memory of a refused demand. */
const REFUSED_MEMORY = -10;

/** A kontor counts as plundered below this share of its hit points. */
const PLUNDERED = 0.3;

/** Seconds a revenge raid or a great raid lasts at most. */
const ASSAULT_SECONDS = 360;

/** Ships of other enemies a player must sink before the pirates hear of an alliance... */
export const ALLIANCE_SUNK = 5;

/** ...or kontors of rivals it must take or destroy. */
export const ALLIANCE_TAKEN = 1;

/** Below this opinion the pirates turn an alliance down. */
export const ALLIANCE_OPINION = -50;

/** Memory of an alliance the player ended. */
const ALLIANCE_ENDED_MEMORY = -12;

/** A merchant of an ally's enemy is worth this much more to a raider, gold. */
const ALLY_PREY_BONUS = 1000;

/** Seconds between two attacks of the band on a kontor of an ally's enemy. */
const ALLY_STRIKE_GAP = 600;

/** The key of the band's next attack for its allies in `raidAt`. */
const ALLY_STRIKE_KEY = "ally";

/**
 * One look of a pirate band at its fleet, its deals and its plans.
 *
 * @param game - the game
 * @param faction - the band
 */
export function stepPirates(game: Game, faction: Faction): void {
  payments(game, faction);
  market(game, faction);
  build(game, faction);
  greatRaid(game, faction);
  allyStrike(game, faction);
  for (const entry of faction.fleet) {
    const ship = shipOf(game, entry);
    if (ship !== null && entry.role === "raider") {
      raider(game, faction, entry, ship);
    }
  }
  treasures(game, faction);
  if (faction.demand !== null && faction.demand.until <= game.time) {
    const player = faction.demand.player;
    if (!protectedFrom(game, faction, player)) {
      feel(game, faction, player, "refused", REFUSED_MEMORY);
      faction.raidAt[String(player)] = 0;
    }
    faction.demand = null;
  }
}

/**
 * What protection costs a player per payment: more the larger its people.
 *
 * @param game - the game
 * @param player - the player
 * @returns gold per payment
 */
export function protectionPrice(game: Game, player: number): number {
  const raw =
    PROTECTION_BASE + PROTECTION_PER_RESIDENT * populationOf(game, player);
  return Math.min(
    PROTECTION_MOST,
    Math.round(raw / PROTECTION_ROUND) * PROTECTION_ROUND,
  );
}

/**
 * Protection money, its end, and bought news of the fleet.
 *
 * @param game - the game
 * @param faction - the band
 * @param owner - the player
 * @param type - what the player asks
 * @returns null when done, else why not
 */
export function signProtection(
  game: Game,
  faction: Faction,
  owner: Player,
  type: "protection" | "endProtection" | "intel",
): string | null {
  const opinion = factionOpinion(game, faction, owner.id);
  const current = faction.protection.find(
    (p) => p.player === owner.id && p.until > game.time,
  );
  let reason: string | null = null;
  if (faction.kind !== "pirates") {
    reason = "missing";
  } else if (type === "endProtection") {
    if (current === undefined) {
      reason = "fx:noTreaty";
    } else {
      faction.protection = faction.protection.filter((p) => p !== current);
      feel(game, faction, owner.id, "protection", ENDED_MEMORY);
      note(game, faction, "protectionEnded", owner.id, null, 0);
    }
  } else if (type === "intel") {
    if (owner.gold < INTEL_GOLD) {
      reason = "gold";
    } else if (opinion < cultureOf(faction).tradeFloor) {
      reason = "fx:refuses";
    } else {
      spend(owner, INTEL_GOLD, "payments");
      faction.gold += INTEL_GOLD;
      faction.intel[String(owner.id)] = game.time + INTEL_SECONDS;
    }
  } else {
    const gold = protectionPrice(game, owner.id);
    if (current !== undefined) {
      reason = "fx:already";
    } else if (alliedWith(game, faction, owner.id)) {
      reason = "fx:allied";
    } else if (opinion < PROTECTION_FLOOR) {
      reason = "fx:refuses";
    } else if (owner.gold < gold) {
      reason = "gold";
    } else {
      spend(owner, gold, "payments");
      faction.gold += gold;
      faction.protection.push({
        player: owner.id,
        gold,
        next: game.time + PROTECTION_EVERY,
        until: game.time + PROTECTION_SECONDS,
      });
      feel(game, faction, owner.id, "protection", SIGNED_MEMORY);
      note(game, faction, "protection", owner.id, null, gold);
      if (faction.demand?.player === owner.id) {
        faction.demand = null;
      }
      // Raiders after the player's ships turn away.
      for (const entry of faction.fleet) {
        const target = game.ships.find((s) => s.id === entry.target);
        if (target?.owner === owner.id) {
          entry.state = "returning";
        }
      }
    }
  }
  return reason;
}

/**
 * Buys a lot of the black market into a ship lying in the pirates' harbour.
 *
 * @param game - the game
 * @param faction - the band
 * @param owner - the buyer
 * @param action - which lot, how much and into which ship
 * @returns null when bought, else why not
 */
export function buyFromMarket(
  game: Game,
  faction: Faction,
  owner: Player,
  action: Extract<FactionAction, { type: "market" }>,
): string | null {
  const lot = faction.market[action.lot];
  const ship = game.ships.find(
    (s) => s.id === action.ship && s.owner === owner.id,
  );
  let reason: string | null = null;
  if (lot === undefined || faction.marketUntil <= game.time) {
    reason = "fx:closed";
  } else if (ship === undefined || !inHarbour(game, faction, ship)) {
    reason = "fx:noShip";
  } else if (
    factionOpinion(game, faction, owner.id) < cultureOf(faction).tradeFloor
  ) {
    reason = "fx:refuses";
  } else {
    const map = lot.good === "treasureMap";
    const store = map
      ? lot.amount
      : Math.min(lot.amount, Math.floor(faction.stock[lot.good]));
    const units = Math.floor(
      Math.min(
        action.amount,
        store,
        roomFor(ship, lot.good),
        Math.max(0, owner.gold) / lot.price,
      ),
    );
    if (units <= 0) {
      reason = owner.gold < lot.price ? "gold" : "fx:none";
    } else {
      lot.amount -= units;
      if (!map) {
        faction.stock[lot.good] -= units;
      }
      ship.cargo[lot.good] = (ship.cargo[lot.good] ?? 0) + units;
      spend(owner, units * lot.price, "purchases");
      faction.gold += units * lot.price;
      owner.stats.traded += units;
      for (let k = 0; k < (map ? units : 0); k += 1) {
        hideTreasure(game, faction, owner.id);
      }
      note(game, faction, "market", owner.id, lot.good, units);
      faction.market = faction.market.filter((l) => l.amount > 0);
    }
  }
  return reason;
}

/**
 * What a band's raiders weigh when they see a merchant: their own pack,
 * the escort of armed ships close to it and the size of its convoy.
 *
 * @param game - the game
 * @param faction - the band
 * @param raider - the raider that looks
 * @param target - the merchant
 * @returns whether the raid is worth it, with both strengths
 */
export function weighTarget(
  game: Game,
  faction: Faction,
  raider: Ship,
  target: Ship,
): { attack: boolean; pack: number; escort: number; convoy: number } {
  let pack = 0;
  for (const entry of faction.fleet) {
    const ship = shipOf(game, entry);
    if (
      ship !== null &&
      Math.hypot(ship.x - raider.x, ship.y - raider.y) <= PACK_RANGE
    ) {
      pack += power(ship);
    }
  }
  let escort = 0;
  let convoy = 0;
  for (const other of game.ships) {
    const near = Math.hypot(other.x - target.x, other.y - target.y);
    const guards =
      !isPirates(game, other.owner) &&
      factionHostile(game, faction.id, other.owner);
    if (guards && near <= ESCORT_RANGE && SHIP[other.kind].guns !== null) {
      escort += power(other);
    }
    if (
      other.owner === target.owner &&
      other !== target &&
      near <= CONVOY_RANGE &&
      SHIP[other.kind].role === "trade"
    ) {
      convoy += 1;
    }
  }
  const limit = CONVOY_LIMIT[raider.kind] ?? 1;
  const defence = escort + convoy * CONVOY_WEIGHT;
  return {
    attack: convoy < limit && pack >= ATTACK_RATIO * defence,
    pack,
    escort: defence,
    convoy,
  };
}

/**
 * A ship was sunk: the pirates remember who sank theirs and take revenge,
 * the peoples are glad, the victor's ship nearby takes back loot, and a
 * player who sinks pirates is counted.
 *
 * @param game - the game
 * @param ship - the sunk ship
 * @param attacker - who sank it
 */
export function shipSunk(game: Game, ship: Ship, attacker: number): void {
  const faction = factionById(game, ship.owner);
  const victor = playerById(game, attacker);
  if (victor !== null && faction?.kind !== "pirates") {
    countDeed(game, attacker, ship.owner, "sunk");
  }
  if (faction !== null && victor !== null) {
    recapture(game, ship, attacker);
    if (faction.kind === "pirates") {
      victor.stats.pirates = (victor.stats.pirates ?? 0) + 1;
      feel(game, faction, attacker, "pirateHunt", SUNK_PIRATES);
      for (const nation of game.factions) {
        if (nation.kind === "nation") {
          feel(game, nation, attacker, "pirateHunt", SUNK_NATIONS);
        }
      }
      revenge(game, faction, attacker);
    }
  }
}

/**
 * Counts a deed of a player against an enemy that is not a pirate band, in
 * every band's tally: a ship sunk, or a rival's kontor taken or destroyed.
 *
 * @param game - the game
 * @param player - who did it
 * @param victim - whose ship or kontor it was
 * @param kind - what was done
 */
export function countDeed(
  game: Game,
  player: number,
  victim: number,
  kind: keyof PirateDeeds,
): void {
  if (
    playerById(game, player) !== null &&
    victim !== player &&
    !isPirates(game, victim)
  ) {
    for (const band of game.factions) {
      if (band.kind === "pirates") {
        const deeds = deedsOf(band, player);
        deeds[kind] += 1;
        band.deeds[String(player)] = deeds;
      }
    }
  }
}

/**
 * What a player has done towards an alliance with a band, and whether that
 * is enough: {@link ALLIANCE_SUNK} ships of other enemies sunk or
 * {@link ALLIANCE_TAKEN} kontor of a rival taken, since the last alliance
 * with the band broke.
 *
 * @param faction - the band
 * @param player - the player id
 * @returns the deeds and whether an alliance may be offered
 */
export function allianceProgress(
  faction: Faction,
  player: number,
): PirateDeeds & { readonly open: boolean } {
  const deeds = deedsOf(faction, player);
  return {
    ...deeds,
    open: deeds.sunk >= ALLIANCE_SUNK || deeds.taken >= ALLIANCE_TAKEN,
  };
}

/**
 * An alliance with a pirate band, offered by the player, or its end. The
 * band takes it once the deeds are done and its opinion is not too bad;
 * the war ends, protection is no longer needed.
 *
 * @param game - the game
 * @param faction - the band
 * @param owner - the player
 * @param sign - true to offer, false to end it
 * @returns null when done, else why not
 */
export function pirateAlliance(
  game: Game,
  faction: Faction,
  owner: Player,
  sign: boolean,
): string | null {
  const relation = relationOf(game, faction.id, owner.id);
  let reason: string | null = null;
  if (relation === null) {
    reason = "missing";
  } else if (!sign) {
    if (relation.alliance) {
      breakPirateAlliance(game, faction, owner.id);
      feel(game, faction, owner.id, "brokenPact", ALLIANCE_ENDED_MEMORY);
    } else {
      reason = "fx:noTreaty";
    }
  } else if (game.settings.peaceful) {
    reason = "fx:peaceful";
  } else if (relation.alliance) {
    reason = "fx:already";
  } else if (!allianceProgress(faction, owner.id).open) {
    reason = "fx:notProven";
  } else if (factionOpinion(game, faction, owner.id) < ALLIANCE_OPINION) {
    reason = "fx:grudge";
  } else {
    relation.alliance = true;
    relation.war = false;
    relation.since = game.time;
    // Paid protection is no longer needed, a demand is dropped.
    faction.protection = faction.protection.filter(
      (p) => p.player !== owner.id,
    );
    if (faction.demand?.player === owner.id) {
      faction.demand = null;
    }
    for (const entry of faction.fleet) {
      const target = game.ships.find((s) => s.id === entry.target);
      if (target?.owner === owner.id) {
        entry.state = "returning";
      }
    }
    note(game, faction, "alliance", owner.id, null, 1);
  }
  return reason;
}

/**
 * An alliance with a band breaks: war again, and the deeds that opened it
 * count from nothing.
 *
 * @param game - the game
 * @param faction - the band
 * @param player - the player id
 */
export function breakPirateAlliance(
  game: Game,
  faction: Faction,
  player: number,
): void {
  const relation = relationOf(game, faction.id, player);
  if (relation !== null) {
    relation.alliance = false;
    relation.war = !game.settings.peaceful;
    relation.since = game.time;
    faction.deeds[String(player)] = { sunk: 0, taken: 0 };
    note(game, faction, "alliance", player, null, 0);
  }
}

/**
 * Whether an owner is at war with a player the band is allied with: its
 * ships and kontors are what the band hunts first.
 *
 * @param game - the game
 * @param faction - the band
 * @param owner - an owner id
 * @returns true for an ally's enemy
 */
export function allyEnemy(
  game: Game,
  faction: Faction,
  owner: number,
): boolean {
  return (
    !isPirates(game, owner) &&
    game.players.some(
      (ally) =>
        ally.alive &&
        ally.id !== owner &&
        alliedWith(game, faction, ally.id) &&
        relationOf(game, ally.id, owner)?.war === true,
    )
  );
}

/** A band's tally of a player's deeds, zero when none is kept. */
function deedsOf(faction: Faction, player: number): PirateDeeds {
  const kept = faction.deeds[String(player)];
  return { sunk: kept?.sunk ?? 0, taken: kept?.taken ?? 0 };
}

/**
 * Whether a point lies in the waters a people guards: the pirates keep
 * out of reach of its towers and guards.
 */
function guarded(game: Game, x: number, y: number): boolean {
  return game.factions.some((f) => {
    const home = game.world.islands[f.island];
    return (
      f.kind === "nation" &&
      Math.hypot(home.cx - x, home.cy - y) < GUARDED_WATERS
    );
  });
}

/** The power of an armed ship, in the units of combat strength. */
function power(ship: Ship): number {
  const guns = SHIP[ship.kind].guns;
  return guns === null
    ? 0
    : (ship.hp * guns.damage) / guns.reload / CONVOY_WEIGHT / CONVOY_WEIGHT;
}

/** Most raiders out at once by now; the level adds or takes one. */
function raidersAllowed(game: Game): number {
  const more = difficultyOf(game).raiders;
  return Math.max(
    1,
    Math.min(
      MOST_RAIDERS + more,
      1 +
        more +
        Math.floor(Math.max(0, game.time - PIRATES_FROM) / RAIDERS_GROW),
    ),
  );
}

/** Whether the band may send a raider out now. */
function mayRaid(game: Game, faction: Faction): boolean {
  const out = faction.fleet.filter(
    (s) =>
      s.state === "patrolling" ||
      s.state === "searching" ||
      s.state === "chasing" ||
      s.state === "attacking" ||
      s.state === "looting",
  ).length;
  return (
    raidsOn(game.settings) &&
    game.time >= PIRATES_FROM &&
    game.time >= (faction.raidAt.all ?? 0) &&
    faction.effects.gathering <= game.time &&
    out < raidersAllowed(game)
  );
}

/** One raider's mind. */
function raider(
  game: Game,
  faction: Faction,
  entry: FactionShip,
  ship: Ship,
): void {
  const max = SHIP[ship.kind].hp;
  const target = game.ships.find((s) => s.id === entry.target) ?? null;
  const guns = SHIP[ship.kind].guns;
  const range = guns?.range ?? 0;
  const distance =
    target === null
      ? Infinity
      : Math.hypot(target.x - ship.x, target.y - ship.y);
  const lost =
    target === null ||
    target.docked >= 0 ||
    distance > LOSE_RANGE ||
    !factionHostile(game, faction.id, target.owner);
  switch (entry.state) {
    case "idle":
      if (ship.hp < max * READY_SHARE) {
        setState(game, entry, "repairing");
      } else if (mayRaid(game, faction) && atHome(game, faction, ship)) {
        patrol(game, faction, entry, ship);
      } else if (!atHome(game, faction, ship) && ship.path.length === 0) {
        sailHome(game, faction, ship);
      }
      break;
    case "repairing":
      if (ship.hp >= max * READY_SHARE) {
        setState(game, entry, "idle");
      } else if (!atHome(game, faction, ship) && ship.path.length === 0) {
        sailHome(game, faction, ship);
      }
      break;
    case "patrolling":
    case "searching":
      search(game, faction, entry, ship);
      break;
    case "chasing":
    case "attacking":
      if (entry.x < 0) {
        assault(game, faction, entry, ship);
      } else if (lost || target === null) {
        setState(game, entry, "searching");
      } else if (ship.hp < max * RETREAT_SHARE) {
        turnHome(game, faction, entry, ship);
      } else {
        fight(game, entry, ship, target, distance, range);
      }
      break;
    case "looting":
      if (target === null || target.docked >= 0) {
        turnHome(game, faction, entry, ship);
      } else if (distance <= BOARD_RANGE) {
        board(game, faction, ship, target);
        turnHome(game, faction, entry, ship);
      } else {
        steerTo(game, ship, tileOf(game, target));
      }
      break;
    case "trading":
      fence(game, faction, entry, ship);
      break;
    default:
      // Returning.
      if (atHome(game, faction, ship) || inHarbour(game, faction, ship)) {
        const units = unload(faction, ship);
        if (units > 0) {
          note(game, faction, "loot", -1, null, units);
        }
        setState(game, entry, "repairing");
      } else if (ship.path.length === 0 && !sailHome(game, faction, ship)) {
        setState(game, entry, "idle");
      }
  }
}

/** Changes a raider's state. */
function setState(
  game: Game,
  entry: FactionShip,
  state: FactionShip["state"],
): void {
  entry.state = state;
  entry.since = game.time;
}

/** Sends a raider to lie in wait on a trade lane of an enemy. */
function patrol(
  game: Game,
  faction: Faction,
  entry: FactionShip,
  ship: Ship,
): void {
  const prey = game.ships.filter(
    (s) =>
      SHIP[s.kind].role === "trade" &&
      s.docked < 0 &&
      !guarded(game, s.x, s.y) &&
      factionHostile(game, faction.id, s.owner) &&
      (faction.raidAt[String(s.owner)] ?? 0) <= game.time,
  );
  // An ally's enemies are watched first.
  const sought = prey.filter((s) => allyEnemy(game, faction, s.owner));
  const pool = sought.length > 0 ? sought : prey;
  const watched = pool.length === 0 ? null : randomPick(game, pool);
  const angle = randomRange(game, 0, Math.PI * 2);
  const water =
    watched === null
      ? -1
      : seaNear(
          game,
          watched.x + Math.cos(angle) * LURK_OFF,
          watched.y + Math.sin(angle) * LURK_OFF,
          WATER_REACH,
        );
  if (water >= 0 && searchAllowed(game, ship) && sailTo(game, ship, water)) {
    setState(game, entry, "patrolling");
    entry.target = -1;
    entry.x = 0;
    entry.y = game.time;
    faction.raidAt.all = game.time + RAID_GAP * difficultyOf(game).raidGap;
  }
}

/** A raider on the lane looks for a merchant worth the risk. */
function search(
  game: Game,
  faction: Faction,
  entry: FactionShip,
  ship: Ship,
): void {
  let best: Ship | null = null;
  let bestScore = -Infinity;
  for (const other of game.ships) {
    const distance = Math.hypot(other.x - ship.x, other.y - ship.y);
    if (
      distance <= SIGHT &&
      SHIP[other.kind].role === "trade" &&
      other.docked < 0 &&
      !guarded(game, other.x, other.y) &&
      other.hp >= SHIP[other.kind].hp * STRUCK_SHARE &&
      (faction.raidAt[String(other.owner)] ?? 0) <= game.time &&
      factionHostile(game, faction.id, other.owner)
    ) {
      const weighed = weighTarget(game, faction, ship, other);
      const score =
        cargoValue(other) -
        weighed.escort * CONVOY_WEIGHT -
        distance +
        (allyEnemy(game, faction, other.owner) ? ALLY_PREY_BONUS : 0);
      if (weighed.attack && score > bestScore) {
        bestScore = score;
        best = other;
      }
    }
  }
  if (best !== null) {
    entry.target = best.id;
    setState(game, entry, "chasing");
    callEscorts(game, best, ship);
  } else if (ship.path.length === 0) {
    if (entry.state === "patrolling") {
      setState(game, entry, "searching");
    } else if (game.time - entry.y > RAID_SECONDS) {
      turnHome(game, faction, entry, ship);
    } else if (game.time - entry.since > SEARCH_SECONDS) {
      // On to another stretch of the lane.
      patrolOn(game, entry, ship);
    }
  }
}

/** A raider moves on to another stretch near where it lurks. */
function patrolOn(game: Game, entry: FactionShip, ship: Ship): void {
  const angle = randomRange(game, 0, Math.PI * 2);
  const water = seaNear(
    game,
    ship.x + Math.cos(angle) * LURK_OFF,
    ship.y + Math.sin(angle) * LURK_OFF,
    WATER_REACH,
  );
  if (water >= 0) {
    sailTo(game, ship, water);
  }
  setState(game, entry, "patrolling");
}

/** The chase and the fight: closing in, and boarding a merchant that struck. */
function fight(
  game: Game,
  entry: FactionShip,
  ship: Ship,
  target: Ship,
  distance: number,
  range: number,
): void {
  const struck =
    SHIP[target.kind].guns === null &&
    target.hp < SHIP[target.kind].hp * STRUCK_SHARE;
  if (struck) {
    setState(game, entry, "looting");
  } else {
    if (distance <= range && entry.state === "chasing") {
      setState(game, entry, "attacking");
    }
    if (distance > range * CLOSE_SHARE) {
      // A far quarry needs no exact course yet: the slack grows with it.
      steerTo(
        game,
        ship,
        tileOf(game, target),
        Math.max(COURSE_SLACK, distance * CHASE_SLACK_SHARE),
      );
    }
    flee(game, target, ship);
  }
}

/** The pirates board a ship that struck and take half of each good. */
function board(game: Game, faction: Faction, ship: Ship, target: Ship): void {
  let units = 0;
  let best: GoodId | null = null;
  let bestValue = 0;
  for (const [good, amount] of Object.entries(target.cargo) as [
    GoodId,
    number,
  ][]) {
    const take = Math.floor(Math.min(amount * LOOT_SHARE, roomFor(ship, good)));
    if (take > 0) {
      takeCargo(target, good, take);
      ship.cargo[good] = (ship.cargo[good] ?? 0) + take;
      units += take;
      if (take * GOOD[good].value > bestValue) {
        bestValue = take * GOOD[good].value;
        best = good;
      }
    }
  }
  remember(game, faction.id, target.owner, "piracy", RAID_MEMORY);
  faction.raidAt[String(target.owner)] =
    game.time + RAID_COOLDOWN * difficultyOf(game).raidGap;
  // The peoples resent a raid on their merchants.
  const victim = factionById(game, target.owner);
  if (victim !== null) {
    note(game, victim, "raid", -1, best, units);
  }
  note(
    game,
    faction,
    "raid",
    target.owner >= 0 ? target.owner : -1,
    best,
    units,
  );
}

/** A raider turns home with what it has. */
function turnHome(
  game: Game,
  faction: Faction,
  entry: FactionShip,
  ship: Ship,
): void {
  setState(game, entry, "returning");
  entry.target = -1;
  entry.x = 0;
  sailHome(game, faction, ship);
}

/**
 * The attacked merchant runs: to the nearest friendly harbour when that
 * lies away from the pirate, else straight away from it.
 */
function flee(game: Game, target: Ship, pirate: Ship): void {
  if (SHIP[target.kind].guns === null && game.tick % 2 === 0) {
    const n = game.world.n;
    let harbour = -1;
    let best = Infinity;
    for (const state of game.islands) {
      const kontor =
        state.owner === target.owner ? kontorOf(game, state.id) : null;
      const berth = kontor === null ? -1 : berthOf(game, kontor);
      const bx = (berth % n) + 1 / 2;
      const by = Math.floor(berth / n) + 1 / 2;
      const mine = Math.hypot(bx - target.x, by - target.y);
      const theirs = Math.hypot(bx - pirate.x, by - pirate.y);
      if (berth >= 0 && mine < best && mine < theirs) {
        best = mine;
        harbour = berth;
      }
    }
    const away = Math.atan2(target.y - pirate.y, target.x - pirate.x);
    const water =
      harbour >= 0
        ? harbour
        : seaNear(
            game,
            target.x + Math.cos(away) * FLEE_DISTANCE,
            target.y + Math.sin(away) * FLEE_DISTANCE,
            WATER_REACH,
          );
    if (water >= 0) {
      // The order stays: a route ship takes its route up again after.
      const order = target.order;
      // A merchant already fleeing keeps its course while it leads away.
      steerTo(game, target, water, FLEE_DISTANCE * FLEE_SLACK_SHARE);
      target.order = order;
    }
  }
}

/** War ships of the merchant's owner close by and idle come to help. */
function callEscorts(game: Game, target: Ship, pirate: Ship): void {
  for (const ship of game.ships) {
    if (
      ship.owner === target.owner &&
      ship.owner >= 0 &&
      SHIP[ship.kind].guns !== null &&
      ship.order.type === "idle" &&
      Math.hypot(ship.x - target.x, ship.y - target.y) <= CALL_RANGE
    ) {
      ship.order = { type: "attack", target: pirate.id, building: false };
      ship.path = [];
    }
  }
}

/** A revenge or great raid on a kontor: sail there and shoot it to pieces. */
function assault(
  game: Game,
  faction: Faction,
  entry: FactionShip,
  ship: Ship,
): void {
  const kontor = game.buildings.find((b) => b.id === entry.target) ?? null;
  const owner = kontor === null ? -1 : game.islands[kontor.island].owner;
  const done =
    kontor === null ||
    !factionHostile(game, faction.id, owner) ||
    kontor.hp < BUILDING.kontor.hp * PLUNDERED ||
    game.time - entry.since > ASSAULT_SECONDS ||
    ship.hp < SHIP[ship.kind].hp * RETREAT_SHARE;
  if (done) {
    ship.order = { type: "idle" };
    turnHome(game, faction, entry, ship);
  } else if (ship.order.type !== "attack") {
    // The attack order steers it there, each ship in its own round.
    ship.order = { type: "attack", target: entry.target, building: true };
  }
}

/** Sends raiders to plunder a kontor of the one who sank a pirate ship. */
function revenge(game: Game, faction: Faction, attacker: number): void {
  const kontor = nearestKontor(game, faction, attacker);
  if (kontor !== null && factionHostile(game, faction.id, attacker)) {
    const avengers = faction.fleet
      .filter(
        (s) =>
          s.role === "raider" &&
          (s.state === "idle" ||
            s.state === "searching" ||
            s.state === "patrolling"),
      )
      .slice(0, 2);
    for (const entry of avengers) {
      entry.state = "attacking";
      entry.since = game.time;
      entry.target = kontor.id;
      entry.x = -1;
      const ship = shipOf(game, entry);
      if (ship !== null) {
        ship.order = { type: "idle" };
      }
    }
    if (avengers.length > 0) {
      note(game, faction, "war", attacker, null, avengers.length);
    }
  }
}

/** The kontor of a player nearest the band's island. */
function nearestKontor(
  game: Game,
  faction: Faction,
  player: number,
): ReturnType<typeof kontorOf> {
  const home = game.world.islands[faction.island];
  let best: ReturnType<typeof kontorOf> = null;
  let bestDistance = Infinity;
  for (const state of game.islands) {
    const kontor = state.owner === player ? kontorOf(game, state.id) : null;
    const distance =
      kontor === null
        ? Infinity
        : Math.hypot(kontor.x - home.cx, kontor.y - home.cy);
    if (kontor !== null && distance < bestDistance) {
      best = kontor;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * After the fleet gathered (an event), every raider fit to fight sails
 * against the kontor of the richest enemy at once.
 */
function greatRaid(game: Game, faction: Faction): void {
  if (faction.effects.gathering > 0 && faction.effects.gathering <= game.time) {
    faction.effects.gathering = 0;
    const victims = game.players.filter(
      (p) => p.alive && factionHostile(game, faction.id, p.id),
    );
    // An ally's enemy first, then the richest.
    const victim = victims.sort(
      (a, b) =>
        Number(allyEnemy(game, faction, b.id)) -
          Number(allyEnemy(game, faction, a.id)) ||
        populationOf(game, b.id) - populationOf(game, a.id),
    )[0];
    const kontor =
      victim === undefined ? null : nearestKontor(game, faction, victim.id);
    if (kontor !== null && victim !== undefined) {
      let sent = 0;
      for (const entry of faction.fleet) {
        const ship = shipOf(game, entry);
        if (
          ship !== null &&
          entry.role === "raider" &&
          ship.hp >= SHIP[ship.kind].hp / 2
        ) {
          entry.state = "attacking";
          entry.since = game.time;
          entry.target = kontor.id;
          entry.x = -1;
          ship.order = { type: "idle" };
          sent += 1;
        }
      }
      note(game, faction, "assault", victim.id, null, sent);
    }
  }
}

/**
 * Allied pirates take the war to their ally's enemies: now and then a
 * raider fit to fight sails against the kontor of one of them nearest the
 * band's island.
 */
function allyStrike(game: Game, faction: Faction): void {
  if (
    mayRaid(game, faction) &&
    game.time >= (faction.raidAt[ALLY_STRIKE_KEY] ?? 0)
  ) {
    const enemy = game.players.find(
      (p) =>
        p.alive &&
        allyEnemy(game, faction, p.id) &&
        factionHostile(game, faction.id, p.id),
    );
    const kontor =
      enemy === undefined ? null : nearestKontor(game, faction, enemy.id);
    const entry = faction.fleet.find((s) => {
      const ship = shipOf(game, s);
      return (
        ship !== null &&
        s.role === "raider" &&
        s.state === "idle" &&
        ship.hp >= SHIP[ship.kind].hp * READY_SHARE
      );
    });
    const ship = entry === undefined ? null : shipOf(game, entry);
    if (kontor !== null && entry !== undefined && ship !== null) {
      setState(game, entry, "attacking");
      entry.target = kontor.id;
      entry.x = -1;
      ship.order = { type: "idle" };
      faction.raidAt[ALLY_STRIKE_KEY] = game.time + ALLY_STRIKE_GAP;
      faction.raidAt.all = game.time + RAID_GAP * difficultyOf(game).raidGap;
      const ally = game.players.find((p) => alliedWith(game, faction, p.id));
      note(game, faction, "allyStrike", ally?.id ?? -1, null, 1);
    }
  }
}

/** Protection payments fall due; one missed ends the agreement. */
function payments(game: Game, faction: Faction): void {
  for (const deal of [...faction.protection]) {
    const owner = playerById(game, deal.player);
    if (deal.until <= game.time || owner === null) {
      faction.protection = faction.protection.filter((p) => p !== deal);
      note(game, faction, "protectionEnded", deal.player, null, 0);
    } else if (game.time >= deal.next) {
      if (owner.gold >= deal.gold) {
        spend(owner, deal.gold, "payments");
        faction.gold += deal.gold;
        deal.next += PROTECTION_EVERY;
        feel(game, faction, owner.id, "protection", PAID_MEMORY);
        note(game, faction, "protection", owner.id, null, deal.gold);
      } else {
        faction.protection = faction.protection.filter((p) => p !== deal);
        feel(game, faction, owner.id, "breach", MISSED_MEMORY);
        faction.raidAt[String(owner.id)] = 0;
        note(game, faction, "protectionEnded", owner.id, null, -1);
      }
    }
  }
}

/** The black market changes: lots from the store, sometimes a map, sometimes closed. */
function market(game: Game, faction: Faction): void {
  if (game.time >= faction.marketUntil) {
    faction.marketUntil = game.time + MARKET_EVERY;
    faction.market = [];
    if (nextRandom(game) >= MARKET_CLOSED) {
      const goods = (Object.keys(faction.stock) as GoodId[])
        .filter(
          (good) =>
            good !== "treasureMap" && faction.stock[good] >= MARKET_LEAST,
        )
        .sort(
          (a, b) =>
            faction.stock[b] * GOOD[b].value - faction.stock[a] * GOOD[a].value,
        )
        .slice(0, MARKET_LOTS);
      for (const good of goods) {
        faction.market.push({
          good,
          amount: Math.floor(Math.min(MARKET_MOST, faction.stock[good] / 2)),
          price: Math.max(
            1,
            Math.round(priceAt(game, faction, good) * MARKET_SHARE),
          ),
        });
      }
      if (nextRandom(game) < MAP_CHANCE) {
        faction.market.push({
          good: "treasureMap",
          amount: 1,
          price: MAP_PRICE,
        });
      }
    }
  }
}

/** The band builds a ship from its gold, planks and cannons, now and then. */
function build(game: Game, faction: Faction): void {
  // The level makes the ships dearer and slower to come, or the reverse.
  const cost = difficultyOf(game).pirateBuild;
  if (game.time >= faction.nextShip && faction.fleet.length < MOST_SHIPS) {
    const enemy = Math.max(
      0,
      ...game.players
        .filter((p) => p.alive && factionHostile(game, faction.id, p.id))
        .map((p) => strengthOf(game, p.id)),
    );
    const choice = [...PIRATE_CLASSES].reverse().find((def) => {
      const count = faction.fleet.filter(
        (s) => shipOf(game, s)?.kind === def.kind,
      ).length;
      const needed =
        def.kind === "pirateWarship"
          ? enemy >= WARSHIP_FROM
          : def.kind === "pirateFrigate"
            ? enemy >= FRIGATE_FROM
            : true;
      return (
        needed &&
        count < def.most &&
        faction.gold >= def.gold * cost + BUILD_RESERVE &&
        faction.stock.planks >= def.planks &&
        faction.stock.cannons >= def.cannons
      );
    });
    if (
      choice !== undefined &&
      launch(game, faction, choice.kind, "raider") !== null
    ) {
      faction.gold -= choice.gold * cost;
      faction.stock.planks -= choice.planks;
      faction.stock.cannons -= choice.cannons;
      faction.nextShip = game.time + BUILD_GAP * cost;
      note(game, faction, "newShip", -1, null, 0);
    }
  }
}

/** A loot convoy (an event) sails to a fence at the map's edge and back. */
function fence(
  game: Game,
  faction: Faction,
  entry: FactionShip,
  ship: Ship,
): void {
  const n = game.world.n;
  const tx = entry.x;
  const ty = entry.y;
  if (Math.hypot(ship.x - tx, ship.y - ty) <= WATER_REACH) {
    let gold = 0;
    for (const [good, amount] of Object.entries(ship.cargo) as [
      GoodId,
      number,
    ][]) {
      gold += amount * GOOD[good].value * MARKET_SHARE * MARKET_SHARE;
    }
    ship.cargo = {};
    faction.gold += gold;
    note(game, faction, "loot", -1, null, gold);
    turnHome(game, faction, entry, ship);
  } else if (
    ship.path.length === 0 &&
    !sailTo(game, ship, Math.floor(ty) * n + Math.floor(tx))
  ) {
    turnHome(game, faction, entry, ship);
  }
}

/** Ships that bring a treasure map to its place dig the treasure up. */
function treasures(game: Game, faction: Faction): void {
  for (const treasure of [...faction.treasures]) {
    const finder = game.ships.find(
      (ship) =>
        ship.owner === treasure.owner &&
        (ship.cargo.treasureMap ?? 0) >= 1 &&
        Math.hypot(ship.x - treasure.x, ship.y - treasure.y) <= TREASURE_REACH,
    );
    const owner = playerById(game, treasure.owner);
    if (finder !== undefined && owner !== null) {
      takeCargo(finder, "treasureMap", 1);
      earn(owner, treasure.gold, "rewards");
      faction.treasures = faction.treasures.filter((t) => t !== treasure);
      note(game, faction, "treasure", owner.id, null, treasure.gold);
    }
  }
}

/** Hides a treasure for a map at open sea off a free coast. */
function hideTreasure(game: Game, faction: Faction, owner: number): void {
  const world = game.world;
  const n = world.n;
  let spot: { x: number; y: number } | null = null;
  for (
    let attempt = 0;
    attempt < TREASURE_TRIES && spot === null;
    attempt += 1
  ) {
    const x = randomInt(game, TREASURE_OFFSHORE, n - 1 - TREASURE_OFFSHORE);
    const y = randomInt(game, TREASURE_OFFSHORE, n - 1 - TREASURE_OFFSHORE);
    let water =
      inBounds(world, x, y) && isSea(world.terrain[y * n + x] as Terrain);
    for (
      let dy = -TREASURE_OFFSHORE;
      dy <= TREASURE_OFFSHORE && water;
      dy += 1
    ) {
      for (
        let dx = -TREASURE_OFFSHORE;
        dx <= TREASURE_OFFSHORE && water;
        dx += 1
      ) {
        water = isSea(world.terrain[(y + dy) * n + x + dx] as Terrain);
      }
    }
    if (water) {
      spot = { x: x + 1 / 2, y: y + 1 / 2 };
    }
  }
  if (spot !== null) {
    faction.treasures.push({
      owner,
      x: spot.x,
      y: spot.y,
      gold: Math.round(randomRange(game, TREASURE_LOW, TREASURE_HIGH)),
    });
  }
}

/** The victor's ship close by takes back part of a sunk faction ship's cargo. */
function recapture(game: Game, ship: Ship, attacker: number): void {
  let taker: Ship | null = null;
  let best = RECAPTURE_RANGE;
  for (const other of game.ships) {
    const distance = Math.hypot(other.x - ship.x, other.y - ship.y);
    if (other.owner === attacker && other !== ship && distance <= best) {
      taker = other;
      best = distance;
    }
  }
  if (taker !== null) {
    for (const [good, amount] of Object.entries(ship.cargo) as [
      GoodId,
      number,
    ][]) {
      const take = Math.floor(
        Math.min(amount * RECAPTURE_SHARE, roomFor(taker, good)),
      );
      if (take > 0) {
        taker.cargo[good] = (taker.cargo[good] ?? 0) + take;
      }
    }
  }
}

/** The value of what a ship carries. */
function cargoValue(ship: Ship): number {
  let value = 0;
  for (const [good, amount] of Object.entries(ship.cargo) as [
    GoodId,
    number,
  ][]) {
    value += amount * GOOD[good].value;
  }
  return value;
}

/** The tile a ship is on. */
function tileOf(game: Game, ship: Ship): number {
  return Math.floor(ship.y) * game.world.n + Math.floor(ship.x);
}

/** Whether a ship is the band's and looks for prey or fights. */
export function raiding(game: Game, ship: Ship): boolean {
  const faction = factionById(game, ship.owner);
  const entry = faction?.fleet.find((s) => s.ship === ship.id);
  return (
    entry !== undefined &&
    (entry.state === "chasing" ||
      entry.state === "attacking" ||
      entry.state === "looting")
  );
}

/** Takes units of a good out of a ship's hold. */
function takeCargo(ship: Ship, good: GoodId, units: number): void {
  const left = (ship.cargo[good] ?? 0) - units;
  if (left > 0) {
    ship.cargo[good] = left;
  } else {
    delete ship.cargo[good];
  }
}
