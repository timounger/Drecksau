/**
 * The foreign peoples and pirate bands (the FactionManager): their state,
 * lookups, their own economy of fixed works, prices from stock and need,
 * trade with ships lying in their harbour, supply contracts, the actions a
 * player can take with them, and the staggered step that runs it all.
 *
 * @module
 * @remarks
 * A faction keeps its own warehouse and gold, apart from every player's.
 * Goods only come from its works and from trade: buying moves the units
 * from its stock into the ship's hold and the gold the other way, and the
 * prices follow the stock against the target the faction wants to hold -
 * the free trader's rule, value x (1 + swing x pressure). How a faction
 * feels about a player lives in the same relations and memories as the
 * rivals' (see `diplomacy.ts`); the stages Hostile to Trusting are only a
 * way of showing that value. Ships, fights and missions use the systems
 * every player uses.
 */
import { strengthOf } from "./combat";
import { factionWork } from "./disasters";
import { difficultyOf } from "./difficulty-data";
import {
  changeReputation,
  RELATION_LIMIT,
  remember,
  relationOf,
} from "./diplomacy";
import { earn, spend } from "./economy";
import {
  ALLIED,
  CHARTER_SHARE,
  CULTURE,
  FACTION_ID,
  FRIENDLY,
  type CultureDef,
} from "./factions-data";
import { stepFactionEvents } from "./faction-events";
import { stepFactionFleets, spawnFleet } from "./faction-fleet";
import { GOOD, GOOD_IDS, perGood } from "./goods";
import { deliverCargo } from "./missions";
import { HUMAN, playerById, PIRATES, TRADER } from "./players";
import {
  breakPirateAlliance,
  buyFromMarket,
  pirateAlliance,
  signProtection,
  stepPirates,
} from "./pirates";
import { DOCK_RANGE, roomFor } from "./ships";
import { TICK } from "./time";
import { TILE_CENTER } from "./terrain";
import { addStock } from "./warehouse";
import type {
  CultureId,
  DiplomacyAnswer,
  Faction,
  FactionAction,
  FactionHome,
  FactionNote,
  FactionNoteKind,
  Game,
  GoodId,
  Player,
  Relation,
  Ship,
  SupplyContract,
  World,
} from "./types";

/** The stages of a relation, from worst to best. */
export type Stage =
  "hostile" | "suspicious" | "neutral" | "friendly" | "allied" | "trusted";

/** Lowest opinion of the stages Trusting, Neutral and Suspicious. */
const TRUSTED = 90;
const NEUTRAL_FROM = -19;
const SUSPICIOUS_FROM = -59;

/** Lowest opinion of each stage, best first (Hostile is the rest). */
const STAGE_FROM: readonly (readonly [Stage, number])[] = [
  ["trusted", TRUSTED],
  ["allied", ALLIED],
  ["friendly", FRIENDLY],
  ["neutral", NEUTRAL_FROM],
  ["suspicious", SUSPICIOUS_FROM],
];

/** Seconds between two looks of a faction at its economy and ships. */
export const FACTION_THINK = 2;

/** Factions think one after another, this far apart, seconds. */
const THINK_STAGGER = 0.3;

/** Seconds in a minute. */
const MINUTE = 60;

/** Most units of a good a faction's warehouse holds. */
export const FACTION_CAPACITY = 400;

/** The stock a faction wants of what it makes... */
export const MADE_TARGET = 150;

/** ...of what it needs... */
export const WANT_TARGET = 120;

/** ...and of anything else it takes as surplus. */
const SURPLUS_TARGET = 60;

/** Surplus that is not wanted fetches only this share. */
const SURPLUS_SHARE = 0.6;

/** A faction pays this share of its price when it buys... */
export const FACTION_SELL_SHARE = 0.8;

/** ...and asks this much over it when it sells. */
export const FACTION_BUY_SHARE = 1.15;

/** Better stages give this share off what the player buys and on what it sells. */
const STAGE_DISCOUNT: Readonly<Record<Stage, number>> = {
  hostile: 0,
  suspicious: -0.05,
  neutral: 0,
  friendly: 0.05,
  allied: 0.1,
  trusted: 0.15,
};

/**
 * Share of its target stock a faction keeps back and will not sell, by
 * stage: friends get larger amounts.
 */
const RESERVE: Readonly<Record<Stage, number>> = {
  hostile: 1,
  suspicious: 0.65,
  neutral: 0.4,
  friendly: 0.25,
  allied: 0.12,
  trusted: 0.05,
};

/** Gold a faction keeps back when it buys. */
const GOLD_RESERVE = 1500;

/** In a famine food costs this much more... */
const FAMINE_PRICE = 1.6;

/** ...and is eaten this many times as fast. */
export const FAMINE_EATING = 3;

/** Goods that count as food in a famine. */
export const FOODS: readonly GoodId[] = ["fish", "bread", "grain"];

/** An epidemic halves the works. */
const PLAGUE_WORK = 0.5;

/** A rich harvest makes one good this many times as fast. */
const BOOST_WORK = 3;

/** Gold of trade that is worth one point of relation... */
const TRADE_GOLD_PER_POINT = 400;

/** ...but one deal brings at most this much. */
const TRADE_MOST = 4;

/** A gift brings a point of relation per this much gold... */
export const GIFT_GOLD_PER_POINT = 40;

/** ...but at most this much. */
export const GIFT_MOST = 25;

/** Least gold of a gift or a demand. */
const GIFT_LEAST = 50;

/** Reputation a gift brings, as one to a rival. */
const GIFT_REPUTATION = 2;

/** Memory of a demand paid, and of one refused, as with the rivals. */
export const DEMAND_MET_MEMORY = -15;
export const DEMAND_REFUSED_MEMORY = -5;

/** Each point of opinion lowers the strength a demand needs by this much... */
const DEMAND_OPINION_SHARE = 0.01;

/** ...but a demand always needs at least this share of the people's strength. */
const DEMAND_LEAST_RATIO = 0.5;

/** A contract delivers every this many seconds. */
export const CONTRACT_EVERY = 600;

/** Units of a contract delivery, least and most. */
export const CONTRACT_LEAST = 10;
export const CONTRACT_MOST = 100;

/** A contract pays this share of the price when signed. */
const CONTRACT_SHARE = 0.95;

/** Contracts a player can have with one faction at once. */
export const CONTRACTS_EACH = 2;

/** Missed deliveries in a row before the faction cancels a contract. */
export const BREACH_LIMIT = 3;

/** Memory of a kept delivery, of a breach and of a cancelled contract. */
const KEPT_MEMORY = 3;
const BREACH_MEMORY = -6;
const CANCEL_MEMORY = -12;

/** What a standing treaty with a faction adds to its opinion. */
const STANDING_TRADE = 5;
const STANDING_ALLIANCE = 15;
const STANDING_WAR = -40;
const STANDING_PROTECTION = 10;

