/**
 * Setting up the world: where the monsters live, how a new or saved
 * adventure starts, and what a save holds - with the way old saves are
 * carried over.
 *
 * @module
 */
import { START, TEMPLE_START, moveTo } from "./areas";
import { PLAYER_HH, PLAYER_HW } from "./enemies";
import { EQUIP_IDS, GRID_ITEMS, MAX_BOTTLES, START_KIT } from "./gear";
import { boxBlocked } from "./physics";
import { roomAt, tileCentre } from "./tiles";
import type {
  AreaId,
  Bottle,
  Destination,
  EnemyKind,
  EquipId,
  GameState,
  ItemId,
  Spawn,
} from "./types";
import { NO_INPUT } from "./types";

/** Hearts Link starts with. */
export const START_HEARTS = 3;

/** Half hearts per heart. */
export const HALVES_PER_HEART = 2;

/** Most arrows the quiver holds. */
export const MAX_ARROWS = 30;

/** Most bombs the bag holds. */
export const MAX_BOMBS = 20;

/** Arrows to start with. */
const START_ARROWS = 20;

/** Bombs to start with. */
const START_BOMBS = 10;

/** Most rupees the wallet holds - three digits, as on the screen. */
export const MAX_RUPEES = 999;

/** Pieces of heart that make one heart container. */
export const PIECES_PER_HEART = 4;

/** What could sit on B before version 3, when the sword lived on A. */
type OldItemId = "shield" | "bow" | "bombs" | "boomerang";

/** The items B could hold before version 3. */
const OLD_ITEM_IDS: readonly OldItemId[] = [
  "shield",
  "bow",
  "bombs",
  "boomerang",
];

/** What a bottle can hold, for checking a save. */
const BOTTLE_CONTENTS: readonly Bottle[] = ["empty", "potion"];

/** The flag the power gloves were remembered under before version 3. */
const OLD_GLOVES_FLAG = "item:gloves";

/** The areas, for checking a save. */
const AREA_IDS: readonly AreaId[] = ["overworld", "dungeon", "houses", "mini"];

/** One monster's home, in tiles. */
type SpawnPoint = readonly [EnemyKind, AreaId, number, number];

/* eslint-disable @typescript-eslint/no-magic-numbers -- the monster homes on
   the maps, in tile columns and rows; checked against the maps to be free. */
