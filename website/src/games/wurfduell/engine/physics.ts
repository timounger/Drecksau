/**
 * Flying a throw: the arc, the wind and what it hits.
 *
 * @module
 * @remarks
 * A pure function of the throw and the field, stepped at a fixed rate, so the
 * same throw always lands in the same place. The referee uses it to decide
 * the damage; every screen uses it again to draw the flight, step by step,
 * exactly as it was decided.
 */
import {
  FIGHTER_X,
  HAND_AHEAD,
  HAND_HEIGHT,
  WIND_ACCELERATION,
  WORLD_WIDTH,
  facing,
  hitboxOf,
  type Hitbox,
} from "./arena";
import type { CharacterDef, HitPart, ImpactKind, ItemDef } from "./types";

/** Simulation steps per second. */
export const STEPS_PER_SECOND = 120;

/** Gravity, in world units per second squared. */
export const GRAVITY = 560;

/** The gentlest and the strongest throw, before a fighter's own factor. */
export const SPEED_MIN = 450;
export const SPEED_MAX = 1400;

/** The steepest and the flattest angle a throw may have, in degrees. */
export const ANGLE_MIN = 0;
export const ANGLE_MAX = 88;

/** One step's length in seconds. */
const DT = 1 / STEPS_PER_SECOND;

/** The longest a flight may last before it is called off, in seconds. */
const MAX_FLIGHT_SECONDS = 12;

/** How far off the field a thing may fly before it counts as gone. */
const OUT_MARGIN = 200;

/** How much speed a bounce keeps, upwards and sideways. */
const BOUNCE_UP = 0.55;
const BOUNCE_ALONG = 0.75;

/** How the three pieces of a split spread their sideways speed. */
const SPLIT_SLOWER = 0.8;
const SPLIT_FASTER = 1.2;
const SPLIT_SPREAD: readonly number[] = [SPLIT_SLOWER, 1, SPLIT_FASTER];

/** How much more a head hit costs than a body hit. */
export const HEAD_FACTOR = 1.5;

/** How close a magnetic piece must come before the opponent pulls it. */
const MAGNET_RANGE = 300;
/** How hard the opponent then pulls, in world units per second squared. */
const MAGNET_PULL = 900;
/** Where on the target the magnet pulls to, as a share of the body height. */
const MAGNET_AIM = 0.8;

/** Degrees in half a turn, for converting to radians. */
const HALF_TURN_DEGREES = 180;

/** Everything a flight depends on. */
export type FlightSetup = {
  /** The seat throwing. */
  readonly seat: number;
  readonly thrower: CharacterDef;
  readonly target: CharacterDef;
  /** Degrees above the horizontal, towards the opponent. */
  readonly angle: number;
  /** 0 to 1. */
  readonly power: number;
  /** What is thrown. */
  readonly item: ItemDef;
  /** Angle offsets of the pieces thrown at once; one piece is `[0]`. */
  readonly volley: readonly number[];
  /** Wind in steps; positive blows towards the right. */
  readonly wind: number;
};

/** One flying piece, recorded step by step. */
export type Track = {
  readonly item: ItemDef;
  /** The step this piece started flying, counted from the release. */
  readonly startStep: number;
  /** Positions, as x, y pairs one step apart. */
  readonly points: readonly number[];
  readonly end: ImpactKind | "split";
};

/** Where a piece came down, and what it did there. */
export type Impact = {
  readonly x: number;
  readonly y: number;
  readonly kind: ImpactKind;
  /** The step it landed, counted from the release. */
  readonly step: number;
  readonly item: ItemDef;
  readonly damage: number;
};

/** A whole throw from release to the last piece landing. */
export type Flight = {
  readonly tracks: readonly Track[];
  readonly impacts: readonly Impact[];
  /** The step the last piece came down. */
  readonly steps: number;
  /** Life points it costs the target, before anything caps it. */
  readonly damage: number;
  /** The best part hit, or null for a miss. */
  readonly best: HitPart | null;
};

/** A piece still in the air while simulating. */
type Piece = {
  item: ItemDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  startStep: number;
  points: number[];
  bounced: boolean;
  /** Whether this is the parent of a split that has not burst yet. */
  splits: boolean;
};

