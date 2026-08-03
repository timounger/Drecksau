/**
 * Tests for the rules of a drive: grip, gravity, the driver and the winch.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import {
  canMend,
  grip,
  isGear,
  reachableAnchor,
  ropeCandidate,
  step,
} from "./engine";
import {
  ANCHOR_REACH,
  ENTER_REACH,
  EXIT_GAP,
  gearAt,
  NEUTRAL,
  REVERSE,
  TOP_GEAR,
  FULL_GRIP_SLOPE,
  GOAL_MARGIN,
  IDLE_INPUT,
  NO_GRIP_SLOPE,
  REPAIR_SECONDS,
  BEAR_REACH,
  ROUTE_STEP,
  SPRINT_FACTOR,
  WALK_SPEED,
  WINCH_MIN,
  WINCH_RANGE,
  type GameState,
  type Input,
  type Person,
  type Route,
} from "./types";
import { routeLength } from "./terrain";

/** The only person in these tests - a state carries a list of them now. */
function one(state: GameState): Person {
  return state.people[0];
}

/** One simulated frame, in seconds. */
const FRAME = 0.02;

/** Flat ground with a single anchor a good rope's length ahead. */
const FLAT: Route = {
  name: "eben",
  heights: [0, 0, 0, 0, 0, 0, 0, 0],
  anchors: [{ x: ROUTE_STEP * 4, y: 0 }],
  pits: [],
  items: [],
  bear: null,
  checkpoints: [],
};

/** Flat ground long enough to reach top speed in any gear. */
const LONG: Route = {
  name: "lang",
  heights: Array.from({ length: 300 }, () => 0),
  anchors: [],
  pits: [],
  items: [],
  bear: null,
  checkpoints: [],
};

/** A wall far too steep to drive, with an anchor past the top. */
const WALL: Route = {
  name: "Wand",
  heights: [0, 0, 6, 12, 12, 12],
  anchors: [{ x: ROUTE_STEP * 4, y: 12 }],
  pits: [],
  items: [],
  bear: null,
  checkpoints: [],
};

/** A world at the start of a route. */
function begin(route: Route, x = 0): GameState {
  return {
    rv: { x, v: 0 },
    hooked: -1,
    rope: 0,
    battery: 1,
    phase: "driving",
    time: 0,
    reached: x,
    people: [
      {
        at: x,
        inside: true,
        stride: 0,
        facing: 1,
        walking: false,
        carrying: [],
      },
    ],
    driver: 0,
    gear: 1,
    damaged: false,
    tyres: false,
    repair: 0,
    checkpoint: 0,
  };
}

/** Runs a while with the same input held down. */
function hold(
  state: GameState,
  route: Route,
  input: Partial<Input>,
  seconds: number,
): GameState {
  let now = state;
  for (let frame = 0; frame < seconds / FRAME; frame++) {
    now = step(now, route, [{ ...IDLE_INPUT, ...input }], FRAME);
  }
  return now;
}

/** Gets the driver out and walked over to a place, ready to work. */
function standingAt(state: GameState, route: Route, where: number): GameState {
  let now = one(state).inside
    ? step(state, route, [{ ...IDLE_INPUT, door: true }], FRAME)
    : state;
  const way = where > one(now).at ? 1 : -1;
  for (let frame = 0; frame < 60 / FRAME; frame++) {
    if (Math.abs(one(now).at - where) < WALK_SPEED * FRAME) {
      break;
    }
    now = step(now, route, [{ ...IDLE_INPUT, drive: way }], FRAME);
  }
  return now;
}

/** Puts the rope on the tree the driver is standing at. */
function ropeOn(state: GameState, route: Route): GameState {
  return step(state, route, [{ ...IDLE_INPUT, hook: true }], FRAME);
}

/** Walks the driver back to the motorhome and puts them behind the wheel. */
function ridingAgain(state: GameState, route: Route): GameState {
  const back = standingAt(state, route, state.rv.x);
  return step(back, route, [{ ...IDLE_INPUT, door: true }], FRAME);
}

describe("grip", () => {
  it("is full on flat ground and gone on a wall", () => {
    expect(grip(0)).toBe(1);
    expect(grip(FULL_GRIP_SLOPE)).toBe(1);
    expect(grip(NO_GRIP_SLOPE)).toBe(0);
    expect(grip(NO_GRIP_SLOPE * 2)).toBe(0);
  });

  it("fades away between the two", () => {
    const middle = (FULL_GRIP_SLOPE + NO_GRIP_SLOPE) / 2;
    expect(grip(middle)).toBeGreaterThan(0);
    expect(grip(middle)).toBeLessThan(1);
  });

  it("is just as poor downhill as uphill", () => {
    // Wheels spin on a steep descent too; a sign slipping in here would let
    // the motorhome brake on ground it cannot hold.
    expect(grip(-NO_GRIP_SLOPE)).toBe(grip(NO_GRIP_SLOPE));
  });
});

