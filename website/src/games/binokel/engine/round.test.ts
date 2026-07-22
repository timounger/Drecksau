/**
 * End-to-end tests: a full round and a full match driven by the AI.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { cardValue } from "./cards";
import { chooseBid, chooseCard, chooseDiscard, chooseTrumpSuit } from "./ai";
import {
  applyBid,
  baseHandSize,
  chooseTrump,
  collectTrick,
  concede,
  declareGame,
  discard,
  nextRound,
  playCard,
} from "./moves";
import { createGame, type PlayerSetup } from "./setup";
import type { GameState } from "./state";

const SETUPS: readonly PlayerSetup[] = [
  { name: "Du", isHuman: true },
  { name: "Anna", isHuman: false },
  { name: "Berta", isHuman: false },
];

/** Bids, discards and names trump - stops at the melding phase. */
function driveToMelding(start: GameState): GameState {
  let state = start;
  let guard = 0;
  while (state.phase === "bidding" && guard++ < 30) {
    state = applyBid(state, chooseBid(state));
  }
  const declarer = state.players[state.declarerIndex ?? 0];
  const need = declarer.hand.length - baseHandSize(state);
  // Without a Dabb there is nothing to push away, so skip the discard.
  if (need > 0) {
    state = discard(state, chooseDiscard(state, need));
  }
  return chooseTrump(state, chooseTrumpSuit(state));
}

/** Plays out the tricks of a state that is in the trick phase. */
function playTricks(start: GameState): GameState {
  let state = start;
  let guard = 0;
  while (state.phase === "trick" && guard++ < 300) {
    // A full trick waits to be collected; otherwise the next card is played.
    state =
      state.currentTrick.length === state.players.length
        ? collectTrick(state)
        : playCard(state, chooseCard(state));
  }
  return state;
}

/** Plays one normal round to its end, every seat driven by the AI. */
function driveRound(start: GameState): GameState {
  return playTricks(declareGame(driveToMelding(start), "normal"));
}

/** Total Augen sitting in the players' won piles. */
function capturedAugen(state: GameState): number {
  return state.players.reduce(
    (sum, player) => sum + player.won.reduce((s, c) => s + cardValue(c), 0),
    0,
  );
}

describe("a full round", () => {
  it("reaches scoring with every card captured", () => {
    const state = driveRound(
      createGame(SETUPS, { seed: 7, withSevens: true, targetScore: 1000 }),
    );
    expect(["roundEnd", "matchEnd"]).toContain(state.phase);
    expect(state.players.every((p) => p.hand.length === 0)).toBe(true);
    // Every card's Augen ends up captured (tricks plus the discarded cards).
    expect(capturedAugen(state)).toBe(240);
  });

  it("names a declarer at 150 or more", () => {
    let state = createGame(SETUPS, {
      seed: 3,
      withSevens: false,
      targetScore: 1000,
    });
    while (state.phase === "bidding") {
      state = applyBid(state, chooseBid(state));
    }
    expect(state.declarerIndex).not.toBeNull();
    expect(state.highestBid).toBeGreaterThanOrEqual(150);
  });

  it("plays whole rounds for 3 to 6 players, with and without the Dabb", () => {
    for (let count = 3; count <= 6; count++) {
      const seats: PlayerSetup[] = Array.from({ length: count }, (_, i) => ({
        name: `P${i}`,
        isHuman: i === 0,
      }));
      for (const withSevens of [true, false]) {
        for (const withDabb of [true, false]) {
          const state = driveRound(
            createGame(seats, {
              seed: count,
              withSevens,
              withDabb,
              targetScore: 100000,
            }),
          );
          expect(["roundEnd", "matchEnd"]).toContain(state.phase);
          expect(state.players.every((p) => p.hand.length === 0)).toBe(true);
          // Sevens are worth 0, so the deck's total Augen is 240 either way.
          expect(capturedAugen(state)).toBe(240);
        }
      }
    }
  });

  it("plays whole rounds for many seeds without an illegal move", () => {
    for (let seed = 0; seed < 15; seed++) {
      const state = driveRound(
        createGame(SETUPS, {
          seed,
          withSevens: seed % 2 === 0,
          targetScore: 100000,
        }),
      );
      expect(["roundEnd", "matchEnd"]).toContain(state.phase);
      expect(capturedAugen(state)).toBe(240);
    }
  });
});

describe("conceding and Durch", () => {
  it("lets the declarer concede at melding for double the bid", () => {
    const melding = driveToMelding(
      createGame(SETUPS, { seed: 4, withSevens: true, targetScore: 1000000 }),
    );
    const declarer = melding.declarerIndex!;
    const bid = melding.highestBid;
    const state = concede(melding);

    expect(["roundEnd", "matchEnd"]).toContain(state.phase);
    expect(state.players[declarer].score).toBe(-2 * bid);
    state.players.forEach((player, index) => {
      if (index !== declarer) {
        expect(player.score).toBe(0);
      }
    });
  });

  it("scores a Durch as a flat plus or minus 1000", () => {
    for (let seed = 0; seed < 6; seed++) {
      const melding = driveToMelding(
        createGame(SETUPS, { seed, withSevens: true, targetScore: 1000000 }),
      );
      const declarer = melding.declarerIndex!;
      const state = playTricks(declareGame(melding, "durch"));

      expect(["roundEnd", "matchEnd"]).toContain(state.phase);
      // Flat outcome: won every trick (+1000) or not (-1000).
      expect([1000, -1000]).toContain(state.players[declarer].score);
    }
  });
});