/** The other's reputation counts this share in a faction's opinion. */
const REPUTATION_SHARE = 0.5;

/** Seconds a war with a people must last before a ceasefire is heard. */
const WAR_LEAST = 120;

/** A ceasefire holds at least this long, seconds. */
export const CEASEFIRE_SECONDS = 600;

/** Memory a ceasefire leaves. */
const CEASEFIRE_MEMORY = 10;

/** Below this opinion a people that was attacked declares war. */
const WAR_OPINION = -60;

/** Support and a joint hunt last this long, seconds... */
export const SUPPORT_SECONDS = 300;

/** ...and the next can come this long after the last ended. */
const SUPPORT_PAUSE = 300;

/** Memory of turning the guns on pirates, and on a people. */
const PIRATE_PROVOKED = -15;
const NATION_PROVOKED = -30;

/** Reputation a player loses for attacking a people unprovoked. */
const PROVOKED_REPUTATION = -10;

/** News kept per faction. */
const NOTES_KEPT = 30;

/** A ship lies in a harbour within this reach of the berth, tiles. */
const HARBOUR_REACH = DOCK_RANGE + 1;

/** Factions per world, by their home islands, for quick lookups. */
const homesByIsland = new WeakMap<World, Map<number, FactionHome>>();

/**
 * The factions a world starts with: stocks at their targets, gold, minds.
 *
 * @param world - the world (empty list for worlds from before factions)
 * @returns the factions
 */
export function createFactions(world: World): Faction[] {
  return world.factionHomes.map((home, index) => {
    const def = CULTURE[home.culture];
    const stock = perGood(0);
    for (const rate of def.produces) {
      stock[rate.good] = MADE_TARGET;
    }
    for (const good of def.wants) {
      stock[good] = Math.round(WANT_TARGET / 2);
    }
    return {
      id: FACTION_ID[home.culture],
      culture: home.culture,
      kind: def.kind,
      island: home.island,
      leader: def.leader,
      gold: def.gold,
      stock,
      mood: "idle",
      nextThink: FACTION_THINK + index * THINK_STAGGER,
      fleet: [],
      nextShip: 0,
      contracts: [],
      protection: [],
      market: [],
      marketUntil: 0,
      notes: [],
      granted: [],
      effects: {
        plague: 0,
        famine: 0,
        storm: 0,
        gathering: 0,
        boost: 0,
        boostGood: null,
      },
      support: null,
      raidAt: {},
      intel: {},
      traded: 0,
      nextMission: 0,
      nextEvent: 0,
      nextDeal: 0,
      treasures: [],
      ceasefire: {},
      demand: null,
      deeds: {},
    };
  });
}

/**
 * Relations between every faction and every player, without treaties: at
 * peace with the peoples, at war with the pirates (but for a peaceful game).
 *
 * @param factions - the factions
 * @param players - how many players there are
 * @param peaceful - whether the game is peaceful
 * @returns the relations, the faction's id as the lower one
 */
export function factionRelations(
  factions: readonly Faction[],
  players: number,
  peaceful: boolean,
): Relation[] {
  const relations: Relation[] = [];
  for (const faction of factions) {
    for (let player = 0; player < players; player += 1) {
      relations.push({
        a: faction.id,
        b: player,
        war: faction.kind === "pirates" && !peaceful,
        trade: false,
        pact: false,
        alliance: false,
        since: 0,
        memory: [],
      });
    }
  }
  return relations;
}

/**
 * Puts the first ships of every faction on the water.
 *
 * @param game - a new game
 */
export function launchFactions(game: Game): void {
  for (const faction of game.factions) {
    spawnFleet(game, faction);
  }
}

/**
 * Whether an owner id is one of the factions' (or the pirates' of older
 * worlds).
 *
 * @param id - an owner id
 * @returns true below the free trader
 */
export function isFactionId(id: number): boolean {
  return id < TRADER;
}

/**
 * A faction by its owner id.
 *
 * @param game - the game
 * @param id - the owner id
 * @returns the faction, or null (also for the pirates of an older world)
 */
export function factionById(game: Game, id: number): Faction | null {
  return id < TRADER ? (game.factions.find((f) => f.id === id) ?? null) : null;
}

/**
 * The faction whose home an island is.
 *
 * @param game - the game
 * @param island - the island id
 * @returns the faction, or null
 */
export function factionOfIsland(game: Game, island: number): Faction | null {
  return game.factions.find((f) => f.island === island) ?? null;
}

/**
 * Whether an island is a faction's home, closed to everyone else.
 *
 * @param world - the world
 * @param island - the island id
 * @returns true for a faction's island
 */
export function isFactionIsland(world: World, island: number): boolean {
  let byIsland = homesByIsland.get(world);
  if (byIsland === undefined) {
    byIsland = new Map(world.factionHomes.map((home) => [home.island, home]));
    homesByIsland.set(world, byIsland);
  }
  return byIsland.has(island);
}

/**
 * Where a faction lives.
 *
 * @param game - the game
 * @param faction - the faction
 * @returns its home
 */
export function homeOf(game: Game, faction: Faction): FactionHome {
  return game.world.factionHomes.find(
    (home) => home.island === faction.island,
  ) as FactionHome;
}

/**
 * The fixed facts of a faction.
 *
 * @param faction - the faction
 * @returns its culture
 */
export function cultureOf(faction: Faction): CultureDef {
  return CULTURE[faction.culture];
}

/**
 * The name of any owner: a player, a faction, or the pirates of old.
 *
 * @param game - the game
 * @param id - the owner id
 * @returns the name, or null when unknown
 */
export function ownerName(game: Game, id: number): string | null {
  const player = playerById(game, id);
  const faction = factionById(game, id);
  return player?.name ?? (faction === null ? null : cultureOf(faction).name);
}

/**
 * The colour of any owner's flag.
 *
 * @param game - the game
 * @param id - the owner id
 * @returns 0xRRGGBB, or null when it has none of its own
 */
export function ownerColor(game: Game, id: number): number | null {
  const player = playerById(game, id);
  const faction = factionById(game, id);
  return player?.color ?? (faction === null ? null : cultureOf(faction).color);
}

/**
 * Whether a faction is one of the pirate bands.
 *
 * @param game - the game
 * @param id - an owner id
 * @returns true for pirates, also those of an older world
 */
export function isPirates(game: Game, id: number): boolean {
  const faction = factionById(game, id);
  return faction === null ? id === PIRATES : faction.kind === "pirates";
}

/**
 * The stage a relation value stands at.
 *
 * @param opinion - -100 to 100
 * @returns the stage
 */
export function stageOf(opinion: number): Stage {
  const value = Math.round(opinion);
  return STAGE_FROM.find(([, from]) => value >= from)?.[0] ?? "hostile";
}