describe("driving", () => {
  it("settles at the top speed of the gear it is in", () => {
    const first = hold(begin(LONG), LONG, { drive: 1, shift: 1 }, 30);
    expect(first.rv.v).toBeGreaterThan(gearAt(1).top - 1);
    expect(first.rv.v).toBeLessThan(gearAt(1).top + 1);

    const fifth = hold(begin(LONG), LONG, { drive: 1, shift: TOP_GEAR }, 40);
    expect(fifth.rv.v).toBeGreaterThan(first.rv.v * 2);
  });

  it("rolls to a stop when nothing is pressed", () => {
    const rolling = hold(begin(LONG), LONG, { drive: 1 }, 5);
    const coasting = hold(rolling, LONG, {}, 20);
    expect(coasting.rv.v).toBeCloseTo(0, 1);
  });

  it("never crosses the start line backwards", () => {
    expect(hold(begin(FLAT), FLAT, { drive: -1 }, 10).rv.x).toBe(0);
  });

  it("arrives at the goal", () => {
    const arrived = hold(begin(FLAT), FLAT, { drive: 1 }, 60);
    expect(arrived.phase).toBe("arrived");
    expect(arrived.rv.x).toBeCloseTo(routeLength(FLAT) + GOAL_MARGIN);
  });

  it("stops counting time once it has arrived", () => {
    const arrived = hold(begin(FLAT), FLAT, { drive: 1 }, 60);
    expect(hold(arrived, FLAT, { drive: 1 }, 10)).toBe(arrived);
  });

  it("slides back down a wall it cannot hold", () => {
    const onTheWall = begin(WALL, ROUTE_STEP * 1.5);
    const later = hold(onTheWall, WALL, { drive: 1 }, 6);
    expect(later.rv.x).toBeLessThan(onTheWall.rv.x);
  });
});

describe("the gearbox", () => {
  it("keeps the gear that was put in", () => {
    const shifted = step(
      begin(LONG),
      LONG,
      [{ ...IDLE_INPUT, shift: 4 }],
      FRAME,
    );
    expect(shifted.gear).toBe(4);
    expect(hold(shifted, LONG, { drive: 1 }, 3).gear).toBe(4);
  });

  it("drives nothing at all in neutral", () => {
    const idling = hold(begin(LONG), LONG, { drive: 1, shift: NEUTRAL }, 8);
    expect(idling.rv.x).toBe(0);
    expect(idling.rv.v).toBe(0);
  });

  it("lets a motorhome in neutral roll away down a slope", () => {
    // The whole point of a neutral: gravity has the vehicle to itself.
    const onTheSlope = begin(WALL, ROUTE_STEP * 1.5);
    const rolling = hold(onTheSlope, WALL, { shift: NEUTRAL }, 4);
    expect(rolling.rv.x).toBeLessThan(onTheSlope.rv.x);
  });

  it("goes backwards on the backwards pedal", () => {
    const back = hold(begin(LONG, ROUTE_STEP * 5), LONG, { drive: -1 }, 6);
    expect(back.rv.x).toBeLessThan(ROUTE_STEP * 5);
    expect(back.rv.v).toBeLessThan(0);
    expect(back.gear).toBe(REVERSE);
  });

  it("pulls harder in a low gear than in a high one", () => {
    // The reason to have gears at all: on a rise, first gets there and fifth
    // does not.
    const hill: Route = {
      name: "Hang",
      heights: [0, 3, 6, 9],
      anchors: [],
      pits: [],
      items: [],
      bear: null,
      checkpoints: [],
    };
    const inFirst = hold(begin(hill), hill, { drive: 1, shift: 1 }, 12);
    const inTop = hold(begin(hill), hill, { drive: 1, shift: TOP_GEAR }, 12);
    expect(inFirst.rv.x).toBeGreaterThan(inTop.rv.x);
  });

  it("brakes before it reverses, never on the spot", () => {
    // Pressing backwards at speed is a brake. A vehicle that changed direction
    // the instant the pedal went down would be a toy, not a motorhome.
    const rolling = hold(begin(LONG), LONG, { drive: 1, shift: 3 }, 6);
    expect(rolling.rv.v).toBeGreaterThan(0);

    // A moment on the pedal only slows it - it is still going forwards.
    const slowed = hold(rolling, LONG, { drive: -1 }, 0.4);
    expect(slowed.rv.v).toBeLessThan(rolling.rv.v);
    expect(slowed.rv.v).toBeGreaterThan(0);
    expect(slowed.rv.x).toBeGreaterThan(rolling.rv.x);

    // Held long enough, it stops and then goes the other way.
    const reversing = hold(rolling, LONG, { drive: -1 }, 6);
    expect(reversing.rv.v).toBeLessThan(0);
  });

  it("puts reverse in by itself once it is standing", () => {
    // The one gear nobody wants to hunt for.
    const standing = begin(LONG, ROUTE_STEP * 5);
    expect(standing.gear).toBe(1);
    const backing = hold(standing, LONG, { drive: -1 }, 3);
    expect(backing.gear).toBe(REVERSE);
    expect(backing.rv.x).toBeLessThan(standing.rv.x);
  });

  it("does not put a forward gear in by itself", () => {
    // The forward gears are the driver's to choose - guessing one would be the
    // gearbox driving the vehicle.
    const backing = hold(begin(LONG, ROUTE_STEP * 5), LONG, { drive: -1 }, 3);
    const tryingForward = hold(backing, LONG, { drive: 1 }, 6);
    expect(tryingForward.gear).toBe(REVERSE);
    expect(tryingForward.rv.v).toBe(0);

    const chosen = hold(tryingForward, LONG, { drive: 1, shift: 2 }, 3);
    expect(chosen.rv.v).toBeGreaterThan(0);
  });

  it("cannot be shifted from outside the cab", () => {
    // The gear lever is in the cab, not in the driver's pocket.
    const out = step(begin(LONG), LONG, [{ ...IDLE_INPUT, door: true }], FRAME);
    expect(out.gear).toBe(1);
    expect(step(out, LONG, [{ ...IDLE_INPUT, shift: 4 }], FRAME).gear).toBe(1);
  });

  it("knows which gears the box has", () => {
    expect(isGear(REVERSE)).toBe(true);
    expect(isGear(NEUTRAL)).toBe(true);
    expect(isGear(TOP_GEAR)).toBe(true);
    expect(isGear(TOP_GEAR + 1)).toBe(false);
    expect(isGear(REVERSE - 1)).toBe(false);
    expect(isGear(1.5)).toBe(false);
  });

  it("holds a gear that does not exist inside the box", () => {
    expect(gearAt(99).label).toBe(gearAt(TOP_GEAR).label);
    expect(gearAt(-99).label).toBe(gearAt(REVERSE).label);
  });
});

