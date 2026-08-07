/**
 * Tests that the right view is drawn, and that the far view has perspective.
 *
 * @module
 * @remarks
 * Two things are worth pinning here. The first is which world the player is
 * shown: behind the wheel the road ahead, on foot the motorhome from the side.
 * Drawing the wrong one is not a cosmetic slip - it is being handed somebody
 * else's controls.
 *
 * The second is that the far view really is a **projection** and not a flat
 * picture: something twice as far away has to come out about half the size, or
 * the road is a painted backdrop rather than a distance to be judged.
 */
import { describe, expect, it } from "vitest";
import { draw } from "./render";
import { startAt } from "../engine/setup";
import {
  NEUTRAL,
  REVERSE,
  PICKUP_REACH,
  ROUTE_STEP,
  STILL_SECONDS,
  TOP_GEAR,
  type GameState,
  type ItemKind,
  type Route,
} from "../engine/types";

/** One recorded canvas call: the method or property, and its value. */
type Call = { readonly name: string; readonly args: readonly unknown[] };

/**
 * A canvas context that records every call and assignment instead of painting.
 *
 * @returns the stand-in context and the list it fills
 */
function recordingContext(): {
  readonly ctx: CanvasRenderingContext2D;
  readonly calls: Call[];
} {
  const calls: Call[] = [];
  // The stops go into the same list. A gradient names its colours here rather
  // than as a fill style, and a picture painted entirely in gradients would
  // otherwise look to a test like a picture with no colours in it at all.
  const gradient = {
    addColorStop: (...args: unknown[]) =>
      void calls.push({ name: "addColorStop", args }),
  };
  const canvas = { width: 960, height: 420 };
  const ctx = new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        if (prop === "canvas") {
          return canvas;
        }
        return (...args: unknown[]) => {
          calls.push({ name: prop, args });
          return gradient;
        };
      },
      set: (_target, prop: string, value: unknown) => {
        calls.push({ name: `set:${String(prop)}`, args: [value] });
        return true;
      },
    },
  ) as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}

/** Whether any colour was ever set to that value. */
function usedColour(calls: readonly Call[], colour: string): boolean {
  return calls.some((call) => call.args[0] === colour);
}

/**
 * The radius of every tree crown drawn.
 *
 * @param calls - what the canvas was asked to do
 * @returns the radii, in the order they were painted
 * @remarks
 * Found by the colour that was set just before, not by size: the steering
 * wheel's hub is a circle too, and counting that as a tree would make the test
 * pass for the wrong reason.
 */
function crownRadii(calls: readonly Call[]): number[] {
  const crowns: number[] = [];
  let colour = "";
  for (const call of calls) {
    if (call.name === "set:fillStyle") {
      colour = String(call.args[0]);
    }
    if (call.name === "arc" && CROWNS.includes(colour)) {
      crowns.push(Number(call.args[2]));
    }
  }
  return crowns;
}

/** The greens a tree crown is painted in: plain, and lit up for the rope. */
const CROWNS = ["#2f7d46", "#7ddc8f"];

/**
 * How wide every band of ground came out, far first.
 *
 * @param calls - what the canvas was asked to do
 * @returns the widths in pixels, in the order they were painted
 * @remarks
 * Each band starts with a `moveTo` at its far left corner and a `lineTo` at its
 * far right one, so the distance between the two is how wide the ground is at
 * that distance. Only pairs at the **same height** count: the speedometer's
 * ticks and its needle are lines too, and they all run at an angle.
 */
function bandWidths(calls: readonly Call[]): number[] {
  const widths: number[] = [];
  for (const [index, call] of calls.entries()) {
    const next = calls[index + 1];
    const flat =
      next?.name === "lineTo" && Number(next.args[1]) === Number(call.args[1]);
    if (call.name === "moveTo" && flat) {
      widths.push(Number(next.args[0]) - Number(call.args[0]));
    }
  }
  return widths.filter((width) => width > 0);
}

/** A flat road with two trees, one twice as far off as the other. */
const TWO_TREES: Route = {
  name: "zwei",
  heights: Array.from({ length: 40 }, () => 0),
  anchors: [
    { x: ROUTE_STEP * 5, y: 0 },
    { x: ROUTE_STEP * 10, y: 0 },
  ],
  pits: [],
  items: [],
  bear: null,
  fog: null,
  bridges: [],
  chasms: [],
  fellTree: null,
  sections: [],
};

/** The cream of the motorhome's body - only the side view paints it. */
const BODY = "#efe4cb";

/** The colours of a section flag: its pole, and passed or still ahead. */
const MARK_POLE = "#4a5a6b";
const MARK_AHEAD = "#3f7fd0";
const MARK_PASSED = "#6d8bab";

/** The knob of the shift gate. */
const KNOB = "#d9d2c6";

/** The dashboard - only the driver's view paints that. */
const DASHBOARD = "#241f1c";

/**
 * A world at the very first metre, sitting in the cab.
 *
 * @remarks
 * Placed by hand rather than taken from the map: these tests measure distances
 * to two trees, and where the map happens to put its first section is none
 * of their business.
 */
function seated(): GameState {
  const state = startAt(0);
  return {
    ...state,
    rv: { x: 0, v: 0 },
    people: [{ ...state.people[0], inside: true, at: 0 }],
    driver: 0,
  };
}

/** The same world as the game hands it over: standing beside the motorhome. */
function standing(): GameState {
  const state = seated();
  return {
    ...state,
    people: [{ ...state.people[0], inside: false, at: 0 }],
    driver: -1,
  };
}

describe("which view is drawn", () => {
  it("shows the road ahead from the driver's seat", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), TWO_TREES, -1, -1);
    expect(usedColour(calls, DASHBOARD)).toBe(true);
    expect(usedColour(calls, BODY)).toBe(false);
  });

  it("shows the motorhome from the side once you are out of it", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, standing(), TWO_TREES, -1, -1);
    expect(usedColour(calls, BODY)).toBe(true);
    expect(usedColour(calls, DASHBOARD)).toBe(false);
  });
});

describe("the section flags", () => {
  /** A flat road with a section behind and one ahead. */
  const MARKED: Route = {
    ...TWO_TREES,
    anchors: [],
    pits: [],
    items: [],
    bear: null,
    fog: null,
    bridges: [],
    chasms: [],
    fellTree: null,
    sections: [ROUTE_STEP * 2, ROUTE_STEP * 8],
  };

  it("puts a flag on every section in sight", () => {
    const at = { ...seated(), rv: { x: ROUTE_STEP * 4, v: 0 }, section: 0 };
    const { ctx, calls } = recordingContext();
    draw(ctx, at, MARKED, -1, -1);
    expect(usedColour(calls, MARK_POLE)).toBe(true);
  });

  it("fades the ones already behind you", () => {
    // A glance should say both "this is a section" and "you have had it".
    const passed = {
      ...seated(),
      rv: { x: ROUTE_STEP * 4, v: 0 },
      section: 0,
    };
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      {
        ...passed,
        people: [{ ...passed.people[0], inside: false, at: ROUTE_STEP * 4 }],
        driver: -1,
      },
      MARKED,
      -1,
      -1,
    );
    expect(usedColour(calls, MARK_PASSED)).toBe(true);
    expect(usedColour(calls, MARK_AHEAD)).toBe(true);
  });

  it("marks them all as ahead before any is reached", () => {
    const fresh = {
      ...seated(),
      rv: { x: 0, v: 0 },
      people: [{ ...seated().people[0], inside: false, at: 0 }],
      driver: -1,
      section: -1,
    };
    const { ctx, calls } = recordingContext();
    draw(ctx, fresh, MARKED, -1, -1);
    expect(usedColour(calls, MARK_PASSED)).toBe(false);
  });
});

