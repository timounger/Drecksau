/**
 * Tests for the items a destroyed tank leaves behind.
 *
 * @module
 * @remarks
 * The scenarios are hand-built fields rather than real levels: an item only
 * matters at the moment it changes what happens next, and putting a tank two
 * pixels from a shell is the shortest way to that moment.
 */
import { describe, expect, it } from "vitest";
import { IDLE_INPUT, step } from "./engine";
import { createRandom } from "./random";
import {
  DROP_CHANCE,
  PLAYER_RELOAD,
  SCATTER_SECONDS,
  RAPID_FACTOR,
  RAPID_SECONDS,
  SCATTER_SHOTS,
  SHIELD_SECONDS,
  TILE,
  type Bullet,
  type GameState,
  type Pickup,
  type Tank,
} from "./types";

/** An input that fires this step and nothing else. */
const FIRE = { ...IDLE_INPUT, fire: true, aim: { x: 1000, y: 0 } };

/** A tank standing where it is put, with nothing loaded. */
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

/** An open arena with a wall ring and whatever is put in it. */
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

/** A shell about to hit the tank at that spot. */
function shellAt(x: number, y: number): Bullet {
  return {
    id: "b1",
    x,
    y,
    vx: 400,
    vy: 0,
    bouncesLeft: 1,
    ownerId: "e0",
    armed: true,
    homing: false,
  };
}

/** One item lying at a spot. */
function item(kind: Pickup["kind"], x: number, y: number): Pickup {
  return { id: "k1", kind, x, y };
}

/** Whether a tank of that id is still on the field and alive. */
function alive(state: GameState, id: string): boolean {
  return state.tanks.find((t) => t.id === id)?.alive === true;
}

/**
 * A stationary enemy, so a level is never cleared out from under a test.
 *
 * @remarks
 * With no enemy left the round ends at once and {@link step} stops advancing -
 * which quietly made a test about the passage of time measure nothing at all.
 */
function bystander(): Tank {
  return tank("bystander", "brown", TILE * 12, TILE * 6);
}

/**
 * Whether the player was destroyed in that step.
 *
 * @param before - the state before
 * @param after - the state after
 * @returns true if it cost a life
 * @remarks
 * Not readable from `alive`: losing the player reloads the level at once, so a
 * moment later there is a fresh one standing at the start. The life spent is
 * what survives the reload.
 */
function died(before: GameState, after: GameState): boolean {
  return after.lives < before.lives || after.phase === "lost";
}

describe("collecting", () => {
  it("takes an item the player drives onto and leaves the field clear", () => {
    const player = tank("player", "player", TILE * 3, TILE * 3);
    const state = step(
      field({ tanks: [player], pickups: [item("shield", player.x, player.y)] }),
      IDLE_INPUT,
      0.016,
    );
    expect(state.pickups).toHaveLength(0);
    expect(state.tanks[0].shieldUntil).toBeGreaterThan(state.time);
  });

  it("leaves an item lying that nobody has reached", () => {
    const player = tank("player", "player", TILE * 3, TILE * 3);
    const far = item("shield", TILE * 10, TILE * 6);
    const state = step(
      field({ tanks: [player], pickups: [far] }),
      IDLE_INPUT,
      0.016,
    );
    expect(state.pickups).toEqual([far]);
    expect(state.tanks[0].shieldUntil).toBe(0);
  });
});

