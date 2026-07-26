/**
 * Tests for the tank-death detection that drives the explosion effect.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { detectTankDeaths } from "./tank-explosion";
import { loadLevel } from "../engine/setup";
import { createRandom } from "../engine/random";
import type { GameState } from "../engine/types";

/** A base state to mutate for each case. */
function base(players = 1): GameState {
  return loadLevel(2, 3, createRandom(1), players);
}

describe("detectTankDeaths", () => {
  it("reports a spot where an enemy was destroyed, same level and lives", () => {
    const prev = base();
    const enemy = prev.tanks.find((tank) => tank.kind !== "player")!;
    const next = {
      ...prev,
      tanks: prev.tanks.filter((tank) => tank.id !== enemy.id),
    };
    const spots = detectTankDeaths(prev, next);
    expect(spots).toContainEqual({ x: enemy.x, y: enemy.y });
  });

  it("ignores enemies that vanished across a reload (a life was spent)", () => {
    const prev = base();
    const enemy = prev.tanks.find((tank) => tank.kind !== "player")!;
    // A solo death reloads with one life fewer and, say, one enemy gone too.
    const reloaded = loadLevel(2, prev.lives - 1, createRandom(1));
    const next = {
      ...reloaded,
      time: 0,
      tanks: reloaded.tanks.filter((tank) => tank.id !== enemy.id),
    };
    // Only the player's death is a fresh kill; the missing enemy is not.
    expect(detectTankDeaths(next, next)).toHaveLength(0);
    expect(detectTankDeaths(prev, next)).not.toContainEqual({
      x: enemy.x,
      y: enemy.y,
    });
  });

  it("reports the player's spot when a life is spent (a solo death)", () => {
    const prev = base();
    const player = prev.tanks.find((tank) => tank.id === "player")!;
    // A solo death reloads the level in the same step, one life fewer.
    const next = { ...loadLevel(2, prev.lives - 1, createRandom(1)), time: 0 };
    const spots = detectTankDeaths(prev, next);
    expect(spots).toContainEqual({ x: player.x, y: player.y });
  });

  it("reports a downed co-op partner while the level plays on", () => {
    const prev = base(2);
    const partner = prev.tanks.find((tank) => tank.id === "player2")!;
    const next = {
      ...prev,
      tanks: prev.tanks.map((tank) =>
        tank.id === "player2" ? { ...tank, alive: false } : tank,
      ),
    };
    const spots = detectTankDeaths(prev, next);
    expect(spots).toContainEqual({ x: partner.x, y: partner.y });
    expect(next.lives).toBe(prev.lives); // no life spent
  });

  it("reports nothing when a fresh level is loaded (an advance)", () => {
    const prev = { ...base(), time: 12 };
    const next = { ...loadLevel(3, 3, createRandom(1)), time: 0 };
    expect(detectTankDeaths(prev, next)).toHaveLength(0);
  });

  it("reports nothing on a quiet step with no deaths", () => {
    const prev = base();
    const next = { ...prev, time: prev.time + 1 };
    expect(detectTankDeaths(prev, next)).toHaveLength(0);
  });
});
