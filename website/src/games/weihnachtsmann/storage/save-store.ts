/**
 * Where the positions, the chosen character, the won Advent gates and the
 * unlocked achievements are kept between visits.
 *
 * @module
 */
import { isSaveData } from "@/games/weihnachtsmann/engine/save";
import type { SaveData } from "@/games/weihnachtsmann/engine/types";
import {
  readStored,
  removeStored,
  storageKey,
  writeStored,
} from "@/lib/storage/local-store";

/** Schema version of the save: 4 knows the achievements. */
const SAVE_VERSION = 4;

/** The version from before the achievements; still read, none unlocked yet. */
const GATES_SAVE_VERSION = 3;

/** The version from before the gates; still read, no gate is won yet. */
const PLACES_SAVE_VERSION = 2;

/** The version from before the houses; still read, positions are reset. */
const OLD_SAVE_VERSION = 1;

/** Where the save lives. */
const SAVE_KEY = storageKey("weihnachtsmann", "save");

/**
 * Reads the saved game.
 *
 * @returns the save, or null when there is none or it is unusable
 * @remarks
 * A save of version 3 has no achievements: everything else is kept, and none
 * is unlocked yet. A save of version 2 has no gates: everybody keeps their place on the map,
 * which only grew, and no gate is won. A save of version 1 has no places
 * either; the game then keeps who is steered and starts everybody at their
 * start place (see `applySave` in the engine).
 */
export function loadSave(): SaveData | null {
  return (
    readStored(SAVE_KEY, SAVE_VERSION, isSaveData) ??
    readStored(SAVE_KEY, GATES_SAVE_VERSION, isGatesSave) ??
    readStored(SAVE_KEY, PLACES_SAVE_VERSION, isPlacesSave) ??
    readStored(SAVE_KEY, OLD_SAVE_VERSION, isOldSave)
  );
}

/**
 * Writes the game.
 *
 * @param save - what to keep
 */
export function writeSave(save: SaveData): void {
  writeStored(SAVE_KEY, SAVE_VERSION, save);
}

/** Whether a version 3 save looks right; it knows no achievements. */
function isGatesSave(value: unknown): value is SaveData {
  return isSaveData(value) && value.achievements === undefined;
}

/** Whether a version 2 save looks right; it knows no gates. */
function isPlacesSave(value: unknown): value is SaveData {
  return isSaveData(value) && value.gates === undefined;
}

/** Whether a version 1 save looks right; its characters carry no place. */
function isOldSave(value: unknown): value is SaveData {
  return (
    isSaveData(value) && value.chars.every((char) => char.area === undefined)
  );
}

/** Forgets the saved game. */
export function clearSave(): void {
  removeStored(SAVE_KEY);
}
