/**
 * The wire model for "RV There Yet?" online co-op: what the host streams and
 * what the guest sends back, plus the untrusted-value guards for the transport.
 *
 * @module
 * @remarks
 * The drive is real-time, so it does not use the turn-based online core. The
 * host runs the authoritative simulation and publishes a {@link NetSnapshot}
 * many times a second; the guest is a thin client that draws the newest
 * snapshot and streams its own {@link RvMove} - its raw input - back.
 *
 * Unlike a tank arena there is nothing big to leave out: a whole world here is
 * two people, one vehicle and a rope. The map is a constant both sides already
 * have, so the snapshot is simply the state, and the guest can draw it without
 * rebuilding anything.
 */
import { isChatPayload } from "@/online/online-state";
import type { RoomState, Seat } from "@/online/adapter";
import type { MoveIntent, WireGuards } from "@/online/transport";
import type { GameState, Input } from "@/games/rv-there-yet/engine/types";

/** Namespaces this game's rooms in the shared database. */
export const RV_GAME_ID = "rv-there-yet";

/** The two co-op seats: the host plus one guest. */
export const COOP_PLAYERS = 2;

/** A guest's raw input for its own person, sent to the host each tick. */
export type RvMove = Input;

/**
 * The world at one instant, as it crosses the wire.
 *
 * @remarks
 * The full state. It is a few dozen numbers - there is nothing here worth the
 * trouble of a leaner format, and a snapshot that carries everything cannot
 * drift out of step with the state it came from.
 */
export type NetSnapshot = GameState;

/**
 * Reduces an authoritative game state to a wire snapshot.
 *
 * @param state - the host's authoritative state
 * @returns the snapshot to publish
 */
export function toSnapshot(state: GameState): NetSnapshot {
  return state;
}

/**
 * Rebuilds a game state from a wire snapshot.
 *
 * @param snap - the snapshot received from the host
 * @returns the state to draw
 * @remarks
 * A guest that joined a drive already under way may receive a snapshot with
 * only one person in it - the host's - for the frames before the host has
 * dealt it a second. Drawing that is fine; the person appears when it arrives.
 */
export function fromSnapshot(snap: NetSnapshot): GameState {
  return snap;
}

/**
 * The same input with its presses taken out.
 *
 * @param move - what a guest last sent
 * @returns the input with door, rope and gear no longer pressed
 * @remarks
 * A guest's input arrives about twenty times a second and the host holds it
 * until the next one comes, so the same input is applied for two or three
 * frames running. That is right for a held pedal and wrong for a press: applied
 * three times over, one tap on the door would open it, shut it and open it
 * again. The host therefore hands a received press on **once** and calls this
 * to put the input back without it.
 */
export function withoutPresses(move: RvMove): RvMove {
  return {
    ...move,
    hook: false,
    take: false,
    jump: false,
    door: false,
    pick: null,
    cycle: false,
    shift: null,
  };
}

/** Whether an input carries a press rather than only held controls. */
export function hasPress(move: RvMove): boolean {
  return (
    move.hook ||
    move.take ||
    move.jump ||
    move.door ||
    move.cycle ||
    move.pick !== null ||
    move.shift !== null
  );
}

/** The guards the Firebase transport uses to filter this game's wire data. */
export const RV_GUARDS: WireGuards<NetSnapshot, RvMove, null> = {
  isRoomState: isNetRoomState,
  isMoveIntent: isNetIntent,
  isHand: isNoHand,
  isChatPayload,
};

/** Whether a value is a well-formed snapshot (loose: our own code writes it). */
function isNetSnapshot(value: unknown): value is NetSnapshot {
  const snap = value as NetSnapshot;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof snap.phase === "string" &&
    typeof snap.time === "number" &&
    typeof snap.gear === "number" &&
    typeof snap.driver === "number" &&
    typeof snap.rope === "number" &&
    typeof snap.hooked === "number" &&
    typeof snap.rv === "object" &&
    snap.rv !== null &&
    typeof snap.rv.x === "number" &&
    Array.isArray(snap.people) &&
    snap.people.every(isPerson)
  );
}

/** Whether a value is one person on the drive. */
function isPerson(value: unknown): boolean {
  const person = value as { at: number; inside: boolean; carrying: unknown };
  return (
    typeof value === "object" &&
    value !== null &&
    typeof person.at === "number" &&
    typeof person.inside === "boolean" &&
    Array.isArray(person.carrying)
  );
}

/** Whether a value is a room state wrapping a snapshot (or an empty lobby). */
function isNetRoomState(value: unknown): value is RoomState<NetSnapshot> {
  const room = value as RoomState<NetSnapshot>;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof room.code === "string" &&
    typeof room.hostId === "string" &&
    Array.isArray(room.seats) &&
    typeof room.phase === "string" &&
    typeof room.version === "number" &&
    (room.game === null || isNetSnapshot(room.game))
  );
}

/** Whether a value is a move (raw input) a guest sent. */
function isRvMove(value: unknown): value is RvMove {
  const move = value as RvMove;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof move.drive === "number" &&
    typeof move.wind === "number" &&
    typeof move.hook === "boolean" &&
    typeof move.take === "boolean" &&
    typeof move.cycle === "boolean" &&
    (move.pick === null || typeof move.pick === "number") &&
    typeof move.door === "boolean" &&
    typeof move.sprint === "boolean" &&
    typeof move.work === "boolean" &&
    (move.shift === null || typeof move.shift === "number")
  );
}

/** Whether a value is a move intent from a guest. */
function isNetIntent(value: unknown): value is MoveIntent<RvMove> {
  const intent = value as MoveIntent<RvMove>;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof intent.seatId === "string" &&
    isRvMove(intent.move)
  );
}

/** Nobody holds anything privately on this drive, so a hand is always null. */
function isNoHand(value: unknown): value is null {
  return value === null;
}

/**
 * Builds a seat record for a player.
 *
 * @param id - the player's seat id
 * @param name - the name they gave themselves
 * @param isHost - whether they opened the room
 * @returns the seat
 */
export function makeSeat(id: string, name: string, isHost: boolean): Seat {
  return { id, name, isHost };
}