/**
 * What a faction thinks of a player, with every reason.
 *
 * @param game - the game
 * @param faction - the faction
 * @param player - the player id
 * @returns the reasons; their sum is the opinion
 */
export function factionReasons(
  game: Game,
  faction: Faction,
  player: number,
): { reason: Relation["memory"][number]["reason"]; value: number }[] {
  const relation = relationOf(game, faction.id, player);
  const other = playerById(game, player);
  const reasons: {
    reason: Relation["memory"][number]["reason"];
    value: number;
  }[] = [];
  if (relation !== null && other !== null) {
    reasons.push({ reason: "culture", value: cultureOf(faction).base });
    const reputation =
      other.reputation.reduce((sum, m) => sum + m.value, 0) * REPUTATION_SHARE;
    if (Math.round(reputation) !== 0) {
      reasons.push({ reason: "reputation", value: reputation });
    }
    if (relation.trade) {
      reasons.push({ reason: "tradeAgreement", value: STANDING_TRADE });
    }
    if (relation.alliance) {
      reasons.push({ reason: "alliance", value: STANDING_ALLIANCE });
    }
    // War with the pirates is the rule, already in their nature.
    if (relation.war && faction.kind === "nation") {
      reasons.push({ reason: "war", value: STANDING_WAR });
    }
    if (protectedFrom(game, faction, player)) {
      reasons.push({ reason: "protection", value: STANDING_PROTECTION });
    }
    for (const memory of relation.memory) {
      reasons.push({ ...memory });
    }
  }
  return reasons;
}

/**
 * What a faction thinks of a player.
 *
 * @param game - the game
 * @param faction - the faction
 * @param player - the player id
 * @returns -100 to 100
 */
export function factionOpinion(
  game: Game,
  faction: Faction,
  player: number,
): number {
  const sum = factionReasons(game, faction, player).reduce(
    (total, m) => total + m.value,
    0,
  );
  return Math.max(-RELATION_LIMIT, Math.min(RELATION_LIMIT, sum));
}

/**
 * Whether a pirate band leaves a player's ships alone for paid protection:
 * the war goes on, but they do not raid while it is paid.
 *
 * @param game - the game
 * @param faction - the band
 * @param player - the player id
 * @returns true while protected
 */
export function protectedFrom(
  game: Game,
  faction: Faction,
  player: number,
): boolean {
  return faction.protection.some(
    (p) => p.player === player && p.until > game.time,
  );
}

/**
 * Whether a player is allied with a faction.
 *
 * @param game - the game
 * @param faction - the faction
 * @param player - the player id
 * @returns true with an alliance
 */
export function alliedWith(
  game: Game,
  faction: Faction,
  player: number,
): boolean {
  return relationOf(game, faction.id, player)?.alliance === true;
}

/**
 * Whether a faction and another owner fight each other.
 *
 * @param game - the game
 * @param a - one owner id
 * @param b - the other
 * @returns true when enemies
 */
export function factionHostile(game: Game, a: number, b: number): boolean {
  const fa = factionById(game, a);
  const fb = factionById(game, b);
  const peaceful = game.settings.peaceful;
  let result: boolean;
  if (fa === null && fb === null) {
    // The pirates of an older world fight everyone.
    result = (a === PIRATES || b === PIRATES) && !peaceful;
  } else if (fa !== null && fb !== null) {
    result = fa.kind !== fb.kind && !peaceful;
  } else {
    const faction = (fa ?? fb) as Faction;
    const other = fa === null ? a : b;
    result =
      faction.kind === "pirates"
        ? pirateHostile(game, faction, other)
        : nationHostile(game, faction, other);
  }
  return result;
}

/** Pirates are at war with every player unless paid or allied. */
function pirateHostile(game: Game, faction: Faction, other: number): boolean {
  return (
    !game.settings.peaceful &&
    playerById(game, other) !== null &&
    !protectedFrom(game, faction, other) &&
    !alliedWith(game, faction, other)
  );
}

/** A people fights a player at war with it, or the enemy of a friend it helps. */
function nationHostile(game: Game, faction: Faction, other: number): boolean {
  const relation = relationOf(game, faction.id, other);
  const helped = faction.support;
  return (
    !game.settings.peaceful &&
    (relation?.war === true ||
      (helped !== null &&
        helped.until > game.time &&
        helped.player !== other &&
        relationOf(game, helped.player, other)?.war === true))
  );
}

/**
 * Whether a ship lies in a faction's harbour: close to the berth and still.
 *
 * @param game - the game
 * @param faction - the faction
 * @param ship - the ship
 * @returns true when it may trade there
 */
export function inHarbour(game: Game, faction: Faction, ship: Ship): boolean {
  const berth = homeOf(game, faction).berth;
  const n = game.world.n;
  return (
    berth >= 0 &&
    ship.path.length === 0 &&
    Math.hypot(
      (berth % n) + TILE_CENTER - ship.x,
      Math.floor(berth / n) + TILE_CENTER - ship.y,
    ) <= HARBOUR_REACH
  );
}

/**
 * A player's ships lying in a faction's harbour.
 *
 * @param game - the game
 * @param faction - the faction
 * @param player - the player id
 * @returns the ships, war ships too
 */
export function shipsInHarbour(
  game: Game,
  faction: Faction,
  player: number,
): Ship[] {
  return game.ships.filter(
    (ship) => ship.owner === player && inHarbour(game, faction, ship),
  );
}

/**
 * The faction whose harbour a ship lies in, if any.
 *
 * @param game - the game
 * @param ship - the ship
 * @returns the faction, or null
 */
export function harbourOfShip(game: Game, ship: Ship): Faction | null {
  return game.factions.find((f) => inHarbour(game, f, ship)) ?? null;
}

/**
 * How much a faction wants a good, -1 (glut) to 1 (scarce): its stock
 * against the target it would like to hold.
 *
 * @param faction - the faction
 * @param good - the good
 * @returns the pressure
 */
export function pressureOf(faction: Faction, good: GoodId): number {
  const target = targetOf(faction, good);
  return Math.max(-1, Math.min(1, (target - faction.stock[good]) / target));
}

/**
 * A faction's price of a good before its margin, at a given stock.
 *
 * @param game - the game
 * @param faction - the faction
 * @param good - the good
 * @param stock - the stock to price at (the faction's own when left out)
 * @returns gold per unit
 */
export function priceAt(
  game: Game,
  faction: Faction,
  good: GoodId,
  stock = faction.stock[good],
): number {
  const def = cultureOf(faction);
  const target = targetOf(faction, good);
  const pressure = Math.max(-1, Math.min(1, (target - stock) / target));
  const famine =
    faction.effects.famine > game.time && FOODS.includes(good)
      ? FAMINE_PRICE
      : 1;
  const surplus =
    wanted(faction, good) || sells(faction, good) ? 1 : SURPLUS_SHARE;
  return GOOD[good].value * (1 + def.swing * pressure) * famine * surplus;
}

