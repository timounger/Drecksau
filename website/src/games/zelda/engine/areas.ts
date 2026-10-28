/**
 * Moving between places: which door, hole or stair leads where, and what has
 * to be set up when Link arrives somewhere - the room, the push blocks, the
 * heart pieces and containers still lying about, the monsters.
 *
 * @module
 */
import { BOSS_FLAG, tileFlag } from "./clearing";
import {
  TILE,
  TILE_CHARS,
  findTiles,
  roomAt,
  roomOrigin,
  tileCentre,
} from "./tiles";
import type { AreaId, Destination, Dir, GameState, Pickup } from "./types";

/** One way from a tile to somewhere else. */
type Warp = {
  readonly area: AreaId;
  readonly tx: number;
  readonly ty: number;
  readonly to: Destination;
};

/** Where Link wakes up: the start tile of the overworld. */
export const START: Destination = {
  area: "overworld",
  ...tileCentre(
    findTiles("overworld", TILE_CHARS.start)[0].tx,
    findTiles("overworld", TILE_CHARS.start)[0].ty,
  ),
  facing: "down",
};

/** The overworld heart containers' hiding places. */
export const CONTAINER_SPOTS = findTiles("overworld", TILE_CHARS.container).map(
  (tile) => tileCentre(tile.tx, tile.ty),
);

/** The number under which the guardian's heart container is remembered. */
export const BOSS_CONTAINER = CONTAINER_SPOTS.length;

/* eslint-disable @typescript-eslint/no-magic-numbers -- tile positions of
   the doors, holes and stairs on the generated maps */
/** Where the guardian drops its heart container. */
const BOSS_CONTAINER_AT = tileCentre(22, 5);

/** Just inside the temple, above the stairs. */
export const TEMPLE_START: Destination = dest("dungeon", 22, 27, "up");

/** Every door, hole and stair. */
const WARPS: readonly Warp[] = [
  { area: "overworld", tx: 18, ty: 20, to: dest("houses", 7, 8, "up") },
  { area: "overworld", tx: 32, ty: 27, to: dest("houses", 22, 8, "up") },
  { area: "overworld", tx: 40, ty: 14, to: TEMPLE_START },
  { area: "overworld", tx: 41, ty: 14, to: TEMPLE_START },
  { area: "overworld", tx: 22, ty: 43, to: dest("mini", 3, 9, "right") },
  { area: "overworld", tx: 30, ty: 44, to: dest("mini", 26, 3, "left") },
  { area: "houses", tx: 7, ty: 9, to: dest("overworld", 18, 21, "down") },
  { area: "houses", tx: 22, ty: 9, to: dest("overworld", 32, 28, "down") },
  {
    area: "dungeon",
    tx: 22,
    ty: 29,
    to: dest("overworld", 40.5, 15.4, "down"),
  },
  { area: "mini", tx: 1, ty: 9, to: dest("overworld", 22, 44, "down") },
  { area: "mini", tx: 28, ty: 3, to: dest("overworld", 31, 44, "right") },
];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** The temple's push blocks, where they start. */
const BLOCK_HOMES = findTiles("dungeon", TILE_CHARS.block);

/** The temple's floor plates. */
const PLATES = findTiles("dungeon", TILE_CHARS.plate);

/**
 * Where walking onto a tile leads.
 *
 * @param area - which map
 * @param tx - tile column
 * @param ty - tile row
 * @returns the destination, or null if the tile goes nowhere
 */
export function warpAt(
  area: AreaId,
  tx: number,
  ty: number,
): Destination | null {
  const warp = WARPS.find(
    (one) => one.area === area && one.tx === tx && one.ty === ty,
  );
  return warp?.to ?? null;
}

/**
 * Puts Link somewhere else and sets the new place up.
 *
 * @param state - the game
 * @param to - where he goes
 */
export function moveTo(state: GameState, to: Destination): void {
  const player = state.player;
  const changed = state.area !== to.area;
  state.area = to.area;
  player.x = to.x;
  player.y = to.y;
  player.facing = to.facing;
  player.vx = 0;
  player.vy = 0;
  player.action = { kind: "idle" };
  player.charge = 0;
  player.knockT = 0;
  player.carrying = false;
  state.enemies = [];
  state.shots = [];
  state.bombs = [];
  state.boomerang = null;
  state.hook = null;
  state.pickups = [];
  state.effects = [];
  state.rocks = [];
  if (changed) {
    state.cut.clear();
    state.dug.clear();
  }
  for (const spawn of state.spawns) {
    if (spawn.area === to.area) {
      spawn.deadAt = null;
      spawn.alive = false;
    }
  }
  placeFinds(state);
  enterRoom(state, roomAt(to.area, to.x, to.y));
}

