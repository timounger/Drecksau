/**
 * Hiding opponents' hands, and validating anything that comes off the wire.
 *
 * @module
 * @remarks
 * The host is authoritative and holds every player's real hand, but it must not
 * hand that knowledge to the others - seeing an opponent's cards would be the
 * online version of the cheating the computer players are kept from. So the
 * host publishes a *shared* state in which every hand is redacted to its size
 * alone, and delivers each player their own real hand on a private channel.
 * Each client then merges its own hand back in ({@link withOwnHand}).
 *
 * The guards below treat every value read from Firebase as untrusted: another
 * player - or a stale, half-written entry - could put anything there.
 */
import type { Card } from "@/game/cards";
import { isGameState } from "@/game/serialization";
import type { GameState, Move } from "@/game/state";
import type { MoveIntent } from "./transport";
import type { RoomPhase, RoomState, Seat } from "./room";

/**
 * The card type a hidden card is shown as.
 *
 * @remarks
 * A redacted hand keeps each card's id (so references like the Glücksvogel's
 * pending ids stay valid) but replaces its type with this decoy. Opponents'
 * hands are only ever rendered as a count, never as cards, so the decoy is
 * never seen; it exists so the redacted card still passes {@link isGameState}.
 */
const DECOY_CARD_TYPE = "mud";

/** The room phases, used to validate an untrusted snapshot. */
const ROOM_PHASES: ReadonlySet<string> = new Set([
  "lobby",
  "playing",
  "finished",
]);

/**
 * Redacts every player's hand down to its size.
 *
 * @param state - the authoritative game state
 * @returns a copy in which no hand reveals its cards, only how many there are
 */
export function redactHands(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      hand: player.hand.map((card) => ({ id: card.id, type: DECOY_CARD_TYPE })),
    })),
  };
}

/**
 * Puts a player's real hand back into a shared, redacted state.
 *
 * @param state - the shared state with redacted hands
 * @param playerIndex - the seat/player index whose hand to restore
 * @param hand - that player's real cards
 * @returns a copy showing the player their own hand and others' only as counts
 */
export function withOwnHand(
  state: GameState,
  playerIndex: number,
  hand: readonly Card[],
): GameState {
  return {
    ...state,
    players: state.players.map((player, index) =>
      index === playerIndex ? { ...player, hand: [...hand] } : player,
    ),
  };
}

/**
 * Checks an untrusted value is a room snapshot the client can render.
 *
 * @param value - the value read from the transport
 * @returns true if it is a well-formed room state
 */
export function isRoomState(value: unknown): value is RoomState {
  const room = value as RoomState;
  return (
    isObject(value) &&
    isNonEmptyString(room.code) &&
    isNonEmptyString(room.hostId) &&
    Array.isArray(room.seats) &&
    room.seats.length > 0 &&
    room.seats.every(isSeat) &&
    typeof room.phase === "string" &&
    ROOM_PHASES.has(room.phase) &&
    isPhaseGame(room.phase, room.game) &&
    isCount(room.version) &&
    isOptionalEffect(room.lastEffect) &&
    isOptionalTimeout(room.autoPlayMs)
  );
}

/** Checks the optional last-played-card stamp used for the animation. */
function isOptionalEffect(value: unknown): boolean {
  const effect = value as { type: unknown; id: unknown };
  return (
    value === undefined ||
    (isObject(value) && isNonEmptyString(effect.type) && isCount(effect.id))
  );
}

/** Checks the optional auto-play timeout: absent, null, or a positive count. */
function isOptionalTimeout(value: unknown): boolean {
  return value === undefined || value === null || isCount(value);
}

/**
 * Checks an untrusted value is a move intent from a guest.
 *
 * @param value - the value read from the transport
 * @returns true if it names a seat and carries a valid move
 */
export function isMoveIntent(value: unknown): value is MoveIntent {
  const intent = value as MoveIntent;
  return (
    isObject(value) && isNonEmptyString(intent.seatId) && isMove(intent.move)
  );
}

/**
 * Checks an untrusted value is a list of cards (a private hand).
 *
 * @param value - the value read from the transport
 * @returns true if every element looks like a card
 */
export function isHand(value: unknown): value is Card[] {
  return Array.isArray(value) && value.every(isCard);
}

/**
 * Checks an untrusted value is a chat line (without its id).
 *
 * @param value - the value read from the transport
 * @returns true if it names a sender and carries some text
 * @remarks
 * The text is displayed as plain text - React escapes it, so it cannot inject
 * markup. Only the shape is checked here.
 */
export function isChatPayload(
  value: unknown,
): value is { seatId: string; name: string; text: string } {
  const message = value as { seatId: unknown; name: unknown; text: unknown };
  return (
    isObject(value) &&
    isNonEmptyString(message.seatId) &&
    isNonEmptyString(message.name) &&
    isNonEmptyString(message.text)
  );
}

/** Checks one seat entry. */
function isSeat(value: unknown): value is Seat {
  const seat = value as Seat;
  return (
    isObject(value) &&
    isNonEmptyString(seat.id) &&
    isNonEmptyString(seat.name) &&
    typeof seat.isHost === "boolean"
  );
}

/** The game must be a real state while playing or finished, null in the lobby. */
function isPhaseGame(phase: RoomPhase, game: unknown): boolean {
  return phase === "lobby" ? game === null : isGameState(game);
}

/** Checks an untrusted move against the shape of a {@link Move}. */
function isMove(value: unknown): value is Move {
  const move = value as Move;
  let valid: boolean;

  if (!isObject(value) || typeof move.kind !== "string") {
    valid = false;
  } else {
    switch (move.kind) {
      case "playCard":
        valid =
          isNonEmptyString(move.cardId) &&
          (move.targetPigId === undefined ||
            isNonEmptyString(move.targetPigId));
        break;
      case "discardCard":
        valid = isNonEmptyString(move.cardId);
        break;
      case "redrawHand":
        valid = true;
        break;
      default:
        valid = false;
    }
  }

  return valid;
}

/** Checks a single card of a private hand. */
function isCard(value: unknown): value is Card {
  const card = value as Card;
  return (
    isObject(value) && isNonEmptyString(card.id) && isNonEmptyString(card.type)
  );
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