/**
 * Gold a player pays a faction for one unit, after its margin and the
 * player's standing.
 *
 * @param game - the game
 * @param faction - the faction
 * @param player - the buyer
 * @param good - the good
 * @param stock - the stock to price at (the faction's own when left out)
 * @returns gold per unit
 */
export function askPrice(
  game: Game,
  faction: Faction,
  player: number,
  good: GoodId,
  stock = faction.stock[good],
): number {
  return (
    priceAt(game, faction, good, stock) *
    FACTION_BUY_SHARE *
    (1 - standingShare(game, faction, player)) *
    (player === HUMAN ? difficultyOf(game).buyPrice : 1)
  );
}

/**
 * Gold a faction pays a player for one unit.
 *
 * @param game - the game
 * @param faction - the faction
 * @param player - the seller
 * @param good - the good
 * @param stock - the stock to price at (the faction's own when left out)
 * @returns gold per unit
 */
export function bidPrice(
  game: Game,
  faction: Faction,
  player: number,
  good: GoodId,
  stock = faction.stock[good],
): number {
  return (
    priceAt(game, faction, good, stock) *
    FACTION_SELL_SHARE *
    (1 + standingShare(game, faction, player)) *
    (player === HUMAN ? difficultyOf(game).sellPrice : 1)
  );
}

/**
 * Units of a good a faction would sell a player now.
 *
 * @param game - the game
 * @param faction - the faction
 * @param player - the buyer
 * @param good - the good
 * @returns units
 */
export function forSale(
  game: Game,
  faction: Faction,
  player: number,
  good: GoodId,
): number {
  const stage = stageOf(factionOpinion(game, faction, player));
  const keep = Math.ceil(targetOf(faction, good) * RESERVE[stage]);
  return sells(faction, good)
    ? Math.max(0, Math.floor(faction.stock[good] - keep))
    : 0;
}

/**
 * Units of a good a faction would buy from a player now.
 *
 * @param game - the game
 * @param faction - the faction
 * @param player - the seller
 * @param good - the good
 * @returns units
 */
export function wantedUnits(
  game: Game,
  faction: Faction,
  player: number,
  good: GoodId,
): number {
  const price = Math.max(1, bidPrice(game, faction, player, good));
  const takes =
    !sells(faction, good) &&
    GOOD[good].category !== "exotic" &&
    (wanted(faction, good) || cultureOf(faction).buysSurplus);
  return takes
    ? Math.max(
        0,
        Math.floor(
          Math.min(
            FACTION_CAPACITY - faction.stock[good],
            (faction.gold - GOLD_RESERVE) / price,
          ),
        ),
      )
    : 0;
}

/**
 * The goods a faction sells, in list order.
 *
 * @param faction - the faction
 * @returns the goods
 */
export function offerOf(faction: Faction): GoodId[] {
  return GOOD_IDS.filter(
    (good) => sells(faction, good) && good !== "treasureMap",
  );
}

/**
 * The goods a faction buys at its full price, in list order.
 *
 * @param faction - the faction
 * @returns the goods
 */
export function demandOf(faction: Faction): GoodId[] {
  return GOOD_IDS.filter((good) => wanted(faction, good));
}

/**
 * Why a player may not trade with a faction now, or null when it may.
 *
 * @param game - the game
 * @param faction - the faction
 * @param player - the player id
 * @returns a reason key, or null
 */
export function tradeRefusal(
  game: Game,
  faction: Faction,
  player: number,
): string | null {
  const relation = relationOf(game, faction.id, player);
  let reason: string | null = null;
  if (relation === null) {
    reason = "missing";
  } else if (!relation.trade) {
    reason = "fx:noTrade";
  } else if (relation.war && faction.kind === "nation") {
    // Pirates smuggle with their enemies all the same.
    reason = "fx:atWar";
  } else if (faction.effects.storm > game.time) {
    reason = "fx:storm";
  } else if (
    factionOpinion(game, faction, player) < cultureOf(faction).tradeFloor
  ) {
    reason = "fx:refuses";
  }
  return reason;
}

/**
 * Carries out what a player does with a faction.
 *
 * @param game - the game
 * @param player - who acts
 * @param id - the faction's id
 * @param action - what
 * @param island - the player's island goods come from, where it matters
 * @returns null when done, else why not
 */
export function factionAction(
  game: Game,
  player: number,
  id: number,
  action: FactionAction,
  island: number,
): string | null {
  const faction = factionById(game, id);
  const owner = playerById(game, player);
  let reason: string | null = null;
  if (faction === null || owner === null) {
    reason = "missing";
  } else {
    switch (action.type) {
      case "open":
        reason = openTrade(game, faction, owner);
        break;
      case "buy":
      case "sell":
        reason = trade(game, faction, owner, action);
        break;
      case "gift":
        reason = gift(game, faction, owner, action.gold);
        break;
      case "demand":
        reason = demand(game, faction, owner, action.gold);
        break;
      case "contract":
        reason = proposeContract(game, faction, owner, action, island);
        break;
      case "cancelContract":
        reason = cancelContract(game, faction, owner, action.contract);
        break;
      case "support":
      case "hunt":
        reason = askSupport(game, faction, owner, action.type === "hunt");
        break;
      case "ceasefire":
        reason = ceasefire(game, faction, owner);
        break;
      case "alliance":
      case "cancelAlliance":
        reason =
          faction.kind === "pirates"
            ? pirateAlliance(game, faction, owner, action.type === "alliance")
            : alliance(game, faction, owner, action.type === "alliance");
        break;
      case "learn":
        reason = learn(game, faction, owner);
        break;
      case "protection":
      case "endProtection":
      case "intel":
        reason = signProtection(game, faction, owner, action.type);
        break;
      case "market":
        reason = buyFromMarket(game, faction, owner, action);
        break;
      default:
        reason = deliverCargo(
          game,
          faction,
          owner,
          action.mission,
          action.ship,
        );
    }
  }
  return reason;
}

/**
 * Notes something in a faction's news and tells the screen.
 *
 * @param game - the game
 * @param faction - the faction
 * @param kind - what happened
 * @param player - the player concerned, or -1
 * @param good - the good concerned, or null
 * @param amount - units or gold
 */
export function note(
  game: Game,
  faction: Faction,
  kind: FactionNoteKind,
  player: number,
  good: GoodId | null,
  amount: number,
): void {
  const entry: FactionNote = {
    time: game.time,
    kind,
    player,
    good,
    amount: Math.round(amount),
  };
  faction.notes.push(entry);
  if (faction.notes.length > NOTES_KEPT) {
    faction.notes.shift();
  }
  game.events.push({ type: "faction", faction: faction.id, note: entry });
}

/**
 * Remembers something between a faction and a player, weighed by the
 * faction's temper.
 *
 * @param game - the game
 * @param faction - the faction
 * @param player - the player id
 * @param reason - why
 * @param value - how much before the temper
 */
