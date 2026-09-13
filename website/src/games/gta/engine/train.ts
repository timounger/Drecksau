/**
 * The train: one long thing going round the map on rails.
 *
 * @module
 * @remarks
 * It is not traffic. Traffic brakes, queues, takes corners and can be stolen;
 * a train does none of that. It runs the rectangle it is laid on at a steady
 * pace, for ever, and whatever is on the line when it comes through is a
 * problem for whatever is on the line.
 *
 * That is the whole of it: a distance along a loop, worked out into a place by
 * {@link trainAt}. Nothing about it is remembered from frame to frame except
 * that one number, which is why a saved game can put it back exactly where it
 * was.
 */
import {
  STATIONS,
  railAt,
  railLength,
  stationAlong,
  type Station,
} from "./city";
import {
  STATION_WAIT,
  TRAIN_ACCEL,
  TRAIN_BRAKE,
  TRAIN_CARS,
  TRAIN_GAP,
  TRAIN_SPEED,
  type Train,
  type Vec,
} from "./types";

/** Where a carriage is and which way it points. */
export type OnRails = {
  readonly at: Vec;
  /** Which way it is going, in radians. */
  readonly angle: number;
};

/**
 * The train at the start of a game.
 *
 * @returns it, somewhere along the north side of the loop
 */
export function newTrain(): Train {
  return { along: 0, waitUntil: 0, speed: 0 };
}

/**
 * One step of it.
 *
 * @param train - the train as it stands
 * @param dt - seconds since the last step
 * @param time - the clock, which is what a timetable is kept in
 * @returns the train, that much further round - or exactly where it was
 * @remarks
 * Standing still is part of running: whenever a step would carry the train past
 * a platform it is put **on** the platform instead and left there for
 * {@link STATION_WAIT} seconds. Because it lands exactly on the stop, the next
 * step starts past it and the same platform cannot catch it twice.
 */
export function rollTrain(train: Train, dt: number, time: number): Train {
  const round = loopLength();
  const ahead = gapAhead(train.along);
  // How fast one may be going and still stop at the platform: the standing
  // brake-distance sum, read backwards. Far from a station it is more than the
  // train can do anyway, so the answer out on the open line is simply "full".
  const latest = Math.sqrt(2 * TRAIN_BRAKE * Math.max(0, ahead));
  const want = Math.min(TRAIN_SPEED, latest);
  const speed =
    train.speed < want
      ? Math.min(want, train.speed + TRAIN_ACCEL * dt)
      : Math.max(want, train.speed - TRAIN_BRAKE * dt);
  const gone = speed * dt;
  let next: Train;
  if (time < train.waitUntil) {
    next = { ...train, speed: 0 };
  } else if (ahead <= Math.max(gone, CLOSE_ENOUGH)) {
    // Arrived: put it exactly on the platform rather than a pixel past it, so
    // that the next step starts behind the stop and cannot catch it again.
    next = {
      along: (train.along + ahead) % round,
      waitUntil: time + STATION_WAIT,
      speed: 0,
    };
  } else {
    next = { along: (train.along + gone) % round, waitUntil: 0, speed };
  }
  return next;
}

/** How near the platform counts as being there, in pixels. */
const CLOSE_ENOUGH = 2;

/**
 * How far it is to the next platform.
 *
 * @param along - where the train is now
 * @returns the distance to the nearest station ahead of it
 */
function gapAhead(along: number): number {
  const round = loopLength();
  let best = round;
  for (const stop of stopsAlong()) {
    const gap = (((stop - along) % round) + round) % round;
    if (gap > 0 && gap < best) {
      best = gap;
    }
  }
  return best;
}

/**
 * How long until the train reaches one of the stations.
 *
 * @param train - the train as it stands
 * @param time - the clock
 * @param stop - which station, as an index into the list
 * @returns seconds, or zero while it is standing at that very platform
 * @remarks
 * An estimate rather than a simulation: the run at full speed, plus the wait at
 * every platform in between, plus what braking and pulling away cost at each of
 * them. Close enough for a board on a wall, and a great deal cheaper than
 * running the train forwards in a loop to find out.
 */
