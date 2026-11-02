/**
 * The snow jetskis: four of them wait about the map; with the talk key one
 * gets on and races over snow, paths, ice and open water - much faster than
 * on foot, drifting through the bends - and with the talk key off again.
 *
 * @module
 * @remarks
 * While somebody rides, the engine hands the steering to
 * {@link updateJetski}: the nose turns towards the stick, the motor pushes
 * along the nose, and what goes sideways only slowly fades - little on snow,
 * a lot on ice and water, so the jetski drifts there. It bounces off trees,
 * fences, houses and everything else that blocks; a snowman in the way falls
 * over. It does not go through doors, into a gate or into the cinema: the
 * rider is told to get off first. The ability key honks (Grantelbart plays
 * a riff instead). Jetskis are no part of the save: one left somewhere
 * unridden for a few minutes is back at its home, and a reload finds the
 * rider standing.
 */
import { JETSKI_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { steered, unlock } from "./achievements";
import type { MoveProfile } from "./cast";
import { doorUsable } from "./cave";
import { atCinemaDoor } from "./cinema";
import { notes, poof, say, snowPuff, spawn } from "./effects";
import { JETSKI_HOMES, type JetskiHome } from "./east-data";
import { gateDoor } from "./gates";
import { TILE, areaMap, fits, inBox, terrainUnder } from "./map";
import { currentProfile, facing } from "./movement";
import { pick, randomIn } from "./random";
import { isRiding } from "./sleigh";
import type {
  Character,
  Dir,
  GameMap,
  GameState,
  Input,
  Jetski,
  Spot,
  Terrain,
} from "./types";
import { knockSnowman } from "./world";

/** Top speed on snow and paths, map px per second - walking is about 95. */
export const JETSKI_TOP = 240;

/** How much faster it runs on ice and on open water. */
const ICE_SPEED = 1.12;
const WATER_SPEED = 1.06;

/** How quickly the motor pushes it on, map px per second squared. */
const THRUST = 320;

/** How quickly pulling back brakes it, map px per second squared. */
const BRAKE = 420;

/** How fast the nose turns towards the stick, radians per second. */
const TURN = 6;

/** Below this push on the stick the motor idles. */
const DEAD_ZONE = 0.15;

/** How quickly it coasts to a stop with the motor idling, per second. */
const DRAG_SNOW = 1.6;
const DRAG_SLICK = 0.6;

/**
 * How quickly sideways speed fades, per second: the runners bite in snow,
 * and drift on ice and water.
 */
const GRIP_SNOW = 7;
const GRIP_ICE = 1.6;
const GRIP_WATER = 2.6;

/** How far round a corner a jetski brushing it slides, map px. */
const CORNER_SLIP = 6;

/** Share of the speed kept, backwards, after bouncing off something. */
const BOUNCE = 0.4;

/** Speed above which a bounce thuds and throws snow, map px per second. */
const BUMP_SPEED = 120;

/** How long a jetski wobbles after a bounce, seconds. */
export const JETSKI_BUMP = 0.25;

/** Below this speed it counts as standing, map px per second. */
const STILL = 6;

/** How close the talk key has to come to a jetski, map px. */
const REACH = 18;

/** How far beside it the rider gets off, and behind or ahead of it, map px. */
const OFF_SIDE = 16;
const OFF_END = 24;

/** Seconds a jetski stands unridden away from home before it is back there. */
export const JETSKI_RESET = 180;

/** How far from home still counts as at home, map px. */
const HOME_SLACK = 4;

/** How much room round its home it needs to come back, map px. */
const HOME_CLEAR = 20;

/** Spray behind it: least speed, seconds between two puffs at top speed. */
const SPRAY_SPEED = 40;
const SPRAY_EVERY = 0.03;

/** How far behind its middle the spray starts, map px. */
const SPRAY_BACK = 12;

/** How far apart the two plumes of spray start, either side, map px. */
const SPRAY_WIDE = 3;

/** How fast the spray flies up and spreads, and the share of speed it keeps. */
const SPRAY_UP = 46;
const SPRAY_SPREAD = 26;
const SPRAY_DRAG = 0.25;

/** Spray colours: snow, ice, water. */
export const SPRAY_SNOW = 0;
export const SPRAY_ICE = 1;
export const SPRAY_WATER = 2;

/** The spray's colour by the ground it comes off; snow elsewhere. */
const SPRAY_TINTS: Readonly<Partial<Record<Terrain, number>>> = {
  ice: SPRAY_ICE,
  water: SPRAY_WATER,
};

/** Which way each push points. */
const PUSHES: Readonly<Record<Dir, readonly [number, number]>> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/** How firmly one pushes into a doorway before being told to get off. */
const PUSH = 0.5;

/** How far west and east the ride for the achievement has to reach, cells. */
const EDGE_CELLS = 16;

/** Seconds between two honks. */
const HONK_EVERY = 0.7;

/** How far above the seat a riff's notes start, map px. */
const NOTE_LIFT = 30;

/** How the jetski bumps into things: a box under the hull, it floats. */
const HULL: MoveProfile = {
  speed: JETSKI_TOP,
  passes: ["water"],
  flies: false,
  grip: 1,
  iceSpeed: 1,
  waterSpeed: 1,
  footW: 18,
  footH: 6,
  height: 30,
};

/** Which way each facing points, radians. */
const HEADINGS: Readonly<Record<Dir, number>> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

/** How the runners hold on each kind of ground: top speed share, grip, drag. */
const GROUNDS: Readonly<
  Partial<
    Record<
      Terrain,
      { readonly speed: number; readonly grip: number; readonly drag: number }
    >
  >
> = {
  ice: { speed: ICE_SPEED, grip: GRIP_ICE, drag: DRAG_SLICK },
  water: { speed: WATER_SPEED, grip: GRIP_WATER, drag: DRAG_SLICK },
};

/** Snow and paths: the runners bite. */
const SNOWY = { speed: 1, grip: GRIP_SNOW, drag: DRAG_SNOW } as const;

/**
 * The jetskis as on a new visit: each at its home.
 *
 * @returns them, unridden
 */
export function createJetskis(): Jetski[] {
  return JETSKI_HOMES.map((home, index) => ({
    home: index,
    x: home.x * TILE,
    y: home.y * TILE,
    vx: 0,
    vy: 0,
    heading: HEADINGS[home.dir],
    rider: -1,
    idle: 0,
    sprayIn: 0,
    bump: 0,
    west: false,
    east: false,
    doorSaid: false,
  }));
}

/**
 * The jetski somebody sits on.
 *
 * @param state - the game
 * @param char - the character
 * @returns the jetski, or null when on foot
 */
export function jetskiOf(state: GameState, char: Character): Jetski | null {
  const who = state.chars.indexOf(char);
  return state.world.jetskis.find((jet) => jet.rider === who) ?? null;
}

/**
 * Whether somebody sits on a jetski.
 *
 * @param state - the game
 * @param char - the character
 * @returns true while riding
 */
export function ridingJetski(state: GameState, char: Character): boolean {
  return jetskiOf(state, char) !== null;
}

/**
 * The jetski within reach of the talk key, as a spot to use.
 *
 * @param state - the game
 * @param char - who looks for one
 * @param x - the point the talk key reaches, map px
 * @param y - the point the talk key reaches, map px
 * @returns the spot, or null when none is near
 */
export function jetskiSpot(
  state: GameState,
  char: Character,
  x: number,
  y: number,
): Spot | null {
  const jet = nearJetski(state, char, x, y);
  return jet === null
    ? null
    : {
        kind: "jetski",
        tx: Math.floor(jet.x / TILE),
        ty: Math.floor(jet.y / TILE),
        w: 1,
        h: 1,
      };
}

/**
 * The talk key at a jetski: on it goes - unless one flies, is an animal, or
 * somebody else sits on it.
 *
 * @param state - the game
 * @param char - who wants to ride
 * @param spot - the jetski's spot, from {@link jetskiSpot}
 */
export function boardJetski(
  state: GameState,
  char: Character,
  spot: Spot,
): void {
  const jet = nearJetski(
    state,
    char,
    (spot.tx + 1 / 2) * TILE,
    (spot.ty + 1 / 2) * TILE,
  );
  if (jet === null) {
    // Nothing near any more.
  } else if (char.flying || char.altitude >= 1) {
    say(char, JETSKI_TEXTS.flying);
  } else if (char.form !== null) {
    say(char, JETSKI_TEXTS.animal);
  } else if (jet.rider >= 0) {
    say(char, JETSKI_TEXTS.taken);
  } else {
    jet.rider = state.chars.indexOf(char);
    jet.vx = 0;
    jet.vy = 0;
    jet.idle = 0;
    jet.west = false;
    jet.east = false;
    jet.doorSaid = false;
    char.x = jet.x;
    char.y = jet.y;
    char.vx = 0;
    char.vy = 0;
    char.dir = facing(Math.cos(jet.heading), Math.sin(jet.heading));
    state.menu = null;
    say(char, pick(state, JETSKI_TEXTS.go));
    state.sounds.push("jetskiStart");
  }
}

/**
 * The talk key while riding: off beside the jetski, which stays where it is -
 * not in the middle of the water, and not where there is no room.
 *
 * @param state - the game
 * @param char - the rider
 */
export function leaveJetski(state: GameState, char: Character): void {
  const jet = jetskiOf(state, char);
  if (jet !== null) {
    const map = areaMap(state, char);
    const spot = getOffSpot(map, char, jet);
    if (spot !== null) {
      jet.rider = -1;
      jet.vx = 0;
      jet.vy = 0;
      jet.idle = 0;
      char.x = spot.x;
      char.y = spot.y;
      char.vx = 0;
      char.vy = 0;
      char.moving = false;
      say(char, pick(state, JETSKI_TEXTS.off));
    } else if (terrainUnder(map, jet.x, jet.y - 1) === "water") {
      say(char, JETSKI_TEXTS.water);
    } else {
      say(char, JETSKI_TEXTS.noRoom);
    }
  }
}

/**
 * The ability key while riding: the horn - Grantelbart plays a riff on it.
 *
 * @param state - the game
 * @param char - the rider
 */
export function honk(state: GameState, char: Character): void {
  if (char.cooldown <= 0) {
    char.cooldown = HONK_EVERY;
    if (char.id === "grantelbart") {
      state.sounds.push("riff");
      notes(state, char.area, char.x, char.y - NOTE_LIFT);
      say(char, pick(state, JETSKI_TEXTS.hornGrantel));
    } else {
      state.sounds.push("horn");
      say(char, pick(state, JETSKI_TEXTS.horn));
    }
  }
}

/**
 * One step for somebody on a jetski: the nose turns to the stick, the motor
 * pushes, sideways speed fades by the ground, it bounces off what blocks and
 * throws up spray.
 *
 * @param state - the game
 * @param char - the rider
 * @param input - the held controls; nothing for a rider the player left
 * @param dt - seconds
 */
export function updateJetski(
  state: GameState,
  char: Character,
  input: Input,
  dt: number,
): void {
  const jet = jetskiOf(state, char);
  if (jet !== null) {
    const map = areaMap(state, char);
    const ground = GROUNDS[terrainUnder(map, jet.x, jet.y - 1)] ?? SNOWY;
    steer(jet, input, ground, dt);
    move(state, map, char, jet, dt);
    jet.bump = Math.max(0, jet.bump - dt);
    char.x = jet.x;
    char.y = jet.y;
    char.vx = jet.vx;
    char.vy = jet.vy;
    char.moving = Math.hypot(jet.vx, jet.vy) > STILL;
    char.dir = facing(Math.cos(jet.heading), Math.sin(jet.heading));
    char.stride = 0;
    char.altitude = 0;
    char.onIce = false;
    spray(state, map, jet, dt);
    if (steered(state, char)) {
      warnAtDoors(state, char, jet, input);
      checkCrossing(state, map, jet);
    }
  }
}

/**
 * Keeps the jetskis in order every step: a rider who left the map (into the
 * sleigh or indoors) leaves the jetski behind, the jetski follows its rider,
 * and one standing unridden away from home for long enough is back there.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateJetskis(state: GameState, dt: number): void {
  for (const jet of state.world.jetskis) {
    const rider = jet.rider >= 0 ? state.chars[jet.rider] : undefined;
    if (
      rider !== undefined &&
      (rider.area !== "outdoors" || isRiding(state, rider))
    ) {
      jet.rider = -1;
      jet.vx = 0;
      jet.vy = 0;
    } else if (rider !== undefined) {
      // Pushed aside by somebody: the jetski goes along.
      jet.x = rider.x;
      jet.y = rider.y;
    }
    if (jet.rider < 0) {
      const home = homePoint(JETSKI_HOMES[jet.home]);
      const away = Math.hypot(jet.x - home.x, jet.y - home.y) > HOME_SLACK;
      jet.idle = away ? jet.idle + dt : 0;
      if (jet.idle >= JETSKI_RESET && homeClear(state, home)) {
        poof(state, "outdoors", jet.x, jet.y - TILE / 2);
        jet.x = home.x;
        jet.y = home.y;
        jet.heading = HEADINGS[JETSKI_HOMES[jet.home].dir];
        jet.idle = 0;
        poof(state, "outdoors", jet.x, jet.y - TILE / 2);
      }
    }
  }
}

/**
 * How loud and high the motor runs for the character steered.
 *
 * @param state - the game
 * @returns 0 for silence (on foot, or the jetski out of view), up to 1 at top speed
 */
export function motorLevel(state: GameState): number {
  const char = state.chars[state.active];
  const jet = jetskiOf(state, char);
  let level = 0;
  if (jet !== null && state.viewArea === "outdoors" && state.fade === null) {
    const speed = Math.hypot(jet.vx, jet.vy);
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- idle hum, and the rest grows with the speed
    level = 0.25 + 0.75 * Math.min(1, speed / JETSKI_TOP);
  }
  return level;
}

/**
 * Which way a jetski looks, for its picture.
 *
 * @param jet - the jetski
 * @returns the facing nearest its heading
 */
export function jetskiDir(jet: Jetski): Dir {
  return facing(Math.cos(jet.heading), Math.sin(jet.heading));
}

/** The unridden jetski nearest a point within reach, or the one ridden. */
function nearJetski(
  state: GameState,
  char: Character,
  x: number,
  y: number,
): Jetski | null {
  let best: Jetski | null = null;
  let bestDistance = REACH;
  if (char.area === "outdoors") {
    for (const jet of state.world.jetskis) {
      const distance = Math.min(
        Math.hypot(jet.x - x, jet.y - y),
        Math.hypot(jet.x - char.x, jet.y - char.y),
      );
      if (distance < bestDistance) {
        best = jet;
        bestDistance = distance;
      }
    }
  }
  return best;
}

/** Turns the nose to the stick, pushes or brakes, lets sideways speed fade. */
function steer(
  jet: Jetski,
  input: Input,
  ground: {
    readonly speed: number;
    readonly grip: number;
    readonly drag: number;
  },
  dt: number,
): void {
  const push = Math.min(1, Math.hypot(input.moveX, input.moveY));
  let along = 0;
  if (push > DEAD_ZONE) {
    const wanted = Math.atan2(input.moveY, input.moveX);
    const turn = wrap(wanted - jet.heading);
    jet.heading = wrap(
      jet.heading + Math.max(-TURN * dt, Math.min(TURN * dt, turn)),
    );
    along = Math.cos(wrap(wanted - jet.heading));
  }
  const fx = Math.cos(jet.heading);
  const fy = Math.sin(jet.heading);
  let forward = jet.vx * fx + jet.vy * fy;
  let side = -jet.vx * fy + jet.vy * fx;
  const goal = JETSKI_TOP * ground.speed * push;
  if (push > DEAD_ZONE && along < 0) {
    // Pulling back against the nose: brake while it swings round.
    forward = Math.max(0, forward + BRAKE * along * dt);
  } else if (push > DEAD_ZONE && forward < goal) {
    forward = Math.min(goal, forward + THRUST * push * along * dt);
  } else {
    forward *= Math.exp(-ground.drag * dt);
  }
  side *= Math.exp(-ground.grip * dt);
  jet.vx = fx * forward - fy * side;
  jet.vy = fy * forward + fx * side;
}

/**
 * Moves the jetski a step, axis by axis: what blocks throws it back, and a
 * snowman in the way goes over.
 */
function move(
  state: GameState,
  map: GameMap,
  char: Character,
  jet: Jetski,
  dt: number,
): void {
  const speed = Math.hypot(jet.vx, jet.vy);
  // Somebody pushed the rider somewhere too tight: let it drive out freely.
  const stuck = !fits(map, HULL, jet.x, jet.y);
  const dx = jet.vx * dt;
  const dy = jet.vy * dt;
  let hit = false;
  if (stuck || fits(map, HULL, jet.x + dx, jet.y)) {
    jet.x += dx;
  } else if (!slip(map, jet, dx, 0)) {
    knockSnowmen(state, char, map, jet.x + dx, jet.y);
    jet.vx = -jet.vx * BOUNCE;
    hit = true;
  }
  if (stuck || fits(map, HULL, jet.x, jet.y + dy)) {
    jet.y += dy;
  } else if (!slip(map, jet, 0, dy)) {
    knockSnowmen(state, char, map, jet.x, jet.y + dy);
    jet.vy = -jet.vy * BOUNCE;
    hit = true;
  }
  if (hit && speed > BUMP_SPEED && jet.bump <= 0) {
    jet.bump = JETSKI_BUMP;
    snowPuff(state, "outdoors", jet.x, jet.y);
    state.sounds.push("thud");
    if (steered(state, char) && char.bubble === null) {
      say(char, pick(state, JETSKI_TEXTS.crash));
    }
  }
}

/**
 * Slides the jetski a little past the corner of what it brushed, so it finds
 * its way into a path or doorway instead of bouncing off every edge.
 *
 * @returns true when there was a way round
 */
function slip(map: GameMap, jet: Jetski, dx: number, dy: number): boolean {
  let done = false;
  for (let k = 1; k <= CORNER_SLIP && !done; k += 1) {
    for (const side of [-1, 1]) {
      const ox = dy !== 0 ? side * k : 0;
      const oy = dx !== 0 ? side * k : 0;
      if (
        !done &&
        fits(map, HULL, jet.x + ox, jet.y + oy) &&
        fits(map, HULL, jet.x + ox + dx, jet.y + oy + dy)
      ) {
        // Only a little per step: a slide round the corner, not a jump.
        jet.x += Math.sign(ox);
        jet.y += Math.sign(oy);
        done = true;
      }
    }
  }
  return done;
}

/** Snowmen under the hull's box at a point fall over. */
function knockSnowmen(
  state: GameState,
  char: Character,
  map: GameMap,
  x: number,
  y: number,
): void {
  const x0 = Math.floor((x - HULL.footW / 2) / TILE);
  const x1 = Math.floor((x + HULL.footW / 2 - 1) / TILE);
  const y0 = Math.floor((y - HULL.footH) / TILE);
  const y1 = Math.floor((y - 1) / TILE);
  for (let ty = y0; ty <= y1; ty += 1) {
    for (let tx = x0; tx <= x1; tx += 1) {
      const inside = tx >= 0 && ty >= 0 && tx < map.cols && ty < map.rows;
      if (inside && knockSnowman(state, ty * map.cols + tx)) {
        say(char, JETSKI_TEXTS.snowman);
        if (steered(state, char)) {
          unlock(state, "snowmanDown");
        }
      }
    }
  }
}

/** Snow, ice dust or water thrown up behind a jetski on the move. */
function spray(state: GameState, map: GameMap, jet: Jetski, dt: number): void {
  const speed = Math.hypot(jet.vx, jet.vy);
  jet.sprayIn -= dt;
  if (speed > SPRAY_SPEED && jet.sprayIn <= 0) {
    jet.sprayIn = (SPRAY_EVERY * JETSKI_TOP) / speed;
    const fx = Math.cos(jet.heading);
    const fy = Math.sin(jet.heading);
    const tint = SPRAY_TINTS[terrainUnder(map, jet.x, jet.y - 1)] ?? SPRAY_SNOW;
    for (const sideways of [-1, 1]) {
      spawn(
        state,
        "spray",
        "outdoors",
        jet.x - fx * SPRAY_BACK - fy * sideways * SPRAY_WIDE,
        jet.y - fy * SPRAY_BACK + fx * sideways * SPRAY_WIDE,
        -jet.vx * SPRAY_DRAG - fy * sideways * randomIn(state, 0, SPRAY_SPREAD),
        -jet.vy * SPRAY_DRAG -
          randomIn(state, SPRAY_UP / 2, SPRAY_UP) +
          fx * sideways * randomIn(state, 0, SPRAY_SPREAD / 2),
        tint,
      );
    }
  }
}

/**
 * Pushing into a door, a gate or the cinema on the jetski: one is told, once
 * per doorway, to get off first.
 */
function warnAtDoors(
  state: GameState,
  char: Character,
  jet: Jetski,
  input: Input,
): void {
  const map = areaMap(state, char);
  // Doors lead the way one pushes; gates and the cinema are entered upwards.
  const door = map.doors.find(
    (candidate) =>
      candidate.to !== "outdoors" &&
      doorUsable(state, candidate) &&
      inBox(candidate, char.x, char.y - 1),
  );
  const gate = map.gates.some((candidate) =>
    inBox(gateDoor(candidate), char.x, char.y - 1),
  );
  const way = door?.dir ?? (gate || atCinemaDoor(char) ? "up" : null);
  if (way === null) {
    jet.doorSaid = false;
  } else if (
    !jet.doorSaid &&
    input.moveX * PUSHES[way][0] + input.moveY * PUSHES[way][1] > PUSH
  ) {
    jet.doorSaid = true;
    say(char, JETSKI_TEXTS.door);
  }
}

/** One ride from the far west to the far east, or back, wins "Vollgas". */
function checkCrossing(state: GameState, map: GameMap, jet: Jetski): void {
  const edge = EDGE_CELLS * TILE;
  if (jet.x < edge) {
    jet.west = true;
  }
  if (jet.x > map.cols * TILE - edge) {
    jet.east = true;
  }
  if (jet.west && jet.east) {
    unlock(state, "fullThrottle");
  }
}

/**
 * Where the rider gets off: beside the jetski, else behind or ahead of it -
 * on ground one can stand on.
 */
function getOffSpot(
  map: GameMap,
  char: Character,
  jet: Jetski,
): { x: number; y: number } | null {
  const fx = Math.cos(jet.heading);
  const fy = Math.sin(jet.heading);
  const profile = currentProfile(char);
  const tries: readonly (readonly [number, number])[] = [
    [-fy * OFF_SIDE, fx * OFF_SIDE],
    [fy * OFF_SIDE, -fx * OFF_SIDE],
    [-fx * OFF_END, -fy * OFF_END],
    [fx * OFF_END, fy * OFF_END],
  ];
  const found = tries
    .map(([dx, dy]) => ({ x: jet.x + dx, y: jet.y + dy }))
    .find(
      (spot) =>
        fits(map, profile, spot.x, spot.y) &&
        terrainUnder(map, spot.x, spot.y - 1) !== "water",
    );
  return found ?? null;
}

/** A jetski's home, map px. */
function homePoint(home: JetskiHome): { x: number; y: number } {
  return { x: home.x * TILE, y: home.y * TILE };
}

/** Whether nobody stands where a jetski would come back. */
function homeClear(state: GameState, home: { x: number; y: number }): boolean {
  return state.chars.every(
    (char) =>
      char.area !== "outdoors" ||
      Math.hypot(char.x - home.x, char.y - home.y) > HOME_CLEAR,
  );
}

/** An angle brought into -pi to pi. */
function wrap(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}
