/**
 * The QuestManager: missions offered to the human by the crown and by the
 * AI players - deliveries, settling, production and trade targets, economic
 * goals, treaties, rescuing castaways and building orders - with goals,
 * progress, rewards, time limits, difficulty and conditions.
 *
 * @module
 * @remarks
 * Fulfilling a mission pays gold and goods and raises reputation and the
 * relation with the giver; letting it fail or run out costs some of both.
 */
import { BUILDING, BUILDINGS } from "./buildings-data";
import { changeReputation, relationOf, remember } from "./diplomacy";
import { earn } from "./economy";
import { GOOD } from "./goods";
import { HUMAN, islandsOf, ownerOf, playerById } from "./players";
import { populationOf } from "./population";
import { nextRandom, randomInt, randomPick } from "./random";
import { TICK } from "./time";
import { addStock } from "./warehouse";
import type {
  Amounts,
  BuildingKind,
  Game,
  GoodId,
  Mission,
  MissionKind,
  Player,
} from "./types";

/** Seconds between two missions offered. */
export const MISSION_EVERY_MIN = 150;
export const MISSION_EVERY_MAX = 240;

/** The first mission comes this late, seconds. */
export const FIRST_MISSION = 120;

/** Most missions waiting for an answer, and most running at once. */
export const MOST_OFFERED = 3;
export const MOST_ACTIVE = 3;

/** An offer stands this long, seconds. */
export const OFFER_SECONDS = 300;

/** Seconds between two progress checks. */
const CHECK_EVERY = 1;

/** Steps per check. */
const CHECK_STEPS = Math.round(CHECK_EVERY / TICK);

/** A ship this close to the castaways takes them aboard, tiles. */
export const RESCUE_RANGE = 3;

/** Finished missions kept for the list. */
const KEEP_ENDED = 12;

/** The giver id of the crown. */
export const CROWN = -1;

/** Gold per difficulty step for the reward. */
const REWARD_GOLD = 600;

/** Relation and reputation per difficulty step. */
const REWARD_RELATION = 10;
const REWARD_REPUTATION = 3;

/** Failing costs this share of what fulfilling would have brought. */
const FAIL_SHARE = 0.5;

/** Seconds per difficulty step to fulfil a mission. */
const TIME_PER_STEP = 360;

/** Goods asked for in deliveries, with their base amount. */
const DELIVERY_BASE = 20;

/** Production goals: base units. */
const PRODUCTION_BASE = 25;

/** Units to sell to the trader, per difficulty. */
const TRADE_BASE = 40;

/** Residents to reach on top of the current count, per difficulty. */
const RESIDENTS_STEP = 60;

/** Gold to hold on top of the current treasury, per difficulty. */
const GOLD_STEP = 2000;

/** Buildings to put up, per difficulty. */
const BUILD_STEP = 2;

/** Sea tiles from land a rescue needs, at least. */
const RESCUE_OFFSHORE = 4;

/** Tries to find open sea for castaways. */
const RESCUE_TRIES = 60;

/** Every mission kind, in the order they are drawn from. */
const KINDS: readonly MissionKind[] = [
  "delivery",
  "settle",
  "production",
  "trade",
  "economy",
  "diplomacy",
  "rescue",
  "build",
];

/** Kinds of crown order other players may race the taker for. */
export const RACE_KINDS: readonly MissionKind[] = [
  "delivery",
  "production",
  "trade",
  "economy",
  "build",
  "settle",
];

/** Kinds asked for in building orders. */
const BUILD_KINDS: readonly BuildingKind[] = [
  "house",
  "fishery",
  "woodcutter",
  "warehouse",
  "chapel",
  "watchtower",
  "fireStation",
];

/**
 * One mission round: maybe a new offer, progress, success and failure.
 *
 * @param game - the game
 */
export function stepMissions(game: Game): void {
  if (game.tick % CHECK_STEPS === 0) {
    if (game.time >= game.nextMission) {
      game.nextMission =
        game.time + randomInt(game, MISSION_EVERY_MIN, MISSION_EVERY_MAX);
      offerMission(game);
    }
    for (const mission of game.missions) {
      check(game, mission);
    }
    const ended = game.missions.filter(
      (m) => m.state !== "offered" && m.state !== "active",
    );
    if (ended.length > KEEP_ENDED * game.players.length) {
      game.missions = game.missions.filter((m) => m !== ended[0]);
    }
  }
}

