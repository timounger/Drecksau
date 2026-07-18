/**
 * Validating a Binokel game state read off the wire.
 *
 * @module
 * @remarks
 * Online, a game state arrives as untrusted JSON from another player or a stale
 * database entry. {@link isGameState} checks the whole shape before the engine
 * or the UI touches it, so malformed data is dropped rather than crashing a
 * client. It is deliberately structural: it accepts any state the engine could
 * produce, including a redacted one (hands and Dabb replaced by decoy cards).
 */
import { RANKS, SUITS, type Card } from "./cards";
import type { BinokelPlayer, GameState, Phase, TrickCard } from "./state";

/** The phases a state may be in. */
const PHASES: ReadonlySet<string> = new Set<Phase>([
  "bidding",
  "exchange",
  "melding",
  "trick",
  "roundEnd",
  "matchEnd",
]);

const SUIT_SET: ReadonlySet<string> = new Set(SUITS);
const RANK_SET: ReadonlySet<string> = new Set(RANKS);

/**
 * Checks an untrusted value is a Binokel game state.
 *
 * @param value - the value read from the transport
 * @returns true if it is a well-formed game state
 */
export function isGameState(value: unknown): value is GameState {
  const state = value as GameState;
  return (
    isObject(value) &&
    Array.isArray(state.players) &&
    state.players.length > 0 &&
    state.players.every(isPlayer) &&
    typeof state.withSevens === "boolean" &&
    isInteger(state.targetScore) &&
    isInteger(state.dealerIndex) &&
    typeof state.phase === "string" &&
    PHASES.has(state.phase) &&
    isCardList(state.dabb) &&
    isCardList(state.takenDabb) &&
    isInteger(state.currentPlayerIndex) &&
    isInteger(state.highestBid) &&
    isNullableInteger(state.declarerIndex) &&
    isNullableSuit(state.trump) &&
    Array.isArray(state.currentTrick) &&
    state.currentTrick.every(isTrickCard) &&
    isInteger(state.leaderIndex) &&
    isRandomState(state.random) &&
    Array.isArray(state.log) &&
    state.log.every(isLogEntry) &&
    isInteger(state.nextLogId) &&
    isNullableString(state.matchWinnerId)
  );
}

/** Checks one player entry. */
function isPlayer(value: unknown): value is BinokelPlayer {
  const player = value as BinokelPlayer;
  return (
    isObject(value) &&
    isNonEmptyString(player.id) &&
    isNonEmptyString(player.name) &&
    typeof player.isHuman === "boolean" &&
    isCardList(player.hand) &&
    isCardList(player.won) &&
    isInteger(player.meldPoints) &&
    typeof player.hasTrick === "boolean" &&
    isInteger(player.score) &&
    isNullableInteger(player.bid) &&
    typeof player.bidding === "boolean"
  );
}

/** Checks one trick card. */
function isTrickCard(value: unknown): value is TrickCard {
  const trickCard = value as TrickCard;
  return (
    isObject(value) &&
    isInteger(trickCard.playerIndex) &&
    isCard(trickCard.card)
  );
}

/** Checks a list of cards. */
function isCardList(value: unknown): value is Card[] {
  return Array.isArray(value) && value.every(isCard);
}

/** Checks one card. */
function isCard(value: unknown): value is Card {
  const card = value as Card;
  return (
    isObject(value) &&
    isNonEmptyString(card.id) &&
    typeof card.suit === "string" &&
    SUIT_SET.has(card.suit) &&
    typeof card.rank === "string" &&
    RANK_SET.has(card.rank)
  );
}

/** Checks a log entry. */
function isLogEntry(value: unknown): boolean {
  const entry = value as { id: unknown; text: unknown };
  return (
    isObject(value) && isInteger(entry.id) && typeof entry.text === "string"
  );
}

/** Checks the random generator state. */
function isRandomState(value: unknown): boolean {
  return isObject(value) && isInteger((value as { seed: unknown }).seed);
}

/** A value that is null or a valid suit. */
function isNullableSuit(value: unknown): boolean {
  return value === null || (typeof value === "string" && SUIT_SET.has(value));
}

/** A value that is null or a string. */
function isNullableString(value: unknown): boolean {
  return value === null || typeof value === "string";
}

/** A value that is null or an integer. */
function isNullableInteger(value: unknown): boolean {
  return value === null || isInteger(value);
}

/** A finite integer (may be negative - scores can go below zero). */
function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

/** A string with content. */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** A plain object, not null. */
function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}
