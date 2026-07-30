/**
 * Tests that the three difficulty levels really play differently.
 *
 * @module
 * @remarks
 * A setting that changes nothing is worse than no setting, so this measures the
 * levels against each other rather than just checking they are accepted.
 */
import { describe, expect, it } from "vitest";
import { aiMove } from "./ai";
import { DEFAULT_DIFFICULTY, DIFFICULTIES, isDifficulty } from "./difficulty";
import { applyMove } from "./moves";
import { createGame, soloSeats } from "./setup";
import type { Difficulty } from "./difficulty";
import type { SkyjoGame } from "./state";

/** Enough turns for any game to finish; a hang trips this rather than loop. */
const MOVE_LIMIT = 20_000;

/** Plays a whole game out with every seat on the same level. */
function playOut(seats: number, seed: number, level: Difficulty): SkyjoGame {
  let game = createGame(soloSeats("Bot", seats - 1), seed);
  let moves = 0;
  while (game.phase !== "gameOver" && moves < MOVE_LIMIT) {
    const move = aiMove(game, level);
    expect(move).not.toBeNull();
    const next = applyMove(game, game.turn, move!);
    expect(next, `referee refused ${JSON.stringify(move)}`).not.toBeNull();
    game = next!;
    moves += 1;
  }
  expect(moves).toBeLessThan(MOVE_LIMIT);
  return game;
}

/** The average points per round a level scores over a handful of games. */
function averagePerRound(level: Difficulty): number {
  const rates: number[] = [];
  for (let seed = 0; seed < 14; seed++) {
    const game = playOut(3, seed, level);
    const best = Math.min(...game.players.map((player) => player.total));
    rates.push(best / Math.max(1, game.round));
  }
  return rates.reduce((sum, value) => sum + value, 0) / rates.length;
}

describe("the difficulty setting", () => {
  it("ships three levels with a sensible default", () => {
    expect(DIFFICULTIES).toEqual(["leicht", "mittel", "schwer"]);
    expect(DIFFICULTIES).toContain(DEFAULT_DIFFICULTY);
  });

  it("recognises only levels it ships", () => {
    for (const level of DIFFICULTIES) {
      expect(isDifficulty(level)).toBe(true);
    }
    expect(isDifficulty("unmoeglich")).toBe(false);
    expect(isDifficulty(2)).toBe(false);
    expect(isDifficulty(null)).toBe(false);
  });

  it("plays every level to the end", () => {
    for (const level of DIFFICULTIES) {
      expect(playOut(3, 5, level).phase).toBe("gameOver");
    }
  });

  it("makes the levels play differently", () => {
    // Same deal, same seats - only the level differs, so any difference in the
    // chosen moves comes from the level alone.
    const seen = new Set<string>();
    for (const level of DIFFICULTIES) {
      const game = playOut(3, 21, level);
      seen.add(game.log.join("|"));
    }
    expect(seen.size).toBe(DIFFICULTIES.length);
  });

  it("gets stronger from leicht to schwer", () => {
    // Fewer points is better in Skyjo, so the average must fall.
    const easy = averagePerRound("leicht");
    const medium = averagePerRound("mittel");
    const hard = averagePerRound("schwer");
    expect(medium).toBeLessThan(easy);
    expect(hard).toBeLessThanOrEqual(medium);
  });

  it("never lets a level read a face-down card", () => {
    for (const level of DIFFICULTIES) {
      let game = createGame(soloSeats("Bot", 1), 9);
      while (game.phase === "flip") {
        game = applyMove(game, game.turn, aiMove(game, level)!) as SkyjoGame;
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
      expect(aiMove(scrambled, level)).toEqual(aiMove(game, level));
    }
  });
});
