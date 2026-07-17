/**
 * Host-authoritative room model for online play - the pure core, no network.
 *
 * @module
 * @remarks
 * One player is the host. The host holds the authoritative {@link GameState},
 * validates every move with the same engine the single-player game uses, and
 * publishes the result. Guests send their intended move; the host decides.
 * This module is that decision logic, kept pure so it can be tested without any
 * network and reused behind any transport (Firebase first, see the README).
 */
import { applyMove } from "@/game/engine";
import { isLegalMove } from "@/game/moves";
import { createGame, MAX_PLAYERS, MIN_PLAYERS } from "@/game/setup";
import type { GameState, Move } from "@/game/state";

/** Identifies a player across a whole room; stable per browser/session. */
export type SeatId = string;

/** Where a room is in its life. */
export type RoomPhase = "lobby" | "playing" | "finished";

/** One player at the table. */
export type Seat = {
  readonly id: SeatId;
  /** Shown to the others - the player's name. */
  readonly name: string;
  /** True for the one player who runs the authoritative game. */
  readonly isHost: boolean;
};

/** The shared state every player sees, published by the host. */
export type RoomState = {
  /** Short code others type to join. */
  readonly code: string;
  /** Which seat is the host. */
  readonly hostId: SeatId;
  /** Players in turn order - seat i plays as game.players[i]. */
  readonly seats: readonly Seat[];
  readonly phase: RoomPhase;
  /** The authoritative game once it has started. */
  readonly game: GameState | null;
  /** Bumped on every change so clients can ignore stale snapshots. */
  readonly version: number;
};

/** How a room's game is set up. */
export type RoomGameOptions = {
  readonly seed: number;
  readonly withExpansion: boolean;
  readonly withDefense: boolean;
};

/**
 * Creates a fresh room in the lobby, with the host as its first seat.
 *
 * @param code - the shareable room code
 * @param host - the hosting player's seat
 * @returns the room, waiting for guests
 */
export function createRoom(code: string, host: Seat): RoomState {
  return {
    code,
    hostId: host.id,
    seats: [{ ...host, isHost: true }],
    phase: "lobby",
    game: null,
    version: 0,
  };
}

/**
 * Adds a guest to a room.
 *
 * @param room - the room to join
 * @param guest - the joining player's seat
 * @returns the room with the guest added
 * @throws if the room is not in the lobby, is full, or the id is taken
 */
export function joinRoom(room: RoomState, guest: Seat): RoomState {
  if (room.phase !== "lobby") {
    throw new Error("cannot join a game that has already started");
  }
  if (room.seats.length >= MAX_PLAYERS) {
    throw new Error(`a room holds at most ${MAX_PLAYERS} players`);
  }
  if (room.seats.some((seat) => seat.id === guest.id)) {
    throw new Error(`seat ${guest.id} is already in the room`);
  }
  return bump({
    ...room,
    seats: [...room.seats, { ...guest, isHost: false }],
  });
}

/**
 * Removes a seat from a room.
 *
 * @param room - the room to leave
 * @param seatId - who leaves
 * @returns the room without that seat
 * @remarks
 * Leaving is only modelled in the lobby. What happens when the host drops
 * mid-game is a separate decision - see the multiplayer README.
 */
export function leaveRoom(room: RoomState, seatId: SeatId): RoomState {
  return bump({
    ...room,
    seats: room.seats.filter((seat) => seat.id !== seatId),
  });
}

/**
 * Deals the game and moves the room into play.
 *
 * @param room - a room in the lobby
 * @param options - deck and seed to deal with
 * @returns the room now playing, with an authoritative game
 * @throws if not in the lobby, or the seat count is unsupported
 * @remarks
 * Only the host calls this. Every seat is a human player; the host does not run
 * an AI for anyone in this model.
 */
export function startGame(
  room: RoomState,
  options: RoomGameOptions,
): RoomState {
  if (room.phase !== "lobby") {
    throw new Error("the game has already started");
  }
  if (room.seats.length < MIN_PLAYERS || room.seats.length > MAX_PLAYERS) {
    throw new Error(
      `Drecksau needs ${MIN_PLAYERS} to ${MAX_PLAYERS} players to start`,
    );
  }

  const game = createGame(
    room.seats.map((seat) => ({ name: seat.name, isHuman: true })),
    {
      seed: options.seed,
      withExpansion: options.withExpansion,
      withDefense: options.withDefense,
    },
  );

  return bump({ ...room, phase: "playing", game });
}

/**
 * Applies a move a seat wants to make, if it is really their turn.
 *
 * @param room - a room in play
 * @param seatId - the seat asking to move
 * @param move - the move they want to make
 * @returns the room after the move, or unchanged if it was not allowed
 * @remarks
 * The host is the referee: a move only lands when it comes from the seat whose
 * turn it is and the engine accepts it. Anything else is ignored, so a guest
 * cannot move out of turn or play an illegal card by talking to the host
 * directly.
 */
export function applySeatMove(
  room: RoomState,
  seatId: SeatId,
  move: Move,
): RoomState {
  if (room.phase !== "playing" || room.game === null) {
    return room;
  }
  if (seatOnTurn(room)?.id !== seatId) {
    return room;
  }
  if (!isLegalMove(room.game, move)) {
    return room;
  }

  const game = applyMove(room.game, move);
  return bump({
    ...room,
    game,
    phase: game.winnerId === null ? "playing" : "finished",
  });
}

/**
 * The seat whose turn it is, or null outside of play.
 *
 * @param room - the room
 * @returns the seat on turn
 */
export function seatOnTurn(room: RoomState): Seat | null {
  if (room.phase !== "playing" || room.game === null) {
    return null;
  }
  return room.seats[room.game.currentPlayerIndex] ?? null;
}

/** Bumps the version so stale snapshots can be told apart. */
function bump(room: RoomState): RoomState {
  return { ...room, version: room.version + 1 };
}
