/**
 * What the world does by itself: day and night, blizzards, random events,
 * the expedition, traders and the loot on the snow.
 *
 * @module
 */
import { LOG } from "@/games/frost-fortress/i18n/texts";
import { spawnEnemy } from "./combat";
import { canAfford, pay, receive, RESOURCE_IDS } from "./economy";
import { GATES, hqCentre, isBuildable, TILE, terrainAt } from "./map";
import { buildRadius, DAY_LENGTH, darkness } from "./modifiers";
import { pushMessage } from "./log";
import { nextRandom, randomInt, randomPick, randomRange } from "./random";
import type { ActiveEffect, Cost, Game, ResourceId } from "./types";

/** No random events before this many seconds. */
const EVENTS_FROM = 150;

/** Seconds between random events. */
const EVENT_MIN = 70;
const EVENT_MAX = 130;

/** Durations of the timed events. */
const EFFECT_TIME: Readonly<Record<ActiveEffect["kind"], number>> = {
  coldSnap: 45,
  aurora: 60,
  blackout: 30,
};

/** Calm between blizzards and their length, seconds. */
const CALM_MIN = 100;
const CALM_MAX = 220;
const STORM_MIN = 40;
const STORM_MAX = 80;

/** No blizzard before this wave. */
const STORMS_FROM = 2;

/** Chance that a calm ends in a blizzard. */
const STORM_CHANCE = 0.6;

/** How quickly a blizzard builds up and dies down, per second. */
const STORM_RAMP = 0.08;

/** Seconds loot lies before it is carried in by itself (inside the base). */
const AUTO_COLLECT = 6;

/** Seconds before uncollected loot and crates are gone. */
const LOOT_LIFE = 45;
const CRATE_LIFE = 75;

/** A click picks loot up within this many world units. */
const PICK_REACH = 26;
const CRATE_REACH = 40;

/** Places tried for a crate before it lands next to the base. */
const CRATE_TRIES = 20;

/** Half a tile. */
const HALF = 0.5;

/** The expedition: price, length and chance of coming back empty. */
export const EXPEDITION_COST: Cost = { food: 40, fuel: 15 };
export const EXPEDITION_TIME = 50;
const EXPEDITION_FAIL = 0.15;

/** Seconds a trader waits for an answer. */
const OFFER_TIME = 30;

/** Raiders in a surprise raid: base and per wave. */
const RAID_BASE = 3;
const RAID_PER_WAVE = 0.6;

/* eslint-disable @typescript-eslint/no-magic-numbers -- loot ranges */

/** Ranges of what an expedition finds, before the wave bonus. */
const EXPEDITION_LOOT: Readonly<Record<ResourceId, readonly [number, number]>> =
  {
    wood: [60, 140],
    iron: [40, 100],
    stone: [40, 100],
    energy: [0, 40],
    food: [20, 60],
    fuel: [10, 40],
  };

/** What a supply crate holds. */
const CRATE_LOOT: Readonly<Record<ResourceId, readonly [number, number]>> = {
  wood: [60, 120],
  iron: [50, 100],
  stone: [40, 90],
  energy: [20, 60],
  food: [30, 70],
  fuel: [15, 40],
};

/** A crate lands this far from the headquarters, in tiles. */
const CRATE_NEAR = 6;
const CRATE_FAR = 20;

/** An ore vein brings this much. */
const ORE_VEIN: Cost = { iron: 120, stone: 80 };

/** Survivors bring this much. */
const SURVIVORS: Cost = { food: 80, wood: 60 };

/** Trades: what is given, how much per unit of what is got. */
const TRADE_SIZE = [80, 160] as const;
const TRADE_RATE = [0.6, 0.9] as const;

/** Growth of loot per wave. */
const WAVE_GROWTH = 0.08;

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** The random events there are. */
type Happening =
  | "supplyDrop"
  | "coldSnap"
  | "oreVein"
  | "trader"
  | "raid"
  | "aurora"
  | "blackout"
  | "survivors";

/**
 * Advances the clock and the blizzard.
 *
 * @param game - the game, changed
 * @param dt - seconds
 */
export function updateWeather(game: Game, dt: number): void {
  const weather = game.weather;
  const wasDark = darkness(game) >= 1;
  weather.clock = (weather.clock + dt) % DAY_LENGTH;
  if (!wasDark && darkness(game) >= 1) {
    pushMessage(game, LOG.nightFalls);
  }
  weather.stormLeft -= dt;
  if (weather.stormLeft <= 0) {
    if (weather.stormGoal === 1) {
      weather.stormGoal = 0;
      weather.stormLeft = randomRange(game, CALM_MIN, CALM_MAX);
      pushMessage(game, LOG.stormEnd);
    } else if (
      game.wave.number >= STORMS_FROM &&
      nextRandom(game) < STORM_CHANCE
    ) {
      weather.stormGoal = 1;
      weather.stormLeft = randomRange(game, STORM_MIN, STORM_MAX);
      pushMessage(game, LOG.stormStart, "bad");
    } else {
      weather.stormLeft = randomRange(game, CALM_MIN, CALM_MAX);
    }
  }
  const step = STORM_RAMP * dt;
  weather.storm = Math.min(
    1,
    Math.max(
      0,
      weather.storm + Math.sign(weather.stormGoal - weather.storm) * step,
    ),
  );
}

