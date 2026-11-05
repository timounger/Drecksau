/**
 * The narrow-gauge railway: a little steam engine with three open wagons
 * goes round its loop for ever - up past the workshop, along the north
 * behind the village, down the east beside the plantation and back through
 * the south land - and calls at five stations. With the talk key one gets on
 * at a platform, rides along, and gets off at any station.
 *
 * @module
 * @remarks
 * The track is no part of the map's rows: it is a loop through the middles
 * of cells ({@link TRACK_CORNERS}), drawn over the ground and passable
 * everywhere. Where paths cross it, barriers come down as the train nears.
 * The train never squeezes anybody: whoever stands on the track is pushed
 * gently aside, and if there is no room beside the track the train waits,
 * whistling. Riders sit two to a wagon and go along; while it runs, the talk
 * key asks to get off at the next station. Nothing of it is saved but the
 * stations visited (`progress.stops`) and the achievements.
 */
import { PLACES_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { collect, steered, unlock } from "./achievements";
import { noteTask } from "./daily";
import { carried } from "./aboard";
import { currentProfile } from "./movement";
import { poof, say, spawn } from "./effects";
import { JETSKI_HOMES } from "./east-data";
import { TILE, fits, inBox } from "./map";
import {
  CROSSINGS,
  STATIONS,
  TRACK_CORNERS,
  type Crossing,
} from "./places-data";
import { pick, randomIn } from "./random";
import { isRiding } from "./sleigh";
import type {
  Character,
  Dir,
  GameState,
  Spot,
  TrainRider,
  TrainState,
} from "./types";

/** One straight stretch of the loop, map px. */
type Segment = {
  readonly x: number;
  readonly y: number;
  readonly dx: number;
  readonly dy: number;
  readonly length: number;
  /** Distance along the loop where it starts. */
  readonly from: number;
};

/** A point on the track and the way the train goes there. */
export type TrackPoint = { x: number; y: number; dir: Dir };

/** One car of the train as drawn: where, which way, the engine or a wagon. */
export type TrainCar = TrackPoint & {
  readonly engine: boolean;
  /** Which wagon, 0 behind the engine; -1 for the engine. */
  readonly wagon: number;
};

/** A cell of track and which of its neighbours it joins: 1 up, 2 right, 4 down, 8 left. */
export type TrackCell = {
  readonly tx: number;
  readonly ty: number;
  readonly bits: number;
};

/** Wagons behind the engine, and seats in each. */
export const WAGONS = 3;
const SEATS_PER_WAGON = 2;

/** From one car's middle to the next, map px. */
export const CAR_GAP = 30;

/** Top speed, how fast it gathers speed and brakes; map px per second. */
const TOP = 64;
const ACCEL = 26;
const BRAKE = 40;

/** Creeping speed for the last bit into a station, map px per second. */
const CREEP = 8;

/** Seconds it waits at each station. */
export const STOP_SECONDS = 5;

/** How long each car is along the track, and how far it reaches either side, map px. */
const CAR_HALF = 14;
const SIDE = 9;

/** How far ahead of the engine people are asked to step aside, map px. */
const AHEAD = 12;

/** How fast somebody is pushed aside, map px per second. */
const SHOVE = 90;

/** Seconds between two whistles while blocked. */
const BLOCKED_WHISTLE = 2.2;

/** Seconds a jetski may block the train before it is taken home. */
const JETSKI_BLOCK = 3;

/** How far ahead of and behind the train the barriers are down, map px. */
const BARRIER_AHEAD = 80;
const BARRIER_BEHIND = 30;

/** How near the character steered must be to hear the train, map px. */
const HEAR = 320;

/** Seconds between two chuffs, and between two puffs of steam. */
const CHUFF_EVERY = 0.42;
const PUFF_RUNNING = 0.12;
const PUFF_WAITING = 0.45;

/** Share of the train's speed its steam keeps, backwards. */
const STEAM_DRAG = 0.25;

/** Where the engine's chimney sits over its point, map px. */
const CHIMNEY_UP = 24;
const CHIMNEY_AHEAD = 8;

/** How far either side of a wagon's middle its two riders sit, map px. */
const SEAT_SPREAD = 5;

/** Seconds between two whistles from the ability key. */
const WHISTLE_EVERY = 1.2;

/** Which way each stretch points. */
const DIRS: Readonly<Record<string, Dir>> = {
  "0,-1": "up",
  "1,0": "right",
  "0,1": "down",
  "-1,0": "left",
};

/** The loop as straight stretches. */
const SEGMENTS: readonly Segment[] = buildSegments();

/** How long the whole loop is, map px. */
export const LOOP = SEGMENTS.reduce((sum, segment) => sum + segment.length, 0);

/** Every cell of track with the neighbours it joins. */
export const TRACK_CELLS: readonly TrackCell[] = buildCells();

/** The cells of track by cell number of the outdoor map's width, to look up quickly. */
const ON_TRACK: ReadonlySet<string> = new Set(
  TRACK_CELLS.map((cell) => `${String(cell.tx)},${String(cell.ty)}`),
);

/** Where the engine stands when the middle wagon is at each station. */
const STOP_AT: readonly number[] = STATIONS.map((station) =>
  wrapDist(
    distanceOf((station.x + 1 / 2) * TILE, (station.y + 1 / 2) * TILE) +
      CAR_GAP * 2,
  ),
);

/**
 * The train on a new visit: waiting at the workshop station.
 *
 * @returns its state
 */
export function createTrain(): TrainState {
  return {
    dist: STOP_AT[0],
    speed: 0,
    stop: 0,
    wait: STOP_SECONDS,
    last: 0,
    riders: [],
    puffIn: 0,
    blocked: 0,
  };
}

/**
 * Whether a point lies on the track.
 *
 * @param x - map px
 * @param y - map px
 * @returns true on a cell of track
 */
export function onTrack(x: number, y: number): boolean {
  return ON_TRACK.has(
    `${String(Math.floor(x / TILE))},${String(Math.floor(y / TILE))}`,
  );
}

/**
 * The point on the track a distance along the loop.
 *
 * @param dist - map px from the loop's start
 * @returns the point and the way the train goes there
 */
export function pointAt(dist: number): TrackPoint {
  const d = wrapDist(dist);
  const segment =
    SEGMENTS.find((candidate) => d < candidate.from + candidate.length) ??
    SEGMENTS[SEGMENTS.length - 1];
  const along = d - segment.from;
  return {
    x: segment.x + segment.dx * along,
    y: segment.y + segment.dy * along,
    dir: DIRS[`${String(segment.dx)},${String(segment.dy)}`] ?? "right",
  };
}

/**
 * The engine and the wagons as they stand right now, engine first.
 *
 * @param state - the game
 * @returns every car
 */
export function trainCars(state: GameState): TrainCar[] {
  const dist = state.world.places.train.dist;
  const cars: TrainCar[] = [{ ...pointAt(dist), engine: true, wagon: -1 }];
  for (let k = 0; k < WAGONS; k += 1) {
    cars.push({
      ...pointAt(dist - CAR_GAP * (k + 1)),
      engine: false,
      wagon: k,
    });
  }
  return cars;
}

/**
 * Whether the barriers of a crossing are down: the train is near.
 *
 * @param state - the game
 * @param crossing - the crossing
 * @returns true while they are down
 */
export function barrierDown(state: GameState, crossing: Crossing): boolean {
  return closedAt(state.world.places.train.dist, crossing);
}

/**
 * The station whose platform a spot is, as its index.
 *
 * @param spot - a platform spot
 * @returns the station, 0 if none matches
 */
export function stationOf(spot: Spot): number {
  return Math.max(
    0,
    STATIONS.findIndex(
      (station) =>
        station.platform.tx === spot.tx && station.platform.ty === spot.ty,
    ),
  );
}

/**
 * The talk key on a platform: on the train if it waits here, else when it
 * comes.
 *
 * @param state - the game
 * @param char - who wants to ride
 * @param spot - the platform
 */
export function usePlatform(
  state: GameState,
  char: Character,
  spot: Spot,
): void {
  const train = state.world.places.train;
  const station = stationOf(spot);
  if (char.flying || char.altitude >= 1) {
    say(char, PLACES_TEXTS.trainFlying);
  } else if (char.form !== null) {
    say(char, PLACES_TEXTS.trainAnimal);
  } else if (train.stop !== station) {
    const seconds = Math.max(1, Math.round(eta(state, station)));
    say(char, PLACES_TEXTS.trainComing.replace("{s}", String(seconds)));
  } else {
    board(state, char);
  }
}

/**
 * The talk key on the train: off at the station it waits at, or - while it
 * runs - off at the next one (or not after all).
 *
 * @param state - the game
 * @param char - the rider
 */
export function trainTalk(state: GameState, char: Character): void {
  const train = state.world.places.train;
  const seat = riderOf(state, char);
  if (seat !== null && train.stop >= 0) {
    getOff(state, char, train.stop);
  } else if (seat !== null) {
    seat.alight = !seat.alight;
    const next = STATIONS[nextStation(train)];
    say(
      char,
      seat.alight
        ? PLACES_TEXTS.trainAlight.replace(
            "{name}",
            PLACES_TEXTS.stationNames[next.id],
          )
        : PLACES_TEXTS.trainStayOn,
    );
  }
}

/**
 * The ability key on the train: the engine whistles.
 *
 * @param state - the game
 * @param char - the rider
 */
export function trainWhistle(state: GameState, char: Character): void {
  if (char.cooldown <= 0) {
    char.cooldown = WHISTLE_EVERY;
    state.sounds.push("whistle");
    say(char, pick(state, PLACES_TEXTS.whistle));
  }
}

/**
 * The name of the station the train calls at next, for the line on screen.
 *
 * @param state - the game
 * @returns the station's index
 */
export function nextStop(state: GameState): number {
  const train = state.world.places.train;
  return train.stop >= 0 ? train.stop : nextStation(train);
}

/**
 * Whether somebody stands on a platform, for the hint and the station's sign.
 *
 * @param char - the character
 * @returns the station's index, or -1
 */
export function platformAt(char: Character): number {
  return STATIONS.findIndex((station) =>
    inBox(station.platform, char.x, char.y - 1, 2),
  );
}

/**
 * Runs the train on: waiting at a station, gathering speed, braking for
 * the next one, pushing people off the track, whistling, steaming - and its
 * riders go along.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateTrain(state: GameState, dt: number): void {
  const train = state.world.places.train;
  dropLeavers(state);
  if (train.stop >= 0) {
    train.wait -= dt;
    if (train.wait <= 0) {
      train.last = train.stop;
      train.stop = -1;
      whistle(state);
    }
  } else {
    const blocked = clearTrack(state, dt);
    if (blocked) {
      train.speed = 0;
      train.blocked += dt;
      if (
        Math.floor(train.blocked / BLOCKED_WHISTLE) !==
        Math.floor((train.blocked - dt) / BLOCKED_WHISTLE)
      ) {
        whistle(state);
      }
    } else {
      train.blocked = 0;
      run(state, train, dt);
    }
  }
  seatRiders(state);
  steam(state, train, dt);
}

/** Seats somebody on the waiting train. */
function board(state: GameState, char: Character): void {
  const train = state.world.places.train;
  const taken = new Set(train.riders.map((rider) => rider.seat));
  const seat = [...Array(WAGONS * SEATS_PER_WAGON).keys()].find(
    (index) => !taken.has(index),
  );
  if (seat === undefined) {
    say(char, PLACES_TEXTS.trainFull);
  } else {
    train.riders.push({
      who: state.chars.indexOf(char),
      seat,
      travelled: 0,
      alight: false,
    });
    char.vx = 0;
    char.vy = 0;
    state.menu = null;
    say(char, pick(state, PLACES_TEXTS.trainOn));
    state.sounds.push("ding");
  }
}

/** Off the train onto the platform of a station. */
function getOff(state: GameState, char: Character, station: number): void {
  const train = state.world.places.train;
  const box = STATIONS[station].platform;
  const profile = currentProfile(char);
  const spots: { x: number; y: number }[] = [];
  for (let ty = box.ty; ty < box.ty + box.h; ty += 1) {
    for (let tx = box.tx; tx < box.tx + box.w; tx += 1) {
      spots.push({ x: (tx + 1 / 2) * TILE, y: (ty + 1) * TILE - 1 });
    }
  }
  const spot = spots
    .sort(
      (a, b) =>
        Math.hypot(a.x - char.x, a.y - char.y) -
        Math.hypot(b.x - char.x, b.y - char.y),
    )
    .find((candidate) =>
      fits(state.maps.outdoors, profile, candidate.x, candidate.y),
    );
  if (spot === undefined) {
    say(char, PLACES_TEXTS.trainNoRoom);
  } else {
    const who = state.chars.indexOf(char);
    const left = train.riders.filter((rider) => rider.who !== who);
    train.riders.length = 0;
    train.riders.push(...left);
    char.x = spot.x;
    char.y = spot.y;
    char.vx = 0;
    char.vy = 0;
    char.moving = false;
    say(char, pick(state, PLACES_TEXTS.trainOff));
  }
}

/** Somebody's seat, or null. */
function riderOf(state: GameState, char: Character): TrainRider | null {
  const who = state.chars.indexOf(char);
  return (
    state.world.places.train.riders.find((rider) => rider.who === who) ?? null
  );
}

/** Riders who were taken away (into the sleigh, or indoors) leave the train. */
function dropLeavers(state: GameState): void {
  const train = state.world.places.train;
  const staying = train.riders.filter((rider) => {
    const char = state.chars[rider.who];
    return char.area === "outdoors" && !isRiding(state, char);
  });
  train.riders.length = 0;
  train.riders.push(...staying);
}

/** Speed up, or brake for the next station and stop there. */
function run(state: GameState, train: TrainState, dt: number): void {
  const next = nextStation(train);
  const left = wrapDist(STOP_AT[next] - train.dist);
  const braking = Math.sqrt(2 * BRAKE * left);
  if (braking < train.speed) {
    train.speed = Math.max(CREEP, braking);
  } else {
    train.speed = Math.min(TOP, train.speed + ACCEL * dt);
  }
  const step = Math.min(left, train.speed * dt);
  train.dist = wrapDist(train.dist + step);
  for (const rider of train.riders) {
    rider.travelled += step;
    if (rider.travelled >= LOOP && steered(state, state.chars[rider.who])) {
      unlock(state, "trainLoop");
    }
  }
  bellAtCrossings(state, train.dist - step, train.dist);
  if (left - step <= 0) {
    arrive(state, train, next);
  }
}

/** In at a station: the riders who asked get off, the station counts. */
function arrive(state: GameState, train: TrainState, station: number): void {
  train.stop = station;
  train.wait = STOP_SECONDS;
  train.speed = 0;
  for (const rider of [...train.riders]) {
    const char = state.chars[rider.who];
    noteTask(state, char, "train");
    if (steered(state, char)) {
      collect(state, "stops", STATIONS[station].id);
      say(
        char,
        PLACES_TEXTS.trainArrive.replace(
          "{name}",
          PLACES_TEXTS.stationNames[STATIONS[station].id],
        ),
      );
    }
    if (rider.alight) {
      getOff(state, char, station);
    }
  }
  if (heard(state)) {
    state.sounds.push("ding");
  }
}

/** The station the train calls at next: the nearest ahead it did not just leave. */
function nextStation(train: TrainState): number {
  let best = 0;
  let bestLeft = Infinity;
  STOP_AT.forEach((at, index) => {
    const left = wrapDist(at - train.dist);
    if (index !== train.last && left < bestLeft) {
      best = index;
      bestLeft = left;
    }
  });
  return best;
}

/** Roughly how many seconds until the train waits at a station. */
function eta(state: GameState, station: number): number {
  const train = state.world.places.train;
  const left = wrapDist(STOP_AT[station] - train.dist);
  const between = STOP_AT.filter(
    (at, index) => index !== station && wrapDist(at - train.dist) < left,
  ).length;
  const waiting = train.stop >= 0 ? Math.max(0, train.wait) : 0;
  return left / TOP + between * STOP_SECONDS + waiting;
}

/** Every rider sits in its wagon, facing the way the train goes. */
function seatRiders(state: GameState): void {
  const train = state.world.places.train;
  for (const rider of train.riders) {
    const char = state.chars[rider.who];
    const wagon = Math.floor(rider.seat / SEATS_PER_WAGON);
    const side = rider.seat % SEATS_PER_WAGON === 0 ? 1 : -1;
    const at = pointAt(train.dist - CAR_GAP * (wagon + 1) + side * SEAT_SPREAD);
    char.x = at.x;
    char.y = at.y;
    char.vx = 0;
    char.vy = 0;
    char.dir = at.dir;
    char.moving = false;
    char.stride = 0;
    char.altitude = 0;
    char.onIce = false;
  }
}

/**
 * Pushes everybody standing on the track before and beside the train gently
 * aside.
 *
 * @returns true when somebody cannot step aside, or a jetski is in the way:
 *   the train has to wait
 */
function clearTrack(state: GameState, dt: number): boolean {
  const cars = trainCars(state);
  let blocked = false;
  for (const char of state.chars) {
    if (
      char.area === "outdoors" &&
      char.altitude < 1 &&
      !carried(state, char) &&
      !isRiding(state, char)
    ) {
      cars.forEach((car) => {
        const reach = car.engine ? CAR_HALF + AHEAD : CAR_HALF;
        if (!shoveAside(state, char, car, reach, dt)) {
          blocked = true;
        }
      });
    }
  }
  return blocked || jetskiInWay(state, cars[0], dt);
}

/**
 * Pushes one character off one car's stretch of track.
 *
 * @returns false when there is no room on either side
 */
function shoveAside(
  state: GameState,
  char: Character,
  car: TrainCar,
  reach: number,
  dt: number,
): boolean {
  const [fx, fy] = axis(car.dir);
  const rx = char.x - car.x;
  const ry = char.y - car.y;
  const along = rx * fx + ry * fy;
  const across = -rx * fy + ry * fx;
  let free = true;
  const inside =
    along > -CAR_HALF &&
    along < (car.engine ? reach : CAR_HALF) &&
    Math.abs(across) < SIDE;
  if (inside) {
    const map = state.maps.outdoors;
    const profile = currentProfile(char);
    const first = across >= 0 ? 1 : -1;
    const step = Math.min(SHOVE * dt, SIDE - Math.abs(across) + 1);
    const moved = [first, -first].some((side) => {
      const nx = char.x - fy * side * step;
      const ny = char.y + fx * side * step;
      const ok = fits(map, profile, nx, ny);
      if (ok) {
        char.x = nx;
        char.y = ny;
      }
      return ok;
    });
    free = moved || along < -CAR_HALF / 2;
    if (!moved && char.bubble === null) {
      say(char, PLACES_TEXTS.trainSqueeze);
    }
  }
  return free;
}

/** A jetski left on the track stops the train; after a while it is taken home. */
function jetskiInWay(state: GameState, engine: TrainCar, dt: number): boolean {
  const [fx, fy] = axis(engine.dir);
  let blocked = false;
  for (const jet of state.world.jetskis) {
    const rx = jet.x - engine.x;
    const ry = jet.y - engine.y;
    const along = rx * fx + ry * fy;
    const across = -rx * fy + ry * fx;
    if (
      jet.rider < 0 &&
      along > -CAR_HALF &&
      along < CAR_HALF + AHEAD &&
      Math.abs(across) < SIDE * 2
    ) {
      blocked = true;
      if (state.world.places.train.blocked + dt >= JETSKI_BLOCK) {
        const home = JETSKI_HOMES[jet.home];
        poof(state, "outdoors", jet.x, jet.y - TILE / 2);
        jet.x = home.x * TILE;
        jet.y = home.y * TILE;
        jet.idle = 0;
        poof(state, "outdoors", jet.x, jet.y - TILE / 2);
      }
    }
  }
  return blocked;
}

/** The barriers of a crossing ring as they come down, if one is near. */
function bellAtCrossings(state: GameState, before: number, after: number) {
  for (const crossing of CROSSINGS) {
    if (
      !closedAt(before, crossing) &&
      closedAt(after, crossing) &&
      heard(state)
    ) {
      state.sounds.push("crossing");
    }
  }
}

/** Whether the barriers are down with the engine this far along the loop. */
function closedAt(dist: number, crossing: Crossing): boolean {
  const at = distanceOf(crossing.x * TILE, crossing.y * TILE);
  const ahead = wrapDist(at - dist);
  const behind = wrapDist(dist - at);
  return ahead < BARRIER_AHEAD || behind < CAR_GAP * WAGONS + BARRIER_BEHIND;
}

/** The engine's whistle, if anybody steered is near enough to hear it. */
function whistle(state: GameState): void {
  if (heard(state)) {
    state.sounds.push("whistle");
  }
}

/** Steam from the chimney, and the chuffing while it runs. */
function steam(state: GameState, train: TrainState, dt: number): void {
  train.puffIn -= dt;
  if (train.puffIn <= 0) {
    const running = train.speed > 1;
    train.puffIn = running ? PUFF_RUNNING : PUFF_WAITING;
    const engine = pointAt(train.dist);
    const [fx, fy] = axis(engine.dir);
    spawn(
      state,
      "steam",
      "outdoors",
      engine.x + fx * CHIMNEY_AHEAD + randomIn(state, -1, 1),
      engine.y + fy * CHIMNEY_AHEAD - CHIMNEY_UP,
      -fx * train.speed * STEAM_DRAG,
      -fy * train.speed * STEAM_DRAG,
    );
  }
  const ticks = Math.floor(state.time / CHUFF_EVERY);
  if (
    train.speed > 1 &&
    ticks !== Math.floor((state.time - dt) / CHUFF_EVERY) &&
    heard(state)
  ) {
    state.sounds.push("chuff");
  }
}

/** Whether the character steered is near the train, or on it. */
function heard(state: GameState): boolean {
  const char = state.chars[state.active];
  const engine = pointAt(state.world.places.train.dist);
  return (
    state.viewArea === "outdoors" &&
    char.area === "outdoors" &&
    (riderOf(state, char) !== null ||
      Math.hypot(char.x - engine.x, char.y - engine.y) < HEAR)
  );
}

/** The unit step of a facing. */
function axis(dir: Dir): readonly [number, number] {
  const steps: Readonly<Record<Dir, readonly [number, number]>> = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
  };
  return steps[dir];
}