/**
 * Takes a mission on. A crown order offered to someone else can be taken
 * too: the player then races the others for it, on a copy of their own.
 *
 * @param game - the game
 * @param player - who takes it
 * @param id - the mission
 * @returns null when taken, else why not
 */
export function acceptMission(
  game: Game,
  player: number,
  id: number,
): string | null {
  const mission = game.missions.find((m) => m.id === id);
  const active = game.missions.filter(
    (m) => m.state === "active" && m.taker === player,
  ).length;
  let reason: string | null = null;
  if (mission !== undefined && mission.taker !== player) {
    reason = joinRace(game, player, mission, active);
  } else if (mission === undefined || mission.state !== "offered") {
    reason = "missing";
  } else if (active >= MOST_ACTIVE) {
    reason = "tooManyMissions";
  } else {
    mission.state = "active";
    mission.deadline = game.time + mission.duration;
    mission.base = mission.kind === "economy" ? 0 : counter(game, mission);
    mission.progress = 0;
    game.events.push({ type: "mission", mission: id, state: "active" });
  }
  return reason;
}

/**
 * Turns an offer down, or gives up a running mission (that counts as failed).
 *
 * @param game - the game
 * @param player - who
 * @param id - the mission
 * @returns null when done, else why not
 */
export function declineMission(
  game: Game,
  player: number,
  id: number,
): string | null {
  const mission = game.missions.find((m) => m.id === id);
  let reason: string | null = null;
  if (mission === undefined || mission.taker !== player) {
    reason = "missing";
  } else if (mission.state === "offered") {
    mission.state = "expired";
    mission.endedAt = game.time;
  } else if (mission.state === "active") {
    end(game, mission, "failed");
  } else {
    reason = "missing";
  }
  return reason;
}

/**
 * Hands goods over for a delivery mission from one of the player's islands.
 *
 * @param game - the game
 * @param player - who delivers
 * @param id - the mission
 * @param island - the island the goods come from
 * @returns null when something was handed over, else why not
 */
export function deliver(
  game: Game,
  player: number,
  id: number,
  island: number,
): string | null {
  const mission = game.missions.find((m) => m.id === id);
  const state = game.islands[island];
  let reason: string | null = null;
  if (
    mission?.kind !== "delivery" ||
    mission.state !== "active" ||
    mission.good === null ||
    mission.taker !== player
  ) {
    reason = "missing";
  } else if (state === undefined || state.owner !== player) {
    reason = "notOwned";
  } else {
    const amount = Math.floor(
      Math.min(state.stock[mission.good], mission.goal - mission.progress),
    );
    if (amount <= 0) {
      reason = "materials";
    } else {
      state.stock[mission.good] -= amount;
      mission.progress += amount;
    }
  }
  return reason;
}

/**
 * The copies of the same crown order that other players race for.
 *
 * @param game - the game
 * @param mission - one of them
 * @returns the others, running or ended
 */
export function rivalsOf(game: Game, mission: Mission): Mission[] {
  const contract = contractOf(mission);
  return game.missions.filter(
    (m) => m !== mission && contractOf(m) === contract,
  );
}

/**
 * The crown order a mission belongs to.
 *
 * @param mission - the mission
 * @returns the id of its first offer
 */
export function contractOf(mission: Mission): number {
  return mission.contract ?? mission.id;
}

