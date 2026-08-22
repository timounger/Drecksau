/**
 * The Game settings, stored in the browser.
 *
 * @module
 * @remarks
 * Kept under this game's own key, so it does not collide with the other games'
 * settings. Anything unknown or out of range falls back to the default, which
 * keeps a hand-edited or outdated entry from breaking a game.
 */
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  handSizeFor,
  type Variant,
} from "@/games/the-game/engine/state";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the stored settings - raise it on breaking changes. */
const SETTINGS_VERSION = 1;

/** Key of the settings entry. */
const SETTINGS_KEY = storageKey("the-game", "settings");

/**
 * Table size of a first-time visitor's game.
 *
 * @remarks
 * Three. The solo variant is in the box and it works, but it is a puzzle rather
 * than the game - what makes this one what it is, is somebody else laying a
 * card on a row you were saving, without either of you being allowed to say so.
 */
export const DEFAULT_PLAYER_COUNT = 3;

/** The table sizes on offer, the solo variant included. */
export const PLAYER_COUNTS: readonly number[] = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (unused, index) => MIN_PLAYERS + index,
);

/** The variants on offer, easiest first. */
export const VARIANTS: readonly Variant[] = ["normal", "profi", "profiPlus"];

/** What the player can configure. */
export type TheGameSettings = {
  /** How many sit at the table, the human included. */
  readonly playerCount: number;
  /** How hard the table wants it. */
  readonly variant: Variant;
};

/** What a first-time visitor gets. */
export const DEFAULT_SETTINGS: TheGameSettings = {
  playerCount: DEFAULT_PLAYER_COUNT,
  variant: "normal",
};

/**
 * Loads the stored settings.
 *
 * @returns the settings, with anything missing or unusable defaulted
 */
export function loadSettings(): TheGameSettings {
  const stored = readStored(SETTINGS_KEY, SETTINGS_VERSION, isPartialSettings);
  return {
    playerCount: clampPlayers(stored?.playerCount),
    variant: clampVariant(stored?.variant),
  };
}

/**
 * Stores the settings.
 *
 * @param settings - the settings to keep for next time
 */
export function saveSettings(settings: TheGameSettings): void {
  writeStored(SETTINGS_KEY, SETTINGS_VERSION, {
    playerCount: clampPlayers(settings.playerCount),
    variant: clampVariant(settings.variant),
  });
}

/**
 * Holds a table size inside what the game can actually seat.
 *
 * @param count - the value read back from storage or a control
 * @returns a seatable table size
 */
export function clampPlayers(count: unknown): number {
  return typeof count === "number" && Number.isFinite(count)
    ? Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, Math.round(count)))
    : DEFAULT_PLAYER_COUNT;
}

/**
 * Holds a variant to one this game knows.
 *
 * @param variant - the value read back from storage or a control
 * @returns a playable variant
 */
export function clampVariant(variant: unknown): Variant {
  return VARIANTS.includes(variant as Variant)
    ? (variant as Variant)
    : "normal";
}

/**
 * How many cards a hand holds under these settings.
 *
 * @param settings - the settings as they stand
 * @returns the hand size, for the settings screen to show
 */
export function handSizeOf(settings: TheGameSettings): number {
  return handSizeFor(settings.playerCount, settings.variant);
}

/** Whether a stored value could be a settings object at all. */
function isPartialSettings(value: unknown): value is Partial<TheGameSettings> {
  return typeof value === "object" && value !== null;
}
