/**
 * Tests for the authoritative Krakel Orakel game logic.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import {
  addStroke,
  allReady,
  clearStrokes,
  createGame,
  currentPickerId,
  excludeWord,
  isRealTerm,
  readyUp,
  remainingWords,
  tick,
  undoStroke,
  type KrakelGame,
} from "./game";
import {
  DECOY_COUNT,
  DRAW_SECONDS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  ELIMINATE_SECONDS,
  REVEAL_SECONDS,
  TOTAL_ROUNDS,
} from "./types";
import { KRAKEL_BOARD_COUNT } from "./boards";

/** Milliseconds in a second, for building deadlines in the tests. */
const SECOND = 1000;

/** Every table the game can seat, so the rules are checked at both ends. */
const TABLE_SIZES = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (_, index) => MIN_PLAYERS + index,
);

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

/** Advances a game from its drawing phase into the elimination phase. */
function intoElimination(game: KrakelGame): KrakelGame {
  return tick(game, DRAW_SECONDS * SECOND + 1);
}

/** The first decoy still on the list. */
function someDecoy(game: KrakelGame): string {
  return remainingWords(game).filter((word) => !isRealTerm(game, word))[0];
}

/** The first real term still on the list. */
function someRealTerm(game: KrakelGame): string {
  return remainingWords(game).filter((word) => isRealTerm(game, word))[0];
}

describe("createGame", () => {
  it("opens in the first drawing round with the team on zero", () => {
    const game = threePlayers();
    expect(game.phase).toBe("drawing");
    expect(game.round).toBe(1);
    expect(game.totalRounds).toBe(TOTAL_ROUNDS);
    expect(game.score).toBe(0);
    expect(game.excluded).toEqual([]);
  });

  it("deals every player their own term and their own board", () => {
    const game = threePlayers();
    const terms = game.order.map((id) => game.terms[id]);
    expect(terms.every((term) => term.length > 0)).toBe(true);
    expect(new Set(terms).size).toBe(game.order.length);
    const boards = game.order.map((id) => game.boardIds[id]);
    expect(new Set(boards).size).toBe(game.order.length);
    for (const boardId of boards) {
      expect(boardId).toBeGreaterThanOrEqual(0);
      expect(boardId).toBeLessThan(KRAKEL_BOARD_COUNT);
    }
  });

  it("lists every term plus the decoys, and no word twice", () => {
    const game = threePlayers();
    expect(game.candidates).toHaveLength(game.order.length + DECOY_COUNT);
    expect(new Set(game.candidates).size).toBe(game.candidates.length);
    for (const id of game.order) {
      expect(game.candidates).toContain(game.terms[id]);
    }
  });
});

describe("drawing", () => {
  it("keeps every player's strokes on their own board", () => {
    let game = threePlayers();
    game = addStroke(game, "a", STROKE);
    game = addStroke(game, "a", STROKE);
    game = addStroke(game, "b", STROKE);
    expect(game.boards.a).toHaveLength(2);
    expect(game.boards.b).toHaveLength(1);
    expect(game.boards.c).toHaveLength(0);
  });

  it("undoes and clears only the given player's board", () => {
    let game = threePlayers();
    game = addStroke(addStroke(game, "a", STROKE), "b", STROKE);
    game = undoStroke(game, "a");
    expect(game.boards.a).toHaveLength(0);
    expect(game.boards.b).toHaveLength(1);
    game = clearStrokes(game, "b");
    expect(game.boards.b).toHaveLength(0);
  });

  it("does not accept strokes once a player is finished", () => {
    let game = readyUp(threePlayers(), "a");
    game = addStroke(game, "a", STROKE);
    expect(game.boards.a).toHaveLength(0);
  });

  it("does not accept strokes outside the drawing phase", () => {
    const game = intoElimination(threePlayers());
    expect(addStroke(game, "a", STROKE).boards.a).toHaveLength(0);
  });
});

describe("tick", () => {
  it("opens the boards when the drawing time runs out", () => {
    const game = intoElimination(threePlayers());
    expect(game.phase).toBe("eliminating");
    expect(currentPickerId(game)).toBe("a");
  });

  it("opens the boards early once everyone is finished", () => {
    let game = threePlayers();
    game = readyUp(readyUp(readyUp(game, "a"), "b"), "c");
    expect(allReady(game)).toBe(true);
    expect(tick(game, 1).phase).toBe("eliminating");
  });

  it("strikes a word for a player who lets the turn run out", () => {
    const game = intoElimination(threePlayers());
    const after = tick(game, game.deadline + 1);
    expect(after.excluded).toHaveLength(1);
    expect(after.excluded[0].by).toBe("a");
    expect(after.deadline).toBeGreaterThanOrEqual(
      game.deadline + ELIMINATE_SECONDS * SECOND,
    );
  });

  it("reveals the round once the last word is struck", () => {
    let game = intoElimination(threePlayers());
    for (let i = 0; i < DECOY_COUNT; i++) {
      game = excludeWord(game, currentPickerId(game), someDecoy(game), 0).game;
    }
    const revealed = tick(game, 1);
    expect(revealed.phase).toBe("reveal");
    expect(revealed.deadline).toBeGreaterThanOrEqual(REVEAL_SECONDS * SECOND);
  });

  it("deals a fresh round after the reveal, with new words", () => {
    let game = intoElimination(addStroke(threePlayers(), "a", STROKE));
    const first = [...game.candidates];
    for (let i = 0; i < DECOY_COUNT; i++) {
      game = excludeWord(game, currentPickerId(game), someDecoy(game), 0).game;
    }
    game = tick(game, 1); // reveal
    const next = tick(game, game.deadline + 1);
    expect(next.phase).toBe("drawing");
    expect(next.round).toBe(2);
    expect(next.boards.a).toHaveLength(0);
    expect(next.excluded).toEqual([]);
    expect(next.ready).toEqual([]);
    for (const word of next.candidates) {
      expect(first).not.toContain(word);
    }
  });

  it("ends the game after the last round", () => {
    let game = threePlayers();
    // Fast-forward: let every phase time out, round after round.
    for (let round = 0; round < TOTAL_ROUNDS; round++) {
      game = tick(game, game.deadline + 1); // into elimination
      for (let i = 0; i < DECOY_COUNT; i++) {
        game = tick(game, game.deadline + 1); // a struck word per turn
      }
      game = tick(game, game.deadline + 1); // into reveal
      game = tick(game, game.deadline + 1); // next round, or over
    }
    expect(game.phase).toBe("over");
  });
});

