/**
 * Binokel settings, stored per game in the browser.
 *
 * @module
 * @remarks
 * Each game keeps its own settings under its own storage key, so Binokel and
 * Drecksau never read each other's. For now the only choice is the deck size
 * (with or without sevens); it takes effect on the next match, since the deck
 * is dealt when a match starts.
 */
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the stored settings - raise it on breaking changes. */
const SETTINGS_VERSION = 1;

/** Key of the Binokel settings entry. */
const SETTINGS_KEY = storageKey("binokel", "settings");

/** What the player can configure for Binokel. */
export type BinokelSettings = {
  /** True for the 48-card deck (with sevens), false for 40 cards. */
  readonly withSevens: boolean;
};

/**
 * The settings before the player has changed anything.
 *
 * @returns the defaults: the classic 48-card deck with sevens
 */
export function defaultBinokelSettings(): BinokelSettings {
  return { withSevens: true };
}

/**
 * Loads the Binokel settings.
 *
 * @returns the stored settings, or the defaults if nothing is stored
 */
export function loadBinokelSettings(): BinokelSettings {
  return (
    readStored(SETTINGS_KEY, SETTINGS_VERSION, isBinokelSettings) ??
    defaultBinokelSettings()
  );
}

/**
 * Stores the Binokel settings.
 *
 * @param settings - the settings to store
 */
export function saveBinokelSettings(settings: BinokelSettings): void {
  writeStored(SETTINGS_KEY, SETTINGS_VERSION, settings);
}

/**
 * Checks that an unknown value really is {@link BinokelSettings}.
 *
 * @param value - the value to check, e.g. straight from storage
 * @returns true if the shape matches
 */
export function isBinokelSettings(value: unknown): value is BinokelSettings {
  const settings = value as BinokelSettings;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof settings.withSevens === "boolean"
  );
}
