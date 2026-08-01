/**
 * Tests for the endless arena: waves that never stop and only get worse.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { IDLE_INPUT, enemiesLeft, setLevel, step } from "./engine";
import {
  ENDLESS_LEVEL,
  ENDLESS_MAP,
  endlessNumber,
  isEndless,
  LEVELS,
} from "./levels";
import { createRandom } from "./random";
import { LIVES_START, loadLevel } from "./setup";
import {
  WAVE_BASE_ENEMIES,
  WAVE_MAX_ENEMIES,
  WAVE_PAUSE,
  WAVE_UNLOCKS,
  type GameState,
  type Tank,
  type TankKind,
} from "./types";

/** Every kind of tank that is not the player's. */
type EnemyKind = Exclude<TankKind, "player">;

/** Advances the arena until a wave is standing on it, or the guard runs out. */
function untilWave(start: GameState, wave: number): GameState {
  let state = start;
  for (let i = 0; i < 60_000 && state.wave < wave; i++) {
    state = step(state, IDLE_INPUT, 1 / 60);
    // Clear the field so the next wave is due; the fighting is not the point.
    if (enemiesLeft(state) > 0 && state.wave >= wave) {
      break;
    }
    if (enemiesLeft(state) > 0) {
      state = {
        ...state,
        tanks: state.tanks.filter((tank) => tank.kind === "player"),
      };
    }
  }
  return state;
}

/** The first arena, freshly loaded. */
function arena(): GameState {
  return loadLevel(ENDLESS_LEVEL, LIVES_START, createRandom(5));
}

/**
 * What clearing this level would leave behind: "won" or "cleared".
 *
 * @param state - the level to check
 * @returns the phase a cleared field would put it in
 */
function clearedOrWonPhase(state: GameState): string {
  const emptied = step(
    { ...state, tanks: state.tanks.filter((tank) => tank.kind === "player") },
    IDLE_INPUT,
    1 / 60,
  );
  return emptied.phase;
}

describe("where the arenas sit", () => {
  it("begins where the campaign ends, and never stops", () => {
    expect(ENDLESS_LEVEL).toBe(LEVELS.length);
    expect(isEndless(ENDLESS_LEVEL - 1), "das ist noch Kampagne").toBe(false);
    for (const level of [
      ENDLESS_LEVEL,
      ENDLESS_LEVEL + 1,
      ENDLESS_LEVEL + 500,
    ]) {
      expect(isEndless(level)).toBe(true);
    }
  });

  it("numbers them from one, upwards without end", () => {
    expect(endlessNumber(ENDLESS_LEVEL)).toBe(1);
    expect(endlessNumber(ENDLESS_LEVEL + 1)).toBe(2);
    expect(endlessNumber(ENDLESS_LEVEL + 999)).toBe(1000);
  });

  it("opens arena n at wave n, so pressing on skips to the hard part", () => {
    for (const number of [1, 4, 20]) {
      const state = loadLevel(
        ENDLESS_LEVEL + number - 1,
        LIVES_START,
        createRandom(3),
      );
      // The counter sits one short; the first wave sent is the arena's own.
      expect(state.wave).toBe(number - 1);
      const opened = untilWave(state, number);
      expect(opened.wave).toBe(number);
    }
  });

  it("is stepped into past the campaign, not by clearing it", () => {
    const last = loadLevel(ENDLESS_LEVEL - 1, LIVES_START, createRandom(1));
    // Clearing the last campaign level is a win, not a doorway.
    expect(clearedOrWonPhase(last)).toBe("won");
    // The level buttons walk in instead - and keep walking.
    expect(isEndless(setLevel(last, ENDLESS_LEVEL).level)).toBe(true);
    expect(setLevel(last, ENDLESS_LEVEL + 40).level).toBe(ENDLESS_LEVEL + 40);
  });

  it("holds no enemies of its own - they all arrive in waves", () => {
    const map = ENDLESS_MAP.join("");
    expect(/[BGTUNYLIS]/.test(map)).toBe(false);
    expect(map.split("").filter((c) => c === "P")).toHaveLength(1);
  });
});

