/**
 * Tests for the Panzerkiste simulation and levels.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { advance, enemiesLeft, playerTank, restart, step } from "./engine";
import { ENDLESS_LEVEL, LEVELS } from "./levels";
import { createRandom } from "./random";
import {
  createGame,
  FIELD_COLS,
  FIELD_ROWS,
  LIVES_START,
  loadLevel,
  totalEnemiesThroughLevel,
} from "./setup";
import {
  BULLET_SPEED,
  HOMING_BOUNCES,
  HOMING_SPEED,
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
  fireHoming: false,
  layMine: false,
};

/** A ready-to-fire human tank at a spot, turret pointing right. */
function humanTank(x: number, y: number): Tank {
  return {
    id: "player",
    kind: "player",
    x,
    y,
    turret: 0,
    alive: true,
    reloadUntil: 0,
    heading: 0,
    headingUntil: 0,
    shieldUntil: 0,
    rapidUntil: 0,
    scatterUntil: 0,
    hitsLeft: 1,
  };
}

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
    shieldUntil: 0,
    rapidUntil: 0,
    scatterUntil: 0,
    hitsLeft: 1,
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
    pickups: [],
    explosions: [],
    marks: [],
    shotsFired: 0,
    shotsHit: 0,
    wave: 0,
    nextWaveAt: null,
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

describe("homing missile", () => {
  const CENTER_X = TILE * 4.5;
  const CENTER_Y = TILE * 2.5;

  it("launches one on the fire-homing input, marked as homing", () => {
    const game = openState({
      tanks: [
        humanTank(CENTER_X, CENTER_Y),
        idleEnemy("e0", TILE * 7, CENTER_Y),
      ],
    });
    const next = step(game, { ...IDLE, fireHoming: true }, 0.016);
    const homing = next.bullets.filter((bullet) => bullet.homing);
    expect(homing).toHaveLength(1);
  });

  it("steers toward the enemy: fired straight up, it curves to the right", () => {
    const game = openState({
      tanks: [
        humanTank(CENTER_X, CENTER_Y),
        idleEnemy("e0", TILE * 7, CENTER_Y),
      ],
    });
    // Aiming above the player makes the missile leave pointing up (-PI/2).
    const up = {
      ...IDLE,
      aim: { x: CENTER_X, y: CENTER_Y - TILE * 3 },
      fireHoming: true,
    };
    const next = step(game, up, 0.016);
    const missile = next.bullets.find((bullet) => bullet.homing)!;
    const heading = Math.atan2(missile.vy, missile.vx);
    // The enemy on the right pulls the heading up from -PI/2 towards 0.
    expect(heading).toBeGreaterThan(-Math.PI / 2);
    expect(heading).toBeLessThan(0);
  });

  it("chases the nearer of two enemies", () => {
    const near = idleEnemy("near", CENTER_X, CENTER_Y - TILE);
    const far = idleEnemy("far", TILE * 8, CENTER_Y);
    const game = openState({
      tanks: [humanTank(CENTER_X, CENTER_Y), near, far],
    });
    // Fired to the right, it should still curve up towards the nearer enemy.
    const right = {
      ...IDLE,
      aim: { x: CENTER_X + TILE * 3, y: CENTER_Y },
      fireHoming: true,
    };
    const next = step(game, right, 0.016);
    const missile = next.bullets.find((bullet) => bullet.homing)!;
    const heading = Math.atan2(missile.vy, missile.vx);
    expect(heading).toBeLessThan(0);
  });

  it("flies straight when there is no enemy to chase", () => {
    const game = openState({ tanks: [humanTank(CENTER_X, CENTER_Y)] });
    const up = {
      ...IDLE,
      aim: { x: CENTER_X, y: CENTER_Y - TILE * 3 },
      fireHoming: true,
    };
    const next = step(game, up, 0.016);
    const missile = next.bullets.find((bullet) => bullet.homing)!;
    const heading = Math.atan2(missile.vy, missile.vx);
    expect(heading).toBeCloseTo(-Math.PI / 2, 5);
  });

  it("cannot be shot down: a shell meeting it does not cancel it", () => {
    // A homing missile and an enemy shell sit on the same spot and co-move.
    const missile: Bullet = {
      id: "h0",
      x: CENTER_X,
      y: CENTER_Y,
      vx: HOMING_SPEED,
      vy: 0,
      bouncesLeft: HOMING_BOUNCES,
      ownerId: "player",
      armed: false,
      homing: true,
    };
    const shell: Bullet = {
      id: "s0",
      x: CENTER_X,
      y: CENTER_Y,
      vx: HOMING_SPEED,
      vy: 0,
      bouncesLeft: 1,
      ownerId: "e0",
      armed: true,
      homing: false,
    };
    const game = openState({
      bullets: [missile, shell],
      tanks: [humanTank(TILE * 1.5, CENTER_Y), idleEnemy("e0", TILE * 7, TILE)],
    });
    const next = step(game, IDLE, 0.016);
    expect(next.bullets.some((bullet) => bullet.id === "h0")).toBe(true);
  });

  it("steers around a wall in its path instead of into it", () => {
    const flat = openState({
      tanks: [
        humanTank(TILE * 2.5, CENTER_Y),
        idleEnemy("e0", TILE * 6.5, CENTER_Y),
      ],
    });
    // Drop a wall cell straight between the missile and the enemy.
    const walls = [...flat.walls];
    walls[2 * flat.cols + 4] = true;
    const game: GameState = { ...flat, walls };
    const right = {
      ...IDLE,
      aim: { x: TILE * 2.5 + TILE * 3, y: CENTER_Y },
      fireHoming: true,
    };
    const next = step(game, right, 0.016);
    const missile = next.bullets.find((bullet) => bullet.homing)!;
    const heading = Math.atan2(missile.vy, missile.vx);
    // Fired dead-on into the wall (heading 0), it turns aside to go around.
    expect(Math.abs(heading)).toBeGreaterThan(0.1);
  });
});

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

