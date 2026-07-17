/**
 * Tests for the host-authoritative room reducer.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { chooseAiMove } from "@/game/ai";
import { legalMoves } from "@/game/moves";
import {
  applySeatMove,
  createRoom,
  joinRoom,
  leaveRoom,
  seatOnTurn,
  startGame,
  type RoomState,
  type Seat,
} from "./room";

const HOST: Seat = { id: "h", name: "Du", isHost: true };
const GUEST: Seat = { id: "g", name: "Berta", isHost: false };
const OPTIONS = { seed: 42, withExpansion: false, withDefense: false };

/** A room with a host and one guest, still in the lobby. */
function lobbyOfTwo(): RoomState {
  return joinRoom(createRoom("ABCD", HOST), GUEST);
}

describe("lobby", () => {
  it("starts with the host as the only seat", () => {
    const room = createRoom("ABCD", HOST);
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
    let room = createRoom("ABCD", HOST);
    for (const name of ["B", "C", "D"]) {
      room = joinRoom(room, { id: name, name, isHost: false });
    }
    expect(() =>
      joinRoom(room, { id: "E", name: "E", isHost: false }),
    ).toThrow();
  });

  it("refuses a duplicate seat id", () => {
    const room = lobbyOfTwo();
    expect(() => joinRoom(room, { ...GUEST, name: "Andere" })).toThrow();
  });

  it("lets a guest leave again", () => {
    const room = leaveRoom(lobbyOfTwo(), "g");
    expect(room.seats).toHaveLength(1);
  });

  it("bumps the version on every change", () => {
    const created = createRoom("ABCD", HOST);
    const joined = joinRoom(created, GUEST);
    expect(joined.version).toBeGreaterThan(created.version);
  });
});

describe("starting the game", () => {
  it("deals a game with one player per seat, in order", () => {
    const room = startGame(lobbyOfTwo(), OPTIONS);
    expect(room.phase).toBe("playing");
    expect(room.game?.players.map((player) => player.name)).toEqual([
      "Du",
      "Berta",
    ]);
    // Every seat is a human - the host runs no AI.
    expect(room.game?.players.every((player) => player.isHuman)).toBe(true);
  });

  it("refuses to start with a single player", () => {
    expect(() => startGame(createRoom("ABCD", HOST), OPTIONS)).toThrow();
  });
});

describe("the host as referee", () => {
  it("names the seat whose turn it is", () => {
    const room = startGame(lobbyOfTwo(), OPTIONS);
    expect(seatOnTurn(room)?.id).toBe(room.seats[0].id);
  });

  it("applies a move from the seat on turn", () => {
    const room = startGame(lobbyOfTwo(), OPTIONS);
    const mover = seatOnTurn(room)!;
    const move = legalMoves(room.game!)[0];
    const next = applySeatMove(room, mover.id, move);
    expect(next.version).toBeGreaterThan(room.version);
    // The turn has moved on.
    expect(next.game?.currentPlayerIndex).not.toBe(
      room.game?.currentPlayerIndex,
    );
  });

  it("ignores a move from a seat that is not on turn", () => {
    const room = startGame(lobbyOfTwo(), OPTIONS);
    const notMover = room.seats.find(
      (seat) => seat.id !== seatOnTurn(room)!.id,
    )!;
    const move = legalMoves(room.game!)[0];
    expect(applySeatMove(room, notMover.id, move)).toBe(room);
  });

  it("ignores an illegal move even from the right seat", () => {
    const room = startGame(lobbyOfTwo(), OPTIONS);
    const mover = seatOnTurn(room)!;
    const illegal = { kind: "playCard" as const, cardId: "does-not-exist" };
    expect(applySeatMove(room, mover.id, illegal)).toBe(room);
  });

  it("plays a whole two-player game through the referee", () => {
    // Drive both seats with the same heuristic the AI uses, so the reducer
    // sees a realistic sequence of legal moves from alternating seats.
    let room = startGame(lobbyOfTwo(), OPTIONS);
    let turns = 0;
    const maxTurns = 400;

    while (room.phase === "playing" && turns < maxTurns) {
      const mover = seatOnTurn(room)!;
      const move = chooseAiMove(room.game!);
      room = applySeatMove(room, mover.id, move);
      turns += 1;
    }

    expect(room.phase).toBe("finished");
    expect(room.game?.winnerId).not.toBeNull();
  });
});
