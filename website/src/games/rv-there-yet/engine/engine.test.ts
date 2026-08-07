/**
 * Tests for the rules of a drive: grip, gravity, the driver and the winch.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import {
  atVehicle,
  canMend,
  grip,
  isGear,
  jobAt,
  reachableAnchor,
  ropeCandidate,
  step,
  withinReach,
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
  FUEL_SECONDS,
  GOAL_MARGIN,
  BRAKE_ACCEL,
  CHASM_STOP,
  FELL_SECONDS,
  ROOF_HALF,
  ROOF_HIGH,
  IDLE_INPUT,
  STOP_SPEED,
  NO_GRIP_SLOPE,
  PICKUP_REACH,
  REMOTE,
  REPAIR_SECONDS,
  BEAR_LEASH,
  BEAR_REACH,
  SPRAY_SECONDS,
  JUMP_AGAIN,
  JUMP_HIGH,
  MAX_STEP,
  STILL_SECONDS,
  SPRAY_REACH,
  MAUL_SECONDS,
  BEAR_SPEED,
  BEAR_NOTICE,
  ROUTE_STEP,
  SPRINT_FACTOR,
  WALK_SPEED,
  WINCH_MIN,
  WINCH_RANGE,
  type GameState,
  type ItemKind,
  type Input,
  type Person,
  type Route,
} from "./types";
import { routeLength } from "./terrain";
import { startAt } from "./setup";

/** The only person in these tests - a state carries a list of them now. */
function one(state: GameState): Person {
  return state.people[0];
}

/** One simulated frame, in seconds. */
const FRAME = 0.02;

/** How long a jump may hang in the air before it reads as floating, in seconds. */
const SNAPPY = 0.6;

/** Long enough for the handbrake to have stopped anything, in seconds. */
const STOPPING = 3;

/** Flat ground with a single anchor a good rope's length ahead. */
const FLAT: Route = {
  name: "eben",
  heights: [0, 0, 0, 0, 0, 0, 0, 0],
  anchors: [{ x: ROUTE_STEP * 4, y: 0 }],
  pits: [],
  items: [],
  bear: null,
  fog: null,
  bridges: [],
  chasms: [],
  fellTree: null,
  sections: [],
};

/** Flat ground long enough to reach top speed in any gear. */
const LONG: Route = {
  name: "lang",
  heights: Array.from({ length: 300 }, () => 0),
  anchors: [],
  pits: [],
  items: [],
  bear: null,
  fog: null,
  bridges: [],
  chasms: [],
  fellTree: null,
  sections: [],
};

/** A wall far too steep to drive, with an anchor past the top. */
const WALL: Route = {
  name: "Wand",
  heights: [0, 0, 6, 12, 12, 12],
  anchors: [{ x: ROUTE_STEP * 4, y: 12 }],
  pits: [],
  items: [],
  bear: null,
  fog: null,
  bridges: [],
  chasms: [],
  fellTree: null,
  sections: [],
};