describe("excludeWord", () => {
  it("scores the team for striking a word nobody drew", () => {
    const game = intoElimination(threePlayers());
    const { game: after, result } = excludeWord(game, "a", someDecoy(game), 0);
    expect(result).toBe("excluded");
    expect(after.score).toBeGreaterThan(0);
    expect(after.roundScore).toBe(after.score);
    expect(after.excluded[0].wasDecoy).toBe(true);
  });

  it("costs the team for striking a word somebody drew", () => {
    const game = intoElimination(threePlayers());
    const { game: after } = excludeWord(game, "a", someRealTerm(game), 0);
    expect(after.score).toBeLessThan(0);
    expect(after.excluded[0].wasDecoy).toBe(false);
  });

  it("passes the turn on to the next player", () => {
    let game = intoElimination(threePlayers());
    expect(currentPickerId(game)).toBe("a");
    game = excludeWord(game, "a", someDecoy(game), 0).game;
    expect(currentPickerId(game)).toBe("b");
    game = excludeWord(game, "b", someDecoy(game), 0).game;
    expect(currentPickerId(game)).toBe("c");
  });

  it("carries the rotation on into the next round", () => {
    let game = intoElimination(createGame(["a", "b", "c"], 42, 0));
    for (let i = 0; i < DECOY_COUNT; i++) {
      game = excludeWord(game, currentPickerId(game), someDecoy(game), 0).game;
    }
    // Four struck, three players - so the next round opens on the fifth turn.
    game = tick(game, 1); // reveal
    game = intoElimination(tick(game, game.deadline + 1));
    expect(game.excluded).toEqual([]);
    expect(currentPickerId(game)).toBe("b");
  });

  it("gives every player a turn, however many are playing", () => {
    // A round only has DECOY_COUNT turns, so with more players than that the
    // rotation has to run on across rounds or the last ones never get to pick.
    for (const size of TABLE_SIZES) {
      const ids = Array.from({ length: size }, (_, i) => `p${i}`);
      let game = createGame(ids, 42, 0);
      const pickers = new Set<string>();
      for (let round = 0; round < TOTAL_ROUNDS; round++) {
        game = intoElimination(game);
        for (let i = 0; i < DECOY_COUNT; i++) {
          const picker = currentPickerId(game);
          pickers.add(picker);
          game = excludeWord(game, picker, someDecoy(game), 0).game;
        }
        game = tick(game, 1);
        game = tick(game, game.deadline + 1);
      }
      expect([...pickers].sort()).toEqual([...ids].sort());
    }
  });

  it("ignores a player who is not on turn", () => {
    const game = intoElimination(threePlayers());
    const { game: after, result } = excludeWord(game, "b", someDecoy(game), 0);
    expect(result).toBe("ignored");
    expect(after).toBe(game);
  });

  it("ignores a word that is not on the list any more", () => {
    let game = intoElimination(threePlayers());
    const word = someDecoy(game);
    game = excludeWord(game, "a", word, 0).game;
    expect(excludeWord(game, "b", word, 0).result).toBe("ignored");
    expect(excludeWord(game, "b", "Nichtwort", 0).result).toBe("ignored");
  });

  it("ignores a strike outside the elimination phase", () => {
    const game = threePlayers();
    expect(excludeWord(game, "a", game.candidates[0], 0).result).toBe(
      "ignored",
    );
  });

  it("takes the struck words off the remaining list", () => {
    let game = intoElimination(threePlayers());
    const before = remainingWords(game).length;
    game = excludeWord(game, "a", someDecoy(game), 0).game;
    expect(remainingWords(game)).toHaveLength(before - 1);
  });
});

describe("readyUp", () => {
  it("marks a player once and ignores anyone not in the game", () => {
    let game = readyUp(threePlayers(), "a");
    game = readyUp(game, "a");
    expect(game.ready).toEqual(["a"]);
    expect(readyUp(game, "zz").ready).toEqual(["a"]);
  });
});