/**
 * Runs the timed effects, the trader, the expedition and the next event.
 *
 * @param game - the game, changed
 * @param dt - seconds
 */
export function updateHappenings(game: Game, dt: number): void {
  for (const effect of game.effects) {
    effect.left -= dt;
  }
  game.effects = game.effects.filter((effect) => effect.left > 0);
  if (game.offer !== null) {
    game.offer.left -= dt;
    if (game.offer.left <= 0) {
      game.offer = null;
    }
  }
  if (game.expedition > 0) {
    game.expedition -= dt;
    if (game.expedition <= 0) {
      game.expedition = 0;
      expeditionReturns(game);
    }
  }
  if (game.autoExplore && game.expedition <= 0) {
    // Waits for the price if it cannot be paid yet.
    startExpedition(game);
  }
  if (game.time >= EVENTS_FROM) {
    game.eventIn -= dt;
    if (game.eventIn <= 0) {
      game.eventIn = randomRange(game, EVENT_MIN, EVENT_MAX);
      happen(game, pickHappening(game));
    }
  }
  updateDrops(game, dt);
}

/**
 * Sends the scouts out.
 *
 * @param game - the game, changed
 * @returns true if they left
 */
export function startExpedition(game: Game): boolean {
  const ok =
    game.expedition <= 0 && canAfford(game.res, EXPEDITION_COST) && !game.over;
  if (ok) {
    pay(game.res, EXPEDITION_COST);
    game.expedition = EXPEDITION_TIME;
  }
  return ok;
}

/**
 * Switches the automatic expeditions on or off.
 *
 * @param game - the game, changed
 * @returns true (always switched)
 */
export function toggleAutoExplore(game: Game): boolean {
  game.autoExplore = !game.autoExplore;
  if (game.autoExplore) {
    startExpedition(game);
  }
  return true;
}

/**
 * Answers the trader.
 *
 * @param game - the game, changed
 * @param accept - true to trade
 * @returns true if goods changed hands
 */
export function answerOffer(game: Game, accept: boolean): boolean {
  const offer = game.offer;
  const give: Cost = offer === null ? {} : { [offer.give]: offer.giveAmount };
  const ok = offer !== null && accept && canAfford(game.res, give);
  if (ok) {
    pay(game.res, give);
    receive(game, { [offer.get]: offer.getAmount });
    pushMessage(game, LOG.traded, "good");
    game.events.push({ type: "collect" });
  }
  if (offer !== null && (ok || !accept)) {
    game.offer = null;
  }
  return ok;
}

/**
 * Picks up loot or a crate under a click.
 *
 * @param game - the game, changed
 * @param x - the click, world units
 * @param y - the click, world units
 * @returns true if something was picked up
 */
export function collectAt(game: Game, x: number, y: number): boolean {
  const drop = game.drops.find(
    (entry) =>
      Math.hypot(entry.x - x, entry.y - y) <=
      (entry.crate ? CRATE_REACH : PICK_REACH),
  );
  if (drop !== undefined) {
    collect(game, drop.id);
  }
  return drop !== undefined;
}

/** Loot ages; inside the base it is carried in by itself. */
function updateDrops(game: Game, dt: number): void {
  const centre = hqCentre();
  const reach = buildRadius(game) * TILE;
  const due: number[] = [];
  for (const drop of game.drops) {
    drop.age += dt;
    const home =
      Math.hypot(
        drop.x - centre.col * TILE + TILE / 2,
        drop.y - centre.row * TILE + TILE / 2,
      ) <= reach;
    if (!drop.crate && home && drop.age >= AUTO_COLLECT) {
      due.push(drop.id);
    }
  }
  for (const id of due) {
    collect(game, id);
  }
  game.drops = game.drops.filter(
    (drop) => drop.age < (drop.crate ? CRATE_LIFE : LOOT_LIFE),
  );
}

/** Takes one drop into the stock. */
function collect(game: Game, id: number): void {
  const drop = game.drops.find((entry) => entry.id === id);
  if (drop !== undefined) {
    game.stats.collected += receive(game, drop.loot);
    game.drops = game.drops.filter((entry) => entry !== drop);
    game.events.push({ type: "loot", x: drop.x, y: drop.y });
    game.events.push({ type: "collect", x: drop.x, y: drop.y });
  }
}