describe("the shift gate", () => {
  /** Where the knob was put, in canvas pixels, and how big it came out. */
  function knobAt(gear: number): { x: number; y: number } {
    const { ctx, calls } = recordingContext();
    draw(ctx, { ...seated(), gear }, TWO_TREES, -1, -1);
    let colour = "";
    for (const [index, call] of calls.entries()) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "arc" && colour === KNOB) {
        void index;
        // A knob of no size is a knob nobody can see.
        expect(Number(call.args[2])).toBeGreaterThan(1);
        return { x: Number(call.args[0]), y: Number(call.args[1]) };
      }
    }
    throw new Error(`no knob drawn for gear ${gear}`);
  }

  it("puts the knob in the slot of the gear that is in", () => {
    // The whole point of a gate instead of a letter: you see where the lever
    // sits, and the gear beside it is one slot away rather than a number away.
    const first = knobAt(1);
    const third = knobAt(3);
    const fifth = knobAt(TOP_GEAR);
    expect(first.x).toBeLessThan(third.x);
    expect(third.x).toBeLessThan(fifth.x);
    expect(first.y).toBeCloseTo(third.y);
  });

  it("puts the even gears below the odd ones", () => {
    expect(knobAt(1).y).toBeLessThan(knobAt(2).y);
    expect(knobAt(3).y).toBeLessThan(knobAt(4).y);
  });

  it("puts reverse under fifth, and neutral in the middle of the bar", () => {
    const fifth = knobAt(TOP_GEAR);
    const reverse = knobAt(REVERSE);
    expect(reverse.x).toBeCloseTo(fifth.x);
    expect(reverse.y).toBeGreaterThan(fifth.y);

    const neutral = knobAt(NEUTRAL);
    expect(neutral.x).toBeCloseTo(knobAt(3).x);
    expect(neutral.y).toBeGreaterThan(knobAt(3).y);
    expect(neutral.y).toBeLessThan(knobAt(4).y);
  });
});

describe("the view ahead", () => {
  it("draws what is twice as far away at about half the size", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), TWO_TREES, -1, -1);
    const crowns = crownRadii(calls);
    expect(crowns).toHaveLength(2);

    // Drawn far first, so the last of them is the near one.
    const far = crowns[0];
    const near = crowns[1];
    expect(near / far).toBeGreaterThan(1.7);
    expect(near / far).toBeLessThan(2.3);
  });

  it("narrows the road towards the horizon", () => {
    // Without this the road is a painted backdrop and no distance can be
    // judged from it.
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), TWO_TREES, -1, -1);
    const widths = bandWidths(calls);
    expect(widths.length).toBeGreaterThan(20);
    // Painted from far to near, so the last band is the widest by a long way.
    expect(widths[widths.length - 1]).toBeGreaterThan(widths[0] * 5);
  });

  it("does not draw what is still miles away", () => {
    const faraway: Route = {
      ...TWO_TREES,
      anchors: [{ x: ROUTE_STEP * 200, y: 0 }],
      sections: [],
    };
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), faraway, -1, -1);
    expect(crownRadii(calls)).toHaveLength(0);
  });

  it("lights up the tree the rope would reach", () => {
    const lit = "#7ddc8f";
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), TWO_TREES, 0, -1);
    expect(usedColour(calls, lit)).toBe(true);

    const dull = recordingContext();
    draw(dull.ctx, seated(), TWO_TREES, -1, -1);
    expect(usedColour(dull.calls, lit)).toBe(false);
  });

  it("leaves out what is behind the motorhome", () => {
    // Standing past both trees there is nothing left to draw ahead.
    const passed = { ...seated(), rv: { x: ROUTE_STEP * 20, v: 0 } };
    const { ctx, calls } = recordingContext();
    draw(ctx, passed, TWO_TREES, -1, -1);
    expect(crownRadii(calls)).toHaveLength(0);
  });
});

describe("the tyres on the motorhome", () => {
  /** The colour the tyres are painted in. */
  const RUBBER = "#2b2b2b";

  /**
   * The radius of every wheel drawn on the motorhome.
   *
   * @param calls - what the canvas was asked to do
   * @returns the radii, in the order they were painted
   * @remarks
   * Found by the colour set just before, like the tree crowns: plenty of other
   * things on this canvas are circles.
   */
  function wheelRadii(calls: readonly Call[]): number[] {
    const found: number[] = [];
    let colour = "";
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "arc" && colour === RUBBER) {
        found.push(Number(call.args[2]));
      }
    }
    return found;
  }

  /** How many tread blocks were drawn: rubber-coloured rounded squares. */
  function treadBlocks(calls: readonly Call[]): number {
    let colour = "";
    let found = 0;
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (
        call.name === "roundRect" &&
        colour === RUBBER &&
        call.args[2] === call.args[3]
      ) {
        found += 1;
      }
    }
    return found;
  }

  /** The side view of a world, with or without the off-road tyres fitted. */
  function fitted(tyres: boolean) {
    const { ctx, calls } = recordingContext();
    draw(ctx, { ...standing(), tyres }, TWO_TREES, -1, -1);
    return calls;
  }

  it("makes the wheels visibly bigger once they are on", () => {
    const road = wheelRadii(fitted(false));
    const offRoad = wheelRadii(fitted(true));
    expect(road).toHaveLength(2);
    expect(offRoad).toHaveLength(2);
    // A third bigger, not a hair: it has to read across the whole screen.
    expect(offRoad[0]).toBeGreaterThan(road[0] * 1.3);
    expect(offRoad[1]).toBeGreaterThan(road[1] * 1.3);
  });

  it("gives them tread blocks the road tyres do not have", () => {
    expect(treadBlocks(fitted(false))).toBe(0);
    // Both wheels, all the way round.
    expect(treadBlocks(fitted(true))).toBeGreaterThan(20);
  });

  it("lifts the motorhome by exactly what the bigger tyres add", () => {
    // The body is drawn from the ground up, so without the lift the fat tyres
    // would eat into the floor - or hover.
    const lift = (calls: readonly Call[]) => {
      const move = calls.find(
        (call) => call.name === "translate" && call.args[0] === 0,
      );
      return move === undefined ? 0 : -Number(move.args[1]);
    };
    const road = wheelRadii(fitted(false))[0];
    const offRoad = wheelRadii(fitted(true))[0];
    expect(lift(fitted(true))).toBeCloseTo(offRoad - road, 6);
    expect(lift(fitted(false))).toBe(0);
  });
});

describe("the two seats in the cab", () => {
  /** The colours that only the driver's side has. */
  const STEERING_WHEEL = "#5b524a";
  const DIAL_FACE = "#e8e2d6";
  const GATE_PLATE = "#141210";
  /** The colours that only the passenger's side has. */
  const GLOVE_BOX = "#332c26";
  const GRAB_HANDLE = "#6b6058";

  /**
   * Both of them in the cab, seen from one of the two seats.
   *
   * @param me - whose screen this is: 0 drives, 1 rides along
   * @returns what the canvas was asked to do
   */
  function fromSeat(me: number): readonly Call[] {
    const base = seated();
    const both: GameState = {
      ...base,
      people: [
        { ...base.people[0], inside: true, at: 0 },
        { ...base.people[0], inside: true, at: 0 },
      ],
      // Person zero got in first, so person zero drives.
      driver: 0,
    };
    const { ctx, calls } = recordingContext();
    draw(ctx, both, TWO_TREES, -1, -1, me);
    return calls;
  }

  it("puts a wheel and a speedometer in front of the driver", () => {
    const driver = fromSeat(0);
    expect(usedColour(driver, STEERING_WHEEL)).toBe(true);
    expect(usedColour(driver, DIAL_FACE)).toBe(true);
    expect(usedColour(driver, GATE_PLATE)).toBe(true);
  });

  it("gives the passenger neither of them", () => {
    // The whole point: a passenger who still saw a wheel would keep pressing
    // the pedals and wondering why nothing happens.
    const rider = fromSeat(1);
    expect(usedColour(rider, STEERING_WHEEL)).toBe(false);
    expect(usedColour(rider, DIAL_FACE)).toBe(false);
    expect(usedColour(rider, GATE_PLATE)).toBe(false);
  });

  it("gives the passenger a glove box and something to hold instead", () => {
    // Otherwise the seat reads as a drawing somebody forgot to finish.
    const rider = fromSeat(1);
    expect(usedColour(rider, GLOVE_BOX)).toBe(true);
    expect(usedColour(rider, GRAB_HANDLE)).toBe(true);
    const driver = fromSeat(0);
    expect(usedColour(driver, GLOVE_BOX)).toBe(false);
  });

  it("shows both of them the same road", () => {
    // Only the furniture differs - the drive is one drive.
    expect(usedColour(fromSeat(0), DASHBOARD)).toBe(true);
    expect(usedColour(fromSeat(1), DASHBOARD)).toBe(true);
    expect(usedColour(fromSeat(1), BODY)).toBe(false);
  });
});

