/**
 * Tests for the Skyjo rules.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { GRID_SIZE, columnIndexes, fullDeck } from "./cards";
import { createGame, soloSeats } from "./setup";
import { applyMove, legalMoves, seatOnTurn } from "./moves";
import { isPenalised, leaders, standings } from "./scoring";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  OPENING_FLIPS,
  POINT_LIMIT,
  faceDownCount,
  isLayoutComplete,
  layoutValue,
  topOf,
  type SkyjoGame,
  type Slot,
} from "./state";

/** A two-player game against the computer, dealt from a fixed seed. */
function twoPlayers(): SkyjoGame {
  return createGame(soloSeats("Du", 1), 42);
}

/** Plays a move that must be legal, failing loudly if the rules refuse it. */
function play(
  game: SkyjoGame,
  seat: number,
  move: Parameters<typeof applyMove>[2],
): SkyjoGame {
  const next = applyMove(game, seat, move);
  expect(next, `move ${JSON.stringify(move)} was refused`).not.toBeNull();
  return next as SkyjoGame;
}

/** Turns every player's opening cards up, leaving a game ready to play. */
function afterOpening(game: SkyjoGame): SkyjoGame {
  let next = game;
  while (next.phase === "flip") {
    const seat = next.turn;
    const move = legalMoves(next, seat)[0];
    next = play(next, seat, move);
  }
  return next;
}

/** Replaces one player's whole layout, for setting up a situation. */
function withGrid(
  game: SkyjoGame,
  seat: number,
  grid: readonly Slot[],
): SkyjoGame {
  return {
    ...game,
    players: game.players.map((player, index) =>
      index === seat ? { ...player, grid } : player,
    ),
  };
}

/** A layout of twelve slots, all in the same state and value. */
function evenGrid(state: Slot["state"], value: number): Slot[] {
  return Array.from({ length: GRID_SIZE }, () => ({ state, value }));
}

describe("the deck", () => {
  it("holds 150 cards from -2 to 12", () => {
    const deck = fullDeck();
    expect(deck).toHaveLength(150);
    expect(Math.min(...deck)).toBe(-2);
    expect(Math.max(...deck)).toBe(12);
  });

  it("has the printed number of each value", () => {
    const deck = fullDeck();
    const count = (value: number) =>
      deck.filter((card) => card === value).length;
    expect(count(-2)).toBe(5);
    expect(count(-1)).toBe(10);
    expect(count(0)).toBe(15);
    for (let value = 1; value <= 12; value++) {
      expect(count(value)).toBe(10);
    }
  });

  it("sums to the value the rules imply", () => {
    // 5*-2 + 10*-1 + 0 + 10*(1+..+12)
    expect(fullDeck().reduce((sum, card) => sum + card, 0)).toBe(760);
  });
});

describe("dealing", () => {
  it("gives every player twelve face-down cards", () => {
    const game = createGame(soloSeats("Du", 3), 7);
    expect(game.players).toHaveLength(4);
    for (const player of game.players) {
      expect(player.grid).toHaveLength(GRID_SIZE);
      expect(faceDownCount(player)).toBe(GRID_SIZE);
      expect(player.total).toBe(0);
    }
  });

  it("starts a discard pile and keeps the rest as the deck", () => {
    const game = createGame(soloSeats("Du", 3), 7);
    expect(game.discard).toHaveLength(1);
    // 150 cards, minus four layouts of twelve, minus the one turned up.
    expect(game.deck).toHaveLength(150 - 4 * GRID_SIZE - 1);
  });

  it("deals the same round for the same seed", () => {
    expect(createGame(soloSeats("Du", 2), 5)).toEqual(
      createGame(soloSeats("Du", 2), 5),
    );
  });

  it("deals a different round for a different seed", () => {
    expect(createGame(soloSeats("Du", 2), 5).deck).not.toEqual(
      createGame(soloSeats("Du", 2), 6).deck,
    );
  });

  it("uses every card exactly once", () => {
    const game = createGame(soloSeats("Du", 7), 3);
    const dealt = [
      ...game.players.flatMap((player) => player.grid.map((s) => s.value)),
      ...game.deck,
      ...game.discard,
    ];
    expect(dealt).toHaveLength(150);
    expect([...dealt].sort((a, b) => a - b)).toEqual(
      fullDeck().sort((a, b) => a - b),
    );
  });
});