/**
 * Flies one throw to the end.
 *
 * @param setup - the throw and the field
 * @returns every piece's path and where each one came down
 */
export function simulateFlight(setup: FlightSetup): Flight {
  const target = hitboxOf(1 - setup.seat, setup.target);
  const tracks: Track[] = [];
  const impacts: Impact[] = [];
  let pieces: Piece[] = setup.volley.map((offset) => launch(setup, offset));
  let step = 0;
  const limit = MAX_FLIGHT_SECONDS * STEPS_PER_SECOND;

  while (pieces.length > 0 && step < limit) {
    step += 1;
    const still: Piece[] = [];
    for (const piece of pieces) {
      const outcome = advance(piece, setup, target);
      if (outcome === "split") {
        tracks.push(finish(piece, "split"));
        still.push(...burst(piece, step));
      } else if (outcome === null) {
        still.push(piece);
      } else {
        tracks.push(finish(piece, outcome));
        impacts.push({
          x: piece.x,
          y: piece.y,
          kind: outcome,
          step,
          item: piece.item,
          damage: damageOf(outcome, piece.item),
        });
      }
    }
    pieces = still;
  }
  for (const piece of pieces) {
    tracks.push(finish(piece, "out"));
  }

  return {
    tracks,
    impacts,
    steps: step,
    damage: impacts.reduce((sum, impact) => sum + impact.damage, 0),
    best: bestPart(impacts),
  };
}

/**
 * The first stretch of a throw's path, for aiming.
 *
 * @param setup - the throw being aimed
 * @param share - how much of the flight to show, 0 to 1
 * @param withWind - whether the wind is counted (the robot's aiming computer)
 * @returns the positions, as x, y pairs
 * @remarks
 * Windless as a rule: the wind is the part a player has to judge, and a
 * preview that already knew it would be the whole game solved.
 */
export function previewPath(
  setup: FlightSetup,
  share: number,
  withWind: boolean,
): readonly number[] {
  const flight = simulateFlight({
    ...setup,
    volley: [0],
    wind: withWind ? setup.wind : 0,
  });
  const first = flight.tracks.find((track) => track.startStep === 0);
  const points = first?.points ?? [];
  const keep = Math.max(2, Math.round((points.length / 2) * share)) * 2;
  return points.slice(0, keep);
}

/**
 * Where a thing leaves the hand and how fast.
 *
 * @param setup - the throw
 * @param offset - this piece's angle offset, in degrees
 * @returns the piece at the moment of release
 */
function launch(setup: FlightSetup, offset: number): Piece {
  const item = setup.item;
  const direction = facing(setup.seat);
  const angle =
    (clampAngle(setup.angle + offset) * Math.PI) / HALF_TURN_DEGREES;
  const speed = speedOf(setup.thrower, setup.power) * item.speedFactor;
  const x = FIGHTER_X[setup.seat] + direction * HAND_AHEAD;
  return {
    item,
    x,
    y: HAND_HEIGHT * setup.thrower.size,
    vx: direction * speed * Math.cos(angle),
    vy: speed * Math.sin(angle),
    startStep: 0,
    points: [x, HAND_HEIGHT * setup.thrower.size],
    bounced: false,
    splits: item.behavior === "split",
  };
}

/**
 * How fast a throw leaves the hand.
 *
 * @param thrower - who throws
 * @param power - 0 to 1
 * @returns the speed in world units per second
 */
export function speedOf(thrower: CharacterDef, power: number): number {
  const clamped = Math.min(1, Math.max(0, power));
  return (SPEED_MIN + clamped * (SPEED_MAX - SPEED_MIN)) * thrower.powerFactor;
}

/**
 * Keeps an angle inside what a throw may have.
 *
 * @param angle - degrees, as asked for
 * @returns the angle, clamped
 */
export function clampAngle(angle: number): number {
  return Math.min(ANGLE_MAX, Math.max(ANGLE_MIN, angle));
}

/**
 * Moves a piece on by one step and sees whether it came down.
 *
 * @returns how it ended, "split" when it bursts, or null while it flies on
 */