/** A world at the start of a route. */
function begin(route: Route, x = 0): GameState {
  return {
    rv: { x, v: 0 },
    hooked: -1,
    rope: 0,
    winch: 0,
    fuel: 1,
    phase: "driving",
    time: 0,
    reached: x,
    bear:
      route.bear === null
        ? null
        : { at: route.bear, hold: 0, sprayed: 0, gone: false },
    people: [
      {
        at: x,
        inside: true,
        stride: 0,
        facing: 1,
        walking: false,
        lift: 0,
        rise: 0,
        pop: -1,
        carrying: [REMOTE],
        // Empty hands, exactly as a fresh drive starts: the remote is in the
        // bag and only comes out once the rope is on something.
        holding: null,
      },
    ],
    driver: 0,
    gear: 1,
    damaged: false,
    tyres: false,
    repair: 0,
    still: 0,
    brake: false,
    felled: false,
    section: 0,
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

/**
 * Brings the motorhome to a stand and steps out.
 *
 * @param state - the world as it is
 * @param route - the route being driven
 * @returns the world with the driver on the road beside it
 * @remarks
 * The handbrake first, because the door only opens on a vehicle that stands.
 * Every test that used to press the key while still rolling now has to do
 * what a player does.
 */
function steppedOut(state: GameState, route: Route): GameState {
  let now = state;
  // Until it actually stands, not for a fixed while: dropped into the ditch
  // it rocks about for the best part of ten seconds before it settles, and
  // the tyres have no grip down there for the handbrake to work on.
  for (let frame = 0; frame < 30 / FRAME; frame++) {
    if (!one(now).inside || Math.abs(now.rv.v) <= STOP_SPEED) {
      break;
    }
    now = step(now, route, [{ ...IDLE_INPUT, brake: true }], FRAME);
  }
  return step(now, route, [{ ...IDLE_INPUT, door: true }], FRAME);
}

/** Gets the driver out and walked over to a place, ready to work. */
function standingAt(state: GameState, route: Route, where: number): GameState {
  let now = one(state).inside ? steppedOut(state, route) : state;
  const way = where > one(now).at ? 1 : -1;
  for (let frame = 0; frame < 60 / FRAME; frame++) {
    if (Math.abs(one(now).at - where) < WALK_SPEED * FRAME) {
      break;
    }
    now = step(now, route, [{ ...IDLE_INPUT, drive: way }], FRAME);
  }
  return now;
}

/** Walks to a thing lying about and picks it up with the key. */
function fetch(state: GameState, route: Route, where: number): GameState {
  const there = standingAt(state, route, where);
  const taken = step(there, route, [{ ...IDLE_INPUT, take: true }], FRAME);
  // Into the bag is not into the hand, so take the newest thing out of it -
  // the same two moves a player makes.
  const slot = one(taken).carrying.length - 1;
  return step(taken, route, [{ ...IDLE_INPUT, pick: slot }], FRAME);
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
      fog: null,
      bridges: [],
      chasms: [],
      fellTree: null,
      sections: [],
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

    const out = steppedOut(driving, LONG);
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
    fog: null,
    bridges: [],
    chasms: [],
    fellTree: null,
    sections: [],
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
    expect(canMend(one(ready), ready, false, DITCH)).toBe(true);
    expect(canMend(one(ready), ready, true, DITCH)).toBe(false);
  });

  it("can still be winched, wrecked or not", () => {
    // Otherwise the ditch is where the drive ends rather than where it stalls.
    const wrecked = driveInto(begin(DITCH), 8);
    const atTree = standingAt(wrecked, DITCH, DITCH.anchors[0].x);
    const on = step(atTree, DITCH, [{ ...IDLE_INPUT, hook: true }], FRAME);
    const pulled = hold(on, DITCH, { wind: 1 }, 30);
    expect(pulled.rv.x).toBeGreaterThan(wrecked.rv.x + 1);
  });

  it("picks the hammer up when the key is pressed at it", () => {
    const wrecked = driveInto(begin(DITCH), 8);
    expect(one(wrecked).carrying).not.toContain("hammer");
    // Standing on it is not enough - walking past a thing must not sweep it up.
    const there = standingAt(wrecked, DITCH, hammerAt());
    expect(one(there).carrying).not.toContain("hammer");
    const fetched = step(there, DITCH, [{ ...IDLE_INPUT, take: true }], FRAME);
    expect(one(fetched).carrying).toContain("hammer");
  });

  it("does not pick anything up from too far away", () => {
    const wrecked = driveInto(begin(DITCH), 8);
    const near = standingAt(wrecked, DITCH, hammerAt() + PICKUP_REACH * 2);
    const pressed = step(near, DITCH, [{ ...IDLE_INPUT, take: true }], FRAME);
    expect(one(pressed).carrying).not.toContain("hammer");
  });

  it("does not pick it up by driving past it", () => {
    const passing = { ...begin(DITCH, ROUTE_STEP * 7), pits: undefined };
    void passing;
    const driven = hold(begin(DITCH, ROUTE_STEP * 6), DITCH, { drive: 1 }, 4);
    expect(one(driven).carrying).not.toContain("hammer");
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
    expect(one(beside).carrying).not.toContain("tyres");
    const tried = hold(beside, DITCH, { work: true }, REPAIR_SECONDS * 2);
    expect(tried.damaged).toBe(true);
  });

  it("keeps the hammer after mending - the next ditch is still out there", () => {
    // Deliberate: one hammer, and the ditch does not go away after one visit.
    const mended = hold(
      mendable(),
      DITCH,
      { work: true },
      REPAIR_SECONDS + 0.2,
    );
    expect(mended.damaged).toBe(false);
    expect(one(mended).carrying).toContain("hammer");
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
    const carrying = fetch(wrecked, DITCH, hammerAt());
    return standingAt(carrying, DITCH, carrying.rv.x);
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
    fog: null,
    bridges: [],
    chasms: [],
    fellTree: null,
    sections: [],
  };

  /** The driver, out of the cab, having fetched one of the things. */
  function fetched(kind: string, from = 0): GameState {
    const item = WALL_AND_BEAR.items.find((each) => each.kind === kind);
    return fetch(begin(WALL_AND_BEAR, from), WALL_AND_BEAR, item?.at ?? 0);
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

  it("takes the tyres out of the bag once they are on the vehicle", () => {
    // They are bolted to the motorhome now. A set of tyres that stayed in the
    // bag for ever would be a list that only grows and never tells the truth.
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
    expect(one(fitted).carrying).not.toContain("tyres");
    // The hand had them and is empty afterwards. Falling back to whatever was
    // left in the bag meant carrying the winch remote about for hours in case
    // it might be needed, which is not how anybody carries anything.
    expect(one(fitted).holding).toBe(null);
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

  it("comes out of the bag by itself when the bear is there", () => {
    // It used to be on the player to find it in the list first. In front of a
    // bear that is not a decision, it is a fumble - and the bear does not
    // wait while you have it.
    const armed = fetched("spray", ROUTE_STEP * 8);
    const stowed: GameState = {
      ...armed,
      people: [{ ...armed.people[0], holding: REMOTE }],
    };
    expect(one(stowed).carrying).toContain("spray");
    const used = hold(stowed, WALL_AND_BEAR, { work: true }, SPRAY_SECONDS * 2);
    expect(one(used).holding).toBe("spray");
    expect(used.bear?.gone).toBe(true);
  });

  it("takes the tyres out at the vehicle without being asked", () => {
    const carrying = fetched("tyres");
    const stowed: GameState = {
      ...carrying,
      people: [{ ...carrying.people[0], holding: REMOTE }],
    };
    const beside = standingAt(stowed, WALL_AND_BEAR, stowed.rv.x);
    expect(one(beside).holding).toBe("tyres");
    const fitted = hold(
      beside,
      WALL_AND_BEAR,
      { work: true },
      REPAIR_SECONDS * 2,
    );
    expect(fitted.tyres).toBe(true);
  });

  it("does not budge for a can that is only carried", () => {
    // The point of the whole change: the spray has to be used, not owned.
    const armed = fetched("spray", ROUTE_STEP * 8);
    expect(one(armed).carrying).toContain("spray");
    const blocked = hold(
      ridingAgain(armed, WALL_AND_BEAR),
      WALL_AND_BEAR,
      { drive: 1, shift: 2 },
      20,
    );
    expect(blocked.rv.x).toBeLessThanOrEqual(
      (WALL_AND_BEAR.bear ?? 0) - BEAR_REACH + 0.001,
    );
    expect(blocked.bear?.gone).toBe(false);
  });

  it("goes once the spray has been held on it long enough", () => {
    const armed = fetched("spray", ROUTE_STEP * 8);
    // Walking towards it is enough to bring it within range of the can.
    const sprayed = hold(
      armed,
      WALL_AND_BEAR,
      { work: true },
      SPRAY_SECONDS + 0.5,
    );
    expect(sprayed.bear?.gone).toBe(true);

    const past = hold(
      ridingAgain(sprayed, WALL_AND_BEAR),
      WALL_AND_BEAR,
      { drive: 1, shift: 2 },
      20,
    );
    expect(past.rv.x).toBeGreaterThan((WALL_AND_BEAR.bear ?? 0) + 1);
  });

  it("does nothing for somebody holding the key without a can", () => {
    const bare = standingAt(
      begin(WALL_AND_BEAR, ROUTE_STEP * 8),
      WALL_AND_BEAR,
      (WALL_AND_BEAR.bear ?? 0) - SPRAY_REACH / 2,
    );
    expect(one(bare).carrying).not.toContain("spray");
    const tried = hold(bare, WALL_AND_BEAR, { work: true }, SPRAY_SECONDS * 2);
    expect(tried.bear?.gone).toBe(false);
  });

  it("starts the spraying over when the key is let go", () => {
    const armed = fetched("spray", ROUTE_STEP * 8);
    const halfway = hold(
      armed,
      WALL_AND_BEAR,
      { work: true },
      SPRAY_SECONDS / 2,
    );
    expect(halfway.bear?.gone).toBe(false);
    expect(halfway.bear?.sprayed).toBeGreaterThan(0);
    const eased = step(halfway, WALL_AND_BEAR, [IDLE_INPUT], FRAME);
    expect(eased.bear?.sprayed).toBe(0);
  });

  it("does not reach the bear from across the clearing", () => {
    // The can has a range. Without one, a player could stand at a safe
    // distance and hose it down, and the whole nerve test would be gone.
    const armed = fetched("spray", ROUTE_STEP * 8);
    const bearAt = armed.bear?.at ?? 0;
    const far: GameState = {
      ...armed,
      people: [{ ...armed.people[0], at: bearAt - SPRAY_REACH - 2 }],
    };
    const tried = step(
      far,
      WALL_AND_BEAR,
      [{ ...IDLE_INPUT, work: true }],
      FRAME,
    );
    expect(tried.bear?.sprayed).toBe(0);

    // Two metres closer, and the same press counts.
    const near: GameState = {
      ...armed,
      people: [{ ...armed.people[0], at: bearAt - SPRAY_REACH + 2 }],
    };
    const counted = step(
      near,
      WALL_AND_BEAR,
      [{ ...IDLE_INPUT, work: true }],
      FRAME,
    );
    expect(counted.bear?.sprayed).toBeGreaterThan(0);
  });

  it("turns round and goes home once you are away", () => {
    // Follow a few metres, give up, walk back. Not a chase across the valley.
    const post = WALL_AND_BEAR.bear ?? 0;
    const out = standingAt(
      begin(WALL_AND_BEAR, ROUTE_STEP * 8),
      WALL_AND_BEAR,
      post - BEAR_NOTICE / 2,
    );
    // It comes for them.
    const chasing = hold(out, WALL_AND_BEAR, {}, 2);
    expect(chasing.bear?.at).toBeLessThan(post);

    // They back off out of its world; it walks home again.
    const far: GameState = {
      ...chasing,
      people: [{ ...chasing.people[0], at: post - BEAR_NOTICE * 3 }],
    };
    const home = hold(far, WALL_AND_BEAR, {}, 10);
    expect(home.bear?.at).toBeCloseTo(post, 1);
  });

  it("never follows further than its leash", () => {
    // It is guarding a place, not hunting across the map - and a bear that
    // could be walked away from its post would be a way past without the can.
    const post = WALL_AND_BEAR.bear ?? 0;
    const out = standingAt(
      begin(WALL_AND_BEAR, ROUTE_STEP * 8),
      WALL_AND_BEAR,
      post - BEAR_NOTICE / 2,
    );
    let state = out;
    let furthest = 0;
    for (let frame = 0; frame < 30 / FRAME; frame++) {
      // Backing away the whole time, as far as the route allows.
      state = step(state, WALL_AND_BEAR, [{ ...IDLE_INPUT, drive: -1 }], FRAME);
      furthest = Math.max(furthest, post - (state.bear?.at ?? post));
    }
    expect(furthest).toBeGreaterThan(0);
    expect(furthest).toBeLessThanOrEqual(BEAR_LEASH + 0.001);
  });

  it("comes after somebody who is out of the cab", () => {
    const out = standingAt(
      begin(WALL_AND_BEAR, ROUTE_STEP * 8),
      WALL_AND_BEAR,
      (WALL_AND_BEAR.bear ?? 0) - BEAR_NOTICE / 2,
    );
    const started = out.bear?.at ?? 0;
    const later = hold(out, WALL_AND_BEAR, {}, 1);
    expect(later.bear?.at).toBeLessThan(started);
  });

  it("stays put while everybody is in the cab", () => {
    const inside = begin(WALL_AND_BEAR, ROUTE_STEP * 8);
    expect(one(inside).inside).toBe(true);
    const later = hold(inside, WALL_AND_BEAR, {}, 2);
    expect(later.bear?.at).toBe(inside.bear?.at);
  });

  it("has you if you stand there long enough", () => {
    // The one thing on this map that kills, and it does not bluff.
    const out = standingAt(
      begin(WALL_AND_BEAR, ROUTE_STEP * 8),
      WALL_AND_BEAR,
      (WALL_AND_BEAR.bear ?? 0) - BEAR_NOTICE / 2,
    );
    const caught = hold(
      out,
      WALL_AND_BEAR,
      {},
      BEAR_NOTICE / BEAR_SPEED + MAUL_SECONDS + 1,
    );
    expect(caught.phase).toBe("mauled");
  });

  it("does not maul somebody who got back in", () => {
    // The cheapest way out of a bad situation, and it has to work.
    const out = standingAt(
      begin(WALL_AND_BEAR, ROUTE_STEP * 8),
      WALL_AND_BEAR,
      (WALL_AND_BEAR.bear ?? 0) - BEAR_NOTICE / 2,
    );
    const back = standingAt(out, WALL_AND_BEAR, out.rv.x);
    const aboard = step(
      back,
      WALL_AND_BEAR,
      [{ ...IDLE_INPUT, door: true }],
      FRAME,
    );
    expect(one(aboard).inside).toBe(true);
    const waited = hold(aboard, WALL_AND_BEAR, {}, MAUL_SECONDS * 2);
    expect(waited.phase).toBe("driving");
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
      sections: [],
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

  it("burns fuel for the engine and more for the winch", () => {
    // Both cost, and the winch costs more: hauling three tonnes up a wall is
    // the hardest thing this engine ever does.
    const driven = hold(begin(FLAT), FLAT, { drive: 1, shift: 1 }, 10);
    expect(driven.fuel).toBeLessThan(1);

    const atTree = standingAt(begin(FLAT), FLAT, FLAT.anchors[0].x);
    const on = ropeOn(atTree, FLAT);
    const wound = hold(on, FLAT, { wind: 1 }, 10);
    expect(1 - wound.fuel).toBeGreaterThan(1 - driven.fuel);
  });

  it("burns nothing while it stands there", () => {
    // A gauge that falls while you look at a hill would punish exactly the
    // thinking this game is about.
    const idle = hold(begin(FLAT), FLAT, {}, 10);
    expect(idle.fuel).toBe(1);
  });

  it("says which way the winch is running", () => {
    // The screen needs this and cannot work it out: the rope moves over there
    // while the hand does nothing visible. So does the guest in co-op, who
    // only ever sees what crosses the wire.
    const atTree = standingAt(begin(FLAT), FLAT, FLAT.anchors[0].x);
    const on = ropeOn(atTree, FLAT);
    expect(on.winch).toBe(0);
    expect(hold(on, FLAT, { wind: 1 }, 1).winch).toBe(1);
    expect(hold(on, FLAT, { wind: -1 }, 1).winch).toBe(-1);
    expect(hold(on, FLAT, {}, 1).winch).toBe(0);
  });

  it("stops reeling in on an empty tank", () => {
    const atTree = standingAt(
      { ...begin(FLAT), fuel: 0 },
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

  it("lets only one of them carry the one hammer", () => {
    // There is one hammer on this map. Two people each holding it would be two
    // hammers, and the second would be a hammer that does not exist.
    const route: Route = {
      ...LONG,
      // Right where the first of them is put down, so it is in reach at once.
      items: [{ at: ROUTE_STEP * 3 - EXIT_GAP, kind: "hammer" }],
    };
    const start = pair(route, ROUTE_STEP * 3);
    const first = step(start, route, [{ ...IDLE_INPUT, take: true }], FRAME);
    expect(first.people[0].carrying).toContain("hammer");

    const second = step(
      first,
      route,
      [IDLE_INPUT, { ...IDLE_INPUT, take: true }],
      FRAME,
    );
    expect(second.people[1].carrying).not.toContain("hammer");
  });

  it("takes the tyres off only the one who fitted them", () => {
    // Built by hand: with one set on the map this cannot arise in play any
    // more, but the rule is "whoever did the work", and that is worth saying.
    const route: Route = { ...LONG, items: [] };
    const start = pair(route, ROUTE_STEP * 3);
    const armed: GameState = {
      ...start,
      people: [
        { ...start.people[0], carrying: ["tyres"], holding: "tyres" },
        { ...start.people[1], carrying: ["tyres"], holding: "tyres" },
      ],
    };
    const beside = {
      ...armed,
      people: armed.people.map((person) => ({ ...person, at: armed.rv.x })),
    };
    const fitted = both(
      beside,
      route,
      { work: true },
      {},
      REPAIR_SECONDS + 0.2,
    );
    expect(fitted.tyres).toBe(true);
    expect(fitted.people[0].carrying).not.toContain("tyres");
    expect(fitted.people[1].carrying).toContain("tyres");
  });

  it("only needs one can of bear spray between them", () => {
    // One of them sprays, and the road is open for both - the bear does not
    // have to be driven off twice.
    const guarded: Route = { ...LONG, bear: ROUTE_STEP * 6 };
    const start = pair(guarded, ROUTE_STEP * 3);
    const carried: GameState = {
      ...start,
      bear: { at: guarded.bear ?? 0, hold: 0, sprayed: 0, gone: false },
      people: [
        start.people[0],
        {
          ...start.people[1],
          carrying: ["spray"],
          holding: "spray",
          at: (guarded.bear ?? 0) - 5,
        },
      ],
    };
    // Only the second one holds the key, and only they have the can.
    const sprayed = both(
      carried,
      guarded,
      {},
      { work: true },
      SPRAY_SECONDS + 0.5,
    );
    expect(sprayed.bear?.gone).toBe(true);

    // Now the first one may drive past, without ever having touched the can.
    const aboard = step(
      sprayed,
      guarded,
      [{ ...IDLE_INPUT, door: true }],
      FRAME,
    );
    const past = both(aboard, guarded, { drive: 1, shift: 1 }, {}, 30);
    expect(past.rv.x).toBeGreaterThan(guarded.bear as number);
  });
});

describe("picking things up", () => {
  /** Flat ground with a tree, and the hammer lying at its foot. */
  const TREE_AND_HAMMER: Route = {
    name: "Baum mit Hammer",
    heights: [0, 0, 0, 0, 0, 0, 0, 0],
    anchors: [{ x: ROUTE_STEP * 4, y: 0 }],
    pits: [],
    items: [{ at: ROUTE_STEP * 4, kind: "hammer" }],
    bear: null,
    fog: null,
    bridges: [],
    chasms: [],
    fellTree: null,
    sections: [],
  };

  it("keeps the rope and the picking up on separate keys", () => {
    // They used to share the space bar, and sharing needed a rule about which
    // one wins. Two keys need no rule: at a tree with a hammer at your feet,
    // each key does its own thing and both are one press away.
    const atTree = standingAt(
      begin(TREE_AND_HAMMER),
      TREE_AND_HAMMER,
      TREE_AND_HAMMER.anchors[0].x,
    );
    const roped = step(
      atTree,
      TREE_AND_HAMMER,
      [{ ...IDLE_INPUT, hook: true }],
      FRAME,
    );
    expect(roped.hooked).toBe(0);
    expect(one(roped).carrying).not.toContain("hammer");

    const taken = step(
      atTree,
      TREE_AND_HAMMER,
      [{ ...IDLE_INPUT, take: true }],
      FRAME,
    );
    expect(taken.hooked).toBe(-1);
    expect(one(taken).carrying).toContain("hammer");
  });

  it("does both at once when both keys are pressed", () => {
    const atTree = standingAt(
      begin(TREE_AND_HAMMER),
      TREE_AND_HAMMER,
      TREE_AND_HAMMER.anchors[0].x,
    );
    const done = step(
      atTree,
      TREE_AND_HAMMER,
      [{ ...IDLE_INPUT, hook: true, take: true }],
      FRAME,
    );
    expect(done.hooked).toBe(0);
    expect(one(done).carrying).toContain("hammer");
  });

  it("offers nothing to somebody sitting in the cab", () => {
    // Parked right on top of it - and still out of reach, because reaching out
    // of a cab window for a set of tyres is not a thing that happens.
    const parked = begin(TREE_AND_HAMMER, TREE_AND_HAMMER.items[0].at);
    expect(one(parked).inside).toBe(true);
    expect(withinReach(one(parked), parked, TREE_AND_HAMMER)).toBe(null);
    const pressed = step(
      parked,
      TREE_AND_HAMMER,
      [{ ...IDLE_INPUT, take: true }],
      FRAME,
    );
    expect(one(pressed).carrying).not.toContain("hammer");
  });

  it("says what lies within reach, and nothing once it is carried", () => {
    const atIt = standingAt(
      begin(TREE_AND_HAMMER),
      TREE_AND_HAMMER,
      TREE_AND_HAMMER.items[0].at,
    );
    expect(withinReach(one(atIt), atIt, TREE_AND_HAMMER)).toBe("hammer");
    const taken = step(
      atIt,
      TREE_AND_HAMMER,
      [{ ...IDLE_INPUT, take: true }],
      FRAME,
    );
    expect(withinReach(one(taken), taken, TREE_AND_HAMMER)).toBe(null);
  });
});

describe("the bag and the hand", () => {
  /** Flat ground with a hammer and a tree, and a wrecked motorhome. */
  const BAG: Route = {
    name: "Beutel",
    heights: [0, 0, 0, 0, 0, 0, 0, 0],
    anchors: [{ x: ROUTE_STEP * 4, y: 0 }],
    pits: [],
    items: [{ at: ROUTE_STEP * 2, kind: "hammer" }],
    bear: null,
    fog: null,
    bridges: [],
    chasms: [],
    fellTree: null,
    sections: [],
  };

  /** Standing at the hammer, having pressed the pick-up key once. */
  function picked(): GameState {
    const out = standingAt(begin(BAG), BAG, BAG.items[0].at);
    return step(out, BAG, [{ ...IDLE_INPUT, take: true }], FRAME);
  }

  it("starts with the winch remote in the bag and hands empty", () => {
    // It belongs to the motorhome, not to the mountain - so it is always
    // there. In the hand it is not: a tool carried the whole way in case it
    // might be wanted is clutter, not equipment.
    const start = begin(BAG);
    expect(one(start).carrying).toEqual([REMOTE]);
    expect(one(start).holding).toBe(null);
  });

  it("puts a picked-up thing in the bag, not in the hand", () => {
    const now = picked();
    expect(one(now).carrying).toEqual([REMOTE, "hammer"]);
    // The whole point of a bag: it waits there until the spot asks for it or
    // somebody takes it out.
    expect(one(now).holding).toBe(null);
  });

  it("takes a thing into the hand by its slot", () => {
    const chosen = step(picked(), BAG, [{ ...IDLE_INPUT, pick: 1 }], FRAME);
    expect(one(chosen).holding).toBe("hammer");
  });

  it("ignores a slot that is not in the bag", () => {
    const held = step(picked(), BAG, [{ ...IDLE_INPUT, pick: 1 }], FRAME);
    expect(one(held).holding).toBe("hammer");
    const tried = step(held, BAG, [{ ...IDLE_INPUT, pick: 7 }], FRAME);
    expect(one(tried).holding).toBe("hammer");
  });

  it("steps through the bag and around again", () => {
    // From empty hands the first step takes the first thing that will stay in
    // the hand - the remote goes straight back while the rope is off, so what
    // arrives is the hammer, and stepping on comes round to it again.
    const first = step(picked(), BAG, [{ ...IDLE_INPUT, cycle: true }], FRAME);
    expect(one(first).holding).toBe(null);
    const second = step(first, BAG, [{ ...IDLE_INPUT, cycle: true }], FRAME);
    expect(one(second).holding).toBe(null);
    const chosen = step(second, BAG, [{ ...IDLE_INPUT, pick: 1 }], FRAME);
    expect(one(chosen).holding).toBe("hammer");
  });

  it("puts the hammer in the hand at a wrecked motorhome", () => {
    // Walking back with the hammer and then having to find it in the list was
    // the step nobody ever wanted: the wreck is right there and there is only
    // one thing to do with a hammer at it.
    const wrecked = { ...picked(), damaged: true };
    expect(one(wrecked).holding).toBe(null);

    const beside = standingAt(wrecked, BAG, wrecked.rv.x);
    expect(one(beside).holding).toBe("hammer");
    expect(canMend(one(beside), beside, false, BAG)).toBe(true);
  });

  it("puts the remote in the hand once the rope is on the tree", () => {
    const atTree = standingAt(picked(), BAG, BAG.anchors[0].x);
    // Not while merely standing there: the remote does nothing until the
    // rope is on something.
    expect(one(atTree).holding).toBe(null);
    const on = ropeOn(atTree, BAG);
    expect(on.hooked).toBe(0);
    expect(one(on).holding).toBe(REMOTE);
    // And the rope comes in without anybody having chosen anything.
    expect(hold(on, BAG, { wind: 1 }, 3).rope).toBeLessThan(on.rope);
  });

  it("keeps the remote in hand for as long as the rope is on", () => {
    // Winding happens from wherever you can see the rope, which is not always
    // within touching distance of the tree it is tied to.
    const atTree = standingAt(picked(), BAG, BAG.anchors[0].x);
    const on = ropeOn(atTree, BAG);
    const backedOff = standingAt(on, BAG, BAG.anchors[0].x - 12);
    expect(one(backedOff).holding).toBe(REMOTE);
    expect(hold(backedOff, BAG, { wind: 1 }, 3).rope).toBeLessThan(on.rope);
  });
});

describe("the jerrycan", () => {
  /** Flat ground with a jerrycan lying beside the motorhome. */
  const WITH_CAN: Route = {
    name: "Kanister",
    heights: [0, 0, 0, 0, 0, 0, 0, 0],
    anchors: [],
    pits: [],
    items: [{ at: ROUTE_STEP * 2, kind: "can" }],
    bear: null,
    fog: null,
    bridges: [],
    chasms: [],
    fellTree: null,
    sections: [],
  };

  /** A half-empty tank, with the can fetched and in hand at the motorhome. */
  function ready(): GameState {
    const thirsty = { ...begin(WITH_CAN), fuel: 0.4 };
    const carrying = fetch(thirsty, WITH_CAN, WITH_CAN.items[0].at);
    return standingAt(carrying, WITH_CAN, carrying.rv.x);
  }

  it("fills the tank right up once it has been held long enough", () => {
    const before = ready();
    expect(before.fuel).toBeLessThan(1);
    expect(one(before).holding).toBe("can");

    // Not a splash: twenty litres take longer than a repair, so holding it for
    // as long as mending takes is still not enough.
    const halfway = hold(
      before,
      WITH_CAN,
      { work: true },
      REPAIR_SECONDS + 0.2,
    );
    expect(halfway.fuel).toBeLessThan(1);

    const full = hold(before, WITH_CAN, { work: true }, FUEL_SECONDS + 0.2);
    expect(full.fuel).toBe(1);
  });

  it("is empty afterwards and gone from the bag", () => {
    const full = hold(ready(), WITH_CAN, { work: true }, FUEL_SECONDS + 0.2);
    expect(one(full).carrying).not.toContain("can");
    expect(one(full).holding).toBe(null);
  });

  it("comes out of the bag at a vehicle that needs it", () => {
    const stowed = ready();
    const wrongHand: GameState = {
      ...stowed,
      people: [{ ...stowed.people[0], holding: REMOTE }],
    };
    const filled = hold(wrongHand, WITH_CAN, { work: true }, FUEL_SECONDS * 2);
    expect(filled.fuel).toBe(1);
    expect(one(filled).carrying).not.toContain("can");
  });

  it("is not offered when the tank is already full", () => {
    // Standing there holding a key for nothing is the one thing worse than
    // running dry.
    const carrying = fetch(begin(WITH_CAN), WITH_CAN, WITH_CAN.items[0].at);
    const beside = standingAt(carrying, WITH_CAN, carrying.rv.x);
    expect(beside.fuel).toBe(1);
    expect(jobAt(one(beside), beside, false, WITH_CAN)).toBe(null);
  });

  it("cannot be poured from the driver's seat", () => {
    const inCab = ridingAgain(ready(), WITH_CAN);
    const tried = hold(inCab, WITH_CAN, { work: true }, FUEL_SECONDS * 2);
    expect(tried.fuel).toBeLessThan(1);
  });
});

describe("standing still in the fog", () => {
  /** Flat ground whose second half is closed in. */
  const FOGGY: Route = {
    name: "Nebel",
    heights: Array.from({ length: 40 }, () => 0),
    anchors: [],
    pits: [],
    items: [],
    bear: null,
    fog: { from: ROUTE_STEP * 10, to: ROUTE_STEP * 100 },
    bridges: [],
    chasms: [],
    fellTree: null,
    sections: [],
  };

  /** A world standing at a given metre, in the cab or out of it. */
  function at(x: number, inside = true): GameState {
    const base = begin(FOGGY, x);
    return inside
      ? base
      : {
          ...base,
          people: [{ ...base.people[0], inside: false, at: x }],
          driver: -1,
        };
  }

  it("counts nothing at all outside the fog", () => {
    const clear = hold(at(0), FOGGY, {}, STILL_SECONDS * 2);
    expect(clear.still).toBe(0);
    expect(clear.phase).toBe("driving");
  });

  it("takes whoever stands still in it long enough", () => {
    const parked = at(ROUTE_STEP * 20);
    expect(hold(parked, FOGGY, {}, STILL_SECONDS / 2).phase).toBe("driving");
    expect(hold(parked, FOGGY, {}, STILL_SECONDS + 0.2).phase).toBe("taken");
  });

  it("takes somebody standing about on foot just the same", () => {
    // The rule is about the fog, not about the vehicle: the motorhome is
    // parked well short of it here, and only the walker is in the grey.
    const parked = at(ROUTE_STEP * 4);
    const out: GameState = {
      ...parked,
      people: [
        { ...parked.people[0], inside: false, at: FOGGY.fog?.from as number },
      ],
      driver: -1,
    };
    expect(hold(out, FOGGY, {}, STILL_SECONDS + 0.2).phase).toBe("taken");
  });

  it("forgets the count again once you are out of the fog", () => {
    // Otherwise a second spent standing in the grey would still be waiting
    // for you a kilometre later.
    const before: GameState = { ...at(0), still: STILL_SECONDS - 0.5 };
    const on = hold(before, FOGGY, {}, 1);
    expect(on.still).toBe(0);
    expect(on.phase).toBe("driving");
  });

  it("leaves anybody who keeps moving alone", () => {
    const rolling = hold(
      at(ROUTE_STEP * 12),
      FOGGY,
      { drive: 1, shift: 2 },
      STILL_SECONDS * 2,
    );
    expect(rolling.phase).toBe("driving");
    expect(rolling.still).toBe(0);
  });

  it("starts the count over the moment something moves", () => {
    const waited = hold(at(ROUTE_STEP * 20), FOGGY, {}, STILL_SECONDS - 1);
    expect(waited.still).toBeGreaterThan(0);
    const moved = hold(waited, FOGGY, { drive: 1, shift: 2 }, 1);
    expect(moved.still).toBe(0);
    // And the reprieve is real: standing again buys the full five seconds.
    expect(hold(moved, FOGGY, {}, STILL_SECONDS - 1).phase).toBe("driving");
  });

  it("counts the pair of them as moving while one of them walks", () => {
    // Two in the fog are not two chances to stand about, but one of them
    // walking is the party moving - and the party is what the fog watches.
    const alone = at(ROUTE_STEP * 20, false);
    const two: GameState = {
      ...alone,
      people: [alone.people[0], { ...alone.people[0] }],
    };
    let now = two;
    for (let frame = 0; frame < (STILL_SECONDS + 0.5) / FRAME; frame++) {
      now = step(now, FOGGY, [IDLE_INPUT, { ...IDLE_INPUT, drive: 1 }], FRAME);
    }
    expect(now.phase).toBe("driving");
    // The one who stood about the whole time is spared with them.
    expect(now.people[0].at).toBe(ROUTE_STEP * 20);
  });
});

describe("jumping", () => {
  /** Flat ground, nothing on it. */
  const YARD: Route = {
    name: "Hof",
    heights: Array.from({ length: 20 }, () => 0),
    anchors: [],
    pits: [],
    items: [],
    bear: null,
    fog: null,
    bridges: [],
    chasms: [],
    fellTree: null,
    sections: [],
  };

  /** Standing beside the motorhome with both feet down. */
  function outside(): GameState {
    const alone = begin(YARD, ROUTE_STEP * 4);
    return {
      ...alone,
      people: [{ ...one(alone), inside: false }],
      driver: -1,
    };
  }

  /** One frame with that input. */
  function tick(state: GameState, input: Partial<Input>): GameState {
    return step(state, YARD, [{ ...IDLE_INPUT, ...input }], FRAME);
  }

  /** The highest they get, and how long they are off the ground. */
  function flight(state: GameState, again = -1): { high: number; air: number } {
    let now = tick(state, { jump: true });
    let high = 0;
    let air = 0;
    for (let frame = 0; frame < 4 / FRAME; frame++) {
      const twice = again >= 0 && Math.abs(air - again) < FRAME / 2;
      now = tick(now, twice ? { jump: true } : {});
      high = Math.max(high, one(now).lift);
      if (one(now).lift <= 0) {
        break;
      }
      air += FRAME;
    }
    return { high, air };
  }

  it("leaves the ground on a press and comes back down", () => {
    const jumped = tick(outside(), { jump: true });
    expect(jumped.people[0].rise).toBeGreaterThan(0);
    const { high, air } = flight(outside());
    expect(high).toBeCloseTo(JUMP_HIGH, 1);
    expect(air).toBeGreaterThan(0);
    // And lands: a jump that never ended would be a flight.
    expect(flight(outside()).high).toBeGreaterThan(0);
  });

  it("does nothing at all without the key", () => {
    const still = tick(outside(), {});
    expect(still.people[0].lift).toBe(0);
    expect(still.people[0].rise).toBe(0);
  });

  it("goes twice as high on a second press straight after", () => {
    const plain = flight(outside()).high;
    const double = flight(outside(), FRAME * 2).high;
    // Against the plain jump rather than against the metre in the rules: both
    // are integrated frame by frame, and it is the ratio that was promised.
    expect(double).toBeCloseTo(plain * 2, 1);
    expect(plain).toBeCloseTo(JUMP_HIGH, 1);
  });

  it("still goes twice as high when the second press comes late", () => {
    // Aimed, not added: whenever inside the window it lands, the peak is the
    // same. Adding a fixed push would make an early tap the better one and
    // turn a plain double tap into a knack.
    const early = flight(outside(), FRAME * 2).high;
    const late = flight(outside(), JUMP_AGAIN - FRAME).high;
    expect(late).toBeCloseTo(early, 1);
  });

  it("ignores a second press that comes too late", () => {
    const plain = flight(outside()).high;
    const late = flight(outside(), JUMP_AGAIN + FRAME * 4).high;
    expect(late).toBeCloseTo(plain, 2);
  });

  it("gives only one extra push per jump", () => {
    let now = tick(outside(), { jump: true });
    now = tick(now, { jump: true });
    const boosted = one(now).rise;
    now = tick(now, { jump: true });
    // The third press finds nothing left to give: gravity has had its frame
    // and nothing else has.
    expect(one(now).rise).toBeLessThan(boosted);
  });

  it("cannot be jumped again in mid-air", () => {
    let now = tick(outside(), { jump: true });
    for (let frame = 0; frame < JUMP_AGAIN / FRAME + 2; frame++) {
      now = tick(now, {});
    }
    const rising = one(now).rise;
    expect(one(now).lift).toBeGreaterThan(0);
    expect(tick(now, { jump: true }).people[0].rise).toBeLessThan(rising);
  });

  it("keeps both feet in the cab", () => {
    const seated = tick(begin(YARD, ROUTE_STEP * 4), { jump: true });
    expect(seated.people[0].lift).toBe(0);
    expect(seated.people[0].rise).toBe(0);
  });

  it("puts a jumper's feet down when they climb in", () => {
    // Otherwise the motorhome would drive off with somebody hanging in the
    // air beside it.
    const air = tick(outside(), { jump: true });
    expect(one(air).rise).toBeGreaterThan(0);
    const aboard = tick(air, { door: true });
    expect(one(aboard).inside).toBe(true);
    expect(one(aboard).lift).toBe(0);
    expect(one(aboard).rise).toBe(0);
  });
});

describe("jumping in the fog", () => {
  /** Flat ground, closed in from the start. */
  const GREY: Route = {
    name: "Nebel",
    heights: Array.from({ length: 40 }, () => 0),
    anchors: [],
    pits: [],
    items: [],
    bear: null,
    fog: { from: 0, to: ROUTE_STEP * 100 },
    bridges: [],
    chasms: [],
    fellTree: null,
    sections: [],
  };

  /** Standing in it on foot, having stood there a while already. */
  function waiting(seconds: number): GameState {
    const alone = begin(GREY, ROUTE_STEP * 4);
    return {
      ...alone,
      still: seconds,
      people: [{ ...one(alone), inside: false }],
      driver: -1,
    };
  }

  it("counts as moving", () => {
    // Somebody who has just jumped has plainly moved, whatever the metre
    // count says, and being taken anyway would read as the rule cheating.
    let now = step(
      waiting(STILL_SECONDS - 1),
      GREY,
      [{ ...IDLE_INPUT, jump: true }],
      FRAME,
    );
    expect(now.still).toBe(0);
    // And it goes on counting as moving for as long as the feet are up.
    for (let frame = 0; frame < 5; frame++) {
      now = step(now, GREY, [IDLE_INPUT], FRAME);
    }
    expect(one(now).lift).toBeGreaterThan(0);
    expect(now.still).toBe(0);
  });

  it("does not save anybody who lands and then stands there", () => {
    // One press, then wait: the count starts afresh on landing and runs out
    // as usual. A jump buys five more seconds, not a way out of the section.
    const pressed = step(
      waiting(0),
      GREY,
      [{ ...IDLE_INPUT, jump: true }],
      FRAME,
    );
    const landed = hold(pressed, GREY, {}, 1);
    expect(one(landed).lift).toBe(0);
    expect(landed.still).toBeGreaterThan(0);
    expect(hold(landed, GREY, {}, STILL_SECONDS).phase).toBe("taken");
  });
});

describe("how a jump is timed", () => {
  /** Flat ground, nothing on it. */
  const YARD: Route = {
    name: "Hof",
    heights: Array.from({ length: 20 }, () => 0),
    anchors: [],
    pits: [],
    items: [],
    bear: null,
    fog: null,
    bridges: [],
    chasms: [],
    fellTree: null,
    sections: [],
  };

  /** Standing beside the motorhome with both feet down. */
  function outside(): GameState {
    const alone = begin(YARD, ROUTE_STEP * 4);
    return { ...alone, people: [{ ...one(alone), inside: false }], driver: -1 };
  }

  /** How long the feet are off the ground, at that frame length. */
  function airtime(frame: number): number {
    let now = step(outside(), YARD, [{ ...IDLE_INPUT, jump: true }], frame);
    let air = 0;
    for (let tick = 0; tick < 4 / frame; tick++) {
      now = step(now, YARD, [IDLE_INPUT], frame);
      if (one(now).lift <= 0) {
        break;
      }
      air += frame;
    }
    return air;
  }

  /** How high they get, at that frame length. */
  function highest(frame: number): number {
    let now = step(outside(), YARD, [{ ...IDLE_INPUT, jump: true }], frame);
    let high = 0;
    for (let tick = 0; tick < 4 / frame; tick++) {
      now = step(now, YARD, [IDLE_INPUT], frame);
      high = Math.max(high, one(now).lift);
      if (one(now).lift <= 0) {
        break;
      }
    }
    return high;
  }

  it("is over quickly", () => {
    // Under real gravity the same ninety centimetres take the best part of a
    // second and the figure hangs there as if the picture were under water.
    expect(airtime(FRAME)).toBeLessThan(SNAPPY);
    expect(airtime(FRAME)).toBeGreaterThan(0);
  });

  it("comes out the same height however fast the machine runs", () => {
    // Sixty frames a second, thirty, and the longest step the engine allows.
    expect(highest(FRAME)).toBeCloseTo(JUMP_HIGH, 1);
    expect(highest(1 / 60)).toBeCloseTo(JUMP_HIGH, 1);
    expect(highest(MAX_STEP)).toBeCloseTo(JUMP_HIGH, 1);
  });
});

describe("the handbrake", () => {
  /**
   * A hill, with the motorhome on the steepest part of it.
   *
   * @remarks
   * Between two height points on purpose. The ground is smoothed through the
   * points, so the points themselves are the flat spots and the middle of a
   * segment is where the hill is a hill.
   */
  const HILL: Route = {
    name: "Hang",
    heights: [0, 1, 2, 3, 4, 5, 6, 7],
    anchors: [],
    pits: [],
    items: [],
    bear: null,
    fog: null,
    bridges: [],
    chasms: [],
    fellTree: null,
    sections: [],
  };
  const STEEP = ROUTE_STEP * 3.5;

  /** At the wheel on the flat, with room to get up to speed. */
  function onTheFlat(): GameState {
    return begin(LONG, ROUTE_STEP * 2);
  }

  /** Up to a proper speed in third, which is where a brake has work to do. */
  function movingAlong(): GameState {
    return hold(onTheFlat(), LONG, { drive: 1, shift: 3 }, 6);
  }

  it("brings it to a stand quickly, but not on the spot", () => {
    const away = movingAlong();
    expect(away.rv.v).toBeGreaterThan(1);

    const moment = hold(away, LONG, { brake: true }, 0.1);
    // Still rolling a tenth of a second in: it brakes, it does not hit a wall.
    expect(moment.rv.v).toBeGreaterThan(0);
    expect(moment.rv.v).toBeLessThan(away.rv.v);
    expect(moment.rv.x).toBeGreaterThan(away.rv.x);

    expect(hold(away, LONG, { brake: true }, STOPPING).rv.v).toBe(0);
  });

  it("stops it in about a second and a half from speed", () => {
    // Long enough to feel like braking, short enough to be a handbrake.
    const away = movingAlong();
    let now = away;
    let taken = 0;
    while (now.rv.v > 0 && taken < STOPPING * 2) {
      now = hold(now, LONG, { brake: true }, FRAME);
      taken += FRAME;
    }
    expect(taken).toBeGreaterThan(0.5);
    expect(taken).toBeLessThan(STOPPING);
  });

  it("bites clearly harder than the brake pedal", () => {
    // The two are not the same control. The pedal is for slowing down, the
    // lever is for stopping, and one that only matched the pedal would be a
    // second pedal in a worse place.
    const away = movingAlong();
    const half = 0.5;
    const lost = away.rv.v - hold(away, LONG, { brake: true }, half).rv.v;
    expect(lost / half).toBeGreaterThan(BRAKE_ACCEL * 1.7);
  });

  it("takes the drive away with it", () => {
    // The one that was actually reported: braking with the accelerator still
    // down, the engine went on pulling and the vehicle only sagged to a walk
    // instead of stopping - which from the seat looks like a handbrake that
    // does nothing at all. Pulled, it cuts the drive.
    const away = movingAlong();
    const braked = hold(away, LONG, { brake: true }, 1);
    const both = hold(away, LONG, { drive: 1, shift: 3, brake: true }, 1);
    expect(both.rv.v).toBe(braked.rv.v);
  });

  it("stops it on a hill with the accelerator down", () => {
    // On the flat the engine gives up on its own; on a slope it does not, and
    // this is where a brake that argues with the engine loses.
    const uphill = hold(begin(HILL, STEEP), HILL, { drive: 1, shift: 2 }, 4);
    expect(uphill.rv.v).not.toBe(0);
    const stopped = hold(
      uphill,
      HILL,
      { drive: 1, shift: 2, brake: true },
      STOPPING,
    );
    expect(stopped.rv.v).toBe(0);
  });

  it("is stronger than the engine", () => {
    // Held with the accelerator down it still stops the vehicle - otherwise
    // it would be advice rather than a brake.
    const away = movingAlong();
    const stopped = hold(
      away,
      LONG,
      { drive: 1, shift: 3, brake: true },
      STOPPING,
    );
    expect(stopped.rv.v).toBe(0);
    // And keeps it there: the engine cannot pull away against it either.
    const revved = hold(stopped, LONG, { drive: 1, shift: 3, brake: true }, 2);
    expect(revved.rv.x).toBe(stopped.rv.x);
  });

  it("holds a standing vehicle on a slope", () => {
    // Not only for stopping: this is how you stand still on a hill at all.
    const onTheHill = begin(HILL, STEEP);
    const rolled = hold(onTheHill, HILL, {}, 4);
    expect(rolled.rv.x).toBeLessThan(STEEP);

    const held = hold(onTheHill, HILL, { brake: true }, 4);
    expect(held.rv.x).toBe(STEEP);
    expect(held.rv.v).toBe(0);
  });

  it("lets go the moment the key does", () => {
    // A lever, not a latch: nothing is left pulled behind you.
    const held = hold(begin(HILL, STEEP), HILL, { brake: true }, 1);
    expect(held.brake).toBe(true);
    const freed = hold(held, HILL, {}, 2);
    expect(freed.brake).toBe(false);
    expect(freed.rv.x).toBeLessThan(held.rv.x);
  });

  it("holds no better than the tyres do", () => {
    // It brakes the wheels, and wheels on a wall this steep hold nothing.
    // Otherwise the handbrake would be a way of parking anywhere, and the
    // rope - which is the whole point of the wall - would be optional.
    const wall = begin(WALL, ROUTE_STEP * 2.5);
    const held = hold(wall, WALL, { brake: true }, 2);
    expect(held.rv.x).toBeLessThan(wall.rv.x);
  });

  it("is the driver's alone", () => {
    // From outside the space bar is a jump, and a jump is not a handbrake.
    const out = step(
      begin(HILL, STEEP),
      HILL,
      [{ ...IDLE_INPUT, door: true }],
      FRAME,
    );
    expect(one(out).inside).toBe(false);
    const jumped = step(out, HILL, [{ ...IDLE_INPUT, brake: true }], FRAME);
    expect(jumped.brake).toBe(false);
  });

  it("is not touched by anything but its own key", () => {
    const busy = hold(
      onTheFlat(),
      LONG,
      { drive: 1, take: true, hook: true },
      1,
    );
    expect(busy.brake).toBe(false);
  });
});

describe("the hand that fills itself", () => {
  /** Flat ground with a tree, a bear and the motorhome in the middle. */
  const YARD: Route = {
    name: "Hof",
    heights: Array.from({ length: 40 }, () => 0),
    anchors: [{ x: ROUTE_STEP * 12, y: 0 }],
    pits: [],
    items: [],
    bear: ROUTE_STEP * 20,
    fog: null,
    bridges: [],
    chasms: [],
    fellTree: null,
    sections: [],
  };

  /** Standing at a metre with a full bag, out of the cab. */
  function carrying(at: number, bag: readonly ItemKind[]): GameState {
    const base = begin(YARD, ROUTE_STEP * 4);
    return {
      ...base,
      driver: -1,
      people: [
        { ...one(base), inside: false, at, carrying: bag, holding: bag[0] },
      ],
    };
  }

  /** What ends up in the hand after a frame of standing there. */
  function inHand(state: GameState): ItemKind | null {
    return one(step(state, YARD, [IDLE_INPUT], FRAME)).holding;
  }

  const ALL: readonly ItemKind[] = [REMOTE, "hammer", "tyres", "can", "spray"];

  it("reaches for the spray in front of the bear", () => {
    expect(inHand(carrying(ROUTE_STEP * 19, ALL))).toBe("spray");
  });

  it("reaches for the hammer at a wrecked motorhome", () => {
    const wrecked = { ...carrying(ROUTE_STEP * 4, ALL), damaged: true };
    expect(inHand(wrecked)).toBe("hammer");
  });

  it("reaches for the remote once the rope is on", () => {
    // Not at the tree: the remote does nothing until there is a rope on
    // something for it to wind.
    const atTree = carrying(YARD.anchors[0].x, ALL);
    expect(inHand(atTree)).toBe(null);
    expect(inHand({ ...atTree, hooked: 0, rope: ROUTE_STEP })).toBe(REMOTE);
  });

  it("leaves the hand alone where nothing is wanted", () => {
    // Halfway between everything, with the hammer chosen by hand: it stays.
    const wandering = carrying(ROUTE_STEP * 8, ALL);
    const chosen: GameState = {
      ...wandering,
      people: [{ ...one(wandering), holding: "hammer" }],
    };
    expect(inHand(chosen)).toBe("hammer");
  });

  it("never conjures what is not in the bag", () => {
    // Standing in front of the bear with no spray is still standing in front
    // of the bear, and the hand stays as empty as the bag is useless.
    const empty = carrying(ROUTE_STEP * 19, [REMOTE]);
    expect(inHand(empty)).toBe(null);
  });

  it("takes the bear over the motorhome parked beside you", () => {
    // Both jobs are within reach at once here. The bear is the one that
    // arrives on its own.
    const cornered: GameState = {
      ...carrying(ROUTE_STEP * 19, ALL),
      rv: { x: ROUTE_STEP * 19, v: 0 },
      damaged: true,
    };
    expect(inHand(cornered)).toBe("spray");
  });

  it("reaches for nothing from inside the cab", () => {
    // Sitting in a wrecked motorhome with the hammer in the bag: none of it
    // can be used from the seat, so the hand has no business changing. The
    // list on screen would otherwise show a tool nobody could swing.
    const seated: GameState = {
      ...carrying(ROUTE_STEP * 4, ALL),
      damaged: true,
      driver: 0,
      people: [
        {
          ...one(carrying(ROUTE_STEP * 4, ALL)),
          inside: true,
          holding: "can",
        },
      ],
    };
    expect(inHand(seated)).toBe("can");
  });
});

describe("the bridge", () => {
  /** Level ground with a stretch of old timber in the middle of it. */
  const GORGE: Route = {
    name: "Brücke",
    heights: Array.from({ length: 40 }, () => 0),
    anchors: [],
    pits: [],
    items: [],
    bear: null,
    fog: null,
    bridges: [{ from: ROUTE_STEP * 10, to: ROUTE_STEP * 16 }],
    chasms: [],
    fellTree: null,
    sections: [],
  };

  /** The middle of the timber, and firm ground well short of it. */
  const ON_IT = ROUTE_STEP * 13;
  const SHORT_OF_IT = ROUTE_STEP * 4;

  /** A world with that many people sitting in the motorhome. */
  function riding(at: number, aboard: number): GameState {
    const base = begin(GORGE, at);
    const seat = { ...one(base), at, inside: true };
    const foot = { ...one(base), at, inside: false };
    return {
      ...base,
      rv: { x: at, v: 0 },
      people: aboard > 1 ? [seat, seat] : [seat, foot],
      driver: 0,
    };
  }

  /** One frame of standing there. */
  function tick(state: GameState): GameState {
    return step(state, GORGE, [IDLE_INPUT, IDLE_INPUT], FRAME);
  }

  it("carries the motorhome with one of them in it", () => {
    // Alone the question never comes up at all, which is the point: this is
    // the one thing on the map that asks something of the pair.
    expect(tick(riding(ON_IT, 1)).phase).toBe("driving");
    const across = hold(
      riding(SHORT_OF_IT, 1),
      GORGE,
      { drive: 1, shift: 3 },
      12,
    );
    expect(across.rv.x).toBeGreaterThan(GORGE.bridges[0].to);
    expect(across.phase).toBe("driving");
  });

  it("gives way under the two of them", () => {
    expect(tick(riding(ON_IT, 2)).phase).toBe("fallen");
  });

  it("holds firm ground however many are aboard", () => {
    // It is the timber that is old, not the road.
    expect(tick(riding(SHORT_OF_IT, 2)).phase).toBe("driving");
  });

  it("gives way the moment the wheels are on it", () => {
    const rolling = hold(
      riding(SHORT_OF_IT, 2),
      GORGE,
      { drive: 1, shift: 3 },
      12,
    );
    expect(rolling.phase).toBe("fallen");
    // Where it went through, not where it would have got to: a drive that is
    // over stops, so the vehicle is standing on the first planks it touched.
    expect(rolling.rv.x).toBeGreaterThanOrEqual(GORGE.bridges[0].from);
    expect(rolling.rv.x).toBeLessThan(GORGE.bridges[0].from + ROUTE_STEP);
  });

  it("stops the world with it", () => {
    // The same as arriving: nothing moves afterwards, so nobody drives out of
    // a bridge that has just gone from under them.
    const gone = tick(riding(ON_IT, 2));
    const later = hold(gone, GORGE, { drive: 1, shift: 3 }, 3);
    expect(later.rv.x).toBe(gone.rv.x);
    expect(later.time).toBe(gone.time);
  });

  it("counts who is aboard, not who is on it", () => {
    // Somebody walking over beside the motorhome is on their own two feet, and
    // the plank under a pair of boots is not the plank under three tonnes.
    const walking = riding(ON_IT, 1);
    expect(walking.people[1].inside).toBe(false);
    expect(walking.people[1].at).toBe(ON_IT);
    expect(tick(walking).phase).toBe("driving");
  });

  it("is the end of the drive, not a dent in it", () => {
    // Like the bear and the fog: the section starts again, it does not carry
    // on with a broken motorhome.
    const gone = tick(riding(ON_IT, 2));
    expect(hold(gone, GORGE, { drive: 1, shift: 3 }, 3).phase).toBe("fallen");
  });
});

describe("the chasm and the tree over it", () => {
  /** Level ground with a gap in it, a tree past it and an axe beside that. */
  const CHASM: Route = {
    name: "Abgrund",
    heights: Array.from({ length: 40 }, () => 0),
    anchors: [],
    pits: [],
    items: [{ at: ROUTE_STEP * 14, kind: "axe" }],
    bear: null,
    fog: null,
    bridges: [],
    chasms: [{ from: ROUTE_STEP * 12 - 1.95, to: ROUTE_STEP * 12 + 1.95 }],
    fellTree: ROUTE_STEP * 13,
    sections: [],
  };
  const GAP = CHASM.chasms[0];

  /** Parked with the front of the roof at the near lip, everybody outside. */
  function parked(): GameState {
    const at = GAP.from - ROOF_HALF;
    const base = begin(CHASM, at);
    return {
      ...base,
      rv: { x: at, v: 0 },
      driver: -1,
      people: [{ ...one(base), inside: false, at }],
    };
  }

  /** Walks to a metre on the ground, then runs the input for a while. */
  function walkTo(state: GameState, where: number): GameState {
    let now = state;
    for (let frame = 0; frame < 30 / FRAME; frame++) {
      if (Math.abs(one(now).at - where) < WALK_SPEED * FRAME) {
        break;
      }
      const way = where > one(now).at ? 1 : -1;
      now = step(now, CHASM, [{ ...IDLE_INPUT, drive: way }], FRAME);
    }
    return now;
  }

  /** A leap: hold the direction, press jump twice, then ride it out. */
  function leap(state: GameState): GameState {
    let now = step(
      state,
      CHASM,
      [{ ...IDLE_INPUT, drive: 1, jump: true }],
      FRAME,
    );
    now = step(now, CHASM, [{ ...IDLE_INPUT, drive: 1, jump: true }], FRAME);
    for (let frame = 0; frame < 3 / FRAME; frame++) {
      now = step(now, CHASM, [{ ...IDLE_INPUT, drive: 1 }], FRAME);
      if (one(now).lift <= 0) {
        break;
      }
    }
    return now;
  }

  it("swallows a motorhome driven into it", () => {
    const rolling = hold(
      { ...parked(), driver: 0, people: [{ ...one(parked()), inside: true }] },
      CHASM,
      { drive: 1, shift: 3 },
      6,
    );
    expect(rolling.phase).toBe("plunged");
  });

  it("stops anybody on foot at the lip rather than letting them walk in", () => {
    // Stepping off a cliff is not a decision anybody makes on purpose, so the
    // game does not offer it.
    const walked = hold(parked(), CHASM, { drive: 1 }, 10);
    expect(one(walked).at).toBeLessThan(GAP.from);
    expect(walked.phase).toBe("driving");
  });

  it("cannot be leapt from the ground, however hard anybody runs", () => {
    // The whole reason the roof is standable. Running makes no difference:
    // in the air nobody runs.
    const atTheLip = walkTo(parked(), GAP.from - CHASM_STOP);
    expect(one(leap(atTheLip)).at).toBeLessThan(GAP.to);
    const sprinting = step(
      atTheLip,
      CHASM,
      [{ ...IDLE_INPUT, drive: 1, sprint: true, jump: true }],
      FRAME,
    );
    expect(one(leap(sprinting)).at).toBeLessThan(GAP.to);
  });

  it("is cleared by a leap off the roof", () => {
    const climbed = climbUp(parked());
    expect(one(climbed).lift).toBe(ROOF_HIGH);
    const over = leap(walkOnRoof(climbed));
    expect(one(over).at).toBeGreaterThan(GAP.to);
    expect(over.phase).toBe("driving");
  });

  /** Standing at the ladder and going up it. */
  function climbUp(state: GameState): GameState {
    const ladder = walkTo(state, state.rv.x - ROOF_HALF);
    return step(ladder, CHASM, [{ ...IDLE_INPUT, jump: true }], FRAME);
  }

  /** Along the roof to its front edge. */
  function walkOnRoof(state: GameState): GameState {
    let now = state;
    for (let frame = 0; frame < 5 / FRAME; frame++) {
      if (one(now).at >= state.rv.x + ROOF_HALF - 0.2) {
        break;
      }
      now = step(now, CHASM, [{ ...IDLE_INPUT, drive: 1 }], FRAME);
    }
    return now;
  }

  it("takes anybody who lands in it", () => {
    // Walking in is not offered; jumping in is a decision, and the gap does
    // not care which of the two it was. A leap begun too far back is exactly
    // that decision: off the ladder without walking to the front edge first.
    const short = leap(climbUp(parked()));
    expect(one(short).at).toBeGreaterThan(GAP.from);
    expect(one(short).at).toBeLessThan(GAP.to);
    expect(short.phase).toBe("plunged");
  });

  it("is closed for good by felling the tree", () => {
    const over = leap(walkOnRoof(climbUp(parked())));
    const withAxe = fetch(over, CHASM, CHASM.items[0].at);
    expect(one(withAxe).carrying).toContain("axe");

    const atTree = walkTo(withAxe, CHASM.fellTree as number);
    expect(one(atTree).holding).toBe("axe");
    const chopped = hold(atTree, CHASM, { work: true }, FELL_SECONDS + 0.5);
    expect(chopped.felled).toBe(true);

    // And then it is road: the motorhome drives over where the gap was.
    const aboard = {
      ...chopped,
      driver: 0,
      people: [{ ...one(chopped), inside: true, at: chopped.rv.x }],
    };
    const across = hold(aboard, CHASM, { drive: 1, shift: 3 }, 8);
    expect(across.phase).toBe("driving");
    expect(across.rv.x).toBeGreaterThan(GAP.to);
  });

  it("needs the axe: bare hands do nothing to it", () => {
    const over = leap(walkOnRoof(climbUp(parked())));
    const atTree = walkTo(over, CHASM.fellTree as number);
    expect(one(atTree).carrying).not.toContain("axe");
    const tried = hold(atTree, CHASM, { work: true }, FELL_SECONDS * 2);
    expect(tried.felled).toBe(false);
  });
});

describe("the roof of the motorhome", () => {
  /** Level ground, nothing on it, the motorhome in the middle. */
  const YARD: Route = {
    name: "Hof",
    heights: Array.from({ length: 40 }, () => 0),
    anchors: [],
    pits: [],
    items: [],
    bear: null,
    fog: null,
    bridges: [],
    chasms: [],
    fellTree: null,
    sections: [],
  };
  const PARKED = ROUTE_STEP * 8;

  /** Standing on the ground at a metre, out of the cab. */
  function afoot(at: number): GameState {
    const base = begin(YARD, PARKED);
    return {
      ...base,
      driver: -1,
      people: [{ ...one(base), inside: false, at }],
    };
  }

  /** One frame with that input. */
  function tick(state: GameState, input: Partial<Input>): GameState {
    return step(state, YARD, [{ ...IDLE_INPUT, ...input }], FRAME);
  }

  it("is climbed from the ladder at the back", () => {
    const ladder = afoot(PARKED - ROOF_HALF);
    expect(tick(ladder, { jump: true }).people[0].lift).toBe(ROOF_HIGH);
  });

  it("is not reached by jumping anywhere else", () => {
    // Nobody jumps three and a half metres, and a roof that caught every jump
    // taken near the vehicle would put people up there by accident.
    const beside = afoot(PARKED);
    const jumped = tick(beside, { jump: true });
    expect(jumped.people[0].lift).toBeLessThan(ROOF_HIGH);
    let now = jumped;
    for (let frame = 0; frame < 2 / FRAME; frame++) {
      now = tick(now, {});
    }
    expect(one(now).lift).toBe(0);
  });

  it("carries somebody along it", () => {
    const up = tick(afoot(PARKED - ROOF_HALF), { jump: true });
    const along = hold(up, YARD, { drive: 1 }, 1);
    expect(one(along).lift).toBe(ROOF_HIGH);
    expect(one(along).at).toBeGreaterThan(PARKED - ROOF_HALF);
  });

  it("drops whoever walks off the end of it", () => {
    const up = tick(afoot(PARKED - ROOF_HALF), { jump: true });
    const off = hold(up, YARD, { drive: 1 }, 4);
    expect(one(off).at).toBeGreaterThan(PARKED + ROOF_HALF);
    expect(one(off).lift).toBe(0);
  });

  it("moves out from under anybody when it drives away", () => {
    // The roof is the vehicle's, not a platform bolted to the map.
    const up = tick(afoot(PARKED - ROOF_HALF), { jump: true });
    const aboard: GameState = {
      ...up,
      driver: 0,
      people: [{ ...one(up), inside: true }, one(up)],
    };
    const driven = hold(aboard, YARD, { drive: 1, shift: 3 }, 4);
    expect(driven.rv.x).toBeGreaterThan(PARKED);
    expect(driven.people[1].lift).toBe(0);
  });
});

describe("the door", () => {
  /** Flat ground with room to get up to speed. */
  const ROAD: Route = {
    name: "Strasse",
    heights: Array.from({ length: 60 }, () => 0),
    anchors: [],
    pits: [],
    items: [],
    bear: null,
    fog: null,
    bridges: [],
    chasms: [],
    fellTree: null,
    sections: [],
  };

  /** Barely more than a crawl, in metres per second. */
  const CRAWLING = 2;

  /** At the wheel and rolling along. */
  function rolling(): GameState {
    return hold(begin(ROAD, ROUTE_STEP * 2), ROAD, { drive: 1, shift: 3 }, 6);
  }

  /** One press of the door key. */
  function press(state: GameState): GameState {
    return step(state, ROAD, [{ ...IDLE_INPUT, door: true }], FRAME);
  }

  it("stays shut while the motorhome is moving", () => {
    // Nobody steps out of a moving vehicle, and a door that worked at speed
    // made the handbrake optional.
    const away = rolling();
    expect(Math.abs(away.rv.v)).toBeGreaterThan(STOP_SPEED);
    expect(one(press(away)).inside).toBe(true);
  });

  it("stays shut at a walking pace too", () => {
    // Not only at speed: "it stands" means it stands, and a door that opened
    // at anything under a dash would be a door that opened while rolling
    // backwards down a hill.
    let creeping = rolling();
    for (let frame = 0; frame < 30 / FRAME; frame++) {
      if (Math.abs(creeping.rv.v) < CRAWLING) {
        break;
      }
      creeping = step(creeping, ROAD, [{ ...IDLE_INPUT, brake: true }], FRAME);
    }
    expect(Math.abs(creeping.rv.v)).toBeGreaterThan(STOP_SPEED);
    expect(Math.abs(creeping.rv.v)).toBeLessThan(CRAWLING);
    expect(one(press(creeping)).inside).toBe(true);
  });

  it("stays shut while it rolls backwards", () => {
    const back = hold(begin(ROAD, ROUTE_STEP * 4), ROAD, { drive: -1 }, 4);
    expect(back.rv.v).toBeLessThan(-STOP_SPEED);
    expect(one(press(back)).inside).toBe(true);
  });

  it("opens the moment it stands", () => {
    const stopped = hold(rolling(), ROAD, { brake: true }, 3);
    expect(Math.abs(stopped.rv.v)).toBeLessThanOrEqual(STOP_SPEED);
    expect(one(press(stopped)).inside).toBe(false);
  });

  it("counts a crawl as standing", () => {
    // "Standing" is the same barely-moving the pedals already use, so there
    // is one idea of it in the game rather than two.
    const away = rolling();
    let creeping = away;
    for (let frame = 0; frame < 30 / FRAME; frame++) {
      if (Math.abs(creeping.rv.v) <= STOP_SPEED) {
        break;
      }
      creeping = step(creeping, ROAD, [{ ...IDLE_INPUT, brake: true }], FRAME);
    }
    expect(one(press(creeping)).inside).toBe(false);
  });

  it("shuts anybody out of a motorhome that is rolling past", () => {
    // The same rule the other way about: no hopping aboard at speed.
    const away = rolling();
    const beside: GameState = {
      ...away,
      driver: -1,
      people: [{ ...one(away), inside: false, at: away.rv.x }],
    };
    expect(one(press(beside)).inside).toBe(false);
  });

  it("stops offering the way in while it rolls", () => {
    // The screen says "get in (E)" off this, and offering a key that does
    // nothing is worse than saying nothing at all.
    const away = rolling();
    const beside: GameState = {
      ...away,
      driver: -1,
      people: [{ ...one(away), inside: false, at: away.rv.x }],
    };
    expect(atVehicle(one(beside), beside)).toBe(false);
    const stopped = hold(beside, ROAD, {}, 3);
    expect(atVehicle(one(stopped), stopped)).toBe(true);
  });
});

describe("the winch remote", () => {
  /** Flat ground with a tree the rope reaches. */
  const TREE: Route = {
    name: "Baum",
    heights: Array.from({ length: 20 }, () => 0),
    anchors: [{ x: ROUTE_STEP * 5, y: 0 }],
    pits: [],
    items: [],
    bear: null,
    fog: null,
    bridges: [],
    chasms: [],
    fellTree: null,
    sections: [],
  };

  it("starts in the bag and not in the hand", () => {
    // It belongs to the motorhome, so it is always there - but a tool held
    // for the whole drive in case it might be needed is not carrying, it is
    // clutter.
    const fresh = startAt(0);
    expect(fresh.people[0].carrying).toContain(REMOTE);
    expect(fresh.people[0].holding).toBe(null);
  });

  it("stays in the bag while you walk up to the tree", () => {
    const atTree = standingAt(begin(TREE), TREE, TREE.anchors[0].x);
    expect(atTree.hooked).toBe(-1);
    expect(one(atTree).holding).toBe(null);
  });

  it("comes to hand the moment the rope is on", () => {
    const atTree = standingAt(begin(TREE), TREE, TREE.anchors[0].x);
    const roped = step(atTree, TREE, [{ ...IDLE_INPUT, hook: true }], FRAME);
    expect(roped.hooked).toBe(0);
    expect(one(roped).holding).toBe(REMOTE);
    // And it works from there, which is the whole point of holding it.
    expect(hold(roped, TREE, { wind: 1 }, 2).rope).toBeLessThan(roped.rope);
  });

  it("goes back in the bag when the rope comes off", () => {
    const atTree = standingAt(begin(TREE), TREE, TREE.anchors[0].x);
    const roped = step(atTree, TREE, [{ ...IDLE_INPUT, hook: true }], FRAME);
    const loose = step(roped, TREE, [{ ...IDLE_INPUT, hook: true }], FRAME);
    expect(loose.hooked).toBe(-1);
    expect(one(loose).holding).toBe(null);
  });

  it("will not be carried about even if it is asked for", () => {
    // Taking it out by hand where it does nothing is not a choice worth
    // honouring - it is the clutter this rule exists to prevent.
    const out = steppedOut(begin(TREE), TREE);
    const picked = step(out, TREE, [{ ...IDLE_INPUT, pick: 0 }], FRAME);
    expect(one(picked).holding).toBe(null);
  });
});