/** A distance brought into the loop, 0 to its length. */
function wrapDist(dist: number): number {
  return ((dist % LOOP) + LOOP) % LOOP;
}

/** How far along the loop a point on the track lies, map px. */
function distanceOf(x: number, y: number): number {
  let best = 0;
  let bestMiss = Infinity;
  for (const segment of SEGMENTS) {
    const along = Math.max(
      0,
      Math.min(
        segment.length,
        (x - segment.x) * segment.dx + (y - segment.y) * segment.dy,
      ),
    );
    const miss = Math.hypot(
      segment.x + segment.dx * along - x,
      segment.y + segment.dy * along - y,
    );
    if (miss < bestMiss) {
      bestMiss = miss;
      best = segment.from + along;
    }
  }
  return best;
}

/** The loop's straight stretches from its corners. */
function buildSegments(): Segment[] {
  const segments: Segment[] = [];
  let from = 0;
  TRACK_CORNERS.forEach(([cx, cy], index) => {
    const [nx, ny] = TRACK_CORNERS[(index + 1) % TRACK_CORNERS.length];
    const length = (Math.abs(nx - cx) + Math.abs(ny - cy)) * TILE;
    segments.push({
      x: (cx + 1 / 2) * TILE,
      y: (cy + 1 / 2) * TILE,
      dx: Math.sign(nx - cx),
      dy: Math.sign(ny - cy),
      length,
      from,
    });
    from += length;
  });
  return segments;
}

/** Every cell the loop passes, with the neighbours it joins. */
function buildCells(): TrackCell[] {
  const path: (readonly [number, number])[] = [];
  TRACK_CORNERS.forEach(([cx, cy], index) => {
    const [nx, ny] = TRACK_CORNERS[(index + 1) % TRACK_CORNERS.length];
    const steps = Math.abs(nx - cx) + Math.abs(ny - cy);
    for (let k = 0; k < steps; k += 1) {
      path.push([cx + Math.sign(nx - cx) * k, cy + Math.sign(ny - cy) * k]);
    }
  });
  return path.map(([tx, ty], index) => {
    const before = path[(index + path.length - 1) % path.length];
    const after = path[(index + 1) % path.length];
    return {
      tx,
      ty,
      bits: joinBit(tx, ty, before) | joinBit(tx, ty, after),
    };
  });
}

/** The bit of the neighbour a cell joins. */
function joinBit(
  tx: number,
  ty: number,
  other: readonly [number, number],
): number {
  const bits: Readonly<Record<string, number>> = {
    "0,-1": 1,
    "1,0": 2,
    "0,1": 4,
    "-1,0": 8,
  };
  return bits[`${String(other[0] - tx)},${String(other[1] - ty)}`] ?? 0;
}