export function trainDue(train: Train, time: number, stop: number): number {
  const round = loopLength();
  const stops = stopsAlong();
  const target = stops[stop] ?? 0;
  const ahead = (((target - train.along) % round) + round) % round;
  // Every platform from here to there, in the order the train meets them.
  const legs = stops
    .map((one) => (((one - train.along) % round) + round) % round)
    .filter((gap) => gap > 0 && gap <= ahead)
    .sort((one, other) => one - other);
  let seconds = Math.max(0, train.waitUntil - time);
  let from = 0;
  let speed = train.speed;
  for (const gap of legs) {
    seconds += legTime(gap - from, speed);
    // Every stop on the way costs its wait as well; the last one does not,
    // because arriving is the thing being counted down to.
    seconds += gap === ahead ? 0 : STATION_WAIT;
    from = gap;
    speed = 0;
  }
  return ahead < CLOSE_ENOUGH ? 0 : seconds;
}

/**
 * How long one platform-to-platform run takes.
 *
 * @param distance - how far it is, in pixels
 * @param from - how fast the train is already going at the start of it
 * @returns seconds, pulling away, running and braking to a stand
 * @remarks
 * The trapezium every train driver draws: accelerate, hold, brake. On a short
 * enough run the middle disappears and the peak is wherever the two slopes
 * meet; if the train is already braking hard, only the last slope is left.
 */
function legTime(distance: number, from: number): number {
  const upTo = (TRAIN_SPEED * TRAIN_SPEED - from * from) / (2 * TRAIN_ACCEL);
  const downFrom = (TRAIN_SPEED * TRAIN_SPEED) / (2 * TRAIN_BRAKE);
  const peak = Math.sqrt(
    (2 * TRAIN_ACCEL * TRAIN_BRAKE * distance + TRAIN_BRAKE * from * from) /
      (TRAIN_ACCEL + TRAIN_BRAKE),
  );
  let seconds: number;
  if (from * from >= 2 * TRAIN_BRAKE * distance) {
    // Already slowing for it: the whole of what is left is the last slope.
    seconds = from === 0 ? 0 : (2 * distance) / from;
  } else if (upTo + downFrom <= distance) {
    seconds =
      (TRAIN_SPEED - from) / TRAIN_ACCEL +
      TRAIN_SPEED / TRAIN_BRAKE +
      (distance - upTo - downFrom) / TRAIN_SPEED;
  } else {
    seconds = (peak - from) / TRAIN_ACCEL + peak / TRAIN_BRAKE;
  }
  return seconds;
}

/**
 * Where each station is, as a distance along the loop.
 *
 * @returns one number per station, in the order they are listed
 */
export function stopsAlong(): readonly number[] {
  return STATIONS.map((stop) => alongOf(stop));
}

/**
 * How far round the loop a station sits.
 *
 * @param stop - the station
 * @returns its distance from the north-west corner, clockwise
 * @remarks
 * The same four sides {@link trainAt} works in, read the other way round: a
 * platform is a point on the track, and the track is one number long.
 */
function alongOf(stop: Station): number {
  return stationAlong(stop);
}

/**
 * Whether the train is standing at a platform right now.
 *
 * @param train - the train as it stands
 * @param time - the clock
 * @returns true while it waits, which is the only time one can board
 */
export function atPlatform(train: Train, time: number): boolean {
  return time < train.waitUntil;
}

/**
 * Where each carriage is.
 *
 * @param train - the train as it stands
 * @returns the engine first, then the carriages behind it
 * @remarks
 * Each one is simply the one in front measured back along the track, so the
 * whole train follows the rails round a corner without anybody working out a
 * curve: at this size a corner is one carriage long anyway.
 */
export function trainCars(train: Train): readonly OnRails[] {
  return Array.from({ length: TRAIN_CARS }, (unused, at) =>
    trainAt(train.along - at * TRAIN_GAP),
  );
}

/**
 * The point that far along the loop.
 *
 * @param along - a distance in pixels, from the north-west corner clockwise
 * @returns where it lands and which way the rail runs there
 */
export function trainAt(along: number): OnRails {
  return railAt(along);
}

/**
 * How long one lap is, in pixels.
 *
 * @returns the way round the rectangle
 */
export function loopLength(): number {
  return railLength();
}
