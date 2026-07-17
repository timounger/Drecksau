/**
 * Settings of the app, stored in the browser.
 *
 * @module
 */
import {
  DEFAULT_CARD_THEME,
  isCardTheme,
  type CardTheme,
} from "@/assets/cards/themes";
import { HUMAN_PLAYER_NAME as DEFAULT_HUMAN_NAME } from "@/i18n/translations";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the stored settings - raise it on breaking changes. */
const SETTINGS_VERSION = 1;

/** Key of the settings entry - app wide, not per game. */
const SETTINGS_KEY = storageKey("settings");

/** Longest name the UI can show without breaking the layout. */
export const MAX_PLAYER_NAME_LENGTH = 16;

/** What the player can configure. */
export type AppSettings = {
  /**
   * What the human player is called.
   *
   * @remarks
   * Empty means "no name given" - the game then addresses the player as "Du",
   * which is what it did before this setting existed.
   */
  readonly playerName: string;
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
  /**
   * Whether the "Drecksau total" defence cards are in.
   *
   * @remarks
   * Adds Extra-Matsch always and Lippenstift only alongside the expansion.
   * Off by default.
   */
  readonly areDefenseCardsEnabled: boolean;
  /**
   * Which card design is shown.
   *
   * @remarks
   * Purely visual, so it takes effect at once - no need to start a new game.
   */
  readonly cardTheme: CardTheme;
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
    playerName: "",
    areAnimationsEnabled: !prefersReducedMotion(),
    isExpansionEnabled: false,
    areDefenseCardsEnabled: false,
    cardTheme: DEFAULT_CARD_THEME,
  };
}

/**
 * The name to show for the human player.
 *
 * @param settings - the current settings
 * @returns the chosen name, or "Du" if none was given
 * @example
 * ```ts
 * humanName({ playerName: "  ", ... }); // "Du"
 * ```
 */
export function humanName(settings: AppSettings): string {
  const trimmed = settings.playerName.trim();
  return trimmed === "" ? DEFAULT_HUMAN_NAME : trimmed;
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
    typeof settings.playerName === "string" &&
    settings.playerName.length <= MAX_PLAYER_NAME_LENGTH &&
    typeof settings.areAnimationsEnabled === "boolean" &&
    typeof settings.isExpansionEnabled === "boolean" &&
    typeof settings.areDefenseCardsEnabled === "boolean" &&
    isCardTheme(settings.cardTheme)
  );
}