describe("the speedometer", () => {
  /** Every string the canvas was asked to write. */
  function written(calls: readonly Call[]): string[] {
    return calls
      .filter((call) => call.name === "fillText")
      .map((call) => String(call.args[0]));
  }

  /** The driver's view at a given speed, in metres per second. */
  function atSpeed(speed: number): readonly Call[] {
    const base = seated();
    const { ctx, calls } = recordingContext();
    draw(ctx, { ...base, rv: { x: 0, v: speed } }, TWO_TREES, -1, -1);
    return calls;
  }

  it("says the speed in figures, with its unit", () => {
    // A needle alone answers "how far round", not "how fast". Two lines,
    // because one wide one ran into the 0 and the 60 at the rim.
    expect(written(atSpeed(10))).toContain("36");
    expect(written(atSpeed(10))).toContain("km/h");
  });

  it("reads a reverse roll as speed, not as a negative number", () => {
    expect(written(atSpeed(-5))).toContain("18");
    expect(written(atSpeed(-5)).join(" ")).not.toContain("-");
  });

  it("labels the dial so the needle stands for something", () => {
    const labels = written(atSpeed(0));
    // Every second tick of the six carries its own number.
    expect(labels).toContain("0");
    expect(labels).toContain("20");
    expect(labels).toContain("40");
    expect(labels).toContain("60");
  });

  it("keeps the numbers off the passenger's side", () => {
    const base = seated();
    const both: GameState = {
      ...base,
      people: [
        { ...base.people[0], inside: true, at: 0 },
        { ...base.people[0], inside: true, at: 0 },
      ],
      driver: 0,
      rv: { x: 0, v: 10 },
    };
    const { ctx, calls } = recordingContext();
    draw(ctx, both, TWO_TREES, -1, -1, 1);
    expect(written(calls)).not.toContain("km/h");
  });
});

describe("a thing you could pick up", () => {
  /** The ring drawn around something within reach. */
  const TAKE_GLOW = "#ffd75e88";

  /** A route with a hammer lying at a known spot. */
  const WITH_HAMMER: Route = {
    ...TWO_TREES,
    anchors: [],
    items: [{ at: ROUTE_STEP * 3, kind: "hammer" }],
  };

  /** The side view with the walker standing a given distance from it. */
  function away(gap: number): readonly Call[] {
    const base = standing();
    const at = WITH_HAMMER.items[0].at + gap;
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      { ...base, rv: { x: at, v: 0 }, people: [{ ...base.people[0], at }] },
      WITH_HAMMER,
      -1,
      -1,
    );
    return calls;
  }

  it("is ringed the moment somebody is close enough", () => {
    // Without this the only sign is a line of text, and a player watching the
    // road walks straight past a thing they are standing on.
    expect(usedColour(away(PICKUP_REACH - 1), TAKE_GLOW)).toBe(true);
  });

  it("is not ringed from further off than the reach", () => {
    expect(usedColour(away(PICKUP_REACH + 2), TAKE_GLOW)).toBe(false);
  });

  it("is not ringed for somebody sitting in the cab", () => {
    // Two of them, so the side view is drawn at all: one on foot far away
    // watching, one parked in the cab right on top of the hammer. Reaching out
    // of a cab window for it is not a thing that happens, so no ring.
    const base = standing();
    const at = WITH_HAMMER.items[0].at;
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      {
        ...base,
        rv: { x: at, v: 0 },
        people: [
          { ...base.people[0], at: at - PICKUP_REACH * 6, inside: false },
          { ...base.people[0], at, inside: true },
        ],
        driver: 1,
      },
      WITH_HAMMER,
      -1,
      -1,
      0,
    );
    expect(usedColour(calls, TAKE_GLOW)).toBe(false);
  });
});

describe("the bear on the screen", () => {
  /** A flat route with a bear standing in the middle of it. */
  const WITH_BEAR: Route = {
    ...TWO_TREES,
    anchors: [],
    items: [],
    bear: ROUTE_STEP * 4,
  };

  /** The side view, with the bear in a given state and the clock at a time. */
  function scene(
    over: { hold?: number; time?: number; walkerAt?: number } = {},
  ): readonly Call[] {
    const base = standing();
    const at = WITH_BEAR.bear ?? 0;
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      {
        ...base,
        time: over.time ?? 0,
        rv: { x: at - ROUTE_STEP, v: 0 },
        people: [{ ...base.people[0], at: over.walkerAt ?? at - 4 }],
        bear: { at, hold: over.hold ?? 0, sprayed: 0, gone: false },
      },
      WITH_BEAR,
      -1,
      -1,
    );
    return calls;
  }

  /** How many claws were actually painted. */
  function clawsIn(calls: readonly Call[]): number {
    let colour = "";
    let claws = 0;
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "fill" && colour === "#e8e0d2") {
        claws += 1;
      }
    }
    return claws;
  }

  /** Every rotation the canvas was asked to make. */
  function turns(calls: readonly Call[]): number[] {
    return calls
      .filter((call) => call.name === "rotate")
      .map((call) => Number(call.args[0]));
  }

  /** Where things were moved to, as x offsets. */
  function shifts(calls: readonly Call[]): number[] {
    return calls
      .filter((call) => call.name === "translate")
      .map((call) => Number(call.args[0]));
  }

  it("stands square on all fours while it has nobody", () => {
    // Flat ground, so the only rotation would be the bear rearing. (Comparing
    // against zero rather than the array: a negative zero is still square.)
    expect(turns(scene()).every((angle) => angle === 0)).toBe(true);
  });

  it("swings a paw the moment it has hold of somebody", () => {
    const attacking = turns(scene({ hold: 0.5 }));
    expect(attacking.some((angle) => angle !== 0)).toBe(true);
    // Claws, so the blow reads as a blow and not as a stick waving about.
    // Counted, not merely coloured: the colour is set before the loop that
    // draws them, so setting it proves nothing on its own.
    expect(clawsIn(scene({ hold: 0.5 }))).toBeGreaterThan(0);
    expect(clawsIn(scene())).toBe(0);
  });

  it("swings the paw through an arc rather than holding it out", () => {
    // The angle at two instants of one strike has to differ, or the paw is
    // simply a limb stuck out in front.
    const early = turns(scene({ hold: 0.5, time: 0 }));
    const later = turns(scene({ hold: 0.5, time: 0.2 }));
    expect(later).not.toEqual(early);
  });

  it("keeps moving while it attacks, and stands still when it does not", () => {
    // Two instants a fraction apart: attacking, the picture has to differ.
    const early = shifts(scene({ hold: 0.5, time: 0 }));
    const later = shifts(scene({ hold: 0.5, time: 0.17 }));
    expect(later).not.toEqual(early);

    const restingEarly = shifts(scene({ time: 0 }));
    const restingLater = shifts(scene({ time: 0.17 }));
    expect(restingLater).toEqual(restingEarly);
  });

  it("turns to face whoever is on foot", () => {
    /** Which way round the bear was drawn. */
    const facing = (calls: readonly Call[]) =>
      calls
        .filter((call) => call.name === "scale")
        .map((call) => Number(call.args[0]));
    const bearAt = WITH_BEAR.bear ?? 0;
    expect(facing(scene({ walkerAt: bearAt + 8 }))).toContain(1);
    expect(facing(scene({ walkerAt: bearAt - 8 }))).toContain(-1);
  });
});

