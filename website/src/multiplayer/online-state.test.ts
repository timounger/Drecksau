/**
 * Tests for hand redaction, the own-hand merge, and the wire guards.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { createGame } from "@/game/setup";
import {
  isChatPayload,
  isHand,
  isMoveIntent,
  isRoomState,
  redactHands,
  withOwnHand,
} from "./online-state";
import {
  createRoom,
  joinRoom,
  startGame,
  type RoomState,
  type Seat,
} from "./room";

const HOST: Seat = { id: "h", name: "Du", isHost: true };
const GUEST: Seat = { id: "g", name: "Berta", isHost: false };
const OPTIONS = { seed: 42, withExpansion: false, withDefense: false };

/** A room mid-game, with a dealt authoritative state. */
function playingRoom(): RoomState {
  return startGame(joinRoom(createRoom("ABCD", HOST), GUEST), OPTIONS);
}

describe("redactHands", () => {
  it("keeps every hand's size and card ids", () => {
    const game = createGame(
      [
        { name: "A", isHuman: true },
        { name: "B", isHuman: true },
      ],
      OPTIONS,
    );
    const redacted = redactHands(game);

    redacted.players.forEach((player, index) => {
      const original = game.players[index];
      expect(player.hand.map((card) => card.id)).toEqual(
        original.hand.map((card) => card.id),
      );
    });
  });

  it("hides the types: every redacted card looks the same", () => {
    const game = createGame(
      [
        { name: "A", isHuman: true },
        { name: "B", isHuman: true },
      ],
      OPTIONS,
    );
    const types = new Set(
      redactHands(game).players.flatMap((player) =>
        player.hand.map((card) => card.type),
      ),
    );
    // One decoy type for all cards - nothing about the real hand leaks.
    expect(types.size).toBe(1);
  });
});

describe("withOwnHand", () => {
  it("restores one player's hand and leaves the others redacted", () => {
    const room = playingRoom();
    const game = room.game!;
    const redacted = redactHands(game);
    const realFirstHand = game.players[0].hand;

    const merged = withOwnHand(redacted, 0, realFirstHand);

    expect(merged.players[0].hand).toEqual(realFirstHand);
    // The other player's hand is still the redacted one.
    expect(merged.players[1].hand).toEqual(redacted.players[1].hand);
  });
});

describe("isRoomState", () => {
  it("accepts a lobby room", () => {
    expect(isRoomState(createRoom("ABCD", HOST))).toBe(true);
  });

  it("accepts a playing room, even after a JSON round trip", () => {
    const room = playingRoom();
    expect(isRoomState(room)).toBe(true);
    // The winner is null while playing; JSON keeps that, which is why the
    // transport stringifies instead of writing raw to the database.
    expect(isRoomState(JSON.parse(JSON.stringify(room)))).toBe(true);
  });

  it("rejects a playing room whose game is missing", () => {
    const broken = { ...playingRoom(), game: null };
    expect(isRoomState(broken)).toBe(false);
  });

  it("accepts a valid last-effect stamp and rejects a broken one", () => {
    const room = playingRoom();
    expect(isRoomState({ ...room, lastEffect: { type: "rain", id: 3 } })).toBe(
      true,
    );
    // A stamp without a real type is malformed.
    expect(isRoomState({ ...room, lastEffect: { id: 3 } })).toBe(false);
  });

  it("rejects junk", () => {
    expect(isRoomState(null)).toBe(false);
    expect(isRoomState({ code: "ABCD" })).toBe(false);
    expect(isRoomState({ ...createRoom("ABCD", HOST), phase: "nope" })).toBe(
      false,
    );
  });
});

describe("isMoveIntent", () => {
  it("accepts a well-formed intent", () => {
    expect(isMoveIntent({ seatId: "g", move: { kind: "redrawHand" } })).toBe(
      true,
    );
    expect(
      isMoveIntent({
        seatId: "g",
        move: { kind: "playCard", cardId: "c1", targetPigId: "p0-pig0" },
      }),
    ).toBe(true);
  });

  it("rejects a bad move or a missing seat", () => {
    expect(isMoveIntent({ seatId: "g", move: { kind: "teleport" } })).toBe(
      false,
    );
    expect(isMoveIntent({ move: { kind: "redrawHand" } })).toBe(false);
    expect(isMoveIntent(null)).toBe(false);
  });
});

describe("isHand", () => {
  it("accepts a list of cards and rejects anything else", () => {
    expect(isHand([{ id: "c1", type: "mud" }])).toBe(true);
    expect(isHand([])).toBe(true);
    expect(isHand("nope")).toBe(false);
    expect(isHand([{ id: "c1" }])).toBe(false);
  });
});

describe("isChatPayload", () => {
  it("accepts a full line and rejects one missing a field", () => {
    expect(
      isChatPayload({ seatId: "g", name: "Berta", text: "Hallo \u{1F44D}" }),
    ).toBe(true);
    expect(isChatPayload({ seatId: "g", name: "Berta", text: "" })).toBe(false);
    expect(isChatPayload({ seatId: "g", text: "Hi" })).toBe(false);
    expect(isChatPayload(null)).toBe(false);
  });
});
