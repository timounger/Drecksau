/**
 * Checking a saved game read back from the browser before trusting it.
 *
 * @module
 */
import {
  ANIMAL_IDS,
  AREA_IDS,
  CHARACTER_IDS,
  type SaveData,
  type SavedCharacter,
} from "./types";

/** The facings a save may hold. */
const DIRS: readonly string[] = ["down", "up", "left", "right"];

/**
 * Whether a stored value is a save of this game.
 *
 * @param value - what was read
 * @returns true when it has the shape of {@link SaveData}
 */
export function isSaveData(value: unknown): value is SaveData {
  let ok = false;
  if (typeof value === "object" && value !== null) {
    const data = value as Partial<SaveData>;
    ok =
      typeof data.active === "string" &&
      (CHARACTER_IDS as readonly string[]).includes(data.active) &&
      Array.isArray(data.chars) &&
      data.chars.every(isSavedCharacter) &&
      (data.gates === undefined ||
        (Array.isArray(data.gates) &&
          data.gates.every((number) => typeof number === "number")));
  }
  return ok;
}

/** Whether one entry is a saved character. */
function isSavedCharacter(value: unknown): value is SavedCharacter {
  let ok = false;
  if (typeof value === "object" && value !== null) {
    const data = value as Partial<SavedCharacter>;
    ok =
      typeof data.id === "string" &&
      (CHARACTER_IDS as readonly string[]).includes(data.id) &&
      (data.area === undefined ||
        (typeof data.area === "string" &&
          (AREA_IDS as readonly string[]).includes(data.area))) &&
      typeof data.x === "number" &&
      Number.isFinite(data.x) &&
      typeof data.y === "number" &&
      Number.isFinite(data.y) &&
      typeof data.dir === "string" &&
      DIRS.includes(data.dir) &&
      (data.form === null ||
        (typeof data.form === "string" &&
          (ANIMAL_IDS as readonly string[]).includes(data.form))) &&
      typeof data.flying === "boolean";
  }
  return ok;
}