describe("getting in and out", () => {
  it("puts the driver down behind the motorhome", () => {
    const out = step(
      begin(FLAT, ROUTE_STEP * 3),
      FLAT,
      [{ ...IDLE_INPUT, door: true }],
      FRAME,
    );
    expect(one(out).inside).toBe(false);
    expect(one(out).at).toBeCloseTo(out.rv.x - EXIT_GAP);
  });

  it("lets the driver walk both ways, and not off the route", () => {
    const out = step(
      begin(FLAT, ROUTE_STEP * 3),
      FLAT,
      [{ ...IDLE_INPUT, door: true }],
      FRAME,
    );
    expect(one(hold(out, FLAT, { drive: 1 }, 2)).at).toBeGreaterThan(
      one(out).at,
    );
    expect(one(hold(out, FLAT, { drive: -1 }, 60)).at).toBe(0);
  });

  it("leaves the motorhome exactly where it was parked", () => {
    // On a wall, with nobody at the wheel, it must not roll away while the
    // driver is off fetching the rope.
    const out = step(
      begin(WALL, ROUTE_STEP * 1.5),
      WALL,
      [{ ...IDLE_INPUT, door: true }],
      FRAME,
    );
    const later = hold(out, WALL, { drive: 1 }, 8);
    expect(later.rv.x).toBeCloseTo(out.rv.x);
    expect(later.rv.v).toBe(0);
  });

  it("only lets the driver back in from beside it", () => {
    const out = step(
      begin(FLAT, ROUTE_STEP * 3),
      FLAT,
      [{ ...IDLE_INPUT, door: true }],
      FRAME,
    );
    const away = hold(out, FLAT, { drive: 1 }, 6);
    expect(Math.abs(one(away).at - away.rv.x)).toBeGreaterThan(ENTER_REACH);
    expect(
      one(step(away, FLAT, [{ ...IDLE_INPUT, door: true }], FRAME)).inside,
    ).toBe(false);
    const beside = standingAt(away, FLAT, away.rv.x);
    expect(
      one(step(beside, FLAT, [{ ...IDLE_INPUT, door: true }], FRAME)).inside,
    ).toBe(true);
  });

  it("does not call it arrived with nobody aboard", () => {
    // Parked on the flag while the driver is off somewhere is not arriving -
    // the motorhome has to be driven over the line.
    const parked: GameState = {
      ...begin(FLAT, routeLength(FLAT) + GOAL_MARGIN),
      people: [{ ...one(begin(FLAT)), inside: false, at: routeLength(FLAT) }],
      driver: -1,
    };
    expect(step(parked, FLAT, [IDLE_INPUT], FRAME).phase).toBe("driving");
  });

  it("does not count the goal reached by somebody on foot", () => {
    // Walking to the flag is not arriving - the motorhome has to get there.
    const out = step(begin(FLAT), FLAT, [{ ...IDLE_INPUT, door: true }], FRAME);
    const walked = hold(out, FLAT, { drive: 1 }, 60);
    expect(one(walked).at).toBeGreaterThan(routeLength(FLAT));
    expect(walked.phase).toBe("driving");
  });
});