/** Which event comes, of those that make sense now. */
function pickHappening(game: Game): Happening {
  const options: Happening[] = [
    "supplyDrop",
    "coldSnap",
    "oreVein",
    "trader",
    "survivors",
  ];
  if (!game.wave.active && game.wave.number >= 2 && !game.freeBuild) {
    options.push("raid");
  }
  if (game.structures.some((entry) => entry.kind === "lab" && entry.built)) {
    options.push("aurora");
  }
  if (
    game.structures.some((entry) => entry.kind === "generator" && entry.built)
  ) {
    options.push("blackout");
  }
  return randomPick(game, options);
}

/** Lets an event happen. */
function happen(game: Game, what: Happening): void {
  switch (what) {
    case "supplyDrop":
      dropCrate(game);
      pushMessage(game, LOG.supplyDrop, "good");
      break;
    case "coldSnap":
    case "aurora":
    case "blackout":
      game.effects.push({ kind: what, left: EFFECT_TIME[what] });
      pushMessage(game, LOG[what], what === "aurora" ? "good" : "bad");
      break;
    case "oreVein":
      receive(game, ORE_VEIN);
      pushMessage(game, LOG.oreVein, "good");
      break;
    case "survivors":
      receive(game, SURVIVORS);
      pushMessage(game, LOG.survivors, "good");
      break;
    case "trader":
      makeOffer(game);
      pushMessage(game, LOG.trader);
      break;
    case "raid":
      raid(game);
      pushMessage(game, LOG.raid, "bad");
      break;
  }
  game.events.push({ type: "eventNews" });
}

/** A crate on the snow somewhere near the base. */
function dropCrate(game: Game): void {
  const centre = hqCentre();
  let col = centre.col;
  let row = centre.row + CRATE_NEAR;
  for (let attempt = 0; attempt < CRATE_TRIES; attempt += 1) {
    const angle = nextRandom(game) * Math.PI * 2;
    const far = randomRange(game, CRATE_NEAR, CRATE_FAR);
    const c = Math.round(centre.col + Math.cos(angle) * far);
    const r = Math.round(centre.row + Math.sin(angle) * far);
    if (isBuildable(terrainAt(game.seed, c, r))) {
      col = c;
      row = r;
      break;
    }
  }
  const loot: Partial<Record<ResourceId, number>> = {};
  const growth = 1 + WAVE_GROWTH * game.wave.number;
  for (const id of RESOURCE_IDS) {
    loot[id] = Math.round(
      randomInt(game, CRATE_LOOT[id][0], CRATE_LOOT[id][1]) * growth,
    );
  }
  game.drops.push({
    id: game.nextId,
    x: col * TILE + TILE / 2,
    y: row * TILE + TILE / 2,
    loot,
    age: 0,
    crate: true,
  });
  game.nextId += 1;
}

/** A trader offers what is plentiful for what is scarce. */
function makeOffer(game: Game): void {
  const tradable: ResourceId[] = ["wood", "iron", "stone", "food", "fuel"];
  const sorted = [...tradable].sort((a, b) => game.res[b] - game.res[a]);
  const give = sorted[0];
  const get = sorted[sorted.length - 1 - Math.floor(nextRandom(game) * 2)];
  const giveAmount = randomInt(game, TRADE_SIZE[0], TRADE_SIZE[1]);
  game.offer = {
    give,
    giveAmount,
    get,
    getAmount: Math.round(
      giveAmount * randomRange(game, TRADE_RATE[0], TRADE_RATE[1]),
    ),
    left: OFFER_TIME,
  };
}

/** A small band of raiders from a random gate. */
function raid(game: Game): void {
  const gate = randomPick(game, GATES);
  const count = Math.round(RAID_BASE + RAID_PER_WAVE * game.wave.number);
  for (let index = 0; index < count; index += 1) {
    spawnEnemy(
      game,
      "raider",
      (gate.col + HALF + randomRange(game, -1, 1)) * TILE,
      (gate.row + HALF + randomRange(game, -1, 1)) * TILE,
    );
  }
}

/** The scouts come back - mostly with something. */
function expeditionReturns(game: Game): void {
  if (nextRandom(game) < EXPEDITION_FAIL) {
    pushMessage(game, LOG.expeditionLost, "bad");
  } else {
    const growth = 1 + WAVE_GROWTH * game.wave.number;
    const loot: Partial<Record<ResourceId, number>> = {};
    for (const id of RESOURCE_IDS) {
      loot[id] = Math.round(
        randomInt(game, EXPEDITION_LOOT[id][0], EXPEDITION_LOOT[id][1]) *
          growth,
      );
    }
    game.stats.collected += receive(game, loot);
    pushMessage(game, LOG.expeditionBack, "good");
    game.events.push({ type: "collect" });
  }
}