describe("the shield", () => {
  it("shrugs off a shell that would otherwise destroy the tank", () => {
    const player = tank("player", "player", TILE * 5, TILE * 3);
    const shielded = { ...player, shieldUntil: SHIELD_SECONDS };
    const state = step(
      field({ tanks: [shielded], bullets: [shellAt(player.x - 4, player.y)] }),
      IDLE_INPUT,
      0.016,
    );
    expect(alive(state, "player")).toBe(true);
    // The shell is spent all the same - it stopped on the shield.
    expect(state.bullets).toHaveLength(0);
  });

  it("stops protecting once it has run out", () => {
    const player = tank("player", "player", TILE * 5, TILE * 3);
    // A shield that lapsed a moment ago.
    const before = field({
      tanks: [{ ...player, shieldUntil: 0.001 }, bystander()],
      bullets: [shellAt(player.x - 4, player.y)],
      time: 1,
    });
    expect(died(before, step(before, IDLE_INPUT, 0.016))).toBe(true);

    // The very same shot, with the shield still holding.
    const held = {
      ...before,
      tanks: [{ ...player, shieldUntil: SHIELD_SECONDS }, bystander()],
    };
    expect(died(held, step(held, IDLE_INPUT, 0.016))).toBe(false);
  });

  it("also holds against a mine going off underneath", () => {
    const player = tank("player", "player", TILE * 5, TILE * 3);
    const mine = {
      id: "m1",
      x: player.x,
      y: player.y,
      ownerId: "e0",
      explodeAt: 0,
    };
    const bare = field({ tanks: [player, bystander()], mines: [mine] });
    expect(
      died(bare, step(bare, IDLE_INPUT, 0.016)),
      "ohne Schild muss die Mine toeten",
    ).toBe(true);

    const shielded = {
      ...bare,
      tanks: [{ ...player, shieldUntil: SHIELD_SECONDS }, bystander()],
    };
    expect(died(shielded, step(shielded, IDLE_INPUT, 0.016))).toBe(false);
  });
});

describe("rapid fire", () => {
  it("reloads a whole factor quicker", () => {
    const player = tank("player", "player", TILE * 3, TILE * 4);
    const normal = step(field({ tanks: [player] }), FIRE, 0.016);
    const rapid = step(
      field({ tanks: [{ ...player, rapidUntil: RAPID_SECONDS }] }),
      FIRE,
      0.016,
    );
    const normalWait = normal.tanks[0].reloadUntil - normal.time;
    const rapidWait = rapid.tanks[0].reloadUntil - rapid.time;
    expect(normalWait).toBeCloseTo(PLAYER_RELOAD, 3);
    expect(rapidWait).toBeCloseTo(PLAYER_RELOAD / RAPID_FACTOR, 3);
  });

  it("really does put more shells out in the same time", () => {
    const player = tank("player", "player", TILE * 3, TILE * 4);
    const count = (over: Partial<Tank>) => {
      let state = field({ tanks: [{ ...player, ...over }, bystander()] });
      // Shells bounce, hit and fly off again, so counting what is on the field
      // would count the same shot twice and miss the ones already gone.
      const seen = new Set<string>();
      for (let i = 0; i < 60; i++) {
        state = step(state, FIRE, 1 / 60);
        for (const bullet of state.bullets) {
          if (bullet.ownerId === "player") {
            seen.add(bullet.id);
          }
        }
      }
      return seen.size;
    };
    expect(count({ rapidUntil: RAPID_SECONDS })).toBeGreaterThan(count({}));
  });
});

describe("scatter shot", () => {
  it("sends out a fan instead of a single shell", () => {
    const player = tank("player", "player", TILE * 3, TILE * 4);
    const one = step(field({ tanks: [player, bystander()] }), FIRE, 0.016);
    const fan = step(
      field({
        tanks: [{ ...player, scatterUntil: SCATTER_SECONDS }, bystander()],
      }),
      FIRE,
      0.016,
    );
    const mine = (state: GameState) =>
      state.bullets.filter((b) => b.ownerId === "player");
    expect(mine(one)).toHaveLength(1);
    expect(mine(fan)).toHaveLength(SCATTER_SHOTS);
    // And they really fan out rather than stacking on one line.
    const angles = mine(fan).map((b) => Math.atan2(b.vy, b.vx));
    expect(new Set(angles).size).toBe(SCATTER_SHOTS);
  });

  it("runs out on the same clock as rapid fire", () => {
    const player = tank("player", "player", TILE * 3, TILE * 4);
    // Shielded throughout: being destroyed would reload the level and reset the
    // clock, and the test would then measure a single step.
    const armed = {
      ...player,
      scatterUntil: SCATTER_SECONDS,
      rapidUntil: RAPID_SECONDS,
      shieldUntil: Number.MAX_SAFE_INTEGER,
    };
    const mine = (state: GameState) =>
      state.bullets.filter((b) => b.ownerId === "player");

    // While it holds, one pull of the trigger is a fan.
    const early = step(field({ tanks: [armed, bystander()] }), FIRE, 1 / 60);
    expect(mine(early)).toHaveLength(SCATTER_SHOTS);

    // Run the clock past the deadline. The shells fired on the way are cleared
    // out each step, so what is counted at the end is one fresh trigger pull.
    let state: GameState = early;
    while (state.time <= SCATTER_SECONDS) {
      state = step({ ...state, bullets: [] }, IDLE_INPUT, 1 / 60);
    }

    const late = step({ ...state, bullets: [] }, FIRE, 1 / 60);
    expect(mine(late)).toHaveLength(1);
    // And the quick reload went with it - both ran the same clock.
    expect(late.tanks[0].reloadUntil - late.time).toBeCloseTo(PLAYER_RELOAD, 3);
  });
});

