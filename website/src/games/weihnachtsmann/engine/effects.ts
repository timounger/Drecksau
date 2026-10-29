/**
 * Speech bubbles, Trixi's sparkles, puffs of smoke, the transformation poof,
 * steam, soot from the broken machine and floating music notes.
 *
 * @module
 */
import { randomIn } from "./random";
import type { AreaId, Character, GameState, ParticleKind } from "./types";

/** How long a speech bubble stays, seconds. */
const BUBBLE_SECONDS = 2.8;

/** How long each kind of particle lives, seconds. */
const LIFE: Readonly<Record<ParticleKind, number>> = {
  sparkle: 0.9,
  poof: 0.45,
  smoke: 2.6,
  snowPuff: 0.5,
  note: 2,
  steam: 1.4,
  soot: 1.8,
};

/** Number of note pictures on the sheet. */
export const NOTE_KINDS = 2;

/** Notes rising out of an instrument. */
const NOTE_BURST = 7;

/** How fast notes rise, and how far they sway, map px per second. */
const NOTE_RISE = 26;
const NOTE_SWAY = 22;

/** How far apart notes start, map px, and the spread of their speeds. */
const NOTE_JITTER = 2;
const NOTE_SLOW = 0.6;
const NOTE_FAST = 1.4;

/** Steam rises this fast, map px per second. */
const STEAM_RISE = 14;

/** Most particles alive at once; the oldest give way. */
const MAX_PARTICLES = 240;

/** Number of sparkle colours on the sheet. */
export const SPARKLE_TINTS = 4;

/** Sparkles thrown out by a poof. */
const POOF_SPARKLES = 8;

/** Snow flung up on landing. */
const LANDING_PUFFS = 6;

/** How fast landing snow flies out, map px per second, and how flat. */
const PUFF_SPREAD = 24;
const PUFF_FLAT = 0.33;

/** How quickly flung snow slows down, per second. */
const PUFF_DRAG = 4;

/** Sparkles fall this fast, map px per second squared. */
const SPARKLE_FALL = 18;

/** Smoke rises this fast, map px per second. */
const SMOKE_RISE = 9;

/**
 * Puts a speech bubble over somebody's head.
 *
 * @param char - who speaks
 * @param text - what they say
 */
export function say(char: Character, text: string): void {
  char.bubble = { text, left: BUBBLE_SECONDS };
}

/**
 * Adds a particle.
 *
 * @param state - the game
 * @param kind - what it is
 * @param area - the place it floats in
 * @param x - where, map px
 * @param y - where, map px
 * @param vx - speed, map px per second
 * @param vy - speed, map px per second
 * @param tint - sparkle colour, or which note
 */
export function spawn(
  state: GameState,
  kind: ParticleKind,
  area: AreaId,
  x: number,
  y: number,
  vx = 0,
  vy = 0,
  tint = 0,
): void {
  if (state.particles.length >= MAX_PARTICLES) {
    state.particles.shift();
  }
  state.particles.push({
    kind,
    area,
    x,
    y,
    vx,
    vy,
    age: 0,
    life: LIFE[kind],
    tint,
  });
}

/**
 * A puff of smoke with sparkles round it, where somebody changes shape.
 *
 * @param state - the game
 * @param area - the place
 * @param x - centre, map px
 * @param y - centre, map px
 */
export function poof(
  state: GameState,
  area: AreaId,
  x: number,
  y: number,
): void {
  spawn(state, "poof", area, x, y);
  for (let k = 0; k < POOF_SPARKLES; k += 1) {
    const angle = (k / POOF_SPARKLES) * Math.PI * 2;
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- burst speed, map px per second
    const speed = randomIn(state, 20, 40);
    spawn(
      state,
      "sparkle",
      area,
      x,
      y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      k % SPARKLE_TINTS,
    );
  }
}

/**
 * Snow flung up round the feet, on landing.
 *
 * @param state - the game
 * @param area - the place
 * @param x - feet, map px
 * @param y - feet, map px
 */
export function snowPuff(
  state: GameState,
  area: AreaId,
  x: number,
  y: number,
): void {
  for (let k = 0; k < LANDING_PUFFS; k += 1) {
    const angle = (k / LANDING_PUFFS) * Math.PI * 2;
    spawn(
      state,
      "snowPuff",
      area,
      x,
      y - 1,
      Math.cos(angle) * PUFF_SPREAD,
      Math.sin(angle) * PUFF_SPREAD * PUFF_FLAT,
    );
  }
}

/**
 * Music notes floating up out of an instrument.
 *
 * @param state - the game
 * @param area - the place
 * @param x - where they start, map px
 * @param y - where they start, map px
 */
export function notes(
  state: GameState,
  area: AreaId,
  x: number,
  y: number,
): void {
  for (let k = 0; k < NOTE_BURST; k += 1) {
    spawn(
      state,
      "note",
      area,
      x + randomIn(state, -NOTE_SWAY / 2, NOTE_SWAY / 2),
      y + randomIn(state, -NOTE_JITTER, NOTE_JITTER),
      randomIn(state, -NOTE_SWAY, NOTE_SWAY),
      -NOTE_RISE * randomIn(state, NOTE_SLOW, NOTE_FAST),
      k % NOTE_KINDS,
    );
  }
}

/**
 * Ages bubbles and particles and moves the particles on.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateEffects(state: GameState, dt: number): void {
  for (const char of state.chars) {
    if (char.bubble !== null) {
      char.bubble.left -= dt;
      if (char.bubble.left <= 0) {
        char.bubble = null;
      }
    }
  }
  for (const particle of state.particles) {
    particle.age += dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    switch (particle.kind) {
      case "sparkle":
        particle.vy += SPARKLE_FALL * dt;
        particle.vx *= 1 - Math.min(1, dt * 2);
        break;
      case "smoke":
        particle.vy = -SMOKE_RISE;
        break;
      case "snowPuff":
        particle.vx *= 1 - Math.min(1, dt * PUFF_DRAG);
        particle.vy *= 1 - Math.min(1, dt * PUFF_DRAG);
        break;
      case "note":
        particle.vx *= 1 - Math.min(1, dt);
        break;
      case "steam":
      case "soot":
        particle.vy = -STEAM_RISE;
        break;
      case "poof":
        break;
    }
  }
  const alive = state.particles.filter(
    (particle) => particle.age < particle.life,
  );
  state.particles.length = 0;
  state.particles.push(...alive);
}