describe("bidding", () => {
  // Fix the dealer to 0: the forehand (player 1) holds the deal, player 2 is
  // the first challenger, and the auction is a duel between two players.
  const game = () =>
    createGame(SETUPS, {
      seed: 5,
      withSevens: true,
      targetScore: 1000,
      dealerIndex: 0,
    });
  const pass = { kind: "pass" } as const;
  const bid = { kind: "bid" } as const;

  it("passes the challenge on to the next player when a challenger drops", () => {
    // Player 2 (first challenger) passes; the forehand still holds the deal, so
    // player 0 (the human) becomes the next challenger - not auto-declared.
    const state = applyBid(game(), pass);
    expect(state.phase).toBe("bidding");
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.declarerIndex).toBeNull();
  });

  it("forces the forehand, not a challenger, when every challenger passes", () => {
    let state = applyBid(game(), pass); // player 2 passes -> human's turn
    state = applyBid(state, pass); // human passes too -> only the forehand left
    expect(state.phase).toBe("exchange");
    // The forehand (player 1) is forced at the minimum, not a challenger.
    expect(state.declarerIndex).toBe(1);
    expect(state.highestBid).toBe(150);
  });

  it("makes the holder answer a raise, then declares the survivor", () => {
    let state = applyBid(game(), pass); // player 2 passes -> human's turn
    state = applyBid(state, bid); // human (0) bids 150 -> forehand must answer
    expect(state.phase).toBe("bidding");
    expect(state.currentPlayerIndex).toBe(1); // the forehand it topped
    state = applyBid(state, pass); // the forehand drops -> the human wins
    expect(state.phase).toBe("exchange");
    expect(state.declarerIndex).toBe(0);
    expect(state.highestBid).toBe(150);
  });

  it("keeps two players duelling, then sends the winner on to the next", () => {
    const seats: PlayerSetup[] = Array.from({ length: 4 }, (_, i) => ({
      name: `P${i}`,
      isHuman: i === 0,
    }));
    // Dealer 0 -> forehand 1 holds, player 2 challenges first.
    let state = createGame(seats, {
      seed: 3,
      withSevens: true,
      targetScore: 1000,
      dealerIndex: 0,
    });
    expect(state.currentPlayerIndex).toBe(2);
    state = applyBid(state, bid); // player 2 bids 150 -> forehand answers
    expect(state.currentPlayerIndex).toBe(1);
    state = applyBid(state, bid); // forehand raises to 160 -> back to player 2
    expect(state.currentPlayerIndex).toBe(2); // still the same two duelling
    state = applyBid(state, pass); // player 2 drops -> the forehand faces player 3
    expect(state.phase).toBe("bidding");
    expect(state.currentPlayerIndex).toBe(3);
    state = applyBid(state, pass); // player 3 drops -> next challenger, player 0
    expect(state.currentPlayerIndex).toBe(0);
    state = applyBid(state, pass); // player 0 drops -> the forehand wins
    expect(state.phase).toBe("exchange");
    expect(state.declarerIndex).toBe(1);
    expect(state.highestBid).toBe(160);
  });
});

describe("teams", () => {
  const fourSeats: PlayerSetup[] = Array.from({ length: 4 }, (_, i) => ({
    name: `P${i}`,
    isHuman: i === 0,
  }));

  it("pools points within teams over the cross partnership", () => {
    const state = driveRound(
      createGame(fourSeats, {
        seed: 3,
        withSevens: true,
        teams: true,
        targetScore: 1000000,
      }),
    );
    expect(state.teams).toBe(true);
    // Partners sit across (0 with 2, 1 with 3) and share one cumulative score.
    expect(state.players[0].score).toBe(state.players[2].score);
    expect(state.players[1].score).toBe(state.players[3].score);
    expect(capturedAugen(state)).toBe(240);
  });

  it("ignores teams for odd player counts", () => {
    const threeSeats: PlayerSetup[] = Array.from({ length: 3 }, (_, i) => ({
      name: `P${i}`,
      isHuman: i === 0,
    }));
    const state = createGame(threeSeats, {
      seed: 1,
      withSevens: true,
      teams: true,
      targetScore: 1000,
    });
    expect(state.teams).toBe(false);
  });
});

describe("a full match", () => {
  it("runs rounds until someone reaches the target", () => {
    let state = createGame(SETUPS, {
      seed: 11,
      withSevens: true,
      targetScore: 200,
    });
    let guard = 0;
    while (state.phase !== "matchEnd" && guard++ < 60) {
      state = driveRound(state);
      if (state.phase === "roundEnd") {
        state = nextRound(state);
      }
    }
    expect(state.phase).toBe("matchEnd");
    expect(state.matchWinnerId).not.toBeNull();
  });
});