describe("the opening", () => {
  it("lets everyone turn exactly two cards up", () => {
    const game = afterOpening(twoPlayers());
    for (const player of game.players) {
      expect(faceDownCount(player)).toBe(GRID_SIZE - OPENING_FLIPS);
    }
    expect(game.phase).toBe("turn");
  });

  it("refuses a third opening flip", () => {
    let game = twoPlayers();
    game = play(game, 0, { kind: "flip", index: 0 });
    game = play(game, 0, { kind: "flip", index: 1 });
    // The turn has moved on, so seat 0 may not flip again.
    expect(applyMove(game, 0, { kind: "flip", index: 2 })).toBeNull();
  });

  it("refuses a flip from a seat that is not on turn", () => {
    const game = twoPlayers();
    expect(applyMove(game, 1, { kind: "flip", index: 0 })).toBeNull();
  });

  it("gives the first turn to whoever shows the most", () => {
    const game = afterOpening(twoPlayers());
    const shown = game.players.map((player) =>
      player.grid.reduce(
        (sum, slot) => (slot.state === "up" ? sum + slot.value : sum),
        0,
      ),
    );
    expect(shown[game.turn]).toBe(Math.max(...shown));
  });
});

describe("a turn", () => {
  it("offers the deck and the discard pile", () => {
    const game = afterOpening(twoPlayers());
    const moves = legalMoves(game, game.turn);
    expect(moves.some((move) => move.kind === "draw")).toBe(true);
    expect(moves.some((move) => move.kind === "takeDiscard")).toBe(true);
  });

  it("offers nothing to a seat that is not on turn", () => {
    const game = afterOpening(twoPlayers());
    const other = (game.turn + 1) % game.players.length;
    expect(legalMoves(game, other)).toEqual([]);
  });

  it("swaps the discard card in and puts the old one back on top", () => {
    const game = afterOpening(twoPlayers());
    const seat = game.turn;
    const taken = topOf(game.discard) as number;
    const replaced = game.players[seat].grid[0].value;
    const next = play(game, seat, { kind: "takeDiscard", index: 0 });
    expect(next.players[seat].grid[0]).toEqual({ state: "up", value: taken });
    expect(topOf(next.discard)).toBe(replaced);
  });

  it("holds a drawn card until it is placed", () => {
    const game = afterOpening(twoPlayers());
    const seat = game.turn;
    const drawn = play(game, seat, { kind: "draw" });
    expect(drawn.drawn).not.toBeNull();
    expect(drawn.turn).toBe(seat);
    // While holding a card, drawing again is not on offer.
    expect(legalMoves(drawn, seat).some((m) => m.kind === "draw")).toBe(false);
    const placed = play(drawn, seat, { kind: "swapDrawn", index: 0 });
    expect(placed.drawn).toBeNull();
    expect(placed.turn).not.toBe(seat);
  });

  it("throws a drawn card away and turns a face-down card up instead", () => {
    const game = afterOpening(twoPlayers());
    const seat = game.turn;
    const drawn = play(game, seat, { kind: "draw" });
    const card = drawn.drawn as number;
    const down = drawn.players[seat].grid.findIndex((s) => s.state === "down");
    const next = play(drawn, seat, { kind: "discardDrawn", index: down });
    expect(topOf(next.discard)).toBe(card);
    expect(next.players[seat].grid[down].state).toBe("up");
  });

  it("does not let a drawn card be thrown away onto a face-up slot", () => {
    const game = afterOpening(twoPlayers());
    const seat = game.turn;
    const drawn = play(game, seat, { kind: "draw" });
    const up = drawn.players[seat].grid.findIndex((s) => s.state === "up");
    expect(
      applyMove(drawn, seat, { kind: "discardDrawn", index: up }),
    ).toBeNull();
  });

  it("refills the deck from the discard pile when it runs dry", () => {
    let game = afterOpening(twoPlayers());
    game = { ...game, deck: [], discard: [1, 2, 3, 4, 5] };
    const seat = game.turn;
    const next = play(game, seat, { kind: "draw" });
    expect(next.drawn).not.toBeNull();
    // The top card stays lying; the rest became the new deck, one now drawn.
    expect(next.discard).toEqual([5]);
    expect(next.deck).toHaveLength(3);
  });
});

