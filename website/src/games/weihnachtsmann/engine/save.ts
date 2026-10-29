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
  type SavedAchievement,
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
          data.gates.every((number) => typeof number === "number"))) &&
      (data.achievements === undefined ||
        (Array.isArray(data.achievements) &&
          data.achievements.every(isSavedAchievement))) &&
      (data.progress === undefined || isRecordOf(data.progress, isTextList)) &&
      (data.counts === undefined || isRecordOf(data.counts, isCount));
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

/** Whether one entry is a saved achievement. */
function isSavedAchievement(value: unknown): value is SavedAchievement {
  let ok = false;
  if (typeof value === "object" && value !== null) {
    const data = value as Partial<SavedAchievement>;
    ok =
      typeof data.id === "string" &&
      typeof data.at === "number" &&
      Number.isFinite(data.at);
  }
  return ok;
}

/** Whether a value is a plain object whose every value passes a test. */
function isRecordOf(
  value: unknown,
  test: (entry: unknown) => boolean,
): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(test)
  );
}

/** Whether a value is a list of texts. */
function isTextList(value: unknown): boolean {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

/** Whether a value is a count: a finite number. */
function isCount(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value);
}