describe("the walk", () => {
  it("counts the steps, and only on foot", () => {
    // The legs are drawn from this, so it has to grow with the walking and
    // stand still with the standing.
    const driving = hold(begin(LONG), LONG, { drive: 1 }, 5);
    expect(one(driving).stride).toBe(0);

    const out = step(driving, LONG, [{ ...IDLE_INPUT, door: true }], FRAME);
    const walked = hold(out, LONG, { drive: 1 }, 3);
    expect(one(walked).stride).toBeGreaterThan(0);
    expect(one(hold(walked, LONG, {}, 3)).stride).toBe(one(walked).stride);
  });

  it("covers far more ground when sprinting", () => {
    // The errand to the tree is the same errand every time; once a player knows
    // the way there is no reason to make them walk it.
    const out = step(
      begin(LONG, ROUTE_STEP * 5),
      LONG,
      [{ ...IDLE_INPUT, door: true }],
      FRAME,
    );
    const walked = hold(out, LONG, { drive: 1 }, 3);
    const ran = hold(out, LONG, { drive: 1, sprint: true }, 3);
    const walkedFar = one(walked).at - one(out).at;
    const ranFar = one(ran).at - one(out).at;
    // A concrete number, not the constant this is meant to be checking: a
    // sprint that is five percent faster than a walk is not a sprint. The upper
    // bound is generous because the factor is currently a debugging aid.
    expect(ranFar / walkedFar).toBeGreaterThan(1.5);
    expect(ranFar / walkedFar).toBeLessThan(20);
    expect(ranFar / walkedFar).toBeCloseTo(SPRINT_FACTOR, 1);
  });

  it("does not make the motorhome any faster", () => {
    // Shift is a pair of legs, not a turbocharger.
    const driving = hold(begin(LONG), LONG, { drive: 1, shift: 3 }, 8);
    const boosted = hold(
      begin(LONG),
      LONG,
      { drive: 1, shift: 3, sprint: true },
      8,
    );
    expect(boosted.rv.x).toBeCloseTo(driving.rv.x);
  });

  it("counts steps backwards as steps too", () => {
    const out = step(
      begin(LONG, ROUTE_STEP * 5),
      LONG,
      [{ ...IDLE_INPUT, door: true }],
      FRAME,
    );
    expect(one(hold(out, LONG, { drive: -1 }, 3)).stride).toBeGreaterThan(0);
  });

  it("knows the difference between walking and standing outside", () => {
    // The legs are drawn from this: frozen mid-stride at a tree would leave
    // the driver posing on one leg for as long as the rope takes.
    const out = step(
      begin(LONG, ROUTE_STEP * 5),
      LONG,
      [{ ...IDLE_INPUT, door: true }],
      FRAME,
    );
    expect(one(out).walking).toBe(false);
    expect(one(hold(out, LONG, { drive: 1 }, 1)).walking).toBe(true);
    expect(one(hold(out, LONG, {}, 1)).walking).toBe(false);
    // Driving is not walking, however much the throttle is held down.
    expect(one(hold(begin(LONG), LONG, { drive: 1 }, 1)).walking).toBe(false);
  });

  it("looks the way it is walking, and keeps looking there", () => {
    const out = step(
      begin(LONG, ROUTE_STEP * 5),
      LONG,
      [{ ...IDLE_INPUT, door: true }],
      FRAME,
    );
    expect(one(hold(out, LONG, { drive: -1 }, 1)).facing).toBe(-1);
    const back = hold(out, LONG, { drive: 1 }, 1);
    expect(one(back).facing).toBe(1);
    // Standing still does not turn anybody around.
    expect(one(hold(back, LONG, {}, 2)).facing).toBe(1);
  });

  it("does not turn the driver around while driving", () => {
    const away = hold(begin(LONG), LONG, { drive: -1 }, 2);
    expect(one(away).facing).toBe(1);
  });
});