describe("the waves", () => {
  it("takes a breather, then sends the first one", () => {
    let state = arena();
    expect(state.wave).toBe(0);
    expect(enemiesLeft(state)).toBe(0);

    // Not straight away: an empty field is a pause, not a wave.
    state = step(state, IDLE_INPUT, 1 / 60);
    expect(state.nextWaveAt).not.toBeNull();
    expect(state.wave).toBe(0);

    // One step covers at most MAX_STEP of a second, so time is passed in
    // frames rather than one big leap.
    const run = (seconds: number) => {
      for (let i = 0; i < Math.ceil(seconds * 60); i++) {
        state = step(state, IDLE_INPUT, 1 / 60);
      }
    };
    run(WAVE_PAUSE / 2);
    expect(state.wave, "die Welle kam zu frueh").toBe(0);
    run(WAVE_PAUSE);
    expect(state.wave).toBe(1);
    expect(enemiesLeft(state)).toBe(WAVE_BASE_ENEMIES);
  });

  it("never counts the field as cleared", () => {
    let state = arena();
    for (let i = 0; i < 600; i++) {
      state = step(state, IDLE_INPUT, 1 / 60);
      expect(state.phase, "die Arena darf nie fertig sein").toBe("playing");
    }
  });

  it("sends more of them as it goes, up to the ceiling", () => {
    const counts: number[] = [];
    let state = arena();
    for (let wave = 1; wave <= 16; wave++) {
      state = untilWave(state, wave);
      expect(state.wave).toBe(wave);
      counts.push(enemiesLeft(state));
    }
    // Never fewer than before, and it does grow.
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1]);
    }
    expect(counts[counts.length - 1]).toBeGreaterThan(counts[0]);
    expect(Math.max(...counts)).toBeLessThanOrEqual(WAVE_MAX_ENEMIES);
  });

  it("brings out nastier kinds the further you get", () => {
    const early = untilWave(arena(), 2);
    const late = untilWave(arena(), 12);
    const kindsOf = (state: GameState) =>
      new Set(
        state.tanks
          .filter(
            (tank): tank is Tank & { kind: EnemyKind } =>
              tank.kind !== "player",
          )
          .map((tank) => tank.kind),
      );
    const allowed = (wave: number) =>
      new Set(
        WAVE_UNLOCKS.filter((entry) => entry.from <= wave).map((e) => e.kind),
      );

    // Nothing turns up before it is unlocked.
    for (const kind of kindsOf(early)) {
      expect(allowed(early.wave).has(kind), `${kind} zu frueh`).toBe(true);
    }
    // And by the late waves the hardest ones are on the table.
    expect(allowed(late.wave).has("black")).toBe(true);
  });

  it("keeps the wave when a life is lost, so progress is not undone", () => {
    const state = untilWave(arena(), 3);
    const player = state.tanks.find((tank) => tank.kind === "player")!;
    const shot = step(
      {
        ...state,
        bullets: [
          {
            id: "b1",
            x: player.x - 4,
            y: player.y,
            vx: 400,
            vy: 0,
            bouncesLeft: 1,
            ownerId: "e0",
            armed: true,
            homing: false,
          },
        ],
      },
      IDLE_INPUT,
      0.016,
    );
    expect(shot.lives, "ein Leben muss weg sein").toBe(state.lives - 1);
    expect(shot.wave).toBe(state.wave);
    expect(isEndless(shot.level)).toBe(true);
  });
});

describe("where a wave lands", () => {
  it("never puts a tank in a wall or a hole", () => {
    const state = untilWave(arena(), 6);
    for (const tank of state.tanks) {
      const col = Math.floor(tank.x / 40);
      const row = Math.floor(tank.y / 40);
      const index = row * state.cols + col;
      expect(state.walls[index], "im Mauerwerk gelandet").toBe(false);
      expect(state.holes[index], "im Loch gelandet").toBe(false);
    }
  });

  it("keeps its distance from the player", () => {
    // Not a promise it can always keep - a crowded field may leave nowhere far
    // enough - but on a fresh arena it must.
    const state = untilWave(arena(), 1);
    const player = state.tanks.find((tank) => tank.kind === "player")!;
    for (const tank of state.tanks) {
      if (tank.kind !== "player") {
        expect(
          Math.hypot(tank.x - player.x, tank.y - player.y),
        ).toBeGreaterThan(40);
      }
    }
  });
});
