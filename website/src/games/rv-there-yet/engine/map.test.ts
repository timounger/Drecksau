/**
 * Tests that the map can actually be driven - every section of it.
 *
 * @module
 * @remarks
 * A map is two lines of text, and a misplaced anchor is invisible to the eye:
 * the wall is simply unclimbable and the drive ends there. So the map is not
 * read, it is **driven** - by a small autopilot that does exactly what a player
 * does: give it throttle, and when the wheels give up, get out, walk the rope
 * to the tree, hook it, walk back, get in and wind.
 *
 * And not only from the start. Every section is a place somebody will begin
 * their evening at, so every section between two sections is driven on its
 * own. A section that only works with the run-up from the one before it would
 * strand whoever saved there.
 */
import { describe, expect, it } from "vitest";
import { reachableAnchor, ropeCandidate, step } from "./engine";
import {
  SECTIONS,
  SECTION_COUNT,
  sectionAt,
  sectionStep,
  MAP,
  parseMap,
} from "./map";
import { startAt, theMap } from "./setup";
import { heightAt, routeLength, slopeAt, snowShare } from "./terrain";
import {
  BEAR_REACH,
  ENTER_REACH,
  IDLE_INPUT,
  NO_GRIP_SLOPE,
  PICKUP_REACH,
  TOP_GEAR,
  WINCH_RANGE,
  ROUTE_STEP,
  SPRAY_REACH,
  type GameState,
  type Input,
  type Route,
  type Person,
} from "./types";

/** The only person in these tests - a state carries a list of them now. */
function one(state: GameState): Person {
  return state.people[0];
}

/** One simulated frame, in seconds - fine enough to be stable. */
const FRAME = 0.02;

/** How long the autopilot is given per section before it counts as a dead end. */
const PATIENCE_S = 900;

/** Below this speed the autopilot considers itself stuck and fetches the rope. */
const STUCK_SPEED = 0.5;

/** What the autopilot does in one frame. */
function plan(state: GameState): Input {
  const route = theMap();
  const target = ropeCandidate(state, route);
  const stuck = state.rv.v < STUCK_SPEED;

  // A wrecked motorhome is mended before anything else: it will not drive
  // until it is, and the hammer is lying somewhere down the road.
  if (state.damaged) {
    return errand(state, route, "hammer");
  }
  // A bear does not care how much throttle there is - and it does not care
  // that the can is in your pocket either. Fetch it, then use it.
  if (blockedByBear(state, route)) {
    return one(state).carrying.includes("spray")
      ? scareTheBear(state)
      : errand(state, route, "spray");
  }
  // Stuck on a wall with nothing to tie a rope to: that wall wants the other
  // tyres. The check is the **slope**, not merely standing still - every
  // section begins at a standstill on level ground.
  const onAWall = Math.abs(slopeAt(theMap(), state.rv.x)) >= NO_GRIP_SLOPE;
  if (
    stuck &&
    onAWall &&
    target === -1 &&
    !state.tyres &&
    has(route, "tyres")
  ) {
    return errand(state, route, "tyres");
  }

  if (one(state).inside) {
    // With the rope on, the vehicle is worked from outside - so get out.
    if (state.hooked !== -1) {
      return { ...IDLE_INPUT, door: true };
    }
    if (stuck && target !== -1) {
      return { ...IDLE_INPUT, door: true };
    }
    // First gear for anything that rises, third for getting along.
    const climbing = slopeAt(theMap(), state.rv.x) > 0.15;
    return { ...IDLE_INPUT, drive: 1, shift: climbing ? 1 : 3 };
  }
  if (state.hooked === -1) {
    if (reachableAnchor(one(state), state, route) !== -1) {
      return { ...IDLE_INPUT, hook: true };
    }
    if (target === -1) {
      // Nothing to fetch: back behind the wheel, walking over if need be.
      return Math.abs(one(state).at - state.rv.x) <= ENTER_REACH
        ? { ...IDLE_INPUT, door: true }
        : { ...IDLE_INPUT, drive: towards(one(state).at, state.rv.x) };
    }
    return {
      ...IDLE_INPUT,
      drive: towards(one(state).at, route.anchors[target].x),
    };
  }
  // Rope on: stand at the tree and reel it in with the remote.
  return { ...IDLE_INPUT, wind: 1 };
}

