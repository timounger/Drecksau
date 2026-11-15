/**
 * The natural disasters: flood, drought, blizzard, locusts and tsunami.
 * Each is announced first, strikes, rages a while and ends; each has a real
 * effect on the economy and a real protection - dikes, pump stations,
 * irrigation, breakwaters, fuel in store and other islands.
 *
 * @module
 * @remarks
 * Every roll comes from the game's random state, so a loaded game sees the
 * same disasters. The zones that can flood or be hit by a wave come from
 * the terrain alone and are computed once per world. No disaster comes in
 * the first twenty minutes or to the human during the guided start; after
 * one an island and its owner are spared a while, and each island bears at
 * most one disaster at a time.
 */
import { BUILDING } from "./buildings-data";
import {
  AI_PROTECTION_MOST,
  BLIZZARD_LAND,
  BLIZZARD_PAVED,
  BLIZZARD_ROAD,
  BLIZZARD_SHIPS,
  BREAKWATER_HARBOUR,
  BREAKWATER_OTHER,
  COLD_MOOD,
  DIKE_WAVE,
  DISASTER_CHANCE,
  DISASTER_KINDS,
  DISASTER_ROLL,
  DISASTER_SECONDS,
  DISASTERS_FROM,
  DROUGHT_CROPS,
  eventOn,
  FACTION_WAVE_CLOSED,
  FACTION_WAVE_GOODS,
  FACTION_WAVE_LOSS,
  FACTION_WORK,
  FLOOD_DAMAGE,
  FLOOD_FLOOR,
  FOUNTAIN_CROPS,
  FUEL_RATE,
  FUELS,
  HARBOUR_KINDS,
  IRRIGATED_CROPS,
  ISLAND_CALM,
  KIND_CALM,
  LOCUST_BLIGHT,
  LOCUST_EATS,
  LOCUST_SHARE,
  LOW_LAND,
  LOW_REACH,
  PLAYER_CALM,
  PROTECTION,
  PROTECTION_KINDS,
  PUMP_DRAIN,
  RIVER_REACH,
  SIDE_SPREAD,
  TSUNAMI_AT_SEA,
  TSUNAMI_DOCKED,
  TSUNAMI_FLOOR,
  TSUNAMI_HARBOUR,
  TSUNAMI_OTHER,
  TSUNAMI_REACH,
  TSUNAMI_SEA_RANGE,
  TSUNAMI_SHIP_FLOOR,
  TSUNAMI_STOCK,
  WARMTH_BLEND,
  WARNING_SECONDS,
} from "./disasters-data";
import { factionOfIsland } from "./factions";
import { addIncident } from "./incidents";
import { NO_ROAD, PAVED_ROAD } from "./logistics-data";
import { HUMAN, islandOwner, playerById } from "./players";
import { nextRandom, randomInt, randomPick } from "./random";
import { difficultyOf } from "./difficulty-data";
import { SHIP } from "./ships-data";
import { DIRS4, isSea, tileHeight } from "./terrain";
import { seasonAt, TICK } from "./time";
import {
  Terrain,
  type Building,
  type BuildingKind,
  type Disaster,
  type DisasterKind,
  type Game,
  type GoodId,
  type HazardState,
  type Player,
  type World,
} from "./types";

/** Steps between two rounds of the running effects (one second). */
const ROUND_STEPS = Math.round(1 / TICK);

/** Seconds per round of the running effects. */
const ROUND_SECONDS = 1;

/** Seconds in a minute, for per-minute rates. */
const PER_MINUTE = 60;

/** Distance to the sea of tiles farther than anything measured. */
const FAR = 255;