describe("what the driver has in their hands", () => {
  /** The side view of somebody holding a thing, with the job part done. */
  function holding(kind: "hammer" | "tyres" | null, repair = 0, time = 0) {
    const base = standing();
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      {
        ...base,
        repair,
        time,
        people: [
          {
            ...base.people[0],
            carrying: kind === null ? [] : [kind],
            holding: kind,
          },
        ],
      },
      TWO_TREES,
      -1,
      -1,
    );
    return calls;
  }

  /** Every rotation the canvas was asked to make. */
  const turns = (calls: readonly Call[]) =>
    calls
      .filter((call) => call.name === "rotate")
      .map((call) => Number(call.args[0]));

  it("turns the tyre while it is being fitted", () => {
    // A tyre that hangs motionless in the hands says nothing about whether
    // holding the key is doing anything.
    const early = turns(holding("tyres", 0.2));
    const later = turns(holding("tyres", 0.6));
    expect(later).not.toEqual(early);
  });

  it("turns with the work rather than with a clock", () => {
    // Held down, it turns; let go, it stops dead. A spin driven by the clock
    // would keep going and say "still working" when nothing is happening.
    expect(turns(holding("tyres", 0.4, 0))).toEqual(
      turns(holding("tyres", 0.4, 9)),
    );
  });

  it("shows nothing in the hand that is only in the bag", () => {
    // The bag is not the hand, and the picture has to agree with the rules.
    const base = standing();
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      {
        ...base,
        repair: 0.5,
        people: [
          {
            ...base.people[0],
            carrying: ["remote", "tyres", "hammer"],
            holding: "remote",
          },
        ],
      },
      TWO_TREES,
      -1,
      -1,
    );
    // Neither the tyre nor the hammer: both are in the bag, and the picture
    // has to agree with the rules about which of them can be used.
    expect(turns(calls)).toEqual(turns(holding(null, 0)));
  });

  it("swings the hammer only when it is the thing in hand", () => {
    expect(turns(holding("hammer", 0.3))).not.toEqual(
      turns(holding(null, 0.3)),
    );
  });
});

describe("the jerrycan in the hands", () => {
  /** Every rotation the canvas was asked to make. */
  const spins = (calls: readonly Call[]) =>
    calls
      .filter((call) => call.name === "rotate")
      .map((call) => Number(call.args[0]));

  /** The side view of somebody holding the can, with the job part done. */
  function pouring(repair: number, time = 0): readonly Call[] {
    const base = standing();
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      {
        ...base,
        repair,
        time,
        people: [{ ...base.people[0], carrying: ["can"], holding: "can" }],
      },
      TWO_TREES,
      -1,
      -1,
    );
    return calls;
  }

  it("tips further over as the tank fills", () => {
    const early = spins(pouring(0.5));
    const late = spins(pouring(3));
    expect(late).not.toEqual(early);
  });

  it("stands upright before the pouring starts", () => {
    // Carried level, poured upside down: the difference is the whole animation.
    expect(spins(pouring(0)).every((angle) => angle === 0)).toBe(true);
  });

  it("tips with the work rather than with a clock", () => {
    expect(spins(pouring(1.5, 0))).toEqual(spins(pouring(1.5, 8)));
  });
});

describe("the mountains behind the drive", () => {
  const RANGE_FAR = "#a9c2d8";
  const RANGE_NEAR = "#93ae9b";
  const RANGE_SNOW = "#eef4fa";

  /**
   * Where the canvas drew lines, for a walker standing at a given metre.
   *
   * @param at - where they stand, in metres
   * @param colour - which range to collect, by the colour set before it
   * @returns the x coordinates of that range's line
   */
  function skyline(at: number, colour: string): number[] {
    const base = standing();
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      { ...base, rv: { x: at, v: 0 }, people: [{ ...base.people[0], at }] },
      TWO_TREES,
      -1,
      -1,
    );
    const found: number[] = [];
    let current = "";
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        current = String(call.args[0]);
      }
      if (call.name === "lineTo" && current === colour) {
        found.push(Number(call.args[0]));
      }
    }
    return found;
  }

  it("has two ranges, one behind the other", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, standing(), TWO_TREES, -1, -1);
    expect(usedColour(calls, RANGE_FAR)).toBe(true);
    expect(usedColour(calls, RANGE_NEAR)).toBe(true);
  });

  it("caps the far summits with snow", () => {
    // Counting what was **painted**, not merely which colour was set: the
    // colour is chosen before the loop that decides whether any summit stands
    // high enough, so setting it proves nothing on its own.
    const { ctx, calls } = recordingContext();
    draw(ctx, standing(), TWO_TREES, -1, -1);
    let colour = "";
    let caps = 0;
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "fill" && colour === RANGE_SNOW) {
        caps += 1;
      }
    }
    expect(caps).toBeGreaterThan(0);
  });

  it("gives the summits different heights, so they are landmarks", () => {
    // All of them the same height is a saw blade, and a saw blade tells you as
    // little about where you are as a flat line does.
    const base = standing();
    const { ctx, calls } = recordingContext();
    draw(ctx, base, TWO_TREES, -1, -1);
    let colour = "";
    const tops: number[] = [];
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "lineTo" && colour === RANGE_FAR) {
        tops.push(Number(call.args[1]));
      }
    }
    expect(new Set(tops).size).toBeGreaterThan(2);
  });

  it("moves as you move, so there is something to judge motion against", () => {
    // The whole point. A backdrop that stood still made a bear walking at you
    // look exactly like you walking at the bear.
    const here = skyline(0, RANGE_NEAR);
    const there = skyline(40, RANGE_NEAR);
    expect(there).not.toEqual(here);
  });

  it("moves the far range less than the near one", () => {
    // Depth comes from the difference in speed, not from either of them alone.
    //
    // A short step on purpose: the ranges are drawn summit by summit, and once
    // the camera has moved far enough for a new summit to come into the window
    // the first line belongs to a different mountain. Ten metres keeps both
    // windows still, so the two numbers really are the same peak twice.
    const step = 10;
    const farShift = skyline(0, RANGE_FAR)[0] - skyline(step, RANGE_FAR)[0];
    const nearShift = skyline(0, RANGE_NEAR)[0] - skyline(step, RANGE_NEAR)[0];
    expect(Math.abs(farShift)).toBeGreaterThan(0);
    expect(Math.abs(farShift)).toBeLessThan(Math.abs(nearShift));
  });

  it("puts the same mountains on the same stretch of road", () => {
    // A landmark that moved about would be worse than no landmark at all.
    expect(skyline(120, RANGE_FAR)).toEqual(skyline(120, RANGE_FAR));
  });
});

describe("the horizon from the driver's seat", () => {
  const RIDGE = "#9fbcae";
  const RIDGE_SNOW = "#eef4fa";

  /**
   * The horizon line, driving at a given metre.
   *
   * @param at - where the motorhome stands, in metres
   * @param axis - 0 for where the summits are, 1 for how tall they are
   * @returns those coordinates, in the order they were drawn
   */
  function horizon(at: number, axis: 0 | 1 = 1): number[] {
    const base = seated();
    const { ctx, calls } = recordingContext();
    draw(ctx, { ...base, rv: { x: at, v: 0 } }, TWO_TREES, -1, -1);
    const found: number[] = [];
    let colour = "";
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "lineTo" && colour === RIDGE) {
        found.push(Number(call.args[axis]));
      }
    }
    return found;
  }

  it("has summits rather than one smooth line", () => {
    // A wave looks the same everywhere; summits are something to pick out.
    expect(new Set(horizon(0)).size).toBeGreaterThan(2);
  });

  it("carries snow, like the mountains seen from outside", () => {
    // Counting caps actually painted: the colour is set before the loop that
    // decides whether any summit is high enough, so setting it proves nothing.
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), TWO_TREES, -1, -1);
    let colour = "";
    let caps = 0;
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "fill" && colour === RIDGE_SNOW) {
        caps += 1;
      }
    }
    expect(caps).toBeGreaterThan(0);
  });

  it("goes past as the motorhome gets on", () => {
    // Driving with nothing moving on the horizon is driving on a treadmill.
    // Measured across, not up: the same summits keep the same heights as they
    // drift by, and it is the drifting that says you are getting somewhere.
    expect(horizon(60, 0)).not.toEqual(horizon(0, 0));
  });
});