const SPAWN_POINTS: readonly SpawnPoint[] = [
  // Octoroks round the village, the river and the lake.
  ["octorok", "overworld", 30, 20],
  ["octorok", "overworld", 38, 22],
  ["octorok", "overworld", 41, 27],
  ["octorok", "overworld", 22, 38],
  ["octorok", "overworld", 35, 43],
  ["octorok", "overworld", 40, 16],
  ["octorok", "overworld", 48, 25],
  ["octorok", "overworld", 50, 31],
  ["octorok", "overworld", 43, 42],
  ["octorok", "overworld", 55, 46],
  // Slimes in the forest clearing and the south meadow.
  ["chuchu", "overworld", 6, 20],
  ["chuchu", "overworld", 4, 21],
  ["chuchu", "overworld", 8, 19],
  ["chuchu", "overworld", 5, 38],
  ["chuchu", "overworld", 18, 34],
  ["chuchu", "overworld", 24, 40],
  ["chuchu", "overworld", 30, 35],
  // Bats along the forest paths and by the cave.
  ["keese", "overworld", 7, 12],
  ["keese", "overworld", 8, 26],
  ["keese", "overworld", 3, 34],
  ["keese", "overworld", 11, 34],
  ["keese", "overworld", 6, 7],
  ["keese", "overworld", 41, 11],
  // Moblins on their pasture across the river.
  ["moblin", "overworld", 52, 18],
  ["moblin", "overworld", 58, 21],
  ["moblin", "overworld", 55, 26],
  ["moblin", "overworld", 61, 24],
  ["moblin", "overworld", 50, 24],
  // Tektites in the hills.
  ["tektite", "overworld", 28, 4],
  ["tektite", "overworld", 33, 9],
  ["tektite", "overworld", 38, 5],
  ["tektite", "overworld", 43, 8],
  ["tektite", "overworld", 47, 6],
  ["tektite", "overworld", 25, 10],
  // The black knight in the ruins.
  ["darknut", "overworld", 60, 6],
  // The moss temple, room by room.
  ["chuchu", "dungeon", 19, 26],
  ["chuchu", "dungeon", 25, 26],
  ["keese", "dungeon", 35, 24],
  ["keese", "dungeon", 39, 26],
  ["chuchu", "dungeon", 37, 25],
  ["chuchu", "dungeon", 6, 25],
  ["chuchu", "dungeon", 9, 24],
  ["keese", "dungeon", 19, 15],
  ["keese", "dungeon", 25, 15],
  ["chuchu", "dungeon", 22, 13],
  ["keese", "dungeon", 50, 13],
  ["keese", "dungeon", 53, 16],
  ["keese", "dungeon", 55, 12],
  ["beetle", "dungeon", 37, 14],
  ["golem", "dungeon", 22, 4],
];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** What survives a reload: written to storage, read back by createGame. */
export type SaveData = {
  readonly area: AreaId;
  readonly x: number;
  readonly y: number;
  readonly hp: number;
  readonly maxHearts: number;
  readonly rupees: number;
  readonly arrows: number;
  readonly bombs: number;
  readonly aItem: EquipId;
  readonly bItem: EquipId;
  /** The tools found so far. */
  readonly owned: readonly ItemId[];
  /** The bottles found or bought, and what is in each. */
  readonly bottles: readonly Bottle[];
  readonly keys: number;
  readonly heartPieces: number;
  readonly small: boolean;
  /** Rocks and walls blown open, as "area:tile". */
  readonly opened: readonly string[];
  readonly takenContainers: readonly number[];
  readonly darknutBeaten: boolean;
  /** Chests, doors, torches, items, story - see {@link GameState.flags}. */
  readonly flags: readonly string[];
  /** Temple rooms seen. */
  readonly visited: readonly number[];
};

/** The second save format, from before the new tools: the sword fixed on A. */
export type SaveDataV2 = Omit<
  SaveData,
  "aItem" | "bItem" | "owned" | "bottles"
> & {
  readonly bItem: OldItemId;
};

/** The first save format, from before the temple and the village. */
export type SaveDataV1 = {
  readonly x: number;
  readonly y: number;
  readonly hp: number;
  readonly maxHearts: number;
  readonly rupees: number;
  readonly arrows: number;
  readonly bombs: number;
  readonly bItem: OldItemId;
  readonly opened: readonly number[];
  readonly takenContainers: readonly number[];
  readonly darknutBeaten: boolean;
};

/**
 * A fresh world, or the saved one.
 *
 * @param stored - a stored game to continue, or null for a new adventure
 * @returns the game state
 */
