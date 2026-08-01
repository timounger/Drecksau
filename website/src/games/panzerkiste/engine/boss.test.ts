/**
 * Tests for the boss: the one tank that does not fall to a single shell.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { IDLE_INPUT, enemiesLeft, step } from "./engine";
import { ENDLESS_LEVEL, LEVELS } from "./levels";
import { createRandom } from "./random";
import { LIVES_START, loadLevel } from "./setup";
import {
  BOSS_HITS,
  ENEMY_TRAITS,
  MINE_FUSE,
  WAVE_UNLOCKS,
  TILE,
  type Bullet,
  type GameState,
  type Tank,
} from "./types";

/** The level the boss is on: the last of the campaign. */
const BOSS_LEVEL = ENDLESS_LEVEL - 1;

/** A tank standing where it is put. */
function tank(
  id: string,
  kind: Tank["kind"],
  x: number,
  y: number,
  over: Partial<Tank> = {},
): Tank {
  return {
    id,
    kind,
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
    hitsLeft: kind === "boss" ? BOSS_HITS : 1,
    ...over,
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

/** A player shell right in front of the tank at that spot. */
function shellAt(x: number, y: number): Bullet {
  return {
    id: "b1",
    x,
    y,
    vx: 400,
    vy: 0,
    bouncesLeft: 1,
    ownerId: "player",
    armed: true,
    homing: false,
  };
}

/** Fires one shell into the tank and hands back what is left of the field. */
function hit(state: GameState, target: Tank): GameState {
  return step(
    { ...state, bullets: [shellAt(target.x - 4, target.y)] },
    IDLE_INPUT,
    0.016,
  );
}

describe("the boss level", () => {
  it("is the last of the campaign, and holds exactly one boss", () => {
    const map = LEVELS[BOSS_LEVEL].join("");
    expect(map.split("").filter((c) => c === "O")).toHaveLength(1);
    // And no other level fields one.
    const others = LEVELS.filter((unused, index) => index !== BOSS_LEVEL);
    expect(others.some((level) => level.join("").includes("O"))).toBe(false);
  });

  it("deals a boss with its full run of hits", () => {
    const game = loadLevel(BOSS_LEVEL, LIVES_START, createRandom(1));
    const boss = game.tanks.find((t) => t.kind === "boss");
    expect(boss, "kein Boss auf dem Feld").toBeDefined();
    expect(boss!.hitsLeft).toBe(BOSS_HITS);
  });

  it("drives and shoots like the heavy thing it is", () => {
    const traits = ENEMY_TRAITS.boss;
    expect(traits.speed).toBeGreaterThan(0);
    expect(traits.laysMines).toBe(true);
    expect(traits.maxBullets).toBeGreaterThan(1);
  });
});

describe("the boss in the arena", () => {
  it("only turns up in the late waves, and arrives at full strength", () => {
    const unlock = WAVE_UNLOCKS.find((entry) => entry.kind === "boss");
    expect(unlock, "die Arena schickt nie einen Boss").toBeDefined();

    // Before its wave: never. After it: eventually, and with all its hits.
    let before: GameState = loadLevel(
      ENDLESS_LEVEL + unlock!.from - 3,
      LIVES_START,
      createRandom(9),
    );
    for (let i = 0; i < 4000 && before.wave < unlock!.from - 1; i++) {
      before = step(before, IDLE_INPUT, 1 / 60);
      before = {
        ...before,
        tanks: before.tanks.filter((t) => t.kind === "player"),
      };
    }
    expect(before.tanks.some((t) => t.kind === "boss")).toBe(false);

    let seen = false;
    for (let attempt = 0; attempt < 6 && !seen; attempt++) {
      let late: GameState = loadLevel(
        ENDLESS_LEVEL + unlock!.from - 1,
        LIVES_START,
        createRandom(attempt + 1),
      );
      for (let i = 0; i < 4000 && late.wave < unlock!.from; i++) {
        late = step(late, IDLE_INPUT, 1 / 60);
      }
      const boss = late.tanks.find((t) => t.kind === "boss");
      if (boss !== undefined) {
        seen = true;
        expect(boss.hitsLeft).toBe(BOSS_HITS);
      }
    }
    expect(seen, "in keiner spaeten Welle kam ein Boss").toBe(true);
  });
});

describe("taking the boss apart", () => {
  it("shrugs off a shell and only loses one hit for it", () => {
    const boss = tank("boss", "boss", TILE * 8, TILE * 4);
    const state = hit(
      field({ tanks: [tank("player", "player", TILE * 2, TILE * 4), boss] }),
      boss,
    );
    const after = state.tanks.find((t) => t.id === "boss")!;
    expect(after.alive).toBe(true);
    expect(after.hitsLeft).toBe(BOSS_HITS - 1);
  });

  it("goes up on the last of them, and not before", () => {
    let state = field({
      tanks: [
        tank("player", "player", TILE * 2, TILE * 4),
        tank("boss", "boss", TILE * 8, TILE * 4),
        // A second enemy, so the level is not cleared along the way.
        tank("e1", "brown", TILE * 11, TILE * 6),
      ],
    });
    for (let shot = 1; shot < BOSS_HITS; shot++) {
      const boss = state.tanks.find((t) => t.id === "boss")!;
      state = hit(state, boss);
      expect(
        state.tanks.find((t) => t.id === "boss")!.alive,
        `nach ${shot} Treffern noch nicht`,
      ).toBe(true);
    }
    const boss = state.tanks.find((t) => t.id === "boss")!;
    state = hit(state, boss);
    expect(state.tanks.some((t) => t.id === "boss" && t.alive)).toBe(false);
  });

  it("counts every hit, not only the last one", () => {
    const boss = tank("boss", "boss", TILE * 8, TILE * 4);
    const state = hit(
      field({
        tanks: [tank("player", "player", TILE * 2, TILE * 4), boss],
      }),
      boss,
    );
    // "Treffer je Schuss" would be nonsense if a boss soaked up shells for free.
    expect(state.shotsHit).toBe(1);
  });

  it("takes a hit from a mine like it takes one from a shell", () => {
    const boss = tank("boss", "boss", TILE * 8, TILE * 4);
    const state = step(
      field({
        tanks: [tank("player", "player", TILE * 2, TILE * 4), boss],
        mines: [
          {
            id: "m1",
            x: boss.x,
            y: boss.y,
            ownerId: "player",
            explodeAt: 0,
          },
        ],
        time: MINE_FUSE,
      }),
      IDLE_INPUT,
      0.016,
    );
    const after = state.tanks.find((t) => t.id === "boss")!;
    expect(after.alive).toBe(true);
    expect(after.hitsLeft).toBe(BOSS_HITS - 1);
  });

  it("leaves everything else dying to a single shell", () => {
    const enemy = tank("e0", "grey", TILE * 8, TILE * 4);
    const state = hit(
      field({
        tanks: [
          tank("player", "player", TILE * 2, TILE * 4),
          enemy,
          tank("e1", "brown", TILE * 11, TILE * 6),
        ],
      }),
      enemy,
    );
    expect(enemiesLeft(state)).toBe(1);
  });
});
