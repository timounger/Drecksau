/**
 * Tests for the guided missile: whom it chases and whom it spares.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { step } from "./engine";
import { createGame } from "./setup";
import { TILE } from "./types";
import type { Bullet, GameState, Input, Tank } from "./types";

/** Nobody touches the controls while a missile is in flight. */
const IDLE: Input = {
  move: { x: 0, y: 0 },
  aim: { x: 0, y: 0 },
  fire: false,
  fireHoming: false,
  layMine: false,
};

/** One simulation step, in seconds. */
const STEP = 0.016;

/** A tank built from the level's own player tank, so every field is sane. */
function tankAt(id: string, kind: Tank["kind"], x: number, y: number): Tank {
  const base = createGame(1, 1).tanks[0];
  return { ...base, id, kind, x, y, alive: true };
}

/** A player-fired missile at a spot, flying along an angle. */
function missileAt(x: number, y: number, angle: number): Bullet {
  const speed = 300;
  return {
    id: "m1",
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    bouncesLeft: 1,
    ownerId: "player",
    armed: false,
    homing: true,
  };
}

/** Runs a hand-built field for a while and reports what became of it. */
function fly(
  tanks: readonly Tank[],
  missile: Bullet,
  steps: number,
): { readonly state: GameState; readonly missile: Bullet | undefined } {
  let state: GameState = {
    ...createGame(1, 1),
    tanks: [...tanks],
    bullets: [missile],
  };
  for (let i = 0; i < steps; i++) {
    state = step(state, IDLE, STEP);
  }
  return { state, missile: state.bullets.find((b) => b.id === missile.id) };
}

/** Where a bullet is heading, in degrees. */
function heading(bullet: Bullet): number {
  return (Math.atan2(bullet.vy, bullet.vx) * 180) / Math.PI;
}

/** Whether a tank of that id is still alive. */
function alive(state: GameState, id: string): boolean {
  return state.tanks.find((tank) => tank.id === id)?.alive === true;
}

describe("the guided missile and the co-op partner", () => {
  it("flies straight over the partner instead of blowing them up", () => {
    // The partner sits right in the missile's path to the enemy behind them.
    const result = fly(
      [
        tankAt("player", "player", 300, 300),
        tankAt("player2", "player", 380, 300),
        tankAt("e0", "brown", 640, 300),
      ],
      missileAt(340, 300, 0),
      12,
    );
    expect(alive(result.state, "player2")).toBe(true);
  });

  it("does not blow up the tank that fired it either", () => {
    const result = fly(
      [tankAt("player", "player", 400, 300), tankAt("e0", "brown", 640, 300)],
      // Aimed back at its own firer.
      missileAt(460, 300, Math.PI),
      12,
    );
    expect(alive(result.state, "player")).toBe(true);
  });

  it("never steers at a player tank", () => {
    // Partner very close to the right, the only enemy far above.
    const result = fly(
      [
        tankAt("player", "player", 400, 300),
        tankAt("player2", "player", 400, 380),
        tankAt("e0", "brown", 400, 120),
      ],
      missileAt(400, 300, 0),
      10,
    );
    expect(result.missile).toBeDefined();
    // Turned upwards, towards the enemy - not down towards the partner.
    expect(heading(result.missile as Bullet)).toBeLessThan(-45);
  });

  it("still kills an enemy", () => {
    // 300 px/s over 40 steps of 16 ms is about 190 px - enough to cover the
    // 120 px to the enemy with room to spare.
    const result = fly(
      [tankAt("player", "player", 300, 300), tankAt("e0", "brown", 460, 300)],
      missileAt(340, 300, 0),
      40,
    );
    expect(alive(result.state, "e0")).toBe(false);
  });
});

/** A wall with clear ground on both sides, and where those sides are. */
type WallSpot = {
  /** Where the missile starts: one cell left of the wall. */
  readonly startX: number;
  /** Row centre - everything in this scene shares it. */
  readonly y: number;
  /** Open spot three cells left of the missile, in plain sight. */
  readonly far: number;
  /** Open spot two cells right of the missile, behind the wall. */
  readonly near: number;
};

/** Whether a cell is inside the field and free of wall. */
function isFree(state: GameState, col: number, row: number): boolean {
  return (
    col >= 0 &&
    col < state.cols &&
    row >= 0 &&
    row < state.rows &&
    !state.walls[row * state.cols + col]
  );
}

/**
 * Looks for a wall with open ground to its left and right.
 *
 * @param state - the level to search
 * @returns the wall's centre and the two open spots, or null if none fits
 */
function wallWithOpenSides(state: GameState): WallSpot | null {
  const centre = (col: number): number => col * TILE + TILE / 2;
  let found: WallSpot | null = null;
  for (let row = 1; row < state.rows - 1 && found === null; row++) {
    for (let col = 5; col < state.cols - 2 && found === null; col++) {
      // Wall at col, and four free cells running left of it - room to put the
      // visible enemy genuinely further away than the hidden one.
      const open =
        isFree(state, col + 1, row) &&
        isFree(state, col - 1, row) &&
        isFree(state, col - 2, row) &&
        isFree(state, col - 3, row) &&
        isFree(state, col - 4, row);
      if (state.walls[row * state.cols + col] && open) {
        found = {
          startX: centre(col - 1),
          y: centre(row),
          far: centre(col - 4),
          near: centre(col + 1),
        };
      }
    }
  }
  return found;
}

describe("the guided missile picks its target", () => {
  it("takes an enemy in plain sight over a nearer one behind a wall", () => {
    // The level's own walls decide this, so a row is searched for a wall that
    // really has open ground on both sides - assuming where one sits would put
    // the missile outside the field.
    const spot = wallWithOpenSides(createGame(1, 1));
    expect(spot, "no usable wall in the level").not.toBeNull();
    const { startX, y, far, near } = spot as WallSpot;

    // The hidden enemy really is the nearer one, or the test would pass even
    // without the line-of-sight rule.
    expect(Math.abs(near - startX)).toBeLessThan(Math.abs(far - startX));

    const result = fly(
      [
        tankAt("player", "player", startX, y + 4 * TILE),
        tankAt("near", "brown", near, y),
        tankAt("far", "brown", far, y),
      ],
      // Launched one cell left of the wall, flying upwards.
      missileAt(startX, y, -Math.PI / 2),
      4,
    );
    expect(result.missile).toBeDefined();
    // Turning left (past 90 degrees, towards 180) means it went for the far but
    // visible enemy and not the nearer one behind the wall.
    expect(Math.abs(heading(result.missile as Bullet))).toBeGreaterThan(100);
  });

  it("takes the nearest enemy when both are in plain sight", () => {
    const result = fly(
      [
        tankAt("player", "player", 400, 500),
        tankAt("near", "brown", 400, 240),
        tankAt("far", "brown", 400, 120),
      ],
      missileAt(400, 300, 0),
      6,
    );
    expect(result.missile).toBeDefined();
    expect(heading(result.missile as Bullet)).toBeLessThan(0);
  });

  it("flies straight on once no enemy is left", () => {
    const result = fly(
      [tankAt("player", "player", 300, 300)],
      missileAt(340, 300, 0),
      4,
    );
    expect(result.missile).toBeDefined();
    expect(Math.abs(heading(result.missile as Bullet))).toBeLessThan(1);
  });
});
