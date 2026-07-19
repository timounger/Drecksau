/**
 * Binokel settings, stored per game in the browser.
 *
 * @module
 * @remarks
 * Each game keeps its own settings under its own storage key, so Binokel and
 * Drecksau never read each other's. The deck size takes effect on the next
 * match (the deck is dealt at the start); the suit order sorts the hand and
 * applies at once.
 */
import { SUITS, type Suit } from "@/games/binokel/engine/cards";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/games/binokel/engine/setup";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the stored settings - raise it on breaking changes. */
const SETTINGS_VERSION = 1;

/** Key of the Binokel settings entry. */
const SETTINGS_KEY = storageKey("binokel", "settings");

/** What the player can configure for Binokel. */
export type BinokelSettings = {
  /** True for the 48-card deck (with sevens), false for 40 cards. */
  readonly withSevens: boolean;
  /** Whether a Dabb (widow) is played. */
  readonly withDabb: boolean;
  /** The order the suits are grouped in when the hand is sorted, left to right. */
  readonly suitOrder: readonly Suit[];
  /** How many players sit at the table (you plus computer opponents). */
  readonly playerCount: number;
  /** Whether two teams play (only takes effect for four or six players). */
  readonly teams: boolean;
};

/**
 * The settings before the player has changed anything.
 *
 * @returns the defaults: the 48-card deck, a Dabb, natural order, three players
 */
export function defaultBinokelSettings(): BinokelSettings {
  return {
    withSevens: true,
    withDabb: true,
    suitOrder: [...SUITS],
    playerCount: MIN_PLAYERS,
    teams: false,
  };
}

/**
 * Loads the Binokel settings.
 *
 * @returns the stored settings, or the defaults if nothing is stored
 * @remarks
 * Settings stored before the suit order existed still load - the order is then
 * filled in with the default.
 */
export function loadBinokelSettings(): BinokelSettings {
  const stored = readStored(SETTINGS_KEY, SETTINGS_VERSION, isStoredSettings);
  return stored === null
    ? defaultBinokelSettings()
    : {
        withSevens: stored.withSevens,
        withDabb: typeof stored.withDabb === "boolean" ? stored.withDabb : true,
        suitOrder: normalizeSuitOrder(stored.suitOrder),
        playerCount: normalizePlayerCount(stored.playerCount),
        teams: stored.teams === true,
      };
}

/**
 * Stores the Binokel settings.
 *
 * @param settings - the settings to store
 */
export function saveBinokelSettings(settings: BinokelSettings): void {
  writeStored(SETTINGS_KEY, SETTINGS_VERSION, settings);
}

/** The stored shape - order and player count may be absent in older data. */
type StoredSettings = {
  readonly withSevens: boolean;
  readonly withDabb?: unknown;
  readonly suitOrder?: unknown;
  readonly playerCount?: unknown;
  readonly teams?: unknown;
};

/** Checks the stored value at least carries the deck choice. */
function isStoredSettings(value: unknown): value is StoredSettings {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as StoredSettings).withSevens === "boolean"
  );
}

/**
 * Cleans a stored suit order into a full permutation of the four suits.
 *
 * @param value - the stored order, possibly missing or malformed
 * @returns a valid order that lists every suit exactly once
 */
function normalizeSuitOrder(value: unknown): readonly Suit[] {
  const listed = Array.isArray(value)
    ? [...new Set(value.filter((suit): suit is Suit => isSuit(suit)))]
    : [];
  // Append any suits the stored order was missing, so all four appear once.
  const missing = SUITS.filter((suit) => !listed.includes(suit));
  return [...listed, ...missing];
}

/** Whether a value is one of the four suits. */
function isSuit(value: unknown): value is Suit {
  return (
    typeof value === "string" && (SUITS as readonly string[]).includes(value)
  );
}

/** Clamps a stored player count to the supported range, defaulting to the min. */
function normalizePlayerCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return MIN_PLAYERS;
  }
  return Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, value));
}