describe("totalEnemiesThroughLevel", () => {
  it("is the running sum of every level's enemy count", () => {
    let sum = 0;
    for (let level = 0; level < LEVELS.length; level++) {
      sum += enemiesLeft(loadLevel(level, 0, createRandom(1)));
      expect(totalEnemiesThroughLevel(level)).toBe(sum);
    }
    // The last level's total is the grand total, and it only ever grows.
    expect(totalEnemiesThroughLevel(LEVELS.length - 1)).toBe(sum);
    expect(totalEnemiesThroughLevel(0)).toBeLessThanOrEqual(sum);
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
          shieldUntil: 0,
          rapidUntil: 0,
          scatterUntil: 0,
          hitsLeft: 1,
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
    homing: false,
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
          shieldUntil: 0,
          rapidUntil: 0,
          scatterUntil: 0,
          hitsLeft: 1,
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
      // The last campaign level - the boss level; clearing it wins the game.
      level: ENDLESS_LEVEL - 1,

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
          homing: false,
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
          shieldUntil: 0,
          rapidUntil: 0,
          scatterUntil: 0,
          hitsLeft: 1,
        },
      ],
    });
    const after = step(game, IDLE, 0.016);
    expect(enemiesLeft(after)).toBe(0);
    // The last (and only) enemy is gone -> the campaign is won.
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
          shieldUntil: 0,
          rapidUntil: 0,
          scatterUntil: 0,
          hitsLeft: 1,
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
    // The blast takes both the enemy and the player: a life is spent, and with
    // the only enemy destroyed (destroyed enemies do not return) the retry has
    // nothing left to fight, so the level is cleared.
    expect(game.lives).toBe(LIVES_START - 1);
    expect(game.phase).toBe("cleared");
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
          homing: false,
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
          shieldUntil: 0,
          rapidUntil: 0,
          scatterUntil: 0,
          hitsLeft: 1,
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

describe("yellow tank", () => {
  it("lays mines as it roams", () => {
    let game = openState({
      random: createRandom(7),
      tanks: [
        {
          id: "e0",
          kind: "yellow",
          x: TILE * 4.5,
          y: TILE * 2.5,
          turret: 0,
          alive: true,
          reloadUntil: Number.MAX_SAFE_INTEGER, // never shoots, so it just roams
          heading: 0,
          headingUntil: 0,
          shieldUntil: 0,
          rapidUntil: 0,
          scatterUntil: 0,
          hitsLeft: 1,
        },
        {
          id: "player",
          kind: "player",
          x: TILE * 1.5,
          y: TILE * 1.5,
          turret: 0,
          alive: true,
          reloadUntil: Number.MAX_SAFE_INTEGER,
          heading: 0,
          headingUntil: 0,
          shieldUntil: 0,
          rapidUntil: 0,
          scatterUntil: 0,
          hitsLeft: 1,
        },
      ],
    });
    let sawMine = false;
    for (let i = 0; i < 1500 && !sawMine; i++) {
      game = step(game, IDLE, 0.02);
      sawMine = game.mines.some((mine) => mine.ownerId === "e0");
    }
    expect(sawMine).toBe(true);
  });
});