describe("driving into a ditch", () => {
  /** Flat ground with a hole in it, a tree past the hole and a hammer. */
  const DITCH: Route = {
    name: "Graben",
    heights: [0, 0, 0, -12, 0, 0, 0, 0, 0],
    anchors: [{ x: ROUTE_STEP * 5, y: 0 }],
    pits: [{ from: ROUTE_STEP * 2.5, to: ROUTE_STEP * 3.5 }],
    items: [{ at: ROUTE_STEP * 7, kind: "hammer" }],
    bear: null,
    checkpoints: [],
  };

  /** Drives forwards until something happens, or the time is up. */
  function driveInto(state: GameState, seconds: number): GameState {
    return hold(state, DITCH, { drive: 1, shift: 2 }, seconds);
  }

  it("wrecks the motorhome", () => {
    const wrecked = driveInto(begin(DITCH), 8);
    expect(wrecked.damaged).toBe(true);
  });

  it("leaves a wreck that will not drive", () => {
    // Measured on level ground: in the hole it would still roll, and rolling
    // is not driving.
    const whole = begin(LONG, ROUTE_STEP * 5);
    const wreck = { ...whole, damaged: true };
    expect(hold(whole, LONG, { drive: 1, shift: 1 }, 6).rv.x).toBeGreaterThan(
      whole.rv.x + 5,
    );
    expect(hold(wreck, LONG, { drive: 1, shift: 1 }, 6).rv.x).toBeCloseTo(
      wreck.rv.x,
    );
  });

  it("spares one that is pulled through on the rope", () => {
    // A controlled pull is not a fall, and that difference is the whole reason
    // to look at a hole before putting a foot down.
    const atTree = standingAt(begin(DITCH), DITCH, DITCH.anchors[0].x);
    const on = step(atTree, DITCH, [{ ...IDLE_INPUT, hook: true }], FRAME);
    const pulled = hold(on, DITCH, { wind: 1 }, 30);
    expect(pulled.rv.x).toBeGreaterThan(DITCH.pits[0].to);
    expect(pulled.damaged).toBe(false);
  });

  it("spares one that is driven in with the rope already on", () => {
    // The rope is what makes it controlled, whoever is holding the wheel.
    const atTree = standingAt(begin(DITCH), DITCH, DITCH.anchors[0].x);
    const on = step(atTree, DITCH, [{ ...IDLE_INPUT, hook: true }], FRAME);
    const driving = ridingAgain(on, DITCH);
    expect(driving.hooked).not.toBe(-1);
    const into = hold(driving, DITCH, { drive: 1, shift: 2 }, 8);
    expect(into.rv.x).toBeGreaterThan(DITCH.pits[0].from);
    expect(into.damaged).toBe(false);
  });

  it("is never mendable from behind the wheel", () => {
    const ready = mendable();
    expect(canMend(one(ready), ready, false)).toBe(true);
    expect(canMend(one(ready), ready, true)).toBe(false);
  });

  it("can still be winched, wrecked or not", () => {
    // Otherwise the ditch is where the drive ends rather than where it stalls.
    const wrecked = driveInto(begin(DITCH), 8);
    const atTree = standingAt(wrecked, DITCH, DITCH.anchors[0].x);
    const on = step(atTree, DITCH, [{ ...IDLE_INPUT, hook: true }], FRAME);
    const pulled = hold(on, DITCH, { wind: 1 }, 30);
    expect(pulled.rv.x).toBeGreaterThan(wrecked.rv.x + 1);
  });

  it("picks the hammer up by walking over it", () => {
    const wrecked = driveInto(begin(DITCH), 8);
    expect(one(wrecked).carrying).toEqual([]);
    const fetched = standingAt(wrecked, DITCH, hammerAt());
    expect(one(fetched).carrying).toEqual(["hammer"]);
  });

  it("does not pick it up by driving past it", () => {
    const passing = { ...begin(DITCH, ROUTE_STEP * 7), pits: undefined };
    void passing;
    const driven = hold(begin(DITCH, ROUTE_STEP * 6), DITCH, { drive: 1 }, 4);
    expect(one(driven).carrying).toEqual([]);
  });

  it("mends after enough hammering, and not before", () => {
    const ready = mendable();
    const half = hold(ready, DITCH, { work: true }, REPAIR_SECONDS / 2);
    expect(half.damaged).toBe(true);
    expect(half.repair).toBeGreaterThan(0);

    const done = hold(ready, DITCH, { work: true }, REPAIR_SECONDS + 0.2);
    expect(done.damaged).toBe(false);
  });

  it("starts the hammering over when the key is let go", () => {
    // Holding it is the job; tapping it is not.
    const ready = mendable();
    const some = hold(ready, DITCH, { work: true }, REPAIR_SECONDS / 2);
    const paused = hold(some, DITCH, {}, 0.2);
    expect(paused.repair).toBe(0);
    expect(paused.damaged).toBe(true);
  });

  it("does nothing without the hammer", () => {
    const wrecked = driveInto(begin(DITCH), 8);
    const beside = standingAt(wrecked, DITCH, wrecked.rv.x);
    expect(one(beside).carrying).toEqual([]);
    const tried = hold(beside, DITCH, { work: true }, REPAIR_SECONDS * 2);
    expect(tried.damaged).toBe(true);
  });

  it("does nothing from the driver's seat", () => {
    const ready = mendable();
    const inCab = ridingAgain(ready, DITCH);
    const tried = hold(inCab, DITCH, { work: true }, REPAIR_SECONDS * 2);
    expect(tried.damaged).toBe(true);
  });

  it("does nothing from the other end of the map", () => {
    const ready = mendable();
    const away = standingAt(ready, DITCH, hammerAt());
    const tried = hold(away, DITCH, { work: true }, REPAIR_SECONDS * 2);
    expect(tried.damaged).toBe(true);
  });

  /** Where the hammer lies on this route. */
  function hammerAt(): number {
    return DITCH.items[0].at;
  }

  /** A wreck, with the hammer fetched and the driver standing at it. */
  function mendable(): GameState {
    const wrecked = driveInto(begin(DITCH), 8);
    const fetched = standingAt(wrecked, DITCH, hammerAt());
    return standingAt(fetched, DITCH, fetched.rv.x);
  }
});