/** A player takes on a crown order offered to someone else, on a copy. */
function joinRace(
  game: Game,
  player: number,
  original: Mission,
  active: number,
): string | null {
  const racer = playerById(game, player);
  const contract = contractOf(original);
  const open = original.state === "offered" || original.state === "active";
  let reason: string | null = null;
  if (
    racer === null ||
    original.giver !== CROWN ||
    !open ||
    !RACE_KINDS.includes(original.kind) ||
    game.missions.some((m) => m.taker === player && contractOf(m) === contract)
  ) {
    reason = "missing";
  } else if (active >= MOST_ACTIVE) {
    reason = "tooManyMissions";
  } else {
    const id = game.nextId;
    game.nextId += 1;
    // An economic goal is measured from the racer's own standing.
    const goal =
      original.kind !== "economy"
        ? original.goal
        : original.metric === "residents"
          ? populationOf(game, player) + RESIDENTS_STEP * original.difficulty
          : Math.max(0, Math.round(racer.gold)) +
            GOLD_STEP * original.difficulty;
    const copy: Mission = {
      ...original,
      id,
      taker: player,
      state: "active",
      deadline: game.time + original.duration,
      goal,
      progress: 0,
      base: 0,
      carrier: -1,
      endedAt: 0,
      contract,
      wonBy: -1,
    };
    copy.base = copy.kind === "economy" ? 0 : counter(game, copy);
    game.missions.push(copy);
    game.events.push({ type: "mission", mission: id, state: "active" });
  }
  return reason;
}

/** Draws a new mission for the human, if there is room for one. */
function offerMission(game: Game): void {
  const taker = playerById(game, HUMAN);
  const offered = game.missions.filter(
    (m) => m.state === "offered" && m.taker === HUMAN,
  ).length;
  if (taker !== null && taker.alive && offered < MOST_OFFERED) {
    const kinds = KINDS.filter((kind) => possible(game, taker, kind));
    if (kinds.length > 0) {
      const kind = randomPick(game, kinds);
      game.missions.push(makeMission(game, taker, kind));
      game.events.push({
        type: "mission",
        mission: game.missions[game.missions.length - 1].id,
        state: "offered",
      });
    }
  }
}

/** Whether a kind of mission makes sense for the player now. */
function possible(game: Game, taker: Player, kind: MissionKind): boolean {
  const owned = islandsOf(game, taker.id).length > 0;
  let result: boolean;
  switch (kind) {
    case "settle":
      result = owned && freeIslands(game).length > 0;
      break;
    case "diplomacy":
      result = rivals(game).some((rival) => tradeWanted(game, taker, rival.id));
      break;
    case "rescue":
      result = game.ships.some((ship) => ship.owner === taker.id);
      break;
    case "production":
      result = producibleGoods(taker).length > 0;
      break;
    default:
      result = owned;
  }
  return result;
}

/** Builds one mission of a kind, scaled by a drawn difficulty. */
function makeMission(game: Game, taker: Player, kind: MissionKind): Mission {
  const difficulty = randomInt(game, 1, MOST_ACTIVE);
  const friendly = rivals(game).filter(
    (rival) => relationOf(game, taker.id, rival.id)?.war === false,
  );
  // Half the missions come from a rival, the rest from the crown.
  const giver =
    friendly.length > 0 && nextRandom(game) < 1 / 2
      ? randomPick(game, friendly).id
      : -1;
  let good: GoodId | null = null;
  let building: BuildingKind | null = null;
  let island = -1;
  let partner = -1;
  let metric: Mission["metric"] = null;
  let goal = 1;
  let x = 0;
  let y = 0;
  let minTier = 0;
  switch (kind) {
    case "delivery": {
      const goods = deliverableGoods(taker);
      good = randomPick(game, goods);
      goal = DELIVERY_BASE * difficulty;
      break;
    }
    case "settle":
      island = randomPick(game, freeIslands(game));
      break;
    case "production": {
      good = randomPick(game, producibleGoods(taker));
      goal = PRODUCTION_BASE * difficulty;
      break;
    }
    case "trade":
      goal = TRADE_BASE * difficulty;
      break;
    case "economy":
      metric = nextRandom(game) < 1 / 2 ? "residents" : "gold";
      goal =
        metric === "residents"
          ? populationOf(game, taker.id) + RESIDENTS_STEP * difficulty
          : Math.max(0, Math.round(taker.gold)) + GOLD_STEP * difficulty;
      break;
    case "diplomacy": {
      const candidates = rivals(game).filter((rival) =>
        tradeWanted(game, taker, rival.id),
      );
      partner = randomPick(game, candidates).id;
      break;
    }
    case "rescue": {
      const spot = openSea(game);
      x = spot.x;
      y = spot.y;
      break;
    }
    default: {
      const kinds = BUILD_KINDS.filter((k) => taker.unlocked.includes(k));
      building = randomPick(game, kinds.length > 0 ? kinds : ["house"]);
      goal = BUILD_STEP * difficulty;
      minTier = BUILDING[building].unlock?.tier ?? 0;
    }
  }
  const id = game.nextId;
  game.nextId += 1;
  const gold = REWARD_GOLD * difficulty;
  const bonus: Amounts = {};
  if (difficulty > 1) {
    bonus.tools = difficulty * BUILD_STEP;
  }
  return {
    id,
    kind,
    giver,
    taker: taker.id,
    state: "offered",
    difficulty,
    offeredAt: game.time,
    offerUntil: game.time + OFFER_SECONDS,
    duration: TIME_PER_STEP * (difficulty + 1),
    deadline: 0,
    good,
    building,
    island,
    partner,
    metric,
    x,
    y,
    goal,
    progress: 0,
    base: 0,
    carrier: -1,
    reward: {
      gold,
      goods: bonus,
      relation: REWARD_RELATION * difficulty,
      reputation: REWARD_REPUTATION * difficulty,
    },
    minTier,
    endedAt: 0,
    contract: id,
    wonBy: -1,
  };
}