function advance(
  piece: Piece,
  setup: FlightSetup,
  target: Hitbox,
): ImpactKind | "split" | null {
  const gust =
    setup.wind *
    WIND_ACCELERATION *
    piece.item.windFactor *
    setup.thrower.windFactor;
  const wasRising = piece.vy > 0;
  const [pullX, pullY] =
    piece.item.behavior === "magnet" ? magnetPull(piece, target) : [0, 0];
  piece.vx += (gust + pullX) * DT;
  piece.vy += (pullY - GRAVITY * piece.item.gravityFactor) * DT;
  piece.x += piece.vx * DT;
  piece.y += piece.vy * DT;
  piece.points.push(piece.x, piece.y);

  const r = piece.item.radius;
  const part = hitPart(piece.x, piece.y, r, target);
  let result: ImpactKind | "split" | null = null;
  if (part !== null) {
    result = part;
  } else if (piece.y - r <= 0) {
    result = landOrBounce(piece);
  } else if (piece.x < -OUT_MARGIN || piece.x > WORLD_WIDTH + OUT_MARGIN) {
    result = "out";
  } else if (piece.splits && wasRising && piece.vy <= 0) {
    result = "split";
  }
  return result;
}

/** How the opponent pulls a magnetic piece, as x and y acceleration. */
function magnetPull(piece: Piece, target: Hitbox): readonly number[] {
  const dx = target.x - piece.x;
  const dy = target.bodyTop * MAGNET_AIM - piece.y;
  const distance = Math.hypot(dx, dy);
  return distance < MAGNET_RANGE && distance > 0
    ? [(dx / distance) * MAGNET_PULL, (dy / distance) * MAGNET_PULL]
    : [0, 0];
}

/** Ends a piece on the ground - or lets a bouncing one bounce once. */
function landOrBounce(piece: Piece): ImpactKind | null {
  let result: ImpactKind | null = "ground";
  if (piece.item.behavior === "bounce" && !piece.bounced) {
    piece.bounced = true;
    piece.y = piece.item.radius;
    piece.vy = Math.abs(piece.vy) * BOUNCE_UP;
    piece.vx *= BOUNCE_ALONG;
    result = null;
  }
  return result;
}

/**
 * Which part of the target a piece touches.
 *
 * @returns head, body, or null for neither
 */
function hitPart(
  x: number,
  y: number,
  r: number,
  target: Hitbox,
): HitPart | null {
  const headDistance = Math.hypot(x - target.x, y - target.headY);
  const nearX = Math.max(
    target.x - target.bodyHalfWidth,
    Math.min(x, target.x + target.bodyHalfWidth),
  );
  const nearY = Math.max(0, Math.min(y, target.bodyTop));
  let part: HitPart | null = null;
  if (headDistance < r + target.headRadius) {
    part = "head";
  } else if (Math.hypot(x - nearX, y - nearY) < r) {
    part = "body";
  }
  return part;
}

/** The three pieces a split throw bursts into. */
function burst(piece: Piece, step: number): Piece[] {
  return SPLIT_SPREAD.map((spread) => ({
    item: piece.item,
    x: piece.x,
    y: piece.y,
    vx: piece.vx * spread,
    vy: piece.vy,
    startStep: step,
    points: [piece.x, piece.y],
    bounced: false,
    splits: false,
  }));
}

/** Freezes a piece's path. */
function finish(piece: Piece, end: Track["end"]): Track {
  return {
    item: piece.item,
    startStep: piece.startStep,
    points: piece.points,
    end,
  };
}

/** Life points one landing costs the target. */
function damageOf(kind: ImpactKind, item: ItemDef): number {
  let damage = 0;
  if (kind === "body") {
    damage = item.damage;
  } else if (kind === "head") {
    damage = Math.round(item.damage * HEAD_FACTOR);
  }
  return damage;
}

/** The best part any piece hit. */
function bestPart(impacts: readonly Impact[]): HitPart | null {
  let best: HitPart | null = null;
  for (const impact of impacts) {
    if (impact.kind === "head") {
      best = "head";
    } else if (impact.kind === "body" && best === null) {
      best = "body";
    }
  }
  return best;
}
