/**
 * Validating anything that comes off the wire, generic in the game.
 *
 * @module
 * @remarks
 * The host is authoritative and holds every player's real hand, but publishes a
 * *shared* state in which every hand is redacted to its size alone, and delivers
 * each player their own real hand on a private channel (see the adapter's
 * `redact`, `withOwnHand` and `withAllHands`). This module builds the guards
 * that treat every value read from Firebase as untrusted: another player - or a
 * stale, half-written entry - could put anything there. The game-specific parts
 * (is this a valid game state? a valid move? a valid hand?) come from the
 * adapter; the room, intent and chat envelopes are checked here.
 */
import type { OnlineAdapter, RoomPhase, RoomState, Seat } from "./adapter";
import type { MoveIntent, WireGuards } from "./transport";

/** The room phases, used to validate an untrusted snapshot. */
const ROOM_PHASES: ReadonlySet<string> = new Set([
  "lobby",
  "playing",
  "finished",
]);

/**
 * Builds the wire guards for one game from its adapter.
 *
 * @param adapter - the game's online adapter
 * @returns the guards a transport uses to filter untrusted values
 */
export function createWireGuards<G, M, H, O>(
  adapter: OnlineAdapter<G, M, H, O>,
): WireGuards<G, M, H> {
  const isRoomState = (value: unknown): value is RoomState<G> => {
    const room = value as RoomState<G>;
    return (
      isObject(value) &&
      isNonEmptyString(room.code) &&
      isNonEmptyString(room.hostId) &&
      Array.isArray(room.seats) &&
      room.seats.length > 0 &&
      room.seats.every(isSeat) &&
      typeof room.phase === "string" &&
      ROOM_PHASES.has(room.phase) &&
      isPhaseGame(adapter, room.phase, room.game) &&
      isCount(room.version) &&
      isOptionalEffect(room.lastEffect) &&
      isOptionalTimeout(room.autoPlayMs) &&
      isOptionalSeatIds(room.botSeatIds)
    );
  };

  const isMoveIntent = (value: unknown): value is MoveIntent<M> => {
    const intent = value as MoveIntent<M>;
    return (
      isObject(value) &&
      isNonEmptyString(intent.seatId) &&
      adapter.isMove(intent.move)
    );
  };

  return {
    isRoomState,
    isMoveIntent,
    isHand: adapter.isHand,
    isChatPayload,
  };
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

/** Checks the optional list of computer-controlled seat ids. */
function isOptionalSeatIds(value: unknown): boolean {
  return (
    value === undefined ||
    (Array.isArray(value) && value.every(isNonEmptyString))
  );
}

/** Checks the optional public-event stamp used for the animation. */
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
function isPhaseGame<G, M, H, O>(
  adapter: OnlineAdapter<G, M, H, O>,
  phase: RoomPhase,
  game: unknown,
): boolean {
  return phase === "lobby" ? game === null : adapter.isGameState(game);
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
