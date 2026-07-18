/**
 * Host-authoritative room model for online play - the pure core, no network.
 *
 * @module
 * @remarks
 * One player is the host. The host holds the authoritative game, validates every
 * move with the same engine the single-player game uses (reached through an
 * {@link OnlineAdapter}), and publishes the result. Guests send their intended
 * move; the host decides. This module is that decision logic, kept pure so it
 * can be tested without any network and reused behind any transport and for any
 * game.
 */
import type { OnlineAdapter, RoomState, Seat, SeatId } from "./adapter";

/**
 * Creates a fresh room in the lobby, with the host as its first seat.
 *
 * @param code - the shareable room code
 * @param host - the hosting player's seat
 * @returns the room, waiting for guests
 */
export function createRoom<G>(code: string, host: Seat): RoomState<G> {
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
 * @param maxPlayers - the most seats this game allows
 * @returns the room with the guest added
 * @throws if the room is not in the lobby, is full, or the id is taken
 */
export function joinRoom<G>(
  room: RoomState<G>,
  guest: Seat,
  maxPlayers: number,
): RoomState<G> {
  if (room.phase !== "lobby") {
    throw new Error("cannot join a game that has already started");
  }
  if (room.seats.length >= maxPlayers) {
    throw new Error(`a room holds at most ${maxPlayers} players`);
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
 */
export function leaveRoom<G>(room: RoomState<G>, seatId: SeatId): RoomState<G> {
  return bump({
    ...room,
    seats: room.seats.filter((seat) => seat.id !== seatId),
  });
}

/**
 * Deals the game and moves the room into play.
 *
 * @param room - a room in the lobby
 * @param adapter - the game's online adapter
 * @param seed - the deal's random seed
 * @param options - the game options the host chose
 * @param autoPlayMs - the auto-play timeout in ms, or null for none
 * @returns the room now playing, with an authoritative game
 * @throws if not in the lobby, or the seat count is unsupported
 */
export function startGame<G, M, H, O>(
  room: RoomState<G>,
  adapter: OnlineAdapter<G, M, H, O>,
  seed: number,
  options: O,
  autoPlayMs: number | null,
): RoomState<G> {
  if (room.phase !== "lobby") {
    throw new Error("the game has already started");
  }
  if (
    room.seats.length < adapter.minPlayers ||
    room.seats.length > adapter.maxPlayers
  ) {
    throw new Error(
      `this game needs ${adapter.minPlayers} to ${adapter.maxPlayers} players`,
    );
  }

  const game = adapter.createGame(
    room.seats.map((seat) => ({ name: seat.name })),
    options,
    seed,
  );
  return bump({
    ...room,
    phase: "playing",
    game,
    autoPlayMs,
    botSeatIds: [],
  });
}

/**
 * Brings a room back to the lobby, keeping its players.
 *
 * @param room - a room that is playing or finished
 * @returns the room in the lobby again, ready for a fresh {@link startGame}
 */
export function returnToLobby<G>(room: RoomState<G>): RoomState<G> {
  return bump<G>({ ...room, phase: "lobby", game: null, botSeatIds: [] });
}

/**
 * Hands seats over to the computer, for players who left mid-game.
 *
 * @param room - the room in play
 * @param seatIds - seats to mark as computer-controlled
 * @returns the room with those seats added to {@link RoomState.botSeatIds}, or
 *   the same room if none were new
 */
export function markSeatsAsBots<G>(
  room: RoomState<G>,
  seatIds: readonly SeatId[],
): RoomState<G> {
  const current = room.botSeatIds ?? [];
  const merged = [...current];
  for (const seatId of seatIds) {
    if (!merged.includes(seatId)) {
      merged.push(seatId);
    }
  }
  return merged.length === current.length
    ? room
    : bump({ ...room, botSeatIds: merged });
}

/**
 * Tells whether a seat is played by the computer.
 *
 * @param room - the room
 * @param seatId - the seat to check
 * @returns true if the computer plays this seat
 */
export function isBotSeat<G>(room: RoomState<G>, seatId: SeatId): boolean {
  return (room.botSeatIds ?? []).includes(seatId);
}

/**
 * Applies a move a seat wants to make, if it is really their turn.
 *
 * @param room - a room in play
 * @param adapter - the game's online adapter
 * @param seatId - the seat asking to move
 * @param move - the move they want to make
 * @returns the room after the move, or unchanged if it was not allowed
 * @remarks
 * The host is the referee: a move only lands when the adapter accepts it from
 * that seat. Anything else is ignored, so a guest cannot move out of turn or
 * play an illegal card by talking to the host directly.
 */
export function applySeatMove<G, M, H, O>(
  room: RoomState<G>,
  adapter: OnlineAdapter<G, M, H, O>,
  seatId: SeatId,
  move: M,
): RoomState<G> {
  if (room.phase !== "playing" || room.game === null) {
    return room;
  }
  const seatIndex = room.seats.findIndex((seat) => seat.id === seatId);
  if (seatIndex < 0) {
    return room;
  }
  const game = adapter.applyMove(room.game, seatIndex, move);
  if (game === null) {
    return room;
  }
  return bump({
    ...room,
    game,
    phase: adapter.isFinished(game) ? "finished" : "playing",
  });
}

/**
 * The seat whose turn it is, or null outside of play.
 *
 * @param room - the room
 * @param adapter - the game's online adapter
 * @returns the seat on turn
 */
export function seatOnTurn<G, M, H, O>(
  room: RoomState<G>,
  adapter: OnlineAdapter<G, M, H, O>,
): Seat | null {
  if (room.phase !== "playing" || room.game === null) {
    return null;
  }
  const index = adapter.seatIndexOnTurn(room.game);
  return index === null ? null : (room.seats[index] ?? null);
}

/** Bumps the version so stale snapshots can be told apart. */
function bump<G>(room: RoomState<G>): RoomState<G> {
  return { ...room, version: room.version + 1 };
}