describe("the remote and the spray in the hands", () => {
  const LAMP_ON = "#ff5a3c";
  const LAMP_OFF = "#5a4038";
  const MIST = "#ffffffb0";

  /** The side view of somebody holding a thing, with the world as given. */
  function inHand(
    kind: "remote" | "spray",
    world: Partial<GameState> = {},
  ): readonly Call[] {
    const base = standing();
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      {
        ...base,
        ...world,
        people: [{ ...base.people[0], carrying: [kind], holding: kind }],
      },
      TWO_TREES,
      -1,
      -1,
    );
    return calls;
  }

  it("lights the remote only while the winch is actually running", () => {
    // The rope moves over there and the hand does nothing visible, so without
    // the lamp a player holding the key cannot tell whether it is working.
    expect(usedColour(inHand("remote", { winch: 0, time: 0 }), LAMP_ON)).toBe(
      false,
    );
    expect(usedColour(inHand("remote", { winch: 1, time: 0.1 }), LAMP_ON)).toBe(
      true,
    );
  });

  it("blinks rather than glowing steadily", () => {
    // Two instants of one second: on at the first, dark at the second.
    expect(usedColour(inHand("remote", { winch: 1, time: 0.1 }), LAMP_ON)).toBe(
      true,
    );
    expect(usedColour(inHand("remote", { winch: 1, time: 0.2 }), LAMP_ON)).toBe(
      false,
    );
    expect(
      usedColour(inHand("remote", { winch: 1, time: 0.2 }), LAMP_OFF),
    ).toBe(true);
  });

  it("throws mist only while the can is going off at a bear", () => {
    const idle = { at: 40, hold: 0, sprayed: 0, gone: false };
    expect(usedColour(inHand("spray", { bear: idle }), MIST)).toBe(false);
    expect(
      usedColour(inHand("spray", { bear: { ...idle, sprayed: 1 } }), MIST),
    ).toBe(true);
  });

  it("throws no mist where there is no bear at all", () => {
    expect(usedColour(inHand("spray", { bear: null }), MIST)).toBe(false);
  });
});

describe("driving in the fog", () => {
  const FOG = "#d8dee3";

  /** A route whose far half is closed in. */
  const FOGGY: Route = {
    ...TWO_TREES,
    fog: { from: ROUTE_STEP * 4, to: ROUTE_STEP * 40 },
  };

  /** The side view from a given metre, on a route with or without fog. */
  function outside(at: number, route: Route): readonly Call[] {
    const base = standing();
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      { ...base, rv: { x: at, v: 0 }, people: [{ ...base.people[0], at }] },
      route,
      -1,
      -1,
    );
    return calls;
  }

  it("closes in only once you are inside it", () => {
    expect(usedColour(outside(0, FOGGY), FOG)).toBe(false);
    expect(usedColour(outside(ROUTE_STEP * 6, FOGGY), FOG)).toBe(true);
  });

  it("leaves a route without fog alone", () => {
    expect(usedColour(outside(ROUTE_STEP * 6, TWO_TREES), FOG)).toBe(false);
  });

  it("thickens with distance rather than dimming everything alike", () => {
    // One flat wash would darken the picture without hiding the hill ahead,
    // and the hill is exactly what has to go.
    const shades = outside(ROUTE_STEP * 6, FOGGY)
      .filter((call) => call.name === "set:globalAlpha")
      .map((call) => Number(call.args[0]))
      .filter((alpha) => alpha > 0 && alpha < 1);
    expect(new Set(shades).size).toBeGreaterThan(3);
  });

  it("closes the windscreen in too, but leaves the instruments readable", () => {
    const base = seated();
    const { ctx, calls } = recordingContext();
    draw(ctx, { ...base, rv: { x: ROUTE_STEP * 6, v: 10 } }, FOGGY, -1, -1);
    expect(usedColour(calls, FOG)).toBe(true);
    // The dial is drawn after the fog, so the needle still says what it says.
    const fogAt = calls.findIndex((call) => call.args[0] === FOG);
    const dialAt = calls.findIndex((call) => call.args[0] === "#e8e2d6");
    expect(dialAt).toBeGreaterThan(fogAt);
  });
});

describe("the figure in the fog", () => {
  /** How wide the canvas is. */
  const CANVAS_WIDE = 960;

  /** Where the player is put on screen, and how many pixels a metre is. */
  const DRIVER_X = 250;
  const SCALE = 13;

  /** How tall a grown person is, in metres. */
  const PERSON_TALL = 1.8;

  /** Part of the way through the count, well past his first showing. */
  const PART_WAY = 0.7;

  /** How solid he is by then: half of the way from his first showing to full. */
  const HALF_SHOWN = 0.5;

  /** The black he is painted in, head and all. */
  const SLENDER = "#1b1d20";

  /** The grey he steps out of. */
  const FOG = "#d8dee3";

  /** Flat road, closed in from the very first metre. */
  const FOGGY: Route = {
    ...TWO_TREES,
    anchors: [],
    fog: { from: 0, to: ROUTE_STEP * 100 },
    bridges: [],
    chasms: [],
    fellTree: null,
  };

  /** Standing beside the motorhome, having stood there this long. */
  function stood(seconds: number): GameState {
    return { ...standing(), still: seconds };
  }

  /** How often the canvas was filled while a colour was in force. */
  function fillsIn(calls: readonly Call[], colour: string): number {
    let now = "";
    let fills = 0;
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        now = String(call.args[0]);
      }
      if (
        (call.name === "fill" || call.name === "fillRect") &&
        now === colour
      ) {
        fills++;
      }
    }
    return fills;
  }

  /**
   * How see-through he was painted.
   *
   * @param calls - what the canvas was asked to do
   * @returns the transparency in force when his body was filled
   * @remarks
   * The last one set **before** his colour, not the largest of them all: the
   * fog sets a transparency for every band it paints, and measuring one of
   * those would pass whatever he was drawn like.
   */
  function shownAt(calls: readonly Call[]): number {
    let alpha = 1;
    for (const call of calls) {
      if (call.name === "set:globalAlpha") {
        alpha = Number(call.args[0]);
      }
      if (call.name === "set:fillStyle" && call.args[0] === SLENDER) {
        return alpha;
      }
    }
    return Number.NaN;
  }

  it("stays away while nobody has stood about", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, stood(0), FOGGY, -1, -1);
    expect(fillsIn(calls, SLENDER)).toBe(0);
    // The fog itself is there from the first metre, so this proves he is
    // missing and not merely that nothing was drawn at all.
    expect(fillsIn(calls, FOG)).toBeGreaterThan(0);
  });

  it("is there once the count has run up", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, stood(STILL_SECONDS), FOGGY, -1, -1);
    // Body, both of those arms, and the head on top of them.
    expect(fillsIn(calls, SLENDER)).toBe(4);
  });

  it("thickens as the seconds run out", () => {
    const half = recordingContext();
    draw(half.ctx, stood(STILL_SECONDS * PART_WAY), FOGGY, -1, -1);
    const full = recordingContext();
    draw(full.ctx, stood(STILL_SECONDS), FOGGY, -1, -1);
    const faint = shownAt(half.calls);
    const solid = shownAt(full.calls);
    // He starts out of nothing at four seconds' worth of standing and is all
    // there at five, so seven tenths of the way through he is half there.
    expect(faint).toBeCloseTo(HALF_SHOWN);
    expect(solid).toBeGreaterThan(faint);
    // All there at the last second: by then he is the whole warning.
    expect(solid).toBe(1);
  });

  it("stands in front of the fog, not behind it", () => {
    // Painted first he would be a shape nobody ever saw.
    const { ctx, calls } = recordingContext();
    draw(ctx, stood(STILL_SECONDS), FOGGY, -1, -1);
    const lastFog = calls.findLastIndex((call) => call.args[0] === FOG);
    const him = calls.findIndex((call) => call.args[0] === SLENDER);
    expect(lastFog).toBeGreaterThan(0);
    expect(him).toBeGreaterThan(lastFog);
  });

  it("stands ahead of the player and towers over one", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, stood(STILL_SECONDS), FOGGY, -1, -1);
    const at = calls
      .filter((call) => call.name === "translate")
      .map((call) => Number(call.args[0]));
    // Down the road, past where the player stands - never behind them, and
    // never so far off that he is out of the picture altogether.
    expect(Math.max(...at)).toBeGreaterThan(DRIVER_X);
    expect(Math.max(...at)).toBeLessThan(CANVAS_WIDE);

    let colour = "";
    const tall: number[] = [];
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "roundRect" && colour === SLENDER) {
        tall.push(Number(call.args[3]));
      }
    }
    // Taller than any person on the road: that is what gives him away.
    expect(Math.max(...tall)).toBeGreaterThan(PERSON_TALL * SCALE);
  });

  it("keeps out of a clear section however long you stand there", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, stood(STILL_SECONDS), TWO_TREES, -1, -1);
    expect(fillsIn(calls, SLENDER)).toBe(0);
  });
});

