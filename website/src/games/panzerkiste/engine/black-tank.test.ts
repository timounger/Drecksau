/**
 * Tests for the black tank: the fastest thing on the field, firing rockets.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { IDLE_INPUT, step } from "./engine";
import { createRandom } from "./random";
import { LIVES_START, loadLevel } from "./setup";
import { LEVELS } from "./levels";
import { ENEMY_TRAITS, ROCKET_SPEED, type GameState } from "./types";

/** Every enemy kind other than the black tank. */
const OTHERS = Object.entries(ENEMY_TRAITS).filter(
  ([kind]) => kind !== "black",
);

/** The first level that fields a black tank. */
function blackLevel(): number {
  const index = LEVELS.findIndex((map) => map.join("").includes("S"));
  expect(index, "no level fields a black tank").toBeGreaterThanOrEqual(0);
  return index;
}

describe("the black tank's traits", () => {
  const black = ENEMY_TRAITS.black;

  it("drives faster than anything else out there", () => {
    for (const [kind, traits] of OTHERS) {
      expect(black.speed, `slower than ${kind}`).toBeGreaterThan(traits.speed);
    }
  });

  it("fires rockets, not shells", () => {
    expect(black.bulletSpeed).toBe(ROCKET_SPEED);
  });

  it("fires them quicker than any other rocket tank", () => {
    const rocketeers = OTHERS.filter(
      ([, traits]) => traits.bulletSpeed === ROCKET_SPEED,
    );
    expect(rocketeers.length, "no other tank fires rockets").toBeGreaterThan(0);
    for (const [kind, traits] of rocketeers) {
      expect(black.reload, `slower than ${kind}`).toBeLessThan(traits.reload);
    }
  });
});

describe("the black tank on the field", () => {
  it("is what an S in a level map deals", () => {
    const game = loadLevel(blackLevel(), LIVES_START, createRandom(1));
    expect(game.tanks.some((tank) => tank.kind === "black")).toBe(true);
  });

  it("shoots, and what it shoots flies at rocket speed", () => {
    let state: GameState = loadLevel(
      blackLevel(),
      LIVES_START,
      createRandom(7),
    );
    // Only the black tank may be left, or another tank's shell could be the one
    // that turns up.
    state = {
      ...state,
      tanks: state.tanks.filter(
        (tank) => tank.kind === "black" || tank.kind === "player",
      ),
    };
    const black = state.tanks.find((tank) => tank.kind === "black")!;

    let fired: number | null = null;
    for (let i = 0; i < 1800 && fired === null; i++) {
      state = step(state, IDLE_INPUT, 1 / 60);
      const shot = state.bullets.find((bullet) => bullet.ownerId === black.id);
      if (shot !== undefined) {
        fired = Math.hypot(shot.vx, shot.vy);
      }
    }
    expect(fired, "the black tank never fired").not.toBeNull();
    expect(fired!).toBeCloseTo(ROCKET_SPEED, 0);
  });

  it("moves off its spawn", () => {
    let state = loadLevel(blackLevel(), LIVES_START, createRandom(3));
    const start = state.tanks.find((tank) => tank.kind === "black")!;
    for (let i = 0; i < 240; i++) {
      state = step(state, IDLE_INPUT, 1 / 60);
    }
    const now = state.tanks.find((tank) => tank.id === start.id)!;
    expect(Math.hypot(now.x - start.x, now.y - start.y)).toBeGreaterThan(1);
  });
});
