/**
 * How big a crew turns out.
 *
 * @module
 * @remarks
 * The only choice there is. One to six, and it changes the game more than a
 * number usually does: every extra pair of hands is four more action points a
 * round, but also one more turn before the fire gets another roll.
 */
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/games/flash-point/engine/setup";

/** Schema version of the stored choice. */
const CREW_VERSION = 1;

/** Storage key of the crew size. */
const CREW_KEY = storageKey("flash-point", "crew");

/** What a call-out against the computer needs to know. */
export type FlashPointSettings = {
  /** How many firefighters in all, you included. */
  readonly crew: number;
};

/** The crew somebody gets who has never chosen. */
export const DEFAULT_SETTINGS: FlashPointSettings = { crew: 3 };

/** The sizes on offer. */
export const CREW_SIZES: readonly number[] = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (unused, index) => MIN_PLAYERS + index,
);

/**
 * The crew last taken out.
 *
 * @returns the stored settings, or the default
 */
export function loadSettings(): FlashPointSettings {
  const stored = readStored(CREW_KEY, CREW_VERSION, isCrew);
  return { crew: stored ?? DEFAULT_SETTINGS.crew };
}

/**
 * Remembers the crew for next time.
 *
 * @param settings - what was chosen
 */
export function saveSettings(settings: FlashPointSettings): void {
  writeStored(CREW_KEY, CREW_VERSION, clamp(settings.crew));
}

/** Holds a crew size inside what the game can seat. */
export function clamp(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, Math.round(value)))
    : DEFAULT_SETTINGS.crew;
}

/** Whether a stored value is a crew size. */
function isCrew(value: unknown): value is number {
  return (
    typeof value === "number" && value >= MIN_PLAYERS && value <= MAX_PLAYERS
  );
}
