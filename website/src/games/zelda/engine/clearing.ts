/**
 * Which tiles have stopped blocking: cut bushes, lifted rocks, blown walls,
 * unlocked doors, open shutters and chests that have not appeared yet - and
 * the names under which such lasting changes are remembered.
 *
 * @module
 */
import {
  TILE,
  TILE_CHARS,
  findTiles,
  roomAt,
  tileAt,
  tileIndex,
} from "./tiles";
import type { AreaId, GameState } from "./types";

/** What opens a shutter door in a temple room. */
type ShutterRule = "clear" | "switch";

/**
 * The temple rooms with shutters, and what opens them.
 *
 * @remarks
 * "clear" shutters stand open until Link walks in, then slam shut behind him
 * until every monster in the room is beaten - the guardian rooms. "switch"
 * shutters open for good once the floor plate is weighed down.
 */
const SHUTTER_RULES: Readonly<Partial<Record<number, ShutterRule>>> = {
  1: "clear",
  4: "switch",
  6: "clear",
};

/** What makes a hidden chest appear. */
type ChestRule = "torches" | "boss";

/** Hidden temple chests by tile ("column,row"), and what reveals them. */
const CHEST_RULES: Readonly<Record<string, ChestRule>> = {
  "7,2": "torches",
  "22,2": "boss",
};

/** The temple's cold torches. */
const TORCHES = findTiles("dungeon", TILE_CHARS.torch);

/** Flag of the beaten temple guardian. */
export const BOSS_FLAG = "boss";

/** Flag of the beaten armoured beetle. */
export const MINIBOSS_FLAG = "miniboss";

/**
 * The name a lasting change of one tile is remembered under.
 *
 * @param kind - what happened: "door", "chest", "torch", "piece"
 * @param area - which map
 * @param tx - tile column
 * @param ty - tile row
 * @returns the flag
 */
export function tileFlag(
  kind: string,
  area: AreaId,
  tx: number,
  ty: number,
): string {
  return `${kind}:${area}:${tileIndex(area, tx, ty)}`;
}

/**
 * The key of a blown-open rock or wall in {@link GameState.opened}.
 *
 * @param area - which map
 * @param tx - tile column
 * @param ty - tile row
 * @returns the key
 */
export function openedKey(area: AreaId, tx: number, ty: number): string {
  return `${area}:${tileIndex(area, tx, ty)}`;
}

/**
 * Whether a tile has been cleared out of the way.
 *
 * @param state - the game
 * @param tx - tile column
 * @param ty - tile row
 * @param forPlayer - asked for Link, who fits through mouse holes when small
 * @returns true when it no longer blocks
 */
export function isCleared(
  state: GameState,
  tx: number,
  ty: number,
  forPlayer = false,
): boolean {
  const area = state.area;
  const letter = tileAt(area, tx, ty);
  let cleared: boolean;
  switch (letter) {
    case TILE_CHARS.crackedRock:
    case TILE_CHARS.crackedWall:
      cleared = state.opened.has(openedKey(area, tx, ty));
      break;
    case TILE_CHARS.lockedDoor:
    case TILE_CHARS.bossDoor:
      cleared = state.flags.has(tileFlag("door", area, tx, ty));
      break;
    case TILE_CHARS.shutter:
      cleared = shutterOpen(state, tx, ty);
      break;
    case TILE_CHARS.mouseHole:
      cleared = forPlayer && state.player.small;
      break;
    case TILE_CHARS.chest:
      cleared = !chestVisible(state, tx, ty);
      break;
    default:
      cleared = state.cut.has(tileIndex(area, tx, ty));
  }
  return cleared;
}

/**
 * Whether a shutter door stands open right now.
 *
 * @param state - the game
 * @param tx - tile column
 * @param ty - tile row
 * @returns true when Link can walk through
 */
export function shutterOpen(state: GameState, tx: number, ty: number): boolean {
  const room = roomAt(state.area, tx * TILE + TILE / 2, ty * TILE + TILE / 2);
  const rule = state.area === "dungeon" ? SHUTTER_RULES[room] : undefined;
  let open: boolean;
  switch (rule) {
    case "clear":
      open = state.flags.has(`clear:${room}`) || state.room !== room;
      break;
    case "switch":
      open = state.flags.has(`switch:${room}`);
      break;
    default:
      open = true;
  }
  return open;
}

/**
 * Whether a room's shutters slam shut while monsters live.
 *
 * @param room - the temple room
 * @returns true for the guardian rooms
 */
export function isLockRoom(room: number): boolean {
  return SHUTTER_RULES[room] === "clear";
}

/**
 * Whether a chest is there to be seen - some appear only once a puzzle is done.
 *
 * @param state - the game
 * @param tx - tile column
 * @param ty - tile row
 * @returns true when it is visible
 */
export function chestVisible(
  state: GameState,
  tx: number,
  ty: number,
): boolean {
  const rule =
    state.area === "dungeon" ? CHEST_RULES[`${tx},${ty}`] : undefined;
  let visible: boolean;
  switch (rule) {
    case "torches":
      visible = roomTorchesLit(state, roomAt(state.area, tx * TILE, ty * TILE));
      break;
    case "boss":
      visible = state.flags.has(BOSS_FLAG);
      break;
    default:
      visible = true;
  }
  return visible;
}

/**
 * Whether every torch in a temple room burns.
 *
 * @param state - the game
 * @param room - the room
 * @returns true when none is cold
 */
export function roomTorchesLit(state: GameState, room: number): boolean {
  return TORCHES.filter(
    (torch) => roomAt("dungeon", torch.tx * TILE, torch.ty * TILE) === room,
  ).every((torch) =>
    state.flags.has(tileFlag("torch", "dungeon", torch.tx, torch.ty)),
  );
}
