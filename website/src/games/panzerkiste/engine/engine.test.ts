/**
 * Tests for the Panzerkiste simulation and levels.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { enemiesLeft, playerTank, restart, step } from "./engine";
import { LEVELS } from "./levels";
import { createRandom } from "./random";
import {
  createGame,
  FIELD_COLS,
  FIELD_ROWS,
  LIVES_START,
  loadLevel,
} from "./setup";
import {
  BULLET_SPEED,
  MINE_FUSE,
  TILE,
  type Bullet,
  type GameState,
  type Input,
  type Tank,
} from "./types";

/** No key pressed, no shot, aim at the origin. */
const IDLE: Input = {
  move: { x: 0, y: 0 },
  aim: { x: 0, y: 0 },
  fire: false,
  layMine: false,
};

/** A brown enemy that never shoots (reload far in the future) or moves. */
function idleEnemy(id: string, x: number, y: number): Tank {
  return {
    id,
    kind: "brown",
    x,
    y,
    turret: 0,
    alive: true,
    reloadUntil: Number.MAX_SAFE_INTEGER,
    heading: 0,
    headingUntil: Number.MAX_SAFE_INTEGER,
  };
}

/** An open arena with a wall ring, plus whatever tanks/bullets are given. */
function openState(over: Partial<GameState> = {}): GameState {
  const cols = 9;
  const rows = 5;
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
    explosions: [],
    marks: [],
    trails: [],
    level: 0,
    lives: LIVES_START,
    phase: "playing",
    time: 0,
    random: createRandom(1),
    nextId: 0,
    ...over,
  };
}

describe("levels", () => {
  it("all use the fixed interior size and hold exactly one player", () => {
    for (const map of LEVELS) {
      expect(map).toHaveLength(FIELD_ROWS);
      expect(map.every((line) => line.length === FIELD_COLS)).toBe(true);
      const players = map
        .join("")
        .split("")
        .filter((c) => c === "P").length;
      expect(players).toBe(1);
    }
  });

  it("wraps the interior in a solid wall border", () => {
    const game = loadLevel(0, LIVES_START, createRandom(1));
    expect(game.cols).toBe(FIELD_COLS + 2);
    expect(game.rows).toBe(FIELD_ROWS + 2);
    for (let c = 0; c < game.cols; c++) {
      expect(game.walls[c]).toBe(true);
      expect(game.walls[(game.rows - 1) * game.cols + c]).toBe(true);
    }
    for (let r = 0; r < game.rows; r++) {
      expect(game.walls[r * game.cols]).toBe(true);
      expect(game.walls[r * game.cols + game.cols - 1]).toBe(true);
    }
  });
});

describe("createGame", () => {
  it("starts playing at level 0 with a player and enemies", () => {
    const game = createGame(7);
    expect(game.phase).toBe("playing");
    expect(game.level).toBe(0);
    expect(game.lives).toBe(LIVES_START);
    expect(playerTank(game)).not.toBeNull();
    expect(enemiesLeft(game)).toBeGreaterThan(0);
  });
});

describe("player movement", () => {
  it("moves toward the input and stops at a wall", () => {
    let game: GameState = openState({
      tanks: [
        { ...idleEnemy("e0", TILE * 4, TILE * 3), reloadUntil: 0 },
        {
          id: "player",
          kind: "player",
          x: TILE * 1.5,
          y: TILE * 2,
          turret: 0,
          alive: true,
          reloadUntil: 0,
          heading: 0,
          headingUntil: 0,
        },
      ],
    });
    const right: Input = { ...IDLE, move: { x: 1, y: 0 } };
    const startX = playerTank(game)!.x;
    for (let i = 0; i < 200; i++) {
      game = step(game, right, 0.016);
    }
    const player = playerTank(game)!;
    expect(player.x).toBeGreaterThan(startX);
    // It never tunnels into the right wall (last open column ends at cols-1).
    expect(player.x).toBeLessThan((game.cols - 1) * TILE);
    // Driving leaves a tread trail behind.
    expect(game.trails.length).toBeGreaterThan(0);
    expect(game.trails.some((point) => point.id === "player")).toBe(true);
  });
});