describe("how the cab is laid out", () => {
  /** The canvas the game draws on. */
  const WIDE = 960;
  const HIGH = 420;

  /** The dark of the instrument rim - and of the gear plate beside it. */
  const INSTRUMENT = "#141210";

  /** The dark the scale marks are drawn in. */
  const TICK = "#3a342e";

  /** How far the scale keeps off the ends, as a share of the arch's height. */
  const SCALE_GAP = 0.2;

  /** How much of the arch the scale still covers, all the same. */
  const SCALE_SPAN = 0.85;

  /** An ellipse the renderer drew: where, how big, and how far round. */
  type Ring = {
    readonly x: number;
    readonly y: number;
    readonly rx: number;
    readonly ry: number;
    readonly from: number;
    readonly to: number;
  };

  /** Every ellipse drawn, in the order they were drawn. */
  function rings(calls: readonly Call[]): Ring[] {
    return calls
      .filter((call) => call.name === "ellipse")
      .map((call) => ({
        x: Number(call.args[0]),
        y: Number(call.args[1]),
        rx: Number(call.args[2]),
        ry: Number(call.args[3]),
        from: Number(call.args[5]),
        to: Number(call.args[6]),
      }));
  }

  /** What the cab drew this time. */
  function cab(): Ring[] {
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), TWO_TREES, -1, -1);
    return rings(calls);
  }

  /** The steering wheel: the one ring drawn all the way round. */
  function wheelOf(all: readonly Ring[]): Ring {
    const found = all.find((ring) => ring.to - ring.from >= Math.PI * 2);
    expect(found).toBeDefined();
    return found as Ring;
  }

  /** The speedometer: the widest of the half-turn arches. */
  function dialOf(all: readonly Ring[]): Ring {
    const arches = all.filter((ring) => ring.to - ring.from < Math.PI * 2);
    expect(arches.length).toBeGreaterThan(0);
    return arches.reduce((big, ring) => (ring.rx > big.rx ? ring : big));
  }

  /** How far a point lies inside a ring: under 1 is inside, over 1 outside. */
  function within(ring: Ring, x: number, y: number): number {
    return ((x - ring.x) / ring.rx) ** 2 + ((y - ring.y) / ring.ry) ** 2;
  }

  it("draws the speedometer as an arch, not as a clock", () => {
    const dial = dialOf(cab());
    // Half a turn, over the top - a rainbow rather than a full circle.
    expect(dial.from).toBeCloseTo(Math.PI);
    expect(dial.to).toBeCloseTo(Math.PI * 2);
    // And wide for its height, or it would be a clock with its bottom cut off.
    expect(dial.rx).toBeGreaterThan(dial.ry * 2);
  });

  it("leaves room at both ends before the scale starts", () => {
    // The 0 and the 60 used to sit on the very corners of the arch, where
    // there is no face left above them and a number reads as pushed off the
    // edge. The scale is held back from both ends now.
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), TWO_TREES, -1, -1);
    const dial = dialOf(rings(calls));

    let colour = "";
    const ticks: { readonly x: number; readonly y: number }[] = [];
    for (const call of calls) {
      if (call.name === "set:strokeStyle") {
        colour = String(call.args[0]);
      }
      if (
        (call.name === "moveTo" || call.name === "lineTo") &&
        colour === TICK
      ) {
        ticks.push({ x: Number(call.args[0]), y: Number(call.args[1]) });
      }
    }
    expect(ticks.length).toBeGreaterThan(0);

    // Every mark stands above the line the arch springs from, first and last
    // included - that gap is the room being asked for.
    const lowest = Math.max(...ticks.map((tick) => tick.y));
    expect(dial.y - lowest).toBeGreaterThan(dial.ry * SCALE_GAP);
    // But the scale still uses most of the arch, or the room would have been
    // bought by shrinking the instrument to a stub.
    const spread =
      Math.max(...ticks.map((t) => t.x)) - Math.min(...ticks.map((t) => t.x));
    expect(spread).toBeGreaterThan(dial.rx * 2 * SCALE_SPAN);
  });

  it("puts the wheel round the speedometer", () => {
    const all = cab();
    const wheel = wheelOf(all);
    const dial = dialOf(all);
    expect(wheel.rx).toBeGreaterThan(dial.rx);
    // Both upper corners of the arch stand inside the rim, which is what
    // "the wheel goes round the dial" means when you have to check it.
    expect(within(wheel, dial.x - dial.rx, dial.y - dial.ry)).toBeLessThan(1);
    expect(within(wheel, dial.x + dial.rx, dial.y - dial.ry)).toBeLessThan(1);
    // Its hub is off the bottom of the picture, the way a wheel looks from
    // behind it.
    expect(wheel.y).toBeGreaterThan(HIGH);
  });

  it("keeps the whole arch on the canvas", () => {
    const dial = dialOf(cab());
    expect(dial.y).toBeLessThan(HIGH);
    expect(dial.x - dial.rx).toBeGreaterThan(0);
    expect(dial.x + dial.rx).toBeLessThan(WIDE);
    expect(dial.y - dial.ry).toBeGreaterThan(0);
  });

  it("puts the gear lever out to the right, clear of the dial", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), TWO_TREES, -1, -1);
    const dial = dialOf(rings(calls));

    let colour = "";
    const plates: { readonly left: number; readonly right: number }[] = [];
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "roundRect" && colour === INSTRUMENT) {
        plates.push({
          left: Number(call.args[0]),
          right: Number(call.args[0]) + Number(call.args[2]),
        });
      }
    }
    expect(plates.length).toBe(1);
    // Right of the middle, and past the dial: reaching for the lever must not
    // mean reaching across the speedometer.
    expect(plates[0].left).toBeGreaterThan(dial.x + dial.rx);
    expect(plates[0].right).toBeLessThan(WIDE);
  });

  it("gives the passenger neither of them", () => {
    // Sitting in the other seat, not standing in the road: the passenger sees
    // the same windscreen and no instruments at all.
    const beside = seated();
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      { ...beside, people: [beside.people[0], beside.people[0]] },
      TWO_TREES,
      -1,
      -1,
      1,
    );
    expect(usedColour(calls, INSTRUMENT)).toBe(false);
    expect(
      rings(calls).some((ring) => ring.to - ring.from >= Math.PI * 2),
    ).toBe(false);
  });
});

