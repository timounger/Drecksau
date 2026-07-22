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
import {
  DEFAULT_DIFFICULTY,
  isDifficulty,
  type Difficulty,
} from "@/games/binokel/engine/difficulty";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/games/binokel/engine/setup";
import {
  ACE_NAME_OPTIONS,
  BID_NAME_OPTIONS,
  DIX_NAME_OPTIONS,
  SUIT_NAME_OPTIONS,
  defaultNaming,
} from "@/games/binokel/i18n/naming";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the stored settings - raise it on breaking changes. */
const SETTINGS_VERSION = 1;

/**
 * How the cards of one suit are ordered in the hand: from the ace down to the
 * seven, or the other way round.
 */
export type RankOrder = "aceToSeven" | "sevenToAce";

/** The two rank orders, the first being the default. */
export const RANK_ORDERS: readonly RankOrder[] = ["aceToSeven", "sevenToAce"];

/**
 * How the declarer discards the Dabb: "swap" keeps the two-row swap (the Dabb
 * on top, pushed away), "mark" shows one hand where you tap the cards to drop.
 */
export type DiscardMode = "swap" | "mark";

/** The two discard modes, the first being the default. */
export const DISCARD_MODES: readonly DiscardMode[] = ["swap", "mark"];

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
  /** Whether a suit's cards run from the ace down to the seven, or reversed. */
  readonly rankOrder: RankOrder;
  /** How the declarer discards the Dabb (two-row swap, or mark-and-drop). */
  readonly discardMode: DiscardMode;
  /** How many players sit at the table (you plus computer opponents). */
  readonly playerCount: number;
  /** Whether two teams play (only takes effect for four or six players). */
  readonly teams: boolean;
  /** How hard the computer opponents play. */
  readonly difficulty: Difficulty;
  /** The chosen name of each suit (e.g. "Schellen" or "Karo"). */
  readonly suitNames: Readonly<Record<Suit, string>>;
  /** The chosen name of the trump seven ("Dix" or "7er"). */
  readonly dixName: string;
  /** The chosen name of the ace ("Daus" or "Ass"). */
  readonly aceName: string;
  /** The chosen name of the bidding process ("Reizen" or "Steigern"). */
  readonly bidName: string;
};

/**
 * The settings before the player has changed anything.
 *
 * @returns the defaults: the 48-card deck, a Dabb, natural order, three players
 */
export function defaultBinokelSettings(): BinokelSettings {
  const naming = defaultNaming();
  return {
    withSevens: true,
    withDabb: true,
    suitOrder: [...SUITS],
    rankOrder: RANK_ORDERS[0],
    discardMode: DISCARD_MODES[0],
    playerCount: MIN_PLAYERS,
    teams: false,
    difficulty: DEFAULT_DIFFICULTY,
    suitNames: naming.suitNames,
    dixName: naming.dixName,
    aceName: naming.aceName,
    bidName: naming.bidName,
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
        rankOrder: isRankOrder(stored.rankOrder)
          ? stored.rankOrder
          : RANK_ORDERS[0],
        discardMode: isDiscardMode(stored.discardMode)
          ? stored.discardMode
          : DISCARD_MODES[0],
        playerCount: normalizePlayerCount(stored.playerCount),
        teams: stored.teams === true,
        difficulty: isDifficulty(stored.difficulty)
          ? stored.difficulty
          : DEFAULT_DIFFICULTY,
        suitNames: normalizeSuitNames(stored.suitNames),
        dixName: normalizeChoice(stored.dixName, DIX_NAME_OPTIONS),
        aceName: normalizeChoice(stored.aceName, ACE_NAME_OPTIONS),
        bidName: normalizeChoice(stored.bidName, BID_NAME_OPTIONS),
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
  readonly rankOrder?: unknown;
  readonly discardMode?: unknown;
  readonly playerCount?: unknown;
  readonly teams?: unknown;
  readonly difficulty?: unknown;
  readonly suitNames?: unknown;
  readonly dixName?: unknown;
  readonly aceName?: unknown;
  readonly bidName?: unknown;
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

/** Whether a value is one of the two rank orders. */
function isRankOrder(value: unknown): value is RankOrder {
  return (
    typeof value === "string" &&
    (RANK_ORDERS as readonly string[]).includes(value)
  );
}

/** Whether a value is one of the two discard modes. */
function isDiscardMode(value: unknown): value is DiscardMode {
  return (
    typeof value === "string" &&
    (DISCARD_MODES as readonly string[]).includes(value)
  );
}

/** Clamps a stored player count to the supported range, defaulting to the min. */
function normalizePlayerCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return MIN_PLAYERS;
  }
  return Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, value));
}

/**
 * Keeps a stored name if it is one of the allowed options, else the default.
 *
 * @param value - the stored value, possibly missing or unknown
 * @param options - the allowed names, the first being the default
 * @returns a valid name from the options
 */
function normalizeChoice(value: unknown, options: readonly string[]): string {
  return typeof value === "string" && options.includes(value)
    ? value
    : options[0];
}

/** Cleans stored suit names into a valid name for each of the four suits. */
function normalizeSuitNames(value: unknown): Readonly<Record<Suit, string>> {
  const stored = (
    typeof value === "object" && value !== null ? value : {}
  ) as Partial<Record<Suit, unknown>>;
  const result = {} as Record<Suit, string>;
  for (const suit of SUITS) {
    result[suit] = normalizeChoice(stored[suit], SUIT_NAME_OPTIONS[suit]);
  }
  return result;
}