/**
 * Sets up a room Link has just walked into.
 *
 * @param state - the game
 * @param room - the room, or -1 out in the open
 */
export function enterRoom(state: GameState, room: number): void {
  const previous = state.room;
  state.room = room;
  if (state.area === "dungeon") {
    state.visited.add(room);
    state.enemies = state.enemies.filter((enemy) => {
      const keep = state.spawns[enemy.spawn].room === room;
      if (!keep) {
        state.spawns[enemy.spawn].alive = false;
      }
      return keep;
    });
    if (previous !== room) {
      state.shots = [];
      state.bombs = [];
      state.rocks = [];
      state.hook = null;
    }
    placeBlocks(state, room);
    placeBossContainer(state, room);
  } else {
    state.blocks = [];
  }
}

/**
 * Where the camera rests in a room.
 *
 * @param state - the game
 * @returns the camera's top-left corner
 */
export function roomCamera(state: GameState): {
  readonly x: number;
  readonly y: number;
} {
  return roomOrigin(state.area, state.room);
}

/** Lays out the heart containers and pieces still to be found here. */
function placeFinds(state: GameState): void {
  if (state.area === "overworld") {
    CONTAINER_SPOTS.forEach((spot, index) => {
      if (!state.takenContainers.has(index)) {
        state.pickups.push(
          lasting(state, "container", spot, containerSpot(index)),
        );
      }
    });
  }
  for (const tile of findTiles(state.area, TILE_CHARS.piece)) {
    const flag = tileFlag("piece", state.area, tile.tx, tile.ty);
    if (!state.flags.has(flag)) {
      state.pickups.push(
        lasting(state, "piece", tileCentre(tile.tx, tile.ty), flag),
      );
    }
  }
}

/**
 * The spot name of a heart container.
 *
 * @param index - its number
 * @returns the name stored on its pickup
 */
export function containerSpot(index: number): string {
  return `container:${index}`;
}

/**
 * The number of a heart container, from its spot name.
 *
 * @param spot - the name stored on its pickup
 * @returns its number
 */
export function containerIndex(spot: string): number {
  return Number(spot.slice(containerSpot(0).length - 1));
}

/** Puts the room's push block at home - or on its plate, once pressed. */
function placeBlocks(state: GameState, room: number): void {
  const pressed = state.flags.has(`switch:${room}`);
  const inRoom = (tile: { readonly tx: number; readonly ty: number }) =>
    roomAt("dungeon", tile.tx * TILE, tile.ty * TILE) === room;
  const plate = PLATES.find(inRoom);
  state.blocks = BLOCK_HOMES.filter(inRoom).map((tile) => {
    const at = pressed && plate !== undefined ? plate : tile;
    return { x: at.tx * TILE, y: at.ty * TILE, target: null, room };
  });
}

/**
 * The guardian's heart container waits in its room until taken.
 *
 * @param state - the game
 * @param room - the room Link is in
 */
export function placeBossContainer(state: GameState, room: number): void {
  const bossRoom = roomAt("dungeon", BOSS_CONTAINER_AT.x, BOSS_CONTAINER_AT.y);
  const waiting =
    room === bossRoom &&
    state.flags.has(BOSS_FLAG) &&
    !state.takenContainers.has(BOSS_CONTAINER) &&
    !state.pickups.some((pickup) => pickup.kind === "container");
  if (waiting) {
    state.pickups.push(
      lasting(
        state,
        "container",
        BOSS_CONTAINER_AT,
        containerSpot(BOSS_CONTAINER),
      ),
    );
  }
}

/** A find that stays where it lies until picked up. */
function lasting(
  state: GameState,
  kind: Pickup["kind"],
  at: { readonly x: number; readonly y: number },
  spot: string,
): Pickup {
  const id = state.nextId;
  state.nextId += 1;
  return { id, kind, x: at.x, y: at.y, z: 0, vz: 0, life: null, spot };
}

/** A destination in tiles. */
function dest(area: AreaId, tx: number, ty: number, facing: Dir): Destination {
  return { area, ...tileCentre(tx, ty), facing };
}
