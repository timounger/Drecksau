/**
 * Monopoly settings, stored in the browser.
 *
 * @module
 * @remarks
 * Kept under this game's own key, so it does not collide with the other games'
 * settings. Anything unknown or out of range falls back to the default, which
 * keeps a hand-edited or outdated entry from breaking a game.
 */
import { MAX_PLAYERS, MIN_PLAYERS } from "@/games/monopoly/engine/state";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the stored settings - raise it on breaking changes. */
const SETTINGS_VERSION = 1;

/** Key of the settings entry. */
const SETTINGS_KEY = storageKey("monopoly", "settings");

/**
 * Table size of a first-time visitor's game.
 *
 * @remarks
 * Four, which is where Monopoly is itself: with two the board splits evenly and
 * the game is a duel, with six it takes an evening. Four is enough players that
 * colour groups have to be traded for and few enough that they can be.
 */
export const DEFAULT_PLAYER_COUNT = 4;

/** The table sizes on offer, from the box's own 2 to 6. */
export const PLAYER_COUNTS: readonly number[] = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (unused, index) => MIN_PLAYERS + index,
);

/** What the player can configure. */
export type MonopolySettings = {
  /** How many sit at the table, the human included. */
  readonly playerCount: number;
  /**
   * Whether fines and taxes pile up on Frei Parken.
   *
   * @remarks
   * The best-known house rule of them all, and the rulebook argues against it:
   * "Legen Sie niemals Geld in die Mitte des Spielplans: Sie erhalten keinen
   * Bonus, wenn Sie auf Frei Parken landen!" It is a switch rather than a
   * decision, because both games are somebody's Monopoly - and it starts on,
   * because that is the game most tables actually play.
   */
  readonly parkingPot: boolean;
  /**
   * Whether landing right on LOS pays the salary twice.
   *
   * @remarks
   * The other house rule everybody grew up with, and no more printed than the
   * pot on Frei Parken: the rules pay for passing LOS and treat stopping on it
   * as the same thing. On by default, for the same reason.
   */
  readonly doubleGo: boolean;
};

/** What a first-time visitor gets. */
export const DEFAULT_SETTINGS: MonopolySettings = {
  playerCount: DEFAULT_PLAYER_COUNT,
  parkingPot: true,
  doubleGo: true,
};

/**
 * Loads the stored settings.
 *
 * @returns the settings, with anything missing or unusable defaulted
 */
export function loadSettings(): MonopolySettings {
  const stored = readStored(SETTINGS_KEY, SETTINGS_VERSION, isPartialSettings);
  return {
    playerCount: clampPlayers(stored?.playerCount),
    parkingPot: stored?.parkingPot ?? true,
    doubleGo: stored?.doubleGo ?? true,
  };
}

/**
 * Stores the settings.
 *
 * @param settings - the settings to keep for next time
 */
export function saveSettings(settings: MonopolySettings): void {
  writeStored(SETTINGS_KEY, SETTINGS_VERSION, {
    playerCount: clampPlayers(settings.playerCount),
    parkingPot: settings.parkingPot,
    doubleGo: settings.doubleGo,
  });
}

/**
 * Holds a table size inside what the box seats.
 *
 * @param count - the value read back from storage or a control
 * @returns a seatable table size
 */
export function clampPlayers(count: unknown): number {
  return typeof count === "number" && Number.isFinite(count)
    ? Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, Math.round(count)))
    : DEFAULT_PLAYER_COUNT;
}

/** Whether a stored value could be a settings object at all. */
function isPartialSettings(value: unknown): value is Partial<MonopolySettings> {
  return typeof value === "object" && value !== null;
}