/** Updates one mission: offers run out, goals are met, time runs out. */
function check(game: Game, mission: Mission): void {
  if (mission.state === "offered" && game.time > mission.offerUntil) {
    mission.state = "expired";
    mission.endedAt = game.time;
  } else if (mission.state === "active") {
    if (mission.kind !== "delivery") {
      mission.progress = Math.max(
        mission.progress,
        Math.min(mission.goal, counter(game, mission) - mission.base),
      );
    }
    if (mission.progress >= mission.goal) {
      end(game, mission, "done");
    } else if (game.time > mission.deadline) {
      end(game, mission, "failed");
    } else if (
      mission.kind === "settle" &&
      game.islands[mission.island].owner >= 0 &&
      game.islands[mission.island].owner !== mission.taker
    ) {
      // Somebody else was faster: the order is lost, without penalty.
      mission.state = "lost";
      mission.endedAt = game.time;
      mission.wonBy = game.islands[mission.island].owner;
      game.events.push({ type: "mission", mission: mission.id, state: "lost" });
    }
  }
}

/**
 * The number a mission's goal is measured by, right now.
 *
 * @param game - the game
 * @param mission - the mission
 * @returns the counter
 */
export function counter(game: Game, mission: Mission): number {
  const taker = mission.taker;
  const player = playerById(game, taker);
  let value = 0;
  switch (mission.kind) {
    case "settle":
      value = game.islands[mission.island].owner === taker ? 1 : 0;
      break;
    case "production":
      value = game.buildings
        .filter(
          (b) =>
            ownerOf(game, b) === taker &&
            BUILDING[b.kind].recipe?.output === mission.good,
        )
        .reduce((sum, b) => sum + (b.prod?.made ?? 0), 0);
      break;
    case "trade":
      value = player?.stats.sold ?? 0;
      break;
    case "economy":
      // A level to reach, measured as it is.
      value =
        mission.metric === "residents"
          ? populationOf(game, taker)
          : (player?.gold ?? 0);
      break;
    case "diplomacy":
      value = relationOf(game, taker, mission.partner)?.trade === true ? 1 : 0;
      break;
    case "rescue":
      value = rescue(game, mission);
      break;
    case "build":
      value = game.buildings.filter(
        (b) =>
          b.kind === mission.building &&
          b.complete &&
          ownerOf(game, b) === taker,
      ).length;
      break;
    default:
      value = mission.progress;
  }
  return value;
}

/** Progress of a rescue: 0 drifting, 0 aboard, 1 brought home. */
function rescue(game: Game, mission: Mission): number {
  let value = 0;
  if (mission.state === "active") {
    if (mission.carrier < 0) {
      const ship = game.ships.find(
        (s) =>
          s.owner === mission.taker &&
          Math.hypot(s.x - mission.x, s.y - mission.y) <= RESCUE_RANGE,
      );
      if (ship !== undefined) {
        mission.carrier = ship.id;
      }
    } else {
      const ship = game.ships.find((s) => s.id === mission.carrier);
      const port = game.buildings.find((b) => b.id === ship?.docked);
      if (ship === undefined) {
        mission.carrier = -1;
      } else if (port !== undefined && ownerOf(game, port) === mission.taker) {
        value = 1;
      }
    }
  }
  return value;
}

