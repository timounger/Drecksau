/**
 * Tests that online redaction opens hands during melding but hides them
 * otherwise, so every player sees everyone's melds when they are announced.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { findMelds } from "@/games/binokel/engine/melds";
import type { Card, Rank, Suit } from "@/games/binokel/engine/cards";
import type { GameState } from "@/games/binokel/engine/state";
import { binokelAdapter } from "./adapter";

/** A full family (A-10-K-O-U) of one suit - a 100-point meld. */
function family(suit: Suit): Card[] {
  const ranks: Rank[] = ["daus", "zehn", "koenig", "ober", "unter"];
  return ranks.map((rank) => ({ id: `${suit}-${rank}`, suit, rank }));
}

/** A minimal player carrying just what redaction and melds read. */
function player(id: string, hand: Card[]): GameState["players"][number] {
  return {
    id,
    name: id,
    isHuman: true,
    hand,
  } as unknown as GameState["players"][number];
}

/** A three-player game at the given phase, each holding a family. */
function gameAt(phase: GameState["phase"]): GameState {
  return {
    players: [
      player("P0", family("eichel")),
      player("P1", family("blatt")),
      player("P2", family("herz")),
    ],
    withSevens: true,
    withDabb: true,
    teams: false,
    targetScore: 1000,
    dealerIndex: 0,
    phase,
    dabb: [],
    takenDabb: [],
    trump: "schellen",
  } as unknown as GameState;
}

/** What a guest at seat 0 can compute per seat after redaction + own hand. */
function guestMeldTotals(phase: GameState["phase"]): number[] {
  const game = gameAt(phase);
  const shared = binokelAdapter.redact(game);
  const guest = binokelAdapter.withOwnHand(shared, 0, [
    ...game.players[0].hand,
  ]);
  return guest.players.map(
    (p) => findMelds(p.hand, game.trump, game.withSevens).total,
  );
}

describe("online redaction", () => {
  it("lets a guest see every player's melds during melding", () => {
    expect(guestMeldTotals("melding")).toEqual([100, 100, 100]);
  });

  it("still hides the other players' hands during trick play", () => {
    const totals = guestMeldTotals("trick");
    expect(totals[0]).toBe(100); // the guest's own melds
    expect(totals[1]).toBe(0); // opponents stay redacted
    expect(totals[2]).toBe(0);
  });
});
