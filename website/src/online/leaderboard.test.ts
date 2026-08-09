/**
 * Tests for the board of best times.
 *
 * @module
 * @remarks
 * Everything that decides a place is here and nothing that talks to a network
 * is: which ten entries hold a place, whether a time is good enough for one,
 * and what to make of whatever the database happens to hold.
 */
import { describe, expect, it } from "vitest";
import {
  TOP_COUNT,
  bestOf,
  makesTheBoard,
  scoresIn,
  type Board,
  type Score,
} from "./leaderboard";

/** The drive's board: times, and the shorter the better. */
const TIMES: Board = { gameId: "rv-there-yet", field: "ms", less: true };

/** The arena's board: waves, and the further the better. */
const WAVES: Board = { gameId: "panzerkiste", field: "wave", less: false };

/** One entry, with the fields that matter given and the rest filled in. */
function score(name: string, value: number, at = 0): Score {
  return { name, value, at };
}

/** A full board of ten, each a second slower than the last. */
function full(): Score[] {
  return Array.from({ length: TOP_COUNT }, (_each, place) =>
    score(`Fahrer ${place}`, 60_000 + place * 1000, place),
  );
}

describe("the places on the board", () => {
  it("puts the quickest first", () => {
    const board = bestOf(TIMES, [
      score("A", 90),
      score("B", 30),
      score("C", 60),
    ]);
    expect(board.map((each) => each.name)).toEqual(["B", "C", "A"]);
  });

  it("gives each name one place, their best", () => {
    // Without this a single quick player takes the whole board and there is
    // nothing left for anybody else to play for.
    const board = bestOf(TIMES, [
      score("Timo", 90),
      score("Timo", 40),
      score("A", 60),
    ]);
    expect(board).toHaveLength(2);
    expect(board[0]).toEqual(score("Timo", 40));
    // Both ways round: the best of them counts, not the last one written.
    const other = bestOf(TIMES, [score("Timo", 40), score("Timo", 90)]);
    expect(other).toEqual([score("Timo", 40)]);
  });

  it("knows that Timo and timo are one person", () => {
    const board = bestOf(TIMES, [score("Timo", 90), score(" timo ", 40)]);
    expect(board).toHaveLength(1);
  });

  it("keeps a tie in the order it was driven", () => {
    // Whoever got there first keeps the higher place. Any other rule would
    // move somebody down the board because a stranger tied with them.
    const board = bestOf(TIMES, [
      score("Late", 60, 200),
      score("Early", 60, 100),
    ]);
    expect(board.map((each) => each.name)).toEqual(["Early", "Late"]);
  });

  it("has only so many places", () => {
    expect(bestOf(TIMES, [...full(), score("One more", 99_000)])).toHaveLength(
      TOP_COUNT,
    );
  });
});

describe("whether a time takes a place", () => {
  it("lets anybody on while there is room", () => {
    // The first ten to finish are all asked for a name, however slow.
    expect(makesTheBoard(TIMES, [], 999_000)).toBe(true);
    expect(makesTheBoard(TIMES, full().slice(0, 3), 999_000)).toBe(true);
  });

  it("wants a time better than the last place once it is full", () => {
    const board = full();
    const slowest = board[board.length - 1].value;
    expect(makesTheBoard(TIMES, board, slowest - 1)).toBe(true);
    expect(makesTheBoard(TIMES, board, slowest)).toBe(false);
    expect(makesTheBoard(TIMES, board, slowest + 1)).toBe(false);
  });

  it("counts the places, not the entries", () => {
    // Ten entries by one player are one place taken, not ten.
    const mine = Array.from({ length: TOP_COUNT }, (_each, n) =>
      score("Timo", 1000 + n),
    );
    expect(makesTheBoard(TIMES, mine, 999_000)).toBe(true);
  });
});

describe("a board where more is better", () => {
  it("puts the furthest first", () => {
    const board = bestOf(WAVES, [score("A", 3), score("B", 12), score("C", 7)]);
    expect(board.map((each) => each.name)).toEqual(["B", "C", "A"]);
  });

  it("keeps each player's furthest, not their quickest exit", () => {
    expect(bestOf(WAVES, [score("Timo", 4), score("Timo", 9)])).toEqual([
      score("Timo", 9),
    ]);
  });

  it("wants more than the last place once it is full", () => {
    const board = Array.from({ length: TOP_COUNT }, (_each, place) =>
      score(`Kanone ${place}`, 20 - place, place),
    );
    const weakest = board[board.length - 1].value;
    expect(makesTheBoard(WAVES, board, weakest + 1)).toBe(true);
    expect(makesTheBoard(WAVES, board, weakest)).toBe(false);
  });

  it("reads its own key out of the database", () => {
    // The drives were written with `ms` and the arenas with `wave`; each board
    // must see its own rows and nothing else.
    const stored = {
      a: { name: "Timo", wave: 14, at: 5 },
      b: { name: "X", ms: 900 },
    };
    expect(scoresIn(WAVES, stored)).toEqual([score("Timo", 14, 5)]);
  });
});

describe("what is made of what the database holds", () => {
  it("reads the entries out of it", () => {
    const stored = { a: { name: "Timo", ms: 1000, at: 5 } };
    expect(scoresIn(TIMES, stored)).toEqual([score("Timo", 1000, 5)]);
  });

  it("shrugs off anything that is not an entry", () => {
    // Anything at all can be under there: an old shape, a half-written row,
    // something somebody put in by hand. One bad row must not empty the board.
    const stored = {
      good: { name: "Timo", ms: 1000, at: 5 },
      noName: { ms: 1000 },
      blank: { name: "   ", ms: 1000 },
      noTime: { name: "A" },
      wrongTime: { name: "A", ms: "schnell" },
      negative: { name: "A", ms: -5 },
      nothing: null,
      text: "hallo",
    };
    expect(scoresIn(TIMES, stored)).toEqual([score("Timo", 1000, 5)]);
  });

  it("makes an empty board of an empty node", () => {
    expect(scoresIn(TIMES, null)).toEqual([]);
    expect(scoresIn(TIMES, undefined)).toEqual([]);
    expect(scoresIn(TIMES, "nonsense")).toEqual([]);
  });

  it("takes a missing date as long ago", () => {
    // Old entries were written without one; they still hold their place.
    expect(scoresIn(TIMES, { a: { name: "Timo", ms: 1000 } })[0].at).toBe(0);
  });
});
