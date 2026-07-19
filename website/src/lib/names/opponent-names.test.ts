/**
 * Tests for the shared opponent-name generator.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { OPPONENT_NAME_POOL, pickOpponentNames } from "./opponent-names";

/** The largest table across the collection: six players, so five opponents. */
const MAX_OPPONENTS = 5;

describe("pickOpponentNames", () => {
  it("draws as many names as asked for", () => {
    for (let count = 1; count <= MAX_OPPONENTS; count++) {
      expect(pickOpponentNames(count, "Du", 1)).toHaveLength(count);
    }
  });

  it("draws them from the pool", () => {
    for (const name of pickOpponentNames(MAX_OPPONENTS, "Du", 5)) {
      expect(OPPONENT_NAME_POOL).toContain(name);
    }
  });

  it("never gives two opponents the same name", () => {
    for (let seed = 0; seed < 50; seed++) {
      const names = pickOpponentNames(MAX_OPPONENTS, "Du", seed);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it("never hands out the player's own name", () => {
    // Berta is in the pool, so this is the case that matters.
    for (let seed = 0; seed < 50; seed++) {
      expect(pickOpponentNames(MAX_OPPONENTS, "Berta", seed)).not.toContain(
        "Berta",
      );
    }
  });
});

describe("the draw stays reproducible", () => {
  it("gives the same table for the same seed", () => {
    // This is what keeps the prerendered HTML and the browser in step, and
    // what lets a game be replayed.
    expect(pickOpponentNames(MAX_OPPONENTS, "Du", 4242)).toEqual(
      pickOpponentNames(MAX_OPPONENTS, "Du", 4242),
    );
  });

  it("gives different tables for different seeds", () => {
    const tables = new Set<string>();
    for (let seed = 0; seed < 20; seed++) {
      tables.add(pickOpponentNames(MAX_OPPONENTS, "Du", seed).join(","));
    }
    // Not a promise that all 20 differ - just that it is not one fixed table.
    expect(tables.size).toBeGreaterThan(10);
  });

  it("does not simply return the pool in order", () => {
    const inOrder = OPPONENT_NAME_POOL.slice(0, MAX_OPPONENTS).join(",");
    const drawn = pickOpponentNames(MAX_OPPONENTS, "Du", 1).join(",");
    expect(drawn).not.toBe(inOrder);
  });
});

describe("the pool", () => {
  it("has no duplicates", () => {
    expect(new Set(OPPONENT_NAME_POOL).size).toBe(OPPONENT_NAME_POOL.length);
  });

  it("still has enough names once the player takes one", () => {
    expect(OPPONENT_NAME_POOL.length - 1).toBeGreaterThanOrEqual(MAX_OPPONENTS);
  });

  it("complains rather than repeating itself when asked for too many", () => {
    expect(() =>
      pickOpponentNames(OPPONENT_NAME_POOL.length + 1, "Du", 1),
    ).toThrow();
  });
});