describe("the column rule", () => {
  it("clears a column of three equal cards", () => {
    const game = afterOpening(twoPlayers());
    const seat = game.turn;
    const column = columnIndexes(0);
    // Two sevens up, the third slot ready to take a seven from the pile.
    const grid = evenGrid("down", 0);
    grid[column[0]] = { state: "up", value: 7 };
    grid[column[1]] = { state: "up", value: 7 };
    const staged = {
      ...withGrid(game, seat, grid),
      discard: [...game.discard, 7],
    };
    const next = play(staged, seat, {
      kind: "takeDiscard",
      index: column[2],
    });
    for (const index of column) {
      expect(next.players[seat].grid[index].state).toBe("gone");
    }
    // The three cards went onto the discard pile.
    expect(
      next.discard.filter((card) => card === 7).length,
    ).toBeGreaterThanOrEqual(3);
  });

  it("leaves a column alone when the third card differs", () => {
    const game = afterOpening(twoPlayers());
    const seat = game.turn;
    const column = columnIndexes(1);
    const grid = evenGrid("down", 7);
    grid[column[0]] = { state: "up", value: 7 };
    grid[column[1]] = { state: "up", value: 7 };
    // Turning this one up completes the column, but with a different value.
    grid[column[2]] = { state: "down", value: 3 };
    let staged = withGrid(game, seat, grid);
    staged = play(staged, seat, { kind: "draw" });
    const after = play(staged, seat, {
      kind: "discardDrawn",
      index: column[2],
    });
    for (const index of column) {
      expect(after.players[seat].grid[index].state).toBe("up");
    }
  });

  it("only clears when all three are face up", () => {
    const game = afterOpening(twoPlayers());
    const seat = game.turn;
    const column = columnIndexes(2);
    // Three equal cards, but the middle one is still face down.
    const grid = evenGrid("down", 0);
    grid[column[0]] = { state: "up", value: 9 };
    grid[column[1]] = { state: "down", value: 9 };
    grid[column[2]] = { state: "up", value: 9 };
    let staged = withGrid(game, seat, grid);
    staged = play(staged, seat, { kind: "draw" });
    const after = play(staged, seat, { kind: "discardDrawn", index: 0 });
    for (const index of column) {
      expect(after.players[seat].grid[index].state).not.toBe("gone");
    }
  });

  it("counts a cleared column as nothing", () => {
    const player = {
      name: "x",
      grid: [
        ...evenGrid("gone", 12).slice(0, 3),
        ...evenGrid("up", 5).slice(0, 9),
      ],
      total: 0,
      roundScore: 0,
      isBot: false,
    };
    expect(layoutValue(player)).toBe(9 * 5);
  });
});