describe("the figure in the fog, seen from the cab", () => {
  /** The black he is painted in, and the grey he steps out of. */
  const SLENDER = "#1b1d20";
  const FOG = "#d8dee3";

  /** Flat road, closed in from the very first metre. */
  const FOGGY: Route = {
    ...TWO_TREES,
    anchors: [],
    fog: { from: 0, to: ROUTE_STEP * 100 },
    bridges: [],
    chasms: [],
    fellTree: null,
  };

  /**
   * How tall he may come out on the windscreen, in pixels.
   *
   * @remarks
   * Both ends matter. Too far off and he is a smudge; close enough to loom
   * over the bonnet and he is a portrait rather than a figure down the road,
   * which is a jump scare and not the slow warning this is meant to be.
   */
  const CAB_LEAST_TALL = 45;
  const CAB_MOST_TALL = 150;

  /** Behind the wheel, having stood still this long. */
  function waited(seconds: number): GameState {
    return { ...seated(), still: seconds };
  }

  /** How often the canvas was filled while a colour was in force. */
  function fills(calls: readonly Call[], colour: string): number {
    let now = "";
    let count = 0;
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        now = String(call.args[0]);
      }
      if (
        (call.name === "fill" || call.name === "fillRect") &&
        now === colour
      ) {
        count++;
      }
    }
    return count;
  }

  /** Where a colour was first set, or -1. */
  function firstAt(calls: readonly Call[], colour: string): number {
    return calls.findIndex((call) => call.args[0] === colour);
  }

  /** What the cab drew with the count standing at that many seconds. */
  function cab(seconds: number, route: Route = FOGGY) {
    const { ctx, calls } = recordingContext();
    draw(ctx, waited(seconds), route, -1, -1);
    return calls;
  }

  it("shows him through the windscreen too", () => {
    // Sitting in the vehicle is no way out of the rule, so it must be no way
    // out of the warning: body, both arms and the head, the same as outside.
    expect(fills(cab(STILL_SECONDS), SLENDER)).toBe(4);
  });

  it("leaves the road empty while nobody has stood about", () => {
    expect(fills(cab(0), SLENDER)).toBe(0);
  });

  it("stands near enough to be made out", () => {
    // Projected down the road he shrinks with the distance, and a figure put
    // far enough off is a smudge nobody reads as a figure at all.
    let colour = "";
    const tall: number[] = [];
    for (const call of cab(STILL_SECONDS)) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "fillRect" && colour === SLENDER) {
        tall.push(Number(call.args[3]));
      }
    }
    expect(Math.max(...tall)).toBeGreaterThan(CAB_LEAST_TALL);
    // And not so near that he looms over the bonnet.
    expect(Math.max(...tall)).toBeLessThan(CAB_MOST_TALL);
  });

  it("keeps him out of a section that has no fog", () => {
    expect(fills(cab(STILL_SECONDS, TWO_TREES), SLENDER)).toBe(0);
  });

  it("puts him in front of the fog and behind the dashboard", () => {
    const calls = cab(STILL_SECONDS);
    const him = firstAt(calls, SLENDER);
    expect(him).toBeGreaterThan(firstAt(calls, FOG));
    // The instruments stay on top of him: a figure painted over the
    // speedometer would take away the one thing still worth reading.
    expect(firstAt(calls, DASHBOARD)).toBeGreaterThan(him);
  });

  it("thickens with the count here as well", () => {
    let alpha = 1;
    for (const call of cab(STILL_SECONDS * 0.7)) {
      if (call.name === "set:globalAlpha") {
        alpha = Number(call.args[0]);
      }
      if (call.name === "set:fillStyle" && call.args[0] === SLENDER) {
        break;
      }
    }
    expect(alpha).toBeCloseTo(0.5);
  });
});

describe("a jumping figure", () => {
  /** The pale of the driver's face, drawn once per person. */
  const SKIN = "#f0c9a4";

  /** How many pixels a metre is worth in the side view, and how tall it is. */
  const PER_METRE = 13;
  const CANVAS_HIGH = 420;

  /** Standing beside the motorhome, this far off the ground. */
  function upBy(lift: number): GameState {
    const state = standing();
    return { ...state, people: [{ ...state.people[0], lift }] };
  }

  /**
   * How far down the canvas the figure was drawn.
   *
   * @param state - the world to draw
   * @returns the y of the frame the figure is painted in
   * @remarks
   * The whole figure goes into one translated frame, so the frame is what
   * moves - the last translate before the face colour is set.
   */
  function faceY(state: GameState): number {
    const { ctx, calls } = recordingContext();
    draw(ctx, state, TWO_TREES, -1, -1);
    // Follows save and restore as the canvas does: every part of the picture
    // paints inside its own frame, and only the figure's own moves count.
    const stack: number[] = [];
    let now = 0;
    for (const call of calls) {
      if (call.name === "save") {
        stack.push(now);
      }
      if (call.name === "restore") {
        now = stack.pop() ?? 0;
      }
      if (call.name === "translate") {
        now += Number(call.args[1]);
      }
      if (call.name === "set:fillStyle" && call.args[0] === SKIN) {
        return now;
      }
    }
    return Number.NaN;
  }

  it("stands on the middle of the frame", () => {
    // The drive belongs in the middle of the picture. It used to run a third
    // of the way down, which left it up in the top corner with a great deal
    // of empty hillside underneath.
    expect(faceY(upBy(0))).toBeCloseTo(CANVAS_HIGH / 2, 0);
  });

  it("is drawn higher up the more it is off the ground", () => {
    const down = faceY(upBy(0));
    const up = faceY(upBy(1));
    expect(down).toBeGreaterThan(0);
    // Up the screen is a smaller y, and a metre is worth the same here as it
    // is anywhere else in the picture.
    expect(down - up).toBeCloseTo(PER_METRE, 0);
  });

  it("keeps its legs still while it is in the air", () => {
    // A figure pedalling along a metre above the road reads as a mistake.
    const walking = { ...standing() };
    const strides = (state: GameState) => {
      const { ctx, calls } = recordingContext();
      draw(ctx, state, TWO_TREES, -1, -1);
      return calls.filter((call) => call.name === "rotate").length;
    };
    const onFoot = {
      ...walking,
      people: [{ ...walking.people[0], walking: true, stride: 1 }],
    };
    const inAir = {
      ...onFoot,
      people: [{ ...onFoot.people[0], lift: 1 }],
    };
    expect(strides(inAir)).toBeLessThanOrEqual(strides(onFoot));
  });
});

describe("the bridge", () => {
  /** The timber, the gap under it, and the red edge of its sign. */
  const DECK = "#8a6d4b";
  const GORGE = "#20262d";
  const RAIL = "#7d6142";
  const SIGN_EDGE = "#c0392b";

  /** Flat road with a stretch of bridge just ahead of the motorhome. */
  const CROSSING: Route = {
    ...TWO_TREES,
    anchors: [],
    bridges: [{ from: ROUTE_STEP * 3, to: ROUTE_STEP * 6 }],
    chasms: [],
    fellTree: null,
  };

  /** Beside the motorhome, a little before the timber. */
  function approaching(): GameState {
    return standing();
  }

  /** Behind the wheel, a little before the timber. */
  function driving(): GameState {
    return seated();
  }

  /** What the side view drew. */
  function fromTheSide(route: Route = CROSSING): Call[] {
    const { ctx, calls } = recordingContext();
    draw(ctx, approaching(), route, -1, -1);
    return calls;
  }

  /**
   * Where a colour was first named, wherever in the call it stood.
   *
   * @param calls - what the canvas was asked to do
   * @param colour - the colour to look for
   * @returns the index of the first call naming it, or -1
   * @remarks
   * Not only as a fill style: the gorge is a gradient, and a gradient names
   * its colours as arguments to `addColorStop` instead.
   */
  function firstNamed(calls: readonly Call[], colour: string): number {
    return calls.findIndex((call) => call.args.includes(colour));
  }

  it("paints the timber and the gap under it", () => {
    const calls = fromTheSide();
    expect(usedColour(calls, DECK)).toBe(true);
    expect(firstNamed(calls, GORGE)).toBeGreaterThan(0);
  });

  it("paints the gap first, so the deck lies over it", () => {
    const calls = fromTheSide();
    const gap = firstNamed(calls, GORGE);
    const deck = firstNamed(calls, DECK);
    expect(gap).toBeGreaterThan(0);
    expect(deck).toBeGreaterThan(gap);
  });

  it("stands its sign before it", () => {
    expect(usedColour(fromTheSide(), SIGN_EDGE)).toBe(true);
  });

  it("draws none of it on a road that has no bridge", () => {
    const calls = fromTheSide(TWO_TREES);
    expect(usedColour(calls, DECK)).toBe(false);
    expect(firstNamed(calls, GORGE)).toBe(-1);
    expect(usedColour(calls, SIGN_EDGE)).toBe(false);
  });

  it("shows its rails and its sign from the seat as well", () => {
    // The deck needs no drawing there - it is the road. What says "bridge"
    // through a windscreen is the rail running away on both sides.
    const { ctx, calls } = recordingContext();
    draw(ctx, driving(), CROSSING, -1, -1);
    expect(usedColour(calls, RAIL)).toBe(true);
    expect(usedColour(calls, SIGN_EDGE)).toBe(true);
  });

  it("leaves the driver's view clear where there is no bridge", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, driving(), TWO_TREES, -1, -1);
    expect(usedColour(calls, RAIL)).toBe(false);
    expect(usedColour(calls, SIGN_EDGE)).toBe(false);
  });
});