describe("green tank", () => {
  it("banks a fast rocket around cover to reach the player", () => {
    const cols = 9;
    const walls: boolean[] = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < cols; col++) {
        walls.push(row === 0 || row === 4 || col === 0 || col === cols - 1);
      }
    }
    walls[2 * cols + 4] = true; // a pillar straight between green and player

    let game = openState({
      walls,
      tanks: [
        {
          id: "e0",
          kind: "green",
          x: TILE * 1.5,
          y: TILE * 2.5,
          turret: 0,
          alive: true,
          reloadUntil: 0,
          heading: 0,
          headingUntil: Number.MAX_SAFE_INTEGER,
          shieldUntil: 0,
          rapidUntil: 0,
          scatterUntil: 0,
          hitsLeft: 1,
        },
        {
          id: "player",
          kind: "player",
          x: TILE * 7.5,
          y: TILE * 2.5, // straight to the right, but the pillar blocks the line
          turret: 0,
          alive: true,
          reloadUntil: Number.MAX_SAFE_INTEGER,
          heading: 0,
          headingUntil: 0,
          shieldUntil: 0,
          rapidUntil: 0,
          scatterUntil: 0,
          hitsLeft: 1,
        },
      ],
    });

    let rocket: Bullet | undefined;
    for (let i = 0; i < 5 && rocket === undefined; i++) {
      game = step(game, IDLE, 0.02);
      rocket = game.bullets.find((b) => b.ownerId === "e0");
    }
    expect(rocket).toBeDefined();
    // A fast rocket with a two-bounce budget ...
    expect(Math.hypot(rocket!.vx, rocket!.vy)).toBeGreaterThan(BULLET_SPEED);
    expect(rocket!.bouncesLeft).toBe(2);
    // ... aimed off the line to the player (a bank shot, not straight across).
    expect(Math.abs(rocket!.vy)).toBeGreaterThan(1);
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
          shieldUntil: 0,
          rapidUntil: 0,
          scatterUntil: 0,
          hitsLeft: 1,
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
          shieldUntil: 0,
          rapidUntil: 0,
          scatterUntil: 0,
          hitsLeft: 1,
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
          homing: false,
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
          shieldUntil: 0,
          rapidUntil: 0,
          scatterUntil: 0,
          hitsLeft: 1,
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
          homing: false,
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
          shieldUntil: 0,
          rapidUntil: 0,
          scatterUntil: 0,
          hitsLeft: 1,
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
          homing: false,
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
          shieldUntil: 0,
          rapidUntil: 0,
          scatterUntil: 0,
          hitsLeft: 1,
        },
      ],
    });
    const after = step(game, IDLE, 0.016);
    expect(after.phase).toBe("lost");
    expect(after.lives).toBe(0);
  });

  it("on death, repeats the level but keeps already-eliminated enemies gone", () => {
    const fresh = loadLevel(2, 3, createRandom(1)); // single player, 3 enemies
    const player = fresh.tanks.find((tank) => tank.id === "player")!;
    const survivor = fresh.tanks.find((tank) => tank.kind !== "player")!;
    // The player just died; two of the three enemies were already destroyed.
    const dying: GameState = {
      ...fresh,
      tanks: [{ ...player, alive: false }, survivor],
    };

    const after = step(dying, IDLE, 0.016);
    expect(after.phase).toBe("playing");
    expect(after.lives).toBe(2); // one life spent
    expect(playerTank(after)).not.toBeNull(); // player is back at the start
    // Only the survivor returns; the ones already destroyed do not reappear.
    expect(enemiesLeft(after)).toBe(1);
    expect(enemiesLeft(after)).toBeLessThan(enemiesLeft(fresh));
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

  it("grants a bonus life on reaching every fifth level", () => {
    // Clearing level 4 (index 3) advances to level 5 - a milestone: +1 life.
    const clearedFour: GameState = {
      ...loadLevel(3, 2, createRandom(1)),
      phase: "cleared",
    };
    const toFive = advance(clearedFour);
    expect(toFive.level).toBe(4);
    expect(toFive.lives).toBe(3); // 2 carried over + 1 bonus

    // Clearing level 5 (index 4) advances to level 6 - no bonus there.
    const clearedFive: GameState = {
      ...loadLevel(4, 2, createRandom(1)),
      phase: "cleared",
    };
    expect(advance(clearedFive).lives).toBe(2);
  });
});