export function feel(
  game: Game,
  faction: Faction,
  player: number,
  reason: Relation["memory"][number]["reason"],
  value: number,
): void {
  remember(
    game,
    faction.id,
    player,
    reason,
    value * (cultureOf(faction).temper[reason] ?? 1),
  );
}

/**
 * Whether a faction taught a player its art.
 *
 * @param game - the game
 * @param culture - the faction's culture
 * @param player - the player id
 * @returns true when granted
 */
export function hasPerk(
  game: Game,
  culture: CultureId,
  player: number,
): boolean {
  return (
    game.factions
      .find((f) => f.culture === culture)
      ?.granted.includes(player) === true
  );
}

/**
 * One step of every faction: each thinks in turn every
 * {@link FACTION_THINK} seconds; ships, pirates and events follow.
 *
 * @param game - the game
 */
export function stepFactions(game: Game): void {
  for (const faction of game.factions) {
    if (game.time >= faction.nextThink) {
      faction.nextThink += FACTION_THINK;
      economy(game, faction, FACTION_THINK);
      contracts(game, faction);
      if (faction.kind === "pirates") {
        stepPirates(game, faction);
      }
      stepFactionEvents(game, faction);
      reactToAttacks(game, faction);
    }
  }
  stepFactionFleets(game);
}

/**
 * Settles one delivery of a contract at a player's kontor: goods and gold
 * change hands, or it is suspended and maybe counts as a breach.
 *
 * @param game - the game
 * @param faction - the faction
 * @param contract - the contract
 * @param island - the player's island its ship lies at
 * @param ship - the faction's ship there
 */
export function settleDelivery(
  game: Game,
  faction: Faction,
  contract: SupplyContract,
  island: number,
  ship: Ship,
): void {
  const owner = playerById(game, contract.player);
  const stock = game.islands[island]?.stock;
  if (owner !== null && stock !== undefined) {
    if (contract.direction === "sell") {
      const room = roomFor(ship, contract.good);
      const can =
        stock[contract.good] >= contract.amount &&
        room >= contract.amount &&
        faction.gold >= contract.gold;
      if (can) {
        stock[contract.good] -= contract.amount;
        ship.cargo[contract.good] =
          (ship.cargo[contract.good] ?? 0) + contract.amount;
        faction.gold -= contract.gold;
        earn(owner, contract.gold, "sales");
        owner.stats.traded += contract.amount;
        kept(game, faction, contract);
      } else {
        breach(game, faction, contract, faction.gold >= contract.gold);
      }
    } else {
      const have = ship.cargo[contract.good] ?? 0;
      const paid = owner.gold >= contract.gold;
      if (have >= contract.amount && paid) {
        const landed = addStock(game, island, contract.good, contract.amount);
        ship.cargo[contract.good] = have - landed;
        spend(owner, contract.gold, "purchases");
        faction.gold += contract.gold;
        owner.stats.traded += landed;
        kept(game, faction, contract);
      } else {
        breach(game, faction, contract, have >= contract.amount);
      }
    }
  }
}

/** The target stock of a good. */
function targetOf(faction: Faction, good: GoodId): number {
  return sells(faction, good)
    ? MADE_TARGET
    : wanted(faction, good)
      ? WANT_TARGET
      : SURPLUS_TARGET;
}

/** Whether a faction sells a good. */
function sells(faction: Faction, good: GoodId): boolean {
  return cultureOf(faction).sells.includes(good);
}

/** Whether a faction buys a good at its full price. */
function wanted(faction: Faction, good: GoodId): boolean {
  return cultureOf(faction).wants.includes(good);
}

/** Share off and on the prices for a player, by stage and charter. */
function standingShare(game: Game, faction: Faction, player: number): number {
  const stage = stageOf(factionOpinion(game, faction, player));
  const charter =
    faction.culture === "valdoria" && faction.granted.includes(player)
      ? CHARTER_SHARE
      : 0;
  return STAGE_DISCOUNT[stage] + charter;
}

/** One round of a faction's works, people and gold. */
function economy(game: Game, faction: Faction, seconds: number): void {
  const def = cultureOf(faction);
  const share = seconds / MINUTE;
  const plague =
    (faction.effects.plague > game.time ? PLAGUE_WORK : 1) *
    factionWork(game, faction.island);
  for (const rate of def.produces) {
    const boost =
      faction.effects.boost > game.time &&
      faction.effects.boostGood === rate.good
        ? BOOST_WORK
        : 1;
    faction.stock[rate.good] = Math.min(
      FACTION_CAPACITY,
      faction.stock[rate.good] + rate.perMinute * share * plague * boost,
    );
  }
  const famine = faction.effects.famine > game.time;
  for (const rate of def.consumes) {
    const eat = famine && FOODS.includes(rate.good) ? FAMINE_EATING : 1;
    faction.stock[rate.good] = Math.max(
      0,
      faction.stock[rate.good] - rate.perMinute * share * eat,
    );
  }
  faction.gold += def.income * share;
  faction.mood = moodOf(game, faction);
}

/** What a faction is busy with, for its window. */
function moodOf(game: Game, faction: Faction): Faction["mood"] {
  let mood: Faction["mood"];
  if (faction.kind === "pirates") {
    const states = faction.fleet.map((s) => s.state);
    mood =
      states.find((s) => s === "attacking" || s === "looting") ??
      states.find((s) => s === "chasing") ??
      states.find((s) => s === "searching" || s === "patrolling") ??
      states.find((s) => s === "returning" || s === "repairing") ??
      (faction.protection.some((p) => p.until > game.time)
        ? "negotiating"
        : "idle");
  } else {
    const away = faction.fleet.some((s) => s.state === "trading");
    const fighting = faction.fleet.some((s) => s.state === "defending");
    mood = fighting
      ? "defending"
      : faction.effects.plague > game.time || faction.effects.storm > game.time
        ? "recovering"
        : faction.nextShip > game.time
          ? "expanding"
          : away
            ? "trading"
            : faction.contracts.length > 0
              ? "negotiating"
              : "producing";
  }
  return mood;
}

/** Contracts come due: the faction sends a ship, or suspends the delivery. */
function contracts(game: Game, faction: Faction): void {
  for (const contract of [...faction.contracts]) {
    if (game.time >= contract.next) {
      contract.next = game.time + contract.every;
      dispatchContract(game, faction, contract);
    }
  }
}