describe("the chasm and the tree over it", () => {
  /** The dark of the gap, the trunk, and the ladder up the back door. */
  const GORGE = "#20262d";
  const TRUNK = "#6b4a2f";
  const LADDER = "#8d8578";
  const AXE_HEAD = "#b8bec4";

  /** Flat road with a gap in it and the tree past it. */
  const GAP: Route = {
    ...TWO_TREES,
    anchors: [],
    chasms: [{ from: ROUTE_STEP * 3, to: ROUTE_STEP * 3 + 4.6 }],
    fellTree: ROUTE_STEP * 4,
    items: [{ at: ROUTE_STEP * 4 + 8, kind: "axe" }],
  };

  /** Where a colour was first named, wherever in the call it stood. */
  function firstNamed(calls: readonly Call[], colour: string): number {
    return calls.findIndex((call) => call.args.includes(colour));
  }

  /** What the side view drew, with the tree standing or down. */
  function drawn(felled: boolean): Call[] {
    const { ctx, calls } = recordingContext();
    draw(ctx, { ...standing(), felled }, GAP, -1, -1);
    return calls;
  }

  it("paints the gap while it is still a gap", () => {
    expect(firstNamed(drawn(false), GORGE)).toBeGreaterThan(0);
  });

  it("keeps painting the gap once the tree is down", () => {
    // The hole does not go away, it gets a trunk over it. One that vanished
    // the moment it was bridged would leave the player wondering what they
    // had just driven across.
    expect(firstNamed(drawn(true), GORGE)).toBeGreaterThan(0);
  });

  it("lays the trunk right across the gap, onto both lips", () => {
    const calls = drawn(true);
    let colour = "";
    const logs: { readonly from: number; readonly to: number }[] = [];
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "roundRect" && colour === TRUNK) {
        logs.push({
          from: Number(call.args[0]),
          to: Number(call.args[0]) + Number(call.args[2]),
        });
      }
    }
    expect(logs.length).toBe(1);
    // Both ends stand on ground, not on air: the trunk starts before the near
    // lip and ends past the far one.
    const scale = 13;
    const near = logs[0].from;
    const far = logs[0].to;
    expect(far - near).toBeGreaterThan(
      (GAP.chasms[0].to - GAP.chasms[0].from) * scale,
    );
  });

  it("draws the tree either way, standing or lying", () => {
    expect(usedColour(drawn(false), TRUNK)).toBe(true);
    expect(usedColour(drawn(true), TRUNK)).toBe(true);
  });

  it("hangs a ladder on the back of the motorhome", () => {
    // The roof is the only way over the gap, and a roof with no visible way
    // up is a puzzle with a piece missing.
    expect(usedColour(drawn(false), LADDER)).toBe(true);
  });

  it("lays the axe out where it fell", () => {
    expect(usedColour(drawn(false), AXE_HEAD)).toBe(true);
  });

  it("puts the axe in the hand that carries it", () => {
    const state = standing();
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      {
        ...state,
        people: [{ ...state.people[0], carrying: ["axe"], holding: "axe" }],
      },
      TWO_TREES,
      -1,
      -1,
    );
    expect(usedColour(calls, AXE_HEAD)).toBe(true);
  });
});

describe("the ground under the driver's view", () => {
  /** The canvas, and where the horizon sits on it. */
  const WIDE = 960;
  const HIGH = 420;
  const HORIZON = HIGH * 0.44;

  /** Every rectangle the canvas was asked to fill, with the colour in force. */
  function rects(calls: readonly Call[]) {
    let colour = "";
    const found: {
      readonly colour: string;
      readonly x: number;
      readonly y: number;
      readonly wide: number;
      readonly high: number;
      readonly at: number;
    }[] = [];
    calls.forEach((call, at) => {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "fillRect") {
        found.push({
          colour,
          x: Number(call.args[0]),
          y: Number(call.args[1]),
          wide: Number(call.args[2]),
          high: Number(call.args[3]),
          at,
        });
      }
    });
    return found;
  }

  it("fills everything below the horizon before drawing the road on it", () => {
    // The bug this is here for: the road is a row of bands, and over a crest
    // the nearest band starts below the horizon. Everything above it was sky
    // - a pale gap in the middle of the picture that reads as seeing straight
    // through the world.
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), TWO_TREES, -1, -1);
    const wash = rects(calls).find(
      (rect) =>
        rect.x === 0 &&
        rect.wide === WIDE &&
        Math.abs(rect.y - HORIZON) < 1 &&
        Math.abs(rect.y + rect.high - HIGH) < 1,
    );
    expect(wash).toBeDefined();

    // Before the road: it is what the road is painted **on**.
    const firstBand = calls.findIndex((call) => call.name === "moveTo");
    expect(firstBand).toBeGreaterThan(wash?.at ?? 0);

    // And after the sky, which covers the whole canvas: painted the other way
    // round the sky would simply wipe the ground off again.
    const sky = rects(calls).find(
      (rect) => rect.x === 0 && rect.y === 0 && rect.high === HIGH,
    );
    expect(sky).toBeDefined();
    expect(wash?.at ?? 0).toBeGreaterThan(sky?.at ?? 0);
  });

  it("paints that ground in earth rather than sky", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), TWO_TREES, -1, -1);
    const wash = rects(calls).find(
      (rect) => rect.x === 0 && rect.wide === WIDE && rect.y > 1,
    );
    // Green, not the near-white of the sky low down: more green than blue.
    const green = Number.parseInt((wash?.colour ?? "#000000").slice(3, 5), 16);
    const blue = Number.parseInt((wash?.colour ?? "#000000").slice(5, 7), 16);
    expect(green).toBeGreaterThan(blue);
  });
});

describe("the things in the road, seen from the seat", () => {
  /** The colours each one is built from. */
  const CAN = "#c4562a";
  const TYRE = "#2b2b2b";
  const RIM = "#e8dcc2";
  const SPRAY_CAP = "#f0f0f0";
  const HEAD = "#5a5f66";

  /** A road with one thing lying on it, a little way ahead. */
  function withThing(kind: ItemKind): Route {
    return { ...TWO_TREES, anchors: [], items: [{ at: ROUTE_STEP * 3, kind }] };
  }

  /** What the driver's view drew for it. */
  function fromTheSeat(kind: ItemKind): Call[] {
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), withThing(kind), -1, -1);
    return calls;
  }

  /** How many rectangles were filled while a colour was in force. */
  function boxes(calls: readonly Call[], colour: string): number {
    let now = "";
    let count = 0;
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        now = String(call.args[0]);
      }
      if (call.name === "fillRect" && now === colour) {
        count++;
      }
    }
    return count;
  }

  it("draws the jerrycan as a can and not as a ball", () => {
    // The bug this is here for: every thing was a coloured circle, and the
    // can - having no colour of its own in this view - was a black one.
    const calls = fromTheSeat("can");
    expect(boxes(calls, CAN)).toBeGreaterThan(1);
    expect(usedColour(calls, CAN)).toBe(true);
  });

  it("gives the tyres two wheels, each with a hole in the middle", () => {
    // Two filled discs were two black blobs. What makes a wheel read as a
    // wheel at any size is the rim showing through the middle of it.
    let colour = "";
    const rings: { readonly paint: string; readonly wide: number }[] = [];
    for (const call of fromTheSeat("tyres")) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "arc") {
        rings.push({ paint: colour, wide: Number(call.args[2]) });
      }
    }
    const tyres = rings.filter((ring) => ring.paint === TYRE);
    const rims = rings.filter((ring) => ring.paint === RIM);
    expect(tyres.length).toBe(2);
    expect(rims.length).toBe(2);
    // And the rim is inside the tyre, not beside it.
    expect(Math.max(...rims.map((r) => r.wide))).toBeLessThan(
      Math.min(...tyres.map((t) => t.wide)),
    );
  });

  it("caps the spray and heads the hammer and the axe", () => {
    expect(usedColour(fromTheSeat("spray"), SPRAY_CAP)).toBe(true);
    expect(usedColour(fromTheSeat("hammer"), HEAD)).toBe(true);
    expect(usedColour(fromTheSeat("axe"), HEAD)).toBe(true);
  });

  it("tells them apart from one another", () => {
    // The point of the whole thing: two different things must not paint the
    // same picture.
    const can = fromTheSeat("can").filter((call) => call.name === "fillRect");
    const spray = fromTheSeat("spray").filter(
      (call) => call.name === "fillRect",
    );
    expect(can.length).not.toBe(spray.length);
  });
});
