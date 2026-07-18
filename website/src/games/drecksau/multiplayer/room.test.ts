/**
 * Tests for the host-authoritative room reducer, driven by the Drecksau adapter.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { chooseAiMove } from "@/games/drecksau/engine/ai";
import { legalMoves } from "@/games/drecksau/engine/moves";
import type { GameState } from "@/games/drecksau/engine/state";
import type { RoomState, Seat } from "@/online/adapter";
import {
  applySeatMove,
  createRoom,
  isBotSeat,
  joinRoom,
  leaveRoom,
  markSeatsAsBots,
  returnToLobby,
  seatOnTurn,
  startGame,
} from "@/online/room";
import { drecksauAdapter, type DrecksauOptions } from "./adapter";

const HOST: Seat = { id: "h", name: "Du", isHost: true };
const GUEST: Seat = { id: "g", name: "Berta", isHost: false };
const OPTIONS: DrecksauOptions = { withExpansion: false, withDefense: false };
const SEED = 42;

/** Deals a Drecksau game from a room, with an optional auto-play timeout. */
function start(
  room: RoomState<GameState>,
  autoPlayMs: number | null = null,
): RoomState<GameState> {
  return startGame(room, drecksauAdapter, SEED, OPTIONS, autoPlayMs);
}

/** Adds a guest, capped at the Drecksau player limit. */
function join(room: RoomState<GameState>, guest: Seat): RoomState<GameState> {
  return joinRoom(room, guest, drecksauAdapter.maxPlayers);
}

/** The seat on turn, per the Drecksau adapter. */
function onTurn(room: RoomState<GameState>): Seat | null {
  return seatOnTurn(room, drecksauAdapter);
}

/** Applies a seat's move, refereed by the Drecksau adapter. */
function apply(
  room: RoomState<GameState>,
  seatId: string,
  move: ReturnType<typeof legalMoves>[number],
): RoomState<GameState> {
  return applySeatMove(room, drecksauAdapter, seatId, move);
}

/** A room with a host and one guest, still in the lobby. */
function lobbyOfTwo(): RoomState<GameState> {
  return join(createRoom<GameState>("ABCD", HOST), GUEST);
}

describe("lobby", () => {
  it("starts with the host as the only seat", () => {
    const room = createRoom<GameState>("ABCD", HOST);
    expect(room.phase).toBe("lobby");
    expect(room.seats).toHaveLength(1);
    expect(room.seats[0].isHost).toBe(true);
    expect(room.hostId).toBe("h");
  });

  it("lets guests join, keeping them non-host", () => {
    const room = lobbyOfTwo();
    expect(room.seats.map((seat) => seat.name)).toEqual(["Du", "Berta"]);
    expect(room.seats[1].isHost).toBe(false);
  });

  it("refuses a fifth player", () => {
    let room = createRoom<GameState>("ABCD", HOST);
    for (const name of ["B", "C", "D"]) {
      room = join(room, { id: name, name, isHost: false });
    }
    expect(() => join(room, { id: "E", name: "E", isHost: false })).toThrow();
  });

  it("refuses a duplicate seat id", () => {
    const room = lobbyOfTwo();
    expect(() => join(room, { ...GUEST, name: "Andere" })).toThrow();
  });

  it("lets a guest leave again", () => {
    const room = leaveRoom(lobbyOfTwo(), "g");
    expect(room.seats).toHaveLength(1);
  });

  it("bumps the version on every change", () => {
    const created = createRoom<GameState>("ABCD", HOST);
    const joined = join(created, GUEST);
    expect(joined.version).toBeGreaterThan(created.version);
  });
});