/** The four sides as unit steps: north, east, south, west. */
const SIDES: readonly (readonly [number, number])[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

/** A side of no island (a river flood, the other disasters). */
const NO_SIDE = -1;

/** What the terrain alone says about the danger of every tile. */
type Zones = {
  /** Steps to the nearest sea tile, {@link FAR} beyond the measured range. */
  readonly seaDist: Uint8Array;
  /** 1 on land within {@link RIVER_REACH} of a river. */
  readonly river: Uint8Array;
  /** Bit s set on land that lies on side s of its island. */
  readonly sides: Uint8Array;
  /** 1 on land low enough to flood in a storm tide. */
  readonly low: Uint8Array;
};

/** The zones of each world, computed once. */
const zonesByWorld = new WeakMap<World, Zones>();

/** A threat to a building and what guards it now. */
export type Threat = {
  readonly kind: DisasterKind;
  /** The protection kinds in reach that keep it off (some or all). */
  readonly guards: readonly BuildingKind[];
};

/** A protection building the AI wants, and where it should stand. */
export type ProtectionWant = {
  readonly kind: BuildingKind;
  readonly x: number;
  readonly y: number;
};

/**
 * The state of a game without any disaster yet.
 *
 * @returns it
 */
export function createHazards(): HazardState {
  return {
    disasters: [],
    next: DISASTERS_FROM,
    calm: {},
    rest: {},
    last: {},
    hit: {},
    warmth: {},
  };
}

/**
 * One step of the disasters: announced ones strike, raging ones work and
 * end, and now and then the dice are rolled.
 *
 * @param game - the game
 */
export function stepDisasters(game: Game): void {
  const hazards = game.hazards;
  for (const disaster of [...hazards.disasters]) {
    if (!disaster.struck && game.time >= disaster.strikes) {
      strike(game, disaster);
    }
    if (disaster.struck && game.time >= disaster.until) {
      end(game, disaster);
    }
  }
  if (game.tick % ROUND_STEPS === 0) {
    rage(game);
  }
  if (game.time >= hazards.next) {
    hazards.next = game.time + DISASTER_ROLL;
    roll(game);
  }
}

/**
 * Announces a disaster at once, without dice, season or calm (for tests
 * and the debug door). A blizzard covers the whole map.
 *
 * @param game - the game
 * @param kind - the disaster
 * @param island - where; ignored for a blizzard
 * @returns the disaster, or null when the island already bears one
 */
export function forceDisaster(
  game: Game,
  kind: DisasterKind,
  island: number,
): Disaster | null {
  const where = kind === "blizzard" ? -1 : island;
  const busy = game.hazards.disasters.some(
    (other) =>
      other.island === where || (kind === "blizzard" && other.kind === kind),
  );
  return busy ? null : announce(game, kind, where);
}

/**
 * The disaster raging on an island now, or null.
 *
 * @param game - the game
 * @param island - the island
 * @returns it
 */
export function disasterAt(game: Game, island: number): Disaster | null {
  return (
    game.hazards.disasters.find(
      (disaster) => disaster.struck && disaster.island === island,
    ) ?? null
  );
}

/**
 * Whether a blizzard rages over the map now.
 *
 * @param game - the game
 * @returns true while it snows
 */
export function blizzardRages(game: Game): boolean {
  return game.hazards.disasters.some(
    (disaster) => disaster.kind === "blizzard" && disaster.struck,
  );
}

/**
 * How a drought changes the yield of a crop farm: a share, 1 when there is
 * none or the fields are watered.
 *
 * @param game - the game
 * @param building - the farm
 * @returns the factor
 */
export function droughtFactor(game: Game, building: Building): number {
  const raging = disasterAt(game, building.island);
  let factor = 1;
  if (raging?.kind === "drought" && isCropFarm(building.kind)) {
    const at = centreIndex(game, building);
    if (game.coverage.irrigation?.[at] === 1) {
      factor = IRRIGATED_CROPS;
    } else if (game.coverage.fountain?.[at] === 1) {
      factor = FOUNTAIN_CROPS;
    } else {
      factor = DROUGHT_CROPS ** difficultyOf(game).hazardImpact;
    }
  }
  return factor;
}

/**
 * Whether a building stands in flood water.
 *
 * @param game - the game
 * @param building - the building
 * @returns true when a tile of it is under water
 */
export function isFlooded(game: Game, building: Building): boolean {
  const raging = disasterAt(game, building.island);
  let wet = false;
  if (raging?.kind === "flood") {
    const n = game.world.n;
    for (let y = building.y; y < building.y + building.h && !wet; y += 1) {
      for (let x = building.x; x < building.x + building.w && !wet; x += 1) {
        wet = game.flooded[y * n + x] === 1;
      }
    }
  }
  return wet;
}

/**
 * Whether a cart's way leads through flood water.
 *
 * @param game - the game
 * @param path - the tiles of the way
 * @returns true when a tile of it is under water
 */
export function pathFlooded(game: Game, path: readonly number[]): boolean {
  const wet = game.hazards.disasters.some(
    (disaster) => disaster.kind === "flood" && disaster.struck,
  );
  return wet && path.some((tile) => game.flooded[tile] === 1);
}

/**
 * A cart's speed share on a tile with the disasters: nothing in flood
 * water, snowed-in roads in a blizzard.
 *
 * @param game - the game
 * @param tile - the tile
 * @param base - its speed share without disasters
 * @returns the share
 */
export function cartSpeed(game: Game, tile: number, base: number): number {
  let speed = base;
  if (game.flooded[tile] === 1) {
    speed = 0;
  } else if (blizzardRages(game)) {
    const road = game.roads[tile];
    if (road === PAVED_ROAD) {
      speed = Math.min(base, BLIZZARD_PAVED);
    } else if (road !== NO_ROAD) {
      speed = Math.min(base, BLIZZARD_ROAD);
    } else {
      speed = base * BLIZZARD_LAND;
    }
  }
  return speed;
}

/**
 * How the disasters slow ships: only a blizzard does.
 *
 * @param game - the game
 * @returns a factor on their speed
 */
export function seaPace(game: Game): number {
  return blizzardRages(game) ? BLIZZARD_SHIPS : 1;
}

/**
 * Burns the fuel an island's residents need in a blizzard (coal first,
 * then wood) and remembers how well the need was met.
 *
 * @param game - the game
 * @param island - the island
 * @param residents - residents in reach of a market
 * @param seconds - seconds the round stands for
 */
export function burnFuel(
  game: Game,
  island: number,
  residents: number,
  seconds: number,
): void {
  if (blizzardRages(game)) {
    const stock = game.islands[island].stock;
    const wanted = (residents * FUEL_RATE * seconds) / PER_MINUTE;
    let missing = wanted;
    for (const fuel of FUELS) {
      const taken = Math.min(missing, stock[fuel]);
      stock[fuel] -= taken;
      missing -= taken;
    }
    const ratio = wanted > 0 ? 1 - missing / wanted : 1;
    const before = game.hazards.warmth[island] ?? 1;
    game.hazards.warmth[island] = before + (ratio - before) * WARMTH_BLEND;
  }
}

/**
 * How much the cold lowers the mood of an island's houses in a blizzard.
 *
 * @param game - the game
 * @param island - the island
 * @returns a share to take off, 0 without a blizzard or with fuel enough
 */
export function coldMood(game: Game, island: number): number {
  return blizzardRages(game)
    ? COLD_MOOD * (1 - (game.hazards.warmth[island] ?? 1))
    : 0;
}

/**
 * How well an island's fuel need was met lately.
 *
 * @param game - the game
 * @param island - the island
 * @returns 0 to 1
 */
export function warmthOf(game: Game, island: number): number {
  return game.hazards.warmth[island] ?? 1;
}

/**
 * How hard a faction's works go while a disaster rages on its island.
 *
 * @param game - the game
 * @param island - the faction's island
 * @returns a factor on its production
 */
export function factionWork(game: Game, island: number): number {
  const raging = disasterAt(game, island);
  return raging === null ? 1 : FACTION_WORK[raging.kind];
}

/**
 * The disasters that threaten a building where it stands, with what
 * guards it now - for the building's window and the AI.
 *
 * @param game - the game
 * @param building - the building
 * @returns the threats, empty when none
 */
export function threatsOf(game: Game, building: Building): Threat[] {
  const at = centreIndex(game, building);
  const guards = (kinds: readonly BuildingKind[]) =>
    kinds.filter((kind) => game.coverage[kind]?.[at] === 1);
  const threats: Threat[] = [];
  if (inFloodZone(game, building)) {
    threats.push({ kind: "flood", guards: guards(["dike", "pumpStation"]) });
  }
  if (isCropFarm(building.kind)) {
    threats.push({
      kind: "drought",
      guards: guards(["irrigation", "fountain"]),
    });
    threats.push({ kind: "locusts", guards: [] });
  }
  if (inWaveZone(game, building)) {
    threats.push({ kind: "tsunami", guards: guards(["breakwater", "dike"]) });
  }
  if (building.house !== null) {
    threats.push({ kind: "blizzard", guards: [] });
  }
  return threats;
}

/**
 * Buildings of an island that a protection building on a spot would
 * guard, for the build preview and its window.
 *
 * @param game - the game
 * @param kind - the protection kind
 * @param island - the island
 * @param cx - centre of the spot, tiles
 * @param cy - centre of the spot, tiles
 * @returns how many endangered buildings lie in its reach
 */
export function guardedBy(
  game: Game,
  kind: BuildingKind,
  island: number,
  cx: number,
  cy: number,
): number {
  const radius = BUILDING[kind].radius;
  const against = PROTECTION[kind] ?? [];
  return game.buildings.filter(
    (building) =>
      building.island === island &&
      Math.hypot(
        building.x + building.w / 2 - cx,
        building.y + building.h / 2 - cy,
      ) <= radius &&
      endangered(game, building).some((threat) => against.includes(threat)),
  ).length;
}

/**
 * The tiles of an island that a kind of disaster can strike, for the
 * overlay in build mode: flood zones for dikes and pumps, the coast for
 * breakwaters, the farms for irrigation.
 *
 * @param game - the game
 * @param island - the island
 * @param kind - the disaster
 * @returns tile indices
 */
export function dangerTiles(
  game: Game,
  island: number,
  kind: DisasterKind,
): number[] {
  const world = game.world;
  const zones = zonesOf(world);
  const n = world.n;
  const tiles: number[] = [];
  const info = world.islands[island];
  if (info !== undefined) {
    for (let y = info.minY; y <= info.maxY; y += 1) {
      for (let x = info.minX; x <= info.maxX; x += 1) {
        const i = y * n + x;
        const land = world.islandOf[i] === island;
        const wet =
          zones.river[i] === 1 ||
          (zones.low[i] === 1 && zones.seaDist[i] <= LOW_REACH);
        const coast = zones.seaDist[i] <= TSUNAMI_REACH;
        const farm =
          kind === "drought" &&
          isCropFarm(
            game.buildings.find((b) => b.id === game.occupancy[i] - 1)?.kind ??
              "house",
          );
        if (
          land &&
          ((kind === "flood" && wet) || (kind === "tsunami" && coast) || farm)
        ) {
          tiles.push(i);
        }
      }
    }
  }
  return tiles;
}

/**
 * The protection buildings an AI player wants on an island, each with the
 * place of the endangered building it should stand by: against what struck
 * it before, or against everything when its character is careful (the
 * trader).
 *
 * @param game - the game
 * @param player - the AI player
 * @param island - the island
 * @returns the wishes, most pressing first
 */
export function protectionPlan(
  game: Game,
  player: Player,
  island: number,
): ProtectionWant[] {
  const struck = game.hazards.hit[player.id] ?? [];
  const careful = player.ai?.personality === "trader";
  const wants: ProtectionWant[] = [];
  for (const kind of PROTECTION_KINDS) {
    const against = PROTECTION[kind] ?? [];
    const most = AI_PROTECTION_MOST[kind] ?? 0;
    const have = game.buildings.filter(
      (b) => b.island === island && b.kind === kind,
    ).length;
    // The pump only after a flood came; the others also from care.
    const reason =
      against.some((threat) => struck.includes(threat)) ||
      (careful && kind !== "pumpStation");
    const open = reason && have < most && eventsOn(game, against);
    const bare = open
      ? game.buildings.find(
          (b) =>
            b.island === island &&
            b.complete &&
            !PROTECTION_KINDS.includes(b.kind) &&
            game.coverage[kind]?.[centreIndex(game, b)] !== 1 &&
            endangered(game, b).some((threat) => against.includes(threat)),
        )
      : undefined;
    if (bare !== undefined) {
      wants.push({
        kind,
        x: bare.x + bare.w / 2,
        y: bare.y + bare.h / 2,
      });
    }
  }
  return wants;
}

/**
 * Rebuilds the grid of flooded tiles from the floods raging now.
 *
 * @param game - the game
 */
export function refreshFlooded(game: Game): void {
  game.flooded.fill(0);
  for (const disaster of game.hazards.disasters) {
    if (disaster.kind === "flood" && disaster.struck) {
      for (const tile of disaster.tiles) {
        game.flooded[tile] = 1;
      }
    }
  }
}

/**
 * Where a wave or a storm tide of a disaster comes from, as a unit step.
 *
 * @param side - the side, 0 north to 3 west
 * @returns the step towards that side, or [0, 0] for none
 */
export function sideStep(side: number): readonly [number, number] {
  return SIDES[side] ?? [0, 0];
}

/**
 * Measures the danger zones of a world once, when a game is made or
 * loaded, so no step has to.
 *
 * @param world - the world
 */
export function prepareZones(world: World): void {
  zonesOf(world);
}

/** Whether any of a list of disasters is switched on. */
function eventsOn(game: Game, kinds: readonly DisasterKind[]): boolean {
  return kinds.some((kind) => eventOn(game.settings, kind));
}

/** The disasters a building stands in the way of, whatever guards it. */
function endangered(game: Game, building: Building): DisasterKind[] {
  const kinds: DisasterKind[] = [];
  if (inFloodZone(game, building)) {
    kinds.push("flood");
  }
  if (isCropFarm(building.kind)) {
    kinds.push("drought");
  }
  if (inWaveZone(game, building)) {
    kinds.push("tsunami");
  }
  return kinds;
}

/** Tile index under a building's centre. */
function centreIndex(game: Game, building: Building): number {
  const n = game.world.n;
  return (
    Math.floor(building.y + building.h / 2) * n +
    Math.floor(building.x + building.w / 2)
  );
}

/** Whether a tile of a building lies where a flood can come. */
function inFloodZone(game: Game, building: Building): boolean {
  const zones = zonesOf(game.world);
  return someTile(
    game,
    building,
    (i) =>
      zones.river[i] === 1 ||
      (zones.low[i] === 1 && zones.seaDist[i] <= LOW_REACH),
  );
}

/** Whether a tile of a building lies where a wave can come. */
function inWaveZone(game: Game, building: Building): boolean {
  const zones = zonesOf(game.world);
  return someTile(game, building, (i) => zones.seaDist[i] <= TSUNAMI_REACH);
}

/** Whether any tile of a building passes a test. */
function someTile(
  game: Game,
  building: Building,
  test: (index: number) => boolean,
): boolean {
  const n = game.world.n;
  let found = false;
  for (let y = building.y; y < building.y + building.h && !found; y += 1) {
    for (let x = building.x; x < building.x + building.w && !found; x += 1) {
      found = test(y * n + x);
    }
  }
  return found;
}

/** Rolls the dice for every island that may be struck, and the blizzard. */
function roll(game: Game): void {
  const hazards = game.hazards;
  const level = difficultyOf(game);
  for (const info of game.world.islands) {
    const id = info.id;
    const owner = ownerOfIsland(game, id);
    const spared =
      owner === null ||
      (hazards.calm[id] ?? 0) > game.time ||
      (hazards.rest[owner] ?? 0) > game.time ||
      hazards.disasters.some((disaster) => disaster.island === id) ||
      (owner === HUMAN && game.tutorial.active);
    let chosen = false;
    for (const kind of DISASTER_KINDS) {
      if (
        !spared &&
        !chosen &&
        kind !== "blizzard" &&
        eventOn(game.settings, kind) &&
        (hazards.last[kind] ?? -Infinity) + KIND_CALM[kind] <= game.time &&
        fits(game, kind, id, owner) &&
        nextRandom(game) < DISASTER_CHANCE[kind] * level.hazardChance
      ) {
        chosen = true;
        announce(game, kind, id);
      }
    }
  }
  const snowing = hazards.disasters.some((d) => d.kind === "blizzard");
  if (
    !snowing &&
    eventOn(game.settings, "blizzard") &&
    seasonAt(game.time) === "winter" &&
    (hazards.last.blizzard ?? -Infinity) + KIND_CALM.blizzard <= game.time &&
    nextRandom(game) < DISASTER_CHANCE.blizzard * level.hazardChance
  ) {
    announce(game, "blizzard", -1);
  }
}

/**
 * Who bears what happens on an island: a player's id, a faction's id, or
 * null for an island nobody lives on.
 */
function ownerOfIsland(game: Game, island: number): number | null {
  const owner = islandOwner(game, island);
  const faction = factionOfIsland(game, island);
  let result: number | null = null;
  if (owner >= 0) {
    result = owner;
  } else if (faction !== null) {
    result = faction.id;
  }
  return result;
}

/**
 * Whether a disaster can strike an island now: a player must have opened
 * its protection first, and there must be something to strike.
 */
function fits(
  game: Game,
  kind: DisasterKind,
  island: number,
  owner: number,
): boolean {
  const player = playerById(game, owner);
  const opened = (protection: BuildingKind) =>
    player === null || player.unlocked.includes(protection);
  const on = game.buildings.filter((b) => b.island === island && b.complete);
  const faction = player === null;
  let result: boolean;
  switch (kind) {
    case "flood":
      result =
        opened("dike") &&
        (faction || on.some((b) => inFloodZone(game, b))) &&
        floodSides(game, island).length > 0;
      break;
    case "drought":
      result =
        opened("irrigation") &&
        seasonAt(game.time) === "summer" &&
        game.weather === "clear" &&
        (faction || on.some((b) => isCropFarm(b.kind)));
      break;
    case "locusts":
      result = faction || on.filter((b) => isCropFarm(b.kind)).length >= 2;
      break;
    case "tsunami":
      result =
        opened("breakwater") &&
        (faction || on.some((b) => inWaveZone(game, b)));
      break;
    default:
      result = false;
  }
  return result;
}

/**
 * The ways an island can flood: -1 for its river, 0 to 3 for a side whose
 * low coast a storm tide drowns.
 */
function floodSides(game: Game, island: number): number[] {
  const world = game.world;
  const zones = zonesOf(world);
  const info = world.islands[island];
  const n = world.n;
  const found = new Set<number>();
  for (let y = info.minY; y <= info.maxY; y += 1) {
    for (let x = info.minX; x <= info.maxX; x += 1) {
      const i = y * n + x;
      if (world.islandOf[i] === island) {
        if (zones.river[i] === 1) {
          found.add(NO_SIDE);
        }
        if (zones.low[i] === 1 && zones.seaDist[i] <= LOW_REACH) {
          SIDES.forEach((_, side) => {
            if ((zones.sides[i] & (1 << side)) !== 0) {
              found.add(side);
            }
          });
        }
      }
    }
  }
  return [...found].sort((a, b) => a - b);
}

/** The sides of an island where a wave would hit a building. */
function waveSides(game: Game, island: number): number[] {
  const zones = zonesOf(game.world);
  return SIDES.map((_, side) => side).filter((side) =>
    game.buildings.some(
      (building) =>
        building.island === island &&
        someTile(
          game,
          building,
          (i) =>
            zones.seaDist[i] <= TSUNAMI_REACH &&
            (zones.sides[i] & (1 << side)) !== 0,
        ),
    ),
  );
}

/** Announces a disaster: it strikes after its warning time. */
function announce(game: Game, kind: DisasterKind, island: number): Disaster {
  const sides = kind === "flood" && island >= 0 ? floodSides(game, island) : [];
  let side = NO_SIDE;
  if (kind === "flood" && sides.length > 0) {
    side = randomPick(game, sides);
  } else if (kind === "tsunami") {
    const open = waveSides(game, island);
    side =
      open.length > 0
        ? randomPick(game, open)
        : randomInt(game, 0, SIDES.length - 1);
  }
  const strikes = game.time + WARNING_SECONDS[kind];
  const disaster: Disaster = {
    id: game.nextId,
    kind,
    island,
    warned: game.time,
    strikes,
    until: strikes + DISASTER_SECONDS[kind] * difficultyOf(game).hazardImpact,
    side,
    tiles: [],
    struck: false,
  };
  game.nextId += 1;
  game.hazards.disasters.push(disaster);
  const owner = island >= 0 ? (ownerOfIsland(game, island) ?? -1) : -1;
  const info = island >= 0 ? game.world.islands[island] : null;
  // The island and its owner are spared from now until well after it.
  if (island >= 0) {
    game.hazards.calm[island] = disaster.until + ISLAND_CALM;
    game.hazards.rest[owner] = disaster.until + PLAYER_CALM;
  }
  game.events.push({
    type: "disasterWarning",
    kind,
    player: owner,
    island,
    seconds: WARNING_SECONDS[kind],
    x: info?.cx ?? game.world.n / 2,
    y: info?.cy ?? game.world.n / 2,
  });
  return disaster;
}

/** The blow of a disaster. */
function strike(game: Game, disaster: Disaster): void {
  disaster.struck = true;
  const island = disaster.island;
  const owner = island >= 0 ? (ownerOfIsland(game, island) ?? -1) : -1;
  const info = island >= 0 ? game.world.islands[island] : null;
  switch (disaster.kind) {
    case "flood":
      flood(game, disaster);
      break;
    case "locusts":
      swarm(game, disaster);
      break;
    case "tsunami":
      wave(game, disaster);
      break;
    default:
      break;
  }
  // A blizzard strikes everyone; a faction's island strikes no player.
  let players: number[] = [];
  if (island < 0) {
    players = game.players.map((p) => p.id);
  } else if (owner >= 0) {
    players = [owner];
  }
  for (const id of players) {
    const list = game.hazards.hit[id] ?? [];
    if (!list.includes(disaster.kind)) {
      game.hazards.hit[id] = [...list, disaster.kind];
    }
  }
  addIncident(
    game,
    disaster.kind,
    owner,
    island,
    info?.cx ?? game.world.n / 2,
    info?.cy ?? game.world.n / 2,
    disaster.until - game.time,
  );
}

/** A disaster is over: the island and its owner get their calm. */
function end(game: Game, disaster: Disaster): void {
  const hazards = game.hazards;
  hazards.disasters = hazards.disasters.filter((d) => d !== disaster);
  hazards.last[disaster.kind] = game.time;
  const owner =
    disaster.island >= 0 ? ownerOfIsland(game, disaster.island) : null;
  if (disaster.island >= 0) {
    hazards.calm[disaster.island] = game.time + ISLAND_CALM;
  }
  if (owner !== null) {
    hazards.rest[owner] = game.time + PLAYER_CALM;
  }
  if (disaster.kind === "flood") {
    refreshFlooded(game);
  }
  if (disaster.kind === "blizzard") {
    hazards.warmth = {};
  }
  game.events.push({
    type: "disasterOver",
    kind: disaster.kind,
    player: owner ?? -1,
    island: disaster.island,
  });
}

/**
 * The water rises: on the land by the river or on the low coast of one
 * side, but not where a dike guards it. Producers there lose what they
 * held.
 */
function flood(game: Game, disaster: Disaster): void {
  const world = game.world;
  const zones = zonesOf(world);
  const info = world.islands[disaster.island];
  const n = world.n;
  const dike = game.coverage.dike;
  const tiles: number[] = [];
  for (let y = info.minY; y <= info.maxY; y += 1) {
    for (let x = info.minX; x <= info.maxX; x += 1) {
      const i = y * n + x;
      const wet =
        disaster.side === NO_SIDE
          ? zones.river[i] === 1
          : zones.low[i] === 1 &&
            zones.seaDist[i] <= LOW_REACH &&
            (zones.sides[i] & (1 << disaster.side)) !== 0;
      if (world.islandOf[i] === disaster.island && wet && dike?.[i] !== 1) {
        tiles.push(i);
      }
    }
  }
  disaster.tiles = tiles;
  refreshFlooded(game);
  for (const building of game.buildings) {
    if (building.prod !== null && isFlooded(game, building)) {
      building.prod.output = 0;
      building.prod.input = {};
      building.prod.cycle = 0;
    }
  }
  game.carts = game.carts.filter((cart) => game.flooded[cart.path[0]] !== 1);
}

/** Locusts eat part of the farms bare and some of the stored food. */
function swarm(game: Game, disaster: Disaster): void {
  const farms = game.buildings.filter(
    (b) => b.island === disaster.island && b.complete && isCropFarm(b.kind),
  );
  const impact = difficultyOf(game).hazardImpact;
  const count = Math.ceil(farms.length * LOCUST_SHARE * impact);
  for (let k = 0; k < count && farms.length > 0; k += 1) {
    const index = randomInt(game, 0, farms.length - 1);
    const farm = farms[index];
    farms.splice(index, 1);
    farm.blight = LOCUST_BLIGHT;
    if (farm.prod !== null) {
      farm.prod.output = 0;
      farm.prod.cycle = 0;
    }
  }
  const stock = game.islands[disaster.island].stock;
  for (const [good, share] of Object.entries(LOCUST_EATS) as [
    GoodId,
    number,
  ][]) {
    stock[good] *= 1 - share * impact;
  }
  const faction = factionOfIsland(game, disaster.island);
  if (faction !== null) {
    for (const [good, share] of Object.entries(LOCUST_EATS) as [
      GoodId,
      number,
    ][]) {
      faction.stock[good] = Math.floor(
        faction.stock[good] * (1 - share * impact),
      );
    }
  }
}

/**
 * The wave breaks on one side of the island: heavy damage to the
 * buildings by the sea there, goods washed out of a struck kontor, and
 * ships at the quay and close by hurt. Dikes and breakwaters take part of
 * its force.
 */
function wave(game: Game, disaster: Disaster): void {
  const world = game.world;
  const zones = zonesOf(world);
  const bit = 1 << disaster.side;
  const hit = (i: number) =>
    zones.seaDist[i] <= TSUNAMI_REACH && (zones.sides[i] & bit) !== 0;
  let kontorHit = 1;
  for (const building of game.buildings) {
    if (building.island === disaster.island && someTile(game, building, hit)) {
      const def = BUILDING[building.kind];
      const at = centreIndex(game, building);
      const harbour = HARBOUR_KINDS.includes(building.kind);
      let share =
        (harbour ? TSUNAMI_HARBOUR : TSUNAMI_OTHER) *
        difficultyOf(game).hazardImpact;
      if (game.coverage.breakwater?.[at] === 1) {
        share *= harbour ? BREAKWATER_HARBOUR : BREAKWATER_OTHER;
      } else if (game.coverage.dike?.[at] === 1) {
        share *= DIKE_WAVE;
      }
      building.hp = Math.max(
        Math.min(building.hp, def.hp * TSUNAMI_FLOOR),
        building.hp - def.hp * share,
      );
      if (building.kind === "kontor") {
        kontorHit = share / TSUNAMI_HARBOUR;
      }
      if (building.prod !== null) {
        building.prod.output = 0;
      }
    }
  }
  const kontor = game.buildings.find(
    (b) => b.kind === "kontor" && b.island === disaster.island,
  );
  if (kontor !== undefined && someTile(game, kontor, hit)) {
    const stock = game.islands[disaster.island].stock;
    for (const good of Object.keys(stock) as GoodId[]) {
      stock[good] *= 1 - TSUNAMI_STOCK * kontorHit;
    }
  }
  const info = world.islands[disaster.island];
  for (const ship of game.ships) {
    const def = SHIP[ship.kind];
    const docked = kontor !== undefined && ship.docked === kontor.id;
    const near =
      Math.hypot(ship.x - info.cx, ship.y - info.cy) <= TSUNAMI_SEA_RANGE;
    let share = 0;
    if (docked) {
      share = TSUNAMI_DOCKED * kontorHit;
    } else if (near) {
      share = TSUNAMI_AT_SEA;
    }
    if (share > 0) {
      ship.hp = Math.max(
        Math.min(ship.hp, def.hp * TSUNAMI_SHIP_FLOOR),
        ship.hp - def.hp * share,
      );
    }
  }
  const faction = factionOfIsland(game, disaster.island);
  if (faction !== null) {
    for (const good of (Object.keys(faction.stock) as GoodId[])
      .sort((a, b) => faction.stock[b] - faction.stock[a])
      .slice(0, FACTION_WAVE_GOODS)) {
      faction.stock[good] = Math.floor(
        faction.stock[good] * (1 - FACTION_WAVE_LOSS),
      );
    }
    faction.effects.storm = Math.max(
      faction.effects.storm,
      game.time + FACTION_WAVE_CLOSED,
    );
  }
}

/**
 * Once a second: flood water damages the buildings in it and pumps drain
 * their reach, bare fields grow back slowly.
 */
function rage(game: Game): void {
  const impact = difficultyOf(game).hazardImpact;
  let drained = false;
  for (const disaster of game.hazards.disasters) {
    if (
      disaster.kind === "flood" &&
      disaster.struck &&
      game.time >= disaster.strikes + PUMP_DRAIN
    ) {
      const pump = game.coverage.pumpStation;
      const before = disaster.tiles.length;
      disaster.tiles = disaster.tiles.filter((tile) => pump?.[tile] !== 1);
      drained = drained || disaster.tiles.length !== before;
      if (disaster.tiles.length === 0) {
        disaster.until = Math.min(disaster.until, game.time);
      }
    }
  }
  if (drained) {
    refreshFlooded(game);
  }
  const wet = game.hazards.disasters.some(
    (disaster) => disaster.kind === "flood" && disaster.struck,
  );
  for (const building of game.buildings) {
    if (building.blight > 0) {
      building.blight = Math.max(0, building.blight - ROUND_SECONDS);
    }
    if (wet && isFlooded(game, building)) {
      const whole = BUILDING[building.kind].hp;
      building.hp = Math.max(
        Math.min(building.hp, whole * FLOOD_FLOOR),
        building.hp - whole * FLOOD_DAMAGE * impact * ROUND_SECONDS,
      );
    }
  }
}

/** The danger zones of a world, computed on first use. */
function zonesOf(world: World): Zones {
  let zones = zonesByWorld.get(world);
  if (zones === undefined) {
    zones = computeZones(world);
    zonesByWorld.set(world, zones);
  }
  return zones;
}

/** Measures distance to the sea, river banks, low land and sides. */
function computeZones(world: World): Zones {
  const n = world.n;
  const seaDist = new Uint8Array(n * n).fill(FAR);
  const river = new Uint8Array(n * n);
  const sides = new Uint8Array(n * n);
  const low = new Uint8Array(n * n);
  const reach = Math.max(TSUNAMI_REACH, LOW_REACH);
  let front: number[] = [];
  for (let i = 0; i < n * n; i += 1) {
    if (isSea(world.terrain[i] as Terrain)) {
      seaDist[i] = 0;
      front.push(i);
    }
  }
  for (let step = 1; step <= reach; step += 1) {
    const next: number[] = [];
    for (const i of front) {
      const x = i % n;
      const y = Math.floor(i / n);
      for (const [dx, dy] of DIRS4) {
        const nx = x + dx;
        const ny = y + dy;
        const j = ny * n + nx;
        if (nx >= 0 && ny >= 0 && nx < n && ny < n && seaDist[j] === FAR) {
          seaDist[j] = step;
          next.push(j);
        }
      }
    }
    front = next;
  }
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      const i = y * n + x;
      const island = world.islandOf[i];
      if (island >= 0 && world.terrain[i] !== Terrain.River) {
        const info = world.islands[island];
        river[i] = nearRiver(world, x, y) ? 1 : 0;
        low[i] = tileHeight(world, x, y) < LOW_LAND ? 1 : 0;
        const dx = x - info.cx;
        const dy = y - info.cy;
        const length = Math.hypot(dx, dy);
        SIDES.forEach(([sx, sy], side) => {
          if (length > 0 && (dx * sx + dy * sy) / length >= SIDE_SPREAD) {
            sides[i] |= 1 << side;
          }
        });
      }
    }
  }
  return { seaDist, river, sides, low };
}

/** Whether a river runs within {@link RIVER_REACH} of a tile. */
function nearRiver(world: World, x: number, y: number): boolean {
  const n = world.n;
  let found = false;
  for (let dy = -RIVER_REACH; dy <= RIVER_REACH && !found; dy += 1) {
    for (let dx = -RIVER_REACH; dx <= RIVER_REACH && !found; dx += 1) {
      const nx = x + dx;
      const ny = y + dy;
      found =
        nx >= 0 &&
        ny >= 0 &&
        nx < n &&
        ny < n &&
        world.terrain[ny * n + nx] === Terrain.River;
    }
  }
  return found;
}

/** Whether a kind is a crop farm, whose yield drought and locusts take. */
function isCropFarm(kind: BuildingKind): boolean {
  return BUILDING[kind].recipe?.seasonal === "crop";
}