describe("the off-road tyres and the bear", () => {
  /** A wall too steep for the tyres it starts on, with a set lying before it. */
  const WALL_AND_BEAR: Route = {
    name: "Steilstueck",
    // Two characters of rise per step, exactly as the map's own wall: past
    // what the road tyres hold, inside what the off-road ones do.
    heights: [0, 0, 0, 0, 3, 6, 9, 12, 12, 12, 12, 12, 12],
    anchors: [],
    pits: [],
    items: [
      { at: ROUTE_STEP * 2, kind: "tyres" },
      { at: ROUTE_STEP * 9, kind: "spray" },
    ],
    bear: ROUTE_STEP * 11,
    checkpoints: [],
  };

  /** The driver, out of the cab, having fetched one of the things. */
  function fetched(kind: string, from = 0): GameState {
    const item = WALL_AND_BEAR.items.find((each) => each.kind === kind);
    return standingAt(begin(WALL_AND_BEAR, from), WALL_AND_BEAR, item?.at ?? 0);
  }

  it("does not get up the wall on the tyres it starts on", () => {
    const tried = hold(
      begin(WALL_AND_BEAR),
      WALL_AND_BEAR,
      { drive: 1, shift: 1 },
      20,
    );
    expect(tried.rv.x).toBeLessThan(ROUTE_STEP * 5);
  });

  it("gets up it once the other tyres are on", () => {
    const carrying = fetched("tyres");
    expect(one(carrying).carrying).toContain("tyres");
    const beside = standingAt(carrying, WALL_AND_BEAR, carrying.rv.x);
    const fitted = hold(
      beside,
      WALL_AND_BEAR,
      { work: true },
      REPAIR_SECONDS + 0.2,
    );
    expect(fitted.tyres).toBe(true);

    const up = hold(
      ridingAgain(fitted, WALL_AND_BEAR),
      WALL_AND_BEAR,
      { drive: 1, shift: 1 },
      20,
    );
    expect(up.rv.x).toBeGreaterThan(ROUTE_STEP * 7);
  });

  it("holds more slope with them on", () => {
    const steep = NO_GRIP_SLOPE + 0.1;
    expect(grip(steep)).toBe(0);
    expect(grip(steep, true)).toBeGreaterThan(0);
  });

  it("stops everybody at the bear until the spray is found", () => {
    const rolling = hold(
      begin(WALL_AND_BEAR, ROUTE_STEP * 8),
      WALL_AND_BEAR,
      { drive: 1, shift: 2 },
      20,
    );
    expect(rolling.rv.x).toBeLessThanOrEqual(
      (WALL_AND_BEAR.bear ?? 0) - BEAR_REACH + 0.001,
    );
  });

  it("lets the way through once it is carried", () => {
    const armed = fetched("spray", ROUTE_STEP * 8);
    expect(one(armed).carrying).toContain("spray");
    const past = hold(
      ridingAgain(armed, WALL_AND_BEAR),
      WALL_AND_BEAR,
      { drive: 1, shift: 2 },
      20,
    );
    expect(past.rv.x).toBeGreaterThan((WALL_AND_BEAR.bear ?? 0) + 1);
  });

  it("fits nothing that is not being carried", () => {
    const beside = standingAt(
      begin(WALL_AND_BEAR, ROUTE_STEP * 8),
      WALL_AND_BEAR,
      ROUTE_STEP * 8,
    );
    const tried = hold(
      beside,
      WALL_AND_BEAR,
      { work: true },
      REPAIR_SECONDS * 2,
    );
    expect(tried.tyres).toBe(false);
  });
});

