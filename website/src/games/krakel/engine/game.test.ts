/**
 * Tests for the authoritative Krakel Orakel game logic.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import {
  addStroke,
  allGuessed,
  clearStrokes,
  createGame,
  drawerId,
  submitGuess,
  tick,
  undoStroke,
  type KrakelGame,
} from "./game";
import { DRAW_SECONDS, REVEAL_SECONDS, ROUNDS_PER_PLAYER } from "./types";

/** A three-player game starting at t=0. */
function threePlayers(): KrakelGame {
  return createGame(["a", "b", "c"], 42, 0);
}

/** A stroke with a couple of points. */
const STROKE = {
  color: "#000000",
  width: 0.02,
  points: [
    { x: 0.1, y: 0.1 },
    { x: 0.2, y: 0.2 },
  ],
};

describe("createGame", () => {
  it("opens in the first drawing round with zeroed scores", () => {
    const game = threePlayers();
    expect(game.phase).toBe("drawing");
    expect(game.round).toBe(1);
    expect(game.totalRounds).toBe(3 * ROUNDS_PER_PLAYER);
    expect(drawerId(game)).toBe("a");
    expect(game.scores).toEqual({ a: 0, b: 0, c: 0 });
    expect(game.term.length).toBeGreaterThan(0);
  });
});

describe("submitGuess", () => {
  it("scores the guesser and the drawer on a correct guess", () => {
    const game = threePlayers();
    const { game: after, result } = submitGuess(game, "b", game.term);
    expect(result).toBe("correct");
    expect(after.guessed).toEqual(["b"]);
    expect(after.scores.b).toBeGreaterThan(0);
    expect(after.scores.a).toBeGreaterThan(0); // the drawer earns too
  });

  it("rewards an earlier guess more than a later one", () => {
    const game = threePlayers();
    const first = submitGuess(game, "b", game.term).game;
    const second = submitGuess(first, "c", game.term).game;
    expect(second.scores.b).toBeGreaterThan(second.scores.c);
  });

  it("ignores the drawer's own text and repeats", () => {
    const game = threePlayers();
    expect(submitGuess(game, "a", game.term).result).toBe("ignored");
    const once = submitGuess(game, "b", game.term).game;
    expect(submitGuess(once, "b", game.term).result).toBe("already");
  });

  it("reports a wrong guess without scoring", () => {
    const game = threePlayers();
    const wrong = game.term === "Haus" ? "Baum" : "Haus";
    const { game: after, result } = submitGuess(game, "b", wrong);
    expect(result).toBe("wrong");
    expect(after.scores).toEqual(game.scores);
  });
});

describe("tick", () => {
  it("goes to reveal when the timer runs out", () => {
    const game = threePlayers();
    const revealed = tick(game, DRAW_SECONDS * 1000 + 1);
    expect(revealed.phase).toBe("reveal");
  });

  it("goes to reveal early once everyone has guessed", () => {
    let game = threePlayers();
    game = submitGuess(game, "b", game.term).game;
    game = submitGuess(game, "c", game.term).game;
    expect(allGuessed(game)).toBe(true);
    expect(tick(game, 1).phase).toBe("reveal");
  });

  it("rotates the drawer into the next round after the reveal", () => {
    const game = threePlayers();
    const revealed = tick(game, DRAW_SECONDS * 1000 + 1);
    const next = tick(revealed, revealed.deadline + 1);
    expect(next.phase).toBe("drawing");
    expect(next.round).toBe(2);
    expect(drawerId(next)).toBe("b");
    expect(next.strokes).toHaveLength(0);
  });

  it("ends the game after the last round", () => {
    let game = threePlayers();
    // Fast-forward through every round.
    for (let i = 0; i < game.totalRounds; i++) {
      game = tick(game, game.deadline + 1); // to reveal
      game = tick(game, game.deadline + 1); // to next round or over
    }
    expect(game.phase).toBe("over");
  });
});

describe("drawing", () => {
  it("adds, clears and undoes strokes", () => {
    let game = threePlayers();
    game = addStroke(game, STROKE);
    game = addStroke(game, STROKE);
    expect(game.strokes).toHaveLength(2);
    game = undoStroke(game);
    expect(game.strokes).toHaveLength(1);
    game = clearStrokes(game);
    expect(game.strokes).toHaveLength(0);
  });

  it("does not accept strokes outside the drawing phase", () => {
    const game = tick(threePlayers(), DRAW_SECONDS * 1000 + 1); // reveal
    expect(addStroke(game, STROKE).strokes).toHaveLength(0);
  });
});

describe("timing constants", () => {
  it("uses the tuned reveal window", () => {
    const game = tick(threePlayers(), DRAW_SECONDS * 1000 + 5);
    expect(game.deadline).toBeGreaterThanOrEqual(
      DRAW_SECONDS * 1000 + REVEAL_SECONDS * 1000,
    );
  });
});
