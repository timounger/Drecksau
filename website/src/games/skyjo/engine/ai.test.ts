/**
 * Tests for the computer player.
 *
 * @module
 * @remarks
 * The strongest check here is playing whole games out: a rule that contradicts
 * itself, a turn that never advances or a move the referee refuses all show up
 * as a game that never ends.
 */
import { describe, expect, it } from "vitest";
import { aiMove } from "./ai";
import { applyMove, legalMoves } from "./moves";
import { createGame, soloSeats } from "./setup";
import { POINT_LIMIT, layoutValue, type SkyjoGame } from "./state";

/** Enough turns for any game to finish; a hang trips this rather than loop. */
const MOVE_LIMIT = 20_000;

/** Plays a whole game out between computer players. */
function playOut(seats: number, seed: number): SkyjoGame {
  let game = createGame(soloSeats("Bot", seats - 1), seed);
  let moves = 0;
  while (game.phase !== "gameOver" && moves < MOVE_LIMIT) {
    const move = aiMove(game);
    expect(move, "the computer had no move").not.toBeNull();
    const next = applyMove(game, game.turn, move!);
    expect(next, `referee refused ${JSON.stringify(move)}`).not.toBeNull();
    game = next!;
    moves += 1;
  }
  expect(moves).toBeLessThan(MOVE_LIMIT);
  return game;
}

describe("aiMove", () => {
  it("only ever picks a move the referee allows", () => {
    let game = createGame(soloSeats("Bot", 2), 11);
    for (let step = 0; step < 400 && game.phase !== "gameOver"; step++) {
      const move = aiMove(game);
      expect(move).not.toBeNull();
      expect(legalMoves(game, game.turn)).toContainEqual(move);
      game = applyMove(game, game.turn, move!) as SkyjoGame;
      expect(game).not.toBeNull();
    }
  });

  it("takes the discard card when it clearly improves the layout", () => {
    let game = createGame(soloSeats("Bot", 1), 3);
    // Open the round so play begins.
    while (game.phase === "flip") {
      game = applyMove(game, game.turn, aiMove(game)!) as SkyjoGame;
    }
    const seat = game.turn;
    // A twelve lying face up, and a -2 on offer: an obvious swap.
    const grid = game.players[seat].grid.map((slot, index) =>
      index === 0 ? { state: "up" as const, value: 12 } : slot,
    );
    const staged: SkyjoGame = {
      ...game,
      players: game.players.map((player, index) =>
        index === seat ? { ...player, grid } : player,
      ),
      discard: [...game.discard, -2],
    };
    expect(aiMove(staged)).toEqual({ kind: "takeDiscard", index: 0 });
  });

  it("completes a column when it can", () => {
    let game = createGame(soloSeats("Bot", 1), 5);
    while (game.phase === "flip") {
      game = applyMove(game, game.turn, aiMove(game)!) as SkyjoGame;
    }
    const seat = game.turn;
    // Two eights up in the first column, an eight on the discard pile.
    const grid = game.players[seat].grid.map((slot, index) => {
      let next = slot;
      if (index === 0 || index === 4) {
        next = { state: "up" as const, value: 8 };
      } else if (index === 8) {
        next = { state: "down" as const, value: 1 };
      }
      return next;
    });
    const staged: SkyjoGame = {
      ...game,
      players: game.players.map((player, index) =>
        index === seat ? { ...player, grid } : player,
      ),
      discard: [...game.discard, 8],
    };
    expect(aiMove(staged)).toEqual({ kind: "takeDiscard", index: 8 });
  });

  it("never reads a face-down card", () => {
    // Two games identical but for the hidden values must draw the same move.
    let game = createGame(soloSeats("Bot", 1), 9);
    while (game.phase === "flip") {
      game = applyMove(game, game.turn, aiMove(game)!) as SkyjoGame;
    }
    const scrambled: SkyjoGame = {
      ...game,
      players: game.players.map((player) => ({
        ...player,
        grid: player.grid.map((slot) =>
          slot.state === "down" ? { ...slot, value: 12 } : slot,
        ),
      })),
    };
    expect(aiMove(scrambled)).toEqual(aiMove(game));
  });
});

describe("whole games", () => {
  for (const seats of [2, 3, 5, 8]) {
    it(`plays out with ${seats} players`, () => {
      const game = playOut(seats, seats * 17);
      expect(game.phase).toBe("gameOver");
      expect(
        Math.max(...game.players.map((p) => p.total)),
      ).toBeGreaterThanOrEqual(POINT_LIMIT);
      // Every layout is fully turned up once a round has been scored.
      for (const player of game.players) {
        expect(player.grid.every((slot) => slot.state !== "down")).toBe(true);
      }
    });
  }

  it("plays sensibly, not randomly", () => {
    // A round of blind play averages around 60; the heuristic should beat that
    // comfortably. This guards against a change that quietly breaks the logic.
    const totals: number[] = [];
    for (let seed = 0; seed < 12; seed++) {
      const game = playOut(3, seed);
      const rounds = game.round;
      totals.push(
        Math.min(...game.players.map((p) => p.total)) / Math.max(1, rounds),
      );
    }
    const average =
      totals.reduce((sum, value) => sum + value, 0) / totals.length;
    expect(average).toBeLessThan(25);
  });

  it("keeps the deck honest all the way through", () => {
    const game = playOut(4, 123);
    const seen = [
      ...game.players.flatMap((p) =>
        p.grid.filter((s) => s.state !== "gone").map((s) => s.value),
      ),
      ...game.deck,
      ...game.discard,
    ];
    // Cards leave the layout only onto the discard pile, so nothing is lost.
    expect(seen.length).toBe(150);
  });

  it("scores what the layouts are worth", () => {
    const game = playOut(3, 77);
    for (const player of game.players) {
      // The last round's score is the value of what was left lying, possibly
      // doubled for whoever ended it.
      const value = layoutValue(player);
      expect([value, value * 2]).toContain(player.roundScore);
    }
  });
});
