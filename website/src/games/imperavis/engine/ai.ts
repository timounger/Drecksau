/**
 * The AIManager: rival players who build their economy with the same
 * commands as the human - kontor, roads, production chains, houses - settle
 * further islands, run ships and trade routes, trade with the free trader
 * and the other players, study, arm themselves and react to crises:
 * shortages, an empty treasury and war.
 *
 * @module
 * @remarks
 * Each AI thinks every few game seconds, staggered so that no two think in
 * the same step, and every thought has a budget of placement checks and
 * road searches, so a step never takes long. Its character changes its
 * choices: a trader keeps more gold, sells more and signs treaties gladly;
 * an expansionist builds more houses and settles early; a warlike player
 * arms, demands tribute and goes to war. All chance comes from the game's
 * random state, so AI players play the same way after loading.
 */
import {
  BUILDING,
  BUILDINGS,
  LEVEL_COST,
  LEVEL_KINDS,
  WAREHOUSE_KINDS,
} from "./buildings-data";
import { applyCommand } from "./commands";
import {
  attackIsland,
  CHASE_RANGE,
  nearestEnemyShip,
  strengthOf,
} from "./combat";
import {
  atWar,
  offerToHuman,
  opinionOf,
  opinionReasons,
  propose,
  relationOf,
  remember,
  TRADE_OPINION,
} from "./diplomacy";
import { markOccupied, refreshDerived } from "./derived";
import { NO_ROAD } from "./logistics-data";
import { contractOf, CROWN, RACE_KINDS } from "./missions";
import { lineBalance } from "./economy";
import { GOOD, GOOD_IDS } from "./goods";
import { checkPlacement, FOUND_RANGE, hasAmounts } from "./placement";
import { HUMAN, islandsByAge, islandsOf } from "./players";
import { populationOf, residentsByTier } from "./population";
import { nextRandom } from "./random";
import { openFields } from "./research";
import { canLayRoad, planRoad } from "./roads";
import { isSea } from "./terrain";
import { SHIP } from "./ships-data";
import { berthOf, kontorOf, roomFor, shipLocked } from "./ships";
import { TIERS } from "./tiers";
import { aboard, unitLocked } from "./troops";
import { UNIT } from "./units-data";
import { ownKontor } from "./trade-routes";
import { capacityOf } from "./warehouse";
import {
  Terrain,
  type Building,
  type BuildingKind,
  type Command,
  type Game,
  type GoodId,
  type IslandInfo,
  type Mission,
  type Personality,
  type Player,
  type ResearchId,
  type RouteStop,
  type Ship,
  type ShipKind,
  type UnitKind,
} from "./types";

/** Seconds between two thoughts about the economy. */
export const THINK_EVERY = 3;

/** Seconds between two thoughts about the neighbours. */
export const DIPLOMACY_THINK = 45;

/** Placement checks one thought may make. */
const CHECK_BUDGET = 1500;

/** Road searches one thought may make. */
const PATH_BUDGET = 6;

/** Seconds a kind is not tried again after no site was found. */
const NO_SITE_PAUSE = 240;

/** How far around an anchor a site is looked for, in tiles. */
const SEARCH_RADIUS = 13;

/** Offsets around an anchor, nearest first, computed once. */
const OFFSETS: readonly (readonly [number, number])[] = makeOffsets(
  SEARCH_RADIUS + SEARCH_RADIUS,
);