/** The same world, but behind the wheel - for tests about driving. */
function seated(state: GameState): GameState {
  return step(state, theMap(), [{ ...IDLE_INPUT, door: true }], FRAME);
}

/** Which field the ditch's floor lies in - the low point of the second section. */
function ditchField(): number {
  const from = 55;
  const to = 80;
  const around = MAP.heights.slice(from, to);
  return from + around.indexOf(Math.min(...around));
}

/**
 * Whether a bear is standing between the motorhome and the rest of the map.
 *
 * @param state - the world as it is
 * @param route - the map
 * @returns true while the way is barred
 */
function blockedByBear(state: GameState, route: Route): boolean {
  if (route.bear === null || state.bear === null || state.bear.gone) {
    return false;
  }
  return state.rv.x > route.bear - BEAR_REACH - ROUTE_STEP;
}

/** Whether the map has such a thing lying about at all. */
function has(route: Route, kind: string): boolean {
  return route.items.some((item) => item.kind === kind);
}

/**
 * The errand of fetching one thing and doing something with it.
 *
 * @param state - the world as it is
 * @param route - the map
 * @param kind - what to go and get
 * @returns the input for this frame
 * @remarks
 * Out of the cab, walk to the thing, walk back, and then either hold the key
 * (hammer, tyres) or simply get back in (spray - carrying it is enough).
 * Exactly the errand a player runs, which is the point of making the autopilot
 * run it too.
 */
function errand(state: GameState, route: Route, kind: string): Input {
  if (one(state).inside) {
    return { ...IDLE_INPUT, door: true };
  }
  const item = route.items.find((each) => each.kind === kind);
  if (!one(state).carrying.includes(kind as never) && item !== undefined) {
    // Standing at it is not enough: things are picked up with the key, the
    // same way a player picks them up.
    return Math.abs(one(state).at - item.at) <= PICKUP_REACH
      ? { ...IDLE_INPUT, take: true }
      : { ...IDLE_INPUT, drive: towards(one(state).at, item.at) };
  }
  if (Math.abs(one(state).at - state.rv.x) > ENTER_REACH) {
    return { ...IDLE_INPUT, drive: towards(one(state).at, state.rv.x) };
  }
  return { ...IDLE_INPUT, work: true };
}

/**
 * Walking up to the bear and holding the can on it.
 *
 * @param state - the world as it is
 * @returns the input for this frame
 * @remarks
 * Carrying the spray does nothing at all now: the bear has to be driven off,
 * and that means standing close enough and holding the key while it comes at
 * you. Exactly the nerve test a player faces, which is why the autopilot faces
 * it too.
 */
function scareTheBear(state: GameState): Input {
  const bear = state.bear;
  if (bear === null || one(state).inside) {
    return { ...IDLE_INPUT, door: true };
  }
  const gap = Math.abs(one(state).at - bear.at);
  return gap <= SPRAY_REACH - 1
    ? { ...IDLE_INPUT, work: true }
    : { ...IDLE_INPUT, drive: towards(one(state).at, bear.at) };
}

/** Which way to walk to get to a place. */
function towards(from: number, to: number): number {
  return to > from ? 1 : -1;
}

/** Drives from a section until the given place is behind it, or time runs out. */
function driveFrom(section: number, until: number) {
  let state = startAt(section);
  const route = theMap();
  let hooks = 0;
  let lowestFuel = 1;
  for (let frame = 0; frame < PATIENCE_S / FRAME; frame++) {
    const before = state.hooked;
    state = step(state, route, [plan(state)], FRAME);
    if (before === -1 && state.hooked !== -1) {
      hooks++;
    }
    lowestFuel = Math.min(lowestFuel, state.fuel);
    if (state.rv.x >= until || state.phase === "arrived") {
      break;
    }
  }
  return { state, hooks, lowestFuel };
}