describe("co-op", () => {
  it("spawns a second player right beside the first", () => {
    const game = createGame(7, 2);
    const players = game.tanks.filter((tank) => tank.kind === "player");
    expect(players).toHaveLength(2);
    const p1 = players.find((tank) => tank.id === "player")!;
    const p2 = players.find((tank) => tank.id === "player2")!;
    expect(p2).toBeDefined();
    expect(Math.hypot(p2.x - p1.x, p2.y - p1.y)).toBeLessThanOrEqual(
      TILE * 1.5,
    );
  });

  it("plays on when one co-op player dies: no life lost, partner keeps going", () => {
    const fresh = loadLevel(2, 3, createRandom(1), 2);
    const enemiesBefore = enemiesLeft(fresh);
    const p1 = fresh.tanks.find((tank) => tank.id === "player")!;
    const p2 = fresh.tanks.find((tank) => tank.id === "player2")!;
    const enemies = fresh.tanks.filter((tank) => tank.kind !== "player");
    // player2 just went down; player one and the enemies are still there.
    const dying: GameState = {
      ...fresh,
      tanks: [{ ...p2, alive: false }, p1, ...enemies],
    };

    const after = step(dying, IDLE, 0.016);
    expect(after.phase).toBe("playing");
    expect(after.lives).toBe(3); // no life lost for a single death
    // The downed player stays down; the partner is still on the field.
    const alive = after.tanks.filter(
      (tank) => tank.kind === "player" && tank.alive,
    );
    expect(alive).toHaveLength(1);
    expect(enemiesLeft(after)).toBe(enemiesBefore); // enemies stay
  });

  it("clears the level with one player down: next level, both back, no life lost", () => {
    // On the last level a clear wins; here the second-to-last still advances.
    const fresh = loadLevel(1, 3, createRandom(1), 2);
    const p1 = fresh.tanks.find((tank) => tank.id === "player")!;
    const p2 = fresh.tanks.find((tank) => tank.id === "player2")!;
    // A shell about to take the last enemy while player2 is already down.
    const enemy = fresh.tanks.find((tank) => tank.kind !== "player")!;
    const cleared: GameState = {
      ...fresh,
      tanks: [{ ...p2, alive: false }, p1, { ...enemy, alive: false }],
    };

    const after = step(cleared, IDLE, 0.016);
    expect(after.phase).toBe("cleared");
    expect(after.lives).toBe(3); // clearing costs no life

    const next = advance(after);
    expect(next.level).toBe(fresh.level + 1);
    expect(next.lives).toBe(3); // still no life lost
    const backAlive = next.tanks.filter(
      (tank) => tank.kind === "player" && tank.alive,
    );
    expect(backAlive).toHaveLength(2); // both players revived on the next level
  });

  it("on a wipe, reloads with both players back but keeps eliminated enemies gone", () => {
    const fresh = loadLevel(2, 3, createRandom(1), 2);
    const fullEnemies = enemiesLeft(fresh);
    const p1 = fresh.tanks.find((tank) => tank.id === "player")!;
    const p2 = fresh.tanks.find((tank) => tank.id === "player2")!;
    const survivor = fresh.tanks.find((tank) => tank.kind !== "player")!;
    // Both players down (a wipe); only one enemy survived, the others were killed.
    const wiped: GameState = {
      ...fresh,
      tanks: [{ ...p1, alive: false }, { ...p2, alive: false }, survivor],
    };

    const after = step(wiped, IDLE, 0.016);
    expect(after.phase).toBe("playing");
    expect(after.lives).toBe(2); // one shared life spent
    const alive = after.tanks.filter(
      (tank) => tank.kind === "player" && tank.alive,
    );
    expect(alive).toHaveLength(2); // both back at the start
    // Only the survivor returns; the ones already destroyed stay gone.
    expect(enemiesLeft(after)).toBe(1);
    expect(enemiesLeft(after)).toBeLessThan(fullEnemies);
  });
});