describe("reviving", () => {
  it("brings a downed partner back beside the one who picked it up", () => {
    const one = tank("player", "player", TILE * 4, TILE * 4);
    const two = {
      ...tank("player2", "player", TILE * 9, TILE * 2),
      alive: false,
    };
    const state = step(
      field({ tanks: [one, two], pickups: [item("revive", one.x, one.y)] }),
      IDLE_INPUT,
      0.016,
    );
    const back = state.tanks.find((t) => t.id === "player2")!;
    expect(back.alive).toBe(true);
    expect(Math.hypot(back.x - one.x, back.y - one.y)).toBeLessThan(TILE);
    // And not straight into a waiting turret.
    expect(back.shieldUntil).toBeGreaterThan(state.time);
  });

  it("is left lying while nobody is down", () => {
    const one = tank("player", "player", TILE * 4, TILE * 4);
    const two = tank("player2", "player", TILE * 9, TILE * 2);
    const lying = item("revive", one.x, one.y);
    const state = step(
      field({ tanks: [one, two], pickups: [lying] }),
      IDLE_INPUT,
      0.016,
    );
    expect(state.pickups).toEqual([lying]);
  });
});

describe("what the enemies drop", () => {
  /** Destroys one enemy over and over and tallies what it left. */
  function dropsOver(rounds: number, coop: boolean): Pickup[] {
    const found: Pickup[] = [];
    for (let seed = 0; seed < rounds; seed++) {
      const player = tank("player", "player", TILE * 2, TILE * 4);
      const partner = {
        ...tank("player2", "player", TILE * 12, TILE * 2),
        alive: false,
      };
      // Stationary, so "where it stood" is a spot and not a moving target.
      const enemy = tank("e0", "brown", TILE * 7, TILE * 4);
      const state = step(
        field({
          tanks: coop ? [player, partner, enemy] : [player, enemy],
          bullets: [{ ...shellAt(enemy.x - 4, enemy.y), ownerId: "player" }],
          random: createRandom(seed),
        }),
        IDLE_INPUT,
        0.016,
      );
      expect(alive(state, "e0"), "der Gegner muss sterben").toBe(false);
      found.push(...state.pickups);
    }
    return found;
  }

  it("drops something now and then, not every time and not never", () => {
    const rounds = 200;
    const drops = dropsOver(rounds, false);
    expect(drops.length).toBeGreaterThan(0);
    expect(drops.length).toBeLessThan(rounds);
    // Roughly the configured chance - wide bounds, this is a coin not a clock.
    const rate = drops.length / rounds;
    expect(rate).toBeGreaterThan(DROP_CHANCE / 2);
    expect(rate).toBeLessThan(DROP_CHANCE * 2);
  });

  it("never drops the reviving item in a single-player game", () => {
    const kinds = new Set(dropsOver(200, false).map((p) => p.kind));
    expect(kinds.has("revive")).toBe(false);
    // The others do turn up, or the test above would prove nothing.
    expect(kinds.size).toBeGreaterThan(1);
  });

  it("drops it in co-op while the partner is down", () => {
    const kinds = new Set(dropsOver(200, true).map((p) => p.kind));
    expect(kinds.has("revive")).toBe(true);
  });

  it("leaves it where the enemy stood", () => {
    const drops = dropsOver(30, false);
    expect(drops.length).toBeGreaterThan(0);
    for (const drop of drops) {
      expect(drop.x).toBeCloseTo(TILE * 7, 0);
      expect(drop.y).toBeCloseTo(TILE * 4, 0);
    }
  });
});
