/**
 * Tests for the sound-event detection.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { detectSounds } from "./events";
import { loadLevel } from "../engine/setup";
import { createRandom } from "../engine/random";
import {
  BULLET_SPEED,
  ROCKET_SPEED,
  type Bullet,
  type GameState,
} from "../engine/types";

/** A base state to mutate for each case. */
function base(): GameState {
  return loadLevel(2, 3, createRandom(1));
}

/** A shell with the given speed and id. */
function shell(id: string, speed: number): Bullet {
  return {
    id,
    x: 0,
    y: 0,
    vx: speed,
    vy: 0,
    bouncesLeft: 1,
    ownerId: "player",
    armed: false,
  };
}

describe("detectSounds", () => {
  it("reports a shot for a new ordinary shell", () => {
    const prev = base();
    const next = { ...prev, bullets: [shell("b1", BULLET_SPEED)] };
    expect(detectSounds(prev, next)).toContain("shot");
    expect(detectSounds(prev, next)).not.toContain("rocket");
  });

  it("reports a rocket for a new fast shell", () => {
    const prev = base();
    const next = { ...prev, bullets: [shell("b1", ROCKET_SPEED)] };
    expect(detectSounds(prev, next)).toContain("rocket");
  });

  it("does not re-report a shell that already existed", () => {
    const prev = { ...base(), bullets: [shell("b1", BULLET_SPEED)] };
    const next = { ...prev, bullets: [shell("b1", BULLET_SPEED)] };
    expect(detectSounds(prev, next)).not.toContain("shot");
  });

  it("reports an enemy down when one is gone, same level and lives", () => {
    const prev = base();
    const survivors = prev.tanks.filter((t) => t.kind === "player");
    const oneEnemy = prev.tanks.find((t) => t.kind !== "player")!;
    const next = { ...prev, tanks: [...survivors, oneEnemy] }; // the rest died
    expect(detectSounds(prev, next)).toContain("enemyDown");
  });

  it("reports a player down when a life is lost on the same level", () => {
    const prev = base();
    const next = { ...prev, lives: prev.lives - 1 };
    expect(detectSounds(prev, next)).toContain("playerDown");
  });

  it("reports a round start when a new level is loaded", () => {
    const prev = { ...base(), time: 12 };
    const next = { ...loadLevel(3, 3, createRandom(1)), time: 0 };
    const events = detectSounds(prev, next);
    expect(events).toContain("roundStart");
    expect(events).not.toContain("playerDown");
  });

  it("treats a respawn as a player down, not a round start", () => {
    const prev = { ...base(), time: 12, lives: 3 };
    // Same level reloaded with one fewer life: a respawn.
    const next = { ...loadLevel(2, 2, createRandom(1)), time: 0 };
    const events = detectSounds(prev, next);
    expect(events).toContain("playerDown");
    expect(events).not.toContain("roundStart");
  });
});