/** What each character is like, in numbers. */
type Character = {
  /** Gold kept back when building. */
  readonly reserve: number;
  /** Most houses per island. */
  readonly houses: number;
  /** Residents at home before a second island is settled. */
  readonly settleAt: number;
  /** Gold at hand before a second island is settled. */
  readonly settleGold: number;
  /** Most islands it wants. */
  readonly islands: number;
  /** Warships it keeps in peace and in war. */
  readonly warships: number;
  readonly warshipsAtWar: number;
  /** Watchtowers per island in peace. */
  readonly towers: number;
  /** Share of a full store above which goods are sold. */
  readonly sellShare: number;
  /** Research in the order it prefers. */
  readonly research: readonly ResearchId[];
  /** Scholars' houses it wants at home. */
  readonly scholars: number;
  /** Soldiers it keeps in peace and in war. */
  readonly soldiers: number;
  readonly soldiersAtWar: number;
  /** Share of its gold it puts into colonies at most, as gold kept back. */
  readonly colonyReserve: number;
  /** War ships it builds, the best first: the first open and affordable. */
  readonly navy: readonly ShipKind[];
  /** Cargo ships it builds, the best first. */
  readonly merchants: readonly ShipKind[];
  /** The mix of its land troops: unit kind and weight. */
  readonly army: readonly (readonly [UnitKind, number])[];
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- weights of the army mixes */
/** The three characters. */
export const CHARACTERS: Readonly<Record<Personality, Character>> = {
  trader: {
    reserve: 900,
    houses: 44,
    settleAt: 110,
    settleGold: 2500,
    islands: 3,
    warships: 0,
    warshipsAtWar: 2,
    towers: 0,
    sellShare: 0.55,
    research: [
      "glass",
      "engineering",
      "crops",
      "guilds",
      "tobacco",
      "optics",
      "society",
      "shipbuilding",
      "jewelry",
      "wealth",
      "fortification",
      "tactics",
      "steam",
      "gunnery",
    ],
    scholars: 2,
    soldiers: 0,
    soldiersAtWar: 4,
    colonyReserve: 1200,
    navy: ["frigate", "warship"],
    merchants: ["steamer", "galleon", "hulk", "cog"],
    army: [
      ["line", 3],
      ["musketeer", 2],
      ["scout", 1],
    ],
  },
  expansionist: {
    reserve: 900,
    houses: 52,
    settleAt: 45,
    settleGold: 1600,
    islands: 4,
    warships: 0,
    warshipsAtWar: 2,
    towers: 0,
    sellShare: 0.6,
    research: [
      "crops",
      "glass",
      "engineering",
      "tobacco",
      "guilds",
      "optics",
      "society",
      "shipbuilding",
      "jewelry",
      "wealth",
      "fortification",
      "tactics",
      "gunnery",
      "steam",
    ],
    scholars: 1,
    soldiers: 0,
    soldiersAtWar: 4,
    colonyReserve: 900,
    navy: ["frigate", "warship"],
    merchants: ["hulk", "cog"],
    army: [
      ["militia", 2],
      ["line", 2],
      ["musketeer", 1],
      ["scout", 1],
    ],
  },
  warlike: {
    reserve: 700,
    houses: 38,
    settleAt: 140,
    settleGold: 2500,
    islands: 3,
    warships: 2,
    warshipsAtWar: 4,
    towers: 1,
    sellShare: 0.7,
    research: [
      "fortification",
      "glass",
      "engineering",
      "shipbuilding",
      "gunnery",
      "tactics",
      "crops",
      "guilds",
      "tobacco",
      "optics",
      "society",
      "jewelry",
      "wealth",
      "steam",
    ],
    scholars: 1,
    soldiers: 4,
    soldiersAtWar: 10,
    colonyReserve: 1200,
    navy: ["cruiser", "lineShip", "frigate", "warship"],
    merchants: ["hulk", "cog"],
    army: [
      ["line", 3],
      ["grenadier", 2],
      ["musketeer", 2],
      ["artillery", 1],
      ["cavalry", 1],
      ["pioneer", 1],
      ["medic", 1],
      ["sharpshooter", 1],
      ["elite", 1],
    ],
  },
};
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Above this gold the AI raises buildings to their second stage. */
const RICH = 8000;

/** Below this gold the AI saves: higher taxes, sells, builds little. */
const MONEY_LOW = 400;

/** Above this gold it spends normally again. */
const MONEY_OK = 1000;

/** Supply below this on an island is a shortage the AI fights. */
const SHORT = 0.5;

/** Production should cover demand by this factor. */
const COVER = 1.15;

/** A colony puts up at most this many of a kind home has no room for. */
const COLONY_HELP = 2;

/** Deficits looked at in one thought, the worst first. */
const DEFICIT_CHOICES = 3;

/** A deficit smaller than this per minute is ignored. */
const SMALL_DEFICIT = 0.25;

/** Producers reach about this share of their full rate. */
const REAL_RATE = 0.75;

/** Seconds in a minute. */
const MINUTE = 60;

/** Building materials each island wants per minute, beside its people. */
const MATERIAL_DEMAND: Partial<Record<GoodId, number>> = {
  planks: 4,
  bricks: 1.5,
  tools: 0.6,
};

/** Muskets an AI that wants troops would have made per minute. */
const ARMS_PER_MINUTE = 0.5;

/** Cannons it would have made per minute once it can use them. */
const CANNONS_PER_MINUTE = 0.25;

/** Buildable tiles an island needs per house, so workshops keep room. */
const AREA_PER_HOUSE = 22;

/** Houses that rise a tier per minute, for the materials it takes. */
const RISES_PER_MINUTE = 0.3;

/** Houses are added while this share of homes is full... */
const FULL_SHARE = 0.75;

/** ...and satisfaction is at least this. */
const HOUSE_MOOD = 0.65;

/** Houses leave at least this many planks for other buildings. */
const HOUSE_PLANKS = 15;

/** ...once an island has this many houses. */
const RESERVE_FROM = 12;

/** Gold a young town (fewer houses than that) keeps back for its basics. */
const START_RESERVE = 100;

/* eslint-disable @typescript-eslint/no-magic-numbers -- counts and loads in tables */
/** The core buildings of every island and how many, in order. */
const CORE: readonly (readonly [BuildingKind, number])[] = [
  ["woodcutter", 2],
  ["sawmill", 1],
  ["fishery", 1],
  ["market", 1],
  ["chapel", 1],
  ["house", 6],
];

/** One warehouse per this many buildings on an island. */
const BUILDINGS_PER_STORE = 14;

/** Scoring a colony: per this many buildable tiles a point... */
const AREA_UNIT = 100;

/** ...per good home lacks this many, clay twice... */
const ADD_WEIGHT = 3;
const CLAY_WEIGHT = 2;

/** ...grapes and grain, which the higher tiers live on, more... */
const NEEDED_WEIGHT = 3;

/** ...and a point off per this many tiles of distance. */
const DISTANCE_UNIT = 30;

/** One public building per this many houses. */
const HOUSES_PER_SERVICE = 18;

/** Shipyards need this much gold at hand. */
const SHIPYARD_GOLD = 3000;

/** Fire station, doctor and scholars from this many houses. */
const CIVIC_HOUSES = 14;

/** A warlike player wants its shipyard early, with this much gold. */
const WARLIKE_YARD_GOLD = 1800;

/** Tiers the ladder looks at: merchants and engineers. */
const MERCHANT_TIER = 3;
const ENGINEER_TIER = 4;

/** Bricks are made from this many houses on, even before workers live there. */
const LADDER_START = 8;

/** From this many houses a town wants more scholars and brickworks. */
const LADDER_TOWN = 24;

/** What a colony is loaded with: good and amount. */
const COLONY_CARGO: readonly (readonly [GoodId, number])[] = [
  ["planks", 30],
  ["tools", 8],
  ["fish", 10],
];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Planks sent to a colony per trip, kept at home and wanted there. */
const ROUTE_PLANKS = 20;
const ROUTE_KEEP_HOME = 30;
const ROUTE_PLANKS_COLONY = 40;

/** Small loads: tools and food. */
const ROUTE_SMALL = 6;

/** A colony sends home goods it holds this many of... */
const ROUTE_EXPORT_FROM = 25;

/** ...at most this many kinds, this many units a trip, keeping a few. */
const ROUTE_EXPORTS = 3;
const ROUTE_EXPORT_AMOUNT = 60;
const ROUTE_EXPORT_KEEP = 10;

/** Goods that always go out to a colony: good, amount, least kept at home, most at the colony. */
const COLONY_SUPPLY: readonly (readonly [GoodId, number, number, number])[] = [
  ["planks", ROUTE_PLANKS, ROUTE_KEEP_HOME, ROUTE_PLANKS_COLONY],
  ["tools", ROUTE_SMALL, ROUTE_SMALL, ROUTE_SMALL * 2],
  ["fish", ROUTE_SMALL * 2, ROUTE_KEEP_HOME, ROUTE_KEEP_HOME],
  ["bricks", ROUTE_SMALL * 2, ROUTE_KEEP_HOME, ROUTE_KEEP_HOME],
];

/** Residents and gold before a clay island is settled when home has no clay. */
const CLAY_SETTLE_AT = 80;
const CLAY_SETTLE_GOLD = 1500;

/** A first town wants an island with this much buildable land... */
const HOME_BUILDABLE = 300;

/** ...a smaller one counts as this many tiles farther away. */
const SMALL_PENALTY = 1000;

/** A colonizing voyage is given up after this long, seconds. */
const COLONY_TIMEOUT = 600;

/** Kontor sites are looked for this far around a ship, tiles. */
const FOUND_SEARCH = 17;

/** Water is looked for this far around a kontor site, tiles. */
const SITE_WATER = 6;

/** A warship that strays farther than this from home returns, tiles. */
const GUARD_RANGE = 25;

/** Least warships that go on the attack together. */
const ATTACK_GROUP = 2;

/** Strength over the enemy's needed to attack. */
const ATTACK_RATIO = 1.2;

/** Opinion below which war is declared: warlike, others. */
const WAR_OPINION_WARLIKE = -25;
const WAR_OPINION = -60;

/** Power over the other needed to declare war, or to demand tribute. */
const WAR_RATIO = 1.3;
const WAR_RATIO_WARLIKE = 1;
const DEMAND_RATIO = 1.5;

/** Chance that an AI takes a crown order it can manage, by character. */
const MISSION_KEEN: Readonly<Record<Personality, number>> = {
  trader: 0.7,
  expansionist: 0.6,
  warlike: 0.4,
};

/** Goods for a delivery are handed over once this many are in store. */
const DELIVER_FROM = 10;

/** Soldiers that go ashore together, at least. */
const LAND_GROUP = 6;

/** An invasion is given up after this long, seconds. */
const INVADE_TIMEOUT = 600;

/** Chance per thought that a stronger player makes a demand. */
const DEMAND_CHANCE = 0.25;

/** Gold and residents that count as one point of power. */
const GOLD_PER_POWER = 2000;
const PEOPLE_PER_POWER = 100;

/** Below this opinion a pact or alliance is ended. */
const CANCEL_OPINION = -20;

/** Called into a war without much anger, an AI seeks peace sooner. */
const CALLED_OPINION = -30;

/** Chance of an incident per partner and thought, and its size. */
const INCIDENT_CHANCE = 0.25;
const INCIDENT_LOW = 4;
const INCIDENT_SPREAD = 8;

/** Gifts: least opinion of a friend and chance per thought. */
const GIFT_OPINION_LOW = 10;
const GIFT_CHANCE = 0.3;

/** A bought good costs this much over its plain value. */
const DEAL_MARKUP = 1.1;

/** A tribute asks this share of the other's gold, at most the cap. */
const TRIBUTE_SHARE = 0.25;
const TRIBUTE_MOST = 600;

/** Peace is sought when this much weaker, or after this long at war. */
const PEACE_RATIO = 0.8;
const PEACE_AFTER = 600;

/** Opinion for a pact and for an alliance, when proposing. */
const PROPOSE_PACT = 30;
const PROPOSE_ALLIANCE = 55;

/** Opinion below the needed one at which a trade agreement is tried. */
const TRADE_SLACK = 5;

/** A trader offers goods it has more than this of. */
const SURPLUS = 50;

/** Units in an offered trade. */
const TRADE_UNITS = 20;

/** Gifts: gold at hand and size. */
const GIFT_GOLD = 3000;
const GIFT_SIZE = 300;

/** Sell orders keep at least this many units. */
const SELL_KEEP = 20;

/** Buy orders fill up to this many units. */
const BUY_UP_TO = 20;

/** How deep a chain is followed when asking whether a good can be made. */
const MAKE_DEPTH = 4;

/** Goods bought even while saving: without them nothing grows. */
const ESSENTIALS: readonly GoodId[] = ["planks", "fish"];

/** Building materials the AI keeps a deeper stock of... */
const MATERIALS: readonly GoodId[] = ["bricks", "tools", "stone", "glass"];

/** ...this many units, once it holds this much gold. */
const MATERIAL_UP_TO = 60;
const MATERIAL_GOLD = 3000;

/** Goods the AI buys when it cannot make them. */
const BUY_GOODS: readonly GoodId[] = [
  "planks",
  "tools",
  "bricks",
  "cloth",
  "fish",
];

/** Raw producers a colony runs for home. */
const EXPORT_KINDS: readonly BuildingKind[] = [
  "claypit",
  "quarry",
  "vineyard",
  "grainFarm",
  "oreMine",
  "tobaccoFarm",
  "sheepFarm",
];

/** A budget for one thought. */
type Budget = { checks: number; paths: number };

/** The producer of each good. */
const PRODUCER: Partial<Record<GoodId, BuildingKind>> = Object.fromEntries(
  BUILDINGS.filter((def) => def.recipe !== null).map((def) => [
    def.recipe?.output,
    def.kind,
  ]),
);

/**
 * Lets every AI player think when its time has come.
 *
 * @param game - the game
 */
export function stepAi(game: Game): void {
  for (const player of game.players) {
    const ai = player.ai;
    if (ai !== null && player.alive) {
      if (game.time >= ai.nextThink) {
        ai.nextThink = game.time + THINK_EVERY;
        think(game, player);
      }
      if (game.time >= ai.nextDiplomacy) {
        ai.nextDiplomacy = game.time + DIPLOMACY_THINK;
        thinkDiplomacy(game, player);
      }
    }
  }
}

/** One thought about the economy, ships and research. */
function think(game: Game, player: Player): void {
  const ai = player.ai;
  const budget: Budget = { checks: CHECK_BUDGET, paths: PATH_BUDGET };
  refreshDerived(game);
  const islands = islandsByAge(game, player.id).filter(
    (id) => kontorOf(game, id) !== null,
  );
  if (ai !== null) {
    if (islands.length === 0) {
      foundFirst(game, player, budget);
    } else {
      money(game, player, islands[0]);
      colonize(game, player, islands, budget);
      tuneRoutes(game, player, islands[0]);
      raise(game, player);
      for (const island of islands) {
        buildOn(game, player, island, island === islands[0], budget);
      }
      ships(game, player, islands);
      troops(game, player, islands);
      takeMissions(game, player, islands);
      choose(game, player);
    }
  }
}

/** Without an island the AI founds one with a ship that carries the means. */
function foundFirst(game: Game, player: Player, budget: Budget): void {
  const cost = BUILDING.kontor.cost;
  const ship = game.ships.find(
    (s) => s.owner === player.id && hasAmounts(s.cargo, cost),
  );
  if (ship !== undefined) {
    const island = nearestFreeIsland(game, ship.x, ship.y, player.id);
    if (island >= 0 && !foundAt(game, player, ship, island, budget)) {
      sailToIsland(game, player, ship, island);
    }
  }
}

/** Tries to set a kontor near a ship on an island; true when done. */
function foundAt(
  game: Game,
  player: Player,
  ship: Ship,
  island: number,
  budget: Budget,
): boolean {
  const n = game.world.n;
  let done = false;
  for (const [dx, dy] of OFFSETS) {
    if (done || budget.checks <= 0 || Math.hypot(dx, dy) > FOUND_SEARCH) {
      continue;
    }
    const x = Math.round(ship.x) + dx;
    const y = Math.round(ship.y) + dy;
    if (
      x >= 0 &&
      y >= 0 &&
      x < n &&
      y < n &&
      game.world.islandOf[y * n + x] === island
    ) {
      budget.checks -= 1;
      const check = checkPlacement(game, player.id, "kontor", x, y, 0, null);
      if (check.issue === null) {
        done = command(game, player, {
          type: "build",
          kind: "kontor",
          x,
          y,
          rot: 0,
        });
        if (done) {
          refreshDerived(game);
          const kontor = kontorOf(game, island) as Building;
          connect(game, player, kontor, budget);
        }
      }
    }
  }
  return done;
}

/**
 * Sends a ship to the water before the kontor site of an island nearest to
 * it, so that it can found there.
 */
function sailToIsland(
  game: Game,
  player: Player,
  ship: Ship,
  island: number,
): void {
  const info = game.world.islands[island];
  const n = game.world.n;
  let site = -1;
  let siteDistance = Infinity;
  for (let y = info.minY; y <= info.maxY; y += 1) {
    for (let x = info.minX; x <= info.maxX; x += 1) {
      const distance = Math.hypot(x - ship.x, y - ship.y);
      if (
        game.world.islandOf[y * n + x] === island &&
        distance < siteDistance
      ) {
        const issue = checkPlacement(
          game,
          player.id,
          "kontor",
          x,
          y,
          0,
          null,
        ).issue;
        if (issue === null || issue === "noShip") {
          site = y * n + x;
          siteDistance = distance;
        }
      }
    }
  }
  let best = -1;
  let bestDistance = Infinity;
  const sx = site % n;
  const sy = Math.floor(site / n);
  for (let y = sy - SITE_WATER; y <= sy + SITE_WATER && site >= 0; y += 1) {
    for (let x = sx - SITE_WATER; x <= sx + SITE_WATER; x += 1) {
      const inside = x >= 0 && y >= 0 && x < n && y < n;
      const distance = Math.hypot(x - sx, y - sy);
      if (
        inside &&
        isSea(game.world.terrain[y * n + x] as Terrain) &&
        distance < bestDistance
      ) {
        best = y * n + x;
        bestDistance = distance;
      }
    }
  }
  if (best >= 0 && ship.path.length === 0) {
    command(game, player, {
      type: "moveShip",
      ship: ship.id,
      x: best % n,
      y: Math.floor(best / n),
    });
  }
}

/** Money trouble: higher taxes and selling; good times: normal taxes. */
function money(game: Game, player: Player, home: number): void {
  const ai = player.ai;
  if (ai !== null) {
    if (player.gold < MONEY_LOW && !ai.thrifty) {
      ai.thrifty = true;
      ai.crises.money += 1;
      command(game, player, { type: "tax", level: 2 });
    } else if (player.gold > MONEY_OK && ai.thrifty) {
      ai.thrifty = false;
      command(game, player, { type: "tax", level: 1 });
    }
    const character = CHARACTERS[ai.personality];
    const capacity = capacityOf(game, home);
    const stock = game.islands[home].stock;
    const wanted = buyList(game, player);
    for (const good of GOOD_IDS) {
      const order = game.islands[home].orders[good];
      const sellLine = Math.max(
        SELL_KEEP,
        Math.floor(capacity * character.sellShare),
      );
      // Building materials are stocked deeper once there is gold: the big
      // buildings of the next tiers need many at once.
      const upTo =
        MATERIALS.includes(good) && player.gold > MATERIAL_GOLD
          ? MATERIAL_UP_TO
          : BUY_UP_TO;
      // Saving or not, planks and fish are always bought when they run out.
      const lacking =
        wanted.includes(good) &&
        stock[good] < upTo &&
        (!ai.thrifty || ESSENTIALS.includes(good));
      const selling =
        stock[good] > sellLine || (ai.thrifty && stock[good] > SELL_KEEP * 2);
      const next = {
        sellAbove:
          selling && !lacking ? (ai.thrifty ? SELL_KEEP * 2 : sellLine) : null,
        buyBelow: lacking ? upTo : null,
      };
      const same =
        (order?.sellAbove ?? null) === next.sellAbove &&
        (order?.buyBelow ?? null) === next.buyBelow;
      if (!same) {
        command(game, player, {
          type: "order",
          island: home,
          good,
          order:
            next.sellAbove === null && next.buyBelow === null ? null : next,
        });
      }
    }
  }
}

/**
 * Goods the AI buys from the free trader at home: the basic ones, and what
 * its people or the next rise want that none of its islands can make.
 */
function buyList(game: Game, player: Player): GoodId[] {
  const tiers = residentsByTier(game, null, player.id);
  const highest = tiers.reduce(
    (top, value, tier) => (value > 0 ? tier : top),
    0,
  );
  const list = new Set<GoodId>(BUY_GOODS);
  const islands = islandsByAge(game, player.id);
  const consider = (good: GoodId) => {
    if (!canMake(game, player, islands, good, 0)) {
      list.add(good);
    }
  };
  for (let tier = 0; tier <= highest; tier += 1) {
    for (const want of TIERS[tier].goods) {
      consider(want.good);
    }
  }
  const next = TIERS[Math.min(TIERS.length - 1, highest + 1)];
  for (const good of Object.keys(next.upgradeCost) as GoodId[]) {
    consider(good);
  }
  // What the services of the next tier are built of.
  for (const service of next.services) {
    for (const good of Object.keys(BUILDING[service].cost) as GoodId[]) {
      if (good !== ("gold" as GoodId)) {
        consider(good);
      }
    }
  }
  // Arms for the troops it wants, and cannons once it can use them.
  for (const good of Object.keys(militaryDemand(game, player)) as GoodId[]) {
    consider(good);
  }
  return [...list];
}

/**
 * The arms an AI wants made per minute: muskets while it wants troops,
 * cannons once it can build ships of the line or artillery.
 *
 * @param game - the game
 * @param player - the AI
 * @returns goods and amounts per minute
 */
function militaryDemand(
  game: Game,
  player: Player,
): Partial<Record<GoodId, number>> {
  const demand: Partial<Record<GoodId, number>> = {};
  if (wantsSoldiers(game, player)) {
    demand.weapons = ARMS_PER_MINUTE;
    if (player.research.done.includes("gunnery")) {
      demand.cannons = CANNONS_PER_MINUTE;
    }
  }
  return demand;
}

/** Whether one of the player's islands can make a good, inputs and all. */
function canMake(
  game: Game,
  player: Player,
  islands: readonly number[],
  good: GoodId,
  depth: number,
): boolean {
  const kind = PRODUCER[good];
  const recipe = kind === undefined ? null : BUILDING[kind].recipe;
  return (
    kind !== undefined &&
    recipe !== null &&
    depth < MAKE_DEPTH &&
    player.unlocked.includes(kind) &&
    islands.some((island) => fitsIsland(game, island, kind)) &&
    recipe.inputs.every((input) =>
      canMake(game, player, islands, input.good, depth + 1),
    )
  );
}

/** Builds the next thing an island needs most. */
function buildOn(
  game: Game,
  player: Player,
  island: number,
  home: boolean,
  budget: Budget,
): void {
  const ai = player.ai;
  if (ai !== null && budget.checks > 0) {
    const kind = nextBuilding(game, player, island, home);
    if (kind !== null) {
      const placed = place(game, player, island, kind, budget);
      // Only a search that ran to its end shows there is no site.
      if (!placed && budget.checks > 0) {
        ai.noSite[siteKey(kind, island)] = game.time + NO_SITE_PAUSE;
        const recipe = BUILDING[kind].recipe;
        if (recipe !== null && BUY_GOODS.includes(recipe.output)) {
          // Cannot make it here: the trader brings it.
          setBuy(game, player, island, recipe.output);
        }
        const def = BUILDING[kind];
        // Houses crowd the town: two make room for a service they lack, or
        // for scholars, the way to the next tiers.
        const victim =
          def.science > 0
            ? lastHouse(game, island)
            : def.category === "public" && def.radius > 0
              ? (uncovered(game, island, kind)?.nearest ?? null)
              : null;
        if (victim !== null) {
          clearHouses(game, player, victim);
          ai.noSite[siteKey(kind, island)] = game.time;
        } else {
          // No room near the stores or the markets: open up new land.
          const opener: BuildingKind = recipe !== null ? "warehouse" : "market";
          if (kind !== opener && player.unlocked.includes(opener)) {
            place(game, player, island, opener, budget);
          }
        }
      }
    }
  }
}

/**
 * The key under which a kind that found no site on an island is noted.
 *
 * @param kind - the building kind
 * @param island - the island id
 * @returns the key
 */
function siteKey(kind: BuildingKind, island: number): string {
  return `${kind}@${island}`;
}

/** Pulls down a house and the house nearest to it, to free a site. */
function clearHouses(game: Game, player: Player, house: Building): void {
  const other = game.buildings
    .filter(
      (b) => b.island === house.island && b.house !== null && b.id !== house.id,
    )
    .sort(
      (a, b) =>
        Math.hypot(a.x - house.x, a.y - house.y) -
        Math.hypot(b.x - house.x, b.y - house.y),
    )[0];
  command(game, player, { type: "demolish", x: house.x, y: house.y });
  if (other !== undefined) {
    command(game, player, { type: "demolish", x: other.x, y: other.y });
  }
  game.dirty = true;
}

/** What to build next on an island, or null. */
function nextBuilding(
  game: Game,
  player: Player,
  island: number,
  home: boolean,
): BuildingKind | null {
  const ai = player.ai;
  const character = CHARACTERS[ai?.personality ?? "trader"];
  const counts = countKinds(game, island);
  const count = (kind: BuildingKind) => counts.get(kind) ?? 0;
  // Saving up for the next colony keeps gold back from all but the basics.
  const saving = wantsColony(game, player)
    ? Math.max(character.reserve, settleGold(game, player))
    : character.reserve;
  // A colony waits for spare gold: home pays the bills.
  const normal = ai?.thrifty
    ? MONEY_LOW
    : character.reserve + (home ? 0 : character.colonyReserve);
  let reserve = normal;
  const can = (kind: BuildingKind) =>
    player.unlocked.includes(kind) &&
    (ai?.noSite[siteKey(kind, island)] ?? 0) < game.time &&
    player.gold >= BUILDING[kind].cost.gold + reserve &&
    hasAmounts(game.islands[island].stock, BUILDING[kind].cost) &&
    (kind !== "house" ||
      houses < RESERVE_FROM ||
      game.islands[island].stock.planks >= HOUSE_PLANKS);
  const houses = count("house");
  const war = game.players.some((other) => atWar(game, player.id, other.id));
  let choice: BuildingKind | null = null;
  const pick = (kind: BuildingKind, when: boolean) => {
    if (choice === null && when && can(kind)) {
      choice = kind;
    }
  };
  // A young town builds its basics with what it has: no gold held back.
  reserve = houses < RESERVE_FROM ? START_RESERVE : normal;
  for (const [kind, least] of CORE) {
    pick(kind, count(kind) < least && usable(game, player, island, kind));
  }
  reserve = normal;
  const ordered = orderedBuilding(game, player);
  if (ordered !== null && home) {
    // A crown order: whoever puts the buildings up first gets the reward.
    pick(ordered, usable(game, player, island, ordered));
  }
  if (ai !== null && ai.thrifty) {
    // Saving: only what feeds the people and the houses that pay taxes.
    for (const food of deficitProducers(game, player, island, true)) {
      pick(food, true);
    }
  }
  pick(
    "warehouse",
    count("warehouse") <
      Math.floor(
        game.buildings.filter((b) => b.island === island).length /
          BUILDINGS_PER_STORE,
      ),
  );
  const tiers = residentsByTier(game, island);
  const highest = tiers.reduce(
    (top, value, tier) => (value > 0 ? tier : top),
    0,
  );
  // Without a cargo ship there is no colony and no route: a yard comes first.
  const shipless = !game.ships.some(
    (ship) => ship.owner === player.id && SHIP[ship.kind].guns === null,
  );
  const yards = game.buildings.filter(
    (b) => b.kind === "shipyard" && game.islands[b.island].owner === player.id,
  ).length;
  pick("shipyard", shipless && yards < 1);
  if (home && ai !== null && !ai.thrifty) {
    // The way up: research and the chains of the next tiers come first.
    reserve = Math.max(reserve, saving);
    for (const [kind, least] of ladder(game, player, island, highest, houses)) {
      pick(kind, count(kind) < least && usable(game, player, island, kind));
    }
    reserve = normal;
  }
  for (const deficit of deficitProducers(game, player, island, false)) {
    pick(deficit, true);
  }
  reserve = Math.max(reserve, saving);
  for (const service of TIERS[Math.min(TIERS.length - 1, highest + 1)]
    .services) {
    pick(service, count(service) < 1 + Math.floor(houses / HOUSES_PER_SERVICE));
  }
  reserve = normal;
  const homes = game.buildings.filter(
    (b) => b.island === island && b.house !== null,
  );
  const full = homes.filter(
    (b) =>
      (b.house?.residents ?? 0) >=
      TIERS[b.house?.tier ?? 0].capacity * FULL_SHARE,
  ).length;
  const mood =
    homes.reduce((sum, b) => sum + (b.house?.satisfaction ?? 0), 0) /
    Math.max(1, homes.length);
  // A colony adds houses only once its people are fed.
  const fed =
    home ||
    game.islands[island].supply.fish >= SHORT ||
    game.islands[island].stock.fish >= BUY_UP_TO;
  // Small islands keep room for their workshops.
  const room = Math.floor(
    game.world.islands[island].buildable / AREA_PER_HOUSE,
  );
  pick(
    "house",
    houses < Math.min(room, character.houses * (home ? 1 : 1 / 2)) &&
      full >= homes.length * FULL_SHARE &&
      mood >= HOUSE_MOOD &&
      fed,
  );
  pick("watchtower", count("watchtower") < (war ? 2 : character.towers));
  pick("battery", war && count("battery") < 1);
  pick("fireStation", houses >= CIVIC_HOUSES && count("fireStation") < 1);
  pick("doctor", houses >= CIVIC_HOUSES && count("doctor") < 1);
  if (!home) {
    // A colony makes what home cannot: its raw goods go home by route, and
    // so does what home lacks but has no room for.
    const homeIsland = islandsByAge(game, player.id)[0];
    for (const kind of deficitProducers(
      game,
      player,
      homeIsland,
      false,
      true,
    )) {
      pick(
        kind,
        (ai?.noSite[siteKey(kind, homeIsland)] ?? 0) >= game.time &&
          count(kind) < COLONY_HELP &&
          usable(game, player, island, kind),
      );
    }
    for (const kind of EXPORT_KINDS) {
      pick(
        kind,
        count(kind) < 2 &&
          fitsIsland(game, island, kind) &&
          !fitsIsland(game, homeIsland, kind),
      );
    }
  }
  if (home) {
    pick(
      "shipyard",
      count("shipyard") < 1 &&
        player.gold >=
          (ai?.personality === "warlike" ? WARLIKE_YARD_GOLD : SHIPYARD_GOLD),
    );
    pick("barracks", count("barracks") < 1 && wantsSoldiers(game, player));
  }
  return choice;
}

/**
 * The buildings that lead a home island up the tiers, with how many of
 * each: bricks and stone for every rise, scholars for research, tools,
 * wine, then the chains research opens (glass, tobacco, instruments,
 * jewellery) and the university.
 */
function ladder(
  game: Game,
  player: Player,
  island: number,
  highest: number,
  houses: number,
): (readonly [BuildingKind, number])[] {
  const character = CHARACTERS[player.ai?.personality ?? "trader"];
  const done = player.research.done;
  const rungs: (readonly [BuildingKind, number])[] = [];
  const add = (when: boolean, ...kinds: [BuildingKind, number][]) => {
    if (when) {
      rungs.push(...kinds);
    }
  };
  const bigTown = houses >= LADDER_TOWN;
  add(
    highest >= 1 || houses >= LADDER_START,
    ["claypit", 1],
    ["brickworks", 1],
  );
  add(highest >= 2, ["scholarHouse", 1], ["quarry", 1]);
  add(
    highest >= 2 && bigTown,
    ["scholarHouse", character.scholars],
    ["claypit", 2],
    ["brickworks", 2],
  );
  add(
    highest >= 2 && game.world.islands[island].deposits.ore > 0,
    ["charcoal", 1],
    ["oreMine", 1],
    ["smelter", 1],
    ["toolmaker", 1],
  );
  add(highest >= 2, ["vineyard", 1], ["winery", 1]);
  add(done.includes("glass") && highest >= 2, ["sandPit", 1], ["charcoal", 1]);
  add(done.includes("glass") && highest >= 2, ["glassworks", 1]);
  add(done.includes("society"), ["university", 1]);
  add(
    done.includes("tobacco") && highest >= MERCHANT_TIER,
    ["tobaccoFarm", 1],
    ["tobacconist", 1],
  );
  add(done.includes("optics") && highest >= ENGINEER_TIER, [
    "instrumentMaker",
    1,
  ]);
  add(
    done.includes("jewelry") && highest >= ENGINEER_TIER,
    ["pearlDiver", 1],
    ["goldsmith", 1],
  );
  return rungs;
}

/**
 * The producers of the goods that fall shortest of demand on an island,
 * the worst first.
 */
function deficitProducers(
  game: Game,
  player: Player,
  island: number,
  foodOnly: boolean,
  anySite = false,
): BuildingKind[] {
  const demand: Partial<Record<GoodId, number>> = {
    ...MATERIAL_DEMAND,
    ...(island === islandsByAge(game, player.id)[0]
      ? militaryDemand(game, player)
      : {}),
  };
  const supply: Partial<Record<GoodId, number>> = {};
  let top = 0;
  for (const building of game.buildings) {
    if (building.island === island) {
      const house = building.house;
      if (house !== null) {
        top = Math.max(top, house.tier);
        for (const want of TIERS[house.tier].goods) {
          demand[want.good] =
            (demand[want.good] ?? 0) + house.residents * want.rate;
        }
      }
      const recipe = BUILDING[building.kind].recipe;
      if (recipe !== null) {
        const perMinute =
          (MINUTE / recipe.seconds) * (building.prod?.site ?? 1) * REAL_RATE;
        supply[recipe.output] =
          (supply[recipe.output] ?? 0) + perMinute * recipe.amount;
        for (const input of recipe.inputs) {
          demand[input.good] =
            (demand[input.good] ?? 0) + perMinute * input.amount;
        }
      }
    }
  }
  // Houses rising into the next tier use up its materials.
  const next = TIERS[Math.min(TIERS.length - 1, top + 1)].upgradeCost;
  for (const [good, amount] of Object.entries(next) as [GoodId, number][]) {
    demand[good] = (demand[good] ?? 0) + amount * RISES_PER_MINUTE;
  }
  const found: { kind: BuildingKind; good: GoodId; ratio: number }[] = [];
  const state = game.islands[island];
  for (const [good, wanted] of Object.entries(demand) as [GoodId, number][]) {
    const kind = PRODUCER[good];
    const missing = wanted * COVER - (supply[good] ?? 0);
    const short = state.supply[good] < SHORT || state.stock[good] < BUY_UP_TO;
    const food = GOOD[good].category === "food";
    const ratio = missing / Math.max(1, wanted);
    if (
      kind !== undefined &&
      missing > SMALL_DEFICIT &&
      short &&
      (!foodOnly || food) &&
      player.unlocked.includes(kind) &&
      (anySite ||
        (player.ai?.noSite[siteKey(kind, island)] ?? 0) < game.time) &&
      usable(game, player, island, kind)
    ) {
      found.push({ kind, good, ratio });
    }
  }
  // Worst first; the order of the goods breaks ties.
  found.sort((a, b) => b.ratio - a.ratio);
  // A chain is built from its start: a bakery waits for its mill and farm.
  const lacking = (good: GoodId) =>
    (supply[good] ?? 0) < (demand[good] ?? 0) && state.stock[good] < BUY_UP_TO;
  for (const entry of found) {
    entry.kind = upstream(game, player, island, entry.kind, lacking, 0);
  }
  const worst = found[0];
  if (
    worst !== undefined &&
    player.ai !== null &&
    state.supply[worst.good] < SHORT
  ) {
    player.ai.crises.shortage += 1;
  }
  return found
    .slice(0, anySite ? found.length : DEFICIT_CHOICES)
    .map((entry) => entry.kind);
}

/**
 * The first missing link of a chain: the producer of an input that falls
 * short and this island could make, else the kind itself.
 */
function upstream(
  game: Game,
  player: Player,
  island: number,
  kind: BuildingKind,
  lacking: (good: GoodId) => boolean,
  depth: number,
): BuildingKind {
  let result = kind;
  for (const input of BUILDING[kind].recipe?.inputs ?? []) {
    const maker = PRODUCER[input.good];
    if (
      result === kind &&
      maker !== undefined &&
      depth < MAKE_DEPTH &&
      lacking(input.good) &&
      player.unlocked.includes(maker) &&
      (player.ai?.noSite[siteKey(maker, island)] ?? 0) < game.time &&
      usable(game, player, island, maker)
    ) {
      result = upstream(game, player, island, maker, lacking, depth + 1);
    }
  }
  return result;
}

/**
 * Whether a producer makes sense on an island: its site needs can be met
 * there and every input can be made on one of the player's islands.
 */
function usable(
  game: Game,
  player: Player,
  island: number,
  kind: BuildingKind,
): boolean {
  const recipe = BUILDING[kind].recipe;
  const islands = islandsByAge(game, player.id);
  return (
    fitsIsland(game, island, kind) &&
    (recipe === null ||
      recipe.inputs.every((input) =>
        canMake(game, player, islands, input.good, 1),
      ))
  );
}

/** Whether an island has what a producer's site needs at all. */
function fitsIsland(game: Game, island: number, kind: BuildingKind): boolean {
  const info = game.world.islands[island];
  return BUILDING[kind].needs.every((need) => {
    let ok = true;
    if (need.type === "fertility") {
      ok = info.fertile[need.crop];
    } else if (need.type === "deposit") {
      const names = ["", "stone", "clay", "ore"] as const;
      ok = info.deposits[names[need.deposit] as "stone" | "clay" | "ore"] > 0;
    } else if (need.type === "forest") {
      ok = info.forest > need.min;
    }
    return ok;
  });
}

/** Counts the buildings of each kind on an island. */
function countKinds(game: Game, island: number): Map<BuildingKind, number> {
  const counts = new Map<BuildingKind, number>();
  for (const building of game.buildings) {
    if (building.island === island) {
      counts.set(building.kind, (counts.get(building.kind) ?? 0) + 1);
    }
  }
  return counts;
}

/** Finds a site for a kind on an island, builds there and joins a road. */
function place(
  game: Game,
  player: Player,
  island: number,
  kind: BuildingKind,
  budget: Budget,
): boolean {
  const anchors = anchorsFor(game, island, kind);
  const n = game.world.n;
  const def = BUILDING[kind];
  const needsRoad = def.recipe !== null || WAREHOUSE_KINDS.includes(kind);
  let placed = false;
  for (const anchor of anchors) {
    for (const [dx, dy] of OFFSETS) {
      const distance = Math.hypot(dx, dy);
      const near = distance <= anchor.radius && distance >= anchor.min;
      if (placed || !near || budget.checks <= 0) {
        continue;
      }
      const x = Math.round(anchor.x + dx - def.w / 2);
      const y = Math.round(anchor.y + dy - def.h / 2);
      const inside = x > 0 && y > 0 && x + def.w < n && y + def.h < n;
      const index = y * n + x;
      // A cheap look first: only free land of this island is checked fully.
      const free =
        inside &&
        game.world.islandOf[index] === island &&
        game.territory[index] === 1 &&
        game.occupancy[index] === 0 &&
        game.roads[index] === NO_ROAD;
      if (free) {
        budget.checks -= 1;
        const check = checkPlacement(game, player.id, kind, x, y, 0, null);
        if (
          check.issue === null &&
          (!needsRoad || freeRing(game, x, y, check.w, check.h))
        ) {
          if (command(game, player, { type: "build", kind, x, y, rot: 0 })) {
            // Only the new footprint matters for the road and further sites.
            const building = game.buildings[game.buildings.length - 1];
            markOccupied(game, building);
            if (needsRoad && !connect(game, player, building, budget)) {
              command(game, player, { type: "demolish", x, y });
            } else {
              placed = true;
            }
          }
        }
      }
    }
  }
  return placed;
}

/** A place to look around: from the least to the most distance. */
type Anchor = { x: number; y: number; min: number; radius: number };

/** New stores and markets keep at least this far from the old ones. */
const SPREAD = 9;

/** ...and are looked for this far out. */
const SPREAD_RADIUS = 20;

/** A service is placed this much inside its reach of the houses. */
const SERVICE_MARGIN = 3;

/** Deposits looked at for a pit or mine, at most... */
const DEPOSIT_ANCHORS = 4;

/** ...this far apart... */
const DEPOSIT_SPACING = 6;

/** ...each searched this far around. */
const DEPOSIT_RADIUS = 4;

/** Where a kind is best looked for on an island. */
function anchorsFor(game: Game, island: number, kind: BuildingKind): Anchor[] {
  const def = BUILDING[kind];
  const stores = game.buildings.filter(
    (b) => b.island === island && WAREHOUSE_KINDS.includes(b.kind),
  );
  const markets = game.buildings.filter(
    (b) => b.island === island && b.kind === "market",
  );
  const info = game.world.islands[island];
  const middle: Anchor = {
    x: info.cx,
    y: info.cy,
    min: 0,
    radius: SEARCH_RADIUS,
  };
  const around = (b: Building, min: number, radius: number): Anchor => ({
    x: b.x + b.w / 2,
    y: b.y + b.h / 2,
    min,
    radius,
  });
  let anchors: Anchor[];
  if (kind === "market") {
    anchors =
      markets.length === 0
        ? [...stores.map((b) => around(b, 0, SEARCH_RADIUS)), middle]
        : [...markets.map((m) => around(m, SPREAD, SPREAD_RADIUS)), middle];
  } else if (kind === "house") {
    anchors = markets.map((m) => around(m, 0, BUILDING.market.radius - 2));
  } else if (def.category === "public" && def.radius > 0) {
    // A service goes where houses still lack it, anywhere in its reach.
    const reach = def.radius - SERVICE_MARGIN;
    const gap = uncovered(game, island, kind);
    anchors = [
      ...(gap === null ? [] : [{ x: gap.x, y: gap.y, min: 0, radius: reach }]),
      ...markets.map((m) => around(m, 0, reach)),
    ];
  } else if (def.science > 0) {
    // Scholars need no houses around: any free corner of the land will do.
    anchors = [
      ...stores.map((b) => around(b, 0, SEARCH_RADIUS)),
      ...markets.map((m) => around(m, 0, SEARCH_RADIUS)),
      middle,
    ];
  } else if (kind === "warehouse") {
    anchors = [
      ...[...stores].reverse().map((b) => around(b, SPREAD, SPREAD_RADIUS)),
      middle,
    ];
  } else {
    anchors = [...stores]
      .reverse()
      .map((b) => around(b, 0, BUILDING[b.kind].radius - 2));
    const deposit = def.needs.find((need) => need.type === "deposit");
    if (deposit?.type === "deposit") {
      // Pits and mines also look right at the deposits of the own land.
      anchors.push(...depositAnchors(game, island, deposit.deposit));
    }
  }
  return anchors;
}

/** The middle of the houses on an island a service does not reach yet, or null. */
function uncovered(
  game: Game,
  island: number,
  kind: BuildingKind,
): { x: number; y: number; nearest: Building } | null {
  const grid = game.coverage[kind];
  const n = game.world.n;
  const houses = game.buildings.filter(
    (b) =>
      b.island === island &&
      b.house !== null &&
      grid?.[Math.floor(b.y + b.h / 2) * n + Math.floor(b.x + b.w / 2)] !== 1,
  );
  let result: { x: number; y: number; nearest: Building } | null = null;
  if (houses.length > 0) {
    const x = houses.reduce((sum, b) => sum + b.x + b.w / 2, 0) / houses.length;
    const y = houses.reduce((sum, b) => sum + b.y + b.h / 2, 0) / houses.length;
    const nearest = houses.reduce((a, b) =>
      Math.hypot(a.x - x, a.y - y) <= Math.hypot(b.x - x, b.y - y) ? a : b,
    );
    result = { x, y, nearest };
  }
  return result;
}

/** The newest house on an island, or null. */
function lastHouse(game: Game, island: number): Building | null {
  const houses = game.buildings.filter(
    (b) => b.island === island && b.house !== null,
  );
  return houses[houses.length - 1] ?? null;
}

/** Deposit tiles of an island inside its territory, a few at most. */
function depositAnchors(game: Game, island: number, deposit: number): Anchor[] {
  const info = game.world.islands[island];
  const n = game.world.n;
  const anchors: Anchor[] = [];
  for (let y = info.minY; y <= info.maxY; y += 1) {
    for (let x = info.minX; x <= info.maxX; x += 1) {
      const index = y * n + x;
      if (
        anchors.length < DEPOSIT_ANCHORS &&
        game.world.deposits[index] === deposit &&
        game.territory[index] === 1 &&
        !anchors.some((a) => Math.hypot(a.x - x, a.y - y) < DEPOSIT_SPACING)
      ) {
        anchors.push({ x, y, min: 0, radius: DEPOSIT_RADIUS });
      }
    }
  }
  return anchors;
}

/** Whether the ring around a footprint is free for roads. */
function freeRing(
  game: Game,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  const n = game.world.n;
  let free = true;
  for (let ty = y - 1; ty <= y + h && free; ty += 1) {
    for (let tx = x - 1; tx <= x + w && free; tx += 1) {
      free =
        tx >= 0 &&
        ty >= 0 &&
        tx < n &&
        ty < n &&
        game.occupancy[ty * n + tx] === 0;
    }
  }
  return free;
}

/** Joins a building to the island's roads; true when it touches one. */
function connect(
  game: Game,
  player: Player,
  building: Building,
  budget: Budget,
): boolean {
  const n = game.world.n;
  const sides: number[] = [];
  let touching = false;
  for (let x = building.x - 1; x <= building.x + building.w; x += 1) {
    for (let y = building.y - 1; y <= building.y + building.h; y += 1) {
      const side =
        (x === building.x - 1 || x === building.x + building.w) !==
        (y === building.y - 1 || y === building.y + building.h);
      if (side && x >= 0 && y >= 0 && x < n && y < n) {
        const index = y * n + x;
        touching = touching || game.roads[index] !== NO_ROAD;
        if (canLayRoad(game, player.id, index)) {
          sides.push(index);
        }
      }
    }
  }
  const info = game.world.islands[building.island];
  const roads: number[] = [];
  for (let y = info.minY; y <= info.maxY && !touching; y += 1) {
    for (let x = info.minX; x <= info.maxX; x += 1) {
      if (game.roads[y * n + x] !== NO_ROAD) {
        roads.push(y * n + x);
      }
    }
  }
  if (!touching && roads.length === 0 && sides.length > 0) {
    // The first road of an island: one tile by the kontor.
    touching = command(game, player, { type: "road", tiles: [sides[0]] });
  } else if (!touching) {
    let best: number[] | null = null;
    for (const start of sides.slice(0, 2)) {
      if (budget.paths > 0) {
        budget.paths -= 1;
        const sx = start % n;
        const sy = Math.floor(start / n);
        const goal = roads.reduce((a, b) =>
          Math.hypot((a % n) - sx, Math.floor(a / n) - sy) <=
          Math.hypot((b % n) - sx, Math.floor(b / n) - sy)
            ? a
            : b,
        );
        const path = planRoad(game, player.id, start, goal);
        if (path !== null && (best === null || path.length < best.length)) {
          best = path;
        }
      }
    }
    if (best !== null) {
      touching = command(game, player, { type: "road", tiles: best });
    }
  }
  return touching;
}

/** With gold to spare, raises a store or a busy producer to its second stage. */
function raise(game: Game, player: Player): void {
  if (player.gold > RICH && player.ai?.thrifty === false) {
    const candidates = game.buildings.filter(
      (b) =>
        b.level === 0 &&
        b.complete &&
        game.islands[b.island].owner === player.id &&
        LEVEL_KINDS.includes(b.kind) &&
        (b.prod === null || b.prod.status === "working") &&
        hasAmounts(game.islands[b.island].stock, LEVEL_COST),
    );
    // Scholars first: research is the way up.
    const candidate =
      candidates.find((b) => BUILDING[b.kind].science > 0) ?? candidates[0];
    if (candidate !== undefined) {
      command(game, player, { type: "levelUp", id: candidate.id });
    }
  }
}

/** Settles a further island when the home island is large enough. */
function colonize(
  game: Game,
  player: Player,
  islands: number[],
  budget: Budget,
): void {
  const ai = player.ai;
  if (ai !== null) {
    const task = ai.task;
    if (task.type === "colonize") {
      const ship = game.ships.find((s) => s.id === task.ship);
      const free = game.islands[task.island].owner < 0;
      if (
        ship === undefined ||
        !free ||
        game.time - task.since > COLONY_TIMEOUT
      ) {
        ai.task = { type: "none" };
        if (ship !== undefined && islands.includes(task.island)) {
          routeColony(game, player, islands[0], task.island, ship);
        }
      } else {
        voyage(game, player, ship, task, islands[0], budget);
      }
    } else if (
      wantsColony(game, player) &&
      player.gold >= settleGold(game, player) &&
      lineBalance(player.ledger.last) >= 0
    ) {
      const ship = freeCargoShip(game, player);
      const kontor = kontorOf(game, islands[0]) as Building;
      const ordered = orderedIsland(game, player);
      const target =
        ship === null
          ? -1
          : ordered >= 0
            ? ordered
            : bestColony(game, player, kontor.x, kontor.y);
      if (ship !== null && target >= 0) {
        ai.task = {
          type: "colonize",
          island: target,
          ship: ship.id,
          stage: "load",
          since: game.time,
        };
      } else if (ship === null) {
        orderShip(
          game,
          player,
          islands[0],
          bestShip(game, player, CHARACTERS[ai.personality].merchants),
        );
      }
    }
  }
}

/** One step of a colonizing voyage: load at home, sail, found. */
function voyage(
  game: Game,
  player: Player,
  ship: Ship,
  task: Extract<NonNullable<Player["ai"]>["task"], { type: "colonize" }>,
  home: number,
  budget: Budget,
): void {
  const kontor = kontorOf(game, home) as Building;
  const n = game.world.n;
  switch (task.stage) {
    case "load":
      if (ship.docked === kontor.id) {
        for (const [good, amount] of COLONY_CARGO) {
          command(game, player, {
            type: "transfer",
            ship: ship.id,
            good,
            amount: amount - (ship.cargo[good] ?? 0),
          });
        }
        task.stage = "sail";
      } else if (ship.path.length === 0) {
        command(game, player, { type: "assign", ship: ship.id, route: null });
        const berth = berthOf(game, kontor);
        command(game, player, {
          type: "moveShip",
          ship: ship.id,
          x: berth % n,
          y: Math.floor(berth / n),
        });
      }
      break;
    case "sail":
      if (!hasAmounts(ship.cargo, BUILDING.kontor.cost)) {
        task.stage = "load";
      } else if (ship.path.length === 0) {
        const info = game.world.islands[task.island];
        if (
          Math.hypot(info.cx - ship.x, info.cy - ship.y) <
          Math.max(info.maxX - info.minX, info.maxY - info.minY) / 2 +
            FOUND_RANGE
        ) {
          task.stage = "found";
        } else {
          sailToIsland(game, player, ship, task.island);
        }
      }
      break;
    default:
      if (foundAt(game, player, ship, task.island, budget)) {
        routeColony(game, player, home, task.island, ship);
        if (player.ai !== null) {
          player.ai.task = { type: "none" };
        }
      } else if (ship.path.length === 0) {
        sailToIsland(game, player, ship, task.island);
        task.stage = "sail";
      }
  }
}

/**
 * Whether the AI is ready for one more island: few enough islands, enough
 * people at home and no money trouble. Without clay of its own it wants a
 * clay island early, for without bricks no town rises.
 */
function wantsColony(game: Game, player: Player): boolean {
  const ai = player.ai;
  const character = CHARACTERS[ai?.personality ?? "trader"];
  const islands = islandsByAge(game, player.id);
  const settleAt = lacksClay(game, islands)
    ? Math.min(character.settleAt, CLAY_SETTLE_AT)
    : character.settleAt;
  // Without wine there are no engineers: one island more for grapes.
  const noGrapes = !islands.some(
    (island) => game.world.islands[island].fertile.grapes,
  );
  const most = character.islands + (noGrapes ? 1 : 0);
  // Home must be a working town first, not only the money of the start.
  const town =
    islands.length > 0 &&
    game.buildings.filter((b) => b.island === islands[0] && b.house !== null)
      .length >= RESERVE_FROM;
  return (
    ai !== null &&
    !ai.thrifty &&
    ai.task.type === "none" &&
    town &&
    islands.length < most &&
    populationOf(game, player.id) >= settleAt * islands.length
  );
}

/** Gold the AI wants at hand before it sets out for a new island. */
function settleGold(game: Game, player: Player): number {
  const character = CHARACTERS[player.ai?.personality ?? "trader"];
  return lacksClay(game, islandsByAge(game, player.id))
    ? Math.min(character.settleGold, CLAY_SETTLE_GOLD)
    : character.settleGold;
}

/** Whether none of these islands has clay. */
function lacksClay(game: Game, islands: readonly number[]): boolean {
  return !islands.some(
    (island) => game.world.islands[island].deposits.clay > 0,
  );
}

/** Joins a colony to home with a route that brings materials and takes its goods. */
function routeColony(
  game: Game,
  player: Player,
  home: number,
  colony: number,
  ship: Ship,
): void {
  const exists = game.routes.some(
    (route) =>
      route.owner === player.id &&
      route.stops.some((stop) => stop.island === colony),
  );
  if (!exists && ownKontor(game, player.id, colony) !== null) {
    const ok = command(game, player, {
      type: "routeCreate",
      name: game.world.islands[colony].name,
      stops: colonyStops(game, player, home, colony),
    });
    const route = game.routes[game.routes.length - 1];
    if (ok && route !== undefined) {
      command(game, player, { type: "assign", ship: ship.id, route: route.id });
    }
  }
}

/**
 * Keeps the colony routes in step with the stores: what a colony has in
 * plenty goes home, materials and food go out. Changed only when needed.
 */
function tuneRoutes(game: Game, player: Player, home: number): void {
  for (const route of game.routes) {
    const colony = route.stops[1]?.island ?? -1;
    if (
      route.owner === player.id &&
      route.stops.length === 2 &&
      route.stops[0].island === home &&
      colony >= 0 &&
      game.islands[colony].owner === player.id
    ) {
      const stops = colonyStops(game, player, home, colony);
      if (JSON.stringify(stops) !== JSON.stringify(route.stops)) {
        command(game, player, {
          type: "routeUpdate",
          route: route.id,
          stops,
          active: true,
        });
      }
    }
  }
}

/** The two stops of a colony route, from the stocks as they are now. */
function colonyStops(
  game: Game,
  player: Player,
  home: number,
  colony: number,
): RouteStop[] {
  const there = game.islands[colony].stock;
  // Bricks go out only from a home with clay; else they come home.
  const supply = COLONY_SUPPLY.filter(
    ([good]) => good !== "bricks" || !lacksClay(game, [home]),
  );
  const supplied = supply.map(([good]) => good);
  // What the colony has in plenty and is not sent there anyway, most first.
  const exports = GOOD_IDS.filter(
    (good) =>
      !supplied.includes(good) &&
      (there[good] >= ROUTE_EXPORT_FROM ||
        exportedRaw(game, home, colony, good)),
  )
    .sort((a, b) => there[b] - there[a])
    .slice(0, ROUTE_EXPORTS);
  return [
    {
      island: home,
      actions: [
        ...supply.map(([good, amount, keep]) => ({
          good,
          mode: "load" as const,
          amount,
          limit: keep,
          priority: good === "planks" ? 2 : 1,
        })),
        ...exports.map((good) => ({
          good,
          mode: "unload" as const,
          amount: ROUTE_EXPORT_AMOUNT,
          limit: capacityOf(game, home),
          priority: 1,
        })),
      ],
    },
    {
      island: colony,
      actions: [
        ...supply.map(([good, amount, , most]) => ({
          good,
          mode: "unload" as const,
          amount,
          limit: most,
          priority: good === "planks" ? 2 : 1,
        })),
        ...exports.map((good) => ({
          good,
          mode: "load" as const,
          amount: ROUTE_EXPORT_AMOUNT,
          limit: ROUTE_EXPORT_KEEP,
          priority: 1,
        })),
      ],
    },
  ];
}

/** Whether a colony makes a raw good home cannot make. */
function exportedRaw(
  game: Game,
  home: number,
  colony: number,
  good: GoodId,
): boolean {
  const kind = PRODUCER[good];
  return (
    kind !== undefined &&
    BUILDING[kind].recipe?.inputs.length === 0 &&
    fitsIsland(game, colony, kind) &&
    !fitsIsland(game, home, kind)
  );
}

/** A cargo ship not busy on a route, or null. */
function freeCargoShip(game: Game, player: Player): Ship | null {
  return (
    game.ships.find(
      (ship) =>
        ship.owner === player.id &&
        SHIP[ship.kind].guns === null &&
        ship.order.type !== "route" &&
        roomFor(ship, "planks") > 0,
    ) ?? null
  );
}

/** The free island that suits best: big, near, and with what home lacks. */
function bestColony(game: Game, player: Player, x: number, y: number): number {
  let best = -1;
  let bestScore = -Infinity;
  const own = islandsByAge(game, player.id).map((id) => game.world.islands[id]);
  const lacks = (test: (info: IslandInfo) => boolean) => !own.some(test);
  // What none of its islands has counts; what the next tiers need counts more.
  const weight = {
    grapes: lacks((i) => i.fertile.grapes) ? NEEDED_WEIGHT : 0,
    tobacco: lacks((i) => i.fertile.tobacco) ? 1 : 0,
    grain: lacks((i) => i.fertile.grain) ? NEEDED_WEIGHT : 0,
    ore: lacks((i) => i.deposits.ore > 0) ? 1 : 0,
    clay: lacks((i) => i.deposits.clay > 0) ? CLAY_WEIGHT : 0,
    stone: lacks((i) => i.deposits.stone > 0) ? 1 : 0,
  };
  for (const state of game.islands) {
    const info = game.world.islands[state.id];
    if (state.owner < 0 && info.buildable > 0) {
      const adds =
        (info.fertile.grapes ? weight.grapes : 0) +
        (info.fertile.tobacco ? weight.tobacco : 0) +
        (info.fertile.grain ? weight.grain : 0) +
        (info.deposits.ore > 0 ? weight.ore : 0) +
        (info.deposits.clay > 0 ? weight.clay : 0) +
        (info.deposits.stone > 0 ? weight.stone : 0);
      const score =
        info.buildable / AREA_UNIT +
        adds * ADD_WEIGHT -
        Math.hypot(info.cx - x, info.cy - y) / DISTANCE_UNIT +
        nextRandom(game);
      if (score > bestScore) {
        best = state.id;
        bestScore = score;
      }
    }
  }
  return best;
}

/**
 * The free island to found the first town on: the nearest shore of one
 * large enough for a town, or else of any free island; -1 when none.
 */
function nearestFreeIsland(
  game: Game,
  x: number,
  y: number,
  player: number,
): number {
  let best = -1;
  let bestScore = Infinity;
  for (const state of game.islands) {
    const info = game.world.islands[state.id];
    // Distance to the island's outline, not its middle.
    const dx = Math.max(info.minX - x, 0, x - info.maxX);
    const dy = Math.max(info.minY - y, 0, y - info.maxY);
    const small = info.buildable < HOME_BUILDABLE ? SMALL_PENALTY : 0;
    const score = Math.hypot(dx, dy) + small;
    if (
      state.owner < 0 &&
      info.buildable > 0 &&
      score < bestScore &&
      player >= 0
    ) {
      best = state.id;
      bestScore = score;
    }
  }
  return best;
}

/**
 * The ship an AI orders next of a list, the best first: the first that is
 * open to it and whose price it has in gold and in the stores of its home;
 * else the last of the list.
 */
function bestShip(
  game: Game,
  player: Player,
  kinds: readonly ShipKind[],
): ShipKind {
  const home = islandsByAge(game, player.id)[0];
  const stock = home === undefined ? null : game.islands[home].stock;
  const reserve = CHARACTERS[player.ai?.personality ?? "trader"].reserve;
  return (
    kinds.find(
      (kind) =>
        shipLocked(game, player, kind) === null &&
        player.gold >= SHIP[kind].cost.gold + reserve &&
        stock !== null &&
        hasAmounts(stock, SHIP[kind].cost),
    ) ?? kinds[kinds.length - 1]
  );
}

/**
 * The unit an AI trains next: of the open and affordable kinds of its mix
 * the one it has least of for its weight; null when none is affordable.
 */
function nextUnit(
  game: Game,
  player: Player,
  barracks: Building,
): UnitKind | null {
  const character = CHARACTERS[player.ai?.personality ?? "trader"];
  const stock = game.islands[barracks.island].stock;
  let best: UnitKind | null = null;
  let bestScore = Infinity;
  for (const [kind, weight] of character.army) {
    const def = UNIT[kind];
    const have =
      game.soldiers.filter((s) => s.owner === player.id && s.kind === kind)
        .length +
      (barracks.drill?.queue.filter((queued) => queued === kind).length ?? 0);
    const score = have / weight;
    if (
      score < bestScore &&
      unitLocked(game, player, kind) === null &&
      player.gold > def.cost.gold + character.reserve &&
      hasAmounts(stock, def.cost)
    ) {
      best = kind;
      bestScore = score;
    }
  }
  return best;
}

/** Orders a ship at the home shipyard if there is one and it is free. */
function orderShip(
  game: Game,
  player: Player,
  home: number,
  kind: ShipKind,
): void {
  // The home yard first, else any yard of the player's.
  const yard = game.buildings
    .filter(
      (b) =>
        b.kind === "shipyard" &&
        game.islands[b.island].owner === player.id &&
        b.complete &&
        b.yard?.building === null,
    )
    .sort(
      (a, b) => (a.island === home ? 0 : 1) - (b.island === home ? 0 : 1),
    )[0];
  if (
    yard !== undefined &&
    player.gold >=
      SHIP[kind].cost.gold +
        CHARACTERS[player.ai?.personality ?? "trader"].reserve
  ) {
    command(game, player, { type: "buildShip", yard: yard.id, kind });
  }
}

/** Builds warships as the character wants and sends them out in war. */
function ships(game: Game, player: Player, islands: number[]): void {
  const ai = player.ai;
  if (ai !== null) {
    const character = CHARACTERS[ai.personality];
    const enemies = game.players.filter(
      (other) => other.alive && atWar(game, player.id, other.id),
    );
    const fleet = game.ships.filter(
      (s) => s.owner === player.id && SHIP[s.kind].role === "war",
    );
    const wanted =
      enemies.length > 0 ? character.warshipsAtWar : character.warships;
    if (
      enemies.length > 0 &&
      game.tick % Math.round(DIPLOMACY_THINK / THINK_EVERY) === 0
    ) {
      ai.crises.war += 1;
    }
    if (fleet.length < wanted && !ai.thrifty) {
      orderShip(
        game,
        player,
        islands[0],
        bestShip(game, player, character.navy),
      );
    }
    const home = kontorOf(game, islands[0]) as Building;
    // One conquest per enemy and war goal: then the guns wait for peace.
    const enemy = enemies
      .filter(
        (other) =>
          relationOf(game, player.id, other.id)?.memory.some(
            (m) => m.reason === "conquest",
          ) !== true,
      )
      .map((other) => ({ other, strength: strengthOf(game, other.id) }))
      .sort((a, b) => a.strength - b.strength)[0];
    const attack =
      enemy !== undefined &&
      fleet.length >= ATTACK_GROUP &&
      (ai.personality === "warlike" ||
        strengthOf(game, player.id) > enemy.strength * ATTACK_RATIO * 2) &&
      strengthOf(game, player.id) > enemy.strength * ATTACK_RATIO;
    const target = attack
      ? nearestIslandOf(game, enemy.other.id, home.x, home.y)
      : -1;
    for (const ship of fleet) {
      // A ship near an enemy fights instead of heading off.
      const engaged =
        nearestEnemyShip(game, player.id, ship.x, ship.y, CHASE_RANGE) !== null;
      const idle =
        ship.order.type === "idle" && ship.path.length === 0 && !engaged;
      if (engaged && ship.order.type === "move") {
        ship.order = { type: "idle" };
        ship.path = [];
      }
      if (idle && target >= 0) {
        attackIsland(game, ship, target);
      } else if (
        idle &&
        Math.hypot(ship.x - home.x, ship.y - home.y) > GUARD_RANGE
      ) {
        const berth = berthOf(game, home);
        const n = game.world.n;
        command(game, player, {
          type: "moveShip",
          ship: ship.id,
          x: berth % n,
          y: Math.floor(berth / n),
        });
      }
    }
  }
}

/** Whether the AI wants soldiers: in a war, or by a warlike nature. */
function wantsSoldiers(game: Game, player: Player): boolean {
  const ai = player.ai;
  const war = game.players.some((other) => atWar(game, player.id, other.id));
  return (
    ai !== null &&
    !game.settings.peaceful &&
    (war || CHARACTERS[ai.personality].soldiers > 0)
  );
}

/**
 * Land troops: trains soldiers as its character wants, and in a war ships
 * a group of them to the enemy island its fleet is after, to storm the
 * kontor there.
 */
function troops(game: Game, player: Player, islands: number[]): void {
  const ai = player.ai;
  if (ai !== null) {
    const character = CHARACTERS[ai.personality];
    const enemies = game.players.filter(
      (other) => other.alive && atWar(game, player.id, other.id),
    );
    const wanted =
      enemies.length > 0 ? character.soldiersAtWar : character.soldiers;
    const mine = game.soldiers.filter((s) => s.owner === player.id).length;
    const barracks = game.buildings.find(
      (b) =>
        b.drill !== null &&
        b.complete &&
        game.islands[b.island].owner === player.id,
    );
    const unit =
      barracks?.drill != null &&
      mine + barracks.drill.queue.length < wanted &&
      !ai.thrifty
        ? nextUnit(game, player, barracks)
        : null;
    if (barracks !== undefined && unit !== null) {
      command(game, player, {
        type: "train",
        barracks: barracks.id,
        unit,
        count: 1,
      });
    }
    invade(game, player, islands, enemies);
  }
}

/** One step of bringing soldiers to an enemy island: board, then land. */
function invade(
  game: Game,
  player: Player,
  islands: number[],
  enemies: Player[],
): void {
  const ai = player.ai;
  const home = kontorOf(game, islands[0]);
  if (ai !== null && home !== null) {
    const task = ai.task;
    if (task.type === "invade") {
      const ship = game.ships.find((s) => s.id === task.ship);
      const target = game.islands[task.island].owner;
      const over =
        ship === undefined ||
        !atWar(game, player.id, target) ||
        game.time - task.since > INVADE_TIMEOUT;
      if (over) {
        ai.task = { type: "none" };
        if (ship !== undefined && aboard(game, ship) > 0) {
          // The war is over or the plan failed: back home with them.
          command(game, player, {
            type: "land",
            ship: ship.id,
            island: islands[0],
          });
        }
      } else if (task.stage === "board") {
        if (ship.docked === home.id) {
          command(game, player, { type: "embark", ship: ship.id });
          if (
            command(game, player, {
              type: "land",
              ship: ship.id,
              island: task.island,
            })
          ) {
            task.stage = "sail";
          }
        } else if (ship.path.length === 0) {
          command(game, player, { type: "assign", ship: ship.id, route: null });
          const berth = berthOf(game, home);
          const n = game.world.n;
          command(game, player, {
            type: "moveShip",
            ship: ship.id,
            x: berth % n,
            y: Math.floor(berth / n),
          });
        }
      } else if (ship.order.type !== "land") {
        // Ashore: the soldiers march on by themselves.
        ai.task = { type: "none" };
      }
    } else if (task.type === "none" && enemies.length > 0) {
      const ready = game.soldiers.filter(
        (s) =>
          s.owner === player.id &&
          s.ship < 0 &&
          s.island === islands[0] &&
          s.target < 0,
      ).length;
      const weakest = enemies
        .filter(
          (other) =>
            relationOf(game, player.id, other.id)?.memory.some(
              (m) => m.reason === "conquest",
            ) !== true,
        )
        .sort((a, b) => strengthOf(game, a.id) - strengthOf(game, b.id))[0];
      const target =
        weakest === undefined
          ? -1
          : nearestIslandOf(game, weakest.id, home.x, home.y);
      const ship = troopShip(game, player);
      if (ready >= LAND_GROUP && target >= 0 && ship !== null) {
        ai.task = {
          type: "invade",
          island: target,
          ship: ship.id,
          stage: "board",
          since: game.time,
        };
      }
    }
  }
}

/** A ship that can carry soldiers and is not needed elsewhere, or null. */
function troopShip(game: Game, player: Player): Ship | null {
  const ships = game.ships.filter(
    (ship) =>
      ship.owner === player.id &&
      SHIP[ship.kind].troops >= LAND_GROUP &&
      ship.order.type !== "land",
  );
  // A free cargo ship first, else one that runs a route.
  return ships.find((ship) => ship.order.type !== "route") ?? ships[0] ?? null;
}

/** The island of a player nearest a point, or -1. */
function nearestIslandOf(
  game: Game,
  player: number,
  x: number,
  y: number,
): number {
  let best = -1;
  let bestDistance = Infinity;
  for (const id of islandsOf(game, player)) {
    const info = game.world.islands[id];
    const distance = Math.hypot(info.cx - x, info.cy - y);
    if (distance < bestDistance && kontorOf(game, id) !== null) {
      best = id;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Crown orders: the AI looks once at every new one and takes it when it
 * can manage it and its character wants to, then works towards it -
 * delivers goods, puts up the buildings or settles the island. Whoever
 * fulfils an order first gets the reward.
 */
function takeMissions(game: Game, player: Player, islands: number[]): void {
  const ai = player.ai;
  if (ai !== null) {
    for (const mission of game.missions) {
      const contract = contractOf(mission);
      const fresh =
        mission.giver === CROWN &&
        mission.contract === mission.id &&
        (mission.state === "offered" || mission.state === "active") &&
        RACE_KINDS.includes(mission.kind) &&
        !ai.missions.includes(contract);
      if (fresh) {
        ai.missions.push(contract);
        const keen =
          nextRandom(game) < MISSION_KEEN[ai.personality] &&
          canManage(game, player, islands, mission);
        if (keen) {
          command(game, player, { type: "missionAccept", mission: mission.id });
        }
      }
    }
    // Forget orders long gone, so the list stays short.
    ai.missions = ai.missions.filter((id) =>
      game.missions.some((m) => contractOf(m) === id),
    );
    for (const mission of game.missions) {
      if (
        mission.taker === player.id &&
        mission.state === "active" &&
        mission.kind === "delivery" &&
        mission.good !== null
      ) {
        const good = mission.good;
        const from = islands.reduce((a, b) =>
          game.islands[a].stock[good] >= game.islands[b].stock[good] ? a : b,
        );
        if (game.islands[from].stock[good] >= DELIVER_FROM) {
          command(game, player, {
            type: "missionDeliver",
            mission: mission.id,
            island: from,
          });
        }
      }
    }
  }
}

/** Whether the AI can hope to fulfil a crown order. */
function canManage(
  game: Game,
  player: Player,
  islands: number[],
  mission: Mission,
): boolean {
  const owns = (kind: BuildingKind) =>
    game.buildings.some(
      (b) => b.kind === kind && game.islands[b.island].owner === player.id,
    );
  let result: boolean;
  switch (mission.kind) {
    case "delivery":
    case "production": {
      const kind = mission.good === null ? undefined : PRODUCER[mission.good];
      result = kind !== undefined && owns(kind);
      break;
    }
    case "build": {
      const kind = mission.building;
      result =
        kind !== null &&
        player.unlocked.includes(kind) &&
        player.gold >=
          BUILDING[kind].cost.gold * mission.goal +
            CHARACTERS[player.ai?.personality ?? "trader"].reserve;
      break;
    }
    case "settle":
      result =
        islands.length <
          CHARACTERS[player.ai?.personality ?? "trader"].islands &&
        freeCargoShip(game, player) !== null &&
        player.gold >= settleGold(game, player);
      break;
    default:
      result = true;
  }
  return result;
}

/** The kind an AI must still put up for a building order, or null. */
function orderedBuilding(game: Game, player: Player): BuildingKind | null {
  const mission = game.missions.find(
    (m) =>
      m.taker === player.id &&
      m.state === "active" &&
      m.kind === "build" &&
      m.building !== null,
  );
  return mission?.building ?? null;
}

/** The island a settling order asks the AI to found on, or -1. */
function orderedIsland(game: Game, player: Player): number {
  const mission = game.missions.find(
    (m) =>
      m.taker === player.id &&
      m.state === "active" &&
      m.kind === "settle" &&
      game.islands[m.island].owner < 0,
  );
  return mission?.island ?? -1;
}

/** Picks the next field of research by character. */
function choose(game: Game, player: Player): void {
  const ai = player.ai;
  if (ai !== null && player.research.current === null) {
    const open = openFields(player);
    const next = CHARACTERS[ai.personality].research.find((id) =>
      open.includes(id),
    );
    if (next !== undefined) {
      command(game, player, { type: "research", research: next });
    }
  }
}

/** Sets a buy order for a good at an island. */
function setBuy(
  game: Game,
  player: Player,
  island: number,
  good: GoodId,
): void {
  const order = game.islands[island].orders[good];
  if (order?.buyBelow !== BUY_UP_TO) {
    command(game, player, {
      type: "order",
      island,
      good,
      order: { sellAbove: order?.sellAbove ?? null, buyBelow: BUY_UP_TO },
    });
  }
}

/**
 * One thought about every other player: war and peace, treaties and their
 * end, demands, gifts, deals of goods - and the small incidents between
 * neighbours that make relations move. At most one step per partner.
 */
function thinkDiplomacy(game: Game, player: Player): void {
  const ai = player.ai;
  if (ai !== null) {
    const mine = powerOf(game, player.id);
    let toHuman = false;
    let traded = false;
    for (const other of game.players) {
      const relation = relationOf(game, player.id, other.id);
      if (other.id === player.id || !other.alive || relation === null) {
        continue;
      }
      incident(game, player, other.id);
      const opinion = opinionOf(game, player.id, other.id);
      const theirs = powerOf(game, other.id);
      const say = (action: Parameters<typeof propose>[3]) => {
        if (other.id === HUMAN) {
          if (!toHuman) {
            offerToHuman(game, player.id, action);
            toHuman = true;
          }
        } else {
          propose(game, player.id, other.id, action, -1);
        }
      };
      const warLine =
        ai.personality === "warlike" ? WAR_OPINION_WARLIKE : WAR_OPINION;
      const warRatio =
        ai.personality === "warlike" ? WAR_RATIO_WARLIKE : WAR_RATIO;
      const deal = traded ? null : goodsDeal(game, player, other);
      const gift = giftFor(game, player, opinion, mine, theirs);
      if (relation.war) {
        // Weaker, weary or never truly angry: make peace.
        const length = game.time - relation.since;
        const won = relation.memory.some((m) => m.reason === "conquest");
        if (
          mine < theirs * PEACE_RATIO ||
          length > PEACE_AFTER ||
          (won && length > PEACE_AFTER / 2) ||
          (opinion > CALLED_OPINION && length > PEACE_AFTER / 2)
        ) {
          say({ type: "peace" });
        }
      } else if (
        !game.settings.peaceful &&
        !relation.pact &&
        opinion < warLine &&
        mine > theirs * warRatio
      ) {
        say({ type: "war" });
      } else if (
        (relation.pact || relation.alliance) &&
        opinion < CANCEL_OPINION
      ) {
        say({
          type: "cancel",
          treaty: relation.alliance ? "alliance" : "pact",
        });
      } else if (
        ai.personality !== "trader" &&
        opinion < 0 &&
        mine > theirs * DEMAND_RATIO &&
        nextRandom(game) < DEMAND_CHANCE
      ) {
        const gold = Math.min(
          TRIBUTE_MOST,
          Math.floor(other.gold * TRIBUTE_SHARE),
        );
        if (gold > 0) {
          say({ type: "demand", take: { gold, good: null, amount: 0 } });
        }
      } else if (
        !relation.trade &&
        opinion >= TRADE_OPINION[ai.personality] - TRADE_SLACK
      ) {
        say({ type: "propose", treaty: "trade" });
      } else if (
        relation.trade &&
        !relation.pact &&
        opinion >= PROPOSE_PACT &&
        (ai.personality !== "warlike" || opinion >= PROPOSE_ALLIANCE)
      ) {
        say({ type: "propose", treaty: "pact" });
      } else if (
        relation.pact &&
        !relation.alliance &&
        opinion >= PROPOSE_ALLIANCE
      ) {
        say({ type: "propose", treaty: "alliance" });
      } else if (deal !== null) {
        traded = true;
        say(deal);
      } else if (gift !== null) {
        say(gift);
      }
    }
  }
}

/**
 * Fighting power for diplomacy: guns and soldiers, and a little for gold
 * and people, who can be turned into guns.
 */
function powerOf(game: Game, player: number): number {
  const owner = game.players[player];
  return (
    strengthOf(game, player) +
    (owner === undefined
      ? 0
      : owner.gold / GOLD_PER_POWER +
        populationOf(game, player) / PEOPLE_PER_POWER)
  );
}

/**
 * Now and then something happens between two players: a quarrel at the
 * border between neighbours and rivals, a friendly exchange between
 * partners. Drawn from the game's random state.
 */
function incident(game: Game, player: Player, other: number): void {
  const roll = nextRandom(game);
  const relation = relationOf(game, player.id, other);
  if (relation !== null && roll < INCIDENT_CHANCE) {
    const tension = opinionReasons(game, player.id, other).some(
      (m) => m.reason === "border" || m.reason === "rivalry",
    );
    const warlike = player.ai?.personality === "warlike";
    const size = INCIDENT_LOW + nextRandom(game) * INCIDENT_SPREAD;
    if (tension || (warlike && roll < INCIDENT_CHANCE / 2)) {
      remember(game, player.id, other, "incident", -size);
    } else if (!relation.war) {
      remember(game, player.id, other, "incident", size / 2);
    }
  }
}

/**
 * A gift that wins a partner over: to a friend close to the next treaty,
 * or to a much stronger, angry neighbour to calm it. Null for none.
 */
function giftFor(
  game: Game,
  player: Player,
  opinion: number,
  mine: number,
  theirs: number,
): Parameters<typeof propose>[3] | null {
  const personality = player.ai?.personality ?? "trader";
  const friendly =
    personality !== "warlike" &&
    opinion >= GIFT_OPINION_LOW &&
    opinion < PROPOSE_ALLIANCE &&
    player.gold > GIFT_GOLD;
  const afraid =
    opinion < 0 && theirs > mine * DEMAND_RATIO && player.gold > GIFT_SIZE * 2;
  const chance = nextRandom(game) < GIFT_CHANCE;
  return (friendly || afraid) && chance
    ? { type: "gift", give: { gold: GIFT_SIZE, good: null, amount: 0 } }
    : null;
}

/**
 * A deal of goods with another AI: buy what home lacks from a partner who
 * has plenty, or - as a trader - sell a surplus the partner lacks. Null for
 * none.
 */
function goodsDeal(
  game: Game,
  player: Player,
  other: Player,
): Parameters<typeof propose>[3] | null {
  const home = islandsByAge(game, player.id)[0];
  const theirs = islandsByAge(game, other.id)[0];
  let deal: Parameters<typeof propose>[3] | null = null;
  if (home !== undefined && theirs !== undefined && other.ai !== null) {
    const stock = game.islands[home].stock;
    const supply = game.islands[home].supply;
    const plenty = game.islands[theirs].stock;
    const wanted = GOOD_IDS.find(
      (good) =>
        supply[good] > 0 &&
        supply[good] < SHORT &&
        stock[good] < BUY_UP_TO &&
        plenty[good] >= SURPLUS + TRADE_UNITS,
    );
    const price = (good: GoodId) =>
      Math.round(GOOD[good].value * TRADE_UNITS * DEAL_MARKUP);
    if (wanted !== undefined && player.gold > price(wanted) * 2) {
      deal = {
        type: "trade",
        give: { gold: price(wanted), good: null, amount: 0 },
        take: { gold: 0, good: wanted, amount: TRADE_UNITS },
      };
    } else if (player.ai?.personality === "trader") {
      deal = tradeOffer(game, player, theirs);
    }
  }
  return deal;
}

/** A trader offers a surplus good the partner lacks, for gold at its value. */
function tradeOffer(
  game: Game,
  player: Player,
  partnerHome: number,
): Parameters<typeof propose>[3] | null {
  const home = islandsByAge(game, player.id)[0];
  let offer: Parameters<typeof propose>[3] | null = null;
  if (home !== undefined) {
    const stock = game.islands[home].stock;
    const need = game.islands[partnerHome].supply;
    const surplus = GOOD_IDS.filter(
      (good) => stock[good] > SURPLUS && need[good] > 0 && need[good] < SHORT,
    ).sort((a, b) => stock[b] - stock[a])[0];
    if (surplus !== undefined) {
      offer = {
        type: "trade",
        give: { gold: 0, good: surplus, amount: TRADE_UNITS },
        take: {
          gold: Math.round(GOOD[surplus].value * TRADE_UNITS),
          good: null,
          amount: 0,
        },
      };
    }
  }
  return offer;
}

/** Runs a command as this player; true when it went through. */
function command(game: Game, player: Player, body: Command): boolean {
  return applyCommand(game, { ...body, player: player.id }).ok;
}

/** Offsets in a square, nearest first. */
function makeOffsets(radius: number): [number, number][] {
  const list: [number, number][] = [];
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      list.push([dx, dy]);
    }
  }
  return list.sort((a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]));
}
