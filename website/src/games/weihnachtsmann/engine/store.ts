/**
 * The gift store: a maze of parcel stacks with a lost present hidden in one
 * of its dead ends. Find it, carry it to the workshop - and now and then the
 * elves stack everything anew.
 *
 * @module
 * @remarks
 * The maze is made from the random numbers in the state: nine by five rooms,
 * two cells square, with walls of single stacks between them (a recursive
 * backtracker, a few walls taken out for loops). Some walls have a stack with
 * a mouse hole - only Jordi as a mouse slips through ({@link Terrain} "gap").
 * The present hides in a far dead end. The store's map is rebuilt from new
 * rows each time; nobody steered is inside when that happens, and who else
 * stands in the way is set down at the entrance. Nothing of it is saved.
 */
import { TOWN_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { steered, unlock } from "./achievements";
import {
  GIFT_STORE,
  MAZE_ENTRY,
  MAZE_H,
  MAZE_TOP,
  MAZE_W,
  storeHall,
} from "./building-data";
import { pickUp } from "./carry";
import { poof, say, spawn, SPARKLE_TINTS } from "./effects";
import { TILE, buildMap, fits, inBox, terrainAt, terrainUnder } from "./map";
import { currentProfile } from "./movement";
import { nextRandom, randomIn } from "./random";
import type { Character, GameMap, GameState, Spot, StoreState } from "./types";

/** Seconds between two restackings of the store. */
const SHUFFLE_SECONDS = 150;

/** Seconds until a new present is lost after one was brought home. */
const LOST_AGAIN = 45;

/** Seconds between two glints of the hidden present. */
const GLINT_EVERY = 1.6;

/** Walls taken out for loops, and walls given a mouse hole. */
const LOOPS = 5;
const MOUSE_HOLES = 6;

/** How many of the farthest dead ends the present may hide in. */
const FAR_ENDS = 3;

/** One maze room is this many cells across, with one cell of wall after it. */
const ROOM = 2;
const PITCH = ROOM + 1;

/** How far outside its room the present can still be reached, map px. */
const REACH_SLACK = 6;

/** Sparkles round the present delivered or found, and their speed. */
const BURST = 10;
const SPRAY = 18;

/** The four ways out of a maze room. */
const WAYS: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** A wall between two maze rooms, by their indices. */
type Wall = { readonly a: number; readonly b: number };

/**
 * The store as it is on a new game, before its first maze is laid.
 *
 * @returns the store
 */
export function createStore(): StoreState {
  return {
    present: "hidden",
    cell: -1,
    shuffleIn: SHUFFLE_SECONDS,
    lostIn: 0,
    glintIn: 0,
  };
}

/**
 * Stacks the parcels anew: a fresh maze, and the present - unless somebody
 * carries it - hidden in a far dead end.
 *
 * @param state - the game; its gift store map is replaced
 */
export function layStore(state: GameState): void {
  const rows = mazeRows(state);
  state.maps.giftStore = buildMap("giftStore", { ...GIFT_STORE, rows });
  const store = state.world.store;
  store.shuffleIn = SHUFFLE_SECONDS;
  if (store.present === "hidden") {
    hidePresent(state);
  }
  const entry = roomPoint(MAZE_ENTRY.x, MAZE_ENTRY.y);
  for (const char of state.chars) {
    if (
      char.area === "giftStore" &&
      !fits(state.maps.giftStore, currentProfile(char), char.x, char.y)
    ) {
      char.x = entry.x;
      char.y = entry.y;
    }
  }
}

/**
 * Runs the store on: the present glints, is brought home, is lost again, and
 * the parcels are restacked while nobody steered is inside.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateStore(state: GameState, dt: number): void {
  const store = state.world.store;
  const steeredChar = state.chars[state.active];
  for (const char of state.chars) {
    if (char.carry?.kind === "present" && char.area === "workshop") {
      deliver(state, char);
    }
  }
  if (store.present === "away") {
    store.lostIn -= dt;
    if (store.lostIn <= 0) {
      store.present = "hidden";
      hidePresent(state);
    }
  }
  if (store.present === "hidden") {
    store.glintIn -= dt;
    const at = presentPoint(state);
    if (store.glintIn <= 0 && at !== null) {
      store.glintIn = GLINT_EVERY;
      spawn(
        state,
        "sparkle",
        "giftStore",
        at.x,
        at.y - TILE / 2,
        0,
        -SPRAY / 2,
        0,
      );
    }
  }
  store.shuffleIn -= dt;
  if (
    store.shuffleIn <= 0 &&
    store.present !== "carried" &&
    steeredChar.area !== "giftStore"
  ) {
    layStore(state);
  }
  if (
    steeredChar.form === "maus" &&
    steeredChar.area === "giftStore" &&
    terrainUnder(state.maps.giftStore, steeredChar.x, steeredChar.y - 1) ===
      "gap"
  ) {
    unlock(state, "mouseGap");
  }
}

/**
 * Where the hidden present lies, its foot point.
 *
 * @param state - the game
 * @returns map px in the store, or null while it is not hidden there
 */
export function presentPoint(
  state: GameState,
): { x: number; y: number } | null {
  const store = state.world.store;
  const map = state.maps.giftStore;
  let at: { x: number; y: number } | null = null;
  if (store.present === "hidden" && store.cell >= 0) {
    const tx = store.cell % map.cols;
    const ty = Math.floor(store.cell / map.cols);
    at = { x: (tx + 1) * TILE, y: (ty + ROOM) * TILE - REACH_SLACK };
  }
  return at;
}

/**
 * The hidden present as a spot to use, if it is in reach.
 *
 * @param state - the game
 * @param char - the character steered
 * @param x - the point the talk key reaches, map px
 * @param y - the point the talk key reaches, map px
 * @returns the spot, or null
 */
export function presentSpot(
  state: GameState,
  char: Character,
  x: number,
  y: number,
): Spot | null {
  const store = state.world.store;
  const map = state.maps.giftStore;
  let spot: Spot | null = null;
  if (char.area === "giftStore" && store.present === "hidden") {
    const room: Spot = {
      kind: "lostGift",
      tx: store.cell % map.cols,
      ty: Math.floor(store.cell / map.cols),
      w: ROOM,
      h: ROOM,
    };
    if (inBox(room, x, y, REACH_SLACK) || inBox(room, char.x, char.y)) {
      spot = room;
    }
  }
  return spot;
}

/**
 * The talk key at the lost present: into the hands, off to the workshop.
 *
 * @param state - the game
 * @param char - who found it
 */
export function takePresent(state: GameState, char: Character): void {
  const at = presentPoint(state);
  if (at !== null && pickUp(char, "present")) {
    state.world.store.present = "carried";
    poof(state, "giftStore", at.x, at.y - TILE / 2);
    say(char, TOWN_TEXTS.presentFound);
    state.sounds.push("collect");
  }
}

/** The present reaches the workshop: sparkles, and the achievement. */
function deliver(state: GameState, char: Character): void {
  const store = state.world.store;
  char.carry = null;
  store.present = "away";
  store.lostIn = LOST_AGAIN;
  for (let k = 0; k < BURST; k += 1) {
    spawn(
      state,
      "sparkle",
      char.area,
      char.x,
      char.y - TILE,
      randomIn(state, -SPRAY, SPRAY),
      randomIn(state, -SPRAY, 0),
      k % SPARKLE_TINTS,
    );
  }
  say(char, TOWN_TEXTS.presentHome);
  state.sounds.push("collect");
  if (steered(state, char)) {
    unlock(state, "giftFound");
  }
}

/** Puts the present into one of the dead ends farthest from the door. */
function hidePresent(state: GameState): void {
  const map = state.maps.giftStore;
  const distance = roomDistances(map);
  const ends: number[] = [];
  for (let room = 0; room < MAZE_W * MAZE_H; room += 1) {
    if (
      room !== MAZE_ENTRY.y * MAZE_W + MAZE_ENTRY.x &&
      exits(map, room).length === 1
    ) {
      ends.push(room);
    }
  }
  ends.sort((a, b) => distance[b] - distance[a]);
  const choice = ends.slice(0, FAR_ENDS);
  const room =
    choice.length > 0
      ? choice[Math.floor(nextRandom(state) * choice.length)]
      : 0;
  const tx = 1 + (room % MAZE_W) * PITCH;
  const ty = MAZE_TOP + Math.floor(room / MAZE_W) * PITCH;
  state.world.store.cell = ty * map.cols + tx;
  state.world.store.glintIn = 0;
}

/** The feet in the middle of a maze room, map px. */
function roomPoint(cx: number, cy: number): { x: number; y: number } {
  return {
    x: (1 + cx * PITCH + 1) * TILE,
    y: (MAZE_TOP + cy * PITCH + ROOM) * TILE - REACH_SLACK,
  };
}

/** The maze rooms one can walk to from a room on this map (not as a mouse). */
function exits(map: GameMap, room: number): number[] {
  const cx = room % MAZE_W;
  const cy = Math.floor(room / MAZE_W);
  const found: number[] = [];
  for (const [dx, dy] of WAYS) {
    const nx = cx + dx;
    const ny = cy + dy;
    // The first cell of the wall between the two rooms.
    const wx = 1 + cx * PITCH + (dx > 0 ? ROOM : dx < 0 ? -1 : 0);
    const wy = MAZE_TOP + cy * PITCH + (dy > 0 ? ROOM : dy < 0 ? -1 : 0);
    if (
      nx >= 0 &&
      ny >= 0 &&
      nx < MAZE_W &&
      ny < MAZE_H &&
      terrainAt(map, wx, wy) === "floor"
    ) {
      found.push(ny * MAZE_W + nx);
    }
  }
  return found;
}

/** Steps from the entrance to every maze room. */
function roomDistances(map: GameMap): number[] {
  const distance: number[] = Array.from(
    { length: MAZE_W * MAZE_H },
    () => Infinity,
  );
  const start = MAZE_ENTRY.y * MAZE_W + MAZE_ENTRY.x;
  distance[start] = 0;
  const queue = [start];
  for (let head = 0; head < queue.length; head += 1) {
    const room = queue[head];
    for (const next of exits(map, room)) {
      if (distance[next] === Infinity) {
        distance[next] = distance[room] + 1;
        queue.push(next);
      }
    }
  }
  return distance;
}

/** A fresh maze as the store's rows: stacks `P`, mouse holes `m`, floor `_`. */
function mazeRows(state: GameState): string[] {
  const count = MAZE_W * MAZE_H;
  const open = new Set<string>();
  const key = (a: number, b: number) =>
    `${String(Math.min(a, b))}-${String(Math.max(a, b))}`;
  // Recursive backtracker from the entrance.
  const seen = new Set<number>([MAZE_ENTRY.y * MAZE_W + MAZE_ENTRY.x]);
  const stack = [MAZE_ENTRY.y * MAZE_W + MAZE_ENTRY.x];
  while (stack.length > 0) {
    const room = stack[stack.length - 1];
    const next = neighbours(room).filter((other) => !seen.has(other));
    if (next.length === 0) {
      stack.pop();
    } else {
      const other = next[Math.floor(nextRandom(state) * next.length)];
      open.add(key(room, other));
      seen.add(other);
      stack.push(other);
    }
  }
  const walls: Wall[] = [];
  for (let room = 0; room < count; room += 1) {
    for (const other of neighbours(room)) {
      if (other > room && !open.has(key(room, other))) {
        walls.push({ a: room, b: other });
      }
    }
  }
  for (let k = 0; k < LOOPS && walls.length > 0; k += 1) {
    const [wall] = walls.splice(
      Math.floor(nextRandom(state) * walls.length),
      1,
    );
    open.add(key(wall.a, wall.b));
  }
  // Mouse holes only in walls between a room and the one below it: a hole
  // in a wall running up and down would hide behind the stack in front.
  const across = walls.filter((wall) => wall.b - wall.a === MAZE_W);
  const holes = new Set<string>();
  for (let k = 0; k < MOUSE_HOLES && across.length > 0; k += 1) {
    const [wall] = across.splice(
      Math.floor(nextRandom(state) * across.length),
      1,
    );
    holes.add(key(wall.a, wall.b));
  }
  const rows = storeHall().map((row) => [...row]);
  for (let ly = 0; ly < MAZE_H * PITCH - 1; ly += 1) {
    for (let lx = 0; lx < MAZE_W * PITCH - 1; lx += 1) {
      const wallX = lx % PITCH === ROOM;
      const wallY = ly % PITCH === ROOM;
      const cx = Math.floor(lx / PITCH);
      const cy = Math.floor(ly / PITCH);
      let letter = "_";
      if (wallX && wallY) {
        letter = "P";
      } else if (wallX || wallY) {
        const a = cy * MAZE_W + cx;
        const b = wallX ? a + 1 : a + MAZE_W;
        const along = wallX ? ly % PITCH : lx % PITCH;
        if (holes.has(key(a, b)) && along === (wallX ? 1 : 0)) {
          letter = "m";
        } else if (!open.has(key(a, b))) {
          letter = "P";
        }
      }
      rows[MAZE_TOP + ly][1 + lx] = letter;
    }
  }
  return rows.map((row) => row.join(""));
}

/** The maze rooms next to one, in all four ways. */
function neighbours(room: number): number[] {
  const cx = room % MAZE_W;
  const cy = Math.floor(room / MAZE_W);
  return WAYS.filter(([dx, dy]) => {
    const nx = cx + dx;
    const ny = cy + dy;
    return nx >= 0 && ny >= 0 && nx < MAZE_W && ny < MAZE_H;
  }).map(([dx, dy]) => (cy + dy) * MAZE_W + cx + dx);
}