export function createGame(stored: SaveData | null): GameState {
  const spawns: Spawn[] = SPAWN_POINTS.map(([kind, area, tx, ty]) => {
    const at = tileCentre(tx, ty);
    return {
      kind,
      area,
      room: roomAt(area, at.x, at.y),
      ...at,
      deadAt: null,
      alive: false,
    };
  });
  const maxHearts = stored?.maxHearts ?? START_HEARTS;
  // A save written while Link lay fainted wakes him with three hearts, full size.
  const fainted = stored !== null && stored.hp <= 0;
  const state: GameState = {
    phase: "playing",
    cheat: false,
    time: 0,
    area: "overworld",
    room: -1,
    player: {
      x: START.x,
      y: START.y,
      vx: 0,
      vy: 0,
      facing: "down",
      hp: fainted
        ? Math.min(maxHearts, START_HEARTS) * HALVES_PER_HEART
        : (stored?.hp ?? maxHearts * HALVES_PER_HEART),
      maxHearts,
      action: { kind: "idle" },
      charge: 0,
      invuln: 0,
      knockX: 0,
      knockY: 0,
      knockT: 0,
      walk: 0,
      moving: false,
      shieldUp: false,
      rollCooldown: 0,
      small: !fainted && (stored?.small ?? false),
      shrinkT: 0,
      carrying: false,
      pushT: 0,
      swimming: false,
      diveT: 0,
      diveCooldown: 0,
      strokeT: 0,
      ledgeT: 0,
    },
    inv: {
      rupees: stored?.rupees ?? 0,
      arrows: stored?.arrows ?? START_ARROWS,
      bombs: stored?.bombs ?? START_BOMBS,
      aItem: stored?.aItem ?? "sword",
      bItem: stored?.bItem ?? "bow",
      owned: new Set(stored?.owned ?? START_KIT),
      bottles: [...(stored?.bottles ?? [])],
      keys: stored?.keys ?? 0,
      heartPieces: stored?.heartPieces ?? 0,
    },
    enemies: [],
    spawns,
    shots: [],
    bombs: [],
    boomerang: null,
    hook: null,
    pickups: [],
    effects: [],
    blocks: [],
    rocks: [],
    cut: new Map(),
    dug: new Map(),
    opened: new Set(stored?.opened ?? []),
    takenContainers: new Set(stored?.takenContainers ?? []),
    flags: new Set(stored?.flags ?? []),
    visited: new Set(stored?.visited ?? []),
    dialog: null,
    hold: null,
    menu: null,
    transition: null,
    hitStop: 0,
    shake: 0,
    camX: 0,
    camY: 0,
    prev: NO_INPUT,
    nextId: 1,
    darknutBeaten: stored?.darknutBeaten ?? false,
    banner: null,
  };
  moveTo(state, stored === null ? START : startOf(stored));
  // A save from an older map could stand Link inside a wall; wake him in
  // the village instead.
  if (
    boxBlocked(
      state,
      state.player.x,
      state.player.y,
      PLAYER_HW,
      PLAYER_HH,
      true,
    )
  ) {
    state.player.small = false;
    moveTo(state, START);
  }
  return state;
}

/**
 * Where an adventure picks up: the saved spot - or, after fainting, the
 * temple's entrance or the village.
 *
 * @param save - the stored game
 * @returns where Link wakes up
 */
function startOf(save: SaveData): Destination {
  let start: Destination;
  if (save.hp > 0) {
    start = { area: save.area, x: save.x, y: save.y, facing: "down" };
  } else if (save.area === "dungeon") {
    start = TEMPLE_START;
  } else {
    start = START;
  }
  return start;
}

/**
 * Wakes Link up again after a game over: at the temple's door if he fell
 * inside, otherwise in the village.
 *
 * @param state - the game
 */
export function reviveAt(state: GameState): void {
  const player = state.player;
  player.hp = Math.min(player.maxHearts, START_HEARTS) * HALVES_PER_HEART;
  player.invuln = 1;
  if (state.area !== "dungeon") {
    player.small = false;
  }
  moveTo(state, state.area === "dungeon" ? TEMPLE_START : START);
}

/**
 * What to store of a running game.
 *
 * @param state - the game
 * @returns the save
 */
export function toSave(state: GameState): SaveData {
  // Saved halfway through a door: the save already stands on the far side.
  const going =
    state.transition?.kind === "fade" && !state.transition.swapped
      ? state.transition.to
      : null;
  return {
    area: going?.area ?? state.area,
    x: Math.round(going?.x ?? state.player.x),
    y: Math.round(going?.y ?? state.player.y),
    hp: state.player.hp,
    maxHearts: state.player.maxHearts,
    rupees: state.inv.rupees,
    arrows: state.inv.arrows,
    bombs: state.inv.bombs,
    aItem: state.inv.aItem,
    bItem: state.inv.bItem,
    owned: [...state.inv.owned],
    bottles: [...state.inv.bottles],
    keys: state.inv.keys,
    heartPieces: state.inv.heartPieces,
    small: state.player.small,
    opened: [...state.opened],
    takenContainers: [...state.takenContainers],
    darknutBeaten: state.darknutBeaten,
    flags: [...state.flags],
    visited: [...state.visited],
  };
}