describe("the rope", () => {
  it("names the anchor worth walking to: ahead, and within the rope", () => {
    expect(ropeCandidate(begin(FLAT), FLAT)).toBe(0);
    // Standing on top of it: nothing left to wind.
    expect(ropeCandidate(begin(FLAT, FLAT.anchors[0].x), FLAT)).toBe(-1);
    // Already past it: a rope backwards would only ever hold you back.
    expect(ropeCandidate(begin(FLAT, FLAT.anchors[0].x + 1), FLAT)).toBe(-1);
    const faraway: Route = {
      ...FLAT,
      anchors: [{ x: WINCH_RANGE + ROUTE_STEP, y: 0 }],
      checkpoints: [],
    };
    expect(ropeCandidate(begin(faraway), faraway)).toBe(-1);
  });

  it("cannot be put on a tree from the driver's seat", () => {
    // The whole reason the driver is a person: no arm reaches out of a
    // windscreen and around a trunk.
    const inCab = begin(FLAT);
    expect(reachableAnchor(one(inCab), inCab, FLAT)).toBe(-1);
    expect(
      step(inCab, FLAT, [{ ...IDLE_INPUT, hook: true }], FRAME).hooked,
    ).toBe(-1);
  });

  it("cannot be put on a tree from halfway up the track", () => {
    const halfway = standingAt(
      begin(FLAT),
      FLAT,
      FLAT.anchors[0].x - ANCHOR_REACH * 2,
    );
    expect(reachableAnchor(one(halfway), halfway, FLAT)).toBe(-1);
    expect(
      step(halfway, FLAT, [{ ...IDLE_INPUT, hook: true }], FRAME).hooked,
    ).toBe(-1);
  });

  it("goes on when the driver stands at the tree", () => {
    const atTree = standingAt(begin(FLAT), FLAT, FLAT.anchors[0].x);
    expect(reachableAnchor(one(atTree), atTree, FLAT)).toBe(0);
    const hooked = step(atTree, FLAT, [{ ...IDLE_INPUT, hook: true }], FRAME);
    expect(hooked.hooked).toBe(0);
    expect(hooked.rope).toBeCloseTo(FLAT.anchors[0].x - hooked.rv.x);
  });

  it("stays put when the rope key is pressed from the cab", () => {
    // Sitting in the warm with the rope on a tree must not drop it - the same
    // key that fastens it outside does nothing at all in here.
    const atTree = standingAt(begin(FLAT), FLAT, FLAT.anchors[0].x);
    const on = step(atTree, FLAT, [{ ...IDLE_INPUT, hook: true }], FRAME);
    const inCab = ridingAgain(on, FLAT);
    expect(inCab.hooked).toBe(0);
    expect(
      step(inCab, FLAT, [{ ...IDLE_INPUT, hook: true }], FRAME).hooked,
    ).toBe(0);
  });

  it("comes off only at the tree it is tied to", () => {
    // Walking away with the key held down must not untie a knot from afar.
    const atTree = standingAt(begin(FLAT), FLAT, FLAT.anchors[0].x);
    const on = step(atTree, FLAT, [{ ...IDLE_INPUT, hook: true }], FRAME);
    const away = standingAt(on, FLAT, on.rv.x);
    expect(
      step(away, FLAT, [{ ...IDLE_INPUT, hook: true }], FRAME).hooked,
    ).toBe(0);
  });

  it("comes off again at the same tree", () => {
    const atTree = standingAt(begin(FLAT), FLAT, FLAT.anchors[0].x);
    const on = step(atTree, FLAT, [{ ...IDLE_INPUT, hook: true }], FRAME);
    expect(step(on, FLAT, [{ ...IDLE_INPUT, hook: true }], FRAME).hooked).toBe(
      -1,
    );
  });

  it("is worked by remote, from outside, not from the cab", () => {
    // The remote is in a hand, and hands are not behind a windscreen.
    const atTree = standingAt(
      begin(WALL, ROUTE_STEP * 1.2),
      WALL,
      WALL.anchors[0].x,
    );
    const on = ropeOn(atTree, WALL);
    const fromCab = hold(ridingAgain(on, WALL), WALL, { wind: 1 }, 5);
    expect(fromCab.rope).toBeCloseTo(on.rope);

    const winched = hold(on, WALL, { wind: 1 }, 20);
    expect(winched.rv.x).toBeGreaterThan(WALL.anchors[0].x - WINCH_MIN - 1);
  });

  it("pays the rope out again, and lets the motorhome down with it", () => {
    // The other half of a remote: down is as useful as up on a mountain.
    const atTree = standingAt(
      begin(WALL, ROUTE_STEP * 1.2),
      WALL,
      WALL.anchors[0].x,
    );
    // Not to the end of the rope: fully wound in, the hook comes off by
    // itself and there would be nothing left to pay out.
    const up = hold(ropeOn(atTree, WALL), WALL, { wind: 1 }, 3);
    expect(up.hooked).not.toBe(-1);
    const down = hold(up, WALL, { wind: -1 }, 4);
    expect(down.rope).toBeGreaterThan(up.rope);
    expect(down.rv.x).toBeLessThan(up.rv.x);
  });

  it("never pays out more rope than the drum holds", () => {
    const atTree = standingAt(begin(FLAT), FLAT, FLAT.anchors[0].x);
    const on = ropeOn(atTree, FLAT);
    expect(hold(on, FLAT, { wind: -1 }, 60).rope).toBeLessThanOrEqual(
      WINCH_RANGE,
    );
  });

  it("puts the handbrake back on once the rope is off", () => {
    // On the rope the motorhome rolls; off it, it stays where it stopped.
    const atTree = standingAt(
      begin(WALL, ROUTE_STEP * 1.5),
      WALL,
      WALL.anchors[0].x,
    );
    const off = step(
      ropeOn(atTree, WALL),
      WALL,
      [{ ...IDLE_INPUT, hook: true }],
      FRAME,
    );
    expect(off.hooked).toBe(-1);
    expect(hold(off, WALL, {}, 6).rv.x).toBeCloseTo(off.rv.x);
  });

  it("pulls the motorhome up a wall the engine cannot climb", () => {
    // The point of the whole game: throttle alone stalls, the rope does not.
    const foot = begin(WALL, ROUTE_STEP * 1.2);
    expect(hold(foot, WALL, { drive: 1 }, 8).rv.x).toBeLessThan(
      WALL.anchors[0].x,
    );

    const atTree = standingAt(foot, WALL, WALL.anchors[0].x);
    const winched = hold(ropeOn(atTree, WALL), WALL, { wind: 1 }, 20);
    expect(winched.rv.x).toBeGreaterThan(WALL.anchors[0].x - WINCH_MIN - 1);
  });

  it("holds the motorhome on the slope even without winding", () => {
    const atTree = standingAt(
      begin(WALL, ROUTE_STEP * 1.5),
      WALL,
      WALL.anchors[0].x,
    );
    // The handbrake is off while the rope is on, so this is the rope holding
    // it and nothing else.
    const on = ropeOn(atTree, WALL);
    expect(hold(on, WALL, {}, 6).rv.x).toBeCloseTo(on.rv.x, 1);
  });

  it("comes off by itself once the rope is wound in", () => {
    const atTree = standingAt(begin(FLAT), FLAT, FLAT.anchors[0].x);
    const wound = hold(ropeOn(atTree, FLAT), FLAT, { wind: 1 }, 30);
    expect(wound.hooked).toBe(-1);
    expect(wound.rv.x).toBeGreaterThan(FLAT.anchors[0].x - WINCH_MIN - 1);
  });

  it("eats the battery while reeling in and fills it while driving", () => {
    const atTree = standingAt(begin(FLAT), FLAT, FLAT.anchors[0].x);
    const wound = hold(ropeOn(atTree, FLAT), FLAT, { wind: 1 }, 5);
    expect(wound.battery).toBeLessThan(1);
    const driving = ridingAgain(wound, FLAT);
    expect(hold(driving, FLAT, { drive: 1 }, 10).battery).toBeGreaterThan(
      wound.battery,
    );
  });

  it("pays out for free - only the motor costs", () => {
    const atTree = standingAt(begin(FLAT), FLAT, FLAT.anchors[0].x);
    const on = ropeOn(atTree, FLAT);
    expect(hold(on, FLAT, { wind: -1 }, 5).battery).toBe(on.battery);
  });

  it("stops reeling in on an empty battery", () => {
    const atTree = standingAt(
      { ...begin(FLAT), battery: 0 },
      FLAT,
      FLAT.anchors[0].x,
    );
    const on = ropeOn(atTree, FLAT);
    expect(hold(on, FLAT, { wind: 1 }, 5).rope).toBeCloseTo(on.rope);
  });
});

