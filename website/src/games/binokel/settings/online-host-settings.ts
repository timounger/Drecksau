/**
 * Remembers the Binokel room creator's last lobby choices, so hosting again
 * starts from the same settings.
 *
 * @module
 * @remarks
 * Kept apart from the per-game Binokel settings: these are the host's per-lobby
 * deck and auto-play choices, not the personal preferences the rest of the app
 * reads. Stored per browser under a Binokel-specific key so it never clashes
 * with another game's host settings.
 */
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the stored host settings - raise it on breaking changes. */
const HOST_SETTINGS_VERSION = 1;

/** Storage key for the Binokel host's lobby settings. */
const HOST_SETTINGS_KEY = storageKey("binokel", "online-host-settings");

/** Default auto-play timeout, in milliseconds - a sensible 30 seconds. */
const DEFAULT_AUTO_PLAY_MS = 30_000;

/** The room creator's lobby choices. */
export type BinokelHostSettings = {
  /** True for the 48-card deck (with sevens). */
  readonly withSevens: boolean;
  /** Whether a Dabb (widow) is played. */
  readonly withDabb: boolean;
  /** Whether two teams play (four or six players). */
  readonly teams: boolean;
  /** Auto-play timeout in milliseconds, or null for none. */
  readonly autoPlayMs: number | null;
};

/** What a first-time host sees before they change anything. */
export const defaultBinokelHostSettings: BinokelHostSettings = {
  withSevens: true,
  withDabb: true,
  teams: false,
  autoPlayMs: DEFAULT_AUTO_PLAY_MS,
};

/**
 * Loads the host's last lobby settings.
 *
 * @returns the stored settings, or the defaults if none are usable
 */
export function loadBinokelHostSettings(): BinokelHostSettings {
  return (
    readStored(
      HOST_SETTINGS_KEY,
      HOST_SETTINGS_VERSION,
      isBinokelHostSettings,
    ) ?? defaultBinokelHostSettings
  );
}

/**
 * Stores the host's lobby settings.
 *
 * @param settings - the choices to remember
 */
export function saveBinokelHostSettings(settings: BinokelHostSettings): void {
  writeStored(HOST_SETTINGS_KEY, HOST_SETTINGS_VERSION, settings);
}

/**
 * Checks an unknown value has the shape of host settings.
 *
 * @param value - the value to check, e.g. straight from storage
 * @returns true if it can be used as host settings
 */
export function isBinokelHostSettings(
  value: unknown,
): value is BinokelHostSettings {
  const settings = value as BinokelHostSettings;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof settings.withSevens === "boolean" &&
    typeof settings.withDabb === "boolean" &&
    typeof settings.teams === "boolean" &&
    isTimeout(settings.autoPlayMs)
  );
}

/** A valid auto-play timeout: null, or a positive whole number of ms. */
function isTimeout(value: unknown): boolean {
  return (
    value === null ||
    (typeof value === "number" && Number.isInteger(value) && value > 0)
  );
}
