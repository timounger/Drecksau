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
 * And not only from the start. Every checkpoint is a place somebody will begin
 * their evening at, so every section between two checkpoints is driven on its
 * own. A section that only works with the run-up from the one before it would
 * strand whoever saved there.
 */
import { describe, expect, it } from "vitest";
import { reachableAnchor, ropeCandidate, step } from "./engine";
import {
  CHECKPOINTS,
  CHECKPOINT_COUNT,
  checkpointAt,
  checkpointStep,
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
  TOP_GEAR,
  WINCH_RANGE,
  ROUTE_STEP,
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
  // A bear does not care how much throttle there is.
  if (blockedByBear(state, route)) {
    return errand(state, route, "spray");
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
  if (route.bear === null || one(state).carrying.includes("spray")) {
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
    return { ...IDLE_INPUT, drive: towards(one(state).at, item.at) };
  }
  if (Math.abs(one(state).at - state.rv.x) > ENTER_REACH) {
    return { ...IDLE_INPUT, drive: towards(one(state).at, state.rv.x) };
  }
  return kind === "spray"
    ? { ...IDLE_INPUT, door: true }
    : { ...IDLE_INPUT, work: true };
}

/** Which way to walk to get to a place. */
function towards(from: number, to: number): number {
  return to > from ? 1 : -1;
}

/** Drives from a checkpoint until the given place is behind it, or time runs out. */
function driveFrom(checkpoint: number, until: number) {
  let state = startAt(checkpoint);
  const route = theMap();
  let hooks = 0;
  let lowestBattery = 1;
  for (let frame = 0; frame < PATIENCE_S / FRAME; frame++) {
    const before = state.hooked;
    state = step(state, route, [plan(state)], FRAME);
    if (before === -1 && state.hooked !== -1) {
      hooks++;
    }
    lowestBattery = Math.min(lowestBattery, state.battery);
    if (state.rv.x >= until || state.phase === "arrived") {
      break;
    }
  }
  return { state, hooks, lowestBattery };
}

describe("the map", () => {
  it("can be driven from the start to the flag", () => {
    expect(driveFrom(0, Number.POSITIVE_INFINITY).state.phase).toBe("arrived");
  });

  it("teaches the gearbox on the first climb", () => {
    // Down off the plateau, then up again: in a high gear the motorhome does
    // not make it, in a low one it does. That is the whole lesson of the
    // opening stretch, and it has to be true or the lesson is a lie.
    const climb = (gear: number) => {
      let state = seated(startAt(1));
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
    const top = CHECKPOINTS[2];
    expect(climb(TOP_GEAR)).toBeLessThan(top);
    expect(climb(1)).toBeGreaterThan(top);
  });

  it("cannot be won on throttle alone", () => {
    // Without the winch the drive must end at a wall - otherwise the trees are
    // decoration and the game has no subject.
    let state = startAt(0);
    for (let frame = 0; frame < PATIENCE_S / FRAME; frame++) {
      // First gear pulls hardest - if even that cannot do it, none can.
      state = step(
        state,
        theMap(),
        [{ ...IDLE_INPUT, drive: 1, shift: 1 }],
        FRAME,
      );
    }
    expect(state.phase).toBe("driving");
  });

  it("leans on the rope more than once", () => {
    expect(driveFrom(0, Number.POSITIVE_INFINITY).hooks).toBeGreaterThan(1);
  });

  it.each(
    CHECKPOINTS.map((_at, index) => [index + 1, index] as const).slice(0, -1),
  )("section %i can be driven on its own", (_number, index) => {
    // Every checkpoint is somewhere a player will start their evening.
    const { state } = driveFrom(index, CHECKPOINTS[index + 1]);
    expect(state.rv.x).toBeGreaterThanOrEqual(CHECKPOINTS[index + 1]);
  });

  it("has battery to spare in every section", () => {
    // A section that only just works on a full battery is one a player who
    // wound a little too eagerly can no longer finish.
    for (const [index] of CHECKPOINTS.entries()) {
      if (index < CHECKPOINT_COUNT - 1) {
        expect(
          driveFrom(index, CHECKPOINTS[index + 1]).lowestBattery,
        ).toBeGreaterThan(0.15);
      }
    }
  });

  it("stands every checkpoint on level ground", () => {
    // Start on a slope and the drive begins by sliding backwards.
    for (const at of CHECKPOINTS) {
      expect(Math.abs(slopeAt(MAP, at))).toBeLessThan(0.05);
      expect(at % ROUTE_STEP).toBe(0);
      expect(at).toBeLessThan(routeLength(MAP));
    }
  });

  it("starts near the start and keeps the checkpoints in order", () => {
    // Not at metre zero: the drive begins on a plateau with a little ground
    // behind the motorhome, so there is somewhere to step out to.
    expect(CHECKPOINTS[0]).toBeGreaterThan(0);
    expect(CHECKPOINTS[0]).toBeLessThan(ROUTE_STEP * 5);
    for (let index = 1; index < CHECKPOINT_COUNT; index++) {
      expect(CHECKPOINTS[index]).toBeGreaterThan(CHECKPOINTS[index - 1]);
    }
  });

  it("begins high up, under snow", () => {
    // The drive starts on a plateau: high enough to be white, and level enough
    // to stand on.
    const start = heightAt(MAP, CHECKPOINTS[0]);
    expect(snowShare(start)).toBe(1);
    expect(Math.abs(slopeAt(MAP, CHECKPOINTS[0]))).toBeLessThan(0.05);
  });

  it("comes down out of the snow into bare ground", () => {
    // Otherwise it is a snow game rather than a drive that begins in the snow.
    const bare = CHECKPOINTS.filter((at) => snowShare(heightAt(MAP, at)) === 0);
    expect(bare.length).toBeGreaterThan(CHECKPOINTS.length / 2);
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

describe("starting at a checkpoint", () => {
  it("puts the motorhome there and the driver beside it", () => {
    // Beside, not in: that there is a person here who gets in and out is the
    // first thing the game has to teach.
    const at = startAt(3);
    expect(at.rv.x).toBe(CHECKPOINTS[3]);
    expect(one(at).inside).toBe(false);
    expect(one(at).at).not.toBe(at.rv.x);
    expect(Math.abs(one(at).at - at.rv.x)).toBeLessThanOrEqual(ENTER_REACH);
    expect(at.checkpoint).toBe(3);
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

  it("holds a checkpoint that does not exist inside the map", () => {
    // A number out of an older save, or one typed in by hand, must never put
    // the motorhome somewhere the map does not go.
    expect(startAt(-5).rv.x).toBe(CHECKPOINTS[0]);
    expect(startAt(999).rv.x).toBe(CHECKPOINTS[CHECKPOINT_COUNT - 1]);
    expect(startAt(999).checkpoint).toBe(CHECKPOINT_COUNT - 1);
  });

  it("notes the next checkpoint as it is driven past", () => {
    let state = seated(startAt(0));
    expect(state.checkpoint).toBe(0);
    for (let frame = 0; frame < PATIENCE_S / FRAME; frame++) {
      state = step(
        state,
        theMap(),
        [{ ...IDLE_INPUT, drive: 1, shift: 1 }],
        FRAME,
      );
      if (state.rv.x > CHECKPOINTS[1]) {
        break;
      }
    }
    expect(state.checkpoint).toBe(1);
  });

  it("does not give a checkpoint back when rolling away from it", () => {
    // "Where I was", not "where I am" - sliding back down a slope must not
    // undo an evening's progress.
    let state = seated(startAt(1));
    for (let frame = 0; frame < 5 / FRAME; frame++) {
      state = step(state, theMap(), [{ ...IDLE_INPUT, drive: -1 }], FRAME);
    }
    expect(state.rv.x).toBeLessThan(CHECKPOINTS[1]);
    expect(state.checkpoint).toBe(1);
  });
});

describe("finding a checkpoint", () => {
  it("names the one you last passed", () => {
    expect(checkpointAt(0)).toBe(0);
    expect(checkpointAt(CHECKPOINTS[1] - 1)).toBe(0);
    expect(checkpointAt(CHECKPOINTS[1])).toBe(1);
    expect(checkpointAt(CHECKPOINTS[1] + 1)).toBe(1);
    expect(checkpointAt(Number.POSITIVE_INFINITY)).toBe(CHECKPOINT_COUNT - 1);
  });

  it("steps on and back, and wraps around at both ends", () => {
    // From the first, "back" is the shortest way to the far end of the map.
    expect(checkpointStep(0, 1)).toBe(1);
    expect(checkpointStep(0, -1)).toBe(CHECKPOINT_COUNT - 1);
    expect(checkpointStep(CHECKPOINT_COUNT - 1, 1)).toBe(0);
  });
});