/** Closes a mission and settles reward or penalty. */
function end(game: Game, mission: Mission, state: "done" | "failed"): void {
  const taker = playerById(game, mission.taker);
  mission.state = state;
  mission.endedAt = game.time;
  if (state === "done") {
    mission.wonBy = mission.taker;
    // Whoever else raced for the same order has lost it, without penalty.
    for (const rival of rivalsOf(game, mission)) {
      if (rival.state === "offered" || rival.state === "active") {
        rival.state = "lost";
        rival.endedAt = game.time;
        rival.wonBy = mission.taker;
        game.events.push({ type: "mission", mission: rival.id, state: "lost" });
      }
    }
  }
  if (taker !== null) {
    if (state === "done") {
      earn(taker, mission.reward.gold, "rewards");
      const home = islandsOf(game, taker.id)[0];
      if (home !== undefined) {
        for (const [good, amount] of Object.entries(mission.reward.goods) as [
          GoodId,
          number,
        ][]) {
          addStock(game, home, good, amount);
        }
      }
      changeReputation(taker, "mission", mission.reward.reputation);
      remember(
        game,
        taker.id,
        mission.giver,
        "mission",
        mission.reward.relation,
      );
      taker.stats.missions += 1;
    } else {
      changeReputation(
        taker,
        "failedMission",
        -mission.reward.reputation * FAIL_SHARE,
      );
      remember(
        game,
        taker.id,
        mission.giver,
        "failedMission",
        -mission.reward.relation * FAIL_SHARE,
      );
    }
  }
  game.events.push({ type: "mission", mission: mission.id, state });
}

/**
 * Whether a trade agreement with a rival is still worth a mission: none
 * yet, and no such mission waiting or running.
 */
function tradeWanted(game: Game, taker: Player, rival: number): boolean {
  return (
    relationOf(game, taker.id, rival)?.trade === false &&
    !game.missions.some(
      (m) =>
        m.taker === taker.id &&
        m.kind === "diplomacy" &&
        m.partner === rival &&
        (m.state === "offered" || m.state === "active"),
    )
  );
}

/** Islands nobody owns. */
function freeIslands(game: Game): number[] {
  return game.islands.filter((i) => i.owner < 0).map((i) => i.id);
}

/** The AI players still in the game. */
function rivals(game: Game): Player[] {
  return game.players.filter((p) => p.ai !== null && p.alive);
}

/** Goods the player's buildings can make now. */
function producibleGoods(taker: Player): GoodId[] {
  const goods = BUILDINGS.filter(
    (def) => def.recipe !== null && taker.unlocked.includes(def.kind),
  ).map((def) => def.recipe?.output as GoodId);
  return [...new Set(goods)];
}

/** Goods worth asking for: what the player makes, else simple materials. */
function deliverableGoods(taker: Player): GoodId[] {
  const made = producibleGoods(taker).filter(
    (good) => GOOD[good].category !== "raw",
  );
  return made.length > 0 ? made : ["planks", "fish"];
}

/** A spot of open sea, away from land, for castaways. */
function openSea(game: Game): { x: number; y: number } {
  const world = game.world;
  const n = world.n;
  let spot = { x: world.startShip.x, y: world.startShip.y };
  let found = false;
  for (let i = 0; i < RESCUE_TRIES && !found; i += 1) {
    const x = randomInt(game, RESCUE_OFFSHORE, n - 1 - RESCUE_OFFSHORE);
    const y = randomInt(game, RESCUE_OFFSHORE, n - 1 - RESCUE_OFFSHORE);
    let open = true;
    for (let dy = -RESCUE_OFFSHORE; dy <= RESCUE_OFFSHORE && open; dy += 1) {
      for (let dx = -RESCUE_OFFSHORE; dx <= RESCUE_OFFSHORE && open; dx += 1) {
        open = world.islandOf[(y + dy) * n + x + dx] < 0;
      }
    }
    if (open) {
      spot = { x: x + 1 / 2, y: y + 1 / 2 };
      found = true;
    }
  }
  return spot;
}