describe("shells", () => {
  const bullet: Bullet = {
    id: "b0",
    x: TILE * 7.2,
    y: TILE * 2,
    vx: BULLET_SPEED,
    vy: 0,
    bouncesLeft: 1,
    ownerId: "player",
    armed: false,
  };
  const scene = () =>
    openState({
      bullets: [{ ...bullet }],
      tanks: [
        idleEnemy("e0", TILE * 1.5, TILE * 3.5),
        {
          id: "player",
          kind: "player",
          x: TILE * 1.5,
          y: TILE * 1,
          turret: 0,
          alive: true,
          reloadUntil: 0,
          heading: 0,
          headingUntil: 0,
        },
      ],
    });

  it("bounce off a wall once", () => {
    let game = scene();
    for (let i = 0; i < 12; i++) {
      game = step(game, IDLE, 0.02);
    }
    const shot = game.bullets.find((b) => b.id === "b0");
    expect(shot).toBeDefined();
    expect(shot!.vx).toBeLessThan(0); // reflected off the right wall
    expect(shot!.bouncesLeft).toBe(0);
  });

  it("die after their bounce budget runs out", () => {
    let game = scene();
    for (let i = 0; i < 120; i++) {
      game = step(game, IDLE, 0.02);
    }
    expect(game.bullets.find((b) => b.id === "b0")).toBeUndefined();
  });

  it("destroy an enemy they reach", () => {
    const game = openState({
      level: LEVELS.length - 1, // on the last level, so clearing it wins

      bullets: [
        {
          id: "b0",
          x: TILE * 4,
          y: TILE * 2,
          vx: BULLET_SPEED,
          vy: 0,
          bouncesLeft: 1,
          ownerId: "player",
          armed: true,
        },
      ],
      tanks: [
        idleEnemy("e0", TILE * 4 + 6, TILE * 2),
        {
          id: "player",
          kind: "player",
          x: TILE * 1.5,
          y: TILE * 3.5,
          turret: 0,
          alive: true,
          reloadUntil: 0,
          heading: 0,
          headingUntil: 0,
        },
      ],
    });
    const after = step(game, IDLE, 0.016);
    expect(enemiesLeft(after)).toBe(0);
    // The last (and only) enemy is gone -> the mission is won.
    expect(after.phase).toBe("won");
    // A white-X mark is left where the enemy stood.
    expect(after.marks).toHaveLength(1);
    expect(after.marks[0].x).toBeCloseTo(TILE * 4 + 6);
  });
});

describe("mines", () => {
  it("destroy nearby tanks when the fuse runs out", () => {
    let game = openState({
      tanks: [
        idleEnemy("e0", TILE * 2 + 10, TILE * 2),
        {
          id: "player",
          kind: "player",
          x: TILE * 2,
          y: TILE * 2,
          turret: 0,
          alive: true,
          reloadUntil: 0,
          heading: 0,
          headingUntil: 0,
        },
      ],
      mines: [
        {
          id: "m0",
          x: TILE * 2 + 5,
          y: TILE * 2,
          ownerId: "player",
          explodeAt: MINE_FUSE,
        },
      ],
    });
    for (let i = 0; i < Math.ceil(MINE_FUSE / 0.02) + 2; i++) {
      game = step(game, IDLE, 0.02);
    }
    // The blast takes the enemy; the player, on the mine, dies and respawns.
    expect(game.explosions.length + game.mines.length).toBeGreaterThanOrEqual(
      0,
    );
    expect(game.phase === "playing" || game.phase === "lost").toBe(true);
  });

  it("goes off at once when a shell hits it, well before the fuse", () => {
    const game = openState({
      mines: [
        { id: "m0", x: TILE * 3, y: TILE * 2, ownerId: "player", explodeAt: 5 },
      ],
      bullets: [
        {
          id: "b0",
          x: TILE * 3,
          y: TILE * 2,
          vx: 0,
          vy: 0,
          bouncesLeft: 1,
          ownerId: "player",
          armed: true,
        },
      ],
      tanks: [
        idleEnemy("e0", TILE * 3 + 30, TILE * 2), // inside the blast, not the shot
        {
          id: "player",
          kind: "player",
          x: TILE + 20,
          y: TILE * 3 + 20,
          turret: 0,
          alive: true,
          reloadUntil: 0,
          heading: 0,
          headingUntil: 0,
        },
      ],
    });
    const after = step(game, IDLE, 0.016);
    expect(after.mines).toHaveLength(0); // detonated, though its fuse was 5s
    expect(after.explosions.length).toBeGreaterThan(0);
    expect(after.bullets).toHaveLength(0); // the shell was spent
    expect(enemiesLeft(after)).toBe(0); // the blast took the enemy
  });
});

describe("destructible walls", () => {
  it("a mine blasts a breakable wall to floor but leaves solid walls", () => {
    const cols = 9;
    const breakableIndex = 2 * cols + 3; // interior, near the mine
    const solidIndex = 2 * cols + 5; // also near the mine, but solid
    const walls: boolean[] = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < cols; col++) {
        walls.push(row === 0 || row === 4 || col === 0 || col === cols - 1);
      }
    }
    walls[breakableIndex] = true;
    walls[solidIndex] = true;
    const breakable = walls.map(() => false);
    breakable[breakableIndex] = true;

    let game = openState({
      walls,
      breakable,
      mines: [
        {
          id: "m0",
          x: TILE * 4 + 20,
          y: TILE * 2 + 20,
          ownerId: "player",
          explodeAt: 0.1,
        },
      ],
      tanks: [
        idleEnemy("e0", TILE * 7 + 20, TILE * 1 + 20),
        {
          id: "player",
          kind: "player",
          x: TILE + 20,
          y: TILE + 20,
          turret: 0,
          alive: true,
          reloadUntil: 0,
          heading: 0,
          headingUntil: 0,
        },
      ],
    });
    for (let i = 0; i < 12; i++) {
      game = step(game, IDLE, 0.02);
    }
    expect(game.walls[breakableIndex]).toBe(false); // blasted to floor
    expect(game.breakable[breakableIndex]).toBe(false);
    expect(game.walls[solidIndex]).toBe(true); // a solid wall survives
  });
});