describe("enemy aiming", () => {
  it("points the barrel where it drives when it has no shot at the player", () => {
    const cols = 9;
    const rows = 5;
    const walls: boolean[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // The border ring, plus a pillar at col 4 row 2 to block the sight line.
        walls.push(
          row === 0 ||
            row === rows - 1 ||
            col === 0 ||
            col === cols - 1 ||
            (row === 2 && col === 4),
        );
      }
    }
    const game = openState({
      walls,
      tanks: [
        {
          id: "e0",
          kind: "grey",
          x: TILE * 2,
          y: TILE * 2,
          turret: 0,
          alive: true,
          reloadUntil: 0,
          heading: Math.PI / 2, // driving straight down
          headingUntil: Number.MAX_SAFE_INTEGER, // keep that heading
          shieldUntil: 0,
          rapidUntil: 0,
          scatterUntil: 0,
          hitsLeft: 1,
        },
        {
          id: "player",
          kind: "player",
          x: TILE * 6,
          y: TILE * 2, // to the right, but the pillar blocks the view
          turret: 0,
          alive: true,
          reloadUntil: Number.MAX_SAFE_INTEGER,
          heading: 0,
          headingUntil: 0,
          shieldUntil: 0,
          rapidUntil: 0,
          scatterUntil: 0,
          hitsLeft: 1,
        },
      ],
    });
    const enemy = step(game, IDLE, 0.016).tanks.find((t) => t.id === "e0")!;
    // Points down (where it drives), not right toward the hidden player.
    expect(enemy.turret).toBeCloseTo(Math.PI / 2);
  });

  it("targets the second co-op player when they are the nearer, visible mark", () => {
    const game = openState({
      tanks: [
        {
          id: "e0",
          kind: "grey",
          x: TILE * 4,
          y: TILE * 2,
          turret: 0,
          alive: true,
          reloadUntil: Number.MAX_SAFE_INTEGER, // just aim
          heading: 0,
          headingUntil: Number.MAX_SAFE_INTEGER,
          shieldUntil: 0,
          rapidUntil: 0,
          scatterUntil: 0,
          hitsLeft: 1,
        },
        {
          id: "player",
          kind: "player",
          x: TILE * 1.5, // player one is far to the upper-left
          y: TILE * 1,
          turret: 0,
          alive: true,
          reloadUntil: Number.MAX_SAFE_INTEGER,
          heading: 0,
          headingUntil: 0,
          shieldUntil: 0,
          rapidUntil: 0,
          scatterUntil: 0,
          hitsLeft: 1,
        },
        {
          id: "player2",
          kind: "player",
          x: TILE * 4, // player two is right below the enemy
          y: TILE * 3.5,
          turret: 0,
          alive: true,
          reloadUntil: Number.MAX_SAFE_INTEGER,
          heading: 0,
          headingUntil: 0,
          shieldUntil: 0,
          rapidUntil: 0,
          scatterUntil: 0,
          hitsLeft: 1,
        },
      ],
    });
    const enemy = step(game, IDLE, 0.016).tanks.find((t) => t.id === "e0")!;
    // Aims down at player two (~PI/2), the nearer player, not at player one.
    expect(enemy.turret).toBeCloseTo(Math.PI / 2, 1);
  });

  it("swings the barrel onto the player with a clear line of sight", () => {
    const game = openState({
      tanks: [
        {
          id: "e0",
          kind: "grey",
          x: TILE * 2,
          y: TILE * 2,
          turret: 0,
          alive: true,
          reloadUntil: Number.MAX_SAFE_INTEGER, // just aim, do not shoot
          heading: Math.PI / 2, // had been driving down
          headingUntil: Number.MAX_SAFE_INTEGER,
          shieldUntil: 0,
          rapidUntil: 0,
          scatterUntil: 0,
          hitsLeft: 1,
        },
        {
          id: "player",
          kind: "player",
          x: TILE * 6,
          y: TILE * 2, // straight to the right, clear line
          turret: 0,
          alive: true,
          reloadUntil: Number.MAX_SAFE_INTEGER,
          heading: 0,
          headingUntil: 0,
          shieldUntil: 0,
          rapidUntil: 0,
          scatterUntil: 0,
          hitsLeft: 1,
        },
      ],
    });
    const enemy = step(game, IDLE, 0.016).tanks.find((t) => t.id === "e0")!;
    // Aims at the player (to the right, angle ~0), not the driving direction.
    expect(enemy.turret).toBeCloseTo(0, 1);
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