describe("the map", () => {
  it("can be driven from the start to the flag", () => {
    expect(driveFrom(0, Number.POSITIVE_INFINITY).state.phase).toBe("arrived");
  });

  it("teaches the gearbox on the first climb", () => {
    // The lesson of the opening stretch, and the honest version of it: with a
    // run-up from the plateau a high gear crawls over the pass, but the moment
    // the motorhome stands still on the slope, only a low gear moves it again.
    // A player who stops - to look, to think, to get out - learns it there.
    const fromRest = (gear: number) => {
      const uphill = SECTIONS[1] - ROUTE_STEP * 12;
      let state = seated(startAt(0));
      state = {
        ...state,
        rv: { x: uphill, v: 0 },
        people: [{ ...state.people[0], at: uphill, inside: true }],
        driver: 0,
      };
      for (let frame = 0; frame < 40 / FRAME; frame++) {
        state = step(
          state,
          theMap(),
          [{ ...IDLE_INPUT, drive: 1, shift: gear }],
          FRAME,
        );
      }
      return state.rv.x - uphill;
    };
    // The top gear does not pull its own weight up the slope: it inches
    // forwards to the next steep bit and stops there.
    expect(fromRest(TOP_GEAR)).toBeLessThan(ROUTE_STEP);
    // First gear climbs the rest of the section in the same time.
    expect(fromRest(1)).toBeGreaterThan(ROUTE_STEP * 12);
  });

  it("lets a run-up over the first pass, slowly", () => {
    // Holding the throttle from the plateau, even the top gear crawls over -
    // the flat valley lets it reach the gear's own top speed, and that buys
    // more climb than this pass is long. Worth knowing before somebody moves
    // the pass and wonders why the section changed character.
    const climb = (gear: number) => {
      let state = seated(startAt(0));
      for (let frame = 0; frame < 90 / FRAME; frame++) {
        state = step(
          state,
          theMap(),
          [{ ...IDLE_INPUT, drive: 1, shift: gear }],
          FRAME,
        );
      }
      return state.rv.x;
    };
    expect(climb(TOP_GEAR)).toBeGreaterThan(SECTIONS[1]);
  });

  it("cannot be won on throttle alone", () => {
    // Without the winch the drive must end at a wall - otherwise the trees are
    // decoration and the game has no subject. Behind the wheel, because on
    // foot the thing that stops you is the bear, and that is another lesson.
    let state = seated(startAt(0));
    for (let frame = 0; frame < PATIENCE_S / FRAME; frame++) {
      // First gear pulls hardest - if even that cannot do it, none can.
      state = step(
        state,
        theMap(),
        [{ ...IDLE_INPUT, drive: 1, shift: 1 }],
        FRAME,
      );
    }
    expect(state.phase).not.toBe("arrived");
  });

  it("leans on the rope more than once", () => {
    expect(driveFrom(0, Number.POSITIVE_INFINITY).hooks).toBeGreaterThan(1);
  });

  it.each(SECTIONS.map((_at, index) => [index + 1, index] as const))(
    "section %i can be driven on its own",
    (_number, index) => {
      // Every section is somewhere a player will start their evening - the
      // last one included: it ends at the flag rather than at another mark,
      // and a player who saved there must still be able to finish the map.
      const target = SECTIONS[index + 1] ?? routeLength(theMap());
      const { state } = driveFrom(index, target);
      expect(state.rv.x).toBeGreaterThanOrEqual(target);
    },
  );

  it("can be driven from end to end on one tank", () => {
    // The tank is sized against this drive rather than guessed. If a change to
    // the map, the gearing or the burn rate ever makes the route longer than
    // the fuel, that is a stranded player - and this is where it shows up.
    const { state } = driveFrom(0, Number.POSITIVE_INFINITY);
    expect(state.phase).toBe("arrived");
    expect(state.fuel).toBeGreaterThan(0.3);
  });

  it("has fuel to spare in every section", () => {
    // A section that only just works on a full tank is one a player who wound
    // a little too eagerly can no longer finish.
    for (const [index] of SECTIONS.entries()) {
      if (index < SECTION_COUNT - 1) {
        expect(
          driveFrom(index, SECTIONS[index + 1]).lowestFuel,
        ).toBeGreaterThan(0.15);
      }
    }
  });

  it("stands every section on level ground", () => {
    // Start on a slope and the drive begins by sliding backwards.
    for (const at of SECTIONS) {
      expect(Math.abs(slopeAt(MAP, at))).toBeLessThan(0.05);
      expect(at % ROUTE_STEP).toBe(0);
      expect(at).toBeLessThan(routeLength(MAP));
    }
  });

  it("starts near the start and keeps the sections in order", () => {
    // Not at metre zero: the drive begins on a plateau with a little ground
    // behind the motorhome, so there is somewhere to step out to.
    expect(SECTIONS[0]).toBeGreaterThan(0);
    expect(SECTIONS[0]).toBeLessThan(ROUTE_STEP * 5);
    for (let index = 1; index < SECTION_COUNT; index++) {
      expect(SECTIONS[index]).toBeGreaterThan(SECTIONS[index - 1]);
    }
  });

  it("begins high up, under snow", () => {
    // The drive starts on a plateau: high enough to be white, and level enough
    // to stand on.
    const start = heightAt(MAP, SECTIONS[0]);
    expect(snowShare(start)).toBe(1);
    expect(Math.abs(slopeAt(MAP, SECTIONS[0]))).toBeLessThan(0.05);
  });

  it("comes down out of the snow into bare ground", () => {
    // Otherwise it is a snow game rather than a drive that begins in the snow.
    const bare = SECTIONS.filter((at) => snowShare(heightAt(MAP, at)) === 0);
    expect(bare.length).toBeGreaterThan(SECTIONS.length / 2);
  });

  it("digs a ditch nobody drives out of, with a tree in reach of it", () => {
    // The point of the ditch: the wheels cannot climb out, so the winch has
    // to, and for that a tree has to stand within a rope's length of the hole.
    const field = ditchField();
    const floor = field * ROUTE_STEP;
    // Halfway up the wall, not at a height point: the smoothing makes every
    // height point level, so measuring on one would prove nothing.
    const wall = slopeAt(MAP, floor - ROUTE_STEP / 2);
    expect(Math.abs(wall)).toBeGreaterThan(NO_GRIP_SLOPE * 2);

    const near = MAP.anchors.filter(
      (anchor) => anchor.x > floor && anchor.x - floor < WINCH_RANGE,
    );
    expect(near.length).toBeGreaterThan(0);
  });

  it("has a wall the rope cannot help with", () => {
    // Section four: too steep for the tyres it starts on and nothing within a
    // rope's length of it. Without the off-road tyres the map stops there.
    const tyres = MAP.items.find((item) => item.kind === "tyres");
    expect(tyres).toBeDefined();
    const wall = MAP.heights.findIndex(
      (_height, field) =>
        field * ROUTE_STEP > (tyres?.at ?? 0) &&
        Math.abs(slopeAt(MAP, field * ROUTE_STEP + ROUTE_STEP / 2)) >=
          NO_GRIP_SLOPE,
    );
    expect(wall).toBeGreaterThan(0);
    const at = wall * ROUTE_STEP;
    const rope = MAP.anchors.filter(
      (anchor) => Math.abs(anchor.x - at) <= WINCH_RANGE,
    );
    expect(rope).toHaveLength(0);
  });

  it("marks the ditch as the thing that wrecks a motorhome", () => {
    // Without the mark the hole is just scenery: you drive through it, get
    // stuck, winch out and never learn to look at it first.
    expect(MAP.pits).toHaveLength(1);
    const pit = MAP.pits[0];
    const floor = ditchField() * ROUTE_STEP;
    expect(pit.from).toBeLessThanOrEqual(floor);
    expect(pit.to).toBeGreaterThanOrEqual(floor);
  });

  it("leaves the hammer lying past the ditch", () => {
    // Before it, and the wreck would be behind you when you pick it up.
    const hammer = MAP.items.find((item) => item.kind === "hammer");
    expect(hammer).toBeDefined();
    expect(hammer?.at ?? 0).toBeGreaterThan(MAP.pits[0].to);
  });

  it("puts the tyres and the spray down before they are needed", () => {
    // A thing you find after the obstacle it is for is a thing you find twice.
    const tyres = MAP.items.find((item) => item.kind === "tyres");
    const spray = MAP.items.find((item) => item.kind === "spray");
    expect(tyres).toBeDefined();
    expect(spray).toBeDefined();
    expect(MAP.bear).not.toBeNull();
    expect(spray?.at ?? 0).toBeLessThan(MAP.bear ?? 0);
  });

  it("stands every tree on the ground it belongs to", () => {
    expect(MAP.anchors.length).toBeGreaterThan(0);
    for (const anchor of MAP.anchors) {
      expect(anchor.x % ROUTE_STEP).toBe(0);
      expect(anchor.x).toBeLessThan(routeLength(MAP));
    }
  });

  it("refuses a map it cannot read", () => {
    expect(() => parseMap("00?0", "    ")).toThrow();
    expect(() => parseMap("0", " ")).toThrow();
  });
});

