/**
 * Remembers the room creator's last lobby choices, so hosting again starts
 * from the same settings.
 *
 * @module
 * @remarks
 * Kept apart from the app settings: these are the host's per-lobby deck and
 * auto-play choices, not the personal preferences the rest of the app reads.
 * Stored per browser like everything else, via {@link ./storage/local-store}.
 */
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the stored host settings - raise it on breaking changes. */
const HOST_SETTINGS_VERSION = 1;

/** Storage key for the host's lobby settings. */
const HOST_SETTINGS_KEY = storageKey("online", "host-settings");

/** Default auto-play timeout, in milliseconds - a sensible 30 seconds. */
const DEFAULT_AUTO_PLAY_MS = 30_000;

/** The room creator's lobby choices. */
export type OnlineHostSettings = {
  readonly withExpansion: boolean;
  readonly withDefense: boolean;
  /** Auto-play timeout in milliseconds, or null for none. */
  readonly autoPlayMs: number | null;
};

/** What a first-time host sees before they change anything. */
export const defaultOnlineHostSettings: OnlineHostSettings = {
  withExpansion: false,
  withDefense: false,
  autoPlayMs: DEFAULT_AUTO_PLAY_MS,
};

/**
 * Loads the host's last lobby settings.
 *
 * @returns the stored settings, or the defaults if none are usable
 */
export function loadOnlineHostSettings(): OnlineHostSettings {
  return (
    readStored(
      HOST_SETTINGS_KEY,
      HOST_SETTINGS_VERSION,
      isOnlineHostSettings,
    ) ?? defaultOnlineHostSettings
  );
}

/**
 * Stores the host's lobby settings.
 *
 * @param settings - the choices to remember
 */
export function saveOnlineHostSettings(settings: OnlineHostSettings): void {
  writeStored(HOST_SETTINGS_KEY, HOST_SETTINGS_VERSION, settings);
}

/**
 * Checks an unknown value has the shape of host settings.
 *
 * @param value - the value to check, e.g. straight from storage
 * @returns true if it can be used as host settings
 */
export function isOnlineHostSettings(
  value: unknown,
): value is OnlineHostSettings {
  const settings = value as OnlineHostSettings;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof settings.withExpansion === "boolean" &&
    typeof settings.withDefense === "boolean" &&
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
