/**
 * Tests for the Drecksau online adapter: hand redaction, the own-hand merge,
 * and the wire guards built from the adapter.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { createGame } from "@/games/drecksau/engine/setup";
import { makeState } from "@/games/drecksau/engine/test-helpers";
import type { GameState } from "@/games/drecksau/engine/state";
import type { RoomState, Seat } from "@/online/adapter";
import { createWireGuards } from "@/online/online-state";
import { createRoom, joinRoom, startGame } from "@/online/room";
import { drecksauAdapter, isHand, redactHands, withOwnHand } from "./adapter";

const HOST: Seat = { id: "h", name: "Du", isHost: true };
const GUEST: Seat = { id: "g", name: "Berta", isHost: false };
const DECK = { seed: 42, withExpansion: false, withDefense: false };
const { isRoomState, isMoveIntent, isChatPayload } =
  createWireGuards(drecksauAdapter);

/** A room mid-game, with a dealt authoritative state. */
function playingRoom(): RoomState<GameState> {
  const lobby = joinRoom(
    createRoom<GameState>("ABCD", HOST),
    GUEST,
    drecksauAdapter.maxPlayers,
  );
  return startGame(
    lobby,
    drecksauAdapter,
    DECK.seed,
    { withExpansion: false, withDefense: false },
    null,
  );
}

describe("redactHands", () => {
  it("keeps every hand's size and card ids", () => {
    const game = createGame(
      [
        { name: "A", isHuman: true },
        { name: "B", isHuman: true },
      ],
      DECK,
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
      DECK,
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

describe("pig state over the wire", () => {
  it("keeps a dirty pig's stall through redact, JSON and merge", () => {
    // Guards against an online-only corruption: a dirty pig in a stall (with a
    // lightning rod) must arrive intact at the client, so rain still spares it.
    const game = makeState([
      {
        pigs: [{ isDirty: true, hasBarn: true, hasLightningRod: true }],
        hand: ["rain", "mud", "mud"],
      },
      { pigs: [{}], hand: ["mud", "mud", "mud"] },
    ]);

    const overWire = JSON.parse(JSON.stringify(redactHands(game)));
    const view = withOwnHand(overWire, 0, game.players[0].hand);
    const pig = view.players[0].pigs[0];

    expect(pig.isDirty).toBe(true);
    expect(pig.barn).not.toBeNull();
    expect(pig.lightningRod).not.toBeNull();
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
    expect(isRoomState(createRoom<GameState>("ABCD", HOST))).toBe(true);
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
    expect(
      isRoomState({ ...createRoom<GameState>("ABCD", HOST), phase: "nope" }),
    ).toBe(false);
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