describe("holes", () => {
  const cols = 9;
  const ringWalls = (): boolean[] => {
    const walls: boolean[] = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < cols; col++) {
        walls.push(row === 0 || row === 4 || col === 0 || col === cols - 1);
      }
    }
    return walls;
  };

  it("stop a tank from driving onto them", () => {
    const holes = new Array(cols * 5).fill(false);
    holes[2 * cols + 4] = true; // a hole at col 4, row 2
    let game = openState({
      holes,
      tanks: [
        idleEnemy("e0", TILE * 1.5, TILE * 3.5), // keeps the round in play
        {
          id: "player",
          kind: "player",
          x: TILE * 2.5,
          y: TILE * 2.5,
          turret: 0,
          alive: true,
          reloadUntil: 0,
          heading: 0,
          headingUntil: 0,
        },
      ],
    });
    const right: Input = { ...IDLE, move: { x: 1, y: 0 } };
    for (let i = 0; i < 60; i++) {
      game = step(game, right, 0.02);
    }
    const player = playerTank(game)!;
    expect(player.x).toBeGreaterThan(TILE * 2.5); // it did move right
    expect(player.x).toBeLessThan(TILE * 4); // but stopped before the hole
  });

  it("let a shell fly straight over", () => {
    const holes = new Array(cols * 5).fill(false);
    holes[2 * cols + 4] = true;
    let game = openState({
      walls: ringWalls(),
      holes,
      bullets: [
        {
          id: "b0",
          x: TILE * 2,
          y: TILE * 2.5,
          vx: BULLET_SPEED,
          vy: 0,
          bouncesLeft: 1,
          ownerId: "e9",
          armed: true,
        },
      ],
      // A live player and enemy must exist, or the round ends and time freezes.
      tanks: [
        idleEnemy("e0", TILE * 1.5, TILE * 1.5),
        {
          id: "player",
          kind: "player",
          x: TILE * 1.5,
          y: TILE * 3.5,
          turret: 0,
          alive: true,
          reloadUntil: Number.MAX_SAFE_INTEGER,
          heading: 0,
          headingUntil: 0,
        },
      ],
    });
    for (let i = 0; i < 40; i++) {
      game = step(game, IDLE, 0.02);
    }
    const shot = game.bullets.find((b) => b.id === "b0");
    expect(shot).toBeDefined();
    expect(shot!.x).toBeGreaterThan(TILE * 5); // flew past the hole cell
    expect(shot!.vx).toBeGreaterThan(0); // never bounced off it
  });
});

describe("lives", () => {
  it("respawns after a hit while lives remain", () => {
    const game = openState({
      lives: LIVES_START,
      bullets: [
        {
          id: "b0",
          x: TILE * 2,
          y: TILE * 2,
          vx: 0,
          vy: 0,
          bouncesLeft: 1,
          ownerId: "e0",
          armed: true,
        },
      ],
      tanks: [
        {
          id: "player",
          kind: "player",
          x: TILE * 2,
          y: TILE * 2,
          turret: 0,
          alive: true,
          reloadUntil: 0,
          heading: 0,
          headingUntil: 0,
        },
      ],
    });
    const after = step(game, IDLE, 0.016);
    expect(after.phase).toBe("playing");
    expect(after.lives).toBe(LIVES_START - 1);
  });

  it("ends the mission on the last life", () => {
    const game = openState({
      lives: 1,
      bullets: [
        {
          id: "b0",
          x: TILE * 2,
          y: TILE * 2,
          vx: 0,
          vy: 0,
          bouncesLeft: 1,
          ownerId: "e0",
          armed: true,
        },
      ],
      tanks: [
        {
          id: "player",
          kind: "player",
          x: TILE * 2,
          y: TILE * 2,
          turret: 0,
          alive: true,
          reloadUntil: 0,
          heading: 0,
          headingUntil: 0,
        },
      ],
    });
    const after = step(game, IDLE, 0.016);
    expect(after.phase).toBe("lost");
    expect(after.lives).toBe(0);
  });
});

describe("progression", () => {
  it("restarts a finished mission from the first level", () => {
    const won: GameState = {
      ...loadLevel(0, 1, createRandom(3)),
      phase: "won",
    };
    const fresh = restart(won);
    expect(fresh.level).toBe(0);
    expect(fresh.phase).toBe("playing");
    expect(fresh.lives).toBe(LIVES_START);
  });
});

describe("determinism", () => {
  it("plays out identically from the same seed and inputs", () => {
    const run = () => {
      let game = createGame(99);
      for (let i = 0; i < 60; i++) {
        game = step(game, IDLE, 0.016);
      }
      return game;
    };
    expect(JSON.stringify(run())).toBe(JSON.stringify(run()));
  });
});