/**
 * Carries a second-format save over: the five tools of the old days are
 * owned (and the gloves, if found), the sword goes on A and the old B item
 * stays on B. No bottles yet.
 *
 * @param old - the old save
 * @returns the same adventure in the current format
 */
export function migrateSave(old: SaveDataV2): SaveData {
  const owned: ItemId[] = [...START_KIT];
  if (old.flags.includes(OLD_GLOVES_FLAG)) {
    owned.push("gloves");
  }
  return {
    ...old,
    aItem: "sword",
    bItem: old.bItem,
    owned,
    bottles: [],
  };
}

/**
 * Carries a first-format save over to the second format: everything stays,
 * the new parts start empty, and the blown-open rocks learn which map they
 * were on. Hand the result on to {@link migrateSave}.
 *
 * @param old - the old save
 * @returns the same adventure in the second format
 */
export function migrateSaveV1(old: SaveDataV1): SaveDataV2 {
  return {
    ...old,
    area: "overworld",
    keys: 0,
    heartPieces: 0,
    small: false,
    // The overworld kept its size, so the tile numbers still fit.
    opened: old.opened.map((index) => `overworld:${index}`),
    flags: [],
    visited: [],
  };
}

/**
 * Checks that a stored value really is a current save.
 *
 * @param value - what came out of storage
 * @returns true when every field has the right type
 */
export function isSaveData(value: unknown): value is SaveData {
  const save = value as SaveData;
  return (
    isSaveTail(value) &&
    EQUIP_IDS.includes(save.aItem) &&
    EQUIP_IDS.includes(save.bItem) &&
    save.aItem !== save.bItem &&
    Array.isArray(save.owned) &&
    save.owned.every((item) => GRID_ITEMS.includes(item)) &&
    Array.isArray(save.bottles) &&
    save.bottles.length <= MAX_BOTTLES &&
    save.bottles.every((bottle) => BOTTLE_CONTENTS.includes(bottle))
  );
}

/**
 * Checks that a stored value is a second-format save.
 *
 * @param value - what came out of storage
 * @returns true when every field has the right type
 */
export function isSaveDataV2(value: unknown): value is SaveDataV2 {
  const save = value as SaveDataV2;
  return isSaveTail(value) && OLD_ITEM_IDS.includes(save.bItem);
}

/** The fields the second and the current format share. */
function isSaveTail(value: unknown): boolean {
  const save = value as SaveData;
  return (
    isSaveCore(value) &&
    AREA_IDS.includes(save.area) &&
    typeof save.keys === "number" &&
    typeof save.heartPieces === "number" &&
    typeof save.small === "boolean" &&
    isStringList(save.opened) &&
    isStringList(save.flags) &&
    Array.isArray(save.visited)
  );
}

/**
 * Checks that a stored value is a first-format save.
 *
 * @param value - what came out of storage
 * @returns true when every field has the right type
 */
export function isSaveDataV1(value: unknown): value is SaveDataV1 {
  const save = value as SaveDataV1;
  return (
    isSaveCore(value) &&
    OLD_ITEM_IDS.includes(save.bItem) &&
    Array.isArray(save.opened) &&
    save.opened.every((index) => typeof index === "number")
  );
}

/** The fields every save format shares. */
function isSaveCore(value: unknown): boolean {
  const save = value as SaveDataV1;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof save.x === "number" &&
    typeof save.y === "number" &&
    typeof save.hp === "number" &&
    typeof save.maxHearts === "number" &&
    typeof save.rupees === "number" &&
    typeof save.arrows === "number" &&
    typeof save.bombs === "number" &&
    Array.isArray(save.takenContainers) &&
    typeof save.darknutBeaten === "boolean"
  );
}

/** A list of strings. */
function isStringList(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}
