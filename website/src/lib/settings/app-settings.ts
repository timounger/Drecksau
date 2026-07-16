/**
 * Settings of the app, stored in the browser.
 *
 * @module
 */
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the stored settings - raise it on breaking changes. */
const SETTINGS_VERSION = 1;

/** Key of the settings entry - app wide, not per game. */
const SETTINGS_KEY = storageKey("settings");

/** What the player can configure. */
export type AppSettings = {
  /** Whether the card effects are animated. */
  readonly areAnimationsEnabled: boolean;
  /**
   * Whether the Sauschön expansion is part of new games.
   *
   * @remarks
   * Off by default - the base game is what people know. Switching it only
   * affects the next game, since deck and pig count are dealt at the start.
   */
  readonly isExpansionEnabled: boolean;
};

/**
 * Loads the settings.
 *
 * @returns the stored settings, or the defaults if nothing is stored
 */
export function loadSettings(): AppSettings {
  return (
    readStored(SETTINGS_KEY, SETTINGS_VERSION, isAppSettings) ??
    defaultSettings()
  );
}

/**
 * Stores the settings.
 *
 * @param settings - the settings to store
 */
export function saveSettings(settings: AppSettings): void {
  writeStored(SETTINGS_KEY, SETTINGS_VERSION, settings);
}

/**
 * The settings before the player has changed anything.
 *
 * @returns animations on, unless the system asks for reduced motion
 * @remarks
 * Animations are on by default. The one exception is an explicit
 * `prefers-reduced-motion: reduce` from the operating system: people set that
 * because moving interfaces make them ill, and it would be rude to override
 * it. They can still switch animations on by hand.
 */
export function defaultSettings(): AppSettings {
  return {
    areAnimationsEnabled: !prefersReducedMotion(),
    isExpansionEnabled: false,
  };
}

/**
 * Tells whether the system asks for as little motion as possible.
 *
 * @returns true if the media query matches; false during prerender
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Checks that an unknown value really is {@link AppSettings}.
 *
 * @param value - the value to check, e.g. straight from storage
 * @returns true if the shape matches
 */
export function isAppSettings(value: unknown): value is AppSettings {
  const settings = value as AppSettings;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof settings.areAnimationsEnabled === "boolean" &&
    typeof settings.isExpansionEnabled === "boolean"
  );
}
