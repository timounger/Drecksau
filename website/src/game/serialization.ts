/**
 * Checks that an untrusted value really is a Drecksau game state.
 *
 * @module
 * @remarks
 * Everything in {@link GameState} is plain data, so storing it is just
 * `JSON.stringify`. Reading it back is the risky direction: the value comes
 * from localStorage, where an older version of the app, a half written entry
 * or a curious user may have left something the engine cannot handle. Nothing
 * enters the engine without passing through here.
 */
import { DECK_COMPOSITION, type ActionCardType, type Card } from "./cards";
import type { GameState, LogEntry, Pig, Player } from "./state";

/** The card types the current deck knows. */
const KNOWN_CARD_TYPES = new Set(Object.keys(DECK_COMPOSITION));

/**
 * Checks an unknown value against the shape of a game state.
 *
 * @param value - the value to check, e.g. straight from storage
 * @returns true if the engine can safely work with it
 * @example
 * ```ts
 * const restored = loadSession("drecksau", isGameState);
 * ```
 */
export function isGameState(value: unknown): value is GameState {
  const state = value as GameState;
  return (
    isObject(value) &&
    Array.isArray(state.players) &&
    state.players.length > 0 &&
    state.players.every(isPlayer) &&
    isIndexOf(state.currentPlayerIndex, state.players.length) &&
    isCardList(state.drawPile) &&
    isCardList(state.discardPile) &&
    isRandomState(state.random) &&
    isWinnerId(state.winnerId, state.players) &&
    Array.isArray(state.log) &&
    state.log.every(isLogEntry) &&
    isCount(state.nextLogId)
  );
}

/** Checks one player, including their pigs and hand. */
function isPlayer(value: unknown): value is Player {
  const player = value as Player;
  return (
    isObject(value) &&
    isNonEmptyString(player.id) &&
    isNonEmptyString(player.name) &&
    typeof player.isHuman === "boolean" &&
    Array.isArray(player.pigs) &&
    player.pigs.length > 0 &&
    player.pigs.every(isPig) &&
    isCardList(player.hand)
  );
}

/** Checks one pig, including its attached cards. */
function isPig(value: unknown): value is Pig {
  const pig = value as Pig;
  return (
    isObject(value) &&
    isNonEmptyString(pig.id) &&
    typeof pig.isDirty === "boolean" &&
    isOptionalCard(pig.barn) &&
    isOptionalCard(pig.lightningRod) &&
    isOptionalCard(pig.barnDoor) &&
    // A rod or a door without a stall is a state the rules cannot produce.
    (pig.barn !== null || (pig.lightningRod === null && pig.barnDoor === null))
  );
}

/** Checks a card and that its type still exists in this version. */
function isCard(value: unknown): value is Card {
  const card = value as Card;
  return (
    isObject(value) &&
    isNonEmptyString(card.id) &&
    typeof card.type === "string" &&
    KNOWN_CARD_TYPES.has(card.type as ActionCardType)
  );
}

/** Checks a card or an empty slot. */
function isOptionalCard(value: unknown): boolean {
  return value === null || isCard(value);
}

/** Checks a list of cards. */
function isCardList(value: unknown): value is Card[] {
  return Array.isArray(value) && value.every(isCard);
}

/** Checks one log line. */
function isLogEntry(value: unknown): value is LogEntry {
  const entry = value as LogEntry;
  return isObject(value) && isCount(entry.id) && typeof entry.text === "string";
}

/** Checks the seed carried by the random generator. */
function isRandomState(value: unknown): boolean {
  const random = value as { seed: unknown };
  return isObject(value) && isCount(random.seed);
}

/** Checks the winner is either nobody or one of the players at the table. */
function isWinnerId(value: unknown, players: readonly Player[]): boolean {
  return (
    value === null ||
    (typeof value === "string" && players.some((player) => player.id === value))
  );
}

/** Checks a value can index a list of the given length. */
function isIndexOf(value: unknown, length: number): boolean {
  return isCount(value) && value < length;
}

/** A non negative, finite integer. */
function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/** A string with content. */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** A plain object, not null. */
function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}
