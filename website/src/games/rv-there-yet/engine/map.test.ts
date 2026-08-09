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
import {
  besideTheVehicle,
  reachableAnchor,
  ropeCandidate,
  step,
} from "./engine";
import {
  SECTIONS,
  SECTION_COUNT,
  sectionAt,
  sectionStep,
  MAP,
  parseMap,
  WOOD_FROM,
  WOOD_SECTION,
  woodShare,
} from "./map";
import { startAt, theMap } from "./setup";
import { heightAt, routeLength, slopeAt, snowShare } from "./terrain";
import {
  BEAR_REACH,
  ENTER_REACH,
  ROOF_HALF,
  ROOF_HIGH,
  LADDER_REACH,
  ANCHOR_REACH,
  CHASM_STOP,
  WINCH_MIN,
  IDLE_INPUT,
  NO_GRIP_SLOPE,
  PICKUP_REACH,
  TOP_GEAR,
  WINCH_RANGE,
  ROUTE_STEP,
  SPRAY_REACH,
  type GameState,
  type Input,
  type Pit,
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
  // A chasm ahead is the one thing on this map that has to be **prepared**:
  // the tree beside it is felled with an axe that lies on the far side, and
  // the only way over there is off the roof of the motorhome.
  const chasm = chasmAhead(state, route);
  if (chasm !== null) {
    return crossTheChasm(state, route, chasm);
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
  // Rope on: wind. Nothing is chosen off the list first - standing at a tree
  // puts the remote in the hand by itself, and the autopilot leans on that
  // exactly as a player does.
  return { ...IDLE_INPUT, wind: 1 };
}

/** The same world, but behind the wheel - for tests about driving. */
function seated(state: GameState): GameState {
  return step(state, theMap(), [{ ...IDLE_INPUT, door: true }], FRAME);
}

/** Which field the ditch's floor lies in - the low point of the second section. */
function ditchField(): number {
  // Found through the pit the map itself declares, rather than by looking in
  // a stretch of fields somebody wrote down once: the sections have been
  // reordered before now, and a hand-written range quietly stops pointing at
  // the hole when they are.
  const pit = MAP.pits[0];
  const from = Math.round(pit.from / ROUTE_STEP);
  const to = Math.round(pit.to / ROUTE_STEP) + 1;
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
  // Only while the post is still ahead. A section that **starts** past the
  // bear has it behind the bumper, and the engine lets that motorhome drive on
  // - an autopilot that turned round and walked back to spray it would be
  // walking into the one thing on this map that kills.
  return (
    state.rv.x < route.bear && state.rv.x > route.bear - BEAR_REACH - ROUTE_STEP
  );
}

/** Whether the map has such a thing lying about at all. */
function has(route: Route, kind: string): boolean {
  return route.items.some((item) => item.kind === kind);
}

/**
 * The chasm this drive still has to get past, if any.
 *
 * @param state - the world as it is
 * @param route - the map
 * @returns the chasm, or null when there is none left to worry about
 */
function chasmAhead(state: GameState, route: Route): Pit | null {
  if (state.felled) {
    return null;
  }
  return (
    route.chasms.find(
      (each) => state.rv.x > each.from - LOOK_AHEAD && state.rv.x < each.from,
    ) ?? null
  );
}

/** How far ahead a chasm starts being the thing to deal with, in metres. */
const LOOK_AHEAD = 40;

/**
 * Getting past the chasm: park, climb, leap, fetch the axe, fell the tree.
 *
 * @param state - the world as it is
 * @param route - the map
 * @param chasm - the gap in the way
 * @returns the input for this frame
 * @remarks
 * The whole of the last section in one function, because the whole of the last
 * section is one errand. If any part of it stops working - the ladder, the
 * roof, the leap, the axe, the felling - this stops finishing, which is the
 * point of making the autopilot do it rather than asserting the pieces.
 *
 * The parking is what everything else hangs off: the leap starts at the front
 * edge of the roof, so the motorhome has to stand with that edge at the lip.
 */
function crossTheChasm(state: GameState, route: Route, chasm: Pit): Input {
  const me = one(state);
  const park = chasm.from - ROOF_HALF;
  const lip = state.rv.x + ROOF_HALF;
  const tree = route.fellTree ?? chasm.to;
  const axe = route.items.find((item) => item.kind === "axe");

  // Still driving: get it to the parking spot and stop it there.
  if (me.inside) {
    if (state.rv.x < park - 1) {
      return { ...IDLE_INPUT, drive: 1, shift: 1 };
    }
    return state.rv.v > 0
      ? { ...IDLE_INPUT, brake: true }
      : { ...IDLE_INPUT, door: true };
  }
  // Over there already: axe first, then the tree.
  if (me.at > chasm.to) {
    if (!me.carrying.includes("axe") && axe !== undefined) {
      return Math.abs(me.at - axe.at) <= PICKUP_REACH
        ? { ...IDLE_INPUT, take: true }
        : { ...IDLE_INPUT, drive: towards(me.at, axe.at) };
    }
    return Math.abs(me.at - tree) <= ANCHOR_REACH
      ? { ...IDLE_INPUT, work: true }
      : { ...IDLE_INPUT, drive: towards(me.at, tree) };
  }
  // On the ground on this side: to the ladder and up it.
  if (me.lift <= 0) {
    const ladder = state.rv.x - ROOF_HALF;
    return Math.abs(me.at - ladder) <= LADDER_REACH
      ? { ...IDLE_INPUT, jump: true }
      : { ...IDLE_INPUT, drive: towards(me.at, ladder) };
  }
  // On the roof: forward to its front edge, then a running double jump.
  if (me.at < lip - LEAP_FROM) {
    return { ...IDLE_INPUT, drive: 1 };
  }
  return { ...IDLE_INPUT, drive: 1, jump: true };
}

/** How far back from the edge of the roof the leap starts, in metres. */
const LEAP_FROM = 0.2;

/**
 * The errand of fetching one thing and doing something with it.
 *
 * @param state - the world as it is
 * @param route - the map
 * @param kind - what to go and get
 * @returns the input for this frame
 * @remarks
 * Out of the cab, walk to the thing, walk back, hold the key. Nothing is ever
 * chosen off the list: standing where the thing is wanted puts it in the hand,
 * and the autopilot leans on that exactly as a player does - which is what
 * makes these runs a test of the automatic hand and not only of the map.
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

/** Which section is the climb the winch is for: the second one. */
const WINCH_SECTION = 1;

/** Which section the bridge is in, and which one the fog lies over. */
const BRIDGE_SECTION = SECTION_COUNT - 2;
const FOG_SECTION = SECTION_COUNT - 3;

/**
 * How far a leap carries from a given height, in metres.
 *
 * @param from - what the jumper is standing on, in metres above the ground
 * @returns how far along the route they get before they land
 * @remarks
 * Measured by jumping rather than worked out on paper: the numbers that
 * decide whether the last section can be solved are the ones the engine
 * actually produces.
 */
function leapReach(from: number): number {
  const flat: Route = {
    ...theMap(),
    heights: Array.from({ length: 40 }, () => 0),
    anchors: [],
    pits: [],
    items: [],
    bear: null,
    fog: null,
    bridges: [],
    mud: [],
    chasms: [],
    fellTree: null,
    sections: [],
  };
  const base = startAt(0);
  const at = ROUTE_STEP * 10;
  let now: GameState = {
    ...base,
    rv: { x: at, v: 0 },
    driver: -1,
    people: [{ ...base.people[0], inside: false, at, lift: from }],
  };
  const jump = { ...IDLE_INPUT, drive: 1, jump: true };
  now = step(now, flat, [jump], FRAME);
  now = step(now, flat, [jump], FRAME);
  for (let frame = 0; frame < 4 / FRAME; frame++) {
    now = step(now, flat, [{ ...IDLE_INPUT, drive: 1 }], FRAME);
    if (now.people[0].lift <= 0) {
      break;
    }
  }
  return now.people[0].at - at;
}

/** How far a felled trunk reaches back from where the tree stood, in metres. */
const TRUNK_REACH = 12;

/**
 * The first steep field past a metre, in metres.
 *
 * @param from - where to start looking
 * @returns where the ground first turns too steep to drive
 */
function firstSteepAfter(from: number): number {
  for (let at = from; at < routeLength(MAP); at += ROUTE_STEP / 2) {
    if (Math.abs(slopeAt(MAP, at)) >= NO_GRIP_SLOPE) {
      return at;
    }
  }
  return routeLength(MAP);
}

/**
 * How far the motorhome gets up the hill from a section, under its own power.
 *
 * @param from - the metre to set off from
 * @returns where it comes to a stand, in metres
 * @remarks
 * First gear, which is what the section teaches and what the autopilot uses:
 * the stall point is the thing every other number here has to fit around.
 */
function driveUp(from: number): number {
  const base = startAt(2);
  let now: GameState = {
    ...base,
    rv: { x: from, v: 0 },
    driver: 0,
    people: [{ ...base.people[0], inside: true, at: from }],
  };
  for (let frame = 0; frame < 60 / FRAME; frame++) {
    now = step(now, theMap(), [{ ...IDLE_INPUT, drive: 1, shift: 1 }], FRAME);
  }
  return now.rv.x;
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

  it("lets a section past the bear be driven at all", () => {
    // Found by playing the foggy section: it starts beyond the bear's post, so
    // the barrier stood exactly where the motorhome did and it could not move
    // a metre. A bear behind the bumper must not close the road ahead.
    const past = SECTION_COUNT - 1;
    expect(SECTIONS[past]).toBeGreaterThan(MAP.bear ?? 0);
    let state = seated(startAt(past));
    for (let frame = 0; frame < 20 / FRAME; frame++) {
      state = step(
        state,
        theMap(),
        [{ ...IDLE_INPUT, drive: 1, shift: 2 }],
        FRAME,
      );
    }
    expect(state.rv.x).toBeGreaterThan(SECTIONS[past] + ROUTE_STEP);
  });

  it("closes its own section in, and only that one", () => {
    // The point of it: the ground still climbs and falls, you simply cannot
    // see which. So the fog has to be closed in over the whole of that
    // section - fog that stopped halfway would hand the answer back.
    expect(MAP.fog?.from).not.toBe(null);
    const fog = MAP.fog?.from ?? 0;
    // At or before the section's own start, so it is closed in from the first
    // second: a section that began in the clear would give the profile away
    // before the fog ever arrived.
    expect(fog).toBeLessThanOrEqual(SECTIONS[FOG_SECTION]);
    expect(fog).toBeGreaterThan(SECTIONS[FOG_SECTION - 1]);
    expect(fog).toBeLessThan(routeLength(MAP));
    // And it lifts again before the section after it: the bridge there is a
    // test of nerve, and a bridge nobody can see would be a coin toss.
    const clears = MAP.fog?.to ?? 0;
    expect(clears).toBeGreaterThan(fog as number);
    expect(clears).toBeLessThan(SECTIONS[FOG_SECTION + 1]);
  });

  it("puts one bridge on the map, in its own section", () => {
    expect(MAP.bridges.length).toBe(1);
    const bridge = MAP.bridges[0];
    const last = SECTIONS[BRIDGE_SECTION];
    expect(bridge.from).toBeGreaterThan(last);
    expect(bridge.to).toBeLessThan(routeLength(MAP));
  });

  it("leaves room before the bridge to read the sign and stop", () => {
    // The sign stands a few metres before the timber. Coming out of the
    // section straight onto it would be a trap rather than a warning.
    const bridge = MAP.bridges[0];
    const last = SECTIONS[BRIDGE_SECTION];
    expect(bridge.from - last).toBeGreaterThan(ROUTE_STEP * 5);
  });

  it("lays the bridge level, and level either side of it", () => {
    // A bridge on a slope would be crossed by a motorhome that is already
    // sliding, and the section is about who rides across, not about grip.
    const bridge = MAP.bridges[0];
    for (
      let at = bridge.from - ROUTE_STEP;
      at <= bridge.to + ROUTE_STEP;
      at += ROUTE_STEP / 2
    ) {
      expect(Math.abs(slopeAt(MAP, at))).toBeLessThan(0.05);
    }
  });

  it("keeps the fog off the bridge", () => {
    // Crossing a bridge you cannot see is a coin toss, not a test of nerve.
    const bridge = MAP.bridges[0];
    expect(MAP.fog?.to ?? 0).toBeLessThan(bridge.from);
  });

  it("lays mud in front of the climb that wants the winch", () => {
    // Without it a long enough approach in top gear carried the motorhome
    // clean over that wall, and the rope was decoration.
    expect(MAP.mud.length).toBe(1);
    const bog = MAP.mud[0];
    const tree = MAP.anchors.find((each) => each.x > bog.to);
    expect(tree).toBeDefined();
    // Between the section mark and the wall: the run-up is what it takes away.
    const wall = firstSteepAfter(bog.to);
    expect(bog.to).toBeLessThan(wall);
    expect(bog.from).toBeGreaterThan(SECTIONS[WINCH_SECTION]);
  });

  it("keeps the tree in reach of where the wall stops the motorhome", () => {
    // The mud costs a couple of metres of climb, and the section only works
    // while the anchor is still inside a rope's length from the stall point.
    const stalled = driveUp(SECTIONS[2]);
    const tree = MAP.anchors.find((each) => each.x > stalled);
    expect(tree).toBeDefined();
    const gap = (tree?.x ?? 0) - stalled;
    expect(gap).toBeGreaterThan(WINCH_MIN);
    expect(gap).toBeLessThan(WINCH_RANGE);
  });

  it("digs a chasm nobody jumps from the road, and anybody clears from the roof", () => {
    // The one measurement the whole last section hangs on. Too narrow and the
    // roof is decoration; too wide and there is no way over at all. Both
    // reaches are measured here rather than written down, so tuning the jump
    // can never quietly break the map.
    expect(MAP.chasms.length).toBe(1);
    const gap = MAP.chasms[0].to - MAP.chasms[0].from;
    // From the road the leap has to start a stride back from the lip, and
    // that stride is most of why the roof is worth climbing.
    expect(gap + CHASM_STOP).toBeGreaterThan(leapReach(0));
    expect(gap).toBeLessThan(leapReach(ROOF_HIGH));
  });

  it("stands the tree and the axe on the far side of it", () => {
    // The point of the puzzle: what closes the gap is over there, and the
    // only way over there is off the roof.
    const chasm = MAP.chasms[0];
    const axe = MAP.items.find((item) => item.kind === "axe");
    expect(MAP.fellTree).toBeGreaterThan(chasm.to);
    expect(axe?.at).toBeGreaterThan(chasm.to);
    // Close enough that the trunk reaches back across it when it comes down.
    expect((MAP.fellTree ?? 0) - chasm.from).toBeLessThan(TRUNK_REACH);
  });

  it("leaves room to park and climb before the chasm", () => {
    const chasm = MAP.chasms[0];
    const last = SECTIONS[SECTION_COUNT - 1];
    expect(chasm.from).toBeGreaterThan(last + ROOF_HALF * 2);
    expect(chasm.to).toBeLessThan(routeLength(MAP));
  });

  it("makes the foggy section hilly, and none of it too steep to drive", () => {
    // Driving it by the speedometer only works if it **can** be driven: a wall
    // in the fog is not a test of feel, it is a dead end you cannot see.
    const from = Math.floor((MAP.fog?.from ?? 0) / ROUTE_STEP);
    const to = Math.floor((MAP.fog?.to ?? 0) / ROUTE_STEP);
    let rises = 0;
    let falls = 0;
    for (let field = from; field < to; field++) {
      const middle = field * ROUTE_STEP + ROUTE_STEP / 2;
      expect(Math.abs(slopeAt(MAP, middle))).toBeLessThan(NO_GRIP_SLOPE);
      const step = MAP.heights[field + 1] - MAP.heights[field];
      if (step > 0) {
        rises += 1;
      }
      if (step < 0) {
        falls += 1;
      }
    }
    // Hilly means both, over and over - not one long climb.
    expect(rises).toBeGreaterThan(8);
    expect(falls).toBeGreaterThan(8);
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

describe("the two halves of the country", () => {
  it("keeps the mountains for the first half and the woods for the second", () => {
    // Half the map each, and the break where the map already has one.
    expect(WOOD_FROM).toBe(SECTIONS[WOOD_SECTION]);
    expect(WOOD_SECTION * 2).toBe(SECTION_COUNT);
  });

  it("gives every section one country or the other, never a mixture", () => {
    // The mixing happens on the way in, so that nobody starting a section
    // afresh is dropped in front of a half-faded skyline - and it is over
    // before the mark, because everybody starts a few metres short of it,
    // standing beside the motorhome.
    for (const [index, start] of SECTIONS.entries()) {
      const wood = index < WOOD_SECTION ? 0 : 1;
      expect(woodShare(start)).toBe(wood);
      expect(woodShare(besideTheVehicle(start))).toBe(wood);
    }
  });

  it("mixes the one into the other on the way in", () => {
    // A skyline that changed between one frame and the next would read as a
    // fault rather than as a wood closing in.
    const between = woodShare(WOOD_FROM - 30);
    expect(between).toBeGreaterThan(0);
    expect(between).toBeLessThan(1);
    expect(woodShare(0)).toBe(0);
    expect(woodShare(routeLength(MAP))).toBe(1);
  });
});
