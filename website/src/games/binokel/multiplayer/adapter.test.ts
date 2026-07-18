/**
 * Tests for the Binokel online adapter: a whole match refereed through the
 * shared room reducer, plus redaction, the Dabb vault and the wire guards.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import type { GameState } from "@/games/binokel/engine/state";
import type { RoomState, Seat } from "@/online/adapter";
import { createWireGuards } from "@/online/online-state";
import {
  applySeatMove,
  createRoom,
  joinRoom,
  seatOnTurn,
  startGame,
} from "@/online/room";
import { binokelAdapter, isHand, isMove } from "./adapter";

const SEATS: readonly Seat[] = [
  { id: "a", name: "Du", isHost: true },
  { id: "b", name: "Anna", isHost: false },
  { id: "c", name: "Berta", isHost: false },
];
const { isRoomState, isMoveIntent } = createWireGuards(binokelAdapter);

/** A room with three seated players, ready to start. */
function lobbyOfThree(): RoomState<GameState> {
  let room = createRoom<GameState>("ABCD", SEATS[0]);
  room = joinRoom(room, SEATS[1], binokelAdapter.maxPlayers);
  room = joinRoom(room, SEATS[2], binokelAdapter.maxPlayers);
  return room;
}

/** Deals a match with a low target so a test finishes quickly. */
function startedMatch(targetScore: number): RoomState<GameState> {
  return startGame(
    lobbyOfThree(),
    binokelAdapter,
    99,
    { withSevens: true, targetScore },
    null,
  );
}

describe("refereeing a whole match through the room", () => {
  it("drives every phase to a finished match with the AI on each seat", () => {
    let room = startedMatch(100);
    let turns = 0;
    const maxTurns = 3000;

    while (room.phase === "playing" && turns < maxTurns) {
      const onTurn = seatOnTurn(room, binokelAdapter)!;
      const move = binokelAdapter.aiMove(room.game!)!;
      const next = applySeatMove(room, binokelAdapter, onTurn.id, move);
      // Every AI move for the seat on turn must be accepted.
      expect(next).not.toBe(room);
      room = next;
      turns += 1;
    }

    expect(room.phase).toBe("finished");
    expect(room.game?.phase).toBe("matchEnd");
    expect(room.game?.matchWinnerId).not.toBeNull();
  });

  it("rejects a move from a seat that may not act now", () => {
    const room = startedMatch(1000);
    const onTurn = seatOnTurn(room, binokelAdapter)!;
    const other = room.seats.find((seat) => seat.id !== onTurn.id)!;
    // In the bidding phase only the seat on turn may bid.
    expect(applySeatMove(room, binokelAdapter, other.id, { kind: "bid" })).toBe(
      room,
    );
  });

  it("rejects a move that does not fit the phase", () => {
    const room = startedMatch(1000);
    const onTurn = seatOnTurn(room, binokelAdapter)!;
    // No card is played during bidding.
    expect(
      applySeatMove(room, binokelAdapter, onTurn.id, {
        kind: "playCard",
        cardId: "whatever",
      }),
    ).toBe(room);
  });
});

describe("redaction and the Dabb vault", () => {
  const game = binokelAdapter.createGame(
    [{ name: "Du" }, { name: "Anna" }, { name: "Berta" }],
    { withSevens: true, targetScore: 1000 },
    7,
  );

  it("hides every hand and the Dabb, keeping ids and counts", () => {
    const redacted = binokelAdapter.redact(game);

    redacted.players.forEach((player, index) => {
      expect(player.hand.map((card) => card.id)).toEqual(
        game.players[index].hand.map((card) => card.id),
      );
    });
    // Nothing about the real cards leaks: one decoy face for all of them.
    const faces = new Set(
      [...redacted.players.flatMap((p) => p.hand), ...redacted.dabb].map(
        (card) => `${card.suit}-${card.rank}`,
      ),
    );
    expect(faces.size).toBe(1);
    expect(redacted.dabb).toHaveLength(game.dabb.length);
  });

  it("carries the real Dabb in the vault while bidding", () => {
    const vaulted = binokelAdapter.vault!(game);
    expect(vaulted).toEqual(game.dabb);
    // Once the Dabb is gone (post-exchange), there is nothing to stash.
    expect(binokelAdapter.vault!({ ...game, dabb: [] })).toBeNull();
  });

  it("restores one seat's own hand over a redacted state", () => {
    const redacted = binokelAdapter.redact(game);
    const merged = binokelAdapter.withOwnHand(redacted, 1, [
      ...game.players[1].hand,
    ]);
    expect(merged.players[1].hand).toEqual(game.players[1].hand);
    expect(merged.players[0].hand).toEqual(redacted.players[0].hand);
  });

  it("rebuilds all hands and the Dabb for a taking-over host", () => {
    const redacted = binokelAdapter.redact(game);
    const withDabb = binokelAdapter.applyVault!(redacted, [...game.dabb]);
    const rebuilt = binokelAdapter.withAllHands(
      withDabb,
      game.players.map((player) => [...player.hand]),
    );
    expect(rebuilt.dabb).toEqual(game.dabb);
    rebuilt.players.forEach((player, index) => {
      expect(player.hand).toEqual(game.players[index].hand);
    });
  });
});

describe("wire guards", () => {
  it("accepts a real state, redacted state and a JSON round trip", () => {
    const room = startedMatch(1000);
    expect(isRoomState(room)).toBe(true);
    expect(isRoomState(JSON.parse(JSON.stringify(room)))).toBe(true);
    const redacted = { ...room, game: binokelAdapter.redact(room.game!) };
    expect(isRoomState(redacted)).toBe(true);
  });

  it("validates moves and rejects junk", () => {
    expect(isMove({ kind: "bid" })).toBe(true);
    expect(isMove({ kind: "trump", suit: "herz" })).toBe(true);
    expect(isMove({ kind: "discard", cardIds: ["x", "y"] })).toBe(true);
    expect(isMove({ kind: "trump", suit: "spades" })).toBe(false);
    expect(isMove({ kind: "teleport" })).toBe(false);
    expect(isMove(null)).toBe(false);
    expect(isMoveIntent({ seatId: "a", move: { kind: "pass" } })).toBe(true);
    expect(isMoveIntent({ move: { kind: "pass" } })).toBe(false);
  });

  it("accepts a list of cards and rejects anything else", () => {
    expect(isHand([{ id: "c1", suit: "herz", rank: "daus" }])).toBe(true);
    expect(isHand([])).toBe(true);
    expect(isHand([{ id: "c1" }])).toBe(false);
    expect(isHand("nope")).toBe(false);
  });
});
