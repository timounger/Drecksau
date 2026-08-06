/**
 * How far along the map you were, remembered between visits.
 *
 * @module
 * @remarks
 * One number: the section you were last at. Coming back tomorrow and being
 * put in the valley again, after an evening of winching up a mountain, is the
 * kind of thing that makes people not come back.
 *
 * localStorage does not exist during the prerender, so this may only be read
 * after hydration.
 */
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";
import { SECTION_COUNT } from "@/games/rv-there-yet/engine/map";

/** Schema version of the stored value - raise it on breaking changes. */
const PROGRESS_VERSION = 1;

/** Where it lives. */
const PROGRESS_KEY = storageKey("rv-there-yet", "section");

/**
 * The section to start at.
 *
 * @returns the stored section, or the first one
 * @remarks
 * A stored number from an older, longer map - or one somebody typed in by hand -
 * must never put the motorhome somewhere the map does not go, so it is held
 * inside the range that exists now.
 */
export function loadSection(): number {
  const stored = readStored(PROGRESS_KEY, PROGRESS_VERSION, isNumber);
  if (stored === null) {
    return 0;
  }
  return Math.min(SECTION_COUNT - 1, Math.max(0, Math.floor(stored)));
}

/**
 * Remembers the section for next time.
 *
 * @param section - the one just reached or jumped to
 */
export function saveSection(section: number): void {
  writeStored(PROGRESS_KEY, PROGRESS_VERSION, section);
}

/** Whether a stored value is a usable number. */
function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