/** Sends a merchant to a contract's kontor; without one it waits. */
function dispatchContract(
  game: Game,
  faction: Faction,
  contract: SupplyContract,
): void {
  const merchant = faction.fleet.find(
    (s) => s.role === "merchant" && s.state === "idle",
  );
  const ship = game.ships.find((s) => s.id === merchant?.ship);
  const owner = playerById(game, contract.player);
  const island = owner === null ? -1 : contractIsland(game, owner.id, contract);
  if (merchant === undefined || ship === undefined || island < 0) {
    contract.suspended = true;
    note(
      game,
      faction,
      "suspended",
      contract.player,
      contract.good,
      contract.amount,
    );
  } else if (
    contract.direction === "buy" &&
    faction.stock[contract.good] < contract.amount
  ) {
    // The faction lacks the goods: no breach of the player's.
    contract.suspended = true;
    note(
      game,
      faction,
      "suspended",
      contract.player,
      contract.good,
      contract.amount,
    );
  } else {
    if (contract.direction === "buy") {
      faction.stock[contract.good] -= contract.amount;
      ship.cargo[contract.good] =
        (ship.cargo[contract.good] ?? 0) + contract.amount;
    }
    merchant.state = "trading";
    merchant.target = contract.id;
    merchant.x = island;
    merchant.since = game.time;
  }
}

/** The player's island a contract's ship sails to: most of the good, else home. */
function contractIsland(
  game: Game,
  player: number,
  contract: SupplyContract,
): number {
  let best = -1;
  let most = -1;
  for (const state of game.islands) {
    if (
      state.owner === player &&
      game.buildings.some((b) => b.kind === "kontor" && b.island === state.id)
    ) {
      const amount =
        contract.direction === "sell"
          ? state.stock[contract.good]
          : -state.stock[contract.good];
      if (amount > most) {
        most = amount;
        best = state.id;
      }
    }
  }
  return best;
}

/** A delivery went right. */
function kept(game: Game, faction: Faction, contract: SupplyContract): void {
  contract.deliveries += 1;
  contract.breaches = 0;
  contract.suspended = false;
  faction.traded += contract.gold;
  feel(game, faction, contract.player, "contract", KEPT_MEMORY);
  note(
    game,
    faction,
    "delivered",
    contract.player,
    contract.good,
    contract.amount,
  );
}

/**
 * A delivery failed: suspended, and the player's breach when it was the
 * player's fault; too many in a row and the faction cancels.
 */
function breach(
  game: Game,
  faction: Faction,
  contract: SupplyContract,
  playersFault: boolean,
): void {
  contract.suspended = true;
  if (playersFault) {
    contract.breaches += 1;
    feel(game, faction, contract.player, "breach", BREACH_MEMORY);
    note(
      game,
      faction,
      "breach",
      contract.player,
      contract.good,
      contract.amount,
    );
    if (contract.breaches >= BREACH_LIMIT) {
      faction.contracts = faction.contracts.filter((c) => c !== contract);
      feel(game, faction, contract.player, "breach", CANCEL_MEMORY);
      note(
        game,
        faction,
        "contractCancelled",
        contract.player,
        contract.good,
        contract.amount,
      );
    }
  } else {
    note(
      game,
      faction,
      "suspended",
      contract.player,
      contract.good,
      contract.amount,
    );
  }
}

/**
 * A people attacked again and again by a player declares war when its
 * opinion falls low enough; never in a peaceful game.
 */
function reactToAttacks(game: Game, faction: Faction): void {
  if (faction.kind === "nation" && !game.settings.peaceful) {
    for (const player of game.players) {
      const relation = relationOf(game, faction.id, player.id);
      const attacked =
        relation?.memory.some((m) => m.reason === "attacked") === true;
      if (
        relation !== null &&
        !relation.war &&
        attacked &&
        (faction.ceasefire[String(player.id)] ?? 0) <= game.time &&
        factionOpinion(game, faction, player.id) <= WAR_OPINION
      ) {
        relation.war = true;
        relation.trade = false;
        relation.alliance = false;
        relation.since = game.time;
        faction.contracts = faction.contracts.filter(
          (c) => c.player !== player.id,
        );
        note(game, faction, "war", player.id, null, 0);
      }
    }
  }
}

/** Opens trade relations, if the faction does not dislike the player too much. */
function openTrade(game: Game, faction: Faction, owner: Player): string | null {
  const relation = relationOf(game, faction.id, owner.id) as Relation;
  let reason: string | null = null;
  if (relation.trade) {
    reason = "fx:already";
  } else if (relation.war && faction.kind === "nation") {
    reason = "fx:atWar";
  } else if (
    factionOpinion(game, faction, owner.id) < cultureOf(faction).tradeFloor
  ) {
    reason = "fx:refuses";
  } else {
    relation.trade = true;
    note(game, faction, "trade", owner.id, null, 0);
  }
  return reason;
}

/** Buys from or sells to a faction from a ship lying in its harbour. */
function trade(
  game: Game,
  faction: Faction,
  owner: Player,
  action: Extract<FactionAction, { type: "buy" | "sell" }>,
): string | null {
  const ship = game.ships.find(
    (s) => s.id === action.ship && s.owner === owner.id,
  );
  const refusal = tradeRefusal(game, faction, owner.id);
  let reason: string | null = null;
  if (refusal !== null) {
    reason = refusal;
  } else if (ship === undefined || !inHarbour(game, faction, ship)) {
    reason = "fx:noShip";
  } else if (!GOOD_IDS.includes(action.good) || action.amount <= 0) {
    reason = "missing";
  } else if (action.type === "buy") {
    const half = Math.floor(
      Math.min(action.amount, forSale(game, faction, owner.id, action.good)) /
        2,
    );
    const price = askPrice(
      game,
      faction,
      owner.id,
      action.good,
      faction.stock[action.good] - half,
    );
    const units = Math.floor(
      Math.min(
        action.amount,
        forSale(game, faction, owner.id, action.good),
        roomFor(ship, action.good),
        Math.max(0, owner.gold) / price,
      ),
    );
    if (units <= 0) {
      reason = owner.gold < price ? "gold" : "fx:none";
    } else {
      const gold = units * price;
      faction.stock[action.good] -= units;
      ship.cargo[action.good] = (ship.cargo[action.good] ?? 0) + units;
      spend(owner, gold, "purchases");
      faction.gold += gold;
      dealt(game, faction, owner, "bought", action.good, units, gold);
    }
  } else {
    const can = wantedUnits(game, faction, owner.id, action.good);
    const half = Math.floor(Math.min(action.amount, can) / 2);
    const price = bidPrice(
      game,
      faction,
      owner.id,
      action.good,
      faction.stock[action.good] + half,
    );
    const units = Math.floor(
      Math.min(action.amount, can, ship.cargo[action.good] ?? 0),
    );
    if (units <= 0) {
      reason =
        (ship.cargo[action.good] ?? 0) <= 0 ? "fx:noCargo" : "fx:notWanted";
    } else {
      const gold = units * price;
      faction.stock[action.good] += units;
      ship.cargo[action.good] = (ship.cargo[action.good] ?? 0) - units;
      if ((ship.cargo[action.good] ?? 0) <= 0) {
        delete ship.cargo[action.good];
      }
      faction.gold -= gold;
      earn(owner, gold, "sales");
      dealt(game, faction, owner, "sold", action.good, units, gold);
    }
  }
  return reason;
}