describe("starting the game", () => {
  it("deals a game with one player per seat, in order", () => {
    const room = start(lobbyOfTwo());
    expect(room.phase).toBe("playing");
    expect(room.game?.players.map((player) => player.name)).toEqual([
      "Du",
      "Berta",
    ]);
    // Every seat is a human - the host runs no AI.
    expect(room.game?.players.every((player) => player.isHuman)).toBe(true);
  });

  it("refuses to start with a single player", () => {
    expect(() => start(createRoom<GameState>("ABCD", HOST))).toThrow();
  });

  it("stores the auto-play timeout, defaulting to none", () => {
    const timed = start(lobbyOfTwo(), 30000);
    expect(timed.autoPlayMs).toBe(30000);
    expect(start(lobbyOfTwo()).autoPlayMs).toBeNull();
  });

  it("can return to the lobby and start again with the same seats", () => {
    const playing = start(lobbyOfTwo());
    const lobby = returnToLobby(playing);

    expect(lobby.phase).toBe("lobby");
    expect(lobby.game).toBeNull();
    expect(lobby.seats).toEqual(playing.seats);
    expect(lobby.version).toBeGreaterThan(playing.version);

    // A fresh game deals again from the very same table.
    const replayed = start(lobby);
    expect(replayed.phase).toBe("playing");
    expect(replayed.game?.players.map((player) => player.name)).toEqual([
      "Du",
      "Berta",
    ]);
  });
});

describe("computer takeover when a player leaves", () => {
  it("marks a seat as a bot and reports it", () => {
    const room = start(lobbyOfTwo());
    expect(isBotSeat(room, GUEST.id)).toBe(false);

    const next = markSeatsAsBots(room, [GUEST.id]);
    expect(isBotSeat(next, GUEST.id)).toBe(true);
    expect(next.version).toBeGreaterThan(room.version);
  });

  it("leaves the room untouched when there is no new bot", () => {
    const room = markSeatsAsBots(start(lobbyOfTwo()), [GUEST.id]);
    expect(markSeatsAsBots(room, [GUEST.id])).toBe(room);
  });

  it("clears the bots when returning to the lobby", () => {
    const playing = markSeatsAsBots(start(lobbyOfTwo()), [GUEST.id]);
    expect(returnToLobby(playing).botSeatIds).toEqual([]);
    expect(isBotSeat(returnToLobby(playing), GUEST.id)).toBe(false);
  });
});

describe("the host as referee", () => {
  it("names the seat whose turn it is", () => {
    const room = start(lobbyOfTwo());
    expect(onTurn(room)?.id).toBe(room.seats[0].id);
  });

  it("applies a move from the seat on turn", () => {
    const room = start(lobbyOfTwo());
    const mover = onTurn(room)!;
    const move = legalMoves(room.game!)[0];
    const next = apply(room, mover.id, move);
    expect(next.version).toBeGreaterThan(room.version);
    // The turn has moved on.
    expect(next.game?.currentPlayerIndex).not.toBe(
      room.game?.currentPlayerIndex,
    );
  });

  it("ignores a move from a seat that is not on turn", () => {
    const room = start(lobbyOfTwo());
    const notMover = room.seats.find((seat) => seat.id !== onTurn(room)!.id)!;
    const move = legalMoves(room.game!)[0];
    expect(apply(room, notMover.id, move)).toBe(room);
  });

  it("ignores an illegal move even from the right seat", () => {
    const room = start(lobbyOfTwo());
    const mover = onTurn(room)!;
    const illegal = { kind: "playCard" as const, cardId: "does-not-exist" };
    expect(apply(room, mover.id, illegal)).toBe(room);
  });

  it("plays a whole two-player game through the referee", () => {
    // Drive both seats with the same heuristic the AI uses, so the reducer
    // sees a realistic sequence of legal moves from alternating seats.
    let room = start(lobbyOfTwo());
    let turns = 0;
    const maxTurns = 400;

    while (room.phase === "playing" && turns < maxTurns) {
      const mover = onTurn(room)!;
      const move = chooseAiMove(room.game!);
      room = apply(room, mover.id, move);
      turns += 1;
    }

    expect(room.phase).toBe("finished");
    expect(room.game?.winnerId).not.toBeNull();
  });
});
