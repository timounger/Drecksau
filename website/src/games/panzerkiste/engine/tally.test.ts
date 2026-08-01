/**
 * Tests for the mission tally the engine keeps: shells fired and shells that hit.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { advance, IDLE_INPUT, restart, step } from "./engine";
import { createRandom } from "./random";
import { createGame, LIVES_START, loadLevel } from "./setup";
import { TILE, type Bullet, type GameState, type Tank } from "./types";

/** An input that fires this step, aimed to the right. */
const FIRE = { ...IDLE_INPUT, fire: true, aim: { x: 10_000, y: 0 } };

/** A tank standing where it is put. */
function tank(id: string, kind: Tank["kind"], x: number, y: number): Tank {
  return {
    id,
    kind,
    x,
    y,
    turret: 0,
    alive: true,
    reloadUntil: 0,
    heading: 0,
    headingUntil: Number.MAX_SAFE_INTEGER,
    shieldUntil: 0,
    rapidUntil: 0,
    scatterUntil: 0,
    hitsLeft: 1,
  };
}

/** An open arena holding whatever is put in it. */
function field(over: Partial<GameState> = {}): GameState {
  const cols = 14;
  const rows = 8;
  const walls: boolean[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      walls.push(
        row === 0 || row === rows - 1 || col === 0 || col === cols - 1,
      );
    }
  }
  return {
    cols,
    rows,
    walls,
    breakable: walls.map(() => false),
    holes: walls.map(() => false),
    tanks: [],
    bullets: [],
    mines: [],
    pickups: [],
    explosions: [],
    marks: [],
    shotsFired: 0,
    shotsHit: 0,
    wave: 0,
    nextWaveAt: null,
    trails: [],
    level: 0,
    lives: 3,
    phase: "playing",
    time: 0,
    random: createRandom(1),
    nextId: 1000,
    ...over,
  };
}

/** A shell right in front of a tank at that spot, fired by whoever is named. */
function shellAt(x: number, y: number, ownerId: string): Bullet {
  return {
    id: "b1",
    x,
    y,
    vx: 400,
    vy: 0,
    bouncesLeft: 1,
    ownerId,
    armed: true,
    homing: false,
  };
}

describe("shells fired", () => {
  it("counts each one the player sends out", () => {
    const player = tank("player", "player", TILE * 3, TILE * 4);
    const enemy = tank("e0", "brown", TILE * 11, TILE * 6);
    const state = step(field({ tanks: [player, enemy] }), FIRE, 0.016);
    expect(state.shotsFired).toBe(1);
  });

  it("counts a scatter volley as the three shells it is", () => {
    const player = tank("player", "player", TILE * 3, TILE * 4);
    const enemy = tank("e0", "brown", TILE * 11, TILE * 6);
    const state = step(
      field({ tanks: [{ ...player, scatterUntil: 10 }, enemy] }),
      FIRE,
      0.016,
    );
    expect(state.shotsFired).toBe(3);
  });

  it("leaves the enemies' own shells out of it", () => {
    const player = tank("player", "player", TILE * 3, TILE * 4);
    const enemy = tank("e0", "brown", TILE * 11, TILE * 4);
    let state = field({ tanks: [player, { ...enemy, reloadUntil: 0 }] });
    for (let i = 0; i < 300; i++) {
      state = step(state, IDLE_INPUT, 1 / 60);
    }
    // The turret has certainly fired by now, yet the tally stays at nothing.
    expect(state.shotsFired).toBe(0);
  });
});

describe("shells that hit", () => {
  it("counts a player shell that destroys an enemy", () => {
    const player = tank("player", "player", TILE * 2, TILE * 4);
    const enemy = tank("e0", "brown", TILE * 8, TILE * 4);
    const state = step(
      field({
        tanks: [player, enemy, tank("e1", "brown", TILE * 11, TILE * 6)],
        bullets: [shellAt(enemy.x - 4, enemy.y, "player")],
      }),
      IDLE_INPUT,
      0.016,
    );
    expect(state.shotsHit).toBe(1);
  });

  it("does not count an enemy shell that destroys the player", () => {
    const player = tank("player", "player", TILE * 8, TILE * 4);
    const state = step(
      field({
        tanks: [player, tank("e0", "brown", TILE * 11, TILE * 6)],
        bullets: [shellAt(player.x - 4, player.y, "e0")],
      }),
      IDLE_INPUT,
      0.016,
    );
    expect(state.shotsHit).toBe(0);
  });
});

describe("the tally across a mission", () => {
  it("survives moving on to the next level", () => {
    const state = advance({
      ...loadLevel(0, LIVES_START, createRandom(1)),
      phase: "cleared",
      shotsFired: 42,
      shotsHit: 9,
    });
    expect(state.level).toBe(1);
    expect(state.shotsFired).toBe(42);
    expect(state.shotsHit).toBe(9);
  });

  it("survives losing a life and repeating the level", () => {
    // A shell about to destroy the player, on a level with an enemy left.
    const level = loadLevel(0, LIVES_START, createRandom(1));
    const player = level.tanks.find((t) => t.kind === "player")!;
    const before = {
      ...level,
      shotsFired: 30,
      shotsHit: 5,
      bullets: [shellAt(player.x - 4, player.y, "e0")],
    };
    const after = step(before, IDLE_INPUT, 0.016);
    expect(after.lives, "der Spieler muss ein Leben verlieren").toBe(
      before.lives - 1,
    );
    expect(after.shotsFired).toBe(30);
    expect(after.shotsHit).toBe(5);
  });

  it("starts over with a new mission", () => {
    const fresh = restart({
      ...createGame(1),
      shotsFired: 99,
      shotsHit: 40,
    });
    expect(fresh.shotsFired).toBe(0);
    expect(fresh.shotsHit).toBe(0);
  });
});