describe("ending a round", () => {
  it("gives everybody one more turn, then scores", () => {
    const game = afterOpening(twoPlayers());
    const seat = game.turn;
    const other = (seat + 1) % game.players.length;
    // One card left face down for the seat on turn.
    const grid = evenGrid("up", 3);
    grid[11] = { state: "down", value: 4 };
    let staged = withGrid(game, seat, grid);
    staged = play(staged, seat, { kind: "draw" });
    staged = play(staged, seat, { kind: "discardDrawn", index: 11 });
    expect(staged.endedBy).toBe(seat);
    expect(staged.phase).toBe("turn");
    expect(staged.turn).toBe(other);
    // The other player's last turn closes the round.
    const closing = legalMoves(staged, other).find((m) => m.kind === "draw");
    staged = play(staged, other, closing as { kind: "draw" });
    staged = play(staged, other, { kind: "swapDrawn", index: 0 });
    expect(staged.phase).not.toBe("turn");
    expect(staged.players.every((p) => isLayoutComplete(p))).toBe(true);
  });

  it("deals a new round on request, keeping the totals", () => {
    let game = afterOpening(twoPlayers());
    game = { ...game, phase: "roundOver", endedBy: 1, turn: 1 };
    game = {
      ...game,
      players: game.players.map((p) => ({ ...p, total: 10 })),
    };
    const next = play(game, 1, { kind: "nextRound" });
    expect(next.phase).toBe("flip");
    expect(next.round).toBe(2);
    expect(next.turn).toBe(1);
    for (const player of next.players) {
      expect(player.total).toBe(10);
      expect(faceDownCount(player)).toBe(GRID_SIZE);
    }
  });
});

describe("the penalty on the player who ends the round", () => {
  it("doubles a score that is not the lowest alone", () => {
    expect(isPenalised([20, 5], 0)).toBe(true);
    expect(isPenalised([20, 20], 0)).toBe(true);
  });

  it("leaves the lowest score alone", () => {
    expect(isPenalised([5, 20], 0)).toBe(false);
  });

  it("never doubles a score of zero or less", () => {
    // Doubling a negative score would reward the gamble, not punish it.
    expect(isPenalised([-4, -10], 0)).toBe(false);
    expect(isPenalised([0, -3], 0)).toBe(false);
  });
});

describe("the end of the game", () => {
  it("ends once somebody passes the limit", () => {
    let game = afterOpening(twoPlayers());
    game = {
      ...game,
      players: game.players.map((p, i) => ({
        ...p,
        total: i === 0 ? POINT_LIMIT - 1 : 0,
        grid: evenGrid(i === 0 ? "up" : "up", 5),
      })),
      endedBy: 1,
      turn: 1,
    };
    // Seat 1's closing move scores the round and pushes seat 0 over the limit.
    const grid = evenGrid("up", 1);
    grid[0] = { state: "down", value: 1 };
    game = withGrid(game, 1, grid);
    game = { ...game, endedBy: null, turn: 1 };
    game = play(game, 1, { kind: "draw" });
    game = play(game, 1, { kind: "discardDrawn", index: 0 });
    // Seat 0 takes its last turn, which closes the round.
    game = play(game, 0, { kind: "draw" });
    game = play(game, 0, { kind: "swapDrawn", index: 0 });
    expect(game.phase).toBe("gameOver");
    expect(seatOnTurn(game)).toBeNull();
  });

  it("ranks the fewest points first", () => {
    let game = twoPlayers();
    game = {
      ...game,
      players: game.players.map((p, i) => ({ ...p, total: i === 0 ? 30 : 12 })),
    };
    expect(standings(game)).toEqual([1, 0]);
    expect(leaders(game)).toEqual([1]);
  });

  it("names every leader on a tie", () => {
    let game = twoPlayers();
    game = { ...game, players: game.players.map((p) => ({ ...p, total: 8 })) };
    expect(leaders(game)).toEqual([0, 1]);
  });
});

describe("table sizes", () => {
  it("deals every size the game seats", () => {
    for (let size = MIN_PLAYERS; size <= MAX_PLAYERS; size++) {
      const game = createGame(soloSeats("Du", size - 1), size);
      expect(game.players).toHaveLength(size);
      expect(game.deck.length).toBeGreaterThan(0);
    }
  });
});
