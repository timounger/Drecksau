/**
 * CATAN settings, stored in the browser.
 *
 * @module
 * @remarks
 * Kept under this game's own key, so it does not collide with the other games'
 * settings. Anything unknown or out of range falls back to the default, which
 * keeps a hand-edited or outdated entry from breaking a game.
 *
 * Two settings, and the second is the one worth explaining. The printed game
 * ends at ten points and a full four-handed game takes an evening; a shorter
 * target is the standard way of playing it in an hour, so the number is on
 * offer rather than fixed. Everything else - the board, the costs, the cards -
 * stays exactly as printed.
 */
import { MAX_PLAYERS, MIN_PLAYERS } from "@/games/catan/engine/setup";
import { VARIANTS, WIN_POINTS, type Variant } from "@/games/catan/engine/state";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the stored settings - raise it on breaking changes. */
const SETTINGS_VERSION = 1;

/** Key of the settings entry. */
const SETTINGS_KEY = storageKey("catan", "settings");

/**
 * Table size of a first-time visitor's game.
 *
 * @remarks
 * Three, which is the fewest the box seats and the quickest of its sizes.
 * Five and six need the 5-6 Personen Erweiterung: a bigger island, and a
 * Spielzug that two people share.
 */
export const DEFAULT_PLAYER_COUNT = MIN_PLAYERS;

/** The table sizes on offer. */
export const PLAYER_COUNTS: readonly number[] = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (unused, index) => MIN_PLAYERS + index,
);

/** A game shorter than the printed one. */
const SHORT_GAME = 8;

/** A game longer than the printed one. */
const LONG_GAME = 12;

/** The targets on offer: the printed ten, one shorter and one longer. */
export const TARGETS: readonly number[] = [SHORT_GAME, WIN_POINTS, LONG_GAME];

/** What the player can configure. */
export type CatanSettings = {
  /** How many sit at the table, the human included. */
  readonly playerCount: number;
  /** Siegpunkte needed to win. */
  readonly target: number;
  /**
   * Which variants are switched on.
   *
   * @remarks
   * A **list**, not a choice, because the rulebook says these combine freely.
   * The settings screen therefore offers switches rather than a radio group -
   * "kann man alles kombinieren" has a yes for an answer here.
   */
  readonly variants: readonly Variant[];
};

/** What a first-time visitor gets. */
export const DEFAULT_SETTINGS: CatanSettings = {
  playerCount: DEFAULT_PLAYER_COUNT,
  target: WIN_POINTS,
  variants: [],
};

/**
 * Loads the stored settings.
 *
 * @returns the settings, with anything missing or unusable defaulted
 */
export function loadSettings(): CatanSettings {
  const stored = readStored(SETTINGS_KEY, SETTINGS_VERSION, isPartialSettings);
  return {
    playerCount: clampPlayers(stored?.playerCount),
    target: clampTarget(stored?.target),
    variants: clampVariants(stored?.variants),
  };
}

/**
 * Stores the settings.
 *
 * @param settings - the settings to keep for next time
 */
export function saveSettings(settings: CatanSettings): void {
  writeStored(SETTINGS_KEY, SETTINGS_VERSION, {
    playerCount: clampPlayers(settings.playerCount),
    target: clampTarget(settings.target),
    variants: clampVariants(settings.variants),
  });
}

/**
 * Keeps only variants this build knows.
 *
 * @param variants - the value read back from storage or a control
 * @returns the ones that exist, in the rulebook's own order
 *
 * @remarks
 * Ordered by {@link VARIANTS} rather than by however they were stored, so two
 * settings holding the same switches are the same settings.
 */
export function clampVariants(variants: unknown): readonly Variant[] {
  const wanted = Array.isArray(variants) ? variants : [];
  return VARIANTS.filter((variant) => wanted.includes(variant));
}

/**
 * Holds a table size to one the box can seat.
 *
 * @param count - the value read back from storage or a control
 * @returns a seatable table size
 */
export function clampPlayers(count: unknown): number {
  const wanted =
    typeof count === "number" && Number.isFinite(count) ? Math.round(count) : 0;
  return PLAYER_COUNTS.includes(wanted) ? wanted : DEFAULT_PLAYER_COUNT;
}

/**
 * Holds a target to one on offer.
 *
 * @param target - the value read back from storage or a control
 * @returns a playable target
 */
export function clampTarget(target: unknown): number {
  const wanted =
    typeof target === "number" && Number.isFinite(target) ? Math.round(target) : 0;
  return TARGETS.includes(wanted) ? wanted : WIN_POINTS;
}

/** Whether a stored value could be a settings object at all. */
function isPartialSettings(value: unknown): value is Partial<CatanSettings> {
  return typeof value === "object" && value !== null;
}