describe("starting at a section", () => {
  it("puts the motorhome there and the driver beside it", () => {
    // Beside, not in: that there is a person here who gets in and out is the
    // first thing the game has to teach.
    const at = startAt(3);
    expect(at.rv.x).toBe(SECTIONS[3]);
    expect(one(at).inside).toBe(false);
    expect(one(at).at).not.toBe(at.rv.x);
    expect(Math.abs(one(at).at - at.rv.x)).toBeLessThanOrEqual(ENTER_REACH);
    expect(at.section).toBe(3);
    expect(at.rv.v).toBe(0);
  });

  it("starts within reach of the door, even at the very first metre", () => {
    // Behind the motorhome would be off the start of the map there, so the
    // driver has to be put in front of it instead.
    const first = startAt(0);
    expect(one(first).at).toBeGreaterThanOrEqual(0);
    expect(Math.abs(one(first).at - first.rv.x)).toBeLessThanOrEqual(
      ENTER_REACH,
    );
  });

  it("holds a section that does not exist inside the map", () => {
    // A number out of an older save, or one typed in by hand, must never put
    // the motorhome somewhere the map does not go.
    expect(startAt(-5).rv.x).toBe(SECTIONS[0]);
    expect(startAt(999).rv.x).toBe(SECTIONS[SECTION_COUNT - 1]);
    expect(startAt(999).section).toBe(SECTION_COUNT - 1);
  });

  it("notes the next section as it is driven past", () => {
    let state = seated(startAt(0));
    expect(state.section).toBe(0);
    for (let frame = 0; frame < PATIENCE_S / FRAME; frame++) {
      state = step(
        state,
        theMap(),
        [{ ...IDLE_INPUT, drive: 1, shift: 1 }],
        FRAME,
      );
      if (state.rv.x > SECTIONS[1]) {
        break;
      }
    }
    expect(state.section).toBe(1);
  });

  it("does not give a section back when rolling away from it", () => {
    // "Where I was", not "where I am" - sliding back down a slope must not
    // undo an evening's progress.
    let state = seated(startAt(1));
    for (let frame = 0; frame < 5 / FRAME; frame++) {
      state = step(state, theMap(), [{ ...IDLE_INPUT, drive: -1 }], FRAME);
    }
    expect(state.rv.x).toBeLessThan(SECTIONS[1]);
    expect(state.section).toBe(1);
  });
});

describe("finding a section", () => {
  it("names the one you last passed", () => {
    expect(sectionAt(0)).toBe(0);
    expect(sectionAt(SECTIONS[1] - 1)).toBe(0);
    expect(sectionAt(SECTIONS[1])).toBe(1);
    expect(sectionAt(SECTIONS[1] + 1)).toBe(1);
    expect(sectionAt(Number.POSITIVE_INFINITY)).toBe(SECTION_COUNT - 1);
  });

  it("steps on and back, and wraps around at both ends", () => {
    // From the first, "back" is the shortest way to the far end of the map.
    expect(sectionStep(0, 1)).toBe(1);
    expect(sectionStep(0, -1)).toBe(SECTION_COUNT - 1);
    expect(sectionStep(SECTION_COUNT - 1, 1)).toBe(0);
  });
});
