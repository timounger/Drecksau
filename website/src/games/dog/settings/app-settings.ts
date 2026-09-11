/**
 * Dog settings, stored in the browser.
 *
 * @module
 * @remarks
 * Kept under this game's own key, so it does not collide with the other games'
 * settings. Anything unknown or out of range falls back to the default, which
 * keeps a hand-edited or outdated entry from breaking a game.
 *
 * There is deliberately no setting for the number of players: Dog is two
 * against two, and everything about it - the partner, the card pushed across,
 * the eight pieces that have to come home - is built on that. A table of three
 * would be a different game with the same cards.
 */
import { DEFAULT_SEATS, SEAT_COUNTS, teamPlay } from "@/games/dog/engine/board";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the stored settings - raise it on breaking changes. */
const SETTINGS_VERSION = 1;

/** Key of the settings entry. */
const SETTINGS_KEY = storageKey("dog", "settings");

/**
 * How many may sit at the table.
 *
 * @remarks
 * Two to six, as the rulebook has it. Four and six are the partner game it is
 * written for; two, three and five are the variant in which everybody plays for
 * themselves with a fifth piece - see {@link teamPlay}.
 */
export const PLAYER_COUNTS: readonly number[] = SEAT_COUNTS;

/** And the table a first-time visitor gets. */
export const DEFAULT_PLAYER_COUNT = DEFAULT_SEATS;

/**
 * Holds a table size to one this game deals for.
 *
 * @param count - the value read back from storage or a control
 * @returns a table size between two and six
 */
export function clampPlayers(count: unknown): number {
  return typeof count === "number" && PLAYER_COUNTS.includes(count)
    ? count
    : DEFAULT_PLAYER_COUNT;
}

/**
 * Whether a table of this size plays in teams.
 *
 * @param count - how many sit at it
 * @returns true at four and six
 */
export function isTeamTable(count: number): boolean {
  return teamPlay(count);
}

/** What the player is called if they never say. */
export const DEFAULT_NAME = "Du";

/** How long a name may be. */
export const MAX_NAME = 12;

/** What the player can configure. */
export type DogSettings = {
  /** What the player is called at the table. */
  readonly name: string;
  /** How many sit at it, the player included. */
  readonly playerCount: number;
};

/** What a first-time visitor gets. */
export const DEFAULT_SETTINGS: DogSettings = {
  name: DEFAULT_NAME,
  playerCount: DEFAULT_PLAYER_COUNT,
};

/**
 * Loads the stored settings.
 *
 * @returns the settings, with anything missing or unusable defaulted
 */
export function loadSettings(): DogSettings {
  const stored = readStored(SETTINGS_KEY, SETTINGS_VERSION, isPartialSettings);
  return {
    name: clampName(stored?.name),
    playerCount: clampPlayers(stored?.playerCount),
  };
}

/**
 * Stores the settings.
 *
 * @param settings - the settings to keep for next time
 */
export function saveSettings(settings: DogSettings): void {
  writeStored(SETTINGS_KEY, SETTINGS_VERSION, {
    name: clampName(settings.name),
    playerCount: clampPlayers(settings.playerCount),
  });
}

/**
 * Holds a name to something that fits on a board.
 *
 * @param name - the value read back from storage or a control
 * @returns a usable name
 */
export function clampName(name: unknown): string {
  const text = typeof name === "string" ? name.trim() : "";
  return text.length === 0 ? DEFAULT_NAME : text.slice(0, MAX_NAME);
}

/** Whether a stored value could be a settings object at all. */
function isPartialSettings(value: unknown): value is Partial<DogSettings> {
  return typeof value === "object" && value !== null;
}