/** What a deal leaves: counters, memory, news. */
function dealt(
  game: Game,
  faction: Faction,
  owner: Player,
  kind: "bought" | "sold",
  good: GoodId,
  units: number,
  gold: number,
): void {
  owner.stats.traded += units;
  if (owner.id === HUMAN) {
    faction.traded += gold;
  }
  feel(
    game,
    faction,
    owner.id,
    "trade",
    Math.min(TRADE_MOST, gold / TRADE_GOLD_PER_POINT),
  );
  note(game, faction, kind, owner.id, good, units);
}

/** A gift of gold, as to a rival: memory by its worth, a little reputation. */
function gift(
  game: Game,
  faction: Faction,
  owner: Player,
  gold: number,
): string | null {
  let reason: string | null = null;
  if (gold < GIFT_LEAST || !Number.isFinite(gold)) {
    reason = "missing";
  } else if (owner.gold < gold) {
    reason = "gold";
  } else {
    spend(owner, gold, "payments");
    faction.gold += gold;
    feel(
      game,
      faction,
      owner.id,
      "gift",
      Math.min(GIFT_MOST, gold / GIFT_GOLD_PER_POINT),
    );
    changeReputation(owner, "gift", GIFT_REPUTATION);
    note(game, faction, "gift", owner.id, null, gold);
  }
  return reason;
}

/**
 * The verdict of a people on a demand for gold, as a rival's: it pays when
 * the player is stronger by its character's measure (less for a friend,
 * more for a foe) and it can spare the gold.
 *
 * @param game - the game
 * @param faction - the people
 * @param player - who demands
 * @param gold - how much
 * @returns the answer and whether it pays
 */
export function demandVerdict(
  game: Game,
  faction: Faction,
  player: number,
  gold: number,
): { accepted: boolean; answer: DiplomacyAnswer } {
  const relation = relationOf(game, faction.id, player);
  const opinion = factionOpinion(game, faction, player);
  const ratio =
    strengthOf(game, player) / Math.max(1, strengthOf(game, faction.id));
  const need = demandNeed(faction, opinion);
  let answer: DiplomacyAnswer;
  if (relation === null || faction.kind !== "nation") {
    answer = "gone";
  } else if (relation.war) {
    answer = "atWar";
  } else if (faction.gold - gold < GOLD_RESERVE) {
    answer = "noGold";
  } else if (ratio < need) {
    answer = "notAfraid";
  } else {
    answer = opinion >= FRIENDLY ? "friendship" : "fear";
  }
  return {
    accepted: answer === "friendship" || answer === "fear",
    answer,
  };
}

/**
 * How many times stronger than a people a player must be for a demand.
 *
 * @param faction - the people
 * @param opinion - what it thinks of the player
 * @returns the strength ratio it gives in at
 */
export function demandNeed(faction: Faction, opinion: number): number {
  return Math.max(
    DEMAND_LEAST_RATIO,
    cultureOf(faction).demandFear - opinion * DEMAND_OPINION_SHARE,
  );
}

/** A demand for gold: the people pays from its own treasury, or refuses. */
function demand(
  game: Game,
  faction: Faction,
  owner: Player,
  gold: number,
): string | null {
  let reason: string | null = null;
  if (gold < GIFT_LEAST || !Number.isFinite(gold)) {
    reason = "missing";
  } else if (faction.kind === "pirates") {
    reason = "fx:noDemand";
  } else {
    const verdict = demandVerdict(game, faction, owner.id, gold);
    if (verdict.accepted) {
      faction.gold -= gold;
      earn(owner, gold, "rewards");
      feel(game, faction, owner.id, "demand", DEMAND_MET_MEMORY);
      note(game, faction, "demand", owner.id, null, gold);
    } else {
      reason = `dip:${verdict.answer}`;
      if (verdict.answer !== "gone") {
        feel(game, faction, owner.id, "refused", DEMAND_REFUSED_MEMORY);
        note(game, faction, "demand", owner.id, null, 0);
      }
    }
  }
  return reason;
}

/**
 * What a contract would be: the gold per delivery the faction offers or
 * asks for a good and amount, or null when it does not deal in it.
 *
 * @param game - the game
 * @param faction - the faction
 * @param player - the player id
 * @param good - the good
 * @param amount - units per delivery
 * @param direction - "sell": the player delivers; "buy": the faction does
 * @returns gold per delivery, or null
 */
export function contractGold(
  game: Game,
  faction: Faction,
  player: number,
  good: GoodId,
  amount: number,
  direction: "sell" | "buy",
): number | null {
  const fits =
    direction === "sell" ? wanted(faction, good) : sells(faction, good);
  const exclusive =
    faction.culture === "valdoria" && faction.granted.includes(player);
  const price =
    direction === "sell"
      ? bidPrice(game, faction, player, good, targetOf(faction, good))
      : askPrice(game, faction, player, good, targetOf(faction, good));
  const share = direction === "sell" ? CONTRACT_SHARE : 1 / CONTRACT_SHARE;
  const bonus = exclusive
    ? direction === "sell"
      ? 1 + CHARTER_SHARE
      : 1 - CHARTER_SHARE
    : 1;
  return fits && good !== "treasureMap"
    ? Math.round(amount * price * share * bonus)
    : null;
}

/** Signs a contract at today's fair price. */
function proposeContract(
  game: Game,
  faction: Faction,
  owner: Player,
  action: Extract<FactionAction, { type: "contract" }>,
  island: number,
): string | null {
  const refusal =
    faction.kind === "nation"
      ? tradeRefusal(game, faction, owner.id)
      : "fx:noContract";
  const gold = contractGold(
    game,
    faction,
    owner.id,
    action.good,
    action.amount,
    action.direction,
  );
  const amount = Math.round(action.amount);
  let reason: string | null = null;
  if (refusal !== null) {
    reason = refusal;
  } else if (
    gold === null ||
    amount < CONTRACT_LEAST ||
    amount > CONTRACT_MOST
  ) {
    reason = "fx:notWanted";
  } else if (
    faction.contracts.filter((c) => c.player === owner.id).length >=
    CONTRACTS_EACH
  ) {
    reason = "fx:tooMany";
  } else if (
    stageOf(factionOpinion(game, faction, owner.id)) === "suspicious"
  ) {
    reason = "fx:refuses";
  } else {
    const id = game.nextId;
    game.nextId += 1;
    faction.contracts.push({
      id,
      faction: faction.id,
      player: owner.id,
      good: action.good,
      amount,
      gold,
      every: CONTRACT_EVERY,
      direction: action.direction,
      next: game.time + CONTRACT_EVERY,
      deliveries: 0,
      breaches: 0,
      suspended: false,
      exclusive:
        faction.culture === "valdoria" && faction.granted.includes(owner.id),
    });
    note(game, faction, "contract", owner.id, action.good, amount);
    void island;
  }
  return reason;
}