describe("a frame that lasted too long", () => {
  it("does not fast-forward the motorhome", () => {
    // A backgrounded tab comes back with one huge frame. Without the cap the
    // motorhome would be teleported through the mountain.
    const capped = step(begin(FLAT), FLAT, [{ ...IDLE_INPUT, drive: 1 }], 30);
    expect(capped.time).toBeLessThan(1);
    expect(capped.rv.x).toBeLessThan(1);
  });
});

describe("two of them in one motorhome", () => {
  /** A world with two people standing beside the motorhome. */
  function pair(route: Route, x = ROUTE_STEP * 3): GameState {
    const alone = begin(route, x);
    const outside = { ...one(alone), inside: false, at: x - EXIT_GAP };
    return {
      ...alone,
      // Both within reach of the door, so either can climb in first.
      people: [outside, { ...outside, at: x - EXIT_GAP + 2 }],
      driver: -1,
    };
  }

  /** Runs a while with both of them holding their own input down. */
  function both(
    state: GameState,
    route: Route,
    first: Partial<Input>,
    second: Partial<Input>,
    seconds: number,
  ): GameState {
    let now = state;
    for (let frame = 0; frame < seconds / FRAME; frame++) {
      now = step(
        now,
        route,
        [
          { ...IDLE_INPUT, ...first },
          { ...IDLE_INPUT, ...second },
        ],
        FRAME,
      );
    }
    return now;
  }

  it("gives the wheel to whoever got in first", () => {
    const first = step(
      pair(LONG),
      LONG,
      [{ ...IDLE_INPUT, door: true }],
      FRAME,
    );
    expect(first.driver).toBe(0);
    const second = step(
      first,
      LONG,
      [IDLE_INPUT, { ...IDLE_INPUT, door: true }],
      FRAME,
    );
    expect(second.driver).toBe(0);
    expect(second.people[1].inside).toBe(true);
  });

  it("leaves the wheel with the second one if they were first in", () => {
    // The rule is "whoever got in first", not "whoever is listed first".
    const first = step(
      pair(LONG),
      LONG,
      [IDLE_INPUT, { ...IDLE_INPUT, door: true }],
      FRAME,
    );
    expect(first.driver).toBe(1);
    const both = step(first, LONG, [{ ...IDLE_INPUT, door: true }], FRAME);
    expect(both.people[0].inside).toBe(true);
    expect(both.driver).toBe(1);
  });

  it("does not let the passenger steer", () => {
    // Both are aboard, only the passenger has their foot down: nothing moves.
    let world = step(pair(LONG), LONG, [{ ...IDLE_INPUT, door: true }], FRAME);
    world = step(
      world,
      LONG,
      [IDLE_INPUT, { ...IDLE_INPUT, door: true }],
      FRAME,
    );
    const held = both(world, LONG, {}, { drive: 1, shift: 1 }, 2);
    expect(held.rv.x).toBeCloseTo(world.rv.x);
    expect(held.gear).toBe(world.gear);
  });

  it("hands the wheel over when the driver climbs out", () => {
    let world = step(pair(LONG), LONG, [{ ...IDLE_INPUT, door: true }], FRAME);
    world = step(
      world,
      LONG,
      [IDLE_INPUT, { ...IDLE_INPUT, door: true }],
      FRAME,
    );
    const left = step(world, LONG, [{ ...IDLE_INPUT, door: true }], FRAME);
    expect(left.people[0].inside).toBe(false);
    expect(left.driver).toBe(1);
    expect(
      both(left, LONG, {}, { drive: 1, shift: 1 }, 2).rv.x,
    ).toBeGreaterThan(left.rv.x);
  });

  it("lets the one still outside walk while the other drives", () => {
    const world = step(
      pair(LONG),
      LONG,
      [{ ...IDLE_INPUT, door: true }],
      FRAME,
    );
    const moved = both(world, LONG, { drive: 1, shift: 1 }, { drive: -1 }, 1);
    expect(moved.rv.x).toBeGreaterThan(world.rv.x);
    expect(moved.people[1].at).toBeLessThan(world.people[1].at);
    expect(moved.people[1].inside).toBe(false);
  });

  it("winds the winch for whoever is holding the remote", () => {
    const route = { ...FLAT, anchors: [{ x: ROUTE_STEP * 4, y: 0 }] };
    const world = standingAt(pair(route), route, route.anchors[0].x);
    const on = step(world, route, [{ ...IDLE_INPUT, hook: true }], FRAME);
    expect(on.hooked).toBe(0);
    // The second one reels in, the first one does nothing.
    const pulled = both(on, route, {}, { wind: 1 }, 1);
    expect(pulled.rope).toBeLessThan(on.rope);
  });

  it("only needs one can of bear spray between them", () => {
    const guarded: Route = { ...LONG, bear: ROUTE_STEP * 6 };
    const withSpray = pair(guarded);
    const carried: GameState = {
      ...withSpray,
      people: [
        withSpray.people[0],
        { ...withSpray.people[1], carrying: ["spray"] },
      ],
    };
    // The door is a press, not a hold: held down it would swing every frame.
    const aboard = step(
      carried,
      guarded,
      [{ ...IDLE_INPUT, door: true }],
      FRAME,
    );
    const past = both(aboard, guarded, { drive: 1, shift: 1 }, {}, 30);
    expect(past.rv.x).toBeGreaterThan(guarded.bear as number);
  });
});
