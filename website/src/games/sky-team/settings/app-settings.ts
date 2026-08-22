/**
 * The one thing there is to choose before a landing.
 *
 * @module
 * @remarks
 * Short, because Sky Team has no options: two seats, one scenario, seven
 * rounds. What is left is which of the two seats you take against the computer
 * - and that is a real choice, because the two do different jobs. The pilot has
 * the gear and the brakes, the co-pilot the flaps.
 */
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the stored choice. */
const SEAT_VERSION = 1;

/** Storage key of the seat you last flew. */
const SEAT_KEY = storageKey("sky-team", "seat");

/** What a landing against the computer needs to know. */
export type SkyTeamSettings = {
  /** True to fly the left-hand seat. */
  readonly asPilot: boolean;
};

/** The seat somebody gets who has never chosen. */
export const DEFAULT_SETTINGS: SkyTeamSettings = { asPilot: true };

/**
 * The seat last flown.
 *
 * @returns the stored settings, or the default
 */
export function loadSettings(): SkyTeamSettings {
  return { asPilot: readStored(SEAT_KEY, SEAT_VERSION, isBool) ?? true };
}

/**
 * Remembers the seat for next time.
 *
 * @param settings - what was chosen
 */
export function saveSettings(settings: SkyTeamSettings): void {
  writeStored(SEAT_KEY, SEAT_VERSION, settings.asPilot);
}

/** Whether a stored value is a switch. */
function isBool(value: unknown): value is boolean {
  return typeof value === "boolean";
}
