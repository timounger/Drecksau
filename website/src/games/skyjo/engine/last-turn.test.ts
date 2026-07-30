/**
 * Tests the last-turn rule: once somebody is out, everyone else gets one more
 * turn - no more, no less.
 *
 * @module
 * @remarks
 * This is the rule most easily got wrong by one, so it is measured rather than
 * argued: whole games are played out and the turns after the round was ended
 * are counted per seat.
 */
import { describe, expect, it } from "vitest";
import { aiMove } from "./ai";
import { applyMove } from "./moves";
import { createGame, soloSeats } from "./setup";
import { isLayoutComplete, type SkyjoGame } from "./state";

/** Enough moves for any round; a hang trips this rather than loop forever. */
const MOVE_LIMIT = 5000;

/** What one round looked like from the moment somebody finished. */
type LastLap = {
  /** The seat that turned its last card up. */
  readonly ender: number;
  /** How many further turns each seat got, by seat index. */
  readonly turnsAfter: readonly number[];
  /** The phase the round ended in. */
  readonly phase: SkyjoGame["phase"];
};

/**
 * Plays one round out and reports what happened after it was ended.
 *
 * @param seats - how many players sit at the table
 * @param seed - the deal to play
 * @returns the ender and the turns every seat took afterwards
 */
function playLastLap(seats: number, seed: number): LastLap {
  let game = createGame(soloSeats("Bot", seats - 1), seed);
  const turnsAfter = Array.from({ length: seats }, () => 0);
  let previousTurn = game.turn;
  let counting = false;
  let moves = 0;

  while (game.phase !== "roundOver" && game.phase !== "gameOver") {
    const before = game.endedBy;
    const move = aiMove(game);
    expect(move).not.toBeNull();
    const next = applyMove(game, game.turn, move!);
    expect(next).not.toBeNull();
    game = next!;
    moves += 1;
    expect(moves).toBeLessThan(MOVE_LIMIT);

    // From the moment the round is ended, count every fresh turn that starts.
    if (before === null && game.endedBy !== null) {
      counting = true;
      previousTurn = game.turn;
      turnsAfter[game.turn] += 1;
    } else if (counting && game.turn !== previousTurn) {
      previousTurn = game.turn;
      if (game.phase === "turn") {
        turnsAfter[game.turn] += 1;
      }
    }
  }
  return { ender: game.endedBy!, turnsAfter, phase: game.phase };
}

describe("the last lap", () => {
  for (const seats of [2, 3, 4, 5, 8]) {
    it(`gives every other player exactly one more turn (${seats} players)`, () => {
      for (let seed = 0; seed < 6; seed++) {
        const lap = playLastLap(seats, seats * 100 + seed);
        lap.turnsAfter.forEach((turns, seat) => {
          if (seat === lap.ender) {
            // Whoever ended the round does not play again.
            expect(turns, `seat ${seat} ended and must not play again`).toBe(0);
          } else {
            expect(turns, `seat ${seat} must get exactly one more turn`).toBe(
              1,
            );
          }
        });
      }
    });
  }

  it("scores the round as soon as the last lap is over", () => {
    const lap = playLastLap(4, 77);
    expect(["roundOver", "gameOver"]).toContain(lap.phase);
  });

  it("only the first player to finish ends the round", () => {
    // Somebody else completing their layout during the last lap must not
    // take the round end away from whoever got there first.
    let game = createGame(soloSeats("Bot", 3), 31);
    let first: number | null = null;
    let moves = 0;
    while (game.phase === "flip" || game.phase === "turn") {
      if (game.endedBy !== null && first === null) {
        first = game.endedBy;
      }
      game = applyMove(game, game.turn, aiMove(game)!) as SkyjoGame;
      expect(moves++).toBeLessThan(MOVE_LIMIT);
      if (first !== null) {
        expect(game.endedBy).toBe(first);
      }
    }
    expect(game.endedBy).toBe(first);
    expect(isLayoutComplete(game.players[first!])).toBe(true);
  });
});
