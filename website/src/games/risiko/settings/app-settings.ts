/**
 * Risiko settings, stored in the browser.
 *
 * @module
 * @remarks
 * Kept under this game's own key, so it does not collide with the other games'
 * settings. Anything unknown or out of range falls back to the default, which
 * keeps a hand-edited or outdated entry from breaking a game.
 *
 * The two settings are not independent: **the two-player variant is played by
 * two**, and the other two want three to five. So the table size is clamped
 * against the variant rather than stored freely, which is why
 * {@link seatsFor} exists instead of the count being read straight out.
 */
import {
  MAX_PLAYERS,
  MIN_CREW,
  MIN_PLAYERS,
  type Variant,
} from "@/games/risiko/engine/state";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the stored settings - raise it on breaking changes. */
const SETTINGS_VERSION = 1;

/** Key of the settings entry. */
const SETTINGS_KEY = storageKey("risiko", "settings");

/**
 * Table size of a first-time visitor's game.
 *
 * @remarks
 * Three, which is the fewest the basic game seats and the fastest of its three
 * sizes: with three players the target is 25 territories of 42, so the map is
 * genuinely contested from the first turn rather than a long crawl.
 */
export const DEFAULT_PLAYER_COUNT = 3;

/** The variants on offer, in the order the rulebook introduces them. */
export const VARIANTS: readonly Variant[] = [
  "grundspiel",
  "klassisch",
  "zweispieler",
];

/**
 * The table sizes an online room can be opened for.
 *
 * @remarks
 * Two through five, and **two means the two-player variant** with its neutral
 * armies rather than a short basic game - the box has no basic game for two, so
 * a room of two is a different game rather than a smaller one. The adapter
 * makes that choice; this is only the list of numbers the entry screen offers.
 */
export const ONLINE_COUNTS: readonly number[] = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (unused, index) => MIN_PLAYERS + index,
);

/** What the player can configure. */
export type RisikoSettings = {
  /** Which of the box's three games. */
  readonly variant: Variant;
  /** How many sit at the table, the human included. */
  readonly playerCount: number;
};

/** What a first-time visitor gets. */
export const DEFAULT_SETTINGS: RisikoSettings = {
  variant: "grundspiel",
  playerCount: DEFAULT_PLAYER_COUNT,
};

/**
 * The table sizes a variant allows.
 *
 * @param variant - which of the box's games
 * @returns the seat counts on offer
 */
export function seatsFor(variant: Variant): readonly number[] {
  return variant === "zweispieler"
    ? [MIN_PLAYERS]
    : Array.from(
        { length: MAX_PLAYERS - MIN_CREW + 1 },
        (unused, index) => MIN_CREW + index,
      );
}

/**
 * Loads the stored settings.
 *
 * @returns the settings, with anything missing or unusable defaulted
 */
export function loadSettings(): RisikoSettings {
  const stored = readStored(SETTINGS_KEY, SETTINGS_VERSION, isPartialSettings);
  const variant = clampVariant(stored?.variant);
  return { variant, playerCount: clampPlayers(stored?.playerCount, variant) };
}

/**
 * Stores the settings.
 *
 * @param settings - the settings to keep for next time
 */
export function saveSettings(settings: RisikoSettings): void {
  const variant = clampVariant(settings.variant);
  writeStored(SETTINGS_KEY, SETTINGS_VERSION, {
    variant,
    playerCount: clampPlayers(settings.playerCount, variant),
  });
}

/**
 * Holds a table size to one this variant can actually seat.
 *
 * @param count - the value read back from storage or a control
 * @param variant - the variant it has to fit
 * @returns a seatable table size
 */
export function clampPlayers(count: unknown, variant: Variant): number {
  const allowed = seatsFor(variant);
  const wanted =
    typeof count === "number" && Number.isFinite(count) ? Math.round(count) : 0;
  return allowed.includes(wanted) ? wanted : allowed[0];
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
    : "grundspiel";
}

/** Whether a stored value could be a settings object at all. */
function isPartialSettings(value: unknown): value is Partial<RisikoSettings> {
  return typeof value === "object" && value !== null;
}