/** The player ends a contract; ending early is remembered a little. */
function cancelContract(
  game: Game,
  faction: Faction,
  owner: Player,
  id: number,
): string | null {
  const contract = faction.contracts.find(
    (c) => c.id === id && c.player === owner.id,
  );
  if (contract !== undefined) {
    faction.contracts = faction.contracts.filter((c) => c !== contract);
    feel(game, faction, owner.id, "breach", BREACH_MEMORY);
    note(
      game,
      faction,
      "contractCancelled",
      owner.id,
      contract.good,
      contract.amount,
    );
  }
  return contract === undefined ? "missing" : null;
}

/** Asks a people for war ships: to guard the player, or to hunt pirates. */
function askSupport(
  game: Game,
  faction: Faction,
  owner: Player,
  hunt: boolean,
): string | null {
  const relation = relationOf(game, faction.id, owner.id) as Relation;
  const opinion = factionOpinion(game, faction, owner.id);
  const busy =
    faction.support !== null &&
    faction.support.until + SUPPORT_PAUSE > game.time;
  const guards = faction.fleet.filter((s) => s.role === "guard").length;
  let reason: string | null = null;
  if (faction.kind !== "nation" || !cultureOf(faction).helps) {
    reason = "fx:noHelp";
  } else if (game.settings.peaceful && !hunt) {
    reason = "fx:peaceful";
  } else if (
    hunt ? opinion < FRIENDLY : opinion < ALLIED && !relation.alliance
  ) {
    reason = "fx:refuses";
  } else if (busy) {
    reason = "fx:busy";
  } else if (guards === 0) {
    reason = "fx:noShips";
  } else {
    faction.support = {
      player: owner.id,
      until: game.time + SUPPORT_SECONDS,
      hunt,
    };
    note(game, faction, "support", owner.id, null, guards);
  }
  return reason;
}

/**
 * A ceasefire: a people at war stops fighting after a while. The pirates
 * know none - their war only ends in an alliance, and protection money
 * only keeps their raiders away.
 */
function ceasefire(game: Game, faction: Faction, owner: Player): string | null {
  const relation = relationOf(game, faction.id, owner.id) as Relation;
  let reason: string | null = null;
  if (faction.kind === "pirates") {
    reason = "fx:pirateWar";
  } else if (!relation.war) {
    reason = "fx:notAtWar";
  } else if (game.time - relation.since < WAR_LEAST) {
    reason = "fx:tooSoon";
  } else {
    relation.war = false;
    relation.since = game.time;
    faction.ceasefire[String(owner.id)] = game.time + CEASEFIRE_SECONDS;
    feel(game, faction, owner.id, "ceasefire", CEASEFIRE_MEMORY);
    note(game, faction, "ceasefire", owner.id, null, 0);
  }
  return reason;
}

/** An alliance with a people (or its end). */
function alliance(
  game: Game,
  faction: Faction,
  owner: Player,
  sign: boolean,
): string | null {
  const relation = relationOf(game, faction.id, owner.id) as Relation;
  let reason: string | null = null;
  if (faction.kind !== "nation") {
    reason = "fx:noHelp";
  } else if (!sign) {
    if (relation.alliance) {
      relation.alliance = false;
      feel(game, faction, owner.id, "brokenPact", BREACH_MEMORY * 2);
      note(game, faction, "alliance", owner.id, null, 0);
    } else {
      reason = "fx:noTreaty";
    }
  } else if (relation.alliance) {
    reason = "fx:already";
  } else if (!relation.trade) {
    reason = "fx:noTrade";
  } else if (factionOpinion(game, faction, owner.id) < ALLIED) {
    reason = "fx:refuses";
  } else {
    relation.alliance = true;
    note(game, faction, "alliance", owner.id, null, 1);
  }
  return reason;
}

/** The faction teaches the player its art, for a price. */
function learn(game: Game, faction: Faction, owner: Player): string | null {
  const def = cultureOf(faction);
  let reason: string | null = null;
  if (def.perk === null) {
    reason = "fx:noPerk";
  } else if (faction.granted.includes(owner.id)) {
    reason = "fx:already";
  } else if (factionOpinion(game, faction, owner.id) < def.perkOpinion) {
    reason = "fx:refuses";
  } else if (owner.gold < def.perkGold) {
    reason = "gold";
  } else {
    spend(owner, def.perkGold, "payments");
    faction.gold += def.perkGold;
    faction.granted.push(owner.id);
    if (def.perk === "perfumery" && !owner.unlocked.includes("perfumery")) {
      owner.unlocked.push("perfumery");
      game.events.push({
        type: "unlocked",
        player: owner.id,
        kind: "perfumery",
      });
    }
    note(game, faction, "unlock", owner.id, null, def.perkGold);
  }
  return reason;
}

/**
 * A player turns its guns on a faction it was at peace with: pirates void
 * its protection and break an alliance (war again, the deeds counted anew),
 * a people takes it as war. Never in a peaceful game.
 *
 * @param game - the game
 * @param player - the player
 * @param id - the faction's id
 */
export function provoke(game: Game, player: number, id: number): void {
  const faction = factionById(game, id);
  const relation = relationOf(game, id, player);
  if (faction !== null && relation !== null && !game.settings.peaceful) {
    if (faction.kind === "pirates") {
      faction.protection = faction.protection.filter(
        (p) => p.player !== player,
      );
      if (relation.alliance) {
        breakPirateAlliance(game, faction, player);
      }
      feel(game, faction, player, "provoked", PIRATE_PROVOKED);
    } else {
      relation.war = true;
      relation.trade = false;
      relation.alliance = false;
      relation.since = game.time;
      faction.contracts = faction.contracts.filter((c) => c.player !== player);
      delete faction.ceasefire[String(player)];
      feel(game, faction, player, "provoked", NATION_PROVOKED);
      const owner = playerById(game, player);
      if (owner !== null) {
        changeReputation(owner, "declaredWar", PROVOKED_REPUTATION);
      }
    }
    note(game, faction, "war", player, null, 0);
  }
}

/**
 * How far a ship is from a faction's harbour, in tiles.
 *
 * @param game - the game
 * @param faction - the faction
 * @param x - from, tiles
 * @param y - from, tiles
 * @returns the distance
 */
export function harbourDistance(
  game: Game,
  faction: Faction,
  x: number,
  y: number,
): number {
  const berth = homeOf(game, faction).berth;
  const n = game.world.n;
  return Math.hypot(
    (berth % n) + TILE_CENTER - x,
    Math.floor(berth / n) + TILE_CENTER - y,
  );
}

/** Steps per faction think, for code that runs on its own cadence. */
export const THINK_STEPS = Math.round(FACTION_THINK / TICK);
